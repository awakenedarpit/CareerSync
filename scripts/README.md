# Platform Super Admin Provisioning Utilities

> **CarrerSync Zero-Cost Architecture | Platform Authority Security**

This directory contains standalone, secure bootstrap scripts for provisioning the initial Platform Super Admin in CarrerSync's Neon PostgreSQL database.

---

## 🔒 Security Architecture: Out-of-Band Provisioning

In CarrerSync's multi-tenant architecture, the **Super Admin** possesses universal administrative capabilities across all collegiate tenants, users, invitation lifecycles, and audit records.

> [!IMPORTANT]
> **Zero Public Registration**: There is **no public registration endpoint or web form** for Super Admins. Allowing public self-registration for platform administrators is a critical security vulnerability. All Super Admin root accounts must be provisioned out-of-band via CLI, SSH, or CI/CD pipeline secrets.

Subsequent college administrators, recruiters, students, and TPO staff are onboarded via:
1. **Cryptographic Single-Use Invitations**: Created by Super Admins via `/api/v1/super-admin/invitations` or UI at `/super-admin/invitations`.
2. **Direct User Creation with Audit Trail**: Managed under `/api/v1/super-admin/users`.

---

## 🚀 Quickstart

You can use either the TypeScript/Node.js script or the Python script based on your deployment environment.

### Option A: Node.js / TypeScript (`provision_superadmin.ts`)

Leverages Node v20+/v24+ stripped types with `@neondatabase/serverless` and `bcryptjs`.

```bash
# Basic usage with environment variable
DATABASE_URL="postgresql://user:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" \
node --experimental-strip-types scripts/provision_superadmin.ts

# With explicit parameters
node --experimental-strip-types scripts/provision_superadmin.ts \
  --database-url "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" \
  --email "admin@carrersync.internal" \
  --name "Platform Administrator" \
  --password "MySecurePassword123!" \
  --force
```

### Option B: Python (`provision_superadmin.py`)

Leverages Python 3.10+ with `asyncpg` and `bcrypt`.

```bash
# Basic usage with environment variable
DATABASE_URL="postgresql://user:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" \
.venv/bin/python scripts/provision_superadmin.py

# With explicit parameters
.venv/bin/python scripts/provision_superadmin.py \
  --database-url "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" \
  --email "admin@carrersync.internal" \
  --name "Platform Administrator" \
  --password "MySecurePassword123!" \
  --force
```

---

## ⚙️ Configuration Reference

| Option | Flag | Environment Variable | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Database URL** | `-d`, `--database-url` | `DATABASE_URL` | *Required* | Neon PostgreSQL connection URI |
| **Email** | `-e`, `--email` | `SUPERADMIN_EMAIL` | `admin@carrersync.internal` | Primary login email for Super Admin |
| **Password** | `-p`, `--password` | `SUPERADMIN_PASSWORD` | *Auto-generated* | Plaintext password (hashed with bcrypt, 10 rounds) |
| **Display Name** | `-n`, `--name` | `SUPERADMIN_NAME` | `Platform Administrator` | Display name of the administrator |
| **Force Update** | `-f`, `--force` | - | `false` | Resets password and upgrades role if user exists |
| **Dry Run** | `--dry-run` | - | `false` | Validates parameters and prints plan without DB writes |
| **Help** | `-h`, `--help` | - | - | Displays usage manual and parameter details |

---

## 🛡️ What the Script Does

1. **Platform Root Tenant**: Verifies or creates the canonical `carrersync-platform` root tenant in the `tenants` table.
2. **Cryptographic Hashing**: Hashes passwords using `bcrypt` (10 salt rounds).
3. **Idempotent User Upsert**: Checks for existing users with the target email. Upgrades role to `superadmin` and associates with platform tenant if existing, or inserts a new user record.
4. **Audit Trail Logging**: Inserts a `SUPERADMIN_INITIAL_PROVISIONING` audit record in `audit_events` for platform transparency.
5. **Security Report**: Displays a masked provisioning summary and outputs the temporary auto-generated password once (if not pre-specified).
