# Runtime Environment Validation & Secret Isolation (`ENV_SPEC.md`)

**Specification Version:** 3.2.0 (Enterprise Gold Standard)  
**Validation Engine:** Pydantic Settings v2 (`pydantic-settings`) on `mapletyne-core` (`Python 3.12+`) & Zod (`T3 Env`) on `mtt-admin`  
**Invariant Rule:** All environment variables are validated at container boot prior to binding TCP sockets (`34800`, `34100`, `34201`). Missing required secrets or malformed URLs trigger an immediate, explicit `SystemExit(1)` with a structured diagnostic table.

---

## 1. Server vs. Client Secret Isolation

1. **Zero Client Secret Leakage (`mtt-admin`):** Static frontend builds (`mtt-admin`) runs in the browser and binds via relative paths (`/api/v1/...`) through the NGINX single-domain reverse proxy (`AD-1`). No secret keys (`SECRET_KEY`, `MANAGEMENT_API_KEY`, `PG_PASSWORD`, `STRIPE_SECRET_KEY`) may ever be prefixed with `VITE_` or `NEXT_PUBLIC_`.
2. **Scoped Multi-Tenant Injection:** Every `mapletyne-core` pod receives tenant-scoped database (`PG_NAME=mapletyne_{env}_{tenant_slug}_core`, `PG_USER=mtt_{tenant_slug}_user`) and Redis namespace (`REDIS_PREFIX=mtt:{env}:{tenant_slug}`) variables.
3. **Production Default Rejection:** In `ENVIRONMENT=prod`, boot validation explicitly rejects insecure placeholder values (`CHANGE_IN_PRODUCTION`, `ocpp`, `generate-a-secure-secret-key`) and enforces minimum 32-byte entropy on `SECRET_KEY` and `MANAGEMENT_API_KEY`.

---

## 2. Master Environment Variable Dictionary

### 2.1 Tenant Identity, Runtime & Network Ports

| Variable | Required | Type | Default (Dev) | Production Example | Description |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `ENVIRONMENT` | **Yes** | Enum | `dev` | `prod` | Deployment tier (`dev`, `test`, `qa`, `stage`, `prod`) |
| `TENANT_SLUG` | **Yes** | String | `default` | `fleetalpha` | Lowercase alphanumeric identifier for DB & Redis scoping |
| `ORG_NAME` | **Yes** | String | `Mapletyne CPO` | `Fleet Alpha Logistics` | Trading name displayed in Admin & Driver UI |
| `LOG_LEVEL` | No | Enum | `info` | `info` | `debug`, `info`, `warning`, `error`, `critical` |
| `LOG_FORMAT` | No | Enum | `console` | `json` | `json` (structured single-line) or `console` |
| `MANAGEMENT_API_PORT` | No | Port | `34800` | `34800` | Host port mapped to container `OCPP_API_PORT=8000` |
| `OCPP_16_WS_PORT` | No | Port | `34100` | `34100` | Host port mapped to container OCPP 1.6-J port `9100` |
| `OCPP_201_WS_PORT` | No | Port | `34201` | `34201` | Host port mapped to container OCPP 2.0.1 port `9201` |
| `ADMIN_PORT` | No | Port | `34000` | `34000` | Host port mapped to `mapletyne-admin` (`8080`) |
| `CHARGEAPP_PORT` | No | Port | `34003` | `34003` | Host port mapped to `mapletyne-chargeapp` (`8003`) |
| `PUBLIC_URL` | **Yes** | URL | `http://localhost:34000` | `https://admin-fleetalpha.mapletyne.com` | Public URL for Operator Dashboard |
| `CHARGEAPP_URL` | **Yes** | URL | `http://localhost:34003` | `https://app-fleetalpha.mapletyne.com` | Public URL for QR codes & Driver Mobile PWA |
| `CORE_API_PUBLIC_URL` | **Yes** | URL | `http://localhost:34800` | `https://api-fleetalpha.mapletyne.com` | Public URL for REST API & OCPI callbacks |
| `CORS_ORIGINS` | **Yes** | CSV | `http://localhost:34000,http://localhost:34003` | `https://admin-fleetalpha.mapletyne.com,https://app-fleetalpha.mapletyne.com` | Comma-separated allowed CORS origins |

### 2.2 PostgreSQL 16 + TimescaleDB & Redis 7 Persistence

| Variable | Required | Type | Default (Dev) | Production Example | Description |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `PG_HOST` | **Yes** | Host | `localhost` | `postgres.mapletyne.internal` | PostgreSQL / TimescaleDB server hostname |
| `PG_PORT` | No | Port | `5432` | `5432` | PostgreSQL server port |
| `PG_NAME` | **Yes** | String | `mapletyne_dev_default_core` | `mapletyne_prod_fleetalpha_core` | Deterministic 4-segment tenant database name |
| `PG_USER` | **Yes** | String | `mtt_default_user` | `mtt_fleetalpha_user` | Scoped database owner role |
| `PG_PASSWORD` | **Yes** | Secret | `mtt_dev_pass_2026` | `[VAULT_INJECTED]` | Scoped database password |
| `PG_POOL_MIN_SIZE` | No | Int | `5` | `10` | Minimum `asyncpg` connection pool size per worker |
| `PG_POOL_MAX_SIZE` | No | Int | `20` | `50` | Maximum `asyncpg` connection pool size per worker |
| `REDIS_HOST` | **Yes** | Host | `localhost` | `redis.mapletyne.internal` | Redis 7 server hostname |
| `REDIS_PORT` | No | Port | `6379` | `6379` | Redis server port |
| `REDIS_PASSWORD` | No | Secret | `None` | `[VAULT_INJECTED]` | Redis ACL password |
| `REDIS_PREFIX` | **Yes** | String | `mtt:dev:default` | `mtt:prod:fleetalpha` | Hierarchical colon prefix (`mtt:{env}:{tenant}`) |

### 2.3 Security, Keycloak IAM, V2G PKI, Payments & Roaming

| Variable | Required | Type | Default (Dev) | Production Example | Description |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `SECRET_KEY` | **Yes** | Secret | *(64-hex dev key)* | `[64-CHAR-HEX-SECRET]` | Master HMAC/AES-256 key for internal signing & encryption |
| `MANAGEMENT_API_KEY` | **Yes** | Secret | `mtt_dev_api_key_2026` | `mtt_sec_prod_fleetalpha_...` | M2M `X-API-Key` for headless & SCADA automation |
| `KEYCLOAK_URL` | **Yes** | URL | `http://localhost:8081/auth` | `https://auth.opencpo.mapletyne.com/auth` | Keycloak 26 OIDC base server URL |
| `KEYCLOAK_REALM` | **Yes** | String | `opencpo` | `opencpo` | Target Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | **Yes** | String | `mtt-admin-client` | `mtt-admin-client` | OIDC client identifier |
| `KEYCLOAK_CLIENT_SECRET` | **Yes** | Secret | `dev-client-secret` | `[VAULT_INJECTED]` | Confidential client secret for Direct Access Grants |
| `KEYCLOAK_ADMIN_USER` | **Yes** | String | `admin` | `kc_provisioner` | Admin service account for Step-2 OTP user provisioning |
| `KEYCLOAK_ADMIN_PASSWORD`| **Yes** | Secret | `admin` | `[VAULT_INJECTED]` | Admin service account password |
| `PKI_STORAGE_PATH` | No | Path | `/app/data/pki` | `/app/data/pki` | Directory storing encrypted V2G Root & Sub-CA certificates |
| `PKI_KEY_PASSPHRASE` | **Yes** | Secret | `dev-pki-passphrase` | `[VAULT_INJECTED]` | AES-256 passphrase encrypting CA private keys |
| `STRIPE_SECRET_KEY` | No | Secret | `sk_test_...` | `sk_live_...` | Stripe API secret key for driver pre-auth & capture |
| `STRIPE_WEBHOOK_SECRET` | No | Secret | `whsec_test_...` | `whsec_...` | Stripe raw-buffer webhook HMAC signing secret |
| `ADYEN_API_KEY` | No | Secret | `None` | `[VAULT_INJECTED]` | Adyen POS / e-Commerce API key |
| `ADYEN_HMAC_KEY` | No | Secret | `None` | `[VAULT_INJECTED]` | Adyen webhook notification HMAC key |
| `ENTSOE_API_TOKEN` | No | Secret | `None` | `[VAULT_INJECTED]` | ENTSO-E Transparency Platform token for dynamic spot tariffs |
| `SKIN` | No | String | `modern-emerald` | `modern-emerald` | Active UI skin (`modern-emerald`, `voltage-industrial`, `stroom-electron`) |
| `CURRENCY` | No | ISO-4217 | `GBP` | `GBP` | Base operating currency (`GBP`, `EUR`, `USD`, `CAD`) |
| `TIMEZONE` | No | IANA | `Europe/London` | `Europe/London` | Default site operational timezone |

---

## 3. Boot-Time Validation Implementation (`app/core/config.py`)

`mapletyne-core` enforces strict runtime environment validation at startup using `pydantic-settings`:

```python
from typing import Literal
from pydantic import AnyHttpUrl, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # 1. Tenant & Environment Identity
    ENVIRONMENT: Literal["dev", "test", "qa", "stage", "prod"] = "dev"
    TENANT_SLUG: str = Field(default="default", pattern=r"^[a-z0-9_]{2,32}$")
    ORG_NAME: str = "Mapletyne CPO"
    LOG_LEVEL: Literal["debug", "info", "warning", "error", "critical"] = "info"
    LOG_FORMAT: Literal["json", "console"] = "json"

    # 2. Internal Container Listeners (Mapped to 34800, 34100, 34201 on Host)
    OCPP_API_PORT: int = Field(default=8000, ge=1024, le=65535)
    OCPP_16_WS_PORT: int = Field(default=9100, ge=1024, le=65535)
    OCPP_201_WS_PORT: int = Field(default=9201, ge=1024, le=65535)

    # 3. Isolated PostgreSQL 16 + TimescaleDB
    PG_HOST: str
    PG_PORT: int = 5432
    PG_NAME: str
    PG_USER: str
    PG_PASSWORD: SecretStr
    PG_POOL_MIN_SIZE: int = 5
    PG_POOL_MAX_SIZE: int = 25

    # 4. Redis 7 Cluster & Hierarchical Prefix
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: SecretStr | None = None
    REDIS_PREFIX: str = Field(pattern=r"^mtt:(dev|test|qa|stage|prod):[a-z0-9_]+$")

    # 5. Security & Keycloak 26 OIDC
    SECRET_KEY: SecretStr
    MANAGEMENT_API_KEY: SecretStr
    KEYCLOAK_URL: AnyHttpUrl
    KEYCLOAK_REALM: str = "opencpo"
    KEYCLOAK_CLIENT_ID: str = "mtt-admin-client"
    KEYCLOAK_CLIENT_SECRET: SecretStr

    # 6. Public Endpoints & Localization
    PUBLIC_URL: AnyHttpUrl
    CORE_API_PUBLIC_URL: AnyHttpUrl
    CORS_ORIGINS: str = "https://admin.mapletyne.com,https://app.mapletyne.com"
    CURRENCY: str = Field(default="GBP", min_length=3, max_length=3)
    TIMEZONE: str = "Europe/London"

    @property
    def async_database_url(self) -> str:
        pwd = self.PG_PASSWORD.get_secret_value()
        return f"postgresql+asyncpg://{self.PG_USER}:{pwd}@{self.PG_HOST}:{self.PG_PORT}/{self.PG_NAME}"

    @model_validator(mode="after")
    def enforce_production_security_invariants(self) -> "Settings":
        if self.ENVIRONMENT == "prod":
            banned_placeholders = {"CHANGE_IN_PRODUCTION", "ocpp", "generate-a-secure-secret-key"}
            if self.SECRET_KEY.get_secret_value() in banned_placeholders or len(self.SECRET_KEY.get_secret_value()) < 32:
                raise ValueError("CRITICAL: SECRET_KEY must be at least 32 characters and non-default in prod.")
            if self.MANAGEMENT_API_KEY.get_secret_value() in banned_placeholders:
                raise ValueError("CRITICAL: MANAGEMENT_API_KEY cannot use placeholder value in prod.")
            if self.PG_PASSWORD.get_secret_value() in banned_placeholders:
                raise ValueError("CRITICAL: PG_PASSWORD cannot use placeholder value in prod.")
            expected_prefix = f"mtt:prod:{self.TENANT_SLUG}"
            if self.REDIS_PREFIX != expected_prefix:
                raise ValueError(f"CRITICAL: REDIS_PREFIX must match '{expected_prefix}'.")
        return self
```
