"""
PostgreSQL Row-Level Security (RLS) Generator & Enforcement Service
Provides SQL commands to enable database-level tenant isolation in Neon PostgreSQL.
"""

from typing import List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

# All tables requiring strict tenant isolation
TENANT_SCOPED_TABLES = [
    "users",
    "students",
    "academic_semesters",
    "student_skills",
    "evidence_records",
    "skill_assessments",
    "placement_drives",
    "applications",
    "interviews",
    "skill_gap_analyses",
    "placement_predictions",
    "learning_recommendations",
    "agent_execution_logs",
    "agent_workflows",
    "audit_events",
    "notifications",
]


class RLSService:
    @staticmethod
    def get_enable_rls_sql() -> List[str]:
        """Generates DDL statements to enable RLS and create isolation policies."""
        statements = []
        for table in TENANT_SCOPED_TABLES:
            statements.append(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            statements.append(f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies 
                        WHERE tablename = '{table}' AND policyname = '{table}_tenant_isolation'
                    ) THEN
                        CREATE POLICY {table}_tenant_isolation ON {table}
                        FOR ALL
                        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
                        WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
                    END IF;
                END $$;
            """)
        return statements

    @staticmethod
    async def apply_rls_policies(conn: AsyncConnection):
        """Applies RLS policies to an active PostgreSQL connection (skips on SQLite)."""
        if conn.dialect.name != "postgresql":
            return
        
        for stmt in RLSService.get_enable_rls_sql():
            await conn.execute(text(stmt))
