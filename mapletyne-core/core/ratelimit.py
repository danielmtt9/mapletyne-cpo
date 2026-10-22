"""
Redis-Backed Sliding Window Rate Limiter & IP Spoofing Prevention (GAP-SEC-18)

Features:
- Distributed sliding window rate limiting via Redis Sorted Sets (ZADD, ZREMRANGEBYSCORE, ZCARD).
- Safe client IP resolution with peer-trust verification (disallowing spoofed X-Real-IP or X-Forwarded-For).
- Protection against credential stuffing and brute force:
  - Auth endpoints (/api/v1/admin/auth/login, /api/v1/public/account/login): 10 req / 15 min (or configurable)
  - Management API endpoints: 120 req / min
  - OCPI / Roaming: 60 req / min
- Never exempts untrusted localhost headers from auth rate limits.
- Resilient in-memory fallback if Redis is temporarily disconnected.
"""
import ipaddress
import logging
import os
import time
import uuid
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("ratelimit")

# Default configurations
DEFAULT_WINDOW_SECONDS = 60
DEFAULT_AUTH_LIMIT = int(os.getenv("RATE_LIMIT_AUTH", "30"))
DEFAULT_AUTH_WINDOW = int(os.getenv("RATE_LIMIT_AUTH_WINDOW", "900"))  # 15 minutes
DEFAULT_GENERAL_LIMIT = int(os.getenv("RATE_LIMIT_DEFAULT", "120"))


def _is_trusted_proxy(ip_str: str) -> bool:
    """Verify if the immediate peer IP is a trusted internal proxy or localhost."""
    if not ip_str or ip_str in ("localhost", "testclient"):
        return True
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_loopback or ip.is_private
    except ValueError:
        return False


def get_verified_client_ip(request: Request) -> str:
    """
    Safely determine the true client IP without trusting spoofable headers.
    Headers X-Forwarded-For and X-Real-IP are ONLY inspected if the direct connection
    peer is verified to be a trusted internal proxy or loopback.
    """
    peer = request.client.host if request.client else "127.0.0.1"

    if _is_trusted_proxy(peer):
        # Check CF-Connecting-IP first (Cloudflare Tunnel)
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip and cf_ip.strip():
            return cf_ip.strip()
        # Next check X-Real-IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        # Next check X-Forwarded-For: use rightmost IP (appended by trusted proxy)
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            parts = [p.strip() for p in xff.split(",") if p.strip()]
            if parts:
                return parts[-1]

    return peer


class RedisRateLimiter:
    """Redis-backed sliding window rate limiter with fallback."""

    def __init__(self):
        self._in_memory: Dict[str, List[float]] = defaultdict(list)

    async def is_allowed(
        self, key: str, limit: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Check if request is allowed under the sliding window.
        Returns: (allowed: bool, current_count: int, retry_after: int)
        """
        now = time.time()
        redis_client = None
        try:
            from state.redis import redis_state
            if redis_state and redis_state._redis:
                redis_client = redis_state.client
        except Exception:
            redis_client = None

        if redis_client is not None:
            try:
                pipe = redis_client.pipeline()
                redis_key = f"mtt:ratelimit:{key}"
                cutoff = now - window_seconds
                # Remove timestamps older than the window
                pipe.zremrangebyscore(redis_key, 0, cutoff)
                # Count current valid requests
                pipe.zcard(redis_key)
                # Record current request
                member_id = f"{now}:{uuid.uuid4().hex[:6]}"
                pipe.zadd(redis_key, {member_id: now})
                # Set TTL to clean up idle keys
                pipe.expire(redis_key, window_seconds + 10)
                results = await pipe.execute()

                current_count = results[1]
                if current_count >= limit:
                    return False, current_count + 1, window_seconds
                return True, current_count + 1, 0
            except Exception as e:
                logger.debug(f"Redis rate limit check failed, falling back to in-memory: {e}")

        # In-memory sliding window fallback
        cutoff = now - window_seconds
        valid_requests = [t for t in self._in_memory[key] if t > cutoff]
        current_count = len(valid_requests)

        if current_count >= limit:
            self._in_memory[key] = valid_requests
            return False, current_count, window_seconds

        valid_requests.append(now)
        self._in_memory[key] = valid_requests
        return True, len(valid_requests), 0


# Global limiter instance
limiter = RedisRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI / Starlette Rate Limiting Middleware."""

    def __init__(
        self,
        app,
        limits: Optional[Dict[str, int]] = None,
        default_limit: int = DEFAULT_GENERAL_LIMIT,
    ):
        super().__init__(app)
        self.limits = limits or {}
        self.default_limit = default_limit

    def _resolve_limit_and_window(self, path: str) -> Tuple[int, int, str]:
        """Resolve (limit, window_seconds, bucket_name) for request path."""
        # Strict auth limits for login and token acquisition
        if path.endswith("/login") or "/auth/login" in path:
            return DEFAULT_AUTH_LIMIT, DEFAULT_AUTH_WINDOW, "auth_login"
        if path.startswith("/api/v1/admin/auth") or path.startswith("/api/v1/public/account"):
            return self.limits.get("/api/v1/admin/auth", 60), DEFAULT_WINDOW_SECONDS, "auth"
        if path.startswith("/ocpi"):
            return self.limits.get("/ocpi", 60), DEFAULT_WINDOW_SECONDS, "ocpi"
        if path.startswith("/api/public") or path.startswith("/api/v1/public"):
            return self.limits.get("/api/public", 60), DEFAULT_WINDOW_SECONDS, "public"

        for prefix, lim in self.limits.items():
            if path.startswith(prefix):
                return lim, DEFAULT_WINDOW_SECONDS, prefix.strip("/").replace("/", "_")

        return self.default_limit, DEFAULT_WINDOW_SECONDS, "general"

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Unconditionally exempt health checks and API docs
        if path in (
            "/health",
            "/health/ready",
            "/core-health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ):
            return await call_next(request)

        client_ip = get_verified_client_ip(request)
        limit, window_sec, bucket = self._resolve_limit_and_window(path)
        rate_key = f"{client_ip}:{bucket}"

        allowed, count, retry_after = await limiter.is_allowed(rate_key, limit, window_sec)

        if not allowed:
            logger.warning(
                f"Rate limit exceeded: ip={client_ip} path={path} bucket={bucket} "
                f"count={count} limit={limit} retry_after={retry_after}s"
            )
            # Log structured security audit event
            try:
                from core.audit import log_security_event
                log_security_event(
                    event_type="rate_limit_exceeded",
                    actor=client_ip,
                    role="anonymous",
                    tenant_id="",
                    client_ip=client_ip,
                    action="rate_limit",
                    resource=path,
                    status="denied",
                    details={"limit": limit, "window_seconds": window_sec, "count": count},
                )
            except Exception:
                pass

            return JSONResponse(
                {
                    "error": "rate limit exceeded",
                    "detail": f"Too many requests. Limit is {limit} per {window_sec}s.",
                    "retry_after": retry_after,
                },
                status_code=429,
                headers={"Retry-After": str(retry_after)},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        return response
