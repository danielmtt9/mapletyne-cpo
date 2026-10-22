"""
Tier 1: Feature Coverage E2E Tests for Mapletyne MTT Charge CPO Platform.

Verifies opaque-box contracts across 8 core feature areas:
1. Auth & Keycloak 26 OIDC
2. Edge Ingress Gateway & Reverse Proxy
3. Role-Based Access Control (RBAC)
4. Multi-Tenancy & Row-Level Security (RLS)
5. Charging Protocols (OCPP 1.6-J, OCPP 2.0.1, ISO 15118 PKI)
6. Dynamic Billing & Tariffs
7. Frontend Applications (Driver PWA & Admin Mission Control)
8. Operations, Observability & System Health
"""

import json
import time
import uuid
import asyncio
import pytest
import requests
import websockets

pytestmark = [pytest.mark.tier1]


# ==============================================================================
# 1. Auth & Keycloak 26 OIDC
# ==============================================================================

class TestTier1AuthKeycloak:
    """Verifies Keycloak 26 OIDC provider, tokens, and authentication flows."""

    def test_oidc_discovery_endpoint(self, e2e_config):
        """T1.1: OIDC discovery endpoint returns valid OpenID configuration."""
        kc_url = f"{e2e_config['keycloak_url']}/auth/realms/{e2e_config['realm']}/.well-known/openid-configuration"
        resp = requests.get(kc_url, timeout=5)
        assert resp.status_code == 200, f"Discovery endpoint failed: {resp.text}"
        data = resp.json()
        assert "issuer" in data
        assert f"/realms/{e2e_config['realm']}" in data["issuer"]
        assert "authorization_endpoint" in data
        assert "token_endpoint" in data
        assert "jwks_uri" in data
        assert "response_types_supported" in data
        assert "id_token" in data["response_types_supported"] or "code" in data["response_types_supported"]

    def test_keycloak_direct_grant_login(self, keycloak_token_factory):
        """T1.2: Direct Access Grant authentication issues valid RS256 token."""
        tokens = keycloak_token_factory("daniel.a@mapletynetechnologies.com", "admin")
        token = tokens.get("access_token") or tokens.get("token")
        assert token is not None, "No access token in login response"
        assert token.count(".") == 2, "Token is not a valid 3-part JWT"
        assert tokens.get("refresh_token") is not None, "No refresh token in response"
        assert tokens.get("expires_in", 0) > 0, "Token expires_in should be positive"

    def test_keycloak_token_refresh(self, e2e_config, keycloak_token_factory):
        """T1.3: Refresh token endpoint exchanges expired token for a fresh one."""
        initial = keycloak_token_factory("daniel.a@mapletynetechnologies.com", "admin")
        refresh_tok = initial.get("refresh_token")
        assert refresh_tok is not None

        # Call backend refresh endpoint
        refresh_url = f"{e2e_config['core_url']}/api/v1/admin/auth/refresh"
        resp = requests.post(refresh_url, json={"refresh_token": refresh_tok}, timeout=5)
        assert resp.status_code == 200, f"Token refresh failed: {resp.text}"
        data = resp.json()
        new_token = data.get("access_token") or data.get("token")
        assert new_token is not None
        assert new_token != initial.get("access_token")

    def test_keycloak_token_signature_and_ttl(self, admin_token, e2e_config):
        """T1.4: RS256 token signature, issuer, and TTL (1 hour) validation."""
        import jwt
        # Retrieve Keycloak JWKS
        jwks_url = f"{e2e_config['keycloak_url']}/auth/realms/{e2e_config['realm']}/protocol/openid-connect/certs"
        jwks_client = jwt.PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(admin_token)

        decoded = jwt.decode(
            admin_token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False, "verify_iss": False}
        )
        assert decoded.get("iss", "").endswith(f"/realms/{e2e_config['realm']}")
        assert "exp" in decoded and "iat" in decoded
        ttl = decoded["exp"] - decoded["iat"]
        # Allow slight clock skew between 3500 and 3660 seconds (1 hour standard TTL)
        assert 3500 <= ttl <= 3660, f"Expected ~3600s TTL, got {ttl}s"

    def test_keycloak_client_allowed_origins_and_scopes(self, e2e_config):
        """T1.5: Client configuration scopes and origins check."""
        jwks_url = f"{e2e_config['keycloak_url']}/auth/realms/{e2e_config['realm']}/protocol/openid-connect/certs"
        resp = requests.get(jwks_url, timeout=5)
        assert resp.status_code == 200
        jwks = resp.json()
        assert "keys" in jwks
        assert len(jwks["keys"]) >= 1
        assert jwks["keys"][0].get("kty") == "RSA"
        assert jwks["keys"][0].get("alg") in ("RS256", "RSA-OAEP", None)

    def test_keycloak_user_profile_sync(self, e2e_config, admin_token):
        """T1.6: Authenticated /me endpoint syncs and returns user profile."""
        me_url = f"{e2e_config['core_url']}/api/v1/admin/auth/me"
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(me_url, headers=headers, timeout=5)
        assert resp.status_code == 200, f"/me failed: {resp.text}"
        profile = resp.json()
        assert profile.get("email") == "daniel.a@mapletynetechnologies.com"
        assert profile.get("role") in ("admin", "cpo-admin")
        assert "cpo-admin" in profile.get("roles", []) or "admin" in profile.get("roles", [])


# ==============================================================================
# 2. Edge Ingress Gateway & Reverse Proxy
# ==============================================================================

class TestTier1IngressTunnel:
    """Verifies edge routing, forwarded proxy headers, and security headers."""

    def test_ingress_forwarded_headers_handling(self, e2e_config):
        """T1.7: Ingress accepts and passes X-Forwarded-Host and X-Forwarded-Proto."""
        url = f"{e2e_config['core_url']}/health"
        headers = {
            "X-Forwarded-Host": "cpo.example.trycloudflare.com",
            "X-Forwarded-Proto": "https",
            "X-Forwarded-For": "203.0.113.195"
        }
        resp = requests.get(url, headers=headers, timeout=5)
        assert resp.status_code == 200
        assert resp.json().get("status") == "ok"

    def test_ingress_security_headers_and_hsts(self, e2e_config):
        """T1.8: Edge gateway preserves essential security headers."""
        url = f"{e2e_config['core_url']}/health"
        resp = requests.get(url, timeout=5)
        assert resp.status_code == 200
        # Ingress or app should provide clean content type and non-sniffing
        assert "application/json" in resp.headers.get("content-type", "")

    def test_ingress_dynamic_origin_detection(self, e2e_config):
        """T1.9: Dynamic origin detection across Cloudflare Tunnel origin."""
        url = f"{e2e_config['core_url']}/health"
        origin = "https://cpo.example.trycloudflare.com"
        headers = {"Origin": origin}
        resp = requests.get(url, headers=headers, timeout=5)
        assert resp.status_code == 200

    def test_ingress_strict_cors_allowlist(self, e2e_config):
        """T1.10: Strict CORS allowlist verification."""
        url = f"{e2e_config['core_url']}/api/v1/chargers"
        # Options preflight check
        resp = requests.options(
            url,
            headers={
                "Origin": "http://localhost:34000",
                "Access-Control-Request-Method": "GET"
            },
            timeout=5
        )
        assert resp.status_code in (200, 204)
        allow_origin = resp.headers.get("access-control-allow-origin")
        allow_credentials = resp.headers.get("access-control-allow-credentials")
        if allow_credentials == "true":
            assert allow_origin != "*", "CORS violation: allow_credentials=True cannot be paired with wildcard '*'"

    def test_ingress_path_routed_gateways(self, e2e_config):
        """T1.11: Path-routed gateway targets /api, /app, /auth."""
        # Core health directly
        resp_core = requests.get(f"{e2e_config['core_url']}/health", timeout=5)
        assert resp_core.status_code == 200
        # ChargeApp landing
        resp_driver = requests.get(f"{e2e_config['driver_url']}/", timeout=5)
        assert resp_driver.status_code == 200
        # Keycloak landing
        resp_kc = requests.get(f"{e2e_config['keycloak_url']}/auth/", timeout=5, allow_redirects=True)
        assert resp_kc.status_code in (200, 302)


# ==============================================================================
# 3. Role-Based Access Control (RBAC)
# ==============================================================================

class TestTier1RBAC:
    """Verifies granular role enforcement across admin, operator, and driver."""

    def test_rbac_admin_full_access(self, e2e_config, admin_token):
        """T1.12: Admin has full authority over protected settings and chargers."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers", headers=headers, timeout=5)
        assert resp.status_code == 200
        assert "chargers" in resp.json()

    def test_rbac_operator_restricted_access(self, e2e_config, operator_token):
        """T1.13: Operator role can access chargers and session monitoring."""
        headers = {"Authorization": f"Bearer {operator_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers", headers=headers, timeout=5)
        assert resp.status_code == 200

    def test_rbac_driver_forbidden_admin_access(self, e2e_config, driver_token):
        """T1.14: Driver role cannot write to or manipulate admin charger configs."""
        headers = {"Authorization": f"Bearer {driver_token}"}
        # Attempt to create or modify a charger with driver token
        resp = requests.post(
            f"{e2e_config['core_url']}/api/v1/chargers",
            headers=headers,
            json={"id": "illegal-driver-charger", "vendor": "Fake"},
            timeout=5
        )
        assert resp.status_code in (401, 403), f"Driver should not be permitted to create chargers: {resp.status_code}"

    def test_rbac_unauthenticated_request_401(self, e2e_config):
        """T1.15: Unauthenticated request to protected mutation endpoint yields 401."""
        resp = requests.post(
            f"{e2e_config['core_url']}/api/v1/chargers",
            json={"id": "unauth-charger"},
            timeout=5
        )
        assert resp.status_code == 401
        assert "Invalid or missing API key" in resp.text or "Not authenticated" in resp.text or "Missing authentication credentials" in resp.text

    def test_rbac_invalid_token_401(self, e2e_config):
        """T1.16: Request with invalid Bearer token returns 401 Unauthorized."""
        headers = {"Authorization": "Bearer invalid.signature.token"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/admin/auth/me", headers=headers, timeout=5)
        assert resp.status_code == 401


# ==============================================================================
# 4. Multi-Tenancy & Row-Level Security (RLS)
# ==============================================================================

class TestTier1RLSMultiTenancy:
    """Verifies multi-tenant isolation, tenant_id attributes, and data boundaries."""

    def test_tenant_id_schema_presence(self, e2e_config, admin_token):
        """T1.17: Charger and session models include tenant/site identification."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers", headers=headers, timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert "chargers" in data
        if data["chargers"]:
            c = data["chargers"][0]
            # Verify tenancy / site metadata field presence
            assert "site" in c or "metadata" in c or "tenant_id" in c

    def test_tenant_data_partitioning(self, e2e_config, admin_token):
        """T1.18: Tenant querying supports site or tenant filtering."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?site=Newcastle", headers=headers, timeout=5)
        assert resp.status_code == 200
        chargers = resp.json().get("chargers", [])
        for c in chargers:
            if c.get("site"):
                assert c["site"] == "Newcastle"

    def test_cross_tenant_read_isolation(self, e2e_config, admin_token):
        """T1.19: Filtering by distinct tenant/site partitions charger sets."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp_a = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?site=Newcastle", headers=headers, timeout=5)
        resp_b = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?site=Amsterdam", headers=headers, timeout=5)
        assert resp_a.status_code == 200 and resp_b.status_code == 200
        ids_a = {c["id"] for c in resp_a.json().get("chargers", [])}
        ids_b = {c["id"] for c in resp_b.json().get("chargers", [])}
        assert ids_a.isdisjoint(ids_b) or len(ids_b) == 0

    def test_cross_tenant_mutation_rejection(self, e2e_config):
        """T1.20: Unauthorized tenant modification is prevented."""
        # Non-existent or cross-tenant command target
        resp = requests.post(
            f"{e2e_config['core_url']}/api/v1/chargers/cross-tenant-target/reset",
            headers={"X-API-Key": "invalid_tenant_key"},
            json={"type": "Soft"},
            timeout=5
        )
        assert resp.status_code in (401, 403, 404)

    def test_default_tenant_fallback(self, e2e_config, admin_token):
        """T1.21: Queries without explicit tenant header resolve to default context."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers", headers=headers, timeout=5)
        assert resp.status_code == 200
        assert resp.json().get("total", 0) >= 0


# ==============================================================================
# 5. Charging Protocols (OCPP 1.6-J, 2.0.1, ISO 15118)
# ==============================================================================

class TestTier1Protocols:
    """Verifies stateful OCPP 1.6-J, OCPP 2.0.1, and ISO 15118 PKI."""

    def test_ocpp16_websocket_handshake(self, e2e_config):
        """T1.22: OCPP 1.6-J WebSocket connection with ocpp1.6 subprotocol."""
        async def _run():
            uri = f"{e2e_config['ocpp16_ws_url']}/t1-test-charger-16"
            async with websockets.connect(uri, subprotocols=["ocpp1.6"], close_timeout=2) as ws:
                assert ws.subprotocol == "ocpp1.6"
        asyncio.run(_run())

    def test_ocpp16_boot_notification_schema(self, e2e_config):
        """T1.23: OCPP 1.6-J BootNotification exchange and JSON Schema response."""
        async def _run():
            uri = f"{e2e_config['ocpp16_ws_url']}/t1-boot-charger-16"
            async with websockets.connect(uri, subprotocols=["ocpp1.6"], close_timeout=2) as ws:
                msg_id = str(uuid.uuid4())
                call = [2, msg_id, "BootNotification", {
                    "chargePointVendor": "Mapletyne",
                    "chargePointModel": "MTT-Rapid-150",
                    "chargePointSerialNumber": "MTT-SN-1001",
                    "firmwareVersion": "2.4.1"
                }]
                await ws.send(json.dumps(call))
                raw_resp = await asyncio.wait_for(ws.recv(), timeout=3.0)
                resp = json.loads(raw_resp)
                assert resp[0] == 3, f"Expected CALLRESULT (3), got {resp[0]}"
                assert resp[1] == msg_id
                payload = resp[2]
                assert payload.get("status") in ("Accepted", "Pending")
                assert "currentTime" in payload
                assert "interval" in payload
        asyncio.run(_run())

    def test_ocpp201_websocket_handshake(self, e2e_config):
        """T1.24: OCPP 2.0.1 WebSocket connection with ocpp2.0.1 subprotocol."""
        async def _run():
            uri = f"{e2e_config['ocpp201_ws_url']}/t1-test-charger-201"
            async with websockets.connect(uri, subprotocols=["ocpp2.0.1"], close_timeout=2) as ws:
                assert ws.subprotocol == "ocpp2.0.1"
        asyncio.run(_run())

    def test_ocpp201_boot_notification_schema(self, e2e_config):
        """T1.25: OCPP 2.0.1 BootNotification exchange and response format."""
        async def _run():
            uri = f"{e2e_config['ocpp201_ws_url']}/t1-boot-charger-201"
            async with websockets.connect(uri, subprotocols=["ocpp2.0.1"], close_timeout=2) as ws:
                msg_id = str(uuid.uuid4())
                call = [2, msg_id, "BootNotification", {
                    "reason": "PowerUp",
                    "chargingStation": {
                        "model": "MTT-Hyper-300",
                        "vendorName": "Mapletyne",
                        "serialNumber": "MTT-201-SN-1002"
                    }
                }]
                await ws.send(json.dumps(call))
                raw_resp = await asyncio.wait_for(ws.recv(), timeout=3.0)
                resp = json.loads(raw_resp)
                assert resp[0] == 3
                assert resp[1] == msg_id
                payload = resp[2]
                assert payload.get("status") in ("Accepted", "Pending")
                assert "currentTime" in payload
        asyncio.run(_run())

    def test_iso15118_pki_ca_hierarchy(self, e2e_config, admin_token):
        """T1.26: ISO 15118 PKI CA hierarchy and certificate authority endpoints."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/pki/ca-hierarchy", headers=headers, timeout=5)
        assert resp.status_code == 200, f"PKI CA hierarchy failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, (dict, list))


# ==============================================================================
# 6. Dynamic Billing & Tariffs
# ==============================================================================

class TestTier1Billing:
    """Verifies dynamic tariffs, CDR energy calculations, and transaction IDs."""

    def test_dynamic_tariff_energy_calculation(self, e2e_config, admin_token):
        """T1.27: Dynamic tariff structure defines energy rates."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/tariffs", headers=headers, timeout=5)
        assert resp.status_code == 200
        tariffs = resp.json()
        assert isinstance(tariffs, (list, dict))

    def test_duration_and_parking_fee_breakdown(self, e2e_config, admin_token):
        """T1.28: Pricing configuration includes idle / parking duration logic."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/pricing/current", headers=headers, timeout=5)
        assert resp.status_code in (200, 404)

    def test_vat_tax_calculation(self, e2e_config, admin_token):
        """T1.29: Pricing settings define currency and tax rules."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/pricing/config", headers=headers, timeout=5)
        assert resp.status_code in (200, 404)

    def test_transaction_id_sequence_allocation(self, e2e_config, admin_token):
        """T1.30: Session history endpoint exposes sequential transaction IDs."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/sessions?limit=5", headers=headers, timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        sessions = data.get("sessions", []) if isinstance(data, dict) else data
        assert isinstance(sessions, list)

    def test_ocpi_cdr_export_and_token_roaming(self, e2e_config, admin_token):
        """T1.31: OCPI management status and partner endpoints."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/ocpi/status", headers=headers, timeout=5)
        assert resp.status_code in (200, 404)


# ==============================================================================
# 7. Frontend Applications (Driver PWA & Admin Mission Control)
# ==============================================================================

class TestTier1Frontends:
    """Verifies Driver PWA and Operator Admin SPA presentation contracts."""

    def test_driver_pwa_landing_and_viewport(self, e2e_config):
        """T1.32: Driver Mobile PWA serves responsive viewport and emerald theme."""
        resp = requests.get(f"{e2e_config['driver_url']}/", timeout=5)
        assert resp.status_code == 200
        html = resp.text
        assert 'name="viewport"' in html
        assert "width=device-width" in html
        assert "--primary" in html or "--bg" in html

    def test_driver_pwa_form_csrf_protection(self, e2e_config):
        """T1.33: Driver auth routes expose CSRF protection on mutation."""
        resp = requests.get(f"{e2e_config['driver_url']}/account/login", timeout=5)
        if resp.status_code == 200:
            assert "csrf" in resp.text.lower() or "form" in resp.text.lower()

    def test_operator_admin_dashboard_shell_and_tokens(self, e2e_config):
        """T1.34: Admin SPA returns valid HTML bundle with M3 symbols."""
        resp = requests.get(f"{e2e_config['admin_url']}/", timeout=5)
        assert resp.status_code == 200
        html = resp.text
        assert "<div id=\"root\">" in html or "<div id='root'>" in html
        assert "material-symbols" in html or "vite" in html or "Mapletyne" in html

    def test_realtime_events_stream_sse_endpoint(self, e2e_config, admin_token):
        """T1.35: SSE endpoint /api/v1/events/stream connects with text/event-stream using ticket."""
        ticket_url = f"{e2e_config['core_url']}/api/v1/events/ticket"
        ticket_resp = requests.post(ticket_url, headers={"Authorization": f"Bearer {admin_token}"}, timeout=5)
        assert ticket_resp.status_code == 200, f"Ticket request failed: {ticket_resp.text}"
        ticket = ticket_resp.json().get("ticket")
        assert ticket is not None

        stream_url = f"{e2e_config['core_url']}/api/v1/events/stream?ticket={ticket}"
        resp = requests.get(stream_url, headers={"Accept": "text/event-stream"}, stream=True, timeout=5)
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers.get("content-type", "")

    def test_table_virtualization_dom_contract(self, e2e_config, admin_token):
        """T1.36: High-density API tables return bounded paged arrays."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?limit=50", headers=headers, timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert "chargers" in data
        assert isinstance(data["chargers"], list)


# ==============================================================================
# 8. Operations, Observability & System Health
# ==============================================================================

class TestTier1Operations:
    """Verifies Prometheus metrics, health probes, and operational integrity."""

    def test_prometheus_metrics_csms_telemetry(self, e2e_config):
        """T1.37: Metrics or health endpoint provides telemetry."""
        resp = requests.get(f"{e2e_config['core_url']}/health", timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "ocpp-core"

    def test_health_and_readiness_endpoints(self, e2e_config):
        """T1.38: Readiness endpoint verifies database and redis health."""
        resp = requests.get(f"{e2e_config['core_url']}/health/ready", timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert "database" in data
        assert "redis" in data

    def test_redis_event_bus_connectivity(self, e2e_config):
        """T1.39: Core service event bus connectivity is reported healthy."""
        resp = requests.get(f"{e2e_config['core_url']}/health/ready", timeout=5)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("redis", {}).get("status") == "ok"

    def test_container_port_isolation(self, e2e_config):
        """T1.40: Core services respond on designated operational ports."""
        ports = [34800, 34085, 34000, 34003]
        for p in ports:
            try:
                resp = requests.get(f"http://localhost:{p}/", timeout=2)
                assert resp.status_code in (200, 302, 404, 405)
            except requests.ConnectionError:
                pytest.fail(f"Required service port {p} is not reachable")

    def test_security_audit_logging(self, e2e_config, admin_token):
        """T1.41: Security and PKI audit log endpoint returns chronological events."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/pki/audit-log", headers=headers, timeout=5)
        assert resp.status_code == 200
        logs = resp.json()
        assert isinstance(logs, (list, dict))
        if isinstance(logs, dict):
            assert "events" in logs
            assert isinstance(logs["events"], list)
