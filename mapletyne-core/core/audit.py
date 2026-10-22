"""
Security Audit Logging Module (GAP-SEC-17)

Provides structured JSON audit logging for security events:
- Authentication attempts (success / failure)
- Granular RBAC authorization checks and denials
- Hardware charger remote control commands (RemoteStart, Stop, Reset, Unlock)
- Tenant isolation and RLS checks
- Key rotation and CA certificate operations

Events are logged via structured JSON to standard logging, appended to Redis stream
'mtt:audit:events', and persisted to PostgreSQL 'ocpp.security_events'.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("security_audit")


def log_security_event(
    event_type: str,
    actor: str,
    role: str,
    tenant_id: str,
    client_ip: str,
    action: str,
    resource: str,
    status: str,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Log a structured security audit event synchronously to logging and schedule
    async emission to Redis / DB if event loop is running.
    """
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "security_audit",
        "audit_type": event_type,
        "actor": actor or "anonymous",
        "role": role or "unauthenticated",
        "tenant_id": tenant_id or "00000000-0000-0000-0000-000000000001",
        "client_ip": client_ip or "unknown",
        "action": action,
        "resource": resource,
        "status": status,
        "details": details or {},
    }

    json_str = json.dumps(payload, default=str)
    if status in ("failure", "denied", "error"):
        logger.warning(f"AUDIT_ALERT: {json_str}")
    else:
        logger.info(f"AUDIT_EVENT: {json_str}")

    # Dispatch to Redis asynchronously if running loop
    try:
        loop = asyncio.get_running_loop()
        if loop and loop.is_running():
            asyncio.create_task(_emit_to_redis_and_db(payload))
    except RuntimeError:
        pass

    return payload


async def _emit_to_redis_and_db(payload: Dict[str, Any]) -> None:
    """Async background task to record event to Redis and PostgreSQL."""
    # 1. Redis Stream emission
    try:
        from state.redis import redis_state
        if redis_state and redis_state._redis:
            # Flatten or serialize details for Redis stream
            stream_entry = {
                "timestamp": payload["timestamp"],
                "audit_type": payload["audit_type"],
                "actor": payload["actor"],
                "role": payload["role"],
                "tenant_id": payload["tenant_id"],
                "client_ip": payload["client_ip"],
                "action": payload["action"],
                "resource": payload["resource"],
                "status": payload["status"],
                "details": json.dumps(payload["details"], default=str),
            }
            await redis_state.client.xadd("mtt:audit:events", stream_entry, maxlen=10000)
    except Exception as e:
        logger.debug(f"Failed to publish audit event to Redis stream: {e}")

    # 2. PostgreSQL ocpp.security_events persistence
    try:
        from state.postgres import db
        if db and db._primary_pool:
            severity = "warning" if payload["status"] in ("failure", "denied") else "info"
            async with db.write() as conn:
                await conn.execute(
                    """
                    INSERT INTO ocpp.security_events (time, charge_point, event_type, severity, details, resolved)
                    VALUES ($1, $2, $3, $4, $5::jsonb, $6)
                    """,
                    datetime.fromisoformat(payload["timestamp"]),
                    payload["resource"] if payload["resource"].startswith("cp_") else None,
                    f"{payload['action']}:{payload['status']}",
                    severity,
                    json.dumps(payload, default=str),
                    False,
                )
    except Exception as e:
        logger.debug(f"Failed to persist audit event to PostgreSQL: {e}")
