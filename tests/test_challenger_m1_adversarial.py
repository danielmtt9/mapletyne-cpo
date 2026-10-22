"""
Milestone 1 Challenger 2 Empirical Adversarial Stress Testing Suite.
Empirically verifies:
1. Adversarial CORS probe: Rejection of unauthorized/malicious origins, regex bypass attempts, and absence of wildcard *.
2. Adversarial RBAC probe: Rejection of unauthenticated (401), invalid/expired (401), forged signature (401), and insufficient role (403) requests across role-guarded endpoints.
3. Keycloak client redirect probe: Verification of live Keycloak clients and realm-export.json for absence of bare wildcard * in redirectUris and webOrigins.
4. Edge Ingress and Tunnel origin validation: Verification of security headers and proxy header handling.
"""
import pytest
import requests
import jwt
from datetime import datetime, timezone, timedelta
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

CORE_URL = "http://localhost:34800"
NGINX_URL = "http://localhost:34080"
KEYCLOAK_URL = "http://localhost:34085"
REALM = "opencpo"


# ── Helper Fixtures & Functions ──────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    """Obtain genuine RS256 token for platform admin."""
    r = requests.post(
        f"{KEYCLOAK_URL}/auth/realms/{REALM}/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "opencpo-admin-ui",
            "username": "daniel.a@mapletynetechnologies.com",
            "password": "admin",
        },
        timeout=10,
    )
    assert r.status_code == 200, f"Failed to get admin token: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def operator_token():
    """Obtain genuine RS256 token for site operator."""
    r = requests.post(
        f"{KEYCLOAK_URL}/auth/realms/{REALM}/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "opencpo-admin-ui",
            "username": "operator@opencpo.com",
            "password": "operator123",
        },
        timeout=10,
    )
    assert r.status_code == 200, f"Failed to get operator token: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def driver_token():
    """Obtain genuine RS256 token for driver."""
    r = requests.post(
        f"{KEYCLOAK_URL}/auth/realms/{REALM}/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "opencpo-charge-app",
            "username": "driver@opencpo.com",
            "password": "driver123",
        },
        timeout=10,
    )
    assert r.status_code == 200, f"Failed to get driver token: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def keycloak_admin_token():
    """Obtain Keycloak Master Admin token to query Keycloak Admin REST API."""
    r = requests.post(
        f"{KEYCLOAK_URL}/auth/realms/master/protocol/openid-connect/token",
        data={
            "grant_type": "password",
            "client_id": "admin-cli",
            "username": "admin",
            "password": "admin",
        },
        timeout=10,
    )
    assert r.status_code == 200, f"Failed to get Keycloak master admin token: {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def untrusted_rsa_keypair():
    """Generates an untrusted RSA 2048 keypair to attempt signature forgery."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return pem_private


@pytest.fixture(autouse=True)
def isolated_test_client_ip(monkeypatch, request):
    """Assigns an isolated client IP per test to avoid rate limiter exhaustion."""
    test_num = abs(hash(request.node.nodeid)) % 240 + 10
    test_ip = f"10.200.2.{test_num}"

    orig_request = requests.Session.request

    def patched_request(self, method, url, *args, **kwargs):
        headers = kwargs.get("headers")
        if headers is None:
            kwargs["headers"] = {"X-Forwarded-For": test_ip}
        elif isinstance(headers, dict) and "X-Forwarded-For" not in headers:
            headers["X-Forwarded-For"] = test_ip
        return orig_request(self, method, url, *args, **kwargs)

    monkeypatch.setattr(requests.Session, "request", patched_request)



# ── 1. Adversarial CORS Probes ───────────────────────────────────────────────

class TestAdversarialCORS:
    """Stress tests CORS configuration against unauthorized origins and regex attacks."""

    MALICIOUS_ORIGINS = [
        "https://evil-attacker.com",
        "http://evil-attacker.com",
        "https://evil-attacker.com:8080",
        "https://attacker.trycloudflare.com.evil.com",
        "https://mapletyne.com.evil.com",
        "https://evilmapletyne.com",
        "https://eviltrycloudflare.com",
        "https://fake-mapletyne.com",
        "http://localhost.evil.com",
        "null",
    ]

    @pytest.mark.parametrize("origin", MALICIOUS_ORIGINS)
    def test_preflight_options_rejects_malicious_origin_direct_core(self, origin):
        """Verify preflight OPTIONS to Core REST API never returns Access-Control-Allow-Origin for untrusted origin."""
        r = requests.options(
            f"{CORE_URL}/api/v1/chargers",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization,Content-Type",
            },
            timeout=5,
        )
        allow_origin = r.headers.get("access-control-allow-origin")
        assert allow_origin != origin, f"Vulnerability: Untrusted origin {origin} was reflected in CORS allow origin!"
        assert allow_origin != "*", "Vulnerability: Wildcard * was returned in CORS allow origin!"
        assert allow_origin is None or allow_origin == "", f"Expected no allow-origin header, got: {allow_origin}"

    @pytest.mark.parametrize("origin", MALICIOUS_ORIGINS)
    def test_preflight_options_rejects_malicious_origin_via_nginx(self, origin):
        """Verify preflight OPTIONS routed through Nginx Ingress never returns Access-Control-Allow-Origin for untrusted origin."""
        r = requests.options(
            f"{NGINX_URL}/api/v1/chargers",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization,Content-Type",
            },
            timeout=5,
        )
        allow_origin = r.headers.get("access-control-allow-origin")
        assert allow_origin != origin, f"Vulnerability: Untrusted origin {origin} was reflected via Nginx!"
        assert allow_origin != "*", "Vulnerability: Wildcard * returned via Nginx!"
        assert allow_origin is None or allow_origin == "", f"Expected no allow-origin header, got: {allow_origin}"

    @pytest.mark.parametrize("origin", MALICIOUS_ORIGINS)
    def test_direct_get_rejects_cors_for_malicious_origin(self, origin):
        """Verify direct GET requests with malicious Origin header do not receive Access-Control-Allow-Origin."""
        r = requests.get(
            f"{CORE_URL}/health",
            headers={"Origin": origin},
            timeout=5,
        )
        allow_origin = r.headers.get("access-control-allow-origin")
        assert allow_origin != origin, f"Vulnerability: Untrusted origin {origin} was reflected on GET!"
        assert allow_origin != "*", "Vulnerability: Wildcard * was returned on GET!"
        assert allow_origin is None or allow_origin == ""

    def test_legitimate_origins_receive_explicit_cors_credentials(self):
        """Verify authorized origins receive matching access-control-allow-origin and allow-credentials: true."""
        valid_origins = [
            "http://localhost:34000",
            "http://localhost:34080",
            "https://admin.mapletyne.com",
            "https://opencpo.mapletyne.com",
            "https://dev-tunnel.trycloudflare.com",
        ]
        for origin in valid_origins:
            r = requests.options(
                f"{CORE_URL}/api/v1/chargers",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Authorization,Content-Type",
                },
                timeout=5,
            )
            assert r.headers.get("access-control-allow-origin") == origin, f"Expected {origin}, got {r.headers.get('access-control-allow-origin')}"
            assert r.headers.get("access-control-allow-credentials") == "true", "Credentials must be enabled for legitimate origins"


# ── 2. Adversarial RBAC Probes ───────────────────────────────────────────────

class TestAdversarialRBAC:
    """Stress tests RBAC route protection across role boundaries."""

    PROTECTED_ENDPOINTS = [
        ("GET", f"{CORE_URL}/api/v1/chargers", ["site-operator", "operator", "cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/sessions", ["site-operator", "operator", "cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/tariffs", ["billing-manager", "billing", "cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/tokens", ["fleet-manager", "fleet", "cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/fleet/vehicles", ["fleet-manager", "fleet", "cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/pki/stats", ["cpo-admin", "admin", "superadmin"]),
        ("GET", f"{CORE_URL}/api/v1/users", ["cpo-admin", "admin", "superadmin"]),
        ("POST", f"{CORE_URL}/api/v1/chargers/TEST_CP/reset", ["site-operator", "operator", "cpo-admin", "admin", "superadmin"]),
    ]

    def test_unauthenticated_requests_return_401(self):
        """Probe all protected endpoints without any credentials -> must return 401."""
        for method, url, _ in self.PROTECTED_ENDPOINTS:
            kwargs = {"json": {"type": "Soft"}} if method == "POST" else {}
            r = requests.request(method, url, timeout=5, **kwargs)
            assert r.status_code == 401, f"Expected 401 on unauthenticated {method} {url}, got {r.status_code}"
            data = r.json()
            assert "detail" in data
            assert "Missing authentication credentials" in data["detail"]

    def test_invalid_bearer_token_returns_401(self):
        """Probe protected endpoints with garbage / malformed bearer tokens -> must return 401."""
        bad_tokens = [
            "invalid_jwt_token_gibberish",
            "Bearer ",
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid_signature",
            "null",
        ]
        for bad_tok in bad_tokens:
            r = requests.get(
                f"{CORE_URL}/api/v1/chargers",
                headers={"Authorization": f"Bearer {bad_tok}"},
                timeout=5,
            )
            assert r.status_code == 401, f"Expected 401 for bad token '{bad_tok}', got {r.status_code}"

    def test_expired_token_returns_401(self, untrusted_rsa_keypair):
        """Probe protected endpoints with an expired token -> must return 401."""
        now = datetime.now(timezone.utc)
        expired_claims = {
            "sub": "test-expired-user",
            "iss": f"{KEYCLOAK_URL}/auth/realms/{REALM}",
            "azp": "opencpo-admin-ui",
            "aud": ["opencpo-admin-ui"],
            "realm_access": {"roles": ["cpo-admin"]},
            "iat": int((now - timedelta(days=2)).timestamp()),
            "exp": int((now - timedelta(days=1)).timestamp()),
        }
        expired_tok = jwt.encode(expired_claims, untrusted_rsa_keypair, algorithm="RS256")
        r = requests.get(
            f"{CORE_URL}/api/v1/chargers",
            headers={"Authorization": f"Bearer {expired_tok}"},
            timeout=5,
        )
        assert r.status_code == 401, f"Expected 401 for expired token, got {r.status_code}"

    def test_untrusted_key_signature_forgery_returns_401(self, untrusted_rsa_keypair):
        """Probe protected endpoints with a token signed by an untrusted key -> must return 401."""
        now = datetime.now(timezone.utc)
        forged_claims = {
            "sub": "attacker-superadmin",
            "iss": f"{KEYCLOAK_URL}/auth/realms/{REALM}",
            "azp": "opencpo-admin-ui",
            "aud": ["opencpo-admin-ui"],
            "realm_access": {"roles": ["cpo-admin", "superadmin"]},
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
        }
        forged_tok = jwt.encode(forged_claims, untrusted_rsa_keypair, algorithm="RS256")
        r = requests.get(
            f"{CORE_URL}/api/v1/pki/stats",
            headers={"Authorization": f"Bearer {forged_tok}"},
            timeout=5,
        )
        assert r.status_code == 401, f"Expected 401 for signature forgery, got {r.status_code}"

    def test_driver_token_insufficient_role_rejection_returns_403(self, driver_token):
        """Driver role must be rejected with 403 on operator, billing, fleet, and superadmin endpoints."""
        restricted_probes = [
            ("GET", f"{CORE_URL}/api/v1/chargers"),
            ("GET", f"{CORE_URL}/api/v1/sessions"),
            ("GET", f"{CORE_URL}/api/v1/tariffs"),
            ("GET", f"{CORE_URL}/api/v1/tokens"),
            ("GET", f"{CORE_URL}/api/v1/fleet/vehicles"),
            ("GET", f"{CORE_URL}/api/v1/pki/stats"),
            ("GET", f"{CORE_URL}/api/v1/users"),
            ("POST", f"{CORE_URL}/api/v1/chargers/TEST_CP/reset"),
        ]
        headers = {"Authorization": f"Bearer {driver_token}"}
        for method, url in restricted_probes:
            kwargs = {"json": {"type": "Soft"}} if method == "POST" else {}
            r = requests.request(method, url, headers=headers, timeout=5, **kwargs)
            assert r.status_code == 403, (
                f"Vulnerability: Driver role was not forbidden on {method} {url}! "
                f"Status: {r.status_code}, Body: {r.text}"
            )
            data = r.json()
            assert "detail" in data
            assert "Forbidden: Insufficient role permissions" in data["detail"]

    def test_operator_token_cross_role_boundaries(self, operator_token):
        """Operator role has access to chargers & sessions, but is forbidden (403) from tariffs, pki, and users."""
        headers = {"Authorization": f"Bearer {operator_token}"}

        # 1. Permitted operator endpoints -> 200 OK
        r_chargers = requests.get(f"{CORE_URL}/api/v1/chargers", headers=headers, timeout=5)
        assert r_chargers.status_code == 200, f"Operator should access chargers, got {r_chargers.status_code}"

        r_sessions = requests.get(f"{CORE_URL}/api/v1/sessions", headers=headers, timeout=5)
        assert r_sessions.status_code == 200, f"Operator should access sessions, got {r_sessions.status_code}"

        # 2. Forbidden billing/admin/pki endpoints -> 403 Forbidden
        forbidden_endpoints = [
            ("GET", f"{CORE_URL}/api/v1/tariffs"),
            ("GET", f"{CORE_URL}/api/v1/pki/stats"),
            ("GET", f"{CORE_URL}/api/v1/users"),
        ]
        for method, url in forbidden_endpoints:
            r = requests.request(method, url, headers=headers, timeout=5)
            assert r.status_code == 403, (
                f"Vulnerability: Operator was not forbidden on {method} {url}! "
                f"Status: {r.status_code}, Body: {r.text}"
            )
            assert "Forbidden: Insufficient role permissions" in r.json().get("detail", "")

    def test_admin_token_permitted_across_endpoints(self, admin_token):
        """Platform admin role has access across operator, billing, fleet, and pki endpoints."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        for url in [
            f"{CORE_URL}/api/v1/chargers",
            f"{CORE_URL}/api/v1/sessions",
            f"{CORE_URL}/api/v1/tariffs",
            f"{CORE_URL}/api/v1/tokens",
            f"{CORE_URL}/api/v1/pki/stats",
        ]:
            r = requests.get(url, headers=headers, timeout=5)
            assert r.status_code == 200, f"Admin should access {url}, got {r.status_code}"


# ── 3. Keycloak Client Redirect & Web Origins Probes ─────────────────────────

class TestKeycloakClientRedirectHardening:
    """Verifies that no bare wildcard '*' exists in client redirectUris or webOrigins."""

    TARGET_CLIENT_IDS = [
        "opencpo-admin-ui",
        "mapletyne-admin",
        "opencpo-charge-app",
        "mapletyne-chargeapp",
    ]

    def test_live_keycloak_clients_have_no_bare_wildcards(self, keycloak_admin_token):
        """Query live Keycloak Admin REST API and audit redirectUris and webOrigins."""
        headers = {
            "Authorization": f"Bearer {keycloak_admin_token}",
            "Content-Type": "application/json",
        }
        r = requests.get(f"{KEYCLOAK_URL}/auth/admin/realms/{REALM}/clients", headers=headers, timeout=10)
        assert r.status_code == 200, f"Failed to list clients: {r.status_code} {r.text}"
        clients = r.json()

        checked_count = 0
        for client in clients:
            client_id = client.get("clientId")
            if client_id in self.TARGET_CLIENT_IDS:
                checked_count += 1
                redirect_uris = client.get("redirectUris", [])
                web_origins = client.get("webOrigins", [])

                # 1. Bare wildcard check on redirectUris
                assert "*" not in redirect_uris, (
                    f"CRITICAL VULNERABILITY: Client '{client_id}' contains bare wildcard '*' in redirectUris: {redirect_uris}"
                )

                # 2. Bare wildcard check on webOrigins
                assert "*" not in web_origins, (
                    f"CRITICAL VULNERABILITY: Client '{client_id}' contains bare wildcard '*' in webOrigins: {web_origins}"
                )

                # 3. Check webOrigins is either '+' or strict origins
                for origin in web_origins:
                    assert origin == "+" or origin.startswith("http://") or origin.startswith("https://"), (
                        f"Unexpected webOrigin format in client '{client_id}': {origin}"
                    )

                # 4. Check redirect URIs are anchored
                for uri in redirect_uris:
                    assert uri.startswith("http://") or uri.startswith("https://"), (
                        f"Unanchored redirectUri in client '{client_id}': {uri}"
                    )

        assert checked_count == len(self.TARGET_CLIENT_IDS), (
            f"Expected {len(self.TARGET_CLIENT_IDS)} target clients, found {checked_count}"
        )

    def test_realm_export_json_has_no_bare_wildcards(self):
        """Inspect keycloak/realm-export.json on disk for absence of bare wildcard '*'."""
        import json
        with open("/home/danielaroko/applications/mapletynecpo/keycloak/realm-export.json", "r") as f:
            realm_data = json.load(f)

        clients = realm_data.get("clients", [])
        for client in clients:
            client_id = client.get("clientId")
            if client_id in self.TARGET_CLIENT_IDS:
                redirect_uris = client.get("redirectUris", [])
                web_origins = client.get("webOrigins", [])

                assert "*" not in redirect_uris, (
                    f"Vulnerability in realm-export.json: Client '{client_id}' has bare '*' in redirectUris"
                )
                assert "*" not in web_origins, (
                    f"Vulnerability in realm-export.json: Client '{client_id}' has bare '*' in webOrigins"
                )


# ── 4. Edge Ingress Tunnel & Forwarded Headers ───────────────────────────────

class TestEdgeIngressAndTunnelHeaders:
    """Verifies Nginx Ingress forwarded headers and security header preservation."""

    def test_nginx_security_headers_on_all_gateways(self):
        """Verify Nginx emits defensive headers across API, Auth, App, and Root directly from port 34080."""
        endpoints = [
            f"{NGINX_URL}/",
            f"{NGINX_URL}/api/v1/chargers",
            f"{NGINX_URL}/app/",
            f"{NGINX_URL}/auth/",
        ]
        for url in endpoints:
            r = requests.get(url, timeout=5, allow_redirects=False)
            h = r.headers
            assert "strict-transport-security" in h, f"Missing HSTS on {url}"
            assert h.get("x-frame-options") == "SAMEORIGIN", f"Missing X-Frame-Options on {url}"
            assert "nosniff" in h.get("x-content-type-options", ""), f"Missing nosniff on {url}"
            assert "content-security-policy" in h, f"Missing CSP on {url}"

    def test_dynamic_tunnel_host_issuer_keycloak_and_api(self):
        """Simulate Cloudflare Tunnel request and verify dynamic issuer resolution."""
        tunnel_domain = "mapletyne-cpo-tunnel.trycloudflare.com"
        r = requests.get(
            f"{NGINX_URL}/auth/realms/{REALM}/.well-known/openid-configuration",
            headers={
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Host": tunnel_domain,
                "X-Forwarded-Port": "443",
            },
            timeout=5,
        )
        assert r.status_code == 200
        disc = r.json()
        assert disc["issuer"] == f"https://{tunnel_domain}/auth/realms/{REALM}"
        assert disc["authorization_endpoint"].startswith(f"https://{tunnel_domain}/auth/")
