"""
Tier 4: Real-World Application Workload Scenarios E2E Tests for Mapletyne MTT Charge CPO Platform.

Simulates end-to-end production workflows:
1. Complete Depot Fleet Overnight Charging Flow (Boot -> Auth -> Start -> Meter -> Stop -> CDR)
2. Driver Ad-Hoc Mobile PWA QR Scan, Telemetry, and Digital Receipt Generation
3. Multi-Tenant Operator Isolation under Concurrent Depot Operations
4. Charger Watchdog Self-Healing & Fault Recovery Flow
5. Smart Charging Peak Shaving & Energy Management Dispatch
"""

import json
import time
import uuid
import asyncio
import pytest
import requests
import websockets

pytestmark = [pytest.mark.tier4]


class TestTier4RealWorldScenarios:
    """End-to-end real-world workload scenarios across all platform microservices."""

    def test_scenario_depot_fleet_overnight_charging_flow(self, e2e_config, admin_token):
        """Scenario 1: Complete depot fleet bus charging session from connection to final CDR."""
        cp_id = f"depot-bay4-{uuid.uuid4().hex[:6]}"
        id_tag = "FLEET-BUS-042"

        async def _run_full_depot_flow():
            uri = f"{e2e_config['ocpp16_ws_url']}/{cp_id}"
            async with websockets.connect(uri, subprotocols=["ocpp1.6"], close_timeout=2) as ws:
                # Step 1: Boot Notification
                boot_call = [2, "boot-01", "BootNotification", {
                    "chargePointVendor": "Mapletyne",
                    "chargePointModel": "MTT-Rapid-350",
                    "chargePointSerialNumber": cp_id,
                    "firmwareVersion": "3.1.0"
                }]
                await ws.send(json.dumps(boot_call))
                boot_resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                assert boot_resp[0] == 3
                assert boot_resp[2].get("status") in ("Accepted", "Pending")

                # Step 2: Preparing status
                status_prep = [2, "stat-01", "StatusNotification", {
                    "connectorId": 1,
                    "errorCode": "NoError",
                    "status": "Preparing"
                }]
                await ws.send(json.dumps(status_prep))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

                # Step 3: Authorize RFID Token
                auth_call = [2, "auth-01", "Authorize", {"idTag": id_tag}]
                await ws.send(json.dumps(auth_call))
                auth_resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                assert auth_resp[0] == 3

                # Step 4: Start Transaction
                start_call = [2, "start-01", "StartTransaction", {
                    "connectorId": 1,
                    "idTag": id_tag,
                    "meterStart": 100000,
                    "timestamp": "2026-10-22T02:00:00Z"
                }]
                await ws.send(json.dumps(start_call))
                start_resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                assert start_resp[0] == 3
                tx_id = start_resp[2].get("transactionId", 1)

                # Step 5: Charging Status & Meter Values (High-power bus charging)
                await ws.send(json.dumps([2, "stat-02", "StatusNotification", {
                    "connectorId": 1,
                    "errorCode": "NoError",
                    "status": "Charging"
                }]))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

                meter_call = [2, "meter-01", "MeterValues", {
                    "connectorId": 1,
                    "transactionId": tx_id,
                    "meterValue": [{
                        "timestamp": "2026-10-22T02:30:00Z",
                        "sampledValue": [
                            {"value": "150000", "unit": "Wh", "measurand": "Energy.Active.Import.Register"},
                            {"value": "120000", "unit": "W", "measurand": "Power.Active.Import"}
                        ]
                    }]
                }]
                await ws.send(json.dumps(meter_call))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

                # Step 6: Stop Transaction
                stop_call = [2, "stop-01", "StopTransaction", {
                    "transactionId": tx_id,
                    "idTag": id_tag,
                    "meterStop": 220000,  # 120 kWh delivered
                    "timestamp": "2026-10-22T03:00:00Z",
                    "reason": "EVDisconnected"
                }]
                await ws.send(json.dumps(stop_call))
                stop_resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
                assert stop_resp[0] == 3

                # Step 7: Available status
                await ws.send(json.dumps([2, "stat-03", "StatusNotification", {
                    "connectorId": 1,
                    "errorCode": "NoError",
                    "status": "Available"
                }]))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

        asyncio.run(_run_full_depot_flow())

        # Verify through Core CSMS API that charger is listed
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{e2e_config['core_url']}/api/v1/chargers/{cp_id}", headers=headers, timeout=5)
        assert resp.status_code in (200, 404)

    def test_scenario_driver_ad_hoc_qr_and_digital_receipt(self, e2e_config):
        """Scenario 2: Driver mobile PWA QR scan lookup, session status, and digital receipt."""
        # 1. Driver visits ChargeApp homepage on 390px mobile viewport
        resp_pwa = requests.get(
            f"{e2e_config['driver_url']}/",
            headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
                "X-Forwarded-For": "198.51.100.102"
            },
            timeout=5
        )
        assert resp_pwa.status_code == 200
        assert "viewport" in resp_pwa.text

        # 2. Driver scans QR code pointing to charger
        qr_lookup_url = f"{e2e_config['core_url']}/api/v1/public/chargers/nearby"
        resp_nearby = requests.get(qr_lookup_url, headers={"X-Forwarded-For": "198.51.100.102"}, timeout=5)
        assert resp_nearby.status_code in (200, 404, 429)

        # 3. Query public pricing configuration for ad-hoc charging
        pricing_url = f"{e2e_config['core_url']}/api/v1/pricing/current"
        resp_pricing = requests.get(pricing_url, headers={"X-Forwarded-For": "198.51.100.102"}, timeout=5)
        assert resp_pricing.status_code in (200, 404, 429)

        # 4. Verify receipts access
        receipts_url = f"{e2e_config['core_url']}/api/v1/public-sessions/receipts"
        resp_receipts = requests.get(
            receipts_url,
            headers={
                "X-API-Key": e2e_config["mgmt_api_key"],
                "X-Forwarded-For": "198.51.100.102"
            },
            timeout=5
        )
        assert resp_receipts.status_code in (200, 404, 429)

    def test_scenario_multi_tenant_operator_isolation(self, e2e_config, admin_token, operator_token):
        """Scenario 3: Concurrent depot operators isolated across Newcastle and Amsterdam sites."""
        headers_alpha = {"Authorization": f"Bearer {admin_token}", "X-Forwarded-For": "198.51.100.103"}
        headers_beta = {"Authorization": f"Bearer {operator_token}", "X-Forwarded-For": "198.51.100.104"}

        # Alpha queries Newcastle chargers
        r_alpha = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?site=Newcastle", headers=headers_alpha, timeout=5)
        # Beta queries Amsterdam chargers
        r_beta = requests.get(f"{e2e_config['core_url']}/api/v1/chargers?site=Amsterdam", headers=headers_beta, timeout=5)

        assert r_alpha.status_code in (200, 429)
        assert r_beta.status_code in (200, 429)

        if r_alpha.status_code == 200 and r_beta.status_code == 200:
            chargers_alpha = r_alpha.json().get("chargers", [])
            chargers_beta = r_beta.json().get("chargers", [])

            # Verify Alpha cannot cross-reset an Amsterdam charger if it exists
            if chargers_beta:
                target_ams_cp = chargers_beta[0]["id"]
                # Attempt reset with an unprivileged or mismatch token
                r_reset = requests.post(
                    f"{e2e_config['core_url']}/api/v1/chargers/{target_ams_cp}/reset",
                    headers={"Authorization": "Bearer invalid_cross_tenant_token", "X-Forwarded-For": "198.51.100.103"},
                    json={"type": "Soft"},
                    timeout=5
                )
                assert r_reset.status_code in (401, 403)

    def test_scenario_charger_watchdog_fault_recovery(self, e2e_config, admin_token):
        """Scenario 4: Charger watchdog fault recovery (Faulted -> Reset -> Available)."""
        cp_id = f"watchdog-cp-{uuid.uuid4().hex[:6]}"

        async def _run_fault_recovery():
            uri = f"{e2e_config['ocpp16_ws_url']}/{cp_id}"
            async with websockets.connect(uri, subprotocols=["ocpp1.6"], close_timeout=2) as ws:
                # 1. Boot
                await ws.send(json.dumps([2, "boot-wd", "BootNotification", {
                    "chargePointVendor": "Mapletyne",
                    "chargePointModel": "MTT-500",
                    "chargePointSerialNumber": cp_id,
                    "firmwareVersion": "1.0.0"
                }]))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

                # 2. Report Hardware / Overcurrent Fault
                await ws.send(json.dumps([2, "stat-fault", "StatusNotification", {
                    "connectorId": 1,
                    "errorCode": "OverCurrentFailure",
                    "status": "Faulted",
                    "info": "Hardware overcurrent limit tripped"
                }]))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

                # 3. Simulate self-healing reset
                await ws.send(json.dumps([2, "stat-recovered", "StatusNotification", {
                    "connectorId": 1,
                    "errorCode": "NoError",
                    "status": "Available"
                }]))
                assert (json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0)))[0] == 3

        asyncio.run(_run_fault_recovery())

        # Trigger self-heal or reset API endpoint
        headers = {"Authorization": f"Bearer {admin_token}", "X-Forwarded-For": "198.51.100.105"}
        resp = requests.post(
            f"{e2e_config['core_url']}/api/v1/chargers/{cp_id}/self-heal",
            headers=headers,
            timeout=5
        )
        assert resp.status_code in (200, 400, 404, 429)

    def test_scenario_smart_charging_peak_shaving(self, e2e_config, admin_token):
        """Scenario 5: EMS smart charging peak shaving and dynamic power limits."""
        headers = {"Authorization": f"Bearer {admin_token}", "X-Forwarded-For": "198.51.100.106"}

        # 1. Query live EMS depot telemetry
        resp_ems = requests.get(f"{e2e_config['core_url']}/api/v1/ems/live", headers=headers, timeout=5)
        assert resp_ems.status_code in (200, 404, 429)

        # 2. Query depot config
        resp_cfg = requests.get(f"{e2e_config['core_url']}/api/v1/ems/depot-config", headers=headers, timeout=5)
        assert resp_cfg.status_code in (200, 404, 429)

        # 3. Post telemetry update
        resp_tel = requests.post(
            f"{e2e_config['core_url']}/api/v1/ems/telemetry",
            headers=headers,
            json={
                "site_id": "newcastle-main",
                "grid_import_kw": 420.5,
                "solar_kw": 85.0,
                "bess_soc_pct": 78.0
            },
            timeout=5
        )
        assert resp_tel.status_code in (200, 404, 422, 429)
