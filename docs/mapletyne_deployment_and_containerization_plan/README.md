# Mapletyne CPO — Containerization & Deployment Documentation

Welcome to the definitive architecture and deployment repository for the **Mapletyne CPO Enterprise Charging Management Platform**.

This folder contains all specifications, deployment manifests, operational runbooks, and API catalogs for running Mapletyne CPO across single-node Docker Compose environments and multi-tenant Kubernetes clusters.

---

## 📁 Plan Folder Contents

| File | Description |
| :--- | :--- |
| [**`01_SYSTEM_ARCHITECTURE.md`**](./01_SYSTEM_ARCHITECTURE.md) | High-level system topology, container workloads (`mapletyne-core`, `mapletyne-admin`, `mapletyne-chargeapp`), and core protocol flows. |
| [**`02_UI_UX_AND_DEEP_DIVE_STANDARDS.md`**](./02_UI_UX_AND_DEEP_DIVE_STANDARDS.md) | Standardized Apple HIG metric cards, zero spot price policy, and interactive on-demand deep-dive modals/drawers. |
| [**`03_DOCKER_CONTAINERIZATION_SPEC.md`**](./03_DOCKER_CONTAINERIZATION_SPEC.md) | Docker Compose service manifests, environment variable dictionaries, healthcheck configurations, and storage volumes. |
| [**`04_KUBERNETES_AND_HELM_SPEC.md`**](./04_KUBERNETES_AND_HELM_SPEC.md) | Multi-tenant namespace isolation (`tenant-<slug>`), Helm chart templates, Traefik Ingress, Cert-Manager TLS, and SkyOp EMS orchestration. |
| [**`05_MANAGEMENT_API_INVENTORY_UPDATE.md`**](./05_MANAGEMENT_API_INVENTORY_UPDATE.md) | Updated REST management API reference for Depot Cockpit, external SCADA/EMS overrides, and OCPP 2.0.1 smart charging. |
| [**`06_GHCR_AND_REPLICABILITY_GUIDE.md`**](./06_GHCR_AND_REPLICABILITY_GUIDE.md) | Automated GitHub Actions CI/CD $\rightarrow$ GitHub Container Registry (`ghcr.io`) $\rightarrow$ Zero-Install Server Deployment. |

---

## 🚀 Simple User Setup Guide (3-Step Quick Start)

### Step 1: Clone Repository & Prepare Environment File
```bash
git clone https://github.com/mapletyne/cpo-platform.git
cd cpo-platform
cp .env.example .env
```

### Step 2: Configure Environment Variables
Open `.env` in any editor (`nano .env`) to verify your port bindings and API keys:
```ini
# Port Bindings
CPO_ADMIN_PORT=34000
CHARGE_APP_PORT=34003
OCPP_API_PORT=34800
OCPP_16_WS_PORT=34100
OCPP_201_WS_PORT=34201

# Security Keys
MANAGEMENT_API_KEY=mapletyne_secure_admin_key_2026
SECRET_KEY=mapletyne_jwt_signing_secret_998877

# Public URLs
PUBLIC_URL=http://localhost:34000
CHARGE_APP_URL=http://localhost:34003
CORE_API_PUBLIC_URL=http://localhost:34800
```

### Step 3: Launch Containers
```bash
docker compose up -d
```

---

## 🌐 Application Access Points

- 🖥️ **Operator Dashboard UI**: [http://localhost:34000](http://localhost:34000)
- 📱 **Driver Charge App PWA**: [http://localhost:34003](http://localhost:34003)
- 🔌 **Core REST Management API**: [http://localhost:34800/health](http://localhost:34800/health)
- ⚡ **OCPP 1.6 WebSocket Server**: `ws://localhost:34100/{ChargePointId}`
- ⚡ **OCPP 2.0.1 WebSocket Server**: `ws://localhost:34201/{ChargePointId}`

---

## 🛠️ Common Maintenance Commands

```bash
# View live streaming logs across all containers
docker compose logs -f

# Check health and container statuses
docker ps --filter "name=mapletyne"

# Restart a specific service
docker compose restart mapletyne-core

# Stop all containers gracefully
docker compose down
```
