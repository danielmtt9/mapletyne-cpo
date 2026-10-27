"""
Payment Gateway Integration Module for OpenCPO.
Supports Stripe Checkout & PaymentIntent pre-authorization and card capture.
"""
import os
import json
import logging
import urllib.request
import urllib.parse
import hmac
import hashlib
import time
from typing import Optional

from fastapi import APIRouter, Request, Header, HTTPException
from state.postgres import db
from state import charger_registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/public/payments", tags=["payments"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
PUBLIC_URL = os.getenv("CHARGE_APP_URL", "https://opencpo.mapletyne.com/app").rstrip("/")


def verify_stripe_signature(payload_bytes: bytes, sig_header: str, secret: str, tolerance: int = 300) -> bool:
    """Validate Stripe HMAC-SHA256 signature using standard library (timing-safe)."""
    if not sig_header or not secret:
        return False
    parts = dict(pair.split("=", 1) for pair in sig_header.split(",") if "=" in pair)
    timestamp = parts.get("t")
    v1_sig = parts.get("v1")
    if not timestamp or not v1_sig:
        return False
    try:
        ts = int(timestamp)
        if abs(time.time() - ts) > tolerance:
            logger.warning(f"Stripe webhook timestamp expired or out of tolerance window: {ts}")
            return False
    except ValueError:
        return False

    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    expected_sig = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_sig, v1_sig)


async def create_stripe_checkout(
    session_id: str,
    cp_id: str,
    connector_id: int,
    amount_cents: int = 2500,
    currency: str = "eur",
    customer_email: Optional[str] = None
) -> Optional[str]:
    """
    Creates a Stripe Checkout Session for charging pre-authorization.
    Returns the Stripe hosted checkout URL, or None if Stripe is not configured.
    """
    if not STRIPE_SECRET_KEY:
        return None

    try:
        url = "https://api.stripe.com/v1/checkout/sessions"
        payload = {
            "mode": "payment",
            "currency": currency.lower(),
            "customer_email": customer_email or "",
            "client_reference_id": session_id,
            "success_url": f"{PUBLIC_URL}/session/{session_id}?payment=success&session_id={session_id}",
            "cancel_url": f"{PUBLIC_URL}/charge/{cp_id}/{connector_id}?cancelled=true",
            "line_items[0][price_data][currency]": currency.lower(),
            "line_items[0][price_data][unit_amount]": str(amount_cents),
            "line_items[0][price_data][product_data][name]": f"EV Charging Deposit — {cp_id}",
            "line_items[0][price_data][product_data][description]": f"Pre-authorization for charging on Connector {connector_id}. Unused balance refunded.",
            "line_items[0][quantity]": "1",
            "metadata[session_id]": session_id,
            "metadata[cp_id]": cp_id,
            "metadata[connector_id]": str(connector_id),
            "payment_intent_data[capture_method]": "manual",
            "payment_intent_data[metadata][session_id]": session_id,
        }
        data = urllib.parse.urlencode({k: v for k, v in payload.items() if v}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
                "Content-Type": "application/x-www-form-urlencoded",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            checkout_url = body.get("url")
            stripe_session_id = body.get("id")
            logger.info(f"Stripe checkout session created: {stripe_session_id} for session {session_id}")
            return checkout_url
    except Exception as e:
        logger.error(f"Failed to create Stripe Checkout session: {e}")
        return None


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    test_bypass: str = Header(None, alias="X-Test-Payment-Bypass"),
):
    """
    Handles Stripe webhooks (checkout.session.completed, payment_intent.amount_capturable_updated).
    Enforces HMAC-SHA256 signature verification in production.
    Accepts bypass header in development/testing mode for CI and test suite compatibility.
    Authorizes session and triggers RemoteStartTransaction.
    """
    payload_bytes = await request.body()
    is_testing = os.getenv("APP_ENV", "development").lower() in ("testing", "development", "test")

    # In testing mode with explicit test bypass header: allow simulated test payloads
    if is_testing and test_bypass == "true":
        logger.warning("[DEV-MODE] Bypassing Stripe signature verification under testing environment via X-Test-Payment-Bypass.")
    else:
        if STRIPE_WEBHOOK_SECRET:
            if not stripe_signature:
                logger.warning("Missing Stripe-Signature header on webhook request.")
                raise HTTPException(status_code=400, detail="Missing Stripe-Signature header.")
            if not verify_stripe_signature(payload_bytes, stripe_signature, STRIPE_WEBHOOK_SECRET):
                logger.warning("Invalid Stripe webhook signature.")
                raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature.")
        elif not is_testing:
            logger.error("STRIPE_WEBHOOK_SECRET is not configured in production.")
            raise HTTPException(status_code=500, detail="Stripe webhook secret is not configured.")

    try:
        event = json.loads(payload_bytes.decode("utf-8"))
    except Exception as e:
        logger.warning(f"Invalid Stripe webhook JSON payload: {e}")
        return {"ok": False, "error": "Invalid payload"}

    event_type = event.get("type", "")
    data_obj = event.get("data", {}).get("object", {})

    logger.info(f"Received Stripe webhook event: {event_type}")

    if event_type in ("checkout.session.completed", "payment_intent.amount_capturable_updated", "payment_intent.succeeded"):
        session_id = data_obj.get("client_reference_id") or data_obj.get("metadata", {}).get("session_id")
        payment_id = data_obj.get("id")

        if session_id:
            # Validate UUID before querying Postgres
            import uuid
            try:
                uuid.UUID(str(session_id))
            except (ValueError, TypeError):
                logger.warning(f"Stripe webhook: ignoring invalid session UUID format: {session_id}")
                return {"received": True, "status": "ignored_invalid_uuid"}

            async with db.read() as conn:
                row = await conn.fetchrow(
                    "SELECT id::text AS id, cp_id, connector_id, payment_status FROM ocpp.public_sessions WHERE id = $1::uuid",
                    session_id
                )

            if row:
                async with db.write() as conn:
                    await conn.execute(
                        "UPDATE ocpp.public_sessions SET payment_status = 'paid', external_payment_id = $2 WHERE id = $1::uuid",
                        session_id, payment_id
                    )
                logger.info(f"Session {session_id[:8]} authorized via Stripe ({payment_id})")

                # Trigger RemoteStartTransaction
                id_tag = f"APP_{session_id[:8].upper()}"
                try:
                    await charger_registry.send_remote_start(row["cp_id"], row["connector_id"], id_tag)
                except Exception as exc:
                    logger.warning(f"Could not dispatch RemoteStart after Stripe payment: {exc}")

    return {"received": True}
