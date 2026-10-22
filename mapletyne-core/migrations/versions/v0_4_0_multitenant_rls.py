"""v0.4.0 — Multi-Tenant tenant_id and PostgreSQL Row Level Security (RLS) (GAP-SEC-10)

Revision ID: v0_4_0_multitenant_rls
Revises: v0_3_0_baseline
Create Date: 2026-10-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "v0_4_0_multitenant_rls"
down_revision: Union[str, None] = "v0_3_0_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TENANT_TABLES = [
    "charge_points",
    "sessions",
    "tariffs",
    "tokens",
    "token_groups",
    "driver_accounts",
    "cdrs",
    "users",
    "public_sessions",
    "invoices",
    "fleet_vehicles",
]

DEFAULT_TENANT = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    for table in TENANT_TABLES:
        # 1. Add tenant_id column with default tenant UUID
        op.execute(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'ocpp' AND table_name = '{table}' AND column_name = 'tenant_id'
                ) THEN
                    ALTER TABLE ocpp.{table} ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT '{DEFAULT_TENANT}';
                END IF;
            END $$;
        """)

        # 2. Create index on tenant_id
        op.execute(f"CREATE INDEX IF NOT EXISTS idx_{table}_tenant_id ON ocpp.{table} (tenant_id)")

        # 3. Enable and force Row Level Security
        op.execute(f"ALTER TABLE ocpp.{table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE ocpp.{table} FORCE ROW LEVEL SECURITY")

        # 4. Create tenant isolation policy
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON ocpp.{table}")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy ON ocpp.{table}
            FOR ALL
            USING (
                COALESCE(current_setting('app.current_user_role', true), '') IN ('', 'cpo-admin', 'admin', 'superadmin', 'system', 'ocpp-engine')
                OR (
                    COALESCE(current_setting('app.current_tenant_id', true), '') <> ''
                    AND tenant_id = current_setting('app.current_tenant_id', true)
                )
            )
            WITH CHECK (
                COALESCE(current_setting('app.current_user_role', true), '') IN ('', 'cpo-admin', 'admin', 'superadmin', 'system', 'ocpp-engine')
                OR (
                    COALESCE(current_setting('app.current_tenant_id', true), '') <> ''
                    AND tenant_id = current_setting('app.current_tenant_id', true)
                )
            )
        """)


def downgrade() -> None:
    for table in reversed(TENANT_TABLES):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON ocpp.{table}")
        op.execute(f"ALTER TABLE ocpp.{table} NO FORCE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE ocpp.{table} DISABLE ROW LEVEL SECURITY")
        op.execute(f"DROP INDEX IF EXISTS ocpp.idx_{table}_tenant_id")
        op.execute(f"ALTER TABLE ocpp.{table} DROP COLUMN IF EXISTS tenant_id")
