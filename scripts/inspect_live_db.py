#!/usr/bin/env python3
"""
CarrerSync — Neon PostgreSQL Live Database Discovery and Audit Script
Inspects system catalogs, schemas, tables, columns, constraints, indexes, enums, RLS policies, and triggers.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import asyncpg

def load_env_local():
    root_dir = Path(__file__).resolve().parent.parent
    for env_file in [".env.local", ".env"]:
        env_path = root_dir / env_file
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v

load_env_local()

def get_connection_url() -> str:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not found in environment or .env.local")
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "sslmode=require" in db_url:
        db_url = db_url.replace("sslmode=require", "ssl=require")
    return db_url

async def inspect_database() -> Dict[str, Any]:
    url = get_connection_url()
    conn = await asyncpg.connect(url)
    
    try:
        report: Dict[str, Any] = {}

        # 1. Server info & Extensions
        db_version = await conn.fetchval("SELECT version()")
        current_db = await conn.fetchval("SELECT current_database()")
        current_user = await conn.fetchval("SELECT current_user")
        
        ext_rows = await conn.fetch("SELECT extname, extversion FROM pg_extension ORDER BY extname")
        report["meta"] = {
            "version": db_version,
            "database": current_db,
            "user": current_user,
            "extensions": [dict(r) for r in ext_rows]
        }

        # 2. Custom Enums
        enum_query = """
        SELECT 
            t.typname AS enum_name,
            array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
        """
        enum_rows = await conn.fetch(enum_query)
        report["enums"] = {r["enum_name"]: list(r["enum_values"]) for r in enum_rows}

        # 3. Tables & Views in public schema
        tables_query = """
        SELECT 
            table_name,
            table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
        """
        tables_rows = await conn.fetch(tables_query)
        
        # 4. RLS status on tables
        rls_query = """
        SELECT 
            c.relname AS table_name,
            c.relrowsecurity AS rls_enabled,
            c.relforcerowsecurity AS rls_forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname;
        """
        rls_rows = await conn.fetch(rls_query)
        rls_map = {r["table_name"]: {"enabled": r["rls_enabled"], "forced": r["rls_forced"]} for r in rls_rows}

        # Row counts & sizes for physical tables
        tables_data = []
        for r in tables_rows:
            tname = r["table_name"]
            ttype = r["table_type"]
            row_count = 0
            size_pretty = "N/A"
            size_bytes = 0
            if ttype == "BASE TABLE":
                try:
                    row_count = await conn.fetchval(f'SELECT count(*) FROM "{tname}"')
                    size_pretty = await conn.fetchval(f'SELECT pg_size_pretty(pg_total_relation_size(\'"{tname}"\'))')
                    size_bytes = await conn.fetchval(f'SELECT pg_total_relation_size(\'"{tname}"\')')
                except Exception as e:
                    row_count = f"Error: {e}"
            
            tables_data.append({
                "table_name": tname,
                "table_type": ttype,
                "row_count": row_count,
                "size_pretty": size_pretty,
                "size_bytes": size_bytes,
                "rls": rls_map.get(tname, {"enabled": False, "forced": False})
            })
        report["tables"] = tables_data

        # 5. Columns
        columns_query = """
        SELECT 
            table_name,
            column_name,
            ordinal_position,
            column_default,
            is_nullable,
            data_type,
            udt_name,
            character_maximum_length,
            numeric_precision,
            numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
        """
        columns_rows = await conn.fetch(columns_query)
        columns_by_table: Dict[str, List[Dict[str, Any]]] = {}
        for r in columns_rows:
            columns_by_table.setdefault(r["table_name"], []).append(dict(r))
        report["columns"] = columns_by_table

        # 6. Primary Keys & Constraints
        constraints_query = """
        SELECT
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            kcu.ordinal_position
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
        """
        constraints_rows = await conn.fetch(constraints_query)
        report["key_constraints"] = [dict(r) for r in constraints_rows]

        # 7. Foreign Keys Details (with referenced tables and columns, rules)
        fk_query = """
        SELECT
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.update_rule,
            rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints rc
            ON rc.constraint_name = tc.constraint_name
            AND rc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name;
        """
        fk_rows = await conn.fetch(fk_query)
        report["foreign_keys"] = [dict(r) for r in fk_rows]

        # 8. Check Constraints
        check_query = """
        SELECT
            tc.table_name,
            tc.constraint_name,
            cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc
            ON tc.constraint_name = cc.constraint_name
            AND tc.constraint_schema = cc.constraint_schema
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name;
        """
        check_rows = await conn.fetch(check_query)
        report["check_constraints"] = [dict(r) for r in check_rows]

        # 9. Indexes
        indexes_query = """
        SELECT 
            i.schemaname,
            i.tablename,
            i.indexname,
            i.indexdef,
            idx.indisunique AS is_unique,
            idx.indisprimary AS is_primary
        FROM pg_indexes i
        JOIN pg_class c ON c.relname = i.indexname
        JOIN pg_index idx ON idx.indexrelid = c.oid
        WHERE i.schemaname = 'public'
        ORDER BY i.tablename, i.indexname;
        """
        indexes_rows = await conn.fetch(indexes_query)
        report["indexes"] = [dict(r) for r in indexes_rows]

        # 10. RLS Policies
        policies_query = """
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
        """
        policies_rows = await conn.fetch(policies_query)
        report["rls_policies"] = [dict(r) for r in policies_rows]

        # 11. Triggers
        triggers_query = """
        SELECT 
            event_object_table AS table_name,
            trigger_name,
            event_manipulation,
            action_timing,
            action_orientation,
            action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
        """
        triggers_rows = await conn.fetch(triggers_query)
        report["triggers"] = [dict(r) for r in triggers_rows]

        return report

    finally:
        await conn.close()

if __name__ == "__main__":
    data = asyncio.run(inspect_database())
    output_path = Path(__file__).resolve().parent / "live_db_inventory.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    
    print(f"✅ Live database audit completed successfully.")
    print(f"📁 Dumped JSON report to: {output_path}")
    print(f"\n--- Quick Summary ---")
    print(f"PostgreSQL Version: {data['meta']['version']}")
    print(f"Database: {data['meta']['database']}, User: {data['meta']['user']}")
    print(f"Total Tables: {len(data['tables'])}")
    print(f"Total Enums: {len(data['enums'])}")
    print(f"Total Indexes: {len(data['indexes'])}")
    print(f"Total RLS Policies: {len(data['rls_policies'])}")
    print(f"Total Triggers: {len(data['triggers'])}")
    print("\nTables Inventory:")
    for t in data["tables"]:
        rls_txt = "RLS Enabled" if t["rls"]["enabled"] else "NO RLS"
        print(f" - {t['table_name']}: {t['row_count']} rows, {t['size_pretty']} ({rls_txt})")
