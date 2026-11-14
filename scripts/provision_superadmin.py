#!/usr/bin/env python3
"""
CarrerSync — Platform Super Admin Initial Provisioning Script (Python Edition)

Strict ₹0 Zero-Cost Architecture | Platform Authority Security

PURPOSE:
Securely bootstrap the initial Platform Super Admin account into Neon PostgreSQL.
Note: There is NO public registration endpoint for Super Admins. Platform superadmin
credentials MUST be provisioned out-of-band via CLI or CI/CD deployment environment.

USAGE:
  # Using virtual environment:
  DATABASE_URL="postgresql://..." .venv/bin/python scripts/provision_superadmin.py [options]

  # Or with explicit flags:
  python3 scripts/provision_superadmin.py \\
    --database-url "postgresql://user:pass@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" \\
    --email "admin@carrersync.internal" \\
    --name "Platform Administrator" \\
    --password "SuperSecret123!"

OPTIONS:
  --database-url, -d   Neon PostgreSQL connection string (defaults to env DATABASE_URL)
  --email, -e          Super admin email (defaults to env SUPERADMIN_EMAIL or admin@carrersync.internal)
  --password, -p       Super admin password (defaults to env SUPERADMIN_PASSWORD or securely generated)
  --name, -n           Super admin display name (defaults to env SUPERADMIN_NAME or 'Platform Administrator')
  --force, -f          Update password/role if user already exists
  --dry-run            Simulate provisioning steps without modifying database
  --help, -h           Show this help message
"""

import os
import sys
import argparse
import secrets
import string
import json
import asyncio
import re
from datetime import datetime

try:
    import asyncpg
    import bcrypt
except ImportError:
    print("❌ Required dependencies missing. Please install: pip install asyncpg bcrypt")
    sys.exit(1)


# Auto-load .env.local or .env if present
try:
    from pathlib import Path
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
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key not in os.environ:
                            os.environ[key] = val
except Exception:
    pass


def generate_secure_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def validate_email(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None


async def provision_superadmin(
    database_url: str,
    email: str,
    name: str,
    password: str,
    force: bool,
    dry_run: bool,
    was_auto_generated: bool
):
    print("""
┌────────────────────────────────────────────────────────────────────────┐
│  CarrerSync Platform — Super Admin Initial Provisioning (Python)       │
│  Zero-Cost Cloudflare Workers & Neon PostgreSQL Architecture           │
└────────────────────────────────────────────────────────────────────────┘
""")
    # Mask password in URL for display
    masked_url = re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", database_url)
    print(f"ℹ️  Target Email:        {email}")
    print(f"ℹ️  Target Name:         {name}")
    print(f"ℹ️  Force Overwrite:     {force}")
    print(f"ℹ️  Dry-Run Mode:        {dry_run}")
    print(f"ℹ️  Database Host:       {masked_url}")

    if dry_run:
        print("\n[DRY RUN] Simulation complete. No database mutations executed.")
        if was_auto_generated:
            print(f"[DRY RUN] Generated Password: {password}")
        return

    # Normalize PostgreSQL URL for asyncpg
    clean_url = database_url
    if clean_url.startswith("postgresql+asyncpg://"):
        clean_url = clean_url.replace("postgresql+asyncpg://", "postgresql://")
    # asyncpg expects ssl or sslmode
    if "sslmode=require" in clean_url:
        clean_url = clean_url.replace("sslmode=require", "ssl=require")

    print("\n⏳ Connecting to Neon PostgreSQL...")
    conn = await asyncpg.connect(clean_url)

    try:
        PLATFORM_SLUG = "carrersync-platform"
        print(f"⏳ Verifying platform root tenant '{PLATFORM_SLUG}'...")

        # 1. Ensure platform root tenant exists
        row = await conn.fetchrow(
            "SELECT id, name, slug FROM tenants WHERE slug = $1 OR slug = 'platform' LIMIT 1",
            PLATFORM_SLUG
        )

        if row is None:
            print(f"ℹ️  Creating platform root tenant '{PLATFORM_SLUG}'...")
            inserted_tenant = await conn.fetchrow("""
                INSERT INTO tenants (
                    name, 
                    slug, 
                    domain, 
                    is_active, 
                    settings, 
                    created_at, 
                    updated_at
                ) VALUES (
                    'CarrerSync Platform Authority',
                    $1,
                    'carrersync.internal',
                    true,
                    $2::jsonb,
                    NOW(),
                    NOW()
                )
                RETURNING id, name, slug;
            """, PLATFORM_SLUG, json.dumps({"system": True, "platform": "CarrerSync Super Admin Root"}))
            platform_tenant_id = str(inserted_tenant["id"])
            print(f"✅ Platform root tenant created with ID: {platform_tenant_id}")
        else:
            platform_tenant_id = str(row["id"])
            print(f"✅ Found existing platform tenant: '{row['name']}' ({platform_tenant_id})")

        # 2. Hash Password with bcrypt
        print("⏳ Hashing password with bcrypt (salt rounds: 10)...")
        password_bytes = password.encode("utf-8")
        salt = bcrypt.gensalt(rounds=10)
        password_hash = bcrypt.hashpw(password_bytes, salt).decode("utf-8")

        # 3. Check if user already exists
        user_row = await conn.fetchrow(
            "SELECT id, email, role, is_active, full_name FROM users WHERE email = $1 LIMIT 1",
            email.lower()
        )

        if user_row:
            user_id = str(user_row["id"])
            current_role = user_row["role"]

            if current_role == "superadmin" and not force:
                print(f"\n⚠️  NOTICE: User '{email}' is ALREADY provisioned as 'superadmin' (User ID: {user_id}).")
                print("   Use --force flag if you wish to reset their password and verify status.")
                print_summary(email, name, "superadmin", platform_tenant_id, False, password if was_auto_generated else None)
                return

            print(f"ℹ️  Updating existing user '{email}' to role 'superadmin'...")
            await conn.execute("""
                UPDATE users 
                SET 
                    tenant_id = $1,
                    role = 'superadmin',
                    full_name = $2,
                    password_hash = $3,
                    is_active = true,
                    is_verified = true,
                    updated_at = NOW()
                WHERE id = $4
            """, platform_tenant_id, name, password_hash, user_row["id"])
            print(f"✅ User '{email}' updated to role 'superadmin' successfully.")
        else:
            print(f"ℹ️  Creating new 'superadmin' user '{email}'...")
            inserted_user = await conn.fetchrow("""
                INSERT INTO users (
                    tenant_id,
                    email,
                    password_hash,
                    full_name,
                    role,
                    is_active,
                    is_verified,
                    created_at,
                    updated_at
                ) VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    'superadmin',
                    true,
                    true,
                    NOW(),
                    NOW()
                )
                RETURNING id;
            """, platform_tenant_id, email.lower(), password_hash, name)
            user_id = str(inserted_user["id"])
            print(f"✅ Super Admin created with User ID: {user_id}")

        # 4. Optional Audit Event
        try:
            await conn.execute("""
                INSERT INTO audit_events (
                    tenant_id,
                    actor_user_id,
                    action,
                    entity_type,
                    entity_id,
                    details,
                    created_at
                ) VALUES (
                    $1,
                    $2,
                    'SUPERADMIN_INITIAL_PROVISIONING',
                    'user',
                    $3,
                    $4::jsonb,
                    NOW()
                )
            """, platform_tenant_id, user_row["id"] if user_row else inserted_user["id"], user_id, json.dumps({
                "email": email,
                "role": "superadmin",
                "method": "python_provisioning_script",
                "timestamp": datetime.utcnow().isoformat()
            }))
            print("✅ Platform audit trail event logged.")
        except Exception:
            print("ℹ️  Platform audit trail skipped (table not initialized or optional).")

        print_summary(email, name, "superadmin", platform_tenant_id, True, password if was_auto_generated else None)

    finally:
        await conn.close()


def print_summary(email, name, role, tenant_id, is_new, generated_password):
    status_text = "Provisioned / Updated" if is_new else "Already Active"
    password_block = f"""
⚠️  TEMPORARY AUTO-GENERATED PASSWORD:
    {generated_password}

    Please save this credential securely in your password manager.
    You will be prompted to rotate it upon initial login.
""" if generated_password else """
Password:             [Configured / Preserved securely in database]
"""
    print(f"""
════════════════════════════════════════════════════════════════════════════════
🎉 PLATFORM SUPER ADMIN PROVISIONING SUMMARY
════════════════════════════════════════════════════════════════════════════════
Status:               SUCCESS ({status_text})
Display Name:         {name}
Email (Login ID):     {email}
Assigned Role:        {role}
Root Tenant ID:       {tenant_id}
Account Status:       Active & Verified (100% Platform Access)
Portal Route:         /super-admin
════════════════════════════════════════════════════════════════════════════════
{password_block}
════════════════════════════════════════════════════════════════════════════════
SECURITY NOTICE:
There is NO public Super Admin registration page in CarrerSync.
This prevents unauthorized privilege escalation attacks across college tenants.
To log into the Super Admin portal:
1. Navigate to /login in the CarrerSync frontend.
2. Sign in with the credentials above.
3. Your session token will carry role: 'superadmin' granting full access to /super-admin/*.
════════════════════════════════════════════════════════════════════════════════
""")


def main():
    parser = argparse.ArgumentParser(
        description="CarrerSync Super Admin Initial Provisioning Utility"
    )
    parser.add_argument(
        "--database-url", "-d",
        default=os.getenv("DATABASE_URL"),
        help="PostgreSQL connection string (defaults to DATABASE_URL env var)"
    )
    parser.add_argument(
        "--email", "-e",
        default=os.getenv("SUPERADMIN_EMAIL", "admin@carrersync.internal"),
        help="Super admin email address"
    )
    parser.add_argument(
        "--password", "-p",
        default=os.getenv("SUPERADMIN_PASSWORD"),
        help="Super admin password (auto-generated if omitted)"
    )
    parser.add_argument(
        "--name", "-n",
        default=os.getenv("SUPERADMIN_NAME", "Platform Administrator"),
        help="Super admin full name"
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="Reset password and ensure role 'superadmin' if user exists"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate execution without modifying the database"
    )

    args = parser.parse_args()

    if not validate_email(args.email):
        print(f"❌ ERROR: Invalid email address format: '{args.email}'")
        sys.exit(1)

    if not args.database_url:
        print("❌ ERROR: Missing database connection string.")
        print("   Please provide DATABASE_URL in environment or pass --database-url <url>")
        print("   Example: DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require'")
        sys.exit(1)

    was_auto_generated = False
    plain_password = args.password
    if not plain_password:
        plain_password = generate_secure_password(24)
        was_auto_generated = True
    elif len(plain_password) < 8:
        print("❌ ERROR: Password must be at least 8 characters long for security compliance.")
        sys.exit(1)

    asyncio.run(
        provision_superadmin(
            database_url=args.database_url,
            email=args.email,
            name=args.name,
            password=plain_password,
            force=args.force,
            dry_run=args.dry_run,
            was_auto_generated=was_auto_generated
        )
    )


if __name__ == "__main__":
    main()
