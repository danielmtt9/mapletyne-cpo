# OpenCPO Comprehensive Management & Public API Catalog
This document provides the exhaustive, field-by-field reference for all REST API endpoints exposed by OpenCPO Core, including parameter schemas, required/optional validations, realistic JSON request/response bodies, and HTTP status codes.
### Authentication Schemes
* **Admin JWT Bearer Token**: `Authorization: Bearer <jwt_token>` (obtained via `POST /api/v1/admin/auth/login`)
* **Management API Key**: `X-API-Key: <MANAGEMENT_API_KEY>` (configured in `.env`)
* **Driver JWT Bearer Token**: `Authorization: Bearer <driver_jwt>` (obtained via `POST /api/v1/public/account/login`)
* **Public Endpoints**: No authentication required.

---
## 1. Chargers & Hardware Inventory
### `GET` /api/v1/chargers
**Summary:** List Chargers  
**Description:** List all charge points with live status from Redis.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | No | Filter: online/offline |
| `site` | `query` | `string` | No | Filter by site |
| `simulated` | `query` | `boolean` | No | Include simulated chargers |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers
**Summary:** Create Charger  
**Description:** Register a new charge point manually.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Id |
| `vendor` | `string` | Optional | Vendor |
| `model` | `string` | Optional | Model |
| `serial_number` | `string` | Optional | Serial Number |
| `ocpp_version` | `string` | Optional | Ocpp Version |
| `site` | `string` | Optional | Site |
| `simulated` | `boolean` | Optional | Simulated |
| `display_name` | `any` | Optional | Display Name |
| `address` | `any` | Optional | Address |
| `city` | `any` | Optional | City |
| `latitude` | `any` | Optional | Latitude |
| `longitude` | `any` | Optional | Longitude |
| `max_power_kw` | `any` | Optional | Max Power Kw |
| `tariff_kwh` | `any` | Optional | Tariff Kwh |

#### Request Body Example (`application/json`)
```json
{
  "id": "string_value",
  "vendor": "string_value",
  "model": "string_value",
  "serial_number": "string_value",
  "ocpp_version": "string_value",
  "site": "string_value",
  "simulated": false,
  "display_name": {},
  "address": {},
  "city": {},
  "latitude": {},
  "longitude": {},
  "max_power_kw": {},
  "tariff_kwh": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/chargers
**Summary:** Bulk Delete Chargers  
**Description:** Bulk delete chargers. Default: only simulated/virtual ones.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `simulated` | `query` | `boolean` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/chargers/{cp_id}
**Summary:** Get Charger  
**Description:** Get a specific charge point with connectors and live state.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/chargers/{cp_id}
**Summary:** Delete Charger  
**Description:** Delete a charge point and all its data (connectors, sessions, meter values).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/chargers/{cp_id}/meter-values
**Summary:** Charger Meter Values  
**Description:** Latest meter values per connector for a charge point (live telemetry).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `limit` | `query` | `integer` | No | Number of latest readings per connector |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/chargers/{cp_id}/sessions
**Summary:** Charger Sessions  
**Description:** List sessions for a specific charge point.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `status` | `query` | `string` | No |  |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/start
**Summary:** Remote Start  
**Description:** Send RemoteStartTransaction to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `connector_id` | `integer` | Optional | Connector Id |
| `id_tag` | `string` | Optional | Id Tag |

#### Request Body Example (`application/json`)
```json
{
  "connector_id": 1,
  "id_tag": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/stop
**Summary:** Remote Stop  
**Description:** Send RemoteStopTransaction to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `transaction_id` | `query` | `integer` | No |  |
| `connector_id` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/reset
**Summary:** Reset Charger  
**Description:** Send Reset command to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `reset_type` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/profile
**Summary:** Set Charging Profile  
**Description:** Set charging profile (power limit) on a charger. Used by EMS for smart charging.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `connector_id` | `integer` | Optional | Connector Id |
| `limit_kw` | `number` | **Required** | Limit Kw |
| `duration_seconds` | `integer` | Optional | Duration Seconds |

#### Request Body Example (`application/json`)
```json
{
  "connector_id": 0,
  "limit_kw": 22.5,
  "duration_seconds": 0
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/command
**Summary:** Send Generic Command  
**Description:** Send any OCPP command to a charger. Used by terminal UI and GetConfiguration.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `action` | `string` | **Required** | Action |
| `payload` | `object` | Optional | Payload |

#### Request Body Example (`application/json`)
```json
{
  "action": "string_value",
  "payload": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 2. Remote Charger Operations
### `POST` /api/v1/chargers/{cp_id}/start
**Summary:** Remote Start  
**Description:** Send RemoteStartTransaction to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `connector_id` | `integer` | Optional | Connector Id |
| `id_tag` | `string` | Optional | Id Tag |

#### Request Body Example (`application/json`)
```json
{
  "connector_id": 1,
  "id_tag": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/stop
**Summary:** Remote Stop  
**Description:** Send RemoteStopTransaction to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `transaction_id` | `query` | `integer` | No |  |
| `connector_id` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/reset
**Summary:** Reset Charger  
**Description:** Send Reset command to a charger.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |
| `reset_type` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/chargers/{cp_id}/profile
**Summary:** Set Charging Profile  
**Description:** Set charging profile (power limit) on a charger. Used by EMS for smart charging.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `connector_id` | `integer` | Optional | Connector Id |
| `limit_kw` | `number` | **Required** | Limit Kw |
| `duration_seconds` | `integer` | Optional | Duration Seconds |

#### Request Body Example (`application/json`)
```json
{
  "connector_id": 0,
  "limit_kw": 22.5,
  "duration_seconds": 0
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 3. Charging Sessions & Billing Records
### `GET` /api/v1/sessions
**Summary:** List Sessions  
**Description:** List charging sessions with filters.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | No | Filter: active/completed/failed |
| `charge_point` | `query` | `string` | No |  |
| `auth_id` | `query` | `string` | No |  |
| `simulated` | `query` | `boolean` | No |  |
| `date_from` | `query` | `string` | No | Filter from date (YYYY-MM-DD) |
| `date_to` | `query` | `string` | No | Filter to date (YYYY-MM-DD) |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/sessions/stats/today
**Summary:** Session Stats Today  
**Description:** Today's energy (kWh) and session count.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/sessions/stats/summary
**Summary:** Session Stats  
**Description:** Aggregate session statistics including avg_duration_min.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/sessions/stats/daily
**Summary:** Session Stats Daily  
**Description:** Daily energy and session counts for the last N days.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `days` | `query` | `integer` | No | Number of days to include |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/sessions/{session_id}
**Summary:** Get Session  
**Description:** Get a specific session with meter history.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/sessions/{session_id}/meter
**Summary:** Session Meter Values  
**Description:** Get meter values for a session (from TimescaleDB).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public-sessions/receipts
**Summary:** List Receipt Sessions  
**Description:** List completed public sessions eligible for receipts.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `query` | `integer` | No |  |
| `offset` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 4. Tariffs & Dynamic Pricing
### `GET` /api/v1/tariffs
**Summary:** List Tariffs  
**Description:** List all tariffs.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tariffs
**Summary:** Create Tariff  
**Description:** Create a new tariff.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Id |
| `name` | `string` | **Required** | Name |
| `currency` | `string` | Optional | Currency |
| `energy_rate` | `number` | Optional | Energy Rate |
| `time_rate` | `number` | Optional | Time Rate |
| `idle_rate` | `number` | Optional | Idle Rate |
| `flat_fee` | `number` | Optional | Flat Fee |

#### Request Body Example (`application/json`)
```json
{
  "id": "string_value",
  "name": "string_value",
  "currency": "string_value",
  "energy_rate": 0,
  "time_rate": 0,
  "idle_rate": 0,
  "flat_fee": 0
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/tariffs/{tariff_id}
**Summary:** Update Tariff  
**Description:** Update a tariff.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tariff_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `any` | Optional | Name |
| `energy_rate` | `any` | Optional | Energy Rate |
| `time_rate` | `any` | Optional | Time Rate |
| `idle_rate` | `any` | Optional | Idle Rate |
| `flat_fee` | `any` | Optional | Flat Fee |

#### Request Body Example (`application/json`)
```json
{
  "name": {},
  "energy_rate": {},
  "time_rate": {},
  "idle_rate": {},
  "flat_fee": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/tariffs/{tariff_id}
**Summary:** Delete Tariff  
**Description:** Delete a tariff.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tariff_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pricing/current
**Summary:** Pricing Current  
**Description:** Public — returns current spot price + all tier rates.
Used by charge app to display price before/during session.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pricing/config
**Summary:** Pricing Config  
**Description:** Management — returns all cost components and tier definitions.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/pricing/config
**Summary:** Update Pricing Config  
**Description:** Management — update one or more cost components.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `updates` | `object` | **Required** | Updates |

#### Request Body Example (`application/json`)
```json
{
  "updates": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/pricing/tiers/{tier_id}
**Summary:** Update Pricing Tier  
**Description:** Management — update a pricing tier's margin and/or name.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tier_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `margin_kwh` | `any` | Optional | Margin Kwh |
| `name` | `any` | Optional | Name |
| `description` | `any` | Optional | Description |

#### Request Body Example (`application/json`)
```json
{
  "margin_kwh": {},
  "name": {},
  "description": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pricing/tiers
**Summary:** Create Pricing Tier  
**Description:** Management — create a new pricing tier.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Id |
| `name` | `string` | **Required** | Name |
| `margin_kwh` | `number` | Optional | Margin Kwh |
| `description` | `any` | Optional | Description |

#### Request Body Example (`application/json`)
```json
{
  "id": "string_value",
  "name": "string_value",
  "margin_kwh": 0.0,
  "description": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 5. RFID Tokens & Fleet Groups
### `GET` /api/v1/tokens
**Summary:** List Tokens  
**Description:** List tokens with filters.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `group_id` | `query` | `string` | No |  |
| `status` | `query` | `string` | No |  |
| `type` | `query` | `string` | No |  |
| `search` | `query` | `string` | No |  |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens
**Summary:** Create Token  
**Description:** Create a new token and log the event.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `uid` | `string` | **Required** | Uid |
| `type` | `string` | Optional | Type |
| `status` | `string` | Optional | Status |
| `group_id` | `any` | Optional | Group Id |
| `driver_name` | `any` | Optional | Driver Name |
| `driver_email` | `any` | Optional | Driver Email |
| `driver_phone` | `any` | Optional | Driver Phone |
| `label` | `any` | Optional | Label |
| `card_number` | `any` | Optional | Card Number |
| `valid_from` | `any` | Optional | Valid From |
| `valid_until` | `any` | Optional | Valid Until |

#### Request Body Example (`application/json`)
```json
{
  "uid": "otaskicharger1",
  "type": "string_value",
  "status": "string_value",
  "group_id": {},
  "driver_name": {},
  "driver_email": {},
  "driver_phone": {},
  "label": {},
  "card_number": {},
  "valid_from": {},
  "valid_until": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/tokens/{token_id}
**Summary:** Get Token  
**Description:** Get token detail with recent sessions and events.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/tokens/{token_id}
**Summary:** Update Token  
**Description:** Update token details (not status — use lifecycle endpoints).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `group_id` | `any` | Optional | Group Id |
| `driver_name` | `any` | Optional | Driver Name |
| `driver_email` | `any` | Optional | Driver Email |
| `driver_phone` | `any` | Optional | Driver Phone |
| `label` | `any` | Optional | Label |
| `card_number` | `any` | Optional | Card Number |
| `valid_from` | `any` | Optional | Valid From |
| `valid_until` | `any` | Optional | Valid Until |

#### Request Body Example (`application/json`)
```json
{
  "group_id": {},
  "driver_name": {},
  "driver_email": {},
  "driver_phone": {},
  "label": {},
  "card_number": {},
  "valid_from": {},
  "valid_until": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/tokens/{token_id}
**Summary:** Revoke Token  
**Description:** Revoke (soft delete) a token.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens/{token_id}/activate
**Summary:** Activate Token  
**Description:** Activate a token (ordered/shipped → active).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens/{token_id}/block
**Summary:** Block Token  
**Description:** Block a token with optional reason.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `reason` | `any` | Optional | Reason |

#### Request Body Example (`application/json`)
```json
{
  "reason": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens/{token_id}/unblock
**Summary:** Unblock Token  
**Description:** Unblock a token → active.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens/{token_id}/replace
**Summary:** Replace Token  
**Description:** Create replacement token, link old→new, block old.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `new_uid` | `string` | **Required** | New Uid |
| `driver_name` | `any` | Optional | Driver Name |
| `label` | `any` | Optional | Label |

#### Request Body Example (`application/json`)
```json
{
  "new_uid": "otaskicharger1",
  "driver_name": {},
  "label": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/tokens/purge-test
**Summary:** Purge Test Tokens  
**Description:** Bulk delete test tokens by UID prefix patterns.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/tokens/{token_id}/events
**Summary:** Get Token Events  
**Description:** Get audit trail for a token.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/tokens/{token_id}/sessions
**Summary:** Get Token Sessions  
**Description:** Get all sessions for a token.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token_id` | `path` | `string` | **Yes** |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/groups
**Summary:** List Groups  
**Description:** List all groups with token counts and monthly usage.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/groups
**Summary:** Create Group  
**Description:** Create a new token group.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | Name |
| `billing_email` | `any` | Optional | Billing Email |
| `billing_address` | `any` | Optional | Billing Address |
| `billing_reference` | `any` | Optional | Billing Reference |
| `contact_name` | `any` | Optional | Contact Name |
| `contact_phone` | `any` | Optional | Contact Phone |
| `notes` | `any` | Optional | Notes |

#### Request Body Example (`application/json`)
```json
{
  "name": "string_value",
  "billing_email": {},
  "billing_address": {},
  "billing_reference": {},
  "contact_name": {},
  "contact_phone": {},
  "notes": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/groups/{group_id}
**Summary:** Get Group  
**Description:** Get group detail with all tokens and monthly usage summary.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `group_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/groups/{group_id}
**Summary:** Update Group  
**Description:** Update group details.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `group_id` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `any` | Optional | Name |
| `billing_email` | `any` | Optional | Billing Email |
| `billing_address` | `any` | Optional | Billing Address |
| `billing_reference` | `any` | Optional | Billing Reference |
| `contact_name` | `any` | Optional | Contact Name |
| `contact_phone` | `any` | Optional | Contact Phone |
| `notes` | `any` | Optional | Notes |

#### Request Body Example (`application/json`)
```json
{
  "name": {},
  "billing_email": {},
  "billing_address": {},
  "billing_reference": {},
  "contact_name": {},
  "contact_phone": {},
  "notes": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/groups/{group_id}
**Summary:** Delete Group  
**Description:** Delete group — only if no active tokens.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `group_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/groups/{group_id}/usage
**Summary:** Get Group Usage  
**Description:** Per-card usage breakdown for a given month (YYYY-MM, defaults to current).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `group_id` | `path` | `string` | **Yes** |  |
| `month` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 6. Fleet Vehicles
### `GET` /api/v1/fleet/vehicles
**Summary:** List Vehicles  
**Description:** List fleet vehicles with optional status filter.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | No | Filter by status: active/inactive/maintenance |
| `group` | `query` | `string` | No | Reserved: filter by group (future use) |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/fleet/vehicles
**Summary:** Create Vehicle  
**Description:** Register a new fleet vehicle.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `license_plate` | `string` | **Required** | Vehicle registration / plate identifier |
| `make` | `string` | Optional | Vehicle manufacturer (e.g. Ford, Mercedes, BYD) |
| `model` | `string` | Optional | Vehicle model name (e.g. E-Transit, eVito) |
| `year` | `integer` | Optional | Model manufacturing year |
| `unit_number` | `string` | Optional | Fleet unit asset ID (e.g. "VAN-104") |
| `vin` | `string` | Optional | 17-character Vehicle Identification Number |
| `connector_type` | `string` | Optional | Connector standard: CCS2, Type 2, CHAdeMO, Type 1, CCS1 |
| `status` | `string` | Optional | Operational status: active, inactive, maintenance |
| `battery_capacity_kwh` | `number` | Optional | Nominal battery pack size in kWh (default: 75.0) |
| `usable_battery_kwh` | `number` | Optional | Usable energy capacity in kWh (default: 70.0) |
| `max_ac_power_kw` | `number` | Optional | Max onboard AC charger rating in kW (default: 11.0) |
| `max_dc_power_kw` | `number` | Optional | Max DC fast charge acceptance rate in kW (default: 150.0) |
| `priority_tier` | `integer` | Optional | Shift charging priority (1: Express, 2: Standard, 3: Flexible) |
| `default_depot_site` | `string` | Optional | Primary depot location (e.g. "Newcastle") |
| `assigned_bay_id` | `string` | Optional | Dedicated depot parking & charging bay asset ID |
| `assigned_driver_name` | `string` | Optional | Assigned operator / driver name |
| `telematics_provider` | `string` | Optional | Telematics platform: manual, enode, geotab, samsara |
| `telematics_vehicle_id` | `string` | Optional | External telematics hardware/vehicle identifier |
| `autocharge_mac` | `string` | Optional | Hashed EV MAC address for CCS AutoCharge |
| `pnc_cert_serial` | `string` | Optional | ISO 15118 contract certificate serial |
| `pnc_cert_status` | `string` | Optional | PKI certificate status: active, expired, revoked |

#### Request Body Example (`application/json`)
```json
{
  "license_plate": "NK24 EVX",
  "make": "Ford",
  "model": "E-Transit",
  "year": 2024,
  "unit_number": "VAN-104",
  "vin": "1FTFW1ED4NFA12345",
  "connector_type": "CCS2",
  "status": "active",
  "battery_capacity_kwh": 68.0,
  "usable_battery_kwh": 64.0,
  "max_ac_power_kw": 11.5,
  "max_dc_power_kw": 115.0,
  "priority_tier": 1,
  "default_depot_site": "Newcastle",
  "assigned_bay_id": "BAY-04",
  "assigned_driver_name": "Dave Miller",
  "telematics_provider": "geotab",
  "telematics_vehicle_id": "GEO-TAB-98421",
  "autocharge_mac": "02:42:AC:11:00:02",
  "pnc_cert_serial": "CERT-GB-MTT-0042",
  "pnc_cert_status": "active"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/fleet/vehicles/{vehicle_id}
**Summary:** Get Vehicle  
**Description:** Get a single fleet vehicle by ID.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vehicle_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PATCH` /api/v1/fleet/vehicles/{vehicle_id}
**Summary:** Patch Vehicle  
**Description:** Update fleet vehicle details.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vehicle_id` | `path` | `integer` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `license_plate` | `string` | Optional | Vehicle registration / plate identifier |
| `make` | `string` | Optional | Vehicle manufacturer (e.g. Ford, Mercedes) |
| `model` | `string` | Optional | Vehicle model name |
| `year` | `integer` | Optional | Manufacturing year |
| `unit_number` | `string` | Optional | Fleet unit asset ID |
| `vin` | `string` | Optional | 17-character VIN |
| `connector_type` | `string` | Optional | Connector standard |
| `status` | `string` | Optional | active, inactive, maintenance |
| `battery_capacity_kwh` | `number` | Optional | Nominal battery pack size in kWh |
| `usable_battery_kwh` | `number` | Optional | Usable energy capacity in kWh |
| `max_ac_power_kw` | `number` | Optional | Max onboard AC charger rating in kW |
| `max_dc_power_kw` | `number` | Optional | Max DC fast charge acceptance rate in kW |
| `priority_tier` | `integer` | Optional | Shift charging priority (1, 2, 3) |
| `default_depot_site` | `string` | Optional | Primary depot site |
| `assigned_bay_id` | `string` | Optional | Dedicated bay asset ID |
| `assigned_driver_name` | `string` | Optional | Assigned operator name |
| `telematics_provider` | `string` | Optional | Telematics platform: manual, enode, geotab, samsara |
| `telematics_vehicle_id` | `string` | Optional | External telematics ID |
| `autocharge_mac` | `string` | Optional | EV MAC address |
| `pnc_cert_serial` | `string` | Optional | ISO 15118 contract cert serial |
| `pnc_cert_status` | `string` | Optional | Cert status |

#### Request Body Example (`application/json`)
```json
{
  "battery_capacity_kwh": 75.0,
  "priority_tier": 1,
  "assigned_bay_id": "BAY-04",
  "telematics_provider": "geotab",
  "telematics_vehicle_id": "GEO-TAB-98421"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/fleet/vehicles/{vehicle_id}
**Summary:** Delete Vehicle  
**Description:** Soft-delete a fleet vehicle (sets status to 'inactive').  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vehicle_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/fleet/vehicles/{vehicle_id}/sessions
**Summary:** Vehicle Sessions  
**Description:** Last sessions for a vehicle (matched by license plate as auth_id).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vehicle_id` | `path` | `integer` | **Yes** |  |
| `offset` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/fleet/depots/{site_id}/bays
**Summary:** List Depot Bays  
**Description:** List all physical depot charging bay assets for a site with linked chargers and assigned vehicles.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `path` | `string` | **Yes** | Site identifier (e.g. "Newcastle") |

#### Response Example (`200 OK`)
```json
{
  "bays": [
    {
      "id": 1,
      "site_id": "Newcastle",
      "bay_number": "BAY-01",
      "charge_point_id": "otaskicharger1",
      "connector_id": 1,
      "bay_type": "AC_OVERNIGHT",
      "max_bay_power_kw": 22.0,
      "assigned_vehicle_id": 14,
      "status": "occupied"
    }
  ]
}
```

---

### `POST` /api/v1/fleet/depots/{site_id}/bays
**Summary:** Register Depot Bay  
**Description:** Create a new physical depot bay asset and bind to charge point hardware.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `bay_number` | `string` | **Required** | Physical bay identifier (e.g. "BAY-04") |
| `charge_point_id` | `string` | **Required** | OpenCPO charge point identifier |
| `connector_id` | `integer` | Optional | Connector number (default: 1) |
| `bay_type` | `string` | Optional | AC_OVERNIGHT or DC_FAST_TURNAROUND |
| `max_bay_power_kw` | `number` | Optional | Maximum power limit for this bay |
| `assigned_vehicle_id` | `integer` | Optional | Default assigned fleet vehicle ID |

---

### `GET` /api/v1/fleet/schedules
**Summary:** List Shift Schedules  
**Description:** List active and upcoming shift departure schedules and target SoC milestones.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "schedules": [
    {
      "id": 1,
      "vehicle_id": 14,
      "license_plate": "NK24 EVX",
      "target_departure_at": "2026-09-16T06:30:00Z",
      "target_soc_pct": 90.0,
      "min_emergency_soc_pct": 20.0,
      "status": "charging"
    }
  ]
}
```

---

### `POST` /api/v1/fleet/schedules
**Summary:** Create Shift Schedule  
**Description:** Schedule a vehicle departure deadline and target battery SoC for smart charging optimization.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `vehicle_id` | `integer` | **Required** | Fleet vehicle identifier |
| `target_departure_at` | `string` | **Required** | ISO 8601 target departure timestamp |
| `target_soc_pct` | `number` | Optional | Target SoC percentage (default: 90.0) |
| `min_emergency_soc_pct` | `number` | Optional | Immediate charging floor percentage (default: 20.0) |

---

### `GET` /api/v1/fleet/vehicles/{vehicle_id}/telematics
**Summary:** Get Vehicle Live Telematics  
**Description:** Fetch cached real-time telematics data (SoC, range, odometer, plug status) from Geotab/Samsara/Enode.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "vehicle_id": 14,
  "current_soc_pct": 78.5,
  "battery_health_soh_pct": 98.2,
  "estimated_range_km": 245.0,
  "odometer_km": 18420.5,
  "is_plugged_in": true,
  "last_synced_at": "2026-09-15T13:00:00Z"
}
```

---

### `GET` /api/v1/fleet/depots/{site_id}/snapshot
**Summary:** 360° Depot & Fleet Telemetry Snapshot Export  
**Description:** Export complete atomic state of a depot site for external EMS, SCADA, or VPP systems including all physical bay assets, linked chargers, active electrical meters (kW, V, A per phase), assigned vehicles, live battery SoC %, and shift departure schedules.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `path` | `string` | **Yes** | Target depot site identifier |

#### Response Example (`200 OK`)
```json
{
  "site_id": "Newcastle",
  "timestamp": "2026-09-15T13:30:00Z",
  "electrical_grid": {
    "grid_import_limit_kw": 1000.0,
    "active_grid_import_kw": 420.5,
    "solar_generation_kw": 85.0,
    "bess_discharge_kw": 0.0,
    "facility_base_load_kw": 65.0,
    "available_fleet_headroom_kw": 600.0
  },
  "depot_bays": [
    {
      "bay_id": "BAY-01",
      "bay_number": "01",
      "bay_type": "AC_OVERNIGHT",
      "charge_point_id": "otaskicharger1",
      "connector_id": 1,
      "connector_status": "Charging",
      "active_power_kw": 11.2,
      "active_voltage_v": { "l1": 230.2, "l2": 231.0, "l3": 229.8 },
      "active_current_a": { "l1": 16.1, "l2": 16.2, "l3": 16.0 },
      "energy_delivered_kwh": 34.5,
      "active_transaction_id": 89421,
      "assigned_vehicle": {
        "id": 14,
        "unit_number": "VAN-104",
        "license_plate": "NK24 EVX",
        "vin": "1FTFW1ED4NFA12345",
        "battery_capacity_kwh": 68.0,
        "usable_battery_kwh": 64.0,
        "current_soc_pct": 74.2,
        "priority_tier": 1,
        "telematics_synced_at": "2026-09-15T13:28:00Z",
        "active_schedule": {
          "target_departure_at": "2026-09-16T06:30:00Z",
          "target_soc_pct": 90.0,
          "unfulfilled_energy_risk": false,
          "estimated_ready_at": "2026-09-16T04:15:00Z"
        }
      }
    }
  ]
}
```

---

### `POST` /api/v1/fleet/depots/{site_id}/dispatch-profiles
**Summary:** External EMS Batch Smart Charging Profile Ingestion  
**Description:** Allow external EMS, BMS, or VPP systems to push custom OCPP 1.6 / 2.0.1 smart charging profiles across multiple depot bays with fail-safe watchdog timeout.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `site_id` | `string` | **Required** | Target depot site identifier |
| `watchdog_duration_sec` | `integer` | Optional | Watchdog validity timeout in seconds (default: 300) |
| `profiles` | `array` | **Required** | Array of charger/connector profile schedule blocks |

#### Request Body Example (`application/json`)
```json
{
  "site_id": "Newcastle",
  "watchdog_duration_sec": 300,
  "profiles": [
    {
      "charge_point_id": "otaskicharger1",
      "connector_id": 1,
      "schedule_unit": "W",
      "periods": [
        { "start_period_sec": 0, "limit": 0 },
        { "start_period_sec": 3600, "limit": 11000 },
        { "start_period_sec": 14400, "limit": 7400 }
      ]
    }
  ]
}
```

---

## 7. ISO 15118 PKI & Plug & Charge
### `GET` /api/v1/pki/stats
**Summary:** Pki Stats  
**Description:** PKI statistics — active, revoked, expiring certs.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/expiring
**Summary:** Expiring Certs  
**Description:** List certificates expiring within N days.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `days` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/chain/{cert_type}
**Summary:** Cert Chain  
**Description:** Get the full certificate chain PEM.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cert_type` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/validate
**Summary:** Validate Cert  
**Description:** Validate a certificate against our CA chain.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/revoke
**Summary:** Revoke Cert  
**Description:** Revoke a certificate by serial number.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `serial` | `string` | **Required** | Serial |
| `reason` | `string` | Optional | Reason |

#### Request Body Example (`application/json`)
```json
{
  "serial": "string_value",
  "reason": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/revoke-account
**Summary:** Revoke Account Certs  
**Description:** Revoke ALL active certificates for an account (by email/CN match).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Required** | Email |
| `reason` | `string` | Optional | Reason |

#### Request Body Example (`application/json`)
```json
{
  "email": "string_value",
  "reason": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/crl
**Summary:** Get Crl  
**Description:** Download the Certificate Revocation List.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/ocsp
**Summary:** Ocsp Endpoint  
**Description:** OCSP responder — real-time cert status checks.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/certificates
**Summary:** List Certificates  
**Description:** List all certificates with optional filtering and pagination.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `query` | `string` | No | Filter: active, revoked, expired |
| `type` | `query` | `string` | No | Filter: secc, contract, user |
| `charge_point` | `query` | `string` | No |  |
| `search` | `query` | `string` | No | Search in serial, subject |
| `page` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/certificates/{serial}/download
**Summary:** Download Cert  
**Description:** Download certificate bundle — P12/PFX from users/ dir, or PEM fallback from DB.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `serial` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/certificates/{serial}
**Summary:** Get Certificate  
**Description:** Get full details for a single certificate.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `serial` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/issue/secc
**Summary:** Issue Secc Cert  
**Description:** Issue a SECC certificate for a charge point.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `charge_point_id` | `string` | **Required** | Charge Point Id |
| `csr_pem` | `any` | Optional | Csr Pem |

#### Request Body Example (`application/json`)
```json
{
  "charge_point_id": "string_value",
  "csr_pem": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/issue/contract
**Summary:** Issue Contract Cert  
**Description:** Issue a contract (Plug & Charge) certificate.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `emaid` | `string` | **Required** | Emaid |
| `csr_pem` | `any` | Optional | Csr Pem |

#### Request Body Example (`application/json`)
```json
{
  "emaid": "otaskicharger1",
  "csr_pem": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/pki/issue/user
**Summary:** Issue User Cert  
**Description:** Issue a user client certificate (PKCS#12 or PEM bundle).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | Name |
| `email` | `string` | **Required** | Email |
| `role` | `string` | Optional | Role |
| `validity_days` | `integer` | Optional | Validity Days |
| `cert_format` | `string` | Optional | Cert Format |

#### Request Body Example (`application/json`)
```json
{
  "name": "string_value",
  "email": "string_value",
  "role": "string_value",
  "validity_days": 365,
  "cert_format": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/audit-log
**Summary:** Audit Log  
**Description:** Certificate lifecycle audit log.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `query` | `string` | No | secc, contract, user |
| `date_from` | `query` | `string` | No | ISO date YYYY-MM-DD |
| `date_to` | `query` | `string` | No | ISO date YYYY-MM-DD |
| `limit` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/pki/ca-hierarchy
**Summary:** Ca Hierarchy  
**Description:** Return CA chain info: root CA - sub-CAs with expiry and fingerprints.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 8. Energy Management System (EMS)
### `POST` /api/v1/ems/override
**Summary:** External EMS Site Power Override  
**Description:** Dynamically set or update site power limits from external Building Management Systems (BMS), SCADA, or utility OpenADR 2.0b signals with automatic fail-safe watchdog timeout.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `site_id` | `string` | **Required** | Target EMS site identifier |
| `override_kw` | `number` | **Required** | Power ceiling in kW to enforce across all chargers |
| `ems_mode` | `string` | Optional | Mode: EXTERNAL_OVERRIDE, PEAK_SHAVING, CURTAILMENT |
| `duration_seconds` | `integer` | Optional | Watchdog validity timeout in seconds (default: 300) |
| `priority_shedding_tier` | `integer` | Optional | Target minimum tier to shed (1, 2, or 3) |

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "site_id": "Newcastle",
  "active_override_kw": 400.0,
  "ems_mode": "EXTERNAL_OVERRIDE",
  "expires_at": "2026-09-15T13:30:00Z"
}
```

---

### `GET` /api/v1/ems/override
**Summary:** Get Active EMS Override  
**Description:** Retrieve active external override status, power limits, and remaining watchdog timer.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | **Yes** | Site identifier |

#### Response Example (`200 OK`)
```json
{
  "site_id": "Newcastle",
  "is_override_active": true,
  "override_kw": 400.0,
  "ems_mode": "EXTERNAL_OVERRIDE",
  "remaining_seconds": 240,
  "expires_at": "2026-09-15T13:30:00Z"
}
```

---

### `DELETE` /api/v1/ems/override
**Summary:** Clear EMS Override  
**Description:** Cancel external override immediately and revert to internal automatic optimization.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | **Yes** | Site identifier |

---

### `POST` /api/v1/ems/telemetry
**Summary:** Ems Telemetry Ingest  
**Description:** Ingest a telemetry snapshot from the on-site EMS controller.

Writes to TimescaleDB (ocpp.ems_telemetry) and publishes an
EMS_SITE_UPDATE event to the Redis event stream.

Non-fatal: DB failures are logged and returned in the response body
so the controller can detect them without crashing the ingest loop.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `site_id` | `string` | **Required** | Site Id |
| `grid_kw` | `number` | **Required** | Grid Kw |
| `solar_kw` | `number` | **Required** | Solar Kw |
| `battery_kw` | `number` | **Required** | Battery Kw |
| `battery_soc` | `number` | **Required** | Battery Soc |
| `charger_kw` | `number` | **Required** | Charger Kw |
| `building_kw` | `number` | **Required** | Building Kw |
| `inverter_kw` | `any` | Optional | Inverter Kw |
| `battery_state` | `any` | Optional | Battery State |
| `battery_temp_c` | `any` | Optional | Battery Temp C |
| `battery_voltage_v` | `any` | Optional | Battery Voltage V |
| `frequency_hz` | `any` | Optional | Frequency Hz |
| `grid_v_l1` | `any` | Optional | Grid V L1 |
| `grid_v_l2` | `any` | Optional | Grid V L2 |
| `grid_v_l3` | `any` | Optional | Grid V L3 |
| `grid_i_l1` | `any` | Optional | Grid I L1 |
| `grid_i_l2` | `any` | Optional | Grid I L2 |
| `grid_i_l3` | `any` | Optional | Grid I L3 |
| `strategy` | `any` | Optional | Strategy |
| `command_kw` | `any` | Optional | Command Kw |
| `command_reason` | `any` | Optional | Command Reason |
| `override_kw` | `any` | Optional | Override Kw |
| `ems_mode` | `any` | Optional | Ems Mode |

#### Request Body Example (`application/json`)
```json
{
  "site_id": "string_value",
  "grid_kw": 22.5,
  "solar_kw": 22.5,
  "battery_kw": 22.5,
  "battery_soc": 22.5,
  "charger_kw": 22.5,
  "building_kw": 22.5,
  "inverter_kw": {},
  "battery_state": {},
  "battery_temp_c": {},
  "battery_voltage_v": {},
  "frequency_hz": {},
  "grid_v_l1": {},
  "grid_v_l2": {},
  "grid_v_l3": {},
  "grid_i_l1": {},
  "grid_i_l2": {},
  "grid_i_l3": {},
  "strategy": {},
  "command_kw": {},
  "command_reason": {},
  "override_kw": {},
  "ems_mode": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/sites
**Summary:** Ems Sites List  
**Description:** List all configured EMS sites.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/ems/sites
**Summary:** Ems Site Upsert  
**Description:** Create or update a site configuration.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Id |
| `name` | `string` | **Required** | Name |
| `address` | `any` | Optional | Address |
| `grid_connection_kw` | `number` | Optional | Grid Connection Kw |
| `grid_phases` | `integer` | Optional | Grid Phases |
| `config` | `object` | Optional | Config |
| `strategy` | `string` | Optional | Strategy |
| `strategy_params` | `object` | Optional | Strategy Params |
| `status` | `string` | Optional | Status |

#### Request Body Example (`application/json`)
```json
{
  "id": "string_value",
  "name": "string_value",
  "address": {},
  "grid_connection_kw": 80.0,
  "grid_phases": 3,
  "config": {},
  "strategy": "string_value",
  "strategy_params": {},
  "status": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/sites/{site_id}
**Summary:** Ems Site Get  
**Description:** Get site config including JSONB strategy config.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/live
**Summary:** Ems Live  
**Description:** Latest telemetry snapshot for a site, read from TimescaleDB.

Returns the most recent row from ocpp.ems_telemetry.
For sub-second freshness, consumers should subscribe to the Redis
event stream (EventType.EMS_SITE_UPDATE).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/daily
**Summary:** Ems Daily  
**Description:** Today's cumulative kWh, calculated from raw telemetry since midnight UTC.

Assumes 10-second sample intervals (each row = 10/3600 kWh per kW).
Positive-only sums: negative grid_kw = export, negative battery_kw = discharge.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/history/hourly
**Summary:** Ems History Hourly  
**Description:** Hourly kWh aggregates from the ocpp.ems_hourly continuous aggregate.
Returns rows sorted ascending (oldest first) for time-series charts.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | No |  |
| `days` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ems/history/daily
**Summary:** Ems History Daily  
**Description:** Daily kWh aggregates from the ocpp.ems_daily continuous aggregate.
Returns rows sorted ascending (oldest first) for reports and bar charts.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | `query` | `string` | No |  |
| `months` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 9. OCPI 2.2.1 Roaming
### `GET` /api/v1/ocpi/partners
**Summary:** List Partners  
**Description:** List all OCPI partners.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/ocpi/partners
**Summary:** Create Partner  
**Description:** Manually register an OCPI partner.

Generates a token_a (the token we give them) automatically.
token_b is their token (we use it when calling them) — optional at creation,
they can provide it later during the OCPI handshake.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `party_id` | `string` | **Required** | Party Id |
| `country_code` | `string` | **Required** | Country Code |
| `role` | `string` | Optional | Role |
| `name` | `string` | **Required** | Name |
| `url` | `string` | **Required** | Url |
| `token_b` | `any` | Optional | Token B |
| `base_tariff_id` | `any` | Optional | Base Tariff Id |
| `roaming_fee_kwh` | `any` | Optional | Roaming Fee Kwh |
| `roaming_fee_flat` | `any` | Optional | Roaming Fee Flat |
| `roaming_fee_time` | `any` | Optional | Roaming Fee Time |

#### Request Body Example (`application/json`)
```json
{
  "party_id": "string_value",
  "country_code": "string_value",
  "role": "string_value",
  "name": "string_value",
  "url": "string_value",
  "token_b": {},
  "base_tariff_id": {},
  "roaming_fee_kwh": {},
  "roaming_fee_flat": {},
  "roaming_fee_time": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ocpi/partners/{partner_id}
**Summary:** Get Partner  
**Description:** Get a single OCPI partner by ID.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/ocpi/partners/{partner_id}
**Summary:** Update Partner  
**Description:** Update partner details — name, URL, token, status, or roaming markup.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | `path` | `integer` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `any` | Optional | Name |
| `url` | `any` | Optional | Url |
| `token_b` | `any` | Optional | Token B |
| `status` | `any` | Optional | Status |
| `base_tariff_id` | `any` | Optional | Base Tariff Id |
| `roaming_fee_kwh` | `any` | Optional | Roaming Fee Kwh |
| `roaming_fee_flat` | `any` | Optional | Roaming Fee Flat |
| `roaming_fee_time` | `any` | Optional | Roaming Fee Time |

#### Request Body Example (`application/json`)
```json
{
  "name": {},
  "url": {},
  "token_b": {},
  "status": {},
  "base_tariff_id": {},
  "roaming_fee_kwh": {},
  "roaming_fee_flat": {},
  "roaming_fee_time": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/ocpi/partners/{partner_id}
**Summary:** Delete Partner  
**Description:** Remove an OCPI partner record permanently.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/ocpi/partners/{partner_id}/test
**Summary:** Test Partner Connection  
**Description:** Test connectivity to a roaming partner.

Calls their OCPI versions endpoint (GET /versions) using our stored
token_b (their token). Returns the HTTP status, response time, and
the versions they advertise.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/ocpi/partners/{partner_id}/sync
**Summary:** Sync Partner  
**Description:** Trigger a pull-sync from a roaming partner.

Currently records the sync attempt and returns the partner's locations
count. Full sync implementation (pull CDRs, sessions, tariffs) is
wired in when the OCPI sync worker is active.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `partner_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ocpi/status
**Summary:** Ocpi Status  
**Description:** OCPI module status — our identity, endpoint health, and partner summary.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/ocpi/log
**Summary:** Ocpi Log  
**Description:** Recent OCPI inbound/outbound requests.

Reads from ocpp.ocpi_request_log if it exists. If the table has not been
created yet (schema migration pending), returns an empty list with a note.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `query` | `integer` | No |  |
| `partner_id` | `query` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 10. Real-Time Events & Webhooks
### `GET` /api/v1/events/stream
**Summary:** Event Stream  
**Description:** Server-Sent Events stream — filtered live events.

Consumers subscribe to exactly what they need:
- Charge App:  ?types=charger.status,session.start,session.meter,session.stop
- Portal:      ?types=session&chargers=CP001,CP002
- Admin:       (no filters = full firehose)
- EMS:         ?types=session.meter,charger.status,charger.online,charger.offline  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `types` | `query` | `string` | No | Comma-separated event types: session,charger,auth,pki |
| `chargers` | `query` | `string` | No | Comma-separated charge point IDs |
| `sites` | `query` | `string` | No | Comma-separated site IDs |
| `since` | `query` | `string` | No | Replay from timestamp (ISO or Redis stream ID) |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/events/history
**Summary:** Event History  
**Description:** Query historical events from the stream.

Supports filtering by charge_point and event types. Both `count` and `limit`
are accepted (limit takes precedence when provided).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `since` | `query` | `string` | No | Start (Redis stream ID or '-') |
| `until` | `query` | `string` | No | End (Redis stream ID or '+') |
| `count` | `query` | `integer` | No |  |
| `limit` | `query` | `integer` | No | Alias for count |
| `charge_point` | `query` | `string` | No | Filter by charge point ID |
| `types` | `query` | `string` | No | Comma-separated event types to filter |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/events/info
**Summary:** Stream Info  
**Description:** Event bus health — stream length, consumer groups, lag.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/events/chargers/{cp_id}/live
**Summary:** Charger Live  
**Description:** Live SSE stream for a single charger — only new events, no history replay.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/events/sessions/{session_id}/live
**Summary:** Session Live  
**Description:** Live SSE stream for a single session — only new events, no history replay.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/events/webhooks
**Summary:** Create Webhook  
**Description:** Register a webhook endpoint for event delivery.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `url` | `string` | **Required** | Url |
| `events` | `array` | **Required** | Events |
| `secret` | `string` | Optional | Secret |

#### Request Body Example (`application/json`)
```json
{
  "url": "string_value",
  "events": [
    "string_value"
  ],
  "secret": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/events/webhooks/{webhook_id}
**Summary:** Delete Webhook  
**Description:** Remove a webhook.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `webhook_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 11. Admin Auth, System Settings & Feature Flags
### `GET` /api/v1/features
**Summary:** List Flags  
**Description:** Public endpoint — returns all flags as a simple key:bool map + full details.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/features/{key}
**Summary:** Get Flag  
**Description:** Get Flag  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `key` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/features/{key}
**Summary:** Update Flag  
**Description:** Update Flag  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `key` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `any` | Optional | Enabled |
| `label` | `any` | Optional | Label |
| `description` | `any` | Optional | Description |

#### Request Body Example (`application/json`)
```json
{
  "enabled": {},
  "label": {},
  "description": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/features/{key}/toggle
**Summary:** Toggle Flag  
**Description:** Toggle Flag  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `key` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/auth/login
**Summary:** Login  
**Description:** Authenticate an admin user by email + password.

Validates against ocpp.users using bcrypt. Returns a JWT on success.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `any` | Optional | Email |
| `username` | `any` | Optional | Username |
| `password` | `string` | **Required** | Password |

#### Request Body Example (`application/json`)
```json
{
  "email": {},
  "username": {},
  "password": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/auth/me
**Summary:** Get Me  
**Description:** Verify a JWT and return the current user profile.

Pass token as: ?token=<jwt> or Authorization: Bearer <jwt>  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `query` | `string` | No |  |
| `authorization` | `header` | `string` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/setup/status
**Summary:** Get Setup Status  
**Description:** Return which setup steps are complete. Used by the admin panel to
decide whether to show the wizard or the login page.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/admin
**Summary:** Setup Admin  
**Description:** Create the first admin user.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string (email)` | **Required** | Email |
| `password` | `string` | **Required** | Password |
| `name` | `string` | Optional | Name |

#### Request Body Example (`application/json`)
```json
{
  "email": "driver@otaski.com",
  "password": "string_value",
  "name": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/tailscale
**Summary:** Setup Tailscale  
**Description:** Save Tailscale configuration preferences.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `enable_admin` | `boolean` | Optional | Enable Admin |
| `enable_ocpp16` | `boolean` | Optional | Enable Ocpp16 |
| `enable_ocpp201` | `boolean` | Optional | Enable Ocpp201 |
| `enable_api` | `boolean` | Optional | Enable Api |
| `enable_charge_app` | `boolean` | Optional | Enable Charge App |
| `tags` | `string` | Optional | Tags |

#### Request Body Example (`application/json`)
```json
{
  "enable_admin": true,
  "enable_ocpp16": false,
  "enable_ocpp201": false,
  "enable_api": true,
  "enable_charge_app": false,
  "tags": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/org
**Summary:** Setup Org  
**Description:** Store organization settings.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Optional | Name |
| `timezone` | `string` | Optional | Timezone |
| `currency` | `string` | Optional | Currency |
| `public_url` | `string` | Optional | Public Url |

#### Request Body Example (`application/json`)
```json
{
  "name": "string_value",
  "timezone": "string_value",
  "currency": "string_value",
  "public_url": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/branding
**Summary:** Setup Branding  
**Description:** Save branding and skin preferences.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `accent_color` | `string` | Optional | Accent Color |
| `logo_url` | `string` | Optional | Logo Url |
| `skin` | `string` | Optional | Skin |
| `charge_app_name` | `string` | Optional | Charge App Name |

#### Request Body Example (`application/json`)
```json
{
  "accent_color": "string_value",
  "logo_url": "string_value",
  "skin": "string_value",
  "charge_app_name": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/smtp
**Summary:** Setup Smtp  
**Description:** Save SMTP credentials for the comms module.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `host` | `string` | Optional | Host |
| `port` | `integer` | Optional | Port |
| `username` | `string` | Optional | Username |
| `password` | `string` | Optional | Password |
| `from_email` | `string` | Optional | From Email |
| `use_tls` | `boolean` | Optional | Use Tls |

#### Request Body Example (`application/json`)
```json
{
  "host": "string_value",
  "port": 587,
  "username": "string_value",
  "password": "string_value",
  "from_email": "string_value",
  "use_tls": true
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/pki
**Summary:** Setup Pki  
**Description:** Initialize the PKI (Root CA + User CA).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `org_name` | `string` | Optional | Org Name |
| `country` | `string` | Optional | Country |

#### Request Body Example (`application/json`)
```json
{
  "org_name": "string_value",
  "country": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/pricing
**Summary:** Setup Pricing  
**Description:** Create a default tariff and pricing tier.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `currency` | `string` | Optional | Currency |
| `default_rate_kwh` | `number` | Optional | Default Rate Kwh |
| `tariff_name` | `string` | Optional | Tariff Name |

#### Request Body Example (`application/json`)
```json
{
  "currency": "string_value",
  "default_rate_kwh": 0.35,
  "tariff_name": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/step/features
**Summary:** Setup Features  
**Description:** Toggle feature flags.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `ocpi` | `boolean` | Optional | Ocpi |
| `billing` | `boolean` | Optional | Billing |
| `iso15118` | `boolean` | Optional | Iso15118 |

#### Request Body Example (`application/json`)
```json
{
  "ocpi": false,
  "billing": false,
  "iso15118": false
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/setup/skip/{step}
**Summary:** Skip Step  
**Description:** Mark a setup step as skipped (user will configure manually).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `step` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/update/status
**Summary:** Update Status  
**Description:** Check current installed version vs latest GitHub release.

Enhanced response includes changelog_url, backup_count, and last_update.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/update/run
**Summary:** Update Run  
**Description:** Trigger an update to the latest version.

Runs a database backup FIRST, then triggers update.sh which:
1. Backs up .env
2. Downloads latest release from GitHub
3. Extracts and copies files
4. Restores .env
5. docker compose build + docker compose up -d  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/backups
**Summary:** List Backups  
**Description:** List all backup records (excluding soft-deleted).  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/backups
**Summary:** Create Backup  
**Description:** Create a new database backup.

Runs db-backup.sh backup, then records the backup in ocpp.backup_records.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/backups/{backup_id}/restore
**Summary:** Restore Backup  
**Description:** Restore the database from a specific backup.

Runs db-backup.sh restore <filename> with AUTO_CONFIRM=1.
DANGER: This will restart the core service.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `backup_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/admin/backups/{backup_id}
**Summary:** Delete Backup  
**Description:** Soft-delete a backup record.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `backup_id` | `path` | `integer` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/admin/update/postpone
**Summary:** Postpone Update  
**Description:** Postpone an update notification for a given number of hours.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `hours` | `integer` | Optional | Hours |

#### Request Body Example (`application/json`)
```json
{
  "hours": 24
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/update/changelog
**Summary:** Get Changelog  
**Description:** Fetch the latest release changelog from GitHub.

Caches in Redis for 1 hour to avoid rate limits.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/admin/update/history
**Summary:** Get Update History  
**Description:** Get the update/backup/restore history ordered by most recent first.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/settings
**Summary:** List Settings  
**Description:** Return all settings with secrets masked.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/settings/{key}
**Summary:** Get One Setting  
**Description:** Return single setting with secrets masked.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `key` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/settings/{key}
**Summary:** Update Setting  
**Description:** Update a setting. Secret fields sent as '****' are preserved unchanged.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `key` | `path` | `string` | **Yes** |  |

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `value` | `object` | **Required** | Value |

#### Request Body Example (`application/json`)
```json
{
  "value": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/settings/sms/test
**Summary:** Test Sms  
**Description:** Send a test SMS to verify SMS configuration.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Required** | Phone |

#### Request Body Example (`application/json`)
```json
{
  "phone": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/settings/smtp/test
**Summary:** Test Smtp  
**Description:** Send a test email to verify SMTP configuration.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `to_email` | `string` | **Required** | To Email |

#### Request Body Example (`application/json`)
```json
{
  "to_email": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

## 12. Public Driver & Webhook Endpoints
### `GET` /api/v1/public-sessions/receipts
**Summary:** List Receipt Sessions  
**Description:** List completed public sessions eligible for receipts.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `query` | `integer` | No |  |
| `offset` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/account/register
**Summary:** Register  
**Description:** Create a new driver account.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Required** | Email |
| `password` | `string` | **Required** | Password |
| `name` | `any` | Optional | Name |
| `phone` | `any` | Optional | Phone |
| `language` | `any` | Optional | Language |

#### Request Body Example (`application/json`)
```json
{
  "email": "string_value",
  "password": "string_value",
  "name": {},
  "phone": {},
  "language": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/account/login
**Summary:** Login  
**Description:** Login with email + password, returns JWT.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Required** | Email |
| `password` | `string` | **Required** | Password |

#### Request Body Example (`application/json`)
```json
{
  "email": "string_value",
  "password": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/account/profile
**Summary:** Get Profile  
**Description:** Get own profile — requires JWT.  
**Authentication:** `Driver JWT (Required)`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `PUT` /api/v1/public/account/profile
**Summary:** Update Profile  
**Description:** Update own profile — requires JWT.  
**Authentication:** `Driver JWT (Required)`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `any` | Optional | Name |
| `phone` | `any` | Optional | Phone |
| `language` | `any` | Optional | Language |

#### Request Body Example (`application/json`)
```json
{
  "name": {},
  "phone": {},
  "language": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/account/sessions
**Summary:** Get Account Sessions  
**Description:** Charging history for logged-in account — requires JWT.  
**Authentication:** `Driver JWT (Required)`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `limit` | `query` | `integer` | No |  |
| `offset` | `query` | `integer` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/account/favorites
**Summary:** List Favorites  
**Description:** Return saved charger IDs for the logged-in driver.  
**Authentication:** `Public / None`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/account/favorites/{cp_id}
**Summary:** Save Favorite  
**Description:** Save a charger to favorites. Idempotent.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `DELETE` /api/v1/public/account/favorites/{cp_id}
**Summary:** Delete Favorite  
**Description:** Remove a charger from favorites.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `cp_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/qr/{code}/lookup
**Summary:** Qr Lookup  
**Description:** Resolve a QR sticker code to a charger + connector.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `code` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/chargers/nearby
**Summary:** Chargers Nearby  
**Description:** Return chargers with location data, enriched with live status from Redis.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lat` | `query` | `number` | No |  |
| `lng` | `query` | `number` | No |  |
| `radius` | `query` | `number` | No |  |
| `include_simulated` | `query` | `boolean` | No |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert/identify
**Summary:** Cert Identify  
**Description:** Resolve a client cert serial to a driver account.

Returns the driver's account info + pricing tier if the cert is valid
and linked to a driver_account. Returns 404 if cert is unknown, revoked,
or not linked to any account.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `serial` | `query` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/auth/send-otp
**Summary:** Send Otp  
**Description:** Send OTP code to driver's phone. Stored in Redis with configured TTL.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Required** | Phone |

#### Request Body Example (`application/json`)
```json
{
  "phone": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/auth/verify-otp
**Summary:** Verify Otp  
**Description:** Verify OTP code and return a session token.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Required** | Phone |
| `code` | `string` | **Required** | Code |

#### Request Body Example (`application/json`)
```json
{
  "phone": "string_value",
  "code": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/sessions
**Summary:** Create Session  
**Description:** Create a charging session.
1. Inserts row into ocpp.public_sessions
2. Resolves pricing tier (dynamic pricing if configured, else tariff_kwh fallback)
3. Returns session_id + initial rate

Note: Payment integration is handled by the operator's payment plugin.
The session starts in 'pending' status; payment plugin updates to 'paid'.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `cp_id` | `string` | **Required** | Cp Id |
| `connector_id` | `integer` | **Required** | Connector Id |
| `driver_phone` | `any` | Optional | Driver Phone |
| `driver_email` | `any` | Optional | Driver Email |
| `pricing_tier` | `any` | Optional | Pricing Tier |

#### Request Body Example (`application/json`)
```json
{
  "cp_id": "string_value",
  "connector_id": 1,
  "driver_phone": {},
  "driver_email": {},
  "pricing_tier": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/sessions/{session_id}/cancel
**Summary:** Cancel Session  
**Description:** Cancel a session that hasn't started yet (started_at IS NULL).  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/sessions/{session_id}
**Summary:** Get Session  
**Description:** Poll session status -- used by live session screen.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/sessions/{session_id}/stop
**Summary:** Stop Session  
**Description:** Request charger to stop a session via RemoteStopTransaction.

Does NOT update DB -- the charger confirms via StopTransaction,
which the OCPP handler processes and updates session state.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `session_id` | `path` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `404 Not Found` | Requested entity ID does not exist. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/payments/webhook/stripe
**Summary:** Stripe Webhook  
**Description:** Handles Stripe webhooks (checkout.session.completed, payment_intent.amount_capturable_updated).
Authorizes session and triggers RemoteStartTransaction.  
**Authentication:** `Public / None`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/push/key
**Summary:** Get Vapid Key  
**Description:** Return VAPID public key for client-side push subscription.  
**Authentication:** `Public / None`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/push/subscribe
**Summary:** Subscribe  
**Description:** Store a push subscription for a session.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | `string` | **Required** | Session Id |
| `subscription` | `object` | **Required** | Subscription |

#### Request Body Example (`application/json`)
```json
{
  "session_id": "string_value",
  "subscription": {}
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/push/unsubscribe
**Summary:** Unsubscribe  
**Description:** Remove push subscription for a session.  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | `string` | **Required** | Session Id |

#### Request Body Example (`application/json`)
```json
{
  "session_id": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/payments/webhook
**Summary:** Payment Webhook  
**Description:** Generic payment webhook handler.

Expects JSON body: {"session_id": "<uuid>", "status": "paid"|"cancelled"|...}
Or form data: id=<payment_id> (legacy format — looks up by payment_id).

Payment provider adapters should call this after translating their native format.
Must always return 200 — providers retry on any other status.  
**Authentication:** `Admin JWT / X-API-Key`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `401 Unauthorized` | Missing or expired Bearer JWT / API Key. |
| `403 Forbidden` | Insufficient permissions for operation. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/cert-setup/create-token
**Summary:** Create Setup Token  
**Description:** Create a one-time setup token for a driver.
Called by CPO Admin when admin clicks "Send cert to driver".

Requires management API key (X-API-Key header).  
**Authentication:** `Public / None`  

#### Request Body Fields

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Required** | Email |

#### Request Body Example (`application/json`)
```json
{
  "email": "string_value"
}
```

#### Response Example (`200 OK`)
```json
{
  "token": "string_value",
  "email": "string_value",
  "expires_at": "string_value",
  "setup_url": "string_value"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `400 Bad Request` | Invalid payload or missing required fields. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert-setup/validate
**Summary:** Validate Token  
**Description:** Validate a setup token. Returns driver info if valid.
Called by charge app wizard on page load.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `query` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `POST` /api/v1/public/cert-setup/issue
**Summary:** Issue Driver Cert  
**Description:** Issue a client certificate for the driver.
Returns the P12 password and a one-time download URL.

Called after driver confirms on the wizard page.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `query` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert-setup/download
**Summary:** Download P12  
**Description:** One-time download of the P12 certificate bundle.
Token is stored in Redis with 1h TTL.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `query` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert-setup/root-ca
**Summary:** Download Root Ca  
**Description:** Download the Root CA certificate.
Always public — needed for trust store installation.  
**Authentication:** `Public / None`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert-setup/verify
**Summary:** Verify Cert  
**Description:** Check if the client is sending a valid certificate.
Called by the "Test my certificate" button in the wizard.

Returns the identity if cert is present + valid, or an error if not.  
**Authentication:** `Public / None`  

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

### `GET` /api/v1/public/cert-setup/mobileconfig
**Summary:** Download Mobileconfig  
**Description:** One-time download of .mobileconfig profile for iOS.
Contains Root CA + User Sub-CA + client P12 — all in one install.  
**Authentication:** `Public / None`  

#### Parameters

| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `token` | `query` | `string` | **Yes** |  |

#### Response Example (`200 OK`)
```json
{
  "status": "success"
}
```

#### HTTP Status Codes
| Status Code | Description |
| :--- | :--- |
| `200 OK` | Request completed successfully. |
| `500 Internal Server Error` | Unhandled backend exception. |

---

