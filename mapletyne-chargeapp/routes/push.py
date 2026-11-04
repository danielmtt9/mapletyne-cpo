"""Push notification proxy routes — forwards subscribe/unsubscribe to Core API."""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from core.api import api_get, api_post
from routes.session import verify_session_ownership

router = APIRouter()


@router.get("/api/push/key")
async def push_key():
    """Return VAPID public key from Core API."""
    try:
        data = await api_get("/api/v1/public/push/key")
        return JSONResponse(data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.post("/api/push/subscribe")
async def push_subscribe(request: Request):
    """Proxy push subscription to Core API."""
    try:
        body = await request.json()
        session_id = body.get("session_id", "")
        if not session_id:
            raise HTTPException(status_code=400, detail="Missing session_id")
        verify_session_ownership(request, session_id)
        result = await api_post("/api/v1/public/push/subscribe", body)
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.post("/api/push/unsubscribe")
async def push_unsubscribe(request: Request):
    """Proxy push unsubscribe to Core API."""
    try:
        body = await request.json()
        session_id = body.get("session_id", "")
        if not session_id:
            raise HTTPException(status_code=400, detail="Missing session_id")
        verify_session_ownership(request, session_id)
        result = await api_post("/api/v1/public/push/unsubscribe", body)
        return JSONResponse(result)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
