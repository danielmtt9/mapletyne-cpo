"""
OCPP 1.6j WebSocket Server.

Accepts charger connections, routes messages to handler.
"""
import asyncio
import logging
import ssl
from pathlib import Path
from typing import Callable

import websockets
from websockets.asyncio.server import ServerConnection

from config import config

logger = logging.getLogger(__name__)


class OCPP16Server:
    """OCPP 1.6j WebSocket server."""

    def __init__(self, on_connect: Callable, on_disconnect: Callable):
        self._on_connect = on_connect
        self._on_disconnect = on_disconnect
        self._connections: dict[str, ServerConnection] = {}
        self._server = None

    def _build_ssl_context(self) -> ssl.SSLContext | None:
        """Build TLS context for OCPP security profile 2/3."""
        pki_dir = Path(config.pki.data_dir)
        server_cert = pki_dir / "server.crt"
        server_key = pki_dir / "server.key"
        ca_cert = pki_dir / "root-ca.crt"

        if not server_cert.exists():
            logger.info("No TLS certs found — running without TLS (security profile 1)")
            return None

        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(str(server_cert), str(server_key))

        if ca_cert.exists():
            # Security profile 3: mutual TLS (verify client cert)
            ctx.load_verify_locations(str(ca_cert))
            ctx.verify_mode = ssl.CERT_OPTIONAL  # Optional — not all chargers have certs yet
            logger.info("TLS enabled with client cert verification (security profile 3)")
        else:
            logger.info("TLS enabled without client cert verification (security profile 2)")

        return ctx

    async def serve(self) -> None:
        """Start the WebSocket server."""
        ssl_context = self._build_ssl_context()

        self._server = await websockets.serve(
            self._handler,
            config.ocpp.ocpp16_host,
            config.ocpp.ocpp16_port,
            subprotocols=["ocpp1.6"],
            ssl=ssl_context,
            ping_interval=None,  # Disable WS pings — use OCPP heartbeats instead (Maxpower doesn't respond to WS pings)
            ping_timeout=None,
            max_size=65536,
            logger=logger,
        )

        scheme = "wss" if ssl_context else "ws"
        logger.info(
            f"OCPP 1.6j server listening on "
            f"{scheme}://{config.ocpp.ocpp16_host}:{config.ocpp.ocpp16_port}"
        )
        await self._server.wait_closed()

    async def _handler(self, websocket: ServerConnection) -> None:
        """Handle a new charger connection."""
        # Extract charge point ID from URL path: /ocpp/CP001 → CP001
        path = websocket.request.path if websocket.request else ""
        cp_id = path.strip("/").split("/")[-1] if path else "unknown"

        # Verify subprotocol
        if websocket.subprotocol != "ocpp1.6":
            logger.warning(f"Rejected {cp_id}: wrong subprotocol {websocket.subprotocol}")
            await websocket.close(1002, "Subprotocol not supported")
            return

        logger.info(f"Charger connected: {cp_id} (OCPP 1.6j)")
        self._connections[cp_id] = websocket

        try:
            # on_connect handles the message loop
            await self._on_connect(cp_id, websocket)

        except websockets.exceptions.ConnectionClosed as e:
            logger.info(f"Charger disconnected: {cp_id} (code={e.code})")
        except Exception as e:
            logger.error(f"Error handling {cp_id}: {e}", exc_info=True)
        finally:
            self._connections.pop(cp_id, None)
            await self._on_disconnect(cp_id)

    async def send_to(self, cp_id: str, message: str) -> bool:
        """Send a message to a specific charge point."""
        ws = self._connections.get(cp_id)
        if ws is None:
            return False
        try:
            await ws.send(message)
            return True
        except Exception:
            return False

    def is_connected(self, cp_id: str) -> bool:
        return cp_id in self._connections

    @property
    def connected_count(self) -> int:
        return len(self._connections)

    async def stop(self) -> None:
        if self._server:
            self._server.close()
            await self._server.wait_closed()
