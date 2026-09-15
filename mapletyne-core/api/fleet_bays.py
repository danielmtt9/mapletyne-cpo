"""
Fleet Depot Bays & Site Operations API endpoints.

Manages depot charging bay layout, vehicle docking, 360° site telemetry snapshots,
and batch smart-charging profile dispatches for commercial EV fleet operations.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from state.postgres import db
from state.charger_registry import send_command, is_connected
from state.redis import redis_state

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_BAY_TYPES = {"AC_OVERNIGHT", "DC_FAST", "HIGH_POWER_DC", "PANTOGRAPH", "EMERGENCY_RESERVE"}
VALID_BAY_STATUSES = {"available", "occupied", "charging", "reserved", "faulted", "maintenance"}


# ── Pydantic Request Models ──────────────────────────────────────────────────

class CreateBayRequest(BaseModel):
    bay_number: str
    charge_point_id: str
    connector_id: int = 1
    bay_type: str = "AC_OVERNIGHT"
    max_bay_power_kw: float = 22.0
    assigned_vehicle_id: Optional[int] = None
    status: str = "available"


class PatchBayRequest(BaseModel):
    bay_number: Optional[str] = None
    charge_point_id: Optional[str] = None
    connector_id: Optional[int] = None
    bay_type: Optional[str] = None
    max_bay_power_kw: Optional[float] = None
    assigned_vehicle_id: Optional[int] = None
    status: Optional[str] = None


class DispatchProfileItem(BaseModel):
    charge_point_id: str
    connector_id: int = 1
    limit_kw: float
    duration_seconds: int = 0
    charging_rate_unit: str = "W"  # "W" or "A"


class BatchDispatchProfilesRequest(BaseModel):
    profiles: List[DispatchProfileItem]
    reason: Optional[str] = "depot_ems_optimization"


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{site_id}/bays")
async def list_depot_bays(site_id: str):
    """List all charging bays for a given depot site with charger and vehicle telemetry."""
    async with db.read() as conn:
        rows = await conn.fetch("""
            SELECT b.*,
                   cp.vendor, cp.model AS charger_model, cp.status AS charger_status,
                   v.license_plate, v.unit_number, v.make AS vehicle_make, v.model AS vehicle_model,
                   v.battery_capacity_kwh, v.usable_battery_kwh, v.priority_tier,
                   t.current_soc_pct, t.is_plugged_in, t.active_charge_session_id
            FROM ocpp.fleet_depot_bays b
            LEFT JOIN ocpp.charge_points cp ON b.charge_point_id = cp.id
            LEFT JOIN ocpp.fleet_vehicles v ON b.assigned_vehicle_id = v.id
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE b.site_id = $1
            ORDER BY b.bay_number ASC
        """, site_id)

    bays = []
    for r in rows:
        item = dict(r)
        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()
        for k in ["max_bay_power_kw", "battery_capacity_kwh", "usable_battery_kwh", "current_soc_pct"]:
            if item.get(k) is not None:
                item[k] = float(item[k])
        bays.append(item)

    return {"site_id": site_id, "bays": bays, "count": len(bays)}


@router.post("/{site_id}/bays", status_code=201)
async def create_depot_bay(site_id: str, req: CreateBayRequest):
    """Register a new depot bay mapped to a specific charge point and connector."""
    if req.bay_type not in VALID_BAY_TYPES:
        raise HTTPException(400, f"bay_type must be one of {sorted(VALID_BAY_TYPES)}")
    if req.status not in VALID_BAY_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_BAY_STATUSES)}")

    bay_number = req.bay_number.strip()

    async with db.write() as conn:
        # Check if charge point exists
        cp_exists = await conn.fetchval(
            "SELECT id FROM ocpp.charge_points WHERE id = $1", req.charge_point_id
        )
        if not cp_exists:
            raise HTTPException(404, f"Charge point {req.charge_point_id} not found")

        # Check vehicle if assigned
        if req.assigned_vehicle_id is not None:
            v_exists = await conn.fetchval(
                "SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", req.assigned_vehicle_id
            )
            if not v_exists:
                raise HTTPException(404, f"Vehicle {req.assigned_vehicle_id} not found")

        # Check unique bay_number per site
        existing_bay = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_depot_bays WHERE site_id = $1 AND bay_number = $2",
            site_id, bay_number
        )
        if existing_bay:
            raise HTTPException(409, f"Bay {bay_number} already exists in site {site_id}")

        row = await conn.fetchrow("""
            INSERT INTO ocpp.fleet_depot_bays (
                site_id, bay_number, charge_point_id, connector_id,
                bay_type, max_bay_power_kw, assigned_vehicle_id, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """,
            site_id, bay_number, req.charge_point_id, req.connector_id,
            req.bay_type, req.max_bay_power_kw, req.assigned_vehicle_id, req.status
        )

    logger.info("Created depot bay %s at site %s (id=%s)", bay_number, site_id, row["id"])
    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    if item.get("max_bay_power_kw") is not None:
        item["max_bay_power_kw"] = float(item["max_bay_power_kw"])
    return item


@router.get("/{site_id}/bays/{bay_id}")
async def get_depot_bay(site_id: str, bay_id: int):
    """Get single bay details."""
    async with db.read() as conn:
        row = await conn.fetchrow("""
            SELECT b.*,
                   cp.vendor, cp.model AS charger_model, cp.status AS charger_status,
                   v.license_plate, v.unit_number, v.make AS vehicle_make, v.model AS vehicle_model,
                   v.battery_capacity_kwh, v.usable_battery_kwh, v.priority_tier,
                   t.current_soc_pct, t.is_plugged_in, t.active_charge_session_id
            FROM ocpp.fleet_depot_bays b
            LEFT JOIN ocpp.charge_points cp ON b.charge_point_id = cp.id
            LEFT JOIN ocpp.fleet_vehicles v ON b.assigned_vehicle_id = v.id
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE b.site_id = $1 AND b.id = $2
        """, site_id, bay_id)

    if not row:
        raise HTTPException(404, f"Bay {bay_id} not found in site {site_id}")

    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    for k in ["max_bay_power_kw", "battery_capacity_kwh", "usable_battery_kwh", "current_soc_pct"]:
        if item.get(k) is not None:
            item[k] = float(item[k])
    return item


@router.patch("/{site_id}/bays/{bay_id}")
async def patch_depot_bay(site_id: str, bay_id: int, req: PatchBayRequest):
    """Update depot bay details, dock/undock vehicles, change power rating or status."""
    if req.bay_type is not None and req.bay_type not in VALID_BAY_TYPES:
        raise HTTPException(400, f"bay_type must be one of {sorted(VALID_BAY_TYPES)}")
    if req.status is not None and req.status not in VALID_BAY_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_BAY_STATUSES)}")

    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_depot_bays WHERE site_id = $1 AND id = $2",
            site_id, bay_id
        )
        if not existing:
            raise HTTPException(404, f"Bay {bay_id} not found in site {site_id}")

        if req.charge_point_id is not None:
            cp_exists = await conn.fetchval(
                "SELECT id FROM ocpp.charge_points WHERE id = $1", req.charge_point_id
            )
            if not cp_exists:
                raise HTTPException(404, f"Charge point {req.charge_point_id} not found")

        if req.assigned_vehicle_id is not None:
            v_exists = await conn.fetchval(
                "SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", req.assigned_vehicle_id
            )
            if not v_exists:
                raise HTTPException(404, f"Vehicle {req.assigned_vehicle_id} not found")

        sets: list[str] = []
        params: list = []
        idx = 1

        col_map = {
            "bay_number": req.bay_number,
            "charge_point_id": req.charge_point_id,
            "connector_id": req.connector_id,
            "bay_type": req.bay_type,
            "max_bay_power_kw": req.max_bay_power_kw,
            "assigned_vehicle_id": req.assigned_vehicle_id,
            "status": req.status,
        }

        for col, val in col_map.items():
            if val is not None:
                sets.append(f"{col} = ${idx}")
                params.append(val)
                idx += 1

        if not sets:
            raise HTTPException(400, "No fields to update")

        params.extend([site_id, bay_id])
        await conn.execute(
            f"UPDATE ocpp.fleet_depot_bays SET {', '.join(sets)} WHERE site_id = ${idx} AND id = ${idx + 1}",
            *params,
        )

    logger.info("Patched depot bay id=%s in site=%s", bay_id, site_id)
    return {"site_id": site_id, "bay_id": bay_id, "status": "updated"}


@router.delete("/{site_id}/bays/{bay_id}")
async def delete_depot_bay(site_id: str, bay_id: int):
    """Delete a depot bay."""
    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_depot_bays WHERE site_id = $1 AND id = $2",
            site_id, bay_id
        )
        if not existing:
            raise HTTPException(404, f"Bay {bay_id} not found in site {site_id}")

        await conn.execute(
            "DELETE FROM ocpp.fleet_depot_bays WHERE site_id = $1 AND id = $2",
            site_id, bay_id
        )

    logger.info("Deleted depot bay id=%s from site=%s", bay_id, site_id)
    return {"site_id": site_id, "bay_id": bay_id, "deleted": True}


# ── 360° Depot Telemetry Snapshot ────────────────────────────────────────────

@router.get("/{site_id}/snapshot")
async def get_depot_telemetry_snapshot(site_id: str):
    """
    360° Comprehensive Depot Telemetry Snapshot.
    Used by external EMS / SCADA controllers and the MTT Admin Depot Cockpit.
    Aggregates active sessions, meter values, bay occupancy, schedule queue, and grid headroom.
    """
    now = datetime.now(timezone.utc)

    async with db.read() as conn:
        # 1. Fetch site config & override state
        depot_config = await conn.fetchrow("""
            SELECT * FROM ocpp.fleet_depot_config WHERE site_id = $1
        """, site_id)

        ems_site = await conn.fetchrow("""
            SELECT * FROM ocpp.ems_sites WHERE id = $1
        """, site_id)

        # Baseline grid limits
        grid_limit_kw = 1000.0
        if depot_config and depot_config["grid_import_limit_kw"]:
            grid_limit_kw = float(depot_config["grid_import_limit_kw"])
        elif ems_site and ems_site["grid_connection_kw"]:
            grid_limit_kw = float(ems_site["grid_connection_kw"])

        ems_mode = "AUTOMATIC_OPTIMIZED"
        external_override_kw = None
        override_expires_at = None

        if depot_config:
            ems_mode = depot_config["ems_mode"]
            if depot_config["external_override_expires_at"]:
                if depot_config["external_override_expires_at"] > now:
                    external_override_kw = float(depot_config["external_override_kw"]) if depot_config["external_override_kw"] else None
                    override_expires_at = depot_config["external_override_expires_at"].isoformat()
                else:
                    ems_mode = "AUTOMATIC_OPTIMIZED"  # Expired watchdog

        # 2. Fetch bays with live telemetry & charger metadata
        bay_rows = await conn.fetch("""
            SELECT b.*,
                   cp.vendor, cp.model AS charger_model, cp.status AS charger_status,
                   v.license_plate, v.unit_number, v.make AS vehicle_make, v.model AS vehicle_model,
                   v.battery_capacity_kwh, v.usable_battery_kwh, v.priority_tier,
                   t.current_soc_pct, t.is_plugged_in, t.active_charge_session_id
            FROM ocpp.fleet_depot_bays b
            LEFT JOIN ocpp.charge_points cp ON b.charge_point_id = cp.id
            LEFT JOIN ocpp.fleet_vehicles v ON b.assigned_vehicle_id = v.id
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE b.site_id = $1
            ORDER BY b.bay_number ASC
        """, site_id)

        # 3. Active Sessions for charge points in this depot
        charge_point_ids = [r["charge_point_id"] for r in bay_rows if r["charge_point_id"]]
        active_sessions = []
        total_charging_kw = 0.0

        if charge_point_ids:
            session_rows = await conn.fetch("""
                SELECT s.id, s.charge_point, s.connector_id, s.auth_id, s.start_time,
                       s.energy_kwh, s.status, s.peak_power_kw, s.start_soc, s.end_soc
                FROM ocpp.sessions s
                WHERE s.charge_point = ANY($1) AND s.status = 'active'
                ORDER BY s.start_time DESC
            """, charge_point_ids)

            for s in session_rows:
                s_dict = dict(s)
                s_dict["id"] = str(s["id"])
                s_dict["start_time"] = s["start_time"].isoformat() if s["start_time"] else None
                
                # Estimate current power draw from peak or default
                curr_kw = float(s["peak_power_kw"]) if s.get("peak_power_kw") else 11.0
                total_charging_kw += curr_kw
                s_dict["current_power_kw"] = curr_kw
                active_sessions.append(s_dict)

        # 4. Upcoming Schedules (next 24 hours)
        schedules_rows = await conn.fetch("""
            SELECT s.id, s.vehicle_id, s.target_departure_at, s.target_soc_pct, s.min_emergency_soc_pct, s.status,
                   v.license_plate, v.unit_number, v.priority_tier
            FROM ocpp.fleet_schedules s
            JOIN ocpp.fleet_vehicles v ON s.vehicle_id = v.id
            WHERE s.status = 'scheduled'
              AND s.target_departure_at >= $1
              AND s.target_departure_at <= $2
            ORDER BY s.target_departure_at ASC
        """, now, now + timedelta(hours=24))

        schedules = []
        for sc in schedules_rows:
            sc_dict = dict(sc)
            sc_dict["target_departure_at"] = sc["target_departure_at"].isoformat() if sc["target_departure_at"] else None
            sc_dict["target_soc_pct"] = float(sc["target_soc_pct"])
            sc_dict["min_emergency_soc_pct"] = float(sc["min_emergency_soc_pct"])
            schedules.append(sc_dict)

    # Calculate power headroom
    effective_limit_kw = external_override_kw if (ems_mode == "EXTERNAL_OVERRIDE" and external_override_kw is not None) else grid_limit_kw
    headroom_kw = max(0.0, effective_limit_kw - total_charging_kw)

    bays_list = []
    for r in bay_rows:
        item = dict(r)
        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()
        for k in ["max_bay_power_kw", "battery_capacity_kwh", "usable_battery_kwh", "current_soc_pct"]:
            if item.get(k) is not None:
                item[k] = float(item[k])
        bays_list.append(item)

    return {
        "site_id": site_id,
        "as_of": now.isoformat(),
        "depot_summary": {
            "total_bays": len(bays_list),
            "occupied_bays": sum(1 for b in bays_list if b.get("assigned_vehicle_id") or b.get("status") in ("occupied", "charging")),
            "active_charging_sessions": len(active_sessions),
            "total_active_charging_kw": round(total_charging_kw, 2),
            "grid_import_limit_kw": round(grid_limit_kw, 2),
            "effective_limit_kw": round(effective_limit_kw, 2),
            "headroom_kw": round(headroom_kw, 2),
            "ems_mode": ems_mode,
            "external_override_kw": external_override_kw,
            "external_override_expires_at": override_expires_at,
        },
        "bays": bays_list,
        "active_sessions": active_sessions,
        "upcoming_schedules": schedules,
    }


# ── Batch Profile Dispatching ────────────────────────────────────────────────

@router.post("/{site_id}/dispatch-profiles")
async def batch_dispatch_profiles(site_id: str, req: BatchDispatchProfilesRequest):
    """
    Batch Dispatch Smart Charging Profiles across multiple depot chargers.
    Dispatches OCPP SetChargingProfile commands to each connected charger.
    """
    results = []
    for p in req.profiles:
        cp_id = p.charge_point_id
        connector_id = p.connector_id
        limit_val = p.limit_kw * 1000 if p.charging_rate_unit == "W" else p.limit_kw

        if not is_connected(cp_id):
            results.append({
                "charge_point_id": cp_id,
                "connector_id": connector_id,
                "status": "Offline",
                "error": "Charger is not connected via WebSocket"
            })
            continue

        profile_payload = {
            "connectorId": connector_id,
            "csChargingProfiles": {
                "chargingProfileId": 100 + connector_id,
                "stackLevel": 1,
                "chargingProfilePurpose": "TxDefaultProfile",
                "chargingProfileKind": "Absolute",
                "chargingSchedule": {
                    "chargingRateUnit": p.charging_rate_unit,
                    "chargingSchedulePeriod": [
                        {"startPeriod": 0, "limit": limit_val}
                    ],
                },
            },
        }
        if p.duration_seconds > 0:
            profile_payload["csChargingProfiles"]["chargingSchedule"]["duration"] = p.duration_seconds

        try:
            msg_id = await send_command(cp_id, "SetChargingProfile", profile_payload)
            results.append({
                "charge_point_id": cp_id,
                "connector_id": connector_id,
                "status": "Accepted" if msg_id else "Failed",
                "limit_kw": p.limit_kw,
                "msg_id": msg_id
            })
        except Exception as exc:
            logger.error("Failed to dispatch profile to %s: %s", cp_id, exc)
            results.append({
                "charge_point_id": cp_id,
                "connector_id": connector_id,
                "status": "Error",
                "error": str(exc)
            })

    logger.info("Batch dispatched profiles for site=%s: %s items", site_id, len(results))
    return {
        "site_id": site_id,
        "dispatched_count": len(results),
        "results": results
    }
