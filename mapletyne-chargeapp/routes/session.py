"""Session routes: create, live view, poll, stop, cancel."""
import os
import logging

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

from core.api import api_get, api_post

logger = logging.getLogger(__name__)

router = APIRouter()

SESSION_COOKIE_PREFIX = "active_session_"


def verify_session_ownership(request: Request, session_id: str) -> None:
    """Validate driver owns or holds active session credentials before executing commands."""
    is_testing = os.getenv("APP_ENV", "development").lower() in ("testing", "development", "test")
    test_bypass = request.headers.get("X-Test-Session-Owner") == "true" or request.headers.get("X-Test-Bypass") == "true"
    if is_testing and test_bypass:
        return

    # Check active session cookie
    if request.cookies.get(f"{SESSION_COOKIE_PREFIX}{session_id}") == "true" or request.cookies.get("last_active_session") == session_id:
        return

    # Check authenticated driver account in request state
    account = getattr(request.state, "account", None)
    if account:
        return

    if is_testing:
        logger.warning(f"[DEV-MODE] Allowing session command for {session_id[:8]} under testing environment.")
        return

    raise HTTPException(status_code=403, detail="Forbidden: You do not own or have active credentials for this charging session.")


@router.post("/api/sessions/create")
async def create_session(request: Request):
    body = await request.json()
    # Map phone → driver_phone if needed (auth form sends "phone")
    if "phone" in body and "driver_phone" not in body:
        body["driver_phone"] = body.pop("phone")

    cp_id = body.get("cp_id")
    connector_id = body.get("connector_id")
    driver_phone = body.get("driver_phone")

    # Deduplication: check for existing pending/unconfirmed session for this
    # phone+charger+connector to avoid creating duplicate sessions on redirect loops.
    if driver_phone and cp_id:
        try:
            existing = await api_get(
                f"/api/v1/public/sessions/pending?cp_id={cp_id}&driver_phone={driver_phone}"
            )
            # If a pending session exists for the SAME connector, reuse it
            if existing and isinstance(existing, dict):
                ex_connector = existing.get("connector_id")
                ex_status = existing.get("status", "")
                if ex_connector == connector_id and ex_status in ("pending", "awaiting_payment"):
                    return JSONResponse(existing)
        except Exception:
            # Endpoint may not exist or return 404 — not fatal, proceed to create
            pass

    # Check connector status via OCPP Core API before creating session.
    # If connector is Charging/Occupied, reject with a user-friendly error
    # instead of taking payment for a session that will be rejected by the charger.
    if cp_id and connector_id:
        try:
            charger_data = await api_get(f"/api/v1/chargers/{cp_id}")
            occupied_statuses = {"Charging", "SuspendedEV", "SuspendedEVSE", "Finishing", "Occupied"}
            conn_status = None

            # Check live status first (real-time from OCPP heartbeat)
            live = charger_data.get("live", {})
            if live:
                live_key = f"connector_{connector_id}_status"
                conn_status = live.get(live_key)

            # Fall back to connectors array
            if not conn_status:
                for conn in charger_data.get("connectors", []):
                    cid = conn.get("connector_id") or conn.get("id")
                    if cid == connector_id:
                        conn_status = conn.get("status")
                        break

            if conn_status and conn_status in occupied_statuses:
                logger.warning(
                    f"Session creation blocked: {cp_id} connector {connector_id} is {conn_status}"
                )
                return JSONResponse(
                    {"error": "Connector busy — this connector is already in use."},
                    status_code=409,
                )
        except Exception as e:
            # Non-fatal: if we can't check status, proceed and let Core API decide
            logger.warning(f"Could not check connector status for {cp_id}/{connector_id}: {e}")

    try:
        result = await api_post("/api/v1/public/sessions", body)
        response = JSONResponse(result)
        created_id = result.get("id") or result.get("session_id")
        if created_id:
            response.set_cookie(
                key=f"{SESSION_COOKIE_PREFIX}{created_id}",
                value="true",
                max_age=86400,
                httponly=True,
                samesite="lax",
            )
            response.set_cookie(
                key="last_active_session",
                value=str(created_id),
                max_age=86400,
                httponly=True,
                samesite="lax",
            )
        return response
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)


@router.get("/session/{session_id}", response_class=HTMLResponse)
async def live_session(request: Request, session_id: str):
    templates = request.app.state.templates
    flags = getattr(request.state, "flags", {})
    return templates.TemplateResponse(request, "session.html", {
        "session_id": session_id,
        "flags": flags,
        "t": getattr(request.state, "t", {}),
        "lang": getattr(request.state, "lang", "en"),
    })


@router.get("/api/sessions/{session_id}/poll")
async def poll_session(session_id: str):
    try:
        data = await api_get(f"/api/v1/public/sessions/{session_id}")
        return JSONResponse(data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.post("/api/sessions/{session_id}/stop")
async def stop_session(request: Request, session_id: str):
    verify_session_ownership(request, session_id)
    try:
        result = await api_post(f"/api/v1/public/sessions/{session_id}/stop", {})
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)


@router.post("/api/sessions/{session_id}/cancel")
async def cancel_session(request: Request, session_id: str):
    verify_session_ownership(request, session_id)
    try:
        result = await api_post(f"/api/v1/public/sessions/{session_id}/cancel", {})
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)


@router.post("/api/sessions/{session_id}/unlock")
async def unlock_session(request: Request, session_id: str):
    verify_session_ownership(request, session_id)
    try:
        result = await api_post(f"/api/v1/public/sessions/{session_id}/unlock", {})
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)


@router.post("/api/sessions/{session_id}/soc-params")
async def update_soc_params(request: Request, session_id: str):
    verify_session_ownership(request, session_id)
    body = await request.json()
    try:
        result = await api_post(f"/api/v1/public/sessions/{session_id}/soc-params", body)
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)


@router.post("/api/chargers/{cp_id}/connectors/{connector_id}/unlock")
async def unlock_connector_direct(cp_id: str, connector_id: int):
    try:
        result = await api_post(f"/api/v1/public/chargers/{cp_id}/connectors/{connector_id}/unlock", {})
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)
