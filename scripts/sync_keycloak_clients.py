#!/usr/bin/env python3
"""
Synchronize Keycloak 26 Clients (GAP-SEC-16 & R1 Keycloak Hardening)

Dynamically configures OAuth2/OIDC clients ('opencpo-admin-ui', 'opencpo-charge-app',
'mapletyne-admin', 'mapletyne-chargeapp') in Keycloak with exact redirect URIs and
webOrigins without wildcard '*', supporting reverse proxies, Cloudflare Tunnel domains,
and localhost development.
"""
import asyncio
import logging
import os
import sys
from typing import Dict, List, Set, Any
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync_keycloak_clients")

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:34085/auth").rstrip("/")
# If running inside Docker container or host
if "keycloak:8080" in KEYCLOAK_URL and not os.path.exists("/.dockerenv"):
    KEYCLOAK_URL = "http://localhost:34085/auth"

KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "opencpo")
KEYCLOAK_ADMIN = os.getenv("KEYCLOAK_ADMIN", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "admin")


def get_base_origins() -> Set[str]:
    """Collect base origins from environment variables without wildcard '*'."""
    origins: Set[str] = {
        "http://localhost:34000",
        "http://localhost:34080",
        "http://localhost:34003",
        "http://localhost:5173",
        "http://127.0.0.1:34000",
        "http://127.0.0.1:34080",
        "http://127.0.0.1:34003",
        "https://admin.mapletyne.com",
        "https://app.mapletyne.com",
        "https://opencpo.mapletyne.com",
        "https://api.mapletyne.com",
        "https://*.trycloudflare.com",
        "https://*.mapletyne.com",
    }

    env_vars = ["PUBLIC_BASE_URL", "PUBLIC_URL", "CHARGE_APP_URL", "CORE_API_PUBLIC_URL", "CPO_ADMIN_URL"]
    for var in env_vars:
        val = os.getenv(var)
        if val:
            clean = val.strip().rstrip("/")
            if clean and clean != "*":
                origins.add(clean)

    cors = os.getenv("CORS_ORIGINS", "")
    for o in cors.split(","):
        clean = o.strip().rstrip("/")
        if clean and clean != "*":
            origins.add(clean)

    return origins


async def get_admin_token(client: httpx.AsyncClient) -> str:
    """Acquire admin CLI token with exponential backoff retry."""
    token_url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id": "admin-cli",
        "username": KEYCLOAK_ADMIN,
        "password": KEYCLOAK_ADMIN_PASSWORD,
    }

    for attempt in range(1, 10):
        try:
            resp = await client.post(token_url, data=data, timeout=10.0)
            if resp.status_code == 200:
                return resp.json()["access_token"]
            logger.warning(f"Attempt {attempt}: Keycloak admin login returned {resp.status_code}")
        except Exception as e:
            logger.warning(f"Attempt {attempt}: Failed connecting to Keycloak at {token_url}: {e}")
        await asyncio.sleep(min(2 ** attempt, 10))

    raise RuntimeError("Unable to authenticate with Keycloak Admin REST API after multiple attempts")


async def sync_clients() -> None:
    logger.info(f"Synchronizing Keycloak clients for realm '{KEYCLOAK_REALM}' at {KEYCLOAK_URL}...")
    origins = get_base_origins()
    redirect_uris: List[str] = sorted([f"{o}/*" for o in origins] + [o for o in origins])

    target_clients = {
        "opencpo-admin-ui": "OpenCPO Mission Control Admin Dashboard",
        "mapletyne-admin": "Mapletyne Mission Control Admin Dashboard",
        "opencpo-charge-app": "OpenCPO Driver Mobile PWA",
        "mapletyne-chargeapp": "Mapletyne Driver Mobile PWA",
    }

    async with httpx.AsyncClient(timeout=15.0) as http_client:
        token = await get_admin_token(http_client)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # List existing realm clients
        clients_url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/clients"
        resp = await http_client.get(clients_url, headers=headers)
        if resp.status_code != 200:
            logger.error(f"Failed to query realm clients: {resp.status_code} {resp.text}")
            return

        existing_clients: List[Dict[str, Any]] = resp.json()
        client_map = {c["clientId"]: c for c in existing_clients if "clientId" in c}

        for client_id, name in target_clients.items():
            if client_id in client_map:
                kc_client = client_map[client_id]
                uuid = kc_client["id"]
                logger.info(f"Updating existing client '{client_id}' (id: {uuid}) with strict redirect URIs")
                update_payload = {
                    **kc_client,
                    "redirectUris": redirect_uris,
                    "webOrigins": ["+"],
                    "publicClient": True,
                    "directAccessGrantsEnabled": True,
                    "standardFlowEnabled": True,
                }
                put_url = f"{clients_url}/{uuid}"
                update_resp = await http_client.put(put_url, json=update_payload, headers=headers)
                if update_resp.status_code in (200, 204):
                    logger.info(f"Successfully updated client '{client_id}'")
                else:
                    logger.error(f"Failed to update client '{client_id}': {update_resp.status_code} {update_resp.text}")
            else:
                logger.info(f"Creating missing client '{client_id}'")
                create_payload = {
                    "clientId": client_id,
                    "name": name,
                    "enabled": True,
                    "publicClient": True,
                    "directAccessGrantsEnabled": True,
                    "standardFlowEnabled": True,
                    "implicitFlowEnabled": False,
                    "serviceAccountsEnabled": False,
                    "fullScopeAllowed": True,
                    "redirectUris": redirect_uris,
                    "webOrigins": ["+"],
                    "defaultClientScopes": ["web-origins", "acr", "roles", "profile", "email"],
                }
                create_resp = await http_client.post(clients_url, json=create_payload, headers=headers)
                if create_resp.status_code in (200, 201, 204):
                    logger.info(f"Successfully created client '{client_id}'")
                else:
                    logger.error(f"Failed to create client '{client_id}': {create_resp.status_code} {create_resp.text}")

    logger.info("Keycloak clients synchronization completed successfully.")


if __name__ == "__main__":
    try:
        asyncio.run(sync_clients())
    except Exception as exc:
        logger.error(f"Keycloak client synchronization failed: {exc}")
        sys.exit(1)
