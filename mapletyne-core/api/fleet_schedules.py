"""
Fleet Shift & Departure Schedules API endpoints.

Manages vehicle duty cycles, shift departure deadlines, target SOC requirements,
and minimum emergency SOC thresholds for the EMS smart charging dispatcher.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from state.postgres import db

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_SCHEDULE_STATUSES = {"scheduled", "in_progress", "completed", "cancelled", "missed"}


# ── Pydantic Models ──────────────────────────────────────────────────────────

class CreateScheduleRequest(BaseModel):
    vehicle_id: int
    target_departure_at: datetime
    target_soc_pct: float = Field(90.0, ge=10, le=100)
    min_emergency_soc_pct: float = Field(20.0, ge=5, le=50)


class PatchScheduleRequest(BaseModel):
    target_departure_at: Optional[datetime] = None
    target_soc_pct: Optional[float] = Field(None, ge=10, le=100)
    min_emergency_soc_pct: Optional[float] = Field(None, ge=5, le=50)
    status: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
async def list_schedules(
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    status: Optional[str] = Query(None, description="Filter by status: scheduled, in_progress, completed, cancelled"),
    from_time: Optional[datetime] = Query(None, description="Filter departure from"),
    to_time: Optional[datetime] = Query(None, description="Filter departure to"),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List fleet vehicle departure schedules with current SOC and priority tier."""
    conditions = ["1=1"]
    params: list = []
    idx = 1

    if vehicle_id is not None:
        conditions.append(f"s.vehicle_id = ${idx}")
        params.append(vehicle_id)
        idx += 1

    if status:
        conditions.append(f"s.status = ${idx}")
        params.append(status)
        idx += 1

    if from_time:
        conditions.append(f"s.target_departure_at >= ${idx}")
        params.append(from_time)
        idx += 1

    if to_time:
        conditions.append(f"s.target_departure_at <= ${idx}")
        params.append(to_time)
        idx += 1

    params.extend([offset, limit])

    async with db.read() as conn:
        rows = await conn.fetch(f"""
            SELECT s.*,
                   v.license_plate, v.unit_number, v.make, v.model,
                   v.battery_capacity_kwh, v.usable_battery_kwh, v.priority_tier,
                   v.default_depot_site, v.assigned_bay_id,
                   t.current_soc_pct, t.is_plugged_in, t.active_charge_session_id
            FROM ocpp.fleet_schedules s
            JOIN ocpp.fleet_vehicles v ON s.vehicle_id = v.id
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE {' AND '.join(conditions)}
            ORDER BY s.target_departure_at ASC
            OFFSET ${idx} LIMIT ${idx + 1}
        """, *params)

        total = await conn.fetchval(f"""
            SELECT COUNT(*) FROM ocpp.fleet_schedules s
            JOIN ocpp.fleet_vehicles v ON s.vehicle_id = v.id
            WHERE {' AND '.join(conditions)}
        """, *params[:-2])

    schedules = []
    for r in rows:
        item = dict(r)
        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()
        if item.get("updated_at"):
            item["updated_at"] = item["updated_at"].isoformat()
        if item.get("target_departure_at"):
            item["target_departure_at"] = item["target_departure_at"].isoformat()
        for k in ["target_soc_pct", "min_emergency_soc_pct", "battery_capacity_kwh", "usable_battery_kwh", "current_soc_pct"]:
            if item.get(k) is not None:
                item[k] = float(item[k])
        schedules.append(item)

    return {"schedules": schedules, "total": total, "offset": offset, "limit": limit}


@router.post("", status_code=201)
async def create_schedule(req: CreateScheduleRequest):
    """Create a new vehicle shift departure schedule."""
    if req.min_emergency_soc_pct >= req.target_soc_pct:
        raise HTTPException(400, "min_emergency_soc_pct must be strictly less than target_soc_pct")

    async with db.write() as conn:
        v_exists = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", req.vehicle_id
        )
        if not v_exists:
            raise HTTPException(404, f"Vehicle {req.vehicle_id} not found")

        row = await conn.fetchrow("""
            INSERT INTO ocpp.fleet_schedules (
                vehicle_id, target_departure_at, target_soc_pct, min_emergency_soc_pct, status
            ) VALUES ($1, $2, $3, $4, 'scheduled')
            RETURNING *
        """, req.vehicle_id, req.target_departure_at, req.target_soc_pct, req.min_emergency_soc_pct)

    logger.info("Created schedule id=%s for vehicle_id=%s departure=%s",
                row["id"], req.vehicle_id, req.target_departure_at)
    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    if item.get("updated_at"):
        item["updated_at"] = item["updated_at"].isoformat()
    if item.get("target_departure_at"):
        item["target_departure_at"] = item["target_departure_at"].isoformat()
    item["target_soc_pct"] = float(item["target_soc_pct"])
    item["min_emergency_soc_pct"] = float(item["min_emergency_soc_pct"])
    return item


@router.get("/{schedule_id}")
async def get_schedule(schedule_id: int):
    """Get single schedule details."""
    async with db.read() as conn:
        row = await conn.fetchrow("""
            SELECT s.*,
                   v.license_plate, v.unit_number, v.make, v.model,
                   v.battery_capacity_kwh, v.usable_battery_kwh, v.priority_tier,
                   t.current_soc_pct, t.is_plugged_in
            FROM ocpp.fleet_schedules s
            JOIN ocpp.fleet_vehicles v ON s.vehicle_id = v.id
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE s.id = $1
        """, schedule_id)

    if not row:
        raise HTTPException(404, f"Schedule {schedule_id} not found")

    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    if item.get("updated_at"):
        item["updated_at"] = item["updated_at"].isoformat()
    if item.get("target_departure_at"):
        item["target_departure_at"] = item["target_departure_at"].isoformat()
    for k in ["target_soc_pct", "min_emergency_soc_pct", "battery_capacity_kwh", "usable_battery_kwh", "current_soc_pct"]:
        if item.get(k) is not None:
            item[k] = float(item[k])
    return item


@router.patch("/{schedule_id}")
async def patch_schedule(schedule_id: int, req: PatchScheduleRequest):
    """Update schedule details or mark completed/cancelled."""
    if req.status is not None and req.status not in VALID_SCHEDULE_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_SCHEDULE_STATUSES)}")

    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_schedules WHERE id = $1", schedule_id
        )
        if not existing:
            raise HTTPException(404, f"Schedule {schedule_id} not found")

        sets: list[str] = ["updated_at = NOW()"]
        params: list = []
        idx = 1

        col_map = {
            "target_departure_at": req.target_departure_at,
            "target_soc_pct": req.target_soc_pct,
            "min_emergency_soc_pct": req.min_emergency_soc_pct,
            "status": req.status,
        }

        for col, val in col_map.items():
            if val is not None:
                sets.append(f"{col} = ${idx}")
                params.append(val)
                idx += 1

        params.append(schedule_id)
        await conn.execute(
            f"UPDATE ocpp.fleet_schedules SET {', '.join(sets)} WHERE id = ${idx}",
            *params,
        )

    logger.info("Patched schedule id=%s", schedule_id)
    return {"id": schedule_id, "status": "updated"}


@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int):
    """Delete a schedule."""
    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_schedules WHERE id = $1", schedule_id
        )
        if not existing:
            raise HTTPException(404, f"Schedule {schedule_id} not found")

        await conn.execute("DELETE FROM ocpp.fleet_schedules WHERE id = $1", schedule_id)

    logger.info("Deleted schedule id=%s", schedule_id)
    return {"id": schedule_id, "deleted": True}
