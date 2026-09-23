#!/usr/bin/env bash
# =============================================================================
# Mapletyne CPO — Automated Tenant Database Provisioning Script
# Naming Convention: mapletyne_{env}_{tenant}_{domain}
# =============================================================================

set -euo pipefail

# ── Defaults & Arguments ─────────────────────────────────────────────────────
ENVIRONMENT="${1:-prod}"
TENANT_SLUG="${2:-}"
DB_USER_PASSWORD="${3:-}"

PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"

if [[ -z "$TENANT_SLUG" ]]; then
  echo "Usage: $0 <environment> <tenant_slug> [db_user_password]"
  echo "Example: $0 prod fleetalpha MySecurePassword123!"
  exit 1
fi

# Sanitize tenant slug: lowercase, replace dashes with underscores
TENANT_SLUG=$(echo "$TENANT_SLUG" | tr '[:upper:]' '[:lower:]' | tr '-' '_')
ENVIRONMENT=$(echo "$ENVIRONMENT" | tr '[:upper:]' '[:lower:]')

# Generate deterministic database and user names
DB_NAME="mapletyne_${ENVIRONMENT}_${TENANT_SLUG}_core"
DB_USER="mtt_${TENANT_SLUG}_user"

if [[ -z "$DB_USER_PASSWORD" ]]; then
  # Generate a 32-character random alphanumeric password if none provided
  DB_USER_PASSWORD=$(openssl rand -hex 16)
fi

echo "================================================================="
echo " 🏛️ Mapletyne CPO Tenant Database Provisioner"
echo "================================================================="
echo " Environment:       $ENVIRONMENT"
echo " Tenant Slug:       $TENANT_SLUG"
echo " Target Database:   $DB_NAME"
echo " Scoped DB User:    $DB_USER"
echo " PostgreSQL Host:   $PG_HOST:$PG_PORT"
echo "================================================================="

# ── Execute PostgreSQL Provisioning ──────────────────────────────────────────
export PGPASSWORD="${PG_SUPERUSER_PASSWORD:-}"

# Check connection to PostgreSQL
echo "⏳ Checking connection to PostgreSQL cluster..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -d postgres -c '\q' 2>/dev/null || {
  echo "❌ Error: Cannot connect to PostgreSQL at $PG_HOST:$PG_PORT with superuser '$PG_SUPERUSER'."
  echo "   Please ensure PostgreSQL is running and PG_SUPERUSER_PASSWORD is set."
  exit 1
}

echo "1. Creating scoped tenant role '$DB_USER'..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -d postgres <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_USER_PASSWORD';
  ELSE
    ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_USER_PASSWORD';
  END IF;
END
\$\$;
EOF

echo "2. Creating isolated database '$DB_NAME'..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -d postgres <<EOF
SELECT 'CREATE DATABASE $DB_NAME WITH OWNER = $DB_USER ENCODING = ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "3. Initializing schema and tables..."
if [[ -f "./mapletyne-core/db/schema.sql" ]]; then
  export PGPASSWORD="$DB_USER_PASSWORD"
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$DB_USER" -d "$DB_NAME" -f "./mapletyne-core/db/schema.sql" > /dev/null
  echo "   ✅ Schema initialized successfully from ./mapletyne-core/db/schema.sql"
fi

echo ""
echo "================================================================="
echo " 🎉 Tenant Database '$DB_NAME' Successfully Provisioned!"
echo "================================================================="
echo " Inject these parameters into your tenant's .env file:"
echo ""
echo " PG_HOST=$PG_HOST"
echo " PG_PORT=$PG_PORT"
echo " PG_NAME=$DB_NAME"
echo " PG_USER=$DB_USER"
echo " PG_PASSWORD=$DB_USER_PASSWORD"
echo " REDIS_PREFIX=mtt:${ENVIRONMENT}:${TENANT_SLUG}"
echo "================================================================="
