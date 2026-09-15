# opencpo-charge-app Gap Analysis & Enhancement Roadmap

## 1. Executive Summary
This document provides a systematic gap analysis comparing the existing implementation in `opencpo-charge-app` against the standard 9-stage EV Charging Lifecycle and OCPP 1.6 / 2.0.1 specifications. It outlines concrete implementation blueprints for 5 critical enhancements required to make the driver experience seamless, robust, and enterprise-grade.

---

## 2. Compliance & Gap Analysis Matrix

| Stage | Feature / Protocol Step | Current Implementation | Compliance Status | Gap Severity | Action Required |
|:---|:---|:---|:---:|:---:|:---|
| **1** | **QR Scan & URL Resolution** | `GET /c/{code}` maps to `/charge/{cp}/{conn}` | ✅ Compliant | None | Operational |
| **2** | **Cable Connection Guidance** | App proceeds to session start without checking if cable is inserted | ⚠️ Partial | **HIGH** | Add "Preparing / Please Plug In" interstitial modal |
| **3** | **Remote Authorization** | `POST /api/sessions/create` $\rightarrow$ Core `RemoteStartTransaction` | ✅ Compliant | Low | Standardize currency to `£` (GBP) |
| **4** | **Safety & Contactor Lock** | Core waits for `StartTransaction` / `TransactionEvent` | ✅ Compliant | None | Operational |
| **5.1** | **Telemetry Stream (kW, kWh, Cost)** | Polls `/api/sessions/{session_id}/poll` every 3s | ⚠️ Partial | **MEDIUM** | Upgrade to Redis Server-Sent Events (SSE) |
| **5.2** | **Vehicle Battery SoC (%)** | `MeterValues` SoC received by backend but hidden in UI | ⚠️ Partial | **HIGH** | Add battery percentage gauge & range estimator |
| **6** | **Remote Stop Command** | `POST /api/sessions/{session_id}/stop` $\rightarrow$ Core `RemoteStopTransaction` | ✅ Compliant | None | Operational |
| **7** | **Power Ramp Down** | Clean zero-arc contactor release | ✅ Compliant | None | Operational |
| **8** | **Cable Solenoid Unlock Fallback** | No driver action if physical cable lock sticks | ❌ Missing | **HIGH** | Add "Emergency Unlock Cable" button |
| **9.1** | **Overstay / Idling Warning** | No notification when charging finishes and car occupies bay | ❌ Missing | **MEDIUM** | Add grace period timer & idle fee notification |
| **9.2** | **Digital Receipt & PDF** | `/receipt/{session_id}` and `/api/sessions/{session_id}/pdf` | ✅ Compliant | None | Ensure Apple HIG styling |

---

## 3. Detailed Blueprints for the 5 Key Enhancements

### Enhancement 1: "Preparing / Please Plug In" Interactive Flow
- **Problem**: If a driver taps "Start Charging" on their phone before physically inserting the charging connector into the vehicle inlet, the charge point enters OCPP `Preparing` state. The current app shows a generic "Starting..." spinner, confusing drivers.
- **Solution**:
  1. Inspect the connector status from `GET /api/v1/chargers/{cp_id}`.
  2. If status is `Available` (not `Preparing` or `Charging`), present a full-screen animated visual:
     - Graphic: Animated cable plugging into vehicle inlet.
     - Headline: *"Plug connector into your vehicle"*.
     - Subtitle: *"Awaiting physical connection on Connector #1..."*.
  3. Once OCPP receives `StatusNotification(status=Preparing)` or `StartTransaction`, the UI automatically shifts to the active charging view with a confirmation haptic/audio chime.

---

### Enhancement 2: Dynamic Vehicle State of Charge (SoC %) & Range Estimator
- **Problem**: DC Fast Chargers and ISO 15118 AC chargers communicate the vehicle battery percentage (`SoC`) via `MeterValues`. While the OpenCPO Core database records this in `ocpp.meter_values`, the driver web app only renders kWh and kW.
- **Solution**:
  1. Expose `soc_percent` in the session poll payload: `GET /api/v1/public/sessions/{id}`.
  2. In the live session UI, render a dynamic circular Apple Activity-style battery ring:
     - Center: Large bold `74%` SoC readout.
     - Progress ring colored by battery level (Emerald $> 80\%$, Electric Blue $20\text{--}80\%$, Amber $< 20\%$).
     - Est. Miles Added: $\text{kWh Delivered} \times 3.5\text{ miles/kWh}$ (e.g. `+84 miles added`).

---

### Enhancement 3: Emergency "Unlock Cable" Solenoid Release Action
- **Problem**: On untethered European Type 2 AC chargers, the station locking solenoid can occasionally remain engaged after a session ends (or if the vehicle doesn't immediately unlock its inlet). Drivers are left stranded without a way to retrieve their cable.
- **Solution**:
  1. Add an **"Unlock Cable"** button on `/session/{id}` and `/receipt/{id}`.
  2. Clicking triggers `POST /api/v1/public/chargers/{cp_id}/connectors/{connector_id}/unlock`.
  3. OpenCPO Core dispatches OCPP `UnlockConnector.req(connectorId=X)` to the charge point.
  4. UI confirms: *"Cable unlocked. You can safely disconnect your cable."*

---

### Enhancement 4: Overstay Grace Period & Idle Fee Warning
- **Problem**: When charging completes at high-demand public charging hubs, vehicles blocking bays prevent other drivers from charging.
- **Solution**:
  1. When session status switches to `Completed` / `Finishing`:
     - Display a 15-minute Grace Period Countdown: *"Charging Complete — 15:00 min remaining before £0.50/min idle fees apply"*.
     - Send Web Push notification / SMS to the driver's registered phone number.
  2. Upon unplugging, close the session and present the final receipt.

---

### Enhancement 5: SSE Event Bus Integration (Zero-Latency Telemetry)
- **Problem**: Polling `/api/sessions/{session_id}/poll` every 3 seconds generates unnecessary HTTP request overhead and has a 3-second latency lag on power changes.
- **Solution**:
  1. Leverage the OpenCPO Core Redis Event Bus (`/api/v1/events/stream?session_id={id}`).
  2. Replace `setInterval` polling in the frontend with an `EventSource` subscriber:
     ```javascript
     const eventSource = new EventSource(`/api/v1/events/stream?session_id=${sessionId}`);
     eventSource.onmessage = (event) => {
       const data = JSON.parse(event.data);
       updateLiveTelemetry(data);
     };
     ```
  3. Retain 10s fallback polling only if SSE connection drops.
