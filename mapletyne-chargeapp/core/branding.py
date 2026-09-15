"""Branding configuration reader — fetches tenant branding from Core API with caching."""
import logging
import time
from typing import Optional

from core.api import api_get

logger = logging.getLogger(__name__)

_branding_cache: Optional[dict] = None
_branding_ts: float = 0.0
_CACHE_TTL: int = 10  # 10 seconds

DEFAULT_BRANDING = {
    "company_name": "MTT Charge",
    "app_title": "Charge Station Management System",
    "portal_tagline": "Enterprise EV Charging Management (CSMS)",
    "logo_url": "/skin/logo.svg",
    "logo_data_uri": None,
    "favicon_url": "/skin/favicon.svg",
    "primary_color": "#48e260",
    "secondary_color": "#1e293b",
    "accent_color": "#3b82f6",
    "bg_color": "#0b1326",
    "card_color": "#171f33",
    "support_email": "support@opencpo.com",
    "legal_entity": "Maple-Tyne Technologies Inc.",
    "vat_number": "",
    "currency": "GBP",
    "currency_symbol": "£",
}


async def get_branding() -> dict:
    """Return branding configuration dictionary with 10s caching."""
    global _branding_cache, _branding_ts
    now = time.monotonic()
    if _branding_cache is not None and (now - _branding_ts < _CACHE_TTL):
        return _branding_cache

    try:
        data = await api_get("/api/v1/public/branding")
        if isinstance(data, dict) and data.get("company_name"):
            merged = {**DEFAULT_BRANDING, **data}
            currency = merged.get("currency", "GBP")
            if not merged.get("currency_symbol"):
                merged["currency_symbol"] = "€" if currency == "EUR" else ("$" if currency == "USD" else "£")
            _branding_cache = merged
            _branding_ts = now
            return _branding_cache
    except Exception as e:
        logger.debug(f"Could not fetch branding from core API: {e}")

    if _branding_cache is not None:
        return _branding_cache

    return DEFAULT_BRANDING.copy()
