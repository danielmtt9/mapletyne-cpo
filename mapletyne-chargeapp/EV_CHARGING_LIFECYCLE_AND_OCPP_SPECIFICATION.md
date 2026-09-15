# End-to-End EV Charging Lifecycle & Protocol Specification

## 1. Executive Overview
This document specifies the complete physical, electrical (IEC 61851 / ISO 15118), protocol (OCPP 1.6-J / OCPP 2.0.1), and application-layer lifecycle of an Electric Vehicle (EV) charging session. It serves as the canonical technical standard for the development, testing, and operation of the **MTT Charge App** and its integration with the **OpenCPO Core CSMS**.

---

## 2. Master Charging Lifecycle Architecture

```
[Driver / MTT Charge App]           [Charge Point (EVSE)]                [Vehicle (EV)]                   [CSMS (Core)]
         │                                  │                                  │                               │
1. Scan QR / Select Station ────────────────┼──────────────────────────────────┼──────────────────────────────▶│
         │                                  │                                  │                               │
2. Plug In Connector ──────────────────────▶│◄─── IEC 61851 Control Pilot ────▶│ (State A ➔ B, Cable Lock)     │
         │                                  │──── StatusNotification(Preparing)───────────────────────────────▶│
         │                                  │◄─── ISO 15118 PLC / TLS Handshake─▶│ (SECC Discovery & Auth)      │
         │                                  │                                  │                               │
3. Tap "Start Charging" ────────────────────┼──────────────────────────────────┼──────────────────────────────▶│
         │                                  │◄─── RemoteStartTransaction / Authorize ──────────────────────────┤
         │                                  │                                  │                               │
4. Safety & Isolation Check ────────────────┼─── Isolation Test / Voltage Sync ─▶│ (State B ➔ C, Contactors Close)
         │                                  │──── StartTransaction / Event(Started) ──────────────────────────▶│
         │                                  │──── StatusNotification(Charging) ───────────────────────────────▶│
         │                                  │                                  │                               │
5. Active Energy Dispensing                 │════ Power Delivery (kW / A) ════▶│                               │
         │◄── SSE / Polling Telemetry ──────┼──── MeterValues (kWh, kW, SoC) ─────────────────────────────────▶│
         │                                  │                                  │                               │
6. Stop Trigger (App / Car / 100% SoC) ─────┼──────────────────────────────────┼──────────────────────────────▶│
         │                                  │◄─── RemoteStopTransaction / EV Pilot State C ➔ B ────────────────┤
         │                                  │                                  │                               │
7. Power Ramp Down                          │─── Open Relays / Zero Arc ──────▶│ (De-energize)                 │
         │                                  │──── StopTransaction / Event(Ended) ─────────────────────────────▶│
         │                                  │──── StatusNotification(Finishing ➔ Available) ──────────────────▶│
         │                                  │                                  │                               │
8. Unlock Connector ───────────────────────▶│─── Solenoid Release ────────────▶│ (Cable Unplugs)               │
         │                                  │                                  │                               │
9. Billing Settlement & Receipt ────────────┼──────────────────────────────────┼──────────────────────────────▶│
```

---

## 3. Detailed 9-Stage Specification

### Stage 1: Station Discovery & Wayfinding
- **Driver Action**: Driver locates a charging station using the live interactive map or scans the physical QR sticker attached to the charge point post (`/c/{code}`).
- **Application Resolution**: 
  - The Charge App queries `GET /api/v1/public/qr/{code}/lookup`.
  - Backend resolves the tuple `{cp_id, connector_id, site_id, evse_id}`.
  - Driver is redirected to `/charge/{cp_id}/{connector_id}`.
- **OCPP State**: Charge point is in `Available` state (heartbeat telemetry streaming every 60s).

---

### Stage 2: Physical Connection & Electrical Handshake
- **Physical Insertion**: Driver connects the charging cable (CCS2, Type 2 AC, CHAdeMO, or NACS) into the vehicle inlet.
- **IEC 61851-1 Control Pilot (CP) Circuit**:
  - **State A (Standby / 12V DC)**: EVSE generates a steady $+12\text{V}$ DC signal on the Control Pilot line.
  - **State B (Vehicle Connected / 9V DC)**: Vehicle connects resistor $R_2$ ($2.74\text{ k}\Omega$) across CP and Protective Earth (PE), dropping voltage from $+12\text{V}$ to $+9\text{V}$.
  - **Proximity Pilot (PP) Circuit**: Resistor coding in the cable plug identifies maximum continuous current rating (e.g. 13A, 20A, 32A, 63A).
- **Mechanical Lock**:
  - The EVSE actuates the electromechanical locking solenoid (locking the Type 2 socket or CCS latch).
  - The vehicle actuates its inlet locking pin.
- **OCPP Message**:
  - `StatusNotification(connectorId=X, status=Preparing, errorCode=NoError)`.
- **High-Level Communication (ISO 15118-2 / ISO 15118-20 / DIN 70121)**:
  - EVCC (Electric Vehicle Communication Controller) and SECC (Supply Equipment Communication Controller) establish a HomePlug GreenPHY Power Line Communication (PLC) link.
  - SECC Discovery Protocol (`SDP`) resolves IPv6 link-local addresses.
  - TLS handshake is established on port 6443.

---

### Stage 3: Driver Authorization & Session Creation
- **Driver Action**: Driver reviews the dynamic tariff rate (e.g. `£0.42/kWh`), estimates charging cost, and taps **"Start Charging"**.
- **Payment & Identity**:
  - Web application submits `POST /api/sessions/create` with `{cp_id, connector_id, driver_phone / auth_token}`.
  - OpenCPO Core pre-authorizes payment via Stripe Pre-Auth / Fleet Account balance.
  - System locks the session pricing tier (`spot_price_at_start`, `cost_basis_at_start`, `rate_kwh_at_start`).
- **OCPP Message (CSMS $\rightarrow$ Charge Point)**:
  - **OCPP 1.6-J**: `RemoteStartTransaction.req(connectorId=1, idTag="APP_A7E29F10")`.
  - **OCPP 2.0.1**: `RequestStartTransaction.req(evseId=1, idToken={idToken: "APP_A7E29F10", type: "Central"})`.
- **Charge Point Response**: Returns `RemoteStartTransaction.conf(status=Accepted)`.

---

### Stage 4: Safety Checks, Isolation & Contactor Closure
- **DC Fast Charging (CCS / CHAdeMO / NACS)**:
  1. **Cable Check / Isolation Test**: EVSE applies a high-voltage test ($500\text{V}--1000\text{V}$ DC) to test for ground faults and insulation degradation.
  2. **Pre-Charge / Voltage Matching**: EVSE adjusts its internal DC bus voltage to match the vehicle battery terminal voltage within $\pm 20\text{V}$ to prevent hazardous inrush current.
  3. **Contactor Closure**: Vehicle closes its high-voltage battery contactors; EVSE closes output contactors.
- **AC Charging (Type 2)**:
  1. EV switches Control Pilot to **State C** (adds $R_3 = 1.3\text{ k}\Omega$ in parallel, dropping CP voltage to $+6\text{V}$).
  2. EVSE validates $+6\text{V}$ and generates a 1 kHz PWM signal (e.g., $53.3\%$ duty cycle $= 32\text{A}$ available capacity).
  3. EVSE closes main AC relay.
- **OCPP Messages**:
  - **OCPP 1.6-J**: `StartTransaction.req(connectorId=1, idTag="APP_A7E29F10", meterStart=104520, timestamp="2026-09-11T17:35:00Z")`.
  - **OCPP 2.0.1**: `TransactionEvent.req(eventType=Started, triggerReason=Authorized, seqNo=0, transactionInfo={transactionId="TX-9902"})`.
  - `StatusNotification(connectorId=1, status=Charging)`.

---

### Stage 5: Active Energy Dispensation & Telemetry Streaming
- **Energy Flow**: Active power flows from grid/solar to the EV battery pack.
- **EMS Governor**: The OpenCPO Energy Management System evaluates transformer headroom and dynamically dispatches `SetChargingProfile` limits if site load exceeds thresholds.
- **OCPP Telemetry (`MeterValues.req`)**: Emitted periodically every 10–30 seconds containing:
  - `Energy.Active.Import.Register` (Total cumulative Wh/kWh).
  - `Power.Active.Import` (Instantaneous kW draw).
  - `SoC` (Vehicle battery State of Charge percentage, $0\text{--}100\%$).
  - `Current.Import` (Amperes per phase).
  - `Voltage` (Volts RMS per phase).
  - `Temperature` (Connector thermistor readings in $^{\circ}\text{C}$).
- **Charge App UI**:
  - Consumes live telemetry via SSE / Polling.
  - Displays instantaneous power ($\text{kW}$), energy delivered ($\text{kWh}$), elapsed time, current accrued cost ($\text{£}$), and vehicle SoC gauge.

---

### Stage 6: Stopping the Charge
A charging stop can be triggered by any of four authoritative actors:
1. **Driver via Mobile App**: Taps **"Stop Charging"** $\rightarrow$ `POST /api/sessions/{session_id}/stop`.
2. **Vehicle Battery Management System (BMS)**: Target SoC (e.g. $80\%$ or $100\%$) reached; vehicle initiates ramp down.
3. **Driver via Vehicle Key Fob**: Driver presses vehicle unlock button; vehicle opens contactors.
4. **Emergency / Station Hardware**: Emergency stop button or overcurrent relay trip.

- **Control Pilot Reaction**: Transitions from **State C** ($+6\text{V}$) back to **State B** ($+9\text{V}$).
- **OCPP Message (CSMS $\rightarrow$ Charge Point)**:
  - **OCPP 1.6-J**: `RemoteStopTransaction.req(transactionId=9902)`.
  - **OCPP 2.0.1**: `RequestStopTransaction.req(transactionId="TX-9902")`.

---

### Stage 7: Power Ramp Down & De-energization
- EVSE power electronics ramp current to $0\text{A}$ within $< 100\text{ ms}$.
- Main AC/DC power contactors open under zero load (preventing contact pitting and arcing).
- **OCPP Messages**:
  - **OCPP 1.6-J**: `StopTransaction.req(transactionId=9902, meterStop=128740, timestamp="2026-09-11T18:12:30Z", reason="Remote")`.
  - **OCPP 2.0.1**: `TransactionEvent.req(eventType=Ended, triggerReason=RemoteStop, meterValue=[...])`.
  - `StatusNotification(connectorId=1, status=Finishing)`.
  - `StatusNotification(connectorId=1, status=Available)`.

---

### Stage 8: Electromechanical Cable Unlocking
- The charge point de-energizes the solenoid locking pin.
- Vehicle inlet pin retracts.
- Driver unplugs the connector and stows the cable.
- *(Emergency Fallback)*: If the cable solenoid sticks, the driver or operator can trigger `UnlockConnector.req` from the app.

---

### Stage 9: Session Settlement & Digital Receipting
- **Settlement Engine**:
  - OpenCPO Core computes final invoice amount:
    $$\text{Total Cost} = (\Delta\text{kWh} \times \text{Tariff Rate}) + \text{Session Fee} + \text{Idle Fee} + \text{VAT}$$
  - Captures pre-authorized payment against Stripe / card terminal / fleet wallet.
- **Driver Receipt Page**:
  - Charge App transitions driver to `/receipt/{session_id}`.
  - Provides detailed summary (kWh, duration, average speed, cost breakdown, VAT tax receipt).
  - Generates downloadable compliance PDF via `GET /api/sessions/{session_id}/pdf`.
