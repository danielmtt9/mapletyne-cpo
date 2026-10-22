# Cookie Policy, Local Storage & Tracking Consent Specification

```yaml
title: Mapletyne MTT Charge Cookie Policy & Client Storage Governance
version: "2.0.0"
date: "2026-10-21"
status: approved
author: Murat (Master Test Architect & SecureCoder Lead)
scope: ePrivacy Directive, UK PECR, GDPR Art. 7, CCPA/CPRA, Cookie & Web Storage Inventory
components: [mtt-admin, opencpo-charge-app, keycloak-26, nginx]
```

---

## 1. Regulatory Scope & Zero-Third-Party Ad Tracking Guarantee

This Cookie and Client Storage Policy governs how the Mapletyne MTT Charge Operator Dashboard (`mtt-admin`), Driver Mobile PWA (`opencpo-charge-app`), and Keycloak Identity Server (`auth.opencpo.mapletyne.com` / `/auth/`) store tokens and preferences in user browsers under the **EU ePrivacy Directive (2002/58/EC)**, **UK Privacy and Electronic Communications Regulations (PECR)**, **GDPR**, and **CCPA/CPRA**.

> [!IMPORTANT]
> **Zero Advertising Trackers:** Mapletyne MTT Charge never embeds third-party advertising pixels, cross-site behavioral tracking cookies, or social media retargeting scripts in either the Operator Dashboard or the Driver Mobile PWA.

---

## 2. Complete Cookie & Web Storage Inventory

### 2.1 Strictly Necessary Authentication & Security Cookies (Exempt from Prior Consent)
These cookies and storage keys are strictly required to authenticate users, prevent Cross-Site Request Forgery (CSRF), and maintain OAuth 2.1 / OIDC security sessions under UK PECR Regulation 6(4) and ePrivacy exemptions:

| Name / Key | Storage Mechanism | Issuer / Path | Lifespan / TTL | Security Attributes | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AUTH_SESSION_ID` | HTTP Cookie | Keycloak (`/auth/realms/opencpo/`) | Session | `HttpOnly`, `Secure`, `SameSite=Lax` | Tracks active Keycloak authentication flow state during OIDC login. |
| `KEYCLOAK_IDENTITY` | HTTP Cookie | Keycloak (`/auth/realms/opencpo/`) | 24 Hours (Idle) | `HttpOnly`, `Secure`, `SameSite=Lax` | Cryptographic SSO identity cookie managed by Keycloak 26. |
| `KEYCLOAK_SESSION` | HTTP Cookie | Keycloak (`/auth/realms/opencpo/`) | Max 30 Days | `Secure`, `SameSite=Lax` | Maintains browser SSO session state with the `opencpo` realm. |
| `KC_RESTART` | HTTP Cookie | Keycloak (`/auth/realms/opencpo/`) | Session | `HttpOnly`, `Secure`, `SameSite=Lax` | Recovers OIDC login context if an authentication tab expires mid-flow. |
| `opencpo_token` | `localStorage` | `mtt-admin` / `opencpo-charge-app` | 1 Hour (`3600s`) | Origin-scoped (Protected by strict CSP) | Stores the active RS256 Bearer `access_token` for `/api/v1/*` calls. |
| `opencpo_refresh_token` | `localStorage` | `mtt-admin` / `opencpo-charge-app` | 24 Hours | Origin-scoped (Rotated on refresh) | Used by `api-client.ts` interceptor to transparently renew expired access tokens. |
| `__stripe_mid` / `__stripe_sid` | HTTP Cookie | Stripe Elements (Payment iframe) | 1 Year / 30 Min | `Secure`, `SameSite=Strict` | Strictly necessary fraud prevention and PCI-DSS v4.0 SAQ-A tokenization during ad-hoc EV charging checkout. |

### 2.2 Functional & User Preference Storage
| Name / Key | Storage Mechanism | Lifespan / TTL | Default State | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `opencpo_theme_prefs` | `localStorage` | Persistent | Active (User-initiated) | Remembers UI contrast mode, sidebar collapse state, and table pagination density. |
| `opencpo_cookie_consent` | `localStorage` & Cookie | 12 Months | Set upon user choice | Stores the user's timestamped consent record (`necessary_only` vs. `analytics_enabled`). |

### 2.3 Optional Product Diagnostics & Performance Telemetry (Opt-In Only)
| Name / Key | Storage Mechanism | Lifespan / TTL | Default State | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `opencpo_telemetry_opt_in` | `localStorage` | 12 Months | **Disabled (`false`)** | Gates client-side Web Vitals and anonymized UI error reporting. Disabled until explicit affirmative consent is granted. |

---

## 3. Consent Management, GPC Support & Revocation Flow

1. **Prior Affirmative Opt-In:** All non-essential telemetry is **hard-blocked by default** on initial page load. No analytics or client error telemetry is transmitted unless the user clicks **"Accept Optional Telemetry"** in the privacy banner.
2. **Global Privacy Control (GPC) & Do Not Track (DNT):** Both `mtt-admin` and `opencpo-charge-app` inspect `navigator.globalPrivacyControl` and the `Sec-GPC: 1` HTTP header. When detected, optional telemetry is automatically suppressed and locked to `necessary_only` without prompting the user.
3. **One-Click Consent Revocation:**
   - Users can view their current consent timestamp and revoke optional telemetry at any time via the **Privacy & Cookie Preferences** modal in the footer of `mtt-admin` and under **Settings → Privacy** in `opencpo-charge-app`.
   - Upon revocation, all non-essential keys are immediately purged from `localStorage`/`sessionStorage`, and active sessions on logout clear `opencpo_token` and `opencpo_refresh_token`.
