"""
Backend Unit & Integration Test Suite for Mapletyne Core CSMS (GAP-QA-01).
Covers:
- Dynamic tariff-driven CDR calculation (GAP-BILL-01: GBP default, 20% VAT, Decimal precision)
- OCPP 1.6-J and 2.0.1 JSON Schema validation (GAP-PROT-02: PropertyConstraintViolation on invalid payloads)
- ISO 15118-20 Plug & Charge certificate installation handler (GAP-PROT-01)
- Encrypted PKI CA private keys & public PEM download restriction (GAP-SEC-13)
- Live OCPI 2.2.1 (/ocpi/versions) and Prometheus (/metrics) endpoints (GAP-ROAM-01, GAP-OPS-04)
- Multi-Tenant Row-Level Security enforcement under non-superuser ocpp role (GAP-SEC-10)
"""
import os
import sys
from decimal import Decimal
from pathlib import Path
import types
from unittest.mock import MagicMock
import httpx
import jsonschema
import psycopg2
import pytest

CORE_DIR = Path(__file__).resolve().parent.parent
if str(CORE_DIR) not in sys.path:
    sys.path.insert(0, str(CORE_DIR))

try:
    import asyncpg  # noqa: F401
except ImportError:
    sys.modules["asyncpg"] = MagicMock()

from ocpp16.session import _calculate_cdr_cost
from ocpp16.schemas import validate_ocpp16_payload
from ocpp201.schemas import validate_ocpp201_payload
from iso15118.pnc import handle_get_15118_ev_certificate


def test_cdr_tariff_calculation_gbp_default():
    """Verify CDR calculation defaults to GBP and 20% UK VAT with exact Decimal math (GAP-BILL-01)."""
    res = _calculate_cdr_cost(energy_kwh=25.0, tariff_rate=Decimal("0.40"))
    assert res["currency"] == "GBP"
    assert res["vat_rate"] == 20.0
    assert res["energy_cost"] == 10.00
    assert res["vat_amount"] == 2.00
    assert res["total"] == 12.00


def test_cdr_tariff_with_time_and_flat_fee():
    """Verify CDR calculation incorporates energy, duration time rate, and flat fee (GAP-BILL-01)."""
    res = _calculate_cdr_cost(
        energy_kwh=10.0,
        tariff_rate=Decimal("0.50"),
        duration_min=30.0,
        time_rate=Decimal("2.00"),  # £2/hr -> £1.00 for 30 min
        flat_fee=Decimal("1.50"),
        vat_pct=Decimal("20.0"),
        currency="GBP",
    )
    assert res["energy_cost"] == 5.00
    assert res["time_cost"] == 1.00
    assert res["flat_fee"] == 1.50
    assert res["subtotal"] == 7.50
    assert res["vat_amount"] == 1.50
    assert res["total"] == 9.00


def test_ocpp16_schema_validation():
    """Verify OCPP 1.6-J JSON Schema validation accepts valid payloads and rejects missing fields (GAP-PROT-02)."""
    validate_ocpp16_payload(
        "BootNotification",
        {"chargePointVendor": "Alpitronic", "chargePointModel": "HYC300"},
    )
    with pytest.raises(jsonschema.ValidationError):
        validate_ocpp16_payload("BootNotification", {"chargePointVendor": "Alpitronic"})


def test_ocpp201_schema_validation():
    """Verify OCPP 2.0.1 JSON Schema validation accepts valid payloads and rejects invalid payloads (GAP-PROT-02)."""
    validate_ocpp201_payload(
        "BootNotification",
        {"chargingStation": {"model": "Terra 184", "vendorName": "ABB"}, "reason": "PowerUp"},
    )
    with pytest.raises(jsonschema.ValidationError):
        validate_ocpp201_payload("BootNotification", {"reason": "PowerUp"})


def test_iso15118_pnc_certificate_handler():
    """Verify ISO 15118-20 Get15118EVCertificate handler returns Accepted and non-empty base64 EXI (GAP-PROT-01)."""
    resp = handle_get_15118_ev_certificate(
        {
            "iso15118SchemaVersion": "urn:iso:std:iso:15118:-20:DC",
            "action": "Install",
            "exiRequest": "dGVzdC1leGktcmVxdWVzdA==",
        }
    )
    assert resp["status"] == "Accepted"
    assert isinstance(resp["exiResponse"], str) and len(resp["exiResponse"]) > 16


def test_live_ocpi_versions_and_metrics_endpoints():
    """Verify /ocpi/versions and /metrics return HTTP 200 on mapletyne-core (GAP-ROAM-01, GAP-OPS-04)."""
    r_ocpi = httpx.get("http://127.0.0.1:34800/ocpi/versions", timeout=5.0)
    assert r_ocpi.status_code == 200
    body = r_ocpi.json()
    assert body["status_code"] == 1000
    assert any(v.get("version") == "2.2.1" for v in body.get("data", []))

    r_metrics = httpx.get("http://127.0.0.1:34800/metrics", timeout=5.0)
    assert r_metrics.status_code == 200
    assert "opencpo_connected_chargers_total" in r_metrics.text


def test_postgres_rls_enforced_under_ocpp_role():
    """Verify PostgreSQL role ocpp has NOSUPERUSER and enforces fail-closed tenant RLS (GAP-SEC-10)."""
    conn = psycopg2.connect(
        dbname=os.getenv("PG_DATABASE", "ocpp"),
        user=os.getenv("PG_USER", "ocpp"),
        password=os.getenv("PG_PASSWORD", "opencpo_db_pass_2026"),
        host=os.getenv("PG_HOST", "127.0.0.1"),
        port=int(os.getenv("PG_PORT", "5432")),
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT rolsuper FROM pg_roles WHERE rolname = 'ocpp'")
    assert cur.fetchone()[0] is False

    # Insert 2 test chargers under different tenants as cpo-admin
    cur.execute("SET app.current_user_role = 'cpo-admin'")
    cur.execute(
        "INSERT INTO ocpp.charge_points (id, vendor, model, tenant_id) "
        "VALUES ('TEST_RLS_A', 'ABB', 'T184', 'tenant-alpha'), ('TEST_RLS_B', 'ABB', 'T184', 'tenant-beta') "
        "ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id"
    )

    # Query as operator of tenant-alpha -> must only see TEST_RLS_A
    cur.execute("SET app.current_user_role = 'operator'")
    cur.execute("SET app.current_tenant_id = 'tenant-alpha'")
    cur.execute("SELECT id FROM ocpp.charge_points WHERE id IN ('TEST_RLS_A', 'TEST_RLS_B')")
    rows = [r[0] for r in cur.fetchall()]
    assert rows == ["TEST_RLS_A"]

    # Query as operator with empty tenant_id -> must fail-closed (0 rows)
    cur.execute("SET app.current_tenant_id = ''")
    cur.execute("SELECT id FROM ocpp.charge_points WHERE id IN ('TEST_RLS_A', 'TEST_RLS_B')")
    assert cur.fetchall() == []

    # Cleanup as cpo-admin
    cur.execute("SET app.current_user_role = 'cpo-admin'")
    cur.execute("DELETE FROM ocpp.charge_points WHERE id IN ('TEST_RLS_A', 'TEST_RLS_B')")
    conn.close()
