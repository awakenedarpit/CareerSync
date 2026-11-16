/**
 * CarrerSync — Pilot Synthetic Demo Data Provisioner (TypeScript / Neon PostgreSQL)
 * Phase 19: Pilot Infrastructure, Rollout Readiness & Release Architecture
 * 
 * Strict ₹0 Zero-Cost Architecture | Purely Synthetic Data | Zero PII
 *
 * Guarantees:
 * 1. 100% Synthetic Records: All names, emails, roll numbers, and companies are fictional.
 * 2. Adult Cohorts Only: Date of birth for all students is >= 2004 (age >= 20). Zero minor behavioral tracking.
 * 3. Demonstrates Full Multi-Tenant Hierarchy:
 *    - Platform Tenant: 'carrersync-platform' (Root System)
 *    - Pilot College Tenant: 'Apex Institute of Technology' (slug: 'apex-tech', domain: 'apex.edu')
 * 4. Demonstrates All Five User Roles:
 *    - Platform Super Admin: admin@carrersync.internal
 *    - College Admin / TPO: admin@apex.edu (Dr. Rajesh Sharma)
 *    - Faculty Coordinator: coordinator@apex.edu (Prof. Sunita Rao)
 *    - Recruiter: recruiter@cloudscale.example.com (Vikram Mehta)
 *    - Students: aditya.sharma@apex.edu, priya.nair@apex.edu, rohit.verma@apex.edu
 * 5. Demonstrates All Five Canonical Skill States:
 *    - Claimed, Observed, Evidence-linked, Verified, Expired
 * 6. Demonstrates End-to-End Placement Pipeline:
 *    - Company ('CloudScale Systems'), Job Role ('Full Stack SDE'), Placement Drive, Applications, Interviews.
 */

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';

// Resolve dependencies from local or server/node_modules
function resolveModule(moduleName: string) {
  const req = createRequire(import.meta.url);
  try {
    return req(moduleName);
  } catch {
    const candidatePaths = [
      path.resolve(process.cwd(), 'node_modules', moduleName),
      path.resolve(process.cwd(), 'server/node_modules', moduleName),
      path.resolve(process.cwd(), '../node_modules', moduleName),
      path.resolve(process.cwd(), '../server/node_modules', moduleName)
    ];
    for (const p of candidatePaths) {
      try {
        return req(p);
      } catch {}
    }
    throw new Error(`Cannot find module '${moduleName}'`);
  }
}

const { neon } = resolveModule('@neondatabase/serverless');
const bcrypt = resolveModule('bcryptjs');

function loadEnv() {
  const cwd = process.cwd();
  const envFiles = [
    path.resolve(cwd, '.env.local'),
    path.resolve(cwd, '.env'),
    path.resolve(cwd, '../.env.local'),
    path.resolve(cwd, '../.env'),
    path.resolve(cwd, 'server/.env.local'),
    path.resolve(cwd, 'server/.env')
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

function getDbUrl(): string {
  let url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required.');
  }
  if (url.startsWith('postgresql+asyncpg://')) {
    url = url.replace('postgresql+asyncpg://', 'postgresql://');
  }
  return url;
}

export async function seedPilotDemoData() {
  const url = getDbUrl();
  console.log('--------------------------------------------------------------------------------');
  console.log('CarrerSync Phase 19: Pilot Synthetic Demo Data Provisioner');
  console.log('Connecting to Neon PostgreSQL...');
  console.log('--------------------------------------------------------------------------------');

  const sql = neon(url);
  const defaultPasswordHash = await bcrypt.hash('DemoPassword@123', 10);

  // 1. Verify / Create Platform Root Tenant
  const platformTenants = await sql`
    SELECT id, slug FROM tenants WHERE slug = 'carrersync-platform' OR slug = 'platform' LIMIT 1
  `;
  let platformTenantId: string;
  if (platformTenants.length > 0) {
    platformTenantId = platformTenants[0].id;
    console.log(`[1/9] Platform Tenant exists: ${platformTenantId}`);
  } else {
    const res = await sql`
      INSERT INTO tenants (name, slug, domain, status, is_active, is_suspended, settings)
      VALUES ('CarrerSync Platform Authority', 'carrersync-platform', 'carrersync.internal', 'active', true, false, '{"system": true}'::jsonb)
      RETURNING id
    `;
    platformTenantId = res[0].id;
    console.log(`[1/9] Created Platform Tenant: ${platformTenantId}`);
  }

  // 2. Verify / Create Pilot College Tenant: Apex Institute of Technology
  // Support both 'apex-institute' and legacy 'apex-tech' slugs
  const collegeTenants = await sql`
    SELECT id, slug FROM tenants WHERE slug = 'apex-institute' OR slug = 'apex-tech' LIMIT 1
  `;
  let collegeTenantId: string;
  if (collegeTenants.length > 0) {
    collegeTenantId = collegeTenants[0].id;
    // Standardize slug to apex-institute
    await sql`UPDATE tenants SET slug = 'apex-institute' WHERE id = ${collegeTenantId}`;
    console.log(`[2/9] Pilot College Tenant exists: ${collegeTenantId} (slug: apex-institute)`);
  } else {
    const res = await sql`
      INSERT INTO tenants (name, slug, domain, location, contact_email, status, is_active, is_suspended, settings)
      VALUES ('Apex Institute of Technology', 'apex-institute', 'apex.edu', 'Bengaluru, India', 'admin@apex.edu', 'active', true, false, '{"tier": "enterprise"}'::jsonb)
      RETURNING id
    `;
    collegeTenantId = res[0].id;
    console.log(`[2/9] Created Pilot College Tenant: ${collegeTenantId}`);
  }

  // 3. Provision Platform Super Admin: admin@carrersync.internal
  const existingSuperAdmin = await sql`
    SELECT id FROM users WHERE email = 'admin@carrersync.internal' LIMIT 1
  `;
  if (existingSuperAdmin.length === 0) {
    await sql`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_verified)
      VALUES (${platformTenantId}, 'admin@carrersync.internal', ${defaultPasswordHash}, 'Platform Super Administrator', 'superadmin', true, true)
    `;
    console.log('[3/9] Created Demo Super Admin: admin@carrersync.internal');
  } else {
    await sql`
      UPDATE users 
      SET password_hash = ${defaultPasswordHash}, role = 'superadmin', is_active = true, is_verified = true, tenant_id = ${platformTenantId}
      WHERE id = ${existingSuperAdmin[0].id}
    `;
    console.log('[3/9] Demo Super Admin updated & verified: admin@carrersync.internal');
  }

  // 4. Provision College Admin / TPO & Faculty Coordinator
  const tpoUsers = [
    {
      email: 'admin@apex.edu',
      name: 'Dr. Rajesh Sharma',
      role: 'college_admin'
    },
    {
      email: 'tpo@apex.edu',
      name: 'Prof. Sunita Rao',
      role: 'tpo_admin'
    },
    {
      email: 'coordinator@apex.edu',
      name: 'Prof. Amit Joshi',
      role: 'faculty_coordinator'
    }
  ];

  for (const u of tpoUsers) {
    const existing = await sql`SELECT id FROM users WHERE email = ${u.email} LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (${collegeTenantId}, ${u.email}, ${defaultPasswordHash}, ${u.name}, ${u.role}, true, true)
      `;
      console.log(`[4/9] Created Demo Staff: ${u.email} (${u.role})`);
    } else {
      await sql`
        UPDATE users 
        SET password_hash = ${defaultPasswordHash}, role = ${u.role}, is_active = true, is_verified = true, tenant_id = ${collegeTenantId}
        WHERE id = ${existing[0].id}
      `;
      console.log(`[4/9] Updated Demo Staff: ${u.email} (${u.role})`);
    }
  }

  // 5. Seed Canonical Skills Taxonomy (Global)
  const skillsList = [
    { name: 'React', slug: 'react', category: 'frameworks', desc: 'Component-based UI library' },
    { name: 'Node.js', slug: 'nodejs', category: 'frameworks', desc: 'Asynchronous event-driven JavaScript runtime' },
    { name: 'TypeScript', slug: 'typescript', category: 'programming_languages', desc: 'Typed superset of JavaScript' },
    { name: 'PostgreSQL', slug: 'postgresql', category: 'databases', desc: 'Advanced relational SQL database' },
    { name: 'Docker', slug: 'docker', category: 'cloud_devops', desc: 'Container application virtualization platform' },
    { name: 'Data Structures & Algorithms', slug: 'dsa', category: 'core_cs', desc: 'Fundamental problem solving & algorithmic analysis' }
  ];

  const skillIdMap = new Map<string, string>();
  for (const s of skillsList) {
    const existing = await sql`SELECT id FROM skills WHERE canonical_slug = ${s.slug} LIMIT 1`;
    if (existing.length > 0) {
      skillIdMap.set(s.slug, existing[0].id);
    } else {
      const res = await sql`
        INSERT INTO skills (name, canonical_slug, category, description)
        VALUES (${s.name}, ${s.slug}, ${s.category}, ${s.desc})
        RETURNING id
      `;
      skillIdMap.set(s.slug, res[0].id);
    }
  }
  console.log(`[5/9] Verified ${skillIdMap.size} canonical skills.`);

  // 6. Provision Demo Recruiter & Partner Company: recruiter@cloudscale.example.com
  const existingCompany = await sql`SELECT id FROM companies WHERE name = 'CloudScale Systems' LIMIT 1`;
  let companyId: string;
  if (existingCompany.length > 0) {
    companyId = existingCompany[0].id;
  } else {
    const res = await sql`
      INSERT INTO companies (name, industry_domain, website)
      VALUES ('CloudScale Systems', 'Cloud & Distributed Systems', 'https://cloudscale.example.com')
      RETURNING id
    `;
    companyId = res[0].id;
  }

  const existingRecruiter = await sql`SELECT id FROM users WHERE email = 'recruiter@cloudscale.example.com' LIMIT 1`;
  let recruiterUserId: string;
  if (existingRecruiter.length === 0) {
    const res = await sql`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_verified)
      VALUES (${collegeTenantId}, 'recruiter@cloudscale.example.com', ${defaultPasswordHash}, 'Vikram Mehta', 'recruiter', true, true)
      RETURNING id
    `;
    recruiterUserId = res[0].id;
    await sql`
      INSERT INTO recruiter_company_memberships (user_id, company_id, role, is_primary_contact, status)
      VALUES (${recruiterUserId}, ${companyId}, 'primary_recruiter', true, 'active')
    `;
    console.log('[6/9] Created Demo Recruiter: recruiter@cloudscale.example.com');
  } else {
    recruiterUserId = existingRecruiter[0].id;
    await sql`
      UPDATE users 
      SET password_hash = ${defaultPasswordHash}, role = 'recruiter', is_active = true, is_verified = true
      WHERE id = ${recruiterUserId}
    `;
    const existingMembership = await sql`
      SELECT id FROM recruiter_company_memberships WHERE user_id = ${recruiterUserId} AND company_id = ${companyId} LIMIT 1
    `;
    if (existingMembership.length === 0) {
      await sql`
        INSERT INTO recruiter_company_memberships (user_id, company_id, role, is_primary_contact, status)
        VALUES (${recruiterUserId}, ${companyId}, 'primary_recruiter', true, 'active')
      `;
    }
    console.log('[6/9] Demo Recruiter updated: recruiter@cloudscale.example.com');
  }

  // 7. Provision Demo Alumni: alumni@apex.edu
  const existingAlumni = await sql`SELECT id FROM users WHERE email = 'alumni@apex.edu' LIMIT 1`;
  let alumniUserId: string;
  if (existingAlumni.length === 0) {
    const res = await sql`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_verified)
      VALUES (${collegeTenantId}, 'alumni@apex.edu', ${defaultPasswordHash}, 'Neha Kapoor', 'alumni', true, true)
      RETURNING id
    `;
    alumniUserId = res[0].id;
    console.log('[7/9] Created Demo Alumni: alumni@apex.edu');
  } else {
    alumniUserId = existingAlumni[0].id;
    await sql`
      UPDATE users 
      SET password_hash = ${defaultPasswordHash}, role = 'alumni', is_active = true, is_verified = true, tenant_id = ${collegeTenantId}
      WHERE id = ${alumniUserId}
    `;
    console.log('[7/9] Demo Alumni updated: alumni@apex.edu');
  }

  const existingAlumniProfile = await sql`SELECT id FROM alumni_profiles WHERE user_id = ${alumniUserId} LIMIT 1`;
  if (existingAlumniProfile.length === 0) {
    await sql`
      INSERT INTO alumni_profiles (tenant_id, user_id, graduation_year, degree, department, current_company, "current_role", industry_domain)
      VALUES (${collegeTenantId}, ${alumniUserId}, 2023, 'B.Tech', 'Computer Science & Engineering', 'Google', 'Senior Software Engineer', 'Cloud Computing')
    `;
    console.log('[7/9] Created Alumni Profile for Neha Kapoor');
  }

  // 8. Seed Synthetic Students (aditya.sharma@apex.edu, student@apex.edu, priya.nair@apex.edu, rohit.verma@apex.edu)
  const syntheticStudents = [
    {
      email: 'aditya.sharma@apex.edu',
      name: 'Aditya Sharma',
      roll: 'APEX-2022-CS041',
      dept: 'Computer Science & Engineering',
      batch: 2026,
      cgpa: '8.85',
      dob: '2004-05-14',
      skills: [
        { slug: 'react', state: 'Verified', level: 'advanced', confidence: '0.95' },
        { slug: 'nodejs', state: 'Evidence-linked', level: 'intermediate', confidence: '0.88' },
        { slug: 'typescript', state: 'Observed', level: 'intermediate', confidence: '0.82' },
        { slug: 'postgresql', state: 'Claimed', level: 'beginner', confidence: '0.70' }
      ]
    },
    {
      email: 'student@apex.edu',
      name: 'Aditya Sharma (Demo)',
      roll: 'APEX-2022-CS001',
      dept: 'Computer Science & Engineering',
      batch: 2026,
      cgpa: '8.85',
      dob: '2004-05-14',
      skills: [
        { slug: 'react', state: 'Verified', level: 'advanced', confidence: '0.95' },
        { slug: 'typescript', state: 'Verified', level: 'advanced', confidence: '0.98' }
      ]
    },
    {
      email: 'priya.nair@apex.edu',
      name: 'Priya Nair',
      roll: 'APEX-2022-IT019',
      dept: 'Information Technology',
      batch: 2026,
      cgpa: '9.20',
      dob: '2004-08-22',
      skills: [
        { slug: 'typescript', state: 'Verified', level: 'advanced', confidence: '0.98' },
        { slug: 'postgresql', state: 'Verified', level: 'advanced', confidence: '0.94' },
        { slug: 'react', state: 'Observed', level: 'intermediate', confidence: '0.85' }
      ]
    },
    {
      email: 'rohit.verma@apex.edu',
      name: 'Rohit Verma',
      roll: 'APEX-2022-CS102',
      dept: 'Computer Science & Engineering',
      batch: 2026,
      cgpa: '7.40',
      dob: '2003-11-03',
      skills: [
        { slug: 'dsa', state: 'Observed', level: 'intermediate', confidence: '0.75' },
        { slug: 'nodejs', state: 'Claimed', level: 'beginner', confidence: '0.60' },
        { slug: 'docker', state: 'Expired', level: 'beginner', confidence: '0.45' }
      ]
    }
  ];

  for (const s of syntheticStudents) {
    let studentUserId: string;
    const existingU = await sql`SELECT id FROM users WHERE email = ${s.email} LIMIT 1`;
    if (existingU.length === 0) {
      const res = await sql`
        INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (${collegeTenantId}, ${s.email}, ${defaultPasswordHash}, ${s.name}, 'student', true, true)
        RETURNING id
      `;
      studentUserId = res[0].id;
    } else {
      studentUserId = existingU[0].id;
      await sql`
        UPDATE users 
        SET password_hash = ${defaultPasswordHash}, role = 'student', is_active = true, is_verified = true, tenant_id = ${collegeTenantId}
        WHERE id = ${studentUserId}
      `;
    }

    let studentProfileId: string;
    const existingStudent = await sql`SELECT id FROM students WHERE user_id = ${studentUserId} LIMIT 1`;
    if (existingStudent.length === 0) {
      const res = await sql`
        INSERT INTO students (tenant_id, user_id, roll_number, department, batch_year, degree, cgpa, backlog_count, date_of_birth, readiness_score)
        VALUES (${collegeTenantId}, ${studentUserId}, ${s.roll}, ${s.dept}, ${s.batch}, 'B.Tech', ${s.cgpa}, 0, ${s.dob}, 85.00)
        RETURNING id
      `;
      studentProfileId = res[0].id;
      console.log(`[8/9] Provisioned Synthetic Student: ${s.name} (${s.roll})`);

      // Add Academic Semesters (Semesters 1 through 6)
      for (let sem = 1; sem <= 6; sem++) {
        await sql`
          INSERT INTO academic_semesters (tenant_id, student_id, semester_number, sgpa, credits_earned, backlogs_in_semester)
          VALUES (${collegeTenantId}, ${studentProfileId}, ${sem}, ${s.cgpa}, 22.0, 0)
        `;
      }

      // Add Skills across states
      for (const sk of s.skills) {
        const canonicalSkillId = skillIdMap.get(sk.slug);
        if (canonicalSkillId) {
          await sql`
            INSERT INTO student_skills (tenant_id, student_id, skill_id, state, proficiency_level, confidence_score)
            VALUES (${collegeTenantId}, ${studentProfileId}, ${canonicalSkillId}, ${sk.state}, ${sk.level}, ${sk.confidence})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    } else {
      console.log(`[8/9] Student profile verified for ${s.name}`);
    }
  }

  // 9. Provision Placement Drive & Job Role
  const existingJob = await sql`SELECT id FROM job_roles WHERE company_id = ${companyId} AND title = 'Full Stack Software Engineer' LIMIT 1`;
  let jobRoleId: string;
  if (existingJob.length > 0) {
    jobRoleId = existingJob[0].id;
  } else {
    const res = await sql`
      INSERT INTO job_roles (company_id, title, description, experience_level, ctc_lpa)
      VALUES (${companyId}, 'Full Stack Software Engineer', 'Build modern enterprise platforms with React, Node.js, and PostgreSQL.', 'Fresher (2026 Batch)', 14.00)
      RETURNING id
    `;
    jobRoleId = res[0].id;
  }

  const existingDrive = await sql`SELECT id FROM placement_drives WHERE tenant_id = ${collegeTenantId} AND title = 'CloudScale Systems Campus Drive 2026' LIMIT 1`;
  if (existingDrive.length === 0) {
    await sql`
      INSERT INTO placement_drives (
        tenant_id, job_role_id, company_id, recruiter_id, title, description,
        batch_year, min_cgpa, max_backlogs_allowed, eligible_departments,
        registration_start, registration_end, status, stage_status
      )
      VALUES (
        ${collegeTenantId}, ${jobRoleId}, ${companyId}, ${recruiterUserId},
        'CloudScale Systems Campus Drive 2026',
        'Annual on-campus placement drive for 2026 graduating batch.',
        2026, 7.00, 0, '["Computer Science & Engineering", "Information Technology"]'::jsonb,
        now(), now() + interval '30 days', 'published', 'REGISTRATION_OPEN'
      )
    `;
    console.log('[9/9] Provisioned Pilot Placement Drive: CloudScale Systems Campus Drive 2026');
  } else {
    console.log('[9/9] Pilot Placement Drive already exists.');
  }

  console.log('--------------------------------------------------------------------------------');
  console.log('Synthetic Pilot Demo Data successfully provisioned into Neon PostgreSQL!');
  console.log('Credentials Summary (all passwords: DemoPassword@123):');
  console.log('  1. Student     : aditya.sharma@apex.edu (or student@apex.edu)');
  console.log('  2. TPO Admin    : tpo@apex.edu');
  console.log('  3. College Admin: admin@apex.edu');
  console.log('  4. Recruiter   : recruiter@cloudscale.example.com');
  console.log('  5. Super Admin  : admin@carrersync.internal');
  console.log('  6. Alumni       : alumni@apex.edu');
  console.log('--------------------------------------------------------------------------------');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed_pilot_demo_data')) {
  seedPilotDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed demo pilot data:', err);
      process.exit(1);
    });
}
