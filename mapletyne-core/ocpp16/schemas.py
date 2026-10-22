"""
OCPP 1.6j JSON Schema Validation.

Validates key OCPP 1.6 action payloads against expected structure.
Raises jsonschema.ValidationError when invalid or if payload is not a dict.
"""
import jsonschema


# Minimal inline schemas for key OCPP 1.6 actions
_SCHEMA: dict[str, dict] = {
    "BootNotification": {
        "type": "object",
        "required": ["chargePointVendor", "chargePointModel"],
        "properties": {
            "chargePointVendor": {"type": "string"},
            "chargePointModel": {"type": "string"},
        },
    },
    "StartTransaction": {
        "type": "object",
        "required": ["connectorId", "idTag", "meterStart", "timestamp"],
        "properties": {
            "connectorId": {"type": "integer"},
            "idTag": {"type": "string"},
            "meterStart": {"type": "integer"},
            "timestamp": {"type": "string"},
        },
    },
    "StopTransaction": {
        "type": "object",
        "required": ["meterStop", "timestamp", "transactionId"],
        "properties": {
            "meterStop": {"type": "integer"},
            "timestamp": {"type": "string"},
            "transactionId": {"type": "integer"},
        },
    },
    "StatusNotification": {
        "type": "object",
        "required": ["connectorId", "errorCode", "status"],
        "properties": {
            "connectorId": {"type": "integer"},
            "errorCode": {"type": "string"},
            "status": {"type": "string"},
        },
    },
    "Authorize": {
        "type": "object",
        "required": ["idTag"],
        "properties": {
            "idTag": {"type": "string"},
        },
    },
    "MeterValues": {
        "type": "object",
        "required": ["connectorId", "meterValue"],
        "properties": {
            "connectorId": {"type": "integer"},
            "meterValue": {"type": "array"},
        },
    },
}


def validate_ocpp16_payload(action: str, payload: dict) -> None:
    """Validate an OCPP 1.6 action payload against its schema.

    Raises jsonschema.ValidationError when invalid or if ``payload`` is not a dict.
    """
    if not isinstance(payload, dict):
        raise jsonschema.ValidationError(f"Payload must be a dict, got {type(payload).__name__}")

    schema = _SCHEMA.get(action)
    if schema is None:
        # No schema defined for this action — skip validation
        return

    jsonschema.validate(instance=payload, schema=schema)
