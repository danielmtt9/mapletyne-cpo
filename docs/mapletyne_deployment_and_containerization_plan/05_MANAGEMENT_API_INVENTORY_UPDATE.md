# Mapletyne CPO — Management API Inventory Updates

This document outlines the newly added management endpoints available in `mapletyne-core` for fleet depot dispatch, SCADA energy management overrides, and dynamic smart charging.

---

## 1. Depot Cockpit & Bay Management Endpoints

### `GET /api/v1/fleet/depots`
- **Summary**: Depot Capacity & Live Power Headroom
- **Description**: Returns overall depot power draw, active charging sessions, and available grid headroom.
- **Authentication**: `Admin JWT / X-API-Key`
- **Response (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "site_id": "depot-north",
    "total_bays": 12,
    "occupied_bays": 8,
    "total_active_charging_kw": 184.5,
    "grid_import_limit_kw": 350.0,
    "headroom_kw": 165.5,
    "ems_mode": "AUTONOMOUS"
  }
}
```

### `GET /api/v1/fleet/depot-bays`
- **Summary**: Real-Time Charging Bay States
- **Description**: Lists all individual depot bays with docked vehicle VIN/plate, target departure time, and power allocations.
- **Authentication**: `Admin JWT / X-API-Key`
- **Response (`200 OK`)**:
```json
{
  "status": "success",
  "bays": [
    {
      "id": 1,
      "bay_number": "BAY-01",
      "charge_point_id": "CP-01",
      "connector_id": 1,
      "bay_type": "DC_FAST",
      "max_bay_power_kw": 150.0,
      "status": "charging",
      "assigned_vehicle": {
        "license_plate": "EV-99-TYN",
        "target_departure_at": "2026-09-15T18:00:00Z",
        "target_soc_pct": 90,
        "current_soc_pct": 68
      }
    }
  ]
}
```

---

## 2. External EMS / SCADA Override Endpoints

### `POST /api/v1/ems/override`
- **Summary**: External SCADA / EMS Site Limit Override
- **Description**: Allows external Energy Management Systems (such as SkyOp EMS or DSR flexibility aggregators) to dynamically enforce power caps.
- **Authentication**: `Admin JWT / X-API-Key`
- **Request Body**:
```json
{
  "site_id": "depot-north",
  "override_limit_kw": 200.0,
  "duration_seconds": 1800,
  "reason": "DSR_GRID_CURTAILMENT_EVENT"
}
```
- **Response (`200 OK`)**:
```json
{
  "status": "success",
  "message": "EMS external override applied: 200.0 kW for 1800s."
}
```

---

## 3. Dynamic Smart Charging Profile Endpoints

### `POST /api/v1/chargers/{id}/profile`
- **Summary**: OCPP 2.0.1 Dynamic Power Throttling
- **Description**: Sends an immediate `SetChargingProfile.req` to the hardware charger to limit output current/kW.
- **Authentication**: `Admin JWT / X-API-Key`
- **Request Body**:
```json
{
  "connector_id": 1,
  "limit_kw": 75.0,
  "duration_seconds": 0
}
```
- **Response (`200 OK`)**:
```json
{
  "status": "Accepted",
  "charge_point_id": "CP-01",
  "applied_limit_kw": 75.0
}
```
