# Legal, Privacy, Data Protection & EV Regulatory Compliance Specification

```yaml
title: Mapletyne MTT Charge Legal, Privacy & Regulatory Compliance Specification
version: "2.0.0"
date: "2026-10-21"
status: approved
author: Murat (Master Test Architect & SecureCoder Lead)
scope: UK GDPR, EU GDPR, CCPA/CPRA, PCI-DSS v4.0 SAQ-A, UK PCPR 2023, EU AFIR
components: [opencpo-core, mtt-admin, opencpo-charge-app, keycloak-26, postgresql-16]
```

---

## 1. Terms of Service & Multi-Tenant Data Ownership

1. **Platform License & Acceptable Use:** Access to the Mapletyne MTT Charge CPO Enterprise platform (`opencpo`) is governed by enterprise SaaS or self-hosted licensing agreements. Users and automated roaming partners must not attempt unauthorized OCPP command injection, certificate spoofing, or tariff tampering.
2. **Data Ownership & Controller/Processor Split:**
   - **Charge Point Operators (CPOs) & Site Hosts (Data Controllers):** Retain 100% legal ownership of their station inventories, tariff schedules, commercial Charge Detail Records (CDRs), and corporate fleet rosters.
   - **Mapletyne MTT Charge Platform (Data Processor / Sub-processor):** Processes authentication records, charging telemetry, and billing settlements strictly under the documented instructions of the Controller in accordance with GDPR Article 28 Data Processing Agreements (DPAs).

---

## 2. Privacy Policy & Personal Data Inventory (GDPR / UK GDPR / CCPA)

Mapletyne MTT Charge enforces **Privacy by Design and Default (GDPR Art. 25)** across all driver, fleet, and operator workflows:

| Data Category | Specific Data Elements Collected | Lawful Basis (GDPR Art. 6) | Storage Location & Encryption | Retention Period |
| :--- | :--- | :--- | :--- | :--- |
| **Identity & Account Data** | Full name, email address, phone number, company affiliation, Keycloak `sub` UUID, realm roles. | Art. 6(1)(b) Contract performance | `keycloak` & `ocpp.users` / `ocpp.driver_accounts` (AES-256 at rest, TLS 1.3 in transit) | Active account duration + 90 days post-deletion (excluding statutory tax records). |
| **EV & Authentication Identifiers** | RFID `idTag` / UID, ISO 15118 Contract Certificate `EMAID`, EV MAC address (Autocharge), Vehicle Identification Number (`VIN` — optional for fleet telematics). | Art. 6(1)(b) Contract performance; Art. 6(1)(a) Explicit consent for VIN/Autocharge | `ocpp.tokens` & `ocpp.driver_accounts` (Field-level encryption for VIN) | Immediately revocable by Driver/Fleet Manager; purged upon account erasure. |
| **Location & Session Telemetry** | Station GPS coordinates, EVSE connector ID, session timestamps, power/energy meter values (`Wh`), SoC (`%`). | Art. 6(1)(b) Contract billing & Art. 6(1)(f) Grid safety/load balancing | `ocpp.sessions` | High-frequency meter values aggregated after 90 days; final CDR retained for statutory tax compliance. |
| **Payment & Billing Records** | Masked card brand/last-4 digits, Stripe/Adyen payment intent IDs, tokenized customer IDs, VAT invoices. | Art. 6(1)(b) Contract & Art. 6(1)(c) Legal tax obligation | `ocpp.sessions` / Billing Ledger (Zero raw PAN/CVV stored) | **7 years** (UK HMRC / EU VAT directive statutory retention). |

---

## 3. Data Subject Rights & Automated DSR Execution (GDPR & CCPA/CPRA)

Drivers and operators can exercise their statutory rights directly via the Driver PWA (`/app/settings/privacy`), Operator Portal, or REST API (`/api/v1/driver-accounts/{id}/privacy`):

- **Right of Access & Portability (GDPR Art. 15 & 20 / CCPA Right to Know):** Self-service export generates a machine-readable JSON and PDF archive containing the user's profile, registered RFID/EMAID tokens, and complete historical CDRs within `< 60 seconds`.
- **Right to Erasure / "Right to be Forgotten" (GDPR Art. 17 / CCPA Right to Delete):**
  1. Invoking account deletion immediately purges the user identity from **Keycloak 26** (`DELETE /auth/admin/realms/opencpo/users/{id}`), revokes active JWTs/refresh tokens, and revokes any ISO 15118 Contract Certificates.
  2. Personal fields (`name`, `email`, `phone`, `vin`, `emaid`, `rfid_tag`) in `ocpp.driver_accounts` and `ocpp.tokens` are irreversibly scrubbed.
  3. **Statutory Tax Anonymization Preserve:** Historical financial CDRs in `ocpp.sessions` required for UK HMRC / EU tax audits are unlinked from the user's PII by replacing `driver_account_id` with a non-reversible cryptographic tombstone (`anon_<sha256_salted>`), satisfying both GDPR Art. 17(3)(b) legal retention obligations and personal erasure.
- **CCPA / CPRA Non-Discrimination & "Do Not Sell or Share":** Mapletyne MTT Charge **never sells or shares** personal data or driver location telemetry with third-party data brokers or advertising networks.

---

## 4. Payment Card Industry Compliance (PCI-DSS v4.0 SAQ-A)

- **Zero CHD Touchpoint Architecture:** `opencpo-core`, `mtt-admin`, and `opencpo-charge-app` never receive, process, transmit, or store raw Primary Account Numbers (PAN), CVV/CVC security codes, or magnetic stripe track data.
- **Tokenized Payment Orchestration:**
  - Web and Mobile PWA ad-hoc payments use hosted **Stripe Elements (PaymentElement iframe)** or **Adyen Drop-in** with TLS 1.3 and strict CSP `frame-src` / `script-src` isolation.
  - Contactless physical payment terminals integrated with DCFC hardware process EMV transactions via P2PE (Point-to-Point Encryption) directly to the payment processor, passing only an opaque `payment_reference_token` to `opencpo-core`.

---

## 5. EV Charging Regulatory Compliance (UK PCPR 2023 & EU AFIR)

Mapletyne MTT Charge is architected for full compliance with the **UK Public Charge Point Regulations 2023 (PCPR 2023)** and the **EU Alternative Fuels Infrastructure Regulation (AFIR - Regulation (EU) 2023/1804)**:

### 5.1 Tariff & Pricing Transparency
- **Clear Pre-Session Pricing:** All public tariffs (`/api/v1/tariffs/*`) display exact p/kWh or €/kWh energy rates, time-of-use (ToU) steps, session connection fees, and overstay/idle fees (per minute) clearly on the Driver PWA, QR ad-hoc web page, and station display **prior to session authorization**.
- **No Price Escalation Mid-Session:** Once a charging transaction starts (`TransactionEvent: Started` / `StartTransaction`), the tariff snapshot is cryptographically locked to that session ID so rate changes never retroactively affect an active charge.

### 5.2 Contactless & Ad-Hoc Access Without Registration
- Public charge points ≥ 8 kW (UK PCPR) and ≥ 50 kW (EU AFIR) support frictionless ad-hoc charging via contactless EMV terminal or dynamic QR code (`/app/adhoc/<evse_id>`) without forcing the driver to register a permanent account or download a native app.

### 5.3 Statutory 99% Reliability Reporting & Open Data (OCPI)
- **99% Reliability Calculation (UK PCPR):** `opencpo-core` continuously tracks OCPP `StatusNotification` and `Heartbeat` states across all public rapid/ultra-rapid DC charge points ($\ge 50\text{ kW}$), calculating annual reliability across the network and generating automated statutory compliance reports:
  $$\text{Reliability (\%)} = \left( \frac{T_{\text{total} } - T_{\text{exempt} } - T_{\text{faulted/offline} } }{T_{\text{total} } - T_{\text{exempt} } } \right) \times 100 \ge 99.0\%$$
- **Open Data & Roaming Readiness:** Real-time connector availability (`Available`, `Occupied`, `Reserved`, `Unavailable`, `Faulted`), location metadata, and ad-hoc pricing are exposed in standardized OCPI 2.2.1 format for National Access Points (NAP) and statutory open data consumers.

### 5.4 Itemized VAT Receipt Generation & Retention
- Upon completion of every charging session (`TransactionEvent: Ended` / `StopTransaction`), `opencpo-core` generates an immutable, itemized VAT receipt containing:
  - CPO Legal Entity Name, Address, and VAT/Tax Registration Number (`ENTERPRISE_COMPANY_NAME`, `ENTERPRISE_ADDRESS`, `ENTERPRISE_TAX_NUMBER`).
  - Unique Invoice & CDR Identifier, EVSE ID (`EVSE ID`), and Location.
  - Start/End UTC timestamps, total energy delivered (`kWh` to 3 decimal places), breakdown of energy vs. idle costs, net amount, VAT rate (`%`), VAT amount, and gross total.
- All CDRs and VAT invoices are retained in tamper-evident storage for **7 years** (UK) / **10 years** (EU jurisdictions where applicable).
