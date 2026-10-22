"""
Driver Authentication & Token Rotation Module (GAP-SEC-08)

Provides token refresh, rotation, and session management for the driver Charge App PWA:
- Refreshes expired 1h access tokens using a 30-day refresh token.
- Rotates refresh tokens to prevent replay attacks.
- Updates secure HttpOnly cookies ('auth_token' with 3600s TTL, 'refresh_token').
"""
import logging
import os
from typing import Optional, Dict, Any
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

import config

logger = logging.getLogger("chargeapp.auth")

router = APIRouter(prefix="/api/account", tags=["Driver Auth"])

CORE_API = config.CORE_API
ACCESS_TOKEN_COOKIE = "auth_token"
REFRESH_TOKEN_COOKIE = "refresh_token"
ACCESS_TOKEN_MAX_AGE = 3600  # 1 hour (GAP-SEC-08)
REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


@router.post("/refresh")
async def refresh_session(request: Request):
    """
    Driver session token refresh & rotation endpoint.
    Reads refresh token from JSON body or HttpOnly cookie 'refresh_token'.
    Rotates tokens against Core CSMS API and sets updated cookies.
    """
    refresh_token: Optional[str] = None

    # 1. Try reading from request body
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
    except Exception:
        pass

    # 2. Fall back to cookie
    if not refresh_token:
        refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    # Call Core API refresh endpoint
    async with httpx.AsyncClient(base_url=CORE_API, timeout=10.0) as client:
        try:
            r = await client.post("/api/v1/public/account/refresh", json={"refresh_token": refresh_token})
        except Exception as e:
            logger.error(f"Failed to connect to core API for token refresh: {e}")
            raise HTTPException(status_code=503, detail="Authentication service unavailable")

    if r.status_code != 200:
        err = r.json().get("detail", "Token refresh failed") if r.headers.get("content-type", "").startswith("application/json") else "Token refresh failed"
        raise HTTPException(status_code=r.status_code, detail=err)

    data = r.json()
    new_access = data.get("token") or data.get("access_token")
    new_refresh = data.get("refresh_token") or refresh_token

    response = JSONResponse({
        "ok": True,
        "token": new_access,
        "account": data.get("account"),
    })

    is_secure = os.getenv("COOKIE_SECURE", "false").lower() == "true" or request.url.scheme == "https"

    if new_access:
        response.set_cookie(
            key=ACCESS_TOKEN_COOKIE,
            value=new_access,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=ACCESS_TOKEN_MAX_AGE,
            path="/",
        )

    if new_refresh:
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE,
            value=new_refresh,
            httponly=True,
            secure=is_secure,
            samesite="lax",
            max_age=REFRESH_TOKEN_MAX_AGE,
            path="/",
        )

    return response
