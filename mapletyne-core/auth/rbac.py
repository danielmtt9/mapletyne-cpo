from core.ratelimit import get_verified_client_ip
"""
Granular Role-Based Access Control (RBAC) Module (GAP-SEC-09)

Enforces role-based permissions in accordance with OWASP ASVS v4.0.3 L2/L3 and
docs/security/APP_SECURITY.md (Section 2.2).

Role Hierarchy:
- cpo-admin / admin / superadmin: Full platform superuser rights across all sites and tenants.
- site-operator / operator: Physical charger monitoring, remote commands (Reset, Unlock, Start, Stop),
  charging session inspection, and EMS dispatching.
- billing-manager / billing: Tariff schedules, pricing models, CDR verification, and invoice ledgers.
- fleet-manager / fleet: Depot bay reservations, fleet schedules, vehicle telematics, and RFID token issuance.
"""
import hmac
import logging
import os
from typing import Callable, Set, Any, Dict
from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import APIKeyHeader

from state.postgres import current_tenant_id, current_user_role, current_user_id, DEFAULT_TENANT_ID

logger = logging.getLogger("rbac")

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
_api_key_bearer = APIKeyHeader(name="Authorization", auto_error=False)


def _get_management_api_key() -> str:
    return os.environ.get("MANAGEMENT_API_KEY", "")


def require_roles(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency factory enforcing granular RBAC roles.
    Accepts superadmin bypass with MANAGEMENT_API_KEY.
    Verifies JWT session tokens (RS256 from Keycloak or HS256 from local admin auth).
    Extracts and sets multi-tenant session ContextVars for PostgreSQL RLS.
    """
    role_set: Set[str] = set(allowed_roles)

    async def _guard(
        request: Request,
        x_api_key: str = Security(_api_key_header),
        authorization: str = Security(_api_key_bearer),
    ) -> Dict[str, Any]:
        mgmt_key = _get_management_api_key()

        # Extract provided credential
        provided = ""
        if x_api_key:
            provided = x_api_key.strip()
        elif authorization and authorization.lower().startswith("bearer "):
            provided = authorization[7:].strip()

        if not provided:
            raise HTTPException(
                status_code=401,
                detail="Missing authentication credentials. Provide X-API-Key or Authorization: Bearer <token>.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 1. System superadmin API key bypass
        if mgmt_key and hmac.compare_digest(provided, mgmt_key):
            current_tenant_id.set(DEFAULT_TENANT_ID)
            current_user_role.set("cpo-admin")
            current_user_id.set("system_api_key")
            return {
                "sub": "system_api_key",
                "role": "cpo-admin",
                "roles": ["cpo-admin", "admin"],
                "tenant_id": DEFAULT_TENANT_ID,
            }

        # 2. Authenticate and decode token
        payload = None
        # Try local HS256
        try:
            from api.admin_auth import verify_token
            payload = verify_token(provided)
        except Exception:
            pass

        # Try Keycloak RS256
        if not payload:
            try:
                from auth.keycloak_client import verify_keycloak_token
                payload = verify_keycloak_token(provided)
            except Exception:
                pass

        if not payload:
            logger.warning(
                f"RBAC auth failure: invalid token on {request.url.path} from={request.client.host if request.client else '?'}"
            )
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Extract roles
        user_roles = set(payload.get("roles", []))
        if payload.get("role"):
            user_roles.add(payload.get("role"))

        # Extract tenant context
        tenant = str(payload.get("tenant_id") or payload.get("tenant") or DEFAULT_TENANT_ID)
        user_id = str(payload.get("sub", ""))
        primary_role = payload.get("role") or (list(user_roles)[0] if user_roles else "driver")

        # Inject PostgreSQL RLS context variables
        current_tenant_id.set(tenant)
        current_user_role.set(primary_role)
        current_user_id.set(user_id)

        # Superadmin check
        if any(r in user_roles for r in ("cpo-admin", "admin", "superadmin")):
            return payload

        # Check intersection with allowed roles
        if user_roles.intersection(role_set):
            return payload

        # RBAC Check Failed
        client_ip = get_verified_client_ip(request)
        logger.warning(
            f"RBAC access denied: user '{user_id}' with roles {user_roles} "
            f"denied access to {request.url.path} (requires {role_set})"
        )

        try:
            from core.audit import log_security_event
            log_security_event(
                event_type="role_authorization_failure",
                actor=payload.get("email") or user_id,
                role=primary_role,
                tenant_id=tenant,
                client_ip=client_ip,
                action="rbac_access",
                resource=request.url.path,
                status="denied",
                details={"user_roles": list(user_roles), "required_roles": list(role_set)},
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: Insufficient role permissions. Required: {', '.join(sorted(role_set))}",
        )

    return _guard


# Pre-configured role guards matching APP_SECURITY.md
require_admin = require_roles("cpo-admin", "admin", "superadmin")
require_superadmin = require_roles("cpo-admin", "admin", "superadmin")
require_site_operator = require_roles("cpo-admin", "admin", "superadmin", "site-operator", "operator")
require_billing_manager = require_roles("cpo-admin", "admin", "superadmin", "billing-manager", "billing")
require_fleet_manager = require_roles("cpo-admin", "admin", "superadmin", "fleet-manager", "fleet")
