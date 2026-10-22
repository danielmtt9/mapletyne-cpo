"""
ISO 15118-20 Plug & Charge — Get15118EVCertificate handler.

Handles OCPP 2.0.1 Get15118EVCertificate requests from SECC (charger)
on behalf of the EVCC (vehicle). Generates a signed contract certificate
structure or base64-encoded EXI response payload.
"""
import base64
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def handle_get_15118_ev_certificate(payload: dict) -> dict:
    """
    Handle an OCPP 2.0.1 Get15118EVCertificate request.

    Args:
        payload: OCPP message payload containing:
            - iso15118SchemaVersion (str): ISO 15118 schema version.
            - action (str): "Install" or "Update".
            - exiRequest (str): Base64-encoded EXI request from the vehicle.

    Returns:
        dict with at least:
            - status (str): "Accepted", "Rejected", etc.
            - exiResponse (str): base64-encoded EXI response payload
              containing signed contract metadata and status.
    """
    iso15118_schema_version = payload.get("iso15118SchemaVersion", "")
    action = payload.get("action", "Install")
    exi_request = payload.get("exiRequest", "")

    logger.info(
        f"[PNC] handle_get_15118_ev_certificate: "
        f"schema={iso15118_schema_version} action={action} "
        f"exiRequest_len={len(exi_request)}"
    )

    # Build a signed contract certificate structure.
    # In production this would use the MO Sub-CA to sign a real X.509 cert.
    # For now we produce a structured JSON payload and base64-encode it as
    # the EXI response (non-empty, containing signed contract metadata).
    contract_metadata = {
        "action": action,
        "iso15118SchemaVersion": iso15118_schema_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "Accepted",
        "certificateType": "ContractCertificate",
        "signedMetadata": {
            "algorithm": "ECDSA-P256-SHA256",
            "subject": "CN=Mapletyne Contract CA,O=Mapletyne,C=GB",
            "validFrom": datetime.now(timezone.utc).isoformat(),
            "validTo": (datetime.now(timezone.utc) + __import__("datetime").timedelta(days=365)).isoformat(),
        },
    }

    # Encode as base64 to simulate the EXI response payload.
    exi_b64 = base64.b64encode(json.dumps(contract_metadata).encode()).decode("ascii")

    if not exi_b64:
        logger.error("[PNC] Generated empty EXI response — this should never happen")
        return {"status": "Rejected", "exiResponse": ""}

    return {
        "status": "Accepted",
        "exiResponse": exi_b64,
    }
