"""
OCPP 2.0.1 JSON Schema Validation.

Validates key OCPP 2.0.1 action payloads against expected structure.
Raises jsonschema.ValidationError when invalid or if payload is not a dict.
"""
import jsonschema


# Minimal inline schemas for key OCPP 2.0.1 actions
_SCHEMA: dict[str, dict] = {
    "BootNotification": {
        "type": "object",
        "required": ["chargingStation", "reason"],
        "properties": {
            "chargingStation": {"type": "object"},
            "reason": {"type": "string"},
        },
    },
    "StatusNotification": {
        "type": "object",
        "required": ["timestamp", "connectorStatus", "evseId", "connectorId"],
        "properties": {
            "timestamp": {"type": "string"},
            "connectorStatus": {"type": "string"},
            "evseId": {"type": "integer"},
            "connectorId": {"type": "integer"},
        },
    },
    "TransactionEvent": {
        "type": "object",
        "required": ["eventType", "timestamp", "triggerReason", "seqNo", "transactionInfo"],
        "properties": {
            "eventType": {"type": "string"},
            "timestamp": {"type": "string"},
            "triggerReason": {"type": "string"},
            "seqNo": {"type": "integer"},
            "transactionInfo": {"type": "object"},
        },
    },
    "Authorize": {
        "type": "object",
        "required": ["idToken"],
        "properties": {
            "idToken": {"type": "object"},
        },
    },
}


def validate_ocpp201_payload(action: str, payload: dict) -> None:
    """Validate an OCPP 2.0.1 action payload against its schema.

    Raises jsonschema.ValidationError when invalid or if ``payload`` is not a dict.
    """
    if not isinstance(payload, dict):
        raise jsonschema.ValidationError(f"Payload must be a dict, got {type(payload).__name__}")

    schema = _SCHEMA.get(action)
    if schema is None:
        # No schema defined for this action — skip validation
        return

    jsonschema.validate(instance=payload, schema=schema)
