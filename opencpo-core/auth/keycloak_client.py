"""
Keycloak 26 OIDC, OAuth2 Resource Server & Admin API Client for OpenCPO Core.

Provides:
- Direct Access Grant login (/protocol/openid-connect/token)
- Token refresh flow
- PyJWKClient cached RS256 token verification
- Keycloak Admin REST API user creation & role assignment
- Role mapping and session context extraction
"""
import os
import logging
import httpx
import jwt
from jwt import PyJWKClient
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://keycloak:8080/auth").rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "opencpo")
KEYCLOAK_ADMIN = os.getenv("KEYCLOAK_ADMIN", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "admin")

REALM_URL = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
CERTS_URL = f"{REALM_URL}/protocol/openid-connect/certs"
TOKEN_URL = f"{REALM_URL}/protocol/openid-connect/token"
MASTER_TOKEN_URL = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
ADMIN_USERS_URL = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
ADMIN_ROLES_URL = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles"

_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(CERTS_URL, cache_keys=True, max_cached_keys=16, cache_jwk_set=True, lifespan=3600)
    return _jwks_client


async def get_admin_token() -> str:
    """Obtain master admin token for Keycloak Admin REST API."""
    data = {
        "grant_type": "password",
        "client_id": "admin-cli",
        "username": KEYCLOAK_ADMIN,
        "password": KEYCLOAK_ADMIN_PASSWORD,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(MASTER_TOKEN_URL, data=data)
        if resp.status_code != 200:
            raise ValueError(f"Failed to obtain Keycloak admin token (HTTP {resp.status_code})")
        return resp.json()["access_token"]


async def create_keycloak_user(
    email: str,
    password: str,
    name: str,
    role: str = "driver",
) -> str:
    """Create a user in Keycloak, set credentials, and assign realm role."""
    admin_token = await get_admin_token()
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json",
    }

    # Split name into first and last
    parts = name.strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""

    payload = {
        "username": email.strip().lower(),
        "email": email.strip().lower(),
        "firstName": first_name,
        "lastName": last_name,
        "enabled": True,
        "emailVerified": True,
        "credentials": [
            {
                "type": "password",
                "value": password,
                "temporary": False,
            }
        ],
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Create user
        resp = await client.post(ADMIN_USERS_URL, json=payload, headers=headers)
        if resp.status_code not in (201, 204):
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_msg = err_data.get("errorMessage") or f"Could not create user in Keycloak (HTTP {resp.status_code})"
            raise ValueError(err_msg)

        # 2. Extract user ID
        user_id = None
        loc = resp.headers.get("Location")
        if loc:
            user_id = loc.rstrip("/").split("/")[-1]
        
        if not user_id:
            query_resp = await client.get(f"{ADMIN_USERS_URL}?email={email.strip().lower()}", headers=headers)
            if query_resp.status_code == 200 and query_resp.json():
                user_id = query_resp.json()[0]["id"]

        if not user_id:
            raise ValueError("Created user in Keycloak but failed to resolve user ID")

        # 3. Resolve role and assign
        role_resp = await client.get(f"{ADMIN_ROLES_URL}/{role}", headers=headers)
        if role_resp.status_code == 200:
            role_obj = role_resp.json()
            assign_url = f"{ADMIN_USERS_URL}/{user_id}/role-mappings/realm"
            await client.post(assign_url, json=[role_obj], headers=headers)

        return user_id


async def authenticate_direct_grant(
    username: str,
    password: str,
    client_id: str = "opencpo-admin-ui",
    client_secret: Optional[str] = None,
) -> Dict[str, Any]:
    """Authenticate a user with Keycloak via Direct Access Grant."""
    data = {
        "grant_type": "password",
        "client_id": client_id,
        "username": username,
        "password": password,
    }
    if client_secret:
        data["client_secret"] = client_secret

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(TOKEN_URL, data=data)
        if resp.status_code != 200:
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_desc = err_data.get("error_description") or err_data.get("error") or f"Authentication failed (HTTP {resp.status_code})"
            raise ValueError(err_desc)
        return resp.json()


async def refresh_access_token(
    refresh_token: str,
    client_id: str = "opencpo-admin-ui",
    client_secret: Optional[str] = None,
) -> Dict[str, Any]:
    """Exchange a refresh token for a new access token."""
    data = {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "refresh_token": refresh_token,
    }
    if client_secret:
        data["client_secret"] = client_secret

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(TOKEN_URL, data=data)
        if resp.status_code != 200:
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_desc = err_data.get("error_description") or err_data.get("error") or "Failed to refresh token"
            raise ValueError(err_desc)
        return resp.json()


def verify_keycloak_token(token: str) -> Dict[str, Any]:
    """Verify an RS256 token against Keycloak JWKS and return claims."""
    try:
        client = get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False},
        )
        
        # Extract normalized roles
        realm_roles: List[str] = claims.get("realm_access", {}).get("roles", [])
        claims["roles"] = realm_roles
        
        # Determine highest role
        if "cpo-admin" in realm_roles or "admin" in realm_roles:
            claims["role"] = "admin"
        elif "site-operator" in realm_roles:
            claims["role"] = "operator"
        elif "billing-manager" in realm_roles:
            claims["role"] = "billing"
        elif "fleet-manager" in realm_roles:
            claims["role"] = "fleet"
        elif "driver" in realm_roles:
            claims["role"] = "driver"
        else:
            claims["role"] = "user"

        return claims
    except Exception as e:
        logger.debug(f"Keycloak RS256 token verification failed: {e}")
        raise ValueError(f"Invalid Keycloak token: {e}")
