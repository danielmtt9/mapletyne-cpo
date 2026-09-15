-- Migration: 001_fleet_assets_and_depot_bays.sql
-- Description: Multi-Tier Fleet Assets, Depot Bays, Shift Schedules, Telematics & External EMS Overrides

-- 1. Extend ocpp.fleet_vehicles
ALTER TABLE ocpp.fleet_vehicles
  ADD COLUMN IF NOT EXISTS unit_number TEXT,
  ADD COLUMN IF NOT EXISTS vin TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS year INT,
  ADD COLUMN IF NOT EXISTS battery_capacity_kwh NUMERIC(6,2) DEFAULT 75.0,
  ADD COLUMN IF NOT EXISTS usable_battery_kwh NUMERIC(6,2) DEFAULT 70.0,
  ADD COLUMN IF NOT EXISTS max_ac_power_kw NUMERIC(5,2) DEFAULT 11.0,
  ADD COLUMN IF NOT EXISTS max_dc_power_kw NUMERIC(6,2) DEFAULT 150.0,
  ADD COLUMN IF NOT EXISTS priority_tier INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS default_depot_site TEXT,
  ADD COLUMN IF NOT EXISTS assigned_bay_id TEXT,
  ADD COLUMN IF NOT EXISTS assigned_driver_name TEXT,
  ADD COLUMN IF NOT EXISTS cost_center_code TEXT,
  ADD COLUMN IF NOT EXISTS telematics_provider TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS telematics_vehicle_id TEXT,
  ADD COLUMN IF NOT EXISTS autocharge_mac TEXT;

-- 2. Depot Charging Bay Assets Table
CREATE TABLE IF NOT EXISTS ocpp.fleet_depot_bays (
  id SERIAL PRIMARY KEY,
  site_id TEXT NOT NULL,
  bay_number TEXT NOT NULL,
  charge_point_id TEXT NOT NULL REFERENCES ocpp.charge_points(id) ON DELETE CASCADE,
  connector_id INT NOT NULL DEFAULT 1,
  bay_type TEXT NOT NULL DEFAULT 'AC_OVERNIGHT',
  max_bay_power_kw NUMERIC(6,2) DEFAULT 22.0,
  assigned_vehicle_id INT REFERENCES ocpp.fleet_vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, bay_number)
);

-- 3. Fleet Shift Schedules & Target Departure Table
CREATE TABLE IF NOT EXISTS ocpp.fleet_schedules (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES ocpp.fleet_vehicles(id) ON DELETE CASCADE,
  target_departure_at TIMESTAMPTZ NOT NULL,
  target_soc_pct NUMERIC(4,1) NOT NULL DEFAULT 90.0,
  min_emergency_soc_pct NUMERIC(4,1) NOT NULL DEFAULT 20.0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Live Telematics State Cache Table
CREATE TABLE IF NOT EXISTS ocpp.fleet_telematics_cache (
  vehicle_id INT PRIMARY KEY REFERENCES ocpp.fleet_vehicles(id) ON DELETE CASCADE,
  current_soc_pct NUMERIC(4,1),
  battery_health_soh_pct NUMERIC(4,1),
  estimated_range_km NUMERIC(6,1),
  odometer_km NUMERIC(10,1),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  is_plugged_in BOOLEAN DEFAULT FALSE,
  active_charge_session_id TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Depot Site Capacity & External EMS Override Table
CREATE TABLE IF NOT EXISTS ocpp.fleet_depot_config (
  site_id TEXT PRIMARY KEY,
  grid_import_limit_kw NUMERIC(7,2) NOT NULL DEFAULT 1000.0,
  bess_discharge_limit_kw NUMERIC(7,2) DEFAULT 0.0,
  solar_forecast_enabled BOOLEAN DEFAULT FALSE,
  tou_tariff_id TEXT REFERENCES ocpp.tariffs(id),
  buffer_headroom_kw NUMERIC(6,2) DEFAULT 10.0,
  auto_rebalance_interval_sec INT DEFAULT 60,
  ems_mode TEXT NOT NULL DEFAULT 'AUTOMATIC_OPTIMIZED',
  external_override_kw NUMERIC(7,2),
  external_override_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
