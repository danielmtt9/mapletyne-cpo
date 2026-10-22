"""
Shared pytest fixtures and test infrastructure for Mapletyne MTT Charge CPO E2E tests.
Provides FastMCP client, HTTP health verification, and Penpot canvas inspection utilities.
"""

import os
import json
import time
import urllib.request
import subprocess
import pytest
from typing import Dict, List, Any

DEFAULT_MCP_URL = os.environ.get("PENPOT_MCP_URL", "http://localhost:8787/mcp")
DEFAULT_PENPOT_BASE = os.environ.get("PENPOT_BASE_URL", "http://localhost:15050")
FILE_ID = os.environ.get("PENPOT_FILE_ID", "b0861d9d-6919-8015-8008-d266309e53fd")
PAGE_ID = os.environ.get("PENPOT_PAGE_ID", "b0861d9d-6919-8015-8008-d266309e53fe")
PROJECT_ID = os.environ.get("PENPOT_PROJECT_ID", "b0861d9d-6919-8015-8008-d26610b454c5")
CANVAS_URL = f"{DEFAULT_PENPOT_BASE}/#/workspace/{PROJECT_ID}/{FILE_ID}"
PREVIEWS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../docs/designs/previews")
)

# Canonical tokens
M3_SEED_EMERALD = "#006948"
M3_DARK_CANVAS = "#0B0F19"
M3_LIGHT_CANVAS = "#F8FAFC"
M3_DARK_SURFACE = "#0F172A"
M3_DARK_SURFACE_CONTAINER = "rgba(23, 35, 53, 0.75)"
M3_ACCENT_HIGHLIGHT = "#48E260"
M3_DARK_PRIMARY = "#6EDBAA"

class PenpotMCPTestClient:
    """Streamable FastMCP JSON-RPC Client for Penpot testing."""
    def __init__(self, base_url: str = DEFAULT_MCP_URL):
        self.base_url = base_url
        self.session_id = None
        self._init_session()

    def _init_session(self):
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "penpot-e2e-tester", "version": "1.0"}
            }
        }
        req = urllib.request.Request(
            self.base_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "Accept": "text/event-stream, application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            self.session_id = resp.headers.get("mcp-session-id")

        notif = {"jsonrpc": "2.0", "method": "notifications/initialized"}
        req_notif = urllib.request.Request(
            self.base_url,
            data=json.dumps(notif).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream, application/json",
                "mcp-session-id": self.session_id
            }
        )
        urllib.request.urlopen(req_notif, timeout=10)

    def call_tool(self, name: str, args: Dict[str, Any]) -> Any:
        payload = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000) % 1000000,
            "method": "tools/call",
            "params": {"name": name, "arguments": args}
        }
        req = urllib.request.Request(
            self.base_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Accept": "text/event-stream, application/json",
                "mcp-session-id": self.session_id
            }
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read().decode("utf-8")
            for line in data.splitlines():
                if line.startswith("data: "):
                    parsed = json.loads(line[6:])
                    result = parsed.get("result", {})
                    if "content" in result and len(result["content"]) > 0:
                        text = result["content"][0]["text"]
                        try:
                            return json.loads(text)
                        except Exception:
                            return text
                    return result
        return None

    def get_frames(self, file_id: str = FILE_ID, page_id: str = PAGE_ID) -> List[Dict[str, Any]]:
        result = self.call_tool("get_page_objects", {
            "file_id": file_id,
            "page_id": page_id,
            "shape_type": "frame"
        })
        if isinstance(result, list):
            # Filter out root 0.01x0.01 frame
            return [f for f in result if f.get("width", 0) > 1.0 and f.get("height", 0) > 1.0]
        return []

    def get_all_shapes(self, file_id: str = FILE_ID, page_id: str = PAGE_ID) -> List[Dict[str, Any]]:
        result = self.call_tool("get_page_objects", {
            "file_id": file_id,
            "page_id": page_id
        })
        if isinstance(result, list):
            return [o for o in result if o is not None]
        return []


@pytest.fixture(scope="session")
def mcp_client():
    """Initializes and provides FastMCP client for the test session."""
    client = PenpotMCPTestClient()
    return client


@pytest.fixture(scope="session")
def canvas_frames(mcp_client):
    """Fetches all top-level artboard frames from the target file."""
    frames = mcp_client.get_frames(FILE_ID, PAGE_ID)
    return frames


@pytest.fixture(scope="session")
def canvas_shapes(mcp_client):
    """Fetches all shapes on the target page."""
    shapes = mcp_client.get_all_shapes(FILE_ID, PAGE_ID)
    return shapes


@pytest.fixture(scope="session")
def critic_evaluation():
    """Executes penpot-verify with --json and returns parsed report."""
    cmd = [
        "penpot-verify",
        "--file-id", FILE_ID,
        "--page-id", PAGE_ID,
        "--project-id", PROJECT_ID,
        "--json"
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
    stdout = proc.stdout

    # Locate the JSON block in stdout
    json_start = stdout.find("{\n  \"file_id\"")
    if json_start == -1:
        json_start = stdout.find("{\"file_id\"")
    if json_start != -1:
        data = json.loads(stdout[json_start:])
        data["returncode"] = proc.returncode
        return data

    return {"error": "JSON block not found in penpot-verify output", "raw": stdout, "returncode": proc.returncode}


# ==============================================================================
# Mapletyne MTT Charge CPO Platform E2E Test Fixtures & Topology
# ==============================================================================

import requests
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

CORE_BASE_URL = os.environ.get("CORE_BASE_URL", "http://localhost:34800").rstrip("/")
INGRESS_BASE_URL = os.environ.get("INGRESS_BASE_URL", "http://localhost:34080").rstrip("/")
KEYCLOAK_BASE_URL = os.environ.get("KEYCLOAK_BASE_URL", "http://localhost:34085").rstrip("/")
ADMIN_BASE_URL = os.environ.get("ADMIN_BASE_URL", "http://localhost:34000").rstrip("/")
DRIVER_BASE_URL = os.environ.get("DRIVER_BASE_URL", "http://localhost:34003").rstrip("/")
OCPP16_WS_URL = os.environ.get("OCPP16_WS_URL", "ws://localhost:34100").rstrip("/")
OCPP201_WS_URL = os.environ.get("OCPP201_WS_URL", "ws://localhost:34201").rstrip("/")
MGMT_API_KEY = os.environ.get("MANAGEMENT_API_KEY", "opencpo_mgmt_api_91d4e021a8dcf8a3c9b7")
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "opencpo")


@pytest.fixture(scope="session")
def e2e_config() -> Dict[str, str]:
    """Returns platform base URLs and endpoint configuration."""
    return {
        "core_url": CORE_BASE_URL,
        "ingress_url": INGRESS_BASE_URL,
        "keycloak_url": KEYCLOAK_BASE_URL,
        "admin_url": ADMIN_BASE_URL,
        "driver_url": DRIVER_BASE_URL,
        "ocpp16_ws_url": OCPP16_WS_URL,
        "ocpp201_ws_url": OCPP201_WS_URL,
        "mgmt_api_key": MGMT_API_KEY,
        "realm": KEYCLOAK_REALM,
    }


@pytest.fixture(scope="session")
def keycloak_token_factory(e2e_config):
    """Factory fixture returning a function to authenticate against Keycloak Direct Grant."""
    def _authenticate(username: str, password: str, client_id: str = "opencpo-admin-ui") -> Dict[str, Any]:
        url = f"{e2e_config['core_url']}/api/v1/admin/auth/login"
        payload = {"email": username, "password": password}
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        
        # Fallback to direct Keycloak token endpoint
        kc_url = f"{e2e_config['keycloak_url']}/auth/realms/{e2e_config['realm']}/protocol/openid-connect/token"
        form_data = {
            "grant_type": "password",
            "client_id": client_id,
            "username": username,
            "password": password,
        }
        kc_resp = requests.post(kc_url, data=form_data, timeout=10)
        if kc_resp.status_code == 200:
            return kc_resp.json()
        raise ValueError(f"Authentication failed for {username}: status {resp.status_code} / {kc_resp.status_code}")

    return _authenticate


@pytest.fixture(scope="session")
def admin_token(keycloak_token_factory) -> str:
    """Authenticates as platform administrator and returns RS256 JWT access token."""
    try:
        data = keycloak_token_factory("daniel.a@mapletynetechnologies.com", "admin")
        return data.get("access_token") or data.get("token")
    except Exception as exc:
        pytest.skip(f"Admin authentication unavailable: {exc}")


@pytest.fixture(scope="session")
def operator_token(keycloak_token_factory) -> str:
    """Authenticates as site operator and returns RS256 JWT access token."""
    try:
        data = keycloak_token_factory("operator@opencpo.com", "operator123")
        return data.get("access_token") or data.get("token")
    except Exception as exc:
        pytest.skip(f"Operator authentication unavailable: {exc}")


@pytest.fixture(scope="session")
def driver_token(keycloak_token_factory) -> str:
    """Authenticates as EV driver and returns RS256 JWT access token."""
    try:
        data = keycloak_token_factory("driver@opencpo.com", "driver123")
        return data.get("access_token") or data.get("token")
    except Exception as exc:
        pytest.skip(f"Driver authentication unavailable: {exc}")


@pytest.fixture(scope="session")
def rsa_test_keypair():
    """Generates an in-memory 2048-bit RSA keypair for adversarial JWT tests."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    pem_public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return {
        "private_key": private_key,
        "public_key": public_key,
        "pem_private": pem_private,
        "pem_public": pem_public,
    }


@pytest.fixture(scope="session")
def jwt_test_generator(rsa_test_keypair, e2e_config):
    """Helper fixture to mint custom JWTs with configurable claims and headers."""
    def _generate(
        claims: Dict[str, Any] = None,
        headers: Dict[str, Any] = None,
        key: Any = None,
        algorithm: str = "RS256"
    ) -> str:
        now = datetime.now(timezone.utc)
        default_claims = {
            "sub": "test-user-uuid",
            "iss": f"{e2e_config['keycloak_url']}/auth/realms/{e2e_config['realm']}",
            "azp": "opencpo-admin-ui",
            "aud": ["opencpo-admin-ui"],
            "realm_access": {"roles": ["cpo-admin"]},
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
        }
        if claims:
            default_claims.update(claims)
        default_headers = {"kid": "test-key-id-1"}
        if headers:
            default_headers.update(headers)
        
        signing_key = key if key is not None else rsa_test_keypair["pem_private"]
        return pyjwt.encode(
            default_claims,
            signing_key,
            algorithm=algorithm,
            headers=default_headers
        )

    return _generate


@pytest.fixture(scope="session")
def pg_connection():
    """Provides a psycopg2 connection to the PostgreSQL database if available."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            dbname="ocpp",
            user="ocpp",
            password="opencpo_db_pass_2026",
            connect_timeout=3
        )
        yield conn
        conn.close()
    except Exception as exc:
        pytest.skip(f"PostgreSQL connection to port 5432 unavailable: {exc}")


@pytest.fixture(autouse=True)
def isolated_test_client_ip(monkeypatch, request):
    """Assigns an isolated client IP per test to prevent rate limiter exhaustion across large test suites."""
    test_num = abs(hash(request.node.nodeid)) % 240 + 10
    test_ip = f"10.200.1.{test_num}"

    orig_request = requests.Session.request

    def patched_request(self, method, url, *args, **kwargs):
        headers = kwargs.get("headers")
        if headers is None:
            kwargs["headers"] = {"X-Forwarded-For": test_ip}
        elif isinstance(headers, dict) and "X-Forwarded-For" not in headers:
            headers["X-Forwarded-For"] = test_ip
        return orig_request(self, method, url, *args, **kwargs)

    monkeypatch.setattr(requests.Session, "request", patched_request)
