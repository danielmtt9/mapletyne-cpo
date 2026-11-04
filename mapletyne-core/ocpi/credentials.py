"""
OCPI 2.2.1 Credentials module — partner registration + token exchange.
"""
import logging
import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Depends

from ocpi.main import ocpi_response, ocpi_error, verify_ocpi_token
from state.postgres import db

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_ocpi_identity() -> dict:
    """Return OCPI identity from settings DB, falling back to env vars."""
    try:
        from state.settings import get_setting
        s = await get_setting("ocpi")
    except Exception:
        s = {}
    return {
        "country_code":  s.get("country_code")  or os.getenv("OCPI_COUNTRY_CODE", "NL"),
        "party_id":      s.get("party_id")       or os.getenv("OCPI_PARTY_ID", "OCP"),
        "role":          s.get("role")            or "CPO",
        "operator_name": s.get("operator_name")  or os.getenv("OCPI_OPERATOR_NAME", "OpenCPO"),
        "base_url":      s.get("base_url")        or os.getenv("OCPI_BASE_URL", "http://localhost:8000"),
    }


async def _cpo_role_info() -> dict:
    """Build our CPO role information from settings (with env-var fallback)."""
    identity = await _get_ocpi_identity()
    return {
        "role": identity["role"],
        "business_details": {
            "name":    identity["operator_name"],
            "website": os.getenv("OCPI_OPERATOR_WEBSITE", ""),
        },
        "party_id":     identity["party_id"],
        "country_code": identity["country_code"],
    }


@router.get("")
async def get_credentials(token: str = Depends(verify_ocpi_token)):
    """Return our credentials to the partner."""
    identity = await _get_ocpi_identity()
    return ocpi_response({
        "token": token,
        "url": f"{identity['base_url']}/ocpi/versions",
        "roles": [await _cpo_role_info()],
    })


@router.post("")
async def post_credentials(request: Request):
    """
    Partner sends their credentials — we register them and return ours.
    This is the OCPI handshake.
    Per OCPI 2.2.1, the partner must authenticate using the registration
    token (Token A) provisioned by the CPO in the Authorization header.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Token "):
        return ocpi_error(2001, "Missing or invalid Authorization header with registration token")

    reg_token = auth[6:].strip()

    async with db.read() as conn:
        partner = await conn.fetchrow(
            "SELECT id, party_id, country_code, role, status FROM ocpp.ocpi_partners WHERE token_a = $1",
            reg_token,
        )

    if not partner:
        return ocpi_error(2001, "Invalid registration token")

    body = await request.json()

    partner_token = body.get("token", "")
    partner_url = body.get("url", "")
    roles = body.get("roles", [])

    if not partner_token or not partner_url or not roles:
        return ocpi_error(2001, "Missing required fields: token, url, roles")

    role = roles[0]
    party_id = role.get("party_id", "") or partner["party_id"]
    country_code = role.get("country_code", "") or partner["country_code"]
    partner_role = role.get("role", "EMSP") or partner["role"]
    name = role.get("business_details", {}).get("name", "Unknown")

    # Generate our active token for them (Token C)
    our_token = secrets.token_urlsafe(32)

    async with db.write() as conn:
        await conn.execute("""
            UPDATE ocpp.ocpi_partners SET
                name = $1, url = $2, token_a = $3, token_b = $4, status = 'active', last_sync = NOW()
            WHERE id = $5
        """, name, partner_url, our_token, partner_token, partner["id"])

    logger.info(f"OCPI credentials exchanged: {country_code}*{party_id} ({name}) role={partner_role}")

    identity = await _get_ocpi_identity()
    return ocpi_response({
        "token": our_token,
        "url": f"{identity['base_url']}/ocpi/versions",
        "roles": [await _cpo_role_info()],
    })


@router.put("")
async def put_credentials(request: Request, token: str = Depends(verify_ocpi_token)):
    """Update partner credentials (re-registration)."""
    body = await request.json()
    roles = body.get("roles", [{}])
    role = roles[0]

    new_token = body.get("token", "")
    new_url = body.get("url", "")

    async with db.write() as conn:
        await conn.execute("""
            UPDATE ocpp.ocpi_partners SET
                token_b = $1, url = $2, last_sync = NOW()
            WHERE token_a = $3
        """, new_token, new_url, token)

    identity = await _get_ocpi_identity()
    return ocpi_response({
        "token": token,
        "url": f"{identity['base_url']}/ocpi/versions",
        "roles": [await _cpo_role_info()],
    })


@router.delete("")
async def delete_credentials(token: str = Depends(verify_ocpi_token)):
    """Partner unregisters."""
    async with db.write() as conn:
        await conn.execute(
            "UPDATE ocpp.ocpi_partners SET status = 'suspended' WHERE token_a = $1", token
        )
    logger.info("OCPI partner unregistered")
    return ocpi_response()



