# API Reference

This document lists all public HTTP endpoints exposed by the Mapletyne platform. The APIs are served by the following services:
- **Core** (`mapletyne-core`) – FastAPI on port **34800**
- **ChargeApp** (`mapletyne-chargeapp`) – FastAPI on port **34003**
- **Admin UI Backend** (`mapletyne-admin`) – FastAPI on port **34000**

## Authentication & Authorization
- All endpoints require a bearer token obtained via the **OAuth2** flow managed by **Keycloak** (realm `mapletyne`).
- Tokens are validated using the `jwt_required` dependency.  
- Certain admin routes additionally require the `require_site_operator` guard (RBAC role `site_operator`).
- CSRF protection is enforced on state‑changing requests (`POST`, `PUT`, `DELETE`) via the `csrf_protect` dependency.

## Core Service (`/api/v1/`)
| Method | Path | Description | Auth Guard | Request Schema | Response Schema |
|--------|------|-------------|------------|----------------|-----------------|
| GET | `/api/v1/chargers` | List all charger entities. | `jwt_required` | – | `List[Charger]` |
| POST | `/api/v1/chargers` | Create a new charger. | `jwt_required`, `require_site_operator` | `ChargerCreate` | `Charger` |
| GET | `/api/v1/chargers/{uuid}` | Retrieve a charger by UUID. | `jwt_required` | – | `Charger` |
| PATCH | `/api/v1/chargers/{uuid}` | Update a charger (partial). | `jwt_required`, `require_site_operator` | `ChargerUpdate` | `Charger` |
| DELETE | `/api/v1/chargers/{uuid}` | Delete a charger. | `jwt_required`, `require_site_operator` | – | `Message` |
| GET | `/api/v1/sessions` | List active sessions for the logged‑in user. | `jwt_required` | – | `List[Session]` |
| POST | `/api/v1/sessions` | Start a new charging session. | `jwt_required` | `SessionStart` | `Session` |
| POST | `/api/v1/sessions/{uuid}/stop` | Stop an active session. | `jwt_required` | – | `Message` |
| GET | `/api/v1/events/stream` | Server‑Sent Events stream for real‑time OCPP notifications. | `jwt_required` | – | SSE (JSON payload) |

## ChargeApp Service (`/chargeapp/api/`)
| Method | Path | Description | Auth Guard |
|--------|------|-------------|------------|
| GET | `/chargeapp/api/user/profile` | Retrieve the logged‑in user's profile. | `jwt_required` |
| PUT | `/chargeapp/api/user/profile` | Update profile fields (name, email, preferences). | `jwt_required` |
| GET | `/chargeapp/api/vehicles` | List vehicles linked to the user. | `jwt_required` |
| POST | `/chargeapp/api/vehicles` | Register a new vehicle. | `jwt_required` |
| DELETE | `/chargeapp/api/vehicles/{id}` | Remove a vehicle. | `jwt_required` |

## Admin Service (`/admin/api/`)
| Method | Path | Description | Auth Guard |
|--------|------|-------------|------------|
| GET | `/admin/api/users` | List all users (admin only). | `jwt_required`, `require_site_operator` |
| POST | `/admin/api/users` | Create a new user. | `jwt_required`, `require_site_operator` |
| PATCH | `/admin/api/users/{id}` | Update user roles/metadata. | `jwt_required`, `require_site_operator` |
| DELETE | `/admin/api/users/{id}` | Delete a user. | `jwt_required`, `require_site_operator` |
| GET | `/admin/api/audit/logs` | Retrieve audit log entries. | `jwt_required`, `require_site_operator` |

---
### Error Responses
All error payloads conform to the **Problem Details** RFC 7807 format:
```json
{
  "type": "string",
  "title": "string",
  "status": 4xx|5xx,
  "detail": "human readable description",
  "instance": "uri"
}
```
Common status codes:
- **400** – Validation error (Pydantic `ValidationError`).
- **401** – Missing or invalid JWT.
- **403** – Insufficient permissions (RBAC guard failed).
- **404** – Resource not found.
- **409** – Conflict (e.g., duplicate charger ID).
- **500** – Internal server error (unexpected exception).

---
## Pagination
Endpoints returning collections support the standard `limit` & `offset` query parameters. Example:
```
GET /api/v1/chargers?limit=50&offset=100
```

---
## Rate Limiting
All services enforce a per‑IP limit of **120 requests per minute**. Excess requests receive **429 Too Many Requests** with a `Retry-After` header.

---
## OpenAPI Specification
An auto‑generated OpenAPI spec is available at:
```
http://localhost:<port>/openapi.json
```
Replace `<port>` with the service port (e.g., `34800`). The spec can be used with `openapi-typescript` to generate client SDKs.

---
*Generated on $(date)*
