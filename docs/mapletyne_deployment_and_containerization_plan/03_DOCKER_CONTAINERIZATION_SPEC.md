# Mapletyne CPO — Production Docker Containerization Specification

**Specification Version:** 3.2.0 (Enterprise Gold Standard)  
**Standard Benchmarks:** CIS Docker Benchmark v1.6.0, 12-Factor App, OCI Standards, NIST SP 800-190

---

## 1. Industry Standard Production Docker Compose (`docker-compose.yml`)

This specification includes **CIS Docker Benchmarks compliance**, **non-root runtime (`10001:10001` / `101:101`)**, **`no-new-privileges`**, **`cap_drop: [ALL]`**, **Linux host-gateway resolution**, **automated log rotation**, **resource limits**, and **graceful WebSocket SIGTERM draining**:

```yaml
version: '3.8'

# Global Logging Anchor to prevent host disk exhaustion (CIS Docker 5.12)
x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"

# Global Security Hardening Anchor (CIS Docker 5.2, 5.3)
x-security: &default-security
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL

services:

  # ── In-Memory State & Event Streams ───────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: mapletyne-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
    user: "999:999" # Non-root redis user (CIS Docker 4.1)
    read_only: true
    <<: *default-security
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=64m
    volumes:
      - redis-data:/data
    networks:
      - mapletyne-internal
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 64M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Core CSMS & Management Backend ───────────────────────────────────────
  mapletyne-core:
    image: registry.mapletyne.com/mapletyne/core:v2.4.2
    build:
      context: ./opencpo-core
      dockerfile: Dockerfile
    container_name: mapletyne-core
    restart: unless-stopped
    stop_signal: SIGTERM
    stop_grace_period: 30s # Drains OCPP WebSocket sessions gracefully
    <<: *default-security
    cap_add:
      - NET_BIND_SERVICE
    depends_on:
      redis:
        condition: service_healthy
    extra_hosts:
      - "host.docker.internal:host-gateway" # Resolves host on Linux Docker daemons
    ports:
      - "${OCPP_16_WS_PORT:-34100}:9100"     # OCPP 1.6J WebSocket
      - "${OCPP_201_WS_PORT:-34201}:9201"    # OCPP 2.0.1 WebSocket
      - "${MANAGEMENT_API_PORT:-34800}:8000" # Management REST API + /metrics
    environment:
      # Database Connection
      PG_HOST: ${PG_HOST:-host.docker.internal}
      PG_PORT: ${PG_PORT:-5432}
      PG_NAME: ${POSTGRES_DB:-mapletyne_cpo}
      PG_USER: ${POSTGRES_USER:-cpo_admin}
      PG_PASSWORD: ${POSTGRES_PASSWORD:-CHANGE_IN_PRODUCTION}
      # Redis Connection
      REDIS_HOST: redis
      REDIS_PORT: 6379
      # Security & Keys
      SECRET_KEY: ${SECRET_KEY:-generate-a-secure-secret-key}
      MANAGEMENT_API_KEY: ${MANAGEMENT_API_KEY:-CHANGE_IN_PRODUCTION}
      PUBLIC_URL: ${PUBLIC_URL:-https://admin.mapletyne.com}
      CORE_API_PUBLIC_URL: ${CORE_API_PUBLIC_URL:-https://api.mapletyne.com}
      CORS_ORIGINS: ${CORS_ORIGINS:-https://admin.mapletyne.com,https://app.mapletyne.com,*}
      LOG_FORMAT: json
      LOG_LEVEL: info
    volumes:
      - backup-data:/app/backups
    networks:
      - mapletyne-internal
      - mapletyne-public
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1536M
        reservations:
          cpus: '0.25'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s

  # ── Operator Dashboard Web UI ───────────────────────────────────────────
  mapletyne-admin:
    image: registry.mapletyne.com/mapletyne/admin:v2.4.2
    build:
      context: ./mtt-admin
      dockerfile: Dockerfile
    container_name: mapletyne-admin
    restart: unless-stopped
    <<: *default-security
    ports:
      - "${ADMIN_PORT:-34000}:8080"
    environment:
      OCPP_CORE_API: http://mapletyne-core:8000
      CORE_API_KEY: ${MANAGEMENT_API_KEY:-CHANGE_IN_PRODUCTION}
      PUBLIC_URL: ${PUBLIC_URL:-https://admin.mapletyne.com}
    networks:
      - mapletyne-internal
      - mapletyne-public
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/"]
      interval: 20s
      timeout: 5s
      retries: 3

  # ── Driver Mobile PWA Application ───────────────────────────────────────
  mapletyne-chargeapp:
    image: registry.mapletyne.com/mapletyne/chargeapp:v2.4.2
    build:
      context: ./mtt-charge-app
      dockerfile: Dockerfile
    container_name: mapletyne-chargeapp
    restart: unless-stopped
    <<: *default-security
    depends_on:
      mapletyne-core:
        condition: service_healthy
    ports:
      - "${CHARGEAPP_PORT:-34003}:8003"
    environment:
      OCPP_CORE_API: http://mapletyne-core:8000
      MANAGEMENT_API_KEY: ${MANAGEMENT_API_KEY:-CHANGE_IN_PRODUCTION}
      PUBLIC_URL: ${CHARGEAPP_URL:-https://app.mapletyne.com}
      APP_TITLE: "Mapletyne Charge"
      SKIN: ${SKIN:-modern-emerald}
      PLUGINS: receipts,account,favorites,history
      DEFAULT_LANG: en
    networks:
      - mapletyne-internal
      - mapletyne-public
    logging: *default-logging
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 20s
      timeout: 5s
      retries: 3

networks:
  mapletyne-internal:
    driver: bridge
    internal: true
  mapletyne-public:
    driver: bridge

volumes:
  redis-data:
  backup-data:
```

---

## 2. Production Multi-Stage Hardened Dockerfiles

### 2.1 `mapletyne-admin` (Frontend SPA)
```dockerfile
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Hardened Unprivileged NGINX Runtime (CIS Docker 4.1)
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 2.2 `mapletyne-chargeapp` (Driver PWA)
```dockerfile
# Stage 1: Build Dependencies
FROM python:3.12-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Hardened Runtime Container (CIS Docker 4.1)
FROM python:3.12-slim
RUN groupadd -g 10001 mapletyne && \
    useradd -u 10001 -g mapletyne -s /bin/sh -m appuser
WORKDIR /app
COPY --from=builder /install /usr/local
COPY --chown=10001:10001 . .
USER 10001:10001
EXPOSE 8003
ENV HOST=0.0.0.0 PORT=8003 PYTHONUNBUFFERED=1
HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8003/health')" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
```

### 2.3 `mapletyne-core` (CSMS Backend)
```dockerfile
# Stage 1: Build System & Python Dependencies
FROM python:3.12-slim AS builder
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Hardened Runtime Container (CIS Docker 4.1)
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev curl ca-certificates && rm -rf /var/lib/apt/lists/* && \
    groupadd -g 10001 mapletyne && \
    useradd -u 10001 -g mapletyne -s /bin/sh -m appuser

COPY --from=builder /install /usr/local
COPY --chown=10001:10001 . .
USER 10001:10001
EXPOSE 8000 9100 9201
ENV HOST=0.0.0.0 OCPP_API_PORT=8000 OCPP_16_WS_PORT=9100 OCPP_201_WS_PORT=9201 PYTHONUNBUFFERED=1
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["python", "-u", "main.py"]
```

---

## 3. Observability, Metrics & Telemetry

`mapletyne-core` exposes standard Prometheus metrics at `GET /metrics` on port `34800` (Management API):
- `mapletyne_active_evse_connections`: Active OCPP 1.6J and OCPP 2.0.1 WebSocket sockets.
- `mapletyne_ocpp_messages_total`: Cumulative counter by message type (`Heartbeat`, `StatusNotification`, `MeterValues`, `TransactionEvent`).
- `mapletyne_active_charging_power_kw`: Real-time aggregated active charging load across all chargers and depots.
- `mapletyne_api_request_duration_seconds`: Histogram of REST API response latency.

