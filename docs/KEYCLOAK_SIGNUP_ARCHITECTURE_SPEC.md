# Keycloak Two-Step Self-Registration & SMTP Verification Architecture

```yaml
title: OpenCPO Keycloak Two-Step Self-Registration Specification
version: "1.0.0"
date: "2026-09-08"
status: approved
author: Winston (System Architect) & Danielaroko
scope: User Registration, Multi-Role Onboarding, SMTP Verification, Keycloak Admin API
components: [quay.io/keycloak/keycloak:26, opencpo-core, mtt-admin, opencpo-charge-app, redis, postgresql]
```

---

## 1. Executive Summary & Design Paradigm

This document specifies the architecture and implementation for the **Two-Step Self-Registration System** powered by Keycloak 26 and SMTP email verification.

Users can self-register directly through the dark glassmorphic landing page interface for three account roles:
1. **EV Driver (`driver`)**: Immediate access to driver charging portal, personal RFID tokens, and session payments.
2. **Station Host / Operator (`site-operator`)**: Access to charge point control, telemetry, and revenue splits.
3. **Fleet Manager (`fleet-manager`)**: Access to corporate RFID tokens and EV fleet vehicle assignments.

```
+----------------------------------------------------------------------------------------------------+
|                                    TWO-STEP SIGNUP SEQUENCE                                        |
+----------------------------------------------------------------------------------------------------+

  [ STEP 1: REGISTRATION INTENT ]
  User enters: Name, Email, Password, Role (Driver / Site Operator / Fleet Manager)
        │
        ▼
  POST /api/v1/admin/auth/register/initiate
        │
        ├─► Validates email format & uniqueness
        ├─► Generates 6-Digit Secure Verification Code (10-min TTL)
        ├─► Stores Pending Registration Intent in Redis (key: reg:pending:<email>)
        └─► Dispatches Branded HTML Email via SMTP (smtp.purelymail.com / configured host)
        │
        ▼
  [ STEP 2: EMAIL OTP VERIFICATION CHALLENGE ]
  User enters 6-Digit Code in Dark Glassmorphic Modal
        │
        ▼
  POST /api/v1/admin/auth/register/verify
        │
        ├─► Validates Code against Redis (rate-limited max 5 attempts)
        ├─► Provisions User in Keycloak 26 via Admin REST API (/admin/realms/opencpo/users)
        ├─► Assigns Realm Role (driver, site-operator, fleet-manager)
        ├─► Synchronizes User into PostgreSQL (ocpp.users / ocpp.driver_accounts)
        ├─► Performs Direct Grant Token Exchange for RS256 JWT & Refresh Token
        └─► Deletes Redis Pending Key
        │
        ▼
  [ INSTANT AUTO-LOGIN & REDIRECT ]
  User is immediately authenticated with valid Keycloak session and routed to their portal.
```

---

## 2. Invariant Architectural Decisions

### `AD-12 [ADOPTED]: Two-Step Verification & SMTP Self-Registration Invariant`
- **Binds**: User onboarding, email ownership proof, Keycloak user creation, and role assignment.
- **Prevents**: Spam registrations, unverified email accounts, identity spoofing, and broken external registration redirects.
- **Rule**:
  1. **Two-Step Flow**: Registration requires submitting credentials (Step 1) followed by verifying a 6-digit email code (Step 2) before the Keycloak account is created.
  2. **SMTP Dispatch**: Verification codes MUST be dispatched via the system's configured SMTP settings (`ocpp.settings` `smtp` record) with a branded HTML email template.
  3. **Ephemeral Staging**: Pending registration state and verification codes MUST be stored in Redis with an explicit 600-second (10-minute) TTL and a 5-attempt rate limit.
  4. **Keycloak Service Account Provisioning**: `opencpo-core` uses the confidential `opencpo-backend` client credentials to call Keycloak Admin REST API (`POST /admin/realms/opencpo/users`), creating the user with `emailVerified: true` and attaching the requested realm role.
  5. **Instant Session Token Issuance**: Successful verification automatically executes a Direct Access Grant token exchange, returning RS256 `access_token` and `refresh_token` so the user is logged in instantly without re-typing their password.
  6. **Relational Database Synchronization**: Upon Keycloak creation, the user record is immediately committed to PostgreSQL (`ocpp.users` for operators/managers, `ocpp.driver_accounts` for drivers).

---

## 3. API Contracts & Endpoint Specifications

### 3.1 Initiate Registration (`POST /api/v1/admin/auth/register/initiate`)

**Request Payload**:
```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@energycorp.com",
  "password": "SecurePassword2026!",
  "role": "site-operator",
  "phone": "+44 20 7946 0912",
  "company": "EnergyCorp UK"
}
```

**Validation Rules**:
- `email`: Valid email syntax, lowercase trimmed. Must not already exist in Keycloak or `ocpp.users`.
- `password`: Minimum 8 characters.
- `role`: Must be one of `["driver", "site-operator", "fleet-manager"]`.
- `name`: Non-empty string.

**Response (200 OK)**:
```json
{
  "ok": true,
  "message": "Verification code dispatched to alex.mercer@energycorp.com",
  "email": "alex.mercer@energycorp.com",
  "ttl_seconds": 600
}
```

---

### 3.2 Verify Code & Finalize Registration (`POST /api/v1/admin/auth/register/verify`)

**Request Payload**:
```json
{
  "email": "alex.mercer@energycorp.com",
  "code": "482910"
}
```

**Response (200 OK)**:
```json
{
  "ok": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "refresh_token": "eyJhbGciOiJIUzUxMiIsInR5cCI...",
  "expires_in": 3600,
  "user": {
    "id": 4,
    "email": "alex.mercer@energycorp.com",
    "name": "Alex Mercer",
    "role": "operator",
    "roles": ["site-operator"]
  }
}
```

---

### 3.3 Resend Verification Code (`POST /api/v1/admin/auth/register/resend`)

**Request Payload**:
```json
{
  "email": "alex.mercer@energycorp.com"
}
```

**Rate Limiting**: Minimum 60-second cooldown between resends.

---

## 4. Keycloak Admin REST API Integration

`opencpo-core` integrates with Keycloak Admin REST API:
1. **Obtain Admin Token**:
   ```
   POST /auth/realms/opencpo/protocol/openid-connect/token
   grant_type=client_credentials
   client_id=opencpo-backend
   client_secret=opencpo_kc_backend_secret_2026
   ```
2. **Create User**:
   ```
   POST /auth/admin/realms/opencpo/users
   {
     "username": "alex.mercer@energycorp.com",
     "email": "alex.mercer@energycorp.com",
     "firstName": "Alex",
     "lastName": "Mercer",
     "enabled": true,
     "emailVerified": true,
     "credentials": [{ "type": "password", "value": "SecurePassword2026!", "temporary": false }]
   }
   ```
3. **Assign Realm Role**:
   ```
   POST /auth/admin/realms/opencpo/users/{user_id}/role-mappings/realm
   [{ "id": "<role_id>", "name": "site-operator" }]
   ```

---

## 5. Frontend Dark Glassmorphism Registration UX

### Landing Page / Login View Enhancements (`mtt-admin`):
- Switch between **"Sign In"** and **"Create Account"** tabs.
- Multi-Role selector pill buttons with visual icons:
  - 🚗 **EV Driver**
  - ⚡ **Station Host / Operator**
  - 🏢 **Fleet Manager**
- Modal **Step 2 (OTP Verification Challenge)**:
  - Six auto-advancing digit boxes.
  - Live 10-minute expiration countdown.
  - "Resend Code" button with 60-second cooldown timer.
  - Instant transition into the application upon entering the 6th digit.

---

## 6. Phased Implementation Roadmap

- [ ] **Phase 1: Backend Keycloak Admin Client & Registration Handlers**
  - Add Keycloak Admin REST API helper in `opencpo-core/auth/keycloak_client.py` (`create_user()`, `assign_role()`, `get_admin_token()`).
  - Implement `/api/v1/admin/auth/register/initiate`, `/verify`, and `/resend` in `opencpo-core/api/admin_auth.py`.
  - Add dark-themed HTML verification email template in `opencpo-core/utils.py`.
- [ ] **Phase 2: Frontend Dark Glassmorphic Signup & OTP Modal (`mtt-admin`)**
  - Create `src/components/auth/RegisterModal.tsx` or expand `src/pages/LoginPage.tsx` with Sign In / Sign Up tab switching.
  - Build 6-digit OTP verification modal component with auto-focus and clipboard paste.
- [ ] **Phase 3: Integration, SMTP Dispatch & Automated E2E Testing**
  - Verify full signup flow end-to-end with live verification code delivery.
  - Ensure all 13 phases of `test_e2e_all_apis_buttons_links.py` pass with zero errors.
