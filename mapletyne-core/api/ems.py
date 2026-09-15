"""
EMS Data API — Energy Management System telemetry ingest and historical data.

Endpoints:
  POST /api/v1/ems/telemetry                    → ingest telemetry from EMS controller
  GET  /api/v1/ems/sites                        → list all configured sites
  GET  /api/v1/ems/sites/{site_id}              → site config
  GET  /api/v1/ems/live                         → latest telemetry snapshot (per site)
  GET  /api/v1/ems/daily?site_id=X              → today's cumulative kWh
  GET  /api/v1/ems/history/hourly?site_id=X&days=7    → hourly kWh for charts
  GET  /api/v1/ems/history/daily?site_id=X&months=12  → daily kWh for reports

Data flow: EMS controller → POST /telemetry → TimescaleDB + Redis → this API → portal

Schema: all EMS tables live in the `ocpp` schema.
  ocpp.ems_sites      — site configuration
  ocpp.ems_telemetry  — raw 10-second snapshots (TimescaleDB hypertable)
  ocpp.ems_hourly     — continuous aggregate: hourly kWh
  ocpp.ems_daily      — continuous aggregate: daily kWh
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from api.events import get_event_bus
from events.types import Event, EventType
from state.postgres import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ems", tags=["EMS"])


# ── Models ────────────────────────────────────────────────────────────────

class TelemetryRequest(BaseModel):
    """
    EMS telemetry snapshot — posted by the on-site EMS controller every 10 s.

    Required fields cover the core energy balance:
      grid_kw     — import positive, export negative
      solar_kw    — PV generation (always ≥ 0)
      battery_kw  — charge positive, discharge negative
      battery_soc — state of charge 0–100 %
      charger_kw  — total EV charger load (always ≥ 0)
      building_kw — non-charger building consumption (derived by controller)

    Optional fields are logged when available but never required.
    """
    site_id: str
    grid_kw: float
    solar_kw: float
    battery_kw: float
    battery_soc: float
    charger_kw: float
    building_kw: float
    # Inverter / battery detail
    inverter_kw: Optional[float] = None
    battery_state: Optional[str] = None       # "charging" | "discharging" | "idle"
    battery_temp_c: Optional[float] = None
    battery_voltage_v: Optional[float] = None
    # Grid metering
    frequency_hz: Optional[float] = None
    grid_v_l1: Optional[float] = None
    grid_v_l2: Optional[float] = None
    grid_v_l3: Optional[float] = None
    grid_i_l1: Optional[float] = None
    grid_i_l2: Optional[float] = None
    grid_i_l3: Optional[float] = None
    # Control
    strategy: Optional[str] = None
    command_kw: Optional[float] = None
    command_reason: Optional[str] = None
    override_kw: Optional[float] = None
    ems_mode: Optional[str] = None


class SiteCreateRequest(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    grid_connection_kw: float = 80.0
    grid_phases: int = 3
    config: Dict[str, Any] = {}
    strategy: str = "monitor_only"
    strategy_params: Dict[str, Any] = {}
    status: str = "active"


# ── Telemetry ingest ──────────────────────────────────────────────────────

@router.post("/telemetry")
async def ems_telemetry_ingest(req: TelemetryRequest):
    """
    Ingest a telemetry snapshot from the on-site EMS controller.

    Writes to TimescaleDB (ocpp.ems_telemetry) and publishes an
    EMS_SITE_UPDATE event to the Redis event stream.

    Non-fatal: DB failures are logged and returned in the response body
    so the controller can detect them without crashing the ingest loop.
    """
    now = datetime.now(timezone.utc)
    db_ok = False
    bus_ok = False

    # 1. Persist to TimescaleDB
    try:
        async with db.write() as conn:
            await conn.execute("""
                INSERT INTO ocpp.ems_telemetry (
                    time, site_id, grid_kw, solar_kw, battery_kw, battery_soc,
                    battery_state, battery_temp_c, battery_voltage_v,
                    charger_kw, building_kw, inverter_kw, frequency_hz,
                    grid_v_l1, grid_v_l2, grid_v_l3,
                    grid_i_l1, grid_i_l2, grid_i_l3,
                    strategy, command_kw, command_reason, override_kw, ems_mode
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
                )
            """,
                now, req.site_id, req.grid_kw, req.solar_kw, req.battery_kw, req.battery_soc,
                req.battery_state, req.battery_temp_c, req.battery_voltage_v,
                req.charger_kw, req.building_kw, req.inverter_kw, req.frequency_hz,
                req.grid_v_l1, req.grid_v_l2, req.grid_v_l3,
                req.grid_i_l1, req.grid_i_l2, req.grid_i_l3,
                req.strategy, req.command_kw, req.command_reason,
                req.override_kw, req.ems_mode,
            )
        db_ok = True
    except Exception as exc:
        logger.error("ems_telemetry_db_failed site=%s error=%s", req.site_id, exc)

    # 2. Publish to event bus (Redis stream) for live consumers
    try:
        bus = get_event_bus()
        event = Event(
            type=EventType.EMS_SITE_UPDATE,
            site=req.site_id,
            data={
                "grid_kw": req.grid_kw,
                "solar_kw": req.solar_kw,
                "battery_kw": req.battery_kw,
                "battery_soc": req.battery_soc,
                "charger_kw": req.charger_kw,
                "building_kw": req.building_kw,
                "inverter_kw": req.inverter_kw,
                "battery_state": req.battery_state,
                "battery_temp_c": req.battery_temp_c,
                "strategy": req.strategy,
                "command_kw": req.command_kw,
                "command_reason": req.command_reason,
                "override_kw": req.override_kw,
                "ems_mode": req.ems_mode,
            },
        )
        await bus.publish(event)
        bus_ok = True
    except Exception as exc:
        logger.error("ems_telemetry_bus_failed site=%s error=%s", req.site_id, exc)

    if not db_ok:
        return {"ok": False, "ts": now.isoformat(), "error": "db write failed", "bus_ok": bus_ok}

    return {"ok": True, "ts": now.isoformat(), "bus_ok": bus_ok}


# ── Sites ─────────────────────────────────────────────────────────────────

@router.get("/sites")
async def ems_sites_list():
    """List all configured EMS sites."""
    try:
        async with db.read() as conn:
            rows = await conn.fetch("""
                SELECT id, name, address, grid_connection_kw, grid_phases,
                       strategy, strategy_params, status, created_at, updated_at
                FROM ocpp.ems_sites
                ORDER BY name
            """)
        return {"sites": [dict(r) for r in rows], "count": len(rows)}
    except Exception as exc:
        logger.error("ems_sites_list_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.get("/sites/{site_id}")
async def ems_site_get(site_id: str):
    """Get site config including JSONB strategy config."""
    try:
        async with db.read() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, address, grid_connection_kw, grid_phases,
                       config, strategy, strategy_params, status, created_at, updated_at
                FROM ocpp.ems_sites
                WHERE id = $1
            """, site_id)
        if row is None:
            raise HTTPException(404, f"Site '{site_id}' not found")
        return dict(row)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("ems_site_get_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.post("/sites")
async def ems_site_upsert(req: SiteCreateRequest):
    """Create or update a site configuration."""
    import json
    try:
        async with db.write() as conn:
            await conn.execute("""
                INSERT INTO ocpp.ems_sites
                    (id, name, address, grid_connection_kw, grid_phases,
                     config, strategy, strategy_params, status, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    name               = EXCLUDED.name,
                    address            = EXCLUDED.address,
                    grid_connection_kw = EXCLUDED.grid_connection_kw,
                    grid_phases        = EXCLUDED.grid_phases,
                    config             = EXCLUDED.config,
                    strategy           = EXCLUDED.strategy,
                    strategy_params    = EXCLUDED.strategy_params,
                    status             = EXCLUDED.status,
                    updated_at         = NOW()
            """,
                req.id, req.name, req.address, req.grid_connection_kw, req.grid_phases,
                json.dumps(req.config), req.strategy, json.dumps(req.strategy_params), req.status,
            )
        logger.info("ems_site_upserted: %s", req.id)
        return {"ok": True, "site_id": req.id}
    except Exception as exc:
        logger.error("ems_site_upsert_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


# ── Live ──────────────────────────────────────────────────────────────────

@router.get("/live")
async def ems_live(site_id: str = Query("default")):
    """
    Latest telemetry snapshot for a site, read from TimescaleDB.

    Returns the most recent row from ocpp.ems_telemetry.
    For sub-second freshness, consumers should subscribe to the Redis
    event stream (EventType.EMS_SITE_UPDATE).
    """
    try:
        async with db.read() as conn:
            row = await conn.fetchrow("""
                SELECT time, site_id,
                       grid_kw, solar_kw, battery_kw, battery_soc,
                       battery_state, battery_temp_c,
                       charger_kw, building_kw, inverter_kw,
                       strategy, command_kw, ems_mode
                FROM ocpp.ems_telemetry
                WHERE site_id = $1
                ORDER BY time DESC
                LIMIT 1
            """, site_id)
        if row is None:
            return {"site_id": site_id, "status": "no_data"}
        return dict(row)
    except Exception as exc:
        logger.error("ems_live_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


# ── Daily cumulative ──────────────────────────────────────────────────────

@router.get("/daily")
async def ems_daily(site_id: str = Query("default")):
    """
    Today's cumulative kWh, calculated from raw telemetry since midnight UTC.

    Assumes 10-second sample intervals (each row = 10/3600 kWh per kW).
    Positive-only sums: negative grid_kw = export, negative battery_kw = discharge.
    """
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    try:
        async with db.read() as conn:
            row = await conn.fetchrow("""
                SELECT
                  sum(GREATEST(solar_kw,   0) * 10.0 / 3600.0) AS solar_kwh,
                  sum(GREATEST(grid_kw,    0) * 10.0 / 3600.0) AS grid_import_kwh,
                  sum(GREATEST(-grid_kw,   0) * 10.0 / 3600.0) AS grid_export_kwh,
                  sum(GREATEST(charger_kw, 0) * 10.0 / 3600.0) AS charger_kwh,
                  sum(GREATEST(building_kw,0) * 10.0 / 3600.0) AS building_kwh,
                  sum(GREATEST(battery_kw, 0) * 10.0 / 3600.0) AS battery_charge_kwh,
                  sum(GREATEST(-battery_kw,0) * 10.0 / 3600.0) AS battery_discharge_kwh,
                  count(*) AS sample_count
                FROM ocpp.ems_telemetry
                WHERE site_id = $1
                  AND time >= $2
                  AND time < $3
            """, site_id, today_start, now)

        def _f(v) -> float:
            return round(float(v), 3) if v is not None else 0.0

        return {
            "site_id": site_id,
            "date": today_start.date().isoformat(),
            "as_of": now.isoformat(),
            "solar_kwh": _f(row["solar_kwh"]),
            "grid_import_kwh": _f(row["grid_import_kwh"]),
            "grid_export_kwh": _f(row["grid_export_kwh"]),
            "charger_kwh": _f(row["charger_kwh"]),
            "building_kwh": _f(row["building_kwh"]),
            "battery_charge_kwh": _f(row["battery_charge_kwh"]),
            "battery_discharge_kwh": _f(row["battery_discharge_kwh"]),
            "sample_count": int(row["sample_count"] or 0),
        }

    except Exception as exc:
        logger.error("ems_daily_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


# ── Hourly history ────────────────────────────────────────────────────────

@router.get("/history/hourly")
async def ems_history_hourly(
    site_id: str = Query("default"),
    days: int = Query(7, ge=1, le=90),
):
    """
    Hourly kWh aggregates from the ocpp.ems_hourly continuous aggregate.
    Returns rows sorted ascending (oldest first) for time-series charts.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)

    try:
        async with db.read() as conn:
            rows = await conn.fetch("""
                SELECT
                  hour,
                  site_id,
                  round(solar_kwh::numeric,           3) AS solar_kwh,
                  round(grid_import_kwh::numeric,      3) AS grid_import_kwh,
                  round(grid_export_kwh::numeric,      3) AS grid_export_kwh,
                  round(charger_kwh::numeric,          3) AS charger_kwh,
                  round(building_kwh::numeric,         3) AS building_kwh,
                  round(battery_charge_kwh::numeric,   3) AS battery_charge_kwh,
                  round(battery_discharge_kwh::numeric,3) AS battery_discharge_kwh,
                  round(avg_grid_kw::numeric,   2) AS avg_grid_kw,
                  round(max_grid_kw::numeric,   2) AS max_grid_kw,
                  round(avg_solar_kw::numeric,  2) AS avg_solar_kw,
                  round(max_solar_kw::numeric,  2) AS max_solar_kw,
                  round(avg_battery_soc::numeric,1) AS avg_battery_soc,
                  sample_count
                FROM ocpp.ems_hourly
                WHERE site_id = $1
                  AND hour >= $2
                ORDER BY hour ASC
            """, site_id, since)

        return {
            "site_id": site_id,
            "days": days,
            "rows": [dict(r) for r in rows],
            "count": len(rows),
        }

    except Exception as exc:
        logger.error("ems_history_hourly_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


# ── Daily history ─────────────────────────────────────────────────────────

@router.get("/history/daily")
async def ems_history_daily(
    site_id: str = Query("default"),
    months: int = Query(12, ge=1, le=36),
):
    """
    Daily kWh aggregates from the ocpp.ems_daily continuous aggregate.
    Returns rows sorted ascending (oldest first) for reports and bar charts.
    """
    since = datetime.now(timezone.utc) - timedelta(days=months * 31)

    try:
        async with db.read() as conn:
            rows = await conn.fetch("""
                SELECT
                  day,
                  site_id,
                  round(solar_kwh::numeric,           3) AS solar_kwh,
                  round(grid_import_kwh::numeric,      3) AS grid_import_kwh,
                  round(grid_export_kwh::numeric,      3) AS grid_export_kwh,
                  round(charger_kwh::numeric,          3) AS charger_kwh,
                  round(building_kwh::numeric,         3) AS building_kwh,
                  round(battery_charge_kwh::numeric,   3) AS battery_charge_kwh,
                  round(battery_discharge_kwh::numeric,3) AS battery_discharge_kwh,
                  round(avg_grid_kw::numeric,   2) AS avg_grid_kw,
                  round(peak_grid_kw::numeric,  2) AS peak_grid_kw,
                  round(avg_solar_kw::numeric,  2) AS avg_solar_kw,
                  round(peak_solar_kw::numeric, 2) AS peak_solar_kw,
                  round(min_battery_soc::numeric,1) AS min_battery_soc,
                  round(max_battery_soc::numeric,1) AS max_battery_soc,
                  sample_count
                FROM ocpp.ems_daily
                WHERE site_id = $1
                  AND day >= $2
                ORDER BY day ASC
            """, site_id, since)

        return {
            "site_id": site_id,
            "months": months,
            "rows": [dict(r) for r in rows],
            "count": len(rows),
        }

    except Exception as exc:
        logger.error("ems_history_daily_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


# ── External EMS / SCADA Override & Depot Config ──────────────────────────

class EMSOverrideRequest(BaseModel):
    site_id: str = "default"
    override_kw: float = Field(..., ge=0.0, description="Hard power cap in kW enforced across all chargers")
    duration_seconds: int = Field(300, ge=10, le=86400, description="Watchdog expiration timeout in seconds (default 5 min)")
    reason: Optional[str] = "external_scada_curtailment"


class DepotConfigRequest(BaseModel):
    site_id: str
    grid_import_limit_kw: float = 1000.0
    bess_discharge_limit_kw: float = 0.0
    solar_forecast_enabled: bool = False
    tou_tariff_id: Optional[str] = None
    buffer_headroom_kw: float = 10.0
    auto_rebalance_interval_sec: int = 60
    ems_mode: str = "AUTOMATIC_OPTIMIZED"


@router.post("/override")
async def ems_set_override(req: EMSOverrideRequest):
    """
    Set External EMS / SCADA Smart Charging Override Power Cap.
    Enforces a hard kW power ceiling with an automatic fail-safe watchdog timer.
    When duration_seconds elapses without a heartbeat, the site reverts to AUTOMATIC_OPTIMIZED.
    """
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=req.duration_seconds)

    try:
        async with db.write() as conn:
            # Ensure site config exists
            await conn.execute("""
                INSERT INTO ocpp.fleet_depot_config (
                    site_id, ems_mode, external_override_kw, external_override_expires_at, updated_at
                ) VALUES ($1, 'EXTERNAL_OVERRIDE', $2, $3, $4)
                ON CONFLICT (site_id) DO UPDATE SET
                    ems_mode = 'EXTERNAL_OVERRIDE',
                    external_override_kw = EXCLUDED.external_override_kw,
                    external_override_expires_at = EXCLUDED.external_override_expires_at,
                    updated_at = EXCLUDED.updated_at
            """, req.site_id, req.override_kw, expires_at, now)

        # Broadcast event to redis bus
        bus = get_event_bus()
        await bus.publish(Event(
            type=EventType.EMS_SITE_UPDATE,
            site=req.site_id,
            data={
                "event": "external_override_set",
                "override_kw": req.override_kw,
                "duration_seconds": req.duration_seconds,
                "expires_at": expires_at.isoformat(),
                "reason": req.reason,
            }
        ))

        logger.warning(
            "External EMS override active on site=%s cap=%s kW watchdog=%ss reason=%s",
            req.site_id, req.override_kw, req.duration_seconds, req.reason
        )

        return {
            "ok": True,
            "site_id": req.site_id,
            "ems_mode": "EXTERNAL_OVERRIDE",
            "override_kw": req.override_kw,
            "duration_seconds": req.duration_seconds,
            "expires_at": expires_at.isoformat(),
            "reason": req.reason,
        }
    except Exception as exc:
        logger.error("ems_set_override_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.get("/override")
async def ems_get_override(site_id: str = Query("default")):
    """Get active external EMS override status and remaining watchdog duration."""
    now = datetime.now(timezone.utc)
    try:
        async with db.read() as conn:
            row = await conn.fetchrow("""
                SELECT site_id, ems_mode, external_override_kw, external_override_expires_at, grid_import_limit_kw
                FROM ocpp.fleet_depot_config
                WHERE site_id = $1
            """, site_id)

        if not row:
            return {
                "site_id": site_id,
                "ems_mode": "AUTOMATIC_OPTIMIZED",
                "is_override_active": False,
                "override_kw": None,
                "remaining_seconds": 0,
            }

        expires_at = row["external_override_expires_at"]
        is_active = (row["ems_mode"] == "EXTERNAL_OVERRIDE" and expires_at and expires_at > now)
        remaining = max(0, int((expires_at - now).total_seconds())) if is_active and expires_at else 0

        return {
            "site_id": site_id,
            "ems_mode": row["ems_mode"] if is_active else "AUTOMATIC_OPTIMIZED",
            "is_override_active": is_active,
            "override_kw": float(row["external_override_kw"]) if (is_active and row["external_override_kw"]) else None,
            "expires_at": expires_at.isoformat() if is_active and expires_at else None,
            "remaining_seconds": remaining,
            "baseline_limit_kw": float(row["grid_import_limit_kw"]) if row["grid_import_limit_kw"] else 1000.0,
        }
    except Exception as exc:
        logger.error("ems_get_override_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.delete("/override")
async def ems_cancel_override(site_id: str = Query("default")):
    """Cancel external override and immediately restore automatic EMS optimization."""
    now = datetime.now(timezone.utc)
    try:
        async with db.write() as conn:
            await conn.execute("""
                UPDATE ocpp.fleet_depot_config
                SET ems_mode = 'AUTOMATIC_OPTIMIZED',
                    external_override_kw = NULL,
                    external_override_expires_at = NULL,
                    updated_at = $2
                WHERE site_id = $1
            """, site_id, now)

        # Broadcast event
        bus = get_event_bus()
        await bus.publish(Event(
            type=EventType.EMS_SITE_UPDATE,
            site=site_id,
            data={"event": "external_override_cancelled"}
        ))

        logger.info("External EMS override cancelled for site=%s", site_id)
        return {
            "ok": True,
            "site_id": site_id,
            "ems_mode": "AUTOMATIC_OPTIMIZED",
            "message": "Reverted to automatic optimization"
        }
    except Exception as exc:
        logger.error("ems_cancel_override_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.get("/depot-config")
async def ems_get_depot_config(site_id: str = Query("default")):
    """Get site charging capacity limits and smart charging parameters."""
    try:
        async with db.read() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM ocpp.fleet_depot_config WHERE site_id = $1
            """, site_id)

        if not row:
            return {
                "site_id": site_id,
                "grid_import_limit_kw": 1000.0,
                "bess_discharge_limit_kw": 0.0,
                "solar_forecast_enabled": False,
                "tou_tariff_id": None,
                "buffer_headroom_kw": 10.0,
                "auto_rebalance_interval_sec": 60,
                "ems_mode": "AUTOMATIC_OPTIMIZED",
                "external_override_kw": None,
                "external_override_expires_at": None,
            }

        item = dict(row)
        if item.get("updated_at"):
            item["updated_at"] = item["updated_at"].isoformat()
        if item.get("external_override_expires_at"):
            item["external_override_expires_at"] = item["external_override_expires_at"].isoformat()
        for k in ["grid_import_limit_kw", "bess_discharge_limit_kw", "buffer_headroom_kw", "external_override_kw"]:
            if item.get(k) is not None:
                item[k] = float(item[k])
        return item
    except Exception as exc:
        logger.error("ems_get_depot_config_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")


@router.post("/depot-config")
async def ems_save_depot_config(req: DepotConfigRequest):
    """Save or update depot site charging capacity and smart charging parameters."""
    now = datetime.now(timezone.utc)
    try:
        async with db.write() as conn:
            await conn.execute("""
                INSERT INTO ocpp.fleet_depot_config (
                    site_id, grid_import_limit_kw, bess_discharge_limit_kw, solar_forecast_enabled,
                    tou_tariff_id, buffer_headroom_kw, auto_rebalance_interval_sec, ems_mode, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (site_id) DO UPDATE SET
                    grid_import_limit_kw = EXCLUDED.grid_import_limit_kw,
                    bess_discharge_limit_kw = EXCLUDED.bess_discharge_limit_kw,
                    solar_forecast_enabled = EXCLUDED.solar_forecast_enabled,
                    tou_tariff_id = EXCLUDED.tou_tariff_id,
                    buffer_headroom_kw = EXCLUDED.buffer_headroom_kw,
                    auto_rebalance_interval_sec = EXCLUDED.auto_rebalance_interval_sec,
                    ems_mode = EXCLUDED.ems_mode,
                    updated_at = EXCLUDED.updated_at
            """,
                req.site_id, req.grid_import_limit_kw, req.bess_discharge_limit_kw, req.solar_forecast_enabled,
                req.tou_tariff_id, req.buffer_headroom_kw, req.auto_rebalance_interval_sec, req.ems_mode, now
            )

        logger.info("Saved depot config for site=%s", req.site_id)
        return {"ok": True, "site_id": req.site_id}
    except Exception as exc:
        logger.error("ems_save_depot_config_failed: %s", exc)
        raise HTTPException(502, f"Database error: {exc}")

