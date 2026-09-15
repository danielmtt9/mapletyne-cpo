"""
Fleet Vehicles API endpoints.

CRUD for ocpp.fleet_vehicles & ocpp.fleet_telematics_cache.
Supports multi-tier fleet asset registration, battery specs, telematics sync, and session history.

Table: ocpp.fleet_vehicles
Columns:
  id                      SERIAL PRIMARY KEY
  license_plate           TEXT NOT NULL UNIQUE
  make                    TEXT
  model                   TEXT
  connector_type          TEXT ('CCS2'/'Type 2'/'CHAdeMO'/'Type 1'/'CCS1')
  status                  TEXT ('active'/'inactive'/'maintenance')
  pnc_cert_serial         TEXT (nullable)
  pnc_cert_status         TEXT (nullable)
  unit_number             TEXT (nullable)
  vin                     TEXT (nullable, UNIQUE)
  year                    INT (nullable)
  battery_capacity_kwh    NUMERIC(6,2) (default 75.0)
  usable_battery_kwh      NUMERIC(6,2) (default 70.0)
  max_ac_power_kw         NUMERIC(5,2) (default 11.0)
  max_dc_power_kw         NUMERIC(6,2) (default 150.0)
  priority_tier           INT (default 2)
  default_depot_site      TEXT (nullable)
  assigned_bay_id         TEXT (nullable)
  assigned_driver_name    TEXT (nullable)
  cost_center_code        TEXT (nullable)
  telematics_provider     TEXT (default 'manual')
  telematics_vehicle_id   TEXT (nullable)
  autocharge_mac          TEXT (nullable)
  last_session_at         TIMESTAMPTZ (nullable)
  created_at              TIMESTAMPTZ DEFAULT NOW()
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from state.postgres import db

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_STATUSES = {"active", "inactive", "maintenance"}
VALID_CONNECTOR_TYPES = {"CCS2", "Type 2", "CHAdeMO", "Type 1", "CCS1"}
VALID_PRIORITY_TIERS = {1, 2, 3, 4}  # 1: Emergency/VIP, 2: Fixed Route, 3: Flexible, 4: Standby


# ── Request / Response models ──────────────────────────────────────────────

class CreateVehicleRequest(BaseModel):
    license_plate: str
    make: Optional[str] = None
    model: Optional[str] = None
    connector_type: str = "CCS2"
    status: str = "active"
    pnc_cert_serial: Optional[str] = None
    pnc_cert_status: Optional[str] = None
    # Extended fleet asset fields
    unit_number: Optional[str] = None
    vin: Optional[str] = None
    year: Optional[int] = None
    battery_capacity_kwh: Optional[float] = 75.0
    usable_battery_kwh: Optional[float] = 70.0
    max_ac_power_kw: Optional[float] = 11.0
    max_dc_power_kw: Optional[float] = 150.0
    priority_tier: Optional[int] = 2
    default_depot_site: Optional[str] = None
    assigned_bay_id: Optional[str] = None
    assigned_driver_name: Optional[str] = None
    cost_center_code: Optional[str] = None
    telematics_provider: Optional[str] = "manual"
    telematics_vehicle_id: Optional[str] = None
    autocharge_mac: Optional[str] = None


class PatchVehicleRequest(BaseModel):
    license_plate: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    connector_type: Optional[str] = None
    status: Optional[str] = None
    pnc_cert_serial: Optional[str] = None
    pnc_cert_status: Optional[str] = None
    # Extended fleet asset fields
    unit_number: Optional[str] = None
    vin: Optional[str] = None
    year: Optional[int] = None
    battery_capacity_kwh: Optional[float] = None
    usable_battery_kwh: Optional[float] = None
    max_ac_power_kw: Optional[float] = None
    max_dc_power_kw: Optional[float] = None
    priority_tier: Optional[int] = None
    default_depot_site: Optional[str] = None
    assigned_bay_id: Optional[str] = None
    assigned_driver_name: Optional[str] = None
    cost_center_code: Optional[str] = None
    telematics_provider: Optional[str] = None
    telematics_vehicle_id: Optional[str] = None
    autocharge_mac: Optional[str] = None


class TelematicsSyncRequest(BaseModel):
    current_soc_pct: Optional[float] = Field(None, ge=0, le=100)
    battery_health_soh_pct: Optional[float] = Field(None, ge=0, le=100)
    estimated_range_km: Optional[float] = Field(None, ge=0)
    odometer_km: Optional[float] = Field(None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_plugged_in: Optional[bool] = None
    active_charge_session_id: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("")
async def list_vehicles(
    status: Optional[str] = Query(None, description="Filter by status: active/inactive/maintenance"),
    group: Optional[str] = Query(None, description="Filter by depot site or group"),
    priority_tier: Optional[int] = Query(None, description="Filter by priority tier (1-4)"),
    search: Optional[str] = Query(None, description="Search plate, VIN, or unit number"),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """List fleet vehicles with extended asset metadata and live telematics summary."""
    conditions = ["1=1"]
    params: list = []
    idx = 1

    if status:
        conditions.append(f"v.status = ${idx}")
        params.append(status)
        idx += 1

    if group:
        conditions.append(f"v.default_depot_site = ${idx}")
        params.append(group)
        idx += 1

    if priority_tier:
        conditions.append(f"v.priority_tier = ${idx}")
        params.append(priority_tier)
        idx += 1

    if search:
        search_pattern = f"%{search.strip()}%"
        conditions.append(f"(v.license_plate ILIKE ${idx} OR v.vin ILIKE ${idx} OR v.unit_number ILIKE ${idx} OR v.assigned_driver_name ILIKE ${idx})")
        params.append(search_pattern)
        idx += 1

    params.extend([offset, limit])

    async with db.read() as conn:
        rows = await conn.fetch(f"""
            SELECT v.*,
                   t.current_soc_pct,
                   t.battery_health_soh_pct,
                   t.estimated_range_km,
                   t.odometer_km,
                   t.latitude,
                   t.longitude,
                   t.is_plugged_in,
                   t.active_charge_session_id,
                   t.last_synced_at AS telematics_synced_at
            FROM ocpp.fleet_vehicles v
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE {' AND '.join(conditions)}
            ORDER BY v.priority_tier ASC, v.status ASC, v.license_plate ASC
            OFFSET ${idx} LIMIT ${idx + 1}
        """, *params)

        total = await conn.fetchval(f"""
            SELECT COUNT(*) FROM ocpp.fleet_vehicles v WHERE {' AND '.join(conditions)}
        """, *params[:-2])

    vehicles = []
    for r in rows:
        item = dict(r)
        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()
        if item.get("last_session_at"):
            item["last_session_at"] = item["last_session_at"].isoformat()
        if item.get("telematics_synced_at"):
            item["telematics_synced_at"] = item["telematics_synced_at"].isoformat()
        for key in ["battery_capacity_kwh", "usable_battery_kwh", "max_ac_power_kw", "max_dc_power_kw",
                    "current_soc_pct", "battery_health_soh_pct", "estimated_range_km", "odometer_km",
                    "latitude", "longitude"]:
            if item.get(key) is not None:
                item[key] = float(item[key])
        vehicles.append(item)

    return {"vehicles": vehicles, "total": total, "offset": offset, "limit": limit}


@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: int):
    """Get a single fleet vehicle by ID including full specifications and telematics cache."""
    async with db.read() as conn:
        row = await conn.fetchrow("""
            SELECT v.*,
                   t.current_soc_pct,
                   t.battery_health_soh_pct,
                   t.estimated_range_km,
                   t.odometer_km,
                   t.latitude,
                   t.longitude,
                   t.is_plugged_in,
                   t.active_charge_session_id,
                   t.last_synced_at AS telematics_synced_at
            FROM ocpp.fleet_vehicles v
            LEFT JOIN ocpp.fleet_telematics_cache t ON v.id = t.vehicle_id
            WHERE v.id = $1
        """, vehicle_id)
    if not row:
        raise HTTPException(404, f"Vehicle {vehicle_id} not found")
    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    if item.get("last_session_at"):
        item["last_session_at"] = item["last_session_at"].isoformat()
    if item.get("telematics_synced_at"):
        item["telematics_synced_at"] = item["telematics_synced_at"].isoformat()
    for key in ["battery_capacity_kwh", "usable_battery_kwh", "max_ac_power_kw", "max_dc_power_kw",
                "current_soc_pct", "battery_health_soh_pct", "estimated_range_km", "odometer_km",
                "latitude", "longitude"]:
        if item.get(key) is not None:
            item[key] = float(item[key])
    return item


@router.post("", status_code=201)
async def create_vehicle(req: CreateVehicleRequest):
    """Register a new fleet vehicle with full asset parameters."""
    if req.status not in VALID_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUSES)}")
    if req.connector_type not in VALID_CONNECTOR_TYPES:
        raise HTTPException(400, f"connector_type must be one of {sorted(VALID_CONNECTOR_TYPES)}")
    if req.priority_tier is not None and req.priority_tier not in VALID_PRIORITY_TIERS:
        raise HTTPException(400, f"priority_tier must be one of {sorted(VALID_PRIORITY_TIERS)}")

    license_plate = req.license_plate.upper().strip()
    vin = req.vin.upper().strip() if req.vin else None
    autocharge_mac = req.autocharge_mac.lower().strip() if req.autocharge_mac else None

    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_vehicles WHERE UPPER(license_plate) = $1",
            license_plate,
        )
        if existing:
            raise HTTPException(409, f"Vehicle with license plate {license_plate} already exists")

        if vin:
            existing_vin = await conn.fetchval(
                "SELECT id FROM ocpp.fleet_vehicles WHERE UPPER(vin) = $1",
                vin,
            )
            if existing_vin:
                raise HTTPException(409, f"Vehicle with VIN {vin} already exists")

        row = await conn.fetchrow("""
            INSERT INTO ocpp.fleet_vehicles (
                license_plate, make, model, connector_type, status,
                pnc_cert_serial, pnc_cert_status, unit_number, vin, year,
                battery_capacity_kwh, usable_battery_kwh, max_ac_power_kw, max_dc_power_kw,
                priority_tier, default_depot_site, assigned_bay_id, assigned_driver_name,
                cost_center_code, telematics_provider, telematics_vehicle_id, autocharge_mac
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16, $17, $18,
                $19, $20, $21, $22
            )
            RETURNING *
        """,
            license_plate, req.make, req.model, req.connector_type, req.status,
            req.pnc_cert_serial, req.pnc_cert_status, req.unit_number, vin, req.year,
            req.battery_capacity_kwh, req.usable_battery_kwh, req.max_ac_power_kw, req.max_dc_power_kw,
            req.priority_tier, req.default_depot_site, req.assigned_bay_id, req.assigned_driver_name,
            req.cost_center_code, req.telematics_provider, req.telematics_vehicle_id, autocharge_mac
        )

        # Initialize empty telematics cache entry
        await conn.execute("""
            INSERT INTO ocpp.fleet_telematics_cache (vehicle_id, current_soc_pct, last_synced_at)
            VALUES ($1, 50.0, NOW())
            ON CONFLICT (vehicle_id) DO NOTHING
        """, row["id"])

    logger.info("Created fleet vehicle id=%s plate=%s unit=%s", row["id"], license_plate, req.unit_number)
    item = dict(row)
    if item.get("created_at"):
        item["created_at"] = item["created_at"].isoformat()
    return item


@router.patch("/{vehicle_id}")
async def patch_vehicle(vehicle_id: int, req: PatchVehicleRequest):
    """Update fleet vehicle details."""
    if req.status is not None and req.status not in VALID_STATUSES:
        raise HTTPException(400, f"status must be one of {sorted(VALID_STATUSES)}")
    if req.connector_type is not None and req.connector_type not in VALID_CONNECTOR_TYPES:
        raise HTTPException(400, f"connector_type must be one of {sorted(VALID_CONNECTOR_TYPES)}")
    if req.priority_tier is not None and req.priority_tier not in VALID_PRIORITY_TIERS:
        raise HTTPException(400, f"priority_tier must be one of {sorted(VALID_PRIORITY_TIERS)}")

    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", vehicle_id
        )
        if not existing:
            raise HTTPException(404, f"Vehicle {vehicle_id} not found")

        sets: list[str] = []
        params: list = []
        idx = 1

        col_map = {
            "make": req.make,
            "model": req.model,
            "connector_type": req.connector_type,
            "status": req.status,
            "pnc_cert_serial": req.pnc_cert_serial,
            "pnc_cert_status": req.pnc_cert_status,
            "unit_number": req.unit_number,
            "year": req.year,
            "battery_capacity_kwh": req.battery_capacity_kwh,
            "usable_battery_kwh": req.usable_battery_kwh,
            "max_ac_power_kw": req.max_ac_power_kw,
            "max_dc_power_kw": req.max_dc_power_kw,
            "priority_tier": req.priority_tier,
            "default_depot_site": req.default_depot_site,
            "assigned_bay_id": req.assigned_bay_id,
            "assigned_driver_name": req.assigned_driver_name,
            "cost_center_code": req.cost_center_code,
            "telematics_provider": req.telematics_provider,
            "telematics_vehicle_id": req.telematics_vehicle_id,
        }

        if req.license_plate is not None:
            sets.append(f"license_plate = ${idx}")
            params.append(req.license_plate.upper().strip())
            idx += 1

        if req.vin is not None:
            sets.append(f"vin = ${idx}")
            params.append(req.vin.upper().strip())
            idx += 1

        if req.autocharge_mac is not None:
            sets.append(f"autocharge_mac = ${idx}")
            params.append(req.autocharge_mac.lower().strip())
            idx += 1

        for col, val in col_map.items():
            if val is not None:
                sets.append(f"{col} = ${idx}")
                params.append(val)
                idx += 1

        if not sets:
            raise HTTPException(400, "No fields to update")

        params.append(vehicle_id)
        await conn.execute(
            f"UPDATE ocpp.fleet_vehicles SET {', '.join(sets)} WHERE id = ${idx}",
            *params,
        )

    logger.info("Patched fleet vehicle id=%s", vehicle_id)
    return {"id": vehicle_id, "status": "updated"}


@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: int):
    """Soft-delete a fleet vehicle (sets status to 'inactive')."""
    async with db.write() as conn:
        existing = await conn.fetchval(
            "SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", vehicle_id
        )
        if not existing:
            raise HTTPException(404, f"Vehicle {vehicle_id} not found")

        await conn.execute(
            "UPDATE ocpp.fleet_vehicles SET status = 'inactive' WHERE id = $1",
            vehicle_id,
        )

    logger.info("Soft-deleted fleet vehicle id=%s", vehicle_id)
    return {"id": vehicle_id, "status": "inactive", "deleted": True}


# ── Telematics Endpoints ───────────────────────────────────────────────────

@router.get("/{vehicle_id}/telematics")
async def get_vehicle_telematics(vehicle_id: int):
    """Get live telematics state (SOC, SOH, odometer, coordinates) for a vehicle."""
    async with db.read() as conn:
        row = await conn.fetchrow("""
            SELECT t.*, v.license_plate, v.unit_number, v.battery_capacity_kwh, v.usable_battery_kwh
            FROM ocpp.fleet_telematics_cache t
            JOIN ocpp.fleet_vehicles v ON t.vehicle_id = v.id
            WHERE t.vehicle_id = $1
        """, vehicle_id)

    if not row:
        async with db.read() as conn:
            v_exists = await conn.fetchval("SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", vehicle_id)
        if not v_exists:
            raise HTTPException(404, f"Vehicle {vehicle_id} not found")
        return {
            "vehicle_id": vehicle_id,
            "current_soc_pct": None,
            "battery_health_soh_pct": None,
            "estimated_range_km": None,
            "odometer_km": None,
            "latitude": None,
            "longitude": None,
            "is_plugged_in": False,
            "active_charge_session_id": None,
            "last_synced_at": None,
        }

    item = dict(row)
    if item.get("last_synced_at"):
        item["last_synced_at"] = item["last_synced_at"].isoformat()
    for key in ["current_soc_pct", "battery_health_soh_pct", "estimated_range_km", "odometer_km",
                "latitude", "longitude", "battery_capacity_kwh", "usable_battery_kwh"]:
        if item.get(key) is not None:
            item[key] = float(item[key])
    return item


@router.post("/{vehicle_id}/telematics/sync")
async def sync_vehicle_telematics(vehicle_id: int, req: TelematicsSyncRequest):
    """Sync/ingest telematics data for a vehicle from external telematics provider (Geotab, Samsara, OBD-II)."""
    now = datetime.now(timezone.utc)
    async with db.write() as conn:
        v_exists = await conn.fetchval("SELECT id FROM ocpp.fleet_vehicles WHERE id = $1", vehicle_id)
        if not v_exists:
            raise HTTPException(404, f"Vehicle {vehicle_id} not found")

        await conn.execute("""
            INSERT INTO ocpp.fleet_telematics_cache (
                vehicle_id, current_soc_pct, battery_health_soh_pct, estimated_range_km,
                odometer_km, latitude, longitude, is_plugged_in, active_charge_session_id, last_synced_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (vehicle_id) DO UPDATE SET
                current_soc_pct = COALESCE(EXCLUDED.current_soc_pct, ocpp.fleet_telematics_cache.current_soc_pct),
                battery_health_soh_pct = COALESCE(EXCLUDED.battery_health_soh_pct, ocpp.fleet_telematics_cache.battery_health_soh_pct),
                estimated_range_km = COALESCE(EXCLUDED.estimated_range_km, ocpp.fleet_telematics_cache.estimated_range_km),
                odometer_km = COALESCE(EXCLUDED.odometer_km, ocpp.fleet_telematics_cache.odometer_km),
                latitude = COALESCE(EXCLUDED.latitude, ocpp.fleet_telematics_cache.latitude),
                longitude = COALESCE(EXCLUDED.longitude, ocpp.fleet_telematics_cache.longitude),
                is_plugged_in = COALESCE(EXCLUDED.is_plugged_in, ocpp.fleet_telematics_cache.is_plugged_in),
                active_charge_session_id = COALESCE(EXCLUDED.active_charge_session_id, ocpp.fleet_telematics_cache.active_charge_session_id),
                last_synced_at = EXCLUDED.last_synced_at
        """,
            vehicle_id, req.current_soc_pct, req.battery_health_soh_pct, req.estimated_range_km,
            req.odometer_km, req.latitude, req.longitude, req.is_plugged_in,
            req.active_charge_session_id, now
        )

    logger.info("Synced telematics for vehicle_id=%s soc=%s", vehicle_id, req.current_soc_pct)
    return {"vehicle_id": vehicle_id, "synced": True, "timestamp": now.isoformat()}


@router.get("/{vehicle_id}/sessions")
async def vehicle_sessions(
    vehicle_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """Last sessions for a vehicle (matched by license plate, VIN, or autocharge_mac as auth_id)."""
    async with db.read() as conn:
        vehicle = await conn.fetchrow(
            "SELECT id, license_plate, vin, autocharge_mac FROM ocpp.fleet_vehicles WHERE id = $1", vehicle_id
        )
        if not vehicle:
            raise HTTPException(404, f"Vehicle {vehicle_id} not found")

        plate_norm = vehicle["license_plate"].replace("-", "").upper()
        vin_norm = vehicle["vin"].upper() if vehicle.get("vin") else None
        mac_norm = vehicle["autocharge_mac"].lower() if vehicle.get("autocharge_mac") else None

        auth_ids = [plate_norm]
        if vin_norm:
            auth_ids.append(vin_norm)
        if mac_norm:
            auth_ids.append(mac_norm)

        sessions = await conn.fetch("""
            SELECT id, charge_point, connector_id, start_time, stop_time,
                   status, energy_kwh, peak_power_kw, auth_id
            FROM ocpp.sessions
            WHERE UPPER(REPLACE(auth_id, '-', '')) = ANY($1)
            ORDER BY start_time DESC
            OFFSET $2 LIMIT $3
        """, auth_ids, offset, limit)

    return {
        "vehicle_id": vehicle_id,
        "license_plate": vehicle["license_plate"],
        "sessions": [
            {
                **dict(s),
                "id": str(s["id"]),
                "start_time": s["start_time"].isoformat() if s["start_time"] else None,
                "stop_time": s["stop_time"].isoformat() if s["stop_time"] else None,
            }
            for s in sessions
        ],
        "offset": offset,
        "limit": limit,
    }
