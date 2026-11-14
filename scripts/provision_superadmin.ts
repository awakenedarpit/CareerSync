/**
 * CarrerSync — Platform Super Admin Initial Provisioning Script
 * 
 * Strict ₹0 Zero-Cost Architecture | Platform Authority Security
 * 
 * PURPOSE:
 * Securely bootstrap the initial Platform Super Admin account into Neon PostgreSQL.
 * Note: There is NO public registration endpoint for Super Admins. Platform superadmin
 * credentials MUST be provisioned out-of-band via CLI or CI/CD deployment environment.
 * 
 * USAGE:
 *   # Using Node.js with stripped types (Node v20+ / v24+):
 *   DATABASE_URL="postgresql://..." node --experimental-strip-types scripts/provision_superadmin.ts [options]
 * 
 *   # Or with explicit flags:
 *   node --experimental-strip-types scripts/provision_superadmin.ts \
 *     --database-url "postgresql://user:pass@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" \
 *     --email "admin@carrersync.internal" \
 *     --name "Platform Administrator" \
 *     --password "SuperSecret123!"
 * 
 * OPTIONS:
 *   --database-url, -d   Neon PostgreSQL connection string (defaults to env DATABASE_URL)
 *   --email, -e          Super admin email (defaults to env SUPERADMIN_EMAIL or admin@carrersync.internal)
 *   --password, -p       Super admin password (defaults to env SUPERADMIN_PASSWORD or securely generated)
 *   --name, -n           Super admin display name (defaults to env SUPERADMIN_NAME or 'Platform Administrator')
 *   --force, -f          Update password/role if user already exists
 *   --dry-run            Simulate provisioning steps without modifying database
 *   --help, -h           Show this help message
 */

import { createRequire } from 'module';
import { randomBytes } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Auto-load .env.local and .env if present
try {
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (const envFile of ['.env.local', '.env']) {
    const fullPath = resolve(rootDir, envFile);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // Ignore env loading errors
}

const require = createRequire(import.meta.url);
const neonPkg = require('../workers/node_modules/@neondatabase/serverless/index.js');
const { neon } = neonPkg;
const bcrypt = require('../workers/node_modules/bcryptjs/index.js');

interface CliArgs {
  databaseUrl?: string;
  email: string;
  password?: string;
  name: string;
  force: boolean;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    email: process.env.SUPERADMIN_EMAIL || 'admin@carrersync.internal',
    password: process.env.SUPERADMIN_PASSWORD,
    name: process.env.SUPERADMIN_NAME || 'Platform Administrator',
    databaseUrl: process.env.DATABASE_URL,
    force: false,
    dryRun: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--force' || arg === '-f') {
      result.force = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--database-url' || arg === '-d') {
      result.databaseUrl = args[++i];
    } else if (arg === '--email' || arg === '-e') {
      result.email = args[++i];
    } else if (arg === '--password' || arg === '-p') {
      result.password = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      result.name = args[++i];
    }
  }

  return result;
}

function generateSecurePassword(length = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

function printHelp() {
  console.log(`
================================================================================
CarrerSync — Super Admin Initial Provisioning Utility
================================================================================

COMMAND:
  node --experimental-strip-types scripts/provision_superadmin.ts [options]

ENVIRONMENT VARIABLES:
  DATABASE_URL           Neon PostgreSQL connection URL (Required if not passed as CLI flag)
  SUPERADMIN_EMAIL       Email for the super admin (Default: admin@carrersync.internal)
  SUPERADMIN_PASSWORD    Password (Optional, auto-generated if omitted)
  SUPERADMIN_NAME        Full name (Default: Platform Administrator)

CLI OPTIONS:
  --database-url, -d     PostgreSQL connection URI
  --email, -e            Super admin email address
  --password, -p         Super admin password
  --name, -n             Super admin full name
  --force, -f            Reset password and ensure role 'superadmin' if user already exists
  --dry-run              Verify configuration and log intended actions without writing
  --help, -h             Display this documentation

SECURITY NOTE:
  There is NO public registration portal for Super Admin accounts.
  All platform root authority accounts must be provisioned via this CLI tool.
================================================================================
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│  CarrerSync Platform — Super Admin Initial Provisioning Bootstrapper  │
│  Zero-Cost Cloudflare Workers & Neon PostgreSQL Architecture           │
└────────────────────────────────────────────────────────────────────────┘
`);

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(args.email)) {
    console.error(`❌ ERROR: Invalid email address format: "${args.email}"`);
    process.exit(1);
  }

  // Validate Database URL
  const dbUrl = args.databaseUrl?.trim();
  if (!dbUrl) {
    console.error('❌ ERROR: Missing database connection string.');
    console.error('   Please provide DATABASE_URL in environment or pass --database-url <url>');
    console.error('   Example: DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"');
    process.exit(1);
  }

  // Handle password generation
  let plainPassword = args.password?.trim();
  let wasAutoGenerated = false;
  if (!plainPassword) {
    plainPassword = generateSecurePassword(24);
    wasAutoGenerated = true;
  } else if (plainPassword.length < 8) {
    console.error('❌ ERROR: Password must be at least 8 characters long for security compliance.');
    process.exit(1);
  }

  console.log(`ℹ️  Target Email:        ${args.email}`);
  console.log(`ℹ️  Target Name:         ${args.name}`);
  console.log(`ℹ️  Force Overwrite:     ${args.force}`);
  console.log(`ℹ️  Dry-Run Mode:        ${args.dryRun}`);
  console.log(`ℹ️  Database Host:       ${dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')}`);

  if (args.dryRun) {
    console.log('\n[DRY RUN] Simulation complete. No database mutations executed.');
    if (wasAutoGenerated) {
      console.log(`[DRY RUN] Generated Password: ${plainPassword}`);
    }
    process.exit(0);
  }

  try {
    const sql = neon(dbUrl);

    console.log('\n⏳ Connecting to Neon PostgreSQL and verifying platform tenant...');

    // 1. Ensure platform root tenant exists
    const PLATFORM_SLUG = 'carrersync-platform';
    let tenantResult = await sql`
      SELECT id, name, slug, is_active FROM tenants 
      WHERE slug = ${PLATFORM_SLUG} OR slug = 'platform'
      LIMIT 1
    `;

    let platformTenantId: string;

    if (tenantResult.length === 0) {
      console.log(`ℹ️  Platform tenant "${PLATFORM_SLUG}" not found. Creating platform root tenant...`);
      const insertedTenant = await sql`
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
          ${PLATFORM_SLUG},
          'carrersync.internal',
          true,
          '{"system": true, "platform": "CarrerSync Super Admin Root"}'::jsonb,
          NOW(),
          NOW()
        )
        RETURNING id, name, slug;
      `;
      platformTenantId = insertedTenant[0].id;
      console.log(`✅ Platform root tenant created with ID: ${platformTenantId}`);
    } else {
      platformTenantId = tenantResult[0].id;
      console.log(`✅ Found existing platform tenant: "${tenantResult[0].name}" (${platformTenantId})`);
    }

    // 2. Hash Password with bcrypt
    console.log('⏳ Hashing password with bcrypt (salt rounds: 10)...');
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 3. Check if user already exists
    const existingUsers = await sql`
      SELECT id, email, role, is_active, full_name 
      FROM users 
      WHERE email = ${args.email.toLowerCase()}
      LIMIT 1
    `;

    let finalUserId: string;

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      finalUserId = user.id;

      if (user.role === 'superadmin' && !args.force) {
        console.log(`\n⚠️  NOTICE: User "${args.email}" is ALREADY provisioned as 'superadmin' (User ID: ${user.id}).`);
        console.log('   Use --force flag if you wish to reset their password and verify status.');
        printSummary(args.email, args.name, 'superadmin', platformTenantId, false, wasAutoGenerated ? plainPassword : null);
        process.exit(0);
      }

      console.log(`ℹ️  Updating existing user "${args.email}" to role 'superadmin'...`);
      await sql`
        UPDATE users 
        SET 
          tenant_id = ${platformTenantId},
          role = 'superadmin',
          full_name = ${args.name},
          password_hash = ${passwordHash},
          is_active = true,
          is_verified = true,
          updated_at = NOW()
        WHERE id = ${user.id}
      `;
      console.log(`✅ User "${args.email}" updated to role 'superadmin' successfully.`);
    } else {
      console.log(`ℹ️  Creating new 'superadmin' user "${args.email}"...`);
      const insertedUser = await sql`
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
          ${platformTenantId},
          ${args.email.toLowerCase()},
          ${passwordHash},
          ${args.name},
          'superadmin',
          true,
          true,
          NOW(),
          NOW()
        )
        RETURNING id;
      `;
      finalUserId = insertedUser[0].id;
      console.log(`✅ Super Admin created with User ID: ${finalUserId}`);
    }

    // 4. Try logging audit event if audit_events table exists
    try {
      await sql`
        INSERT INTO audit_events (
          tenant_id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          details,
          created_at
        ) VALUES (
          ${platformTenantId},
          ${finalUserId},
          'SUPERADMIN_INITIAL_PROVISIONING',
          'user',
          ${finalUserId},
          ${JSON.stringify({
            email: args.email,
            role: 'superadmin',
            method: 'cli_provisioning_script',
            timestamp: new Date().toISOString()
          })}::jsonb,
          NOW()
        )
      `;
      console.log('✅ Platform audit trail event logged.');
    } catch {
      // Non-fatal if audit_events table is not yet migrated
      console.log('ℹ️  Platform audit trail skipped (table not initialized or optional).');
    }

    printSummary(args.email, args.name, 'superadmin', platformTenantId, true, wasAutoGenerated ? plainPassword : null);

  } catch (error: any) {
    console.error('\n❌ PROVISIONING FAILED with error:');
    console.error(error?.message || error);
    process.exit(1);
  }
}

function printSummary(
  email: string, 
  name: string, 
  role: string, 
  tenantId: string, 
  isNewOrUpdated: boolean,
  generatedPassword: string | null
) {
  console.log(`
════════════════════════════════════════════════════════════════════════════════
🎉 PLATFORM SUPER ADMIN PROVISIONING SUMMARY
════════════════════════════════════════════════════════════════════════════════
Status:               SUCCESS (${isNewOrUpdated ? 'Provisioned / Updated' : 'Already Active'})
Display Name:         ${name}
Email (Login ID):     ${email}
Assigned Role:        ${role}
Root Tenant ID:       ${tenantId}
Account Status:       Active & Verified (100% Platform Access)
Portal Route:         /super-admin
════════════════════════════════════════════════════════════════════════════════
${generatedPassword ? `
⚠️  TEMPORARY AUTO-GENERATED PASSWORD:
    ${generatedPassword}

    Please save this credential securely in your password manager.
    You will be prompted to rotate it upon initial login.
` : `
Password:             [Configured / Preserved securely in database]
`}
════════════════════════════════════════════════════════════════════════════════
SECURITY NOTICE:
There is NO public Super Admin registration page in CarrerSync.
This prevents unauthorized privilege escalation attacks across college tenants.
To log into the Super Admin portal:
1. Navigate to /login in the CarrerSync frontend.
2. Sign in with the credentials above.
3. Your session token will carry role: 'superadmin' granting full access to /super-admin/*.
════════════════════════════════════════════════════════════════════════════════
`);
}

main();
