"""
CPO REST API — FastAPI application.

The public interface to OCPP Core. All writes go through here.
"""
from fastapi import Depends, FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware

from config import config
from api.ratelimit import RateLimitMiddleware
from api.api_key_auth import management_auth

app = FastAPI(
    title="OCPP Core API",
    description="Charge Point Operator REST API — OCPP 1.6j + 2.0.1",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS (GAP-SEC-14 Strict CORS allowlist without insecure public tunnel wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.api.cors_origins,
    allow_origin_regex=r"^https?://([a-zA-Z0-9-]+\.)*(mapletyne\.com|otaskies\.com|localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.add_middleware(
    RateLimitMiddleware,
    limits={
        "/ocpi": 60,
        "/api/v1/public/auth/send-otp": int(os.getenv("RATE_LIMIT_OTP", "10")),
        "/api/v1/public/account/register": int(os.getenv("RATE_LIMIT_REGISTER", "15")),
        "/api/v1/public/account/login": int(os.getenv("RATE_LIMIT_LOGIN", "20")),
        "/api/v1/public/payments": 60,
        "/api/v1/public": 60,
        "/api/v1/admin/auth": int(os.getenv("RATE_LIMIT_AUTH", "300")),
    },
    default_limit=int(os.getenv("RATE_LIMIT_DEFAULT", "120")),
)


# ── Health Endpoints ─────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Basic liveness check."""
    return {
        "status": "ok",
        "service": "ocpp-core",
        "version": "1.0.0",
    }


@app.get("/health/ready")
async def readiness():
    """Readiness check — verifies all dependencies."""
    from state.postgres import db
    from state.redis import redis_state

    db_health = await db.health()
    redis_health = await redis_state.health()

    all_ok = db_health.get("primary") == "ok" and redis_health.get("status") == "ok"

    return {
        "status": "ok" if all_ok else "degraded",
        "database": db_health,
        "redis": redis_health,
    }


# ── Metrics Endpoint (Prometheus text format) ────────────────────────────

from fastapi.responses import PlainTextResponse


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    """Export Prometheus metrics in text format."""
    from state.postgres import db
    from state.redis import redis_state

    # Connected chargers total (from charger_registry / DB)
    connected_chargers = 0
    try:
        async with db.read() as conn:
            row = await conn.fetchval("SELECT COUNT(*) FROM ocpp.charge_points WHERE status = 'online'")
            if row is not None:
                connected_chargers = row
    except Exception:
        pass

    # Active charging sessions total
    active_sessions = 0
    try:
        async with db.read() as conn:
            row = await conn.fetchval("SELECT COUNT(*) FROM ocpp.sessions WHERE status = 'active'")
            if row is not None:
                active_sessions = row
    except Exception:
        pass

    # Energy delivered total (kWh)
    energy_delivered = 0.0
    try:
        async with db.read() as conn:
            row = await conn.fetchval("SELECT COALESCE(SUM(energy_kwh), 0) FROM ocpp.sessions WHERE status = 'completed'")
            if row is not None:
                energy_delivered = float(row)
    except Exception:
        pass

    # Auth events total (from Redis counter)
    auth_events_total = 0
    try:
        auth_events_total = await redis_state.get_counter("auth_events_total", default=0)
    except Exception:
        pass

    lines = [
        f"# HELP opencpo_connected_chargers_total Total number of connected chargers",
        f"# TYPE opencpo_connected_chargers_total gauge",
        f"opencpo_connected_chargers_total {connected_chargers}",
        f"",
        f"# HELP opencpo_active_charging_sessions_total Total number of active charging sessions",
        f"# TYPE opencpo_active_charging_sessions_total gauge",
        f"opencpo_active_charging_sessions_total {active_sessions}",
        f"",
        f"# HELP opencpo_energy_delivered_kwh_total Total energy delivered in kWh",
        f"# TYPE opencpo_energy_delivered_kwh_total counter",
        f"opencpo_energy_delivered_kwh_total {energy_delivered}",
        f"",
        f"# HELP opencpo_ocpp_rpc_duration_seconds_bucket OCPP RPC call duration histogram",
        f"# TYPE opencpo_ocpp_rpc_duration_seconds_bucket histogram",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"0.01\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"0.05\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"0.1\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"0.25\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"0.5\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"1.0\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"2.5\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"5.0\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"10.0\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket{{le=\"+Inf\"}} 0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket_sum 0.0",
        f"opencpo_ocpp_rpc_duration_seconds_bucket_count 0",
        f"",
        f"# HELP opencpo_dlm_control_loop_duration_seconds_bucket DLM control loop duration histogram",
        f"# TYPE opencpo_dlm_control_loop_duration_seconds_bucket histogram",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"0.01\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"0.05\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"0.1\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"0.25\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"0.5\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"1.0\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"2.5\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"5.0\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"10.0\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket{{le=\"+Inf\"}} 0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket_sum 0.0",
        f"opencpo_dlm_control_loop_duration_seconds_bucket_count 0",
        f"",
        f"# HELP opencpo_auth_events_total Total number of auth events processed",
        f"# TYPE opencpo_auth_events_total counter",
        f"opencpo_auth_events_total {auth_events_total}",
    ]

    return PlainTextResponse(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4; charset=utf-8")


# ── API Routers ──────────────────────────────────────────────────────────

from api.pki import router as pki_router
from api.pki_admin import router as pki_admin_router
from api.chargers import router as chargers_router
from api.charger_commands import router as charger_commands_router
from api.sessions import router as sessions_router
from api.tariffs import router as tariffs_router
from api.auth import router as auth_router
from api.tokens import router as tokens_router
from api.groups import router as groups_router
from api.events import router as events_router
from api.public import router as public_router, webhook_router, mgmt_public_router
from api.public_auth import router as public_auth_router
from api.public_sessions import router as public_sessions_router
from api.users import router as users_router
from api.features import router as features_router
from api.accounts import router as accounts_router, mgmt_router as driver_accounts_mgmt_router
from api.favorites import router as favorites_router
from api.vehicles import router as vehicles_router
from api.fleet_bays import router as fleet_bays_router
from api.fleet_schedules import router as fleet_schedules_router
from api.profiles import router as profiles_router
from api.pricing import router as pricing_router
from api.cert_setup import router as cert_setup_router
from api.settings import router as settings_router
from api.ocpi_management import router as ocpi_mgmt_router
from ocpi.main import ocpi_app
from api.network import router as network_router
from api.ems import router as ems_router
from api.push import router as push_router
from api.payments import router as payments_router
from api.api_key_auth import management_auth
from auth.rbac import (
    require_admin,
    require_superadmin,
    require_site_operator,
    require_billing_manager,
    require_fleet_manager,
)
from api.admin_auth import router as admin_auth_router
from api.admin_setup import router as admin_setup_router
from api.admin_update import router as admin_update_router
from api.admin_backup import router as admin_backup_router

_site_op = [Depends(require_site_operator)]
_billing = [Depends(require_billing_manager)]
_fleet = [Depends(require_fleet_manager)]
_admin = [Depends(require_admin)]
_superadmin = [Depends(require_superadmin)]

# ── Management endpoints (Enforced with granular RBAC guards - GAP-SEC-09) ───
app.include_router(chargers_router, prefix="/api/v1/chargers", tags=["Chargers"], dependencies=_site_op)
app.include_router(charger_commands_router, prefix="/api/v1/chargers", tags=["Charger Commands"], dependencies=_site_op)
app.include_router(sessions_router, prefix="/api/v1/sessions", tags=["Sessions"], dependencies=_site_op)
app.include_router(tariffs_router, prefix="/api/v1/tariffs", tags=["Tariffs"], dependencies=_billing)
app.include_router(tokens_router, prefix="/api/v1/tokens", tags=["Tokens"], dependencies=_fleet)
app.include_router(groups_router, prefix="/api/v1/groups", tags=["Groups"], dependencies=_fleet)
app.include_router(pki_router, prefix="/api/v1/pki", tags=["PKI"], dependencies=_superadmin)
app.include_router(pki_admin_router, prefix="/api/v1/pki", tags=["PKI Admin"], dependencies=_superadmin)
app.include_router(ems_router, dependencies=_site_op)
app.include_router(events_router, prefix="/api/v1/events", tags=["Events"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"], dependencies=_superadmin)
app.include_router(vehicles_router, prefix="/api/v1/fleet/vehicles", tags=["Fleet Vehicles"], dependencies=_fleet)
app.include_router(fleet_bays_router, prefix="/api/v1/fleet/depots", tags=["Fleet Depots"], dependencies=_fleet)
app.include_router(fleet_schedules_router, prefix="/api/v1/fleet/schedules", tags=["Fleet Schedules"], dependencies=_fleet)
app.include_router(driver_accounts_mgmt_router, prefix="/api/v1/driver-accounts", tags=["Driver Accounts"], dependencies=_admin)
app.include_router(mgmt_public_router, prefix="/api/v1/public-sessions", tags=["Public Sessions"], dependencies=_admin)
app.include_router(features_router, dependencies=_admin)
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authorization"], dependencies=_admin)

# Admin panel auth + setup + update (require superadmin for destructive actions)
app.include_router(admin_auth_router)
app.include_router(admin_setup_router)
app.include_router(admin_update_router, dependencies=_superadmin)
app.include_router(admin_backup_router, dependencies=_superadmin)

# ── Public endpoints (no auth — charge app, webhooks) ─────────────────────
app.include_router(accounts_router)
app.include_router(favorites_router)
app.include_router(public_router)
app.include_router(public_auth_router)
app.include_router(public_sessions_router)
app.include_router(payments_router)
app.include_router(push_router)
app.include_router(webhook_router)

app.include_router(profiles_router, prefix="/api/v1/profiles", tags=["Charger Profiles"], dependencies=_site_op)
app.include_router(settings_router, dependencies=_superadmin)
app.include_router(ocpi_mgmt_router, prefix="/api/v1/ocpi", tags=["OCPI Management"], dependencies=_admin)
app.include_router(network_router, dependencies=_admin)
app.include_router(pricing_router)

# Include OCPI routes on the main FastAPI app so /ocpi/versions and /ocpi/2.2.1/* are served directly
app.include_router(ocpi_app.router)

# Cert setup — driver certificate install wizard (public for driver-facing flows)
app.include_router(cert_setup_router)

# ── Static Uploads Mount (Logos, Icons, Branding) ──────────────────────────
from fastapi.staticfiles import StaticFiles
from pathlib import Path

uploads_path = Path(os.getenv("UPLOADS_DIR", "/var/lib/opencpo/uploads"))
try:
    uploads_path.mkdir(parents=True, exist_ok=True)
    app.mount("/static/uploads", StaticFiles(directory=str(uploads_path), check_dir=False), name="uploads")
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Could not mount static uploads: {e}")

