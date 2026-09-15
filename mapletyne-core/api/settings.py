"""
Settings API — runtime configuration for SMS, SMTP, and OTP.

All endpoints require management auth (MANAGEMENT_API_KEY).
Secret fields (api_key, password, etc.) are masked to "****" in
GET responses. PUT merges: sending "****" for a secret field
preserves the existing value rather than overwriting it.

Endpoints:
    GET  /api/v1/settings              → all settings (secrets masked)
    GET  /api/v1/settings/{key}        → single setting (secrets masked)
    PUT  /api/v1/settings/{key}        → update setting
    POST /api/v1/settings/sms/test     → send test SMS
    POST /api/v1/settings/smtp/test    → send test email
"""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from state.settings import get_setting, get_all_settings, put_setting, mask_secrets, _SECRET_FIELDS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

# Valid setting keys and their defaults
_DEFAULTS: dict[str, dict] = {
    "organization": {
        "company_name":        "",
        "legal_entity":        "",
        "tax_vat_id":          "",
        "registration_number": "",
        "address_line1":       "",
        "address_line2":       "",
        "city":                "",
        "state_province":      "",
        "postal_code":         "",
        "country":             "",
        "invoicing_email":     "",
        "support_hotline":     "",
        "website_url":         "",
        "currency":            "GBP",
        "timezone":            "UTC",
    },
    "sms": {
        "provider":        "twilio",
        "account_sid":     "",
        "api_key":         "",
        "sender_id":       "CSMS",
        "workspace_id":    "",
        "channel_id":      "",
        "sender":          "",
        "otp_enabled":     True,
        "otp_code_length": 6,
        "otp_ttl_seconds": 300,
    },
    "smtp": {
        "host":          "",
        "port":          587,
        "user":          "",
        "password":      "",
        "from_address":  "",
        "from_name":     "Charge Station Management System",
        "tls":           True,
        "security_mode": "STARTTLS",
    },
    "otp": {
        "enabled":      True,
        "demo_mode":    False,
        "code_length":  6,
        "ttl_seconds":  300,
    },
    "ocpi": {
        "country_code":       "US",
        "party_id":           "CPO",
        "role":               "CPO",
        "operator_name":      "",
        "emsp_country_code":  "US",
        "emsp_party_id":      "CPO",
        "base_url":           "http://localhost:8000",
        "versions_path":      "/ocpi/versions",
    },
    "tailscale": {
        "auth_key":  "",
        "tailnet":   "",
        "api_key":   "",
        "enabled":   False,
    },
    "branding": {
        "company_name":    "",
        "app_title":       "Charge Station Management System",
        "logo_url":        "",
        "logo_data_uri":   "",
        "favicon_url":     "",
        "primary_color":   "#4edea3",
        "secondary_color": "#1e293b",
        "accent_color":    "#3b82f6",
        "bg_color":        "#0b1326",
        "card_color":      "#171f33",
        "support_email":   "",
        "legal_entity":    "",
        "vat_number":      "",
        "portal_tagline":  "Enterprise EV Charging Management (CSMS)",
    },
    "payouts": {
        "auto_settlement":    True,
        "default_split_pct":  15.0,
        "payout_schedule":    "monthly",
        "currency":           "EUR",
        "minimum_payout":     50.0,
        "payout_method":      "stripe_connect",
    },
}

VALID_KEYS = set(_DEFAULTS.keys())


class SettingUpdate(BaseModel):
    value: dict


class TestSmsRequest(BaseModel):
    phone: str


class TestSmtpRequest(BaseModel):
    to_email: str


# ── Helpers ───────────────────────────────────────────────────────────────

def _merge_update(existing: dict, incoming: dict, key: str) -> dict:
    """
    Merge incoming dict into existing, preserving secret fields when the
    incoming value is "****" (meaning: don't change this field).
    Unknown fields for the key are dropped to keep settings tidy.
    """
    template = _DEFAULTS.get(key, {})
    merged = dict(existing)
    for field, default in template.items():
        if field in incoming:
            new_val = incoming[field]
            if field in _SECRET_FIELDS and new_val == "****":
                # Preserve existing secret
                pass
            else:
                merged[field] = new_val
        elif field not in merged:
            merged[field] = default
    return merged


async def _get_with_defaults(key: str) -> dict:
    """Get setting merged over defaults so all fields are always present."""
    stored = await get_setting(key)
    result = dict(_DEFAULTS.get(key, {}))
    result.update(stored)
    return result


# ── Read endpoints ────────────────────────────────────────────────────────

@router.get("")
async def list_settings():
    """Return all settings with secrets masked."""
    all_s = await get_all_settings()
    # Fill in defaults for any key not yet in DB
    for key, defaults in _DEFAULTS.items():
        if key not in all_s:
            all_s[key] = dict(defaults)
        else:
            merged = dict(defaults)
            merged.update(all_s[key])
            all_s[key] = merged

    return {key: mask_secrets(val) for key, val in all_s.items()}


@router.get("/{key}")
async def get_one_setting(key: str):
    """Return single setting with secrets masked."""
    if key not in VALID_KEYS:
        raise HTTPException(404, f"Unknown setting key: {key}")
    val = await _get_with_defaults(key)
    return {"key": key, "value": mask_secrets(val)}


# ── Write endpoints ───────────────────────────────────────────────────────

@router.put("/{key}")
async def update_setting(key: str, body: SettingUpdate):
    """Update a setting. Secret fields sent as '****' are preserved unchanged."""
    if key not in VALID_KEYS:
        raise HTTPException(404, f"Unknown setting key: {key}")

    existing = await _get_with_defaults(key)
    merged   = _merge_update(existing, body.value, key)
    await put_setting(key, merged)

    return {"ok": True, "key": key, "value": mask_secrets(merged)}


# ── Brand Logo Upload ─────────────────────────────────────────────────────

from fastapi import File, UploadFile
import base64
from pathlib import Path

@router.post("/logo")
async def upload_branding_logo(file: UploadFile = File(...)):
    """
    Upload and persist company branding logo.
    Saves to persistent storage volume and embeds Base64 fallback in database for 100% portable backups.
    """
    allowed_types = {
        "image/png", "image/jpeg", "image/jpg", "image/svg+xml",
        "image/webp", "image/x-icon", "image/vnd.microsoft.icon",
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(400, f"Unsupported file format: {file.content_type}. Allowed: PNG, JPEG, SVG, WebP, ICO")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File size exceeds 5MB limit")

    mime = file.content_type or "image/png"
    b64_str = base64.b64encode(content).decode("ascii")
    data_uri = f"data:{mime};base64,{b64_str}"

    ext = Path(file.filename or "logo.png").suffix or ".png"
    upload_dir = Path("/var/lib/opencpo/uploads/branding")
    logo_url = data_uri
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        target_path = upload_dir / f"logo{ext}"
        target_path.write_bytes(content)
        logo_url = f"/static/uploads/branding/logo{ext}"
    except Exception as exc:
        logger.warning(f"Failed to write logo to volume {upload_dir}: {exc}, using Base64 data URI")

    # Update branding setting in database
    existing = await _get_with_defaults("branding")
    existing["logo_url"] = logo_url
    existing["logo_data_uri"] = data_uri
    await put_setting("branding", existing)

    logger.info("Branding logo successfully uploaded and saved (bytes: %d)", len(content))
    return {
        "ok": True,
        "logo_url": logo_url,
        "logo_data_uri": data_uri,
        "filename": file.filename,
        "size_bytes": len(content),
    }


# ── Test endpoints ────────────────────────────────────────────────────────

@router.post("/sms/test")
async def test_sms(body: TestSmsRequest):
    """Send a test SMS to verify SMS configuration and return diagnostic metrics."""
    import time
    from utils import send_sms
    from state.settings import get_setting

    phone = body.phone.strip()
    if not phone:
        raise HTTPException(400, "phone is required")

    sms_cfg = await get_setting("sms")
    provider = sms_cfg.get("provider", "twilio")

    start = time.monotonic()
    try:
        ok = await send_sms(phone, "OpenCPO settings test: Outbound SMS gateway is operational.")
        elapsed_ms = int((time.monotonic() - start) * 1000)
        if not ok:
            return {
                "ok": False,
                "error": "SMS provider rejected message dispatch. Verify API credentials, SID, or sender ID.",
                "provider": provider,
                "sent_to": phone,
                "elapsed_ms": elapsed_ms,
            }
        return {
            "ok": True,
            "message": f"Test SMS successfully dispatched to {phone}",
            "provider": provider,
            "sent_to": phone,
            "elapsed_ms": elapsed_ms,
        }
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "ok": False,
            "error": str(exc),
            "provider": provider,
            "sent_to": phone,
            "elapsed_ms": elapsed_ms,
        }


@router.post("/smtp/test")
async def test_smtp(body: TestSmtpRequest):
    """Send a test email to verify SMTP configuration and return detailed diagnostic metrics."""
    import time
    from state.settings import get_setting
    from utils import send_email

    to = body.to_email.strip()
    if not to:
        raise HTTPException(400, "to_email is required")

    smtp_cfg = await get_setting("smtp")
    host = smtp_cfg.get("host", "")
    port = int(smtp_cfg.get("port", 587))
    tls = bool(smtp_cfg.get("tls", True))
    user = smtp_cfg.get("user", "")

    if not host or not user:
        return {
            "ok": False,
            "error": "SMTP Host and User must be configured in settings before testing.",
            "host": host or "Not configured",
            "port": port,
            "tls": tls,
            "sent_to": to,
            "elapsed_ms": 0,
        }

    start = time.monotonic()
    try:
        ok = await send_email(
            to_email=to,
            subject="OpenCPO SMTP Diagnostic Test Handshake",
            body_text=(
                f"Hello,\n\n"
                f"This is an automated test email dispatched from OpenCPO Mission Control.\n\n"
                f"Diagnostic Handshake Parameters:\n"
                f"- SMTP Host: {host}:{port}\n"
                f"- TLS Enabled: {tls}\n"
                f"- Sender Address: {smtp_cfg.get('from_address', user)}\n"
                f"- Sender Name: {smtp_cfg.get('from_name', 'OpenCPO Mission Control')}\n\n"
                f"If you received this message, your transactional email pipeline is operating normally."
            ),
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        if not ok:
            return {
                "ok": False,
                "error": "SMTP server connection rejected. Verify host, port, username, or app password.",
                "host": host,
                "port": port,
                "tls": tls,
                "sent_to": to,
                "elapsed_ms": elapsed_ms,
            }
        return {
            "ok": True,
            "message": f"Test email successfully dispatched to {to}",
            "host": host,
            "port": port,
            "tls": tls,
            "sent_to": to,
            "elapsed_ms": elapsed_ms,
        }
    except Exception as exc:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "ok": False,
            "error": str(exc),
            "host": host,
            "port": port,
            "tls": tls,
            "sent_to": to,
            "elapsed_ms": elapsed_ms,
        }

