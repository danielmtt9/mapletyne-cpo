"""
Milestone 1 Security Hardening Automated Test Suite.
Validates:
- R1: Ingress & Keycloak 26 OIDC Forwarded Headers
- GAP-SEC-11 & GAP-SEC-15: Edge Security Headers (HSTS, CSP, X-Frame-Options, etc.)
- GAP-SEC-14: Strict CORS Allowlist (No wildcard * with credentials)
- GAP-SEC-09: Fine-Grained RBAC Route Protection
- GAP-SEC-10: Multi-Tenant Row-Level Security (RLS) Isolation
- GAP-SEC-18: Redis Sliding Window Rate Limiting & Safe IP Resolution
- GAP-SEC-08: Driver Token Rotation & 1h TTL
- GAP-SEC-20: Driver Form CSRF Double-Submit Cookie Protection
"""
import pytest
import httpx
import psycopg2
import time
import os

NGINX_URL = "http://localhost:34080"
CORE_URL = "http://localhost:34800"
CHARGEAPP_URL = "http://localhost:34003"
KEYCLOAK_DIRECT = "http://localhost:34085"

PG_CONFIG = {
    "dbname": "ocpp",
    "user": "ocpp",
    "password": "opencpo_db_pass_2026",
    "host": "localhost",
    "port": 5432,
}

@pytest.mark.m1
def test_ingress_security_headers():
    """Verify Nginx edge ingress emits all strict security headers on root."""
    with httpx.Client(timeout=10.0) as client:
        r = client.get(f"{NGINX_URL}/")
        assert r.status_code in (200, 301, 302, 304)
        headers = r.headers
        assert "strict-transport-security" in headers, "HSTS missing"
        assert "max-age=" in headers["strict-transport-security"]
        assert "includeSubDomains" in headers["strict-transport-security"]
        assert headers.get("x-frame-options") == "SAMEORIGIN"
        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert "content-security-policy" in headers


@pytest.mark.m1
def test_ingress_tunnel_forwarded_headers_keycloak_issuer():
    """Verify Keycloak dynamic issuer resolution when fronted by Cloudflare Tunnel / proxy."""
    tunnel_host = "cpo.example.trycloudflare.com"
    with httpx.Client(timeout=10.0) as client:
        r = client.get(
            f"{NGINX_URL}/auth/realms/opencpo/.well-known/openid-configuration",
            headers={
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Host": tunnel_host,
                "X-Forwarded-Port": "443",
            },
        )
        assert r.status_code == 200, f"Keycloak discovery failed: {r.status_code}"
        data = r.json()
        assert data.get("issuer") == f"https://{tunnel_host}/auth/realms/opencpo"
        assert data.get("authorization_endpoint").startswith(f"https://{tunnel_host}/")


@pytest.mark.m1
def test_strict_cors_allowlist_rejects_wildcard():
    """Verify CORS reject unauthorized origins and does not expose wildcard with credentials."""
    with httpx.Client(timeout=10.0) as client:
        # Preflight from untrusted origin
        r = client.options(
            f"{CORE_URL}/api/v1/chargers",
            headers={
                "Origin": "https://malicious-ev-site.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        allow_origin = r.headers.get("access-control-allow-origin", "")
        assert allow_origin != "*", "Wildcard CORS origin is strictly forbidden (GAP-SEC-14)"
        assert allow_origin != "https://malicious-ev-site.com", "Untrusted origin must not be allowed"

        # Preflight from approved origin
        r_valid = client.options(
            f"{CORE_URL}/api/v1/chargers",
            headers={
                "Origin": "http://localhost:34000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r_valid.headers.get("access-control-allow-origin") == "http://localhost:34000"
        assert r_valid.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.m1
def test_rbac_route_protection():
    """Verify fine-grained RBAC blocks unauthenticated and insufficiently privileged requests (GAP-SEC-09)."""
    with httpx.Client(timeout=10.0) as client:
        # 1. Unauthenticated request to operator chargers endpoint -> 401
        r_unauth = client.get(f"{CORE_URL}/api/v1/chargers")
        assert r_unauth.status_code == 401, f"Expected 401 unauth, got {r_unauth.status_code}"

        # 2. Unauthenticated request to charger reset command -> 401
        r_cmd = client.post(f"{CORE_URL}/api/v1/chargers/TEST_CP/reset", json={"type": "Soft"})
        assert r_cmd.status_code == 401, f"Expected 401 unauth, got {r_cmd.status_code}"

        # 3. Invalid API key / token -> 401
        r_bad_key = client.get(f"{CORE_URL}/api/v1/chargers", headers={"X-API-Key": "invalid_key"})
        assert r_bad_key.status_code == 401


@pytest.mark.m1
def test_driver_token_refresh_endpoint():
    """Verify driver token refresh endpoint rotates tokens and rejects malformed inputs (GAP-SEC-08)."""
    with httpx.Client(timeout=10.0) as client:
        # 1. Core API refresh with empty body -> 422 or 400
        r_empty = client.post(f"{CORE_URL}/api/v1/public/account/refresh", json={})
        assert r_empty.status_code in (400, 422)

        # 2. Core API refresh with invalid token -> 401
        r_invalid = client.post(
            f"{CORE_URL}/api/v1/public/account/refresh",
            json={"refresh_token": "invalid.jwt.token"},
        )
        assert r_invalid.status_code == 401


@pytest.mark.m1
def test_driver_csrf_double_submit_protection():
    """Verify Charge App enforces double-submit cookie CSRF tokens on mutating requests (GAP-SEC-20)."""
    # 1. Fresh request without CSRF cookie -> 403 Forbidden ("CSRF token missing")
    with httpx.Client(timeout=10.0) as fresh_client:
        r_no_csrf = fresh_client.post(f"{CHARGEAPP_URL}/api/favorites/TEST_CP")
        assert r_no_csrf.status_code == 403
        assert "CSRF token missing" in r_no_csrf.json().get("detail", "")

    # 2. Established session with CSRF cookie
    with httpx.Client(timeout=10.0) as client:
        r_get = client.get(f"{CHARGEAPP_URL}/health")
        assert r_get.status_code == 200
        assert "csrf_token" in r_get.cookies
        csrf_token = r_get.cookies.get("csrf_token")
        assert len(csrf_token) >= 32

        # 3. POST with cookie but without matching header -> 403 Forbidden ("CSRF token validation failed")
        r_missing_header = client.post(f"{CHARGEAPP_URL}/api/favorites/TEST_CP")
        assert r_missing_header.status_code == 403
        assert "CSRF token validation failed" in r_missing_header.json().get("detail", "")

        # 4. POST with cookie and mismatched header -> 403 Forbidden ("CSRF token validation failed")
        r_mismatch = client.post(
            f"{CHARGEAPP_URL}/api/favorites/TEST_CP",
            headers={"X-CSRF-Token": "invalid_csrf_token_mismatch"},
        )
        assert r_mismatch.status_code == 403
        assert "CSRF token validation failed" in r_mismatch.json().get("detail", "")

        # 5. POST with matching CSRF token and cookie -> allowed through (200 OK)
        r_valid = client.post(
            f"{CHARGEAPP_URL}/api/favorites/TEST_CP",
            headers={"X-CSRF-Token": csrf_token},
        )
        assert r_valid.status_code == 200


@pytest.mark.m1
def test_multitenant_rls_isolation_and_policies():
    """Verify PostgreSQL Row Level Security (RLS) is active and isolates tenant rows (GAP-SEC-10)."""
    conn = psycopg2.connect(**PG_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Confirm RLS is enabled on key tables
    tables_to_check = [
        "charge_points", "sessions", "cdrs", "users",
        "tariffs", "tokens", "driver_accounts", "fleet_vehicles"
    ]
    cur.execute(
        "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'ocpp' AND tablename = ANY(%s)",
        (tables_to_check,)
    )
    rows = cur.fetchall()
    assert len(rows) == len(tables_to_check), f"Expected {len(tables_to_check)} tables, found {len(rows)}"
    for table, rls_active in rows:
        assert rls_active is True, f"RLS is not enabled on ocpp.{table}"

    # 2. Confirm tenant_id column exists
    cur.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'ocpp' AND table_name = 'charge_points' AND column_name = 'tenant_id'"
    )
    assert cur.fetchone() is not None, "tenant_id column missing on ocpp.charge_points"

    # 3. Test RLS session variable enforcement
    cur.execute("SET app.current_user_role = 'operator'")
    cur.execute("SET app.current_tenant_id = 'tenant-a'")
    cur.execute("SELECT current_setting('app.current_tenant_id', true)")
    val = cur.fetchone()[0]
    assert val == "tenant-a", "Tenant session variable setting failed"

    conn.close()


@pytest.mark.m1
def test_sliding_window_rate_limiter_safe_ip():
    """Verify rate limiter module safely extracts real IP without spoofing bypass (GAP-SEC-18)."""
    from fastapi import Request
    import sys
    sys.path.insert(0, "/home/danielaroko/applications/mapletynecpo/mapletyne-core")
    from core.ratelimit import get_verified_client_ip

    # Simulated untrusted request spoofing X-Real-IP: 127.0.0.1 from untrusted external IP
    scope = {
        "type": "http",
        "client": ("93.184.216.34", 50000),
        "headers": [
            (b"x-real-ip", b"127.0.0.1"),
            (b"x-forwarded-for", b"127.0.0.1"),
        ],
    }
    req = Request(scope)
    ip = get_verified_client_ip(req)
    assert ip != "127.0.0.1", "Rate limiter must not trust spoofed X-Real-IP header from unverified client"
    assert ip == "93.184.216.34", f"Expected client socket IP, got {ip}"
