# CareerSync — Demo Data Seeding & Pilot Provisioning Guide

**Document Version:** 1.0.0  
**Phase:** Phase 19 Pilot Infrastructure & Release Architecture / Phase 20 Production Readiness  
**Target Audience:** DevOps, QA, Evaluators, Backend Engineers, and Security Auditors  
**Persistence Engine:** PostgreSQL (Neon Serverless PostgreSQL)  
**Seed Script Path:** `scripts/seed_pilot_demo_data.ts` (invoked via `server/src/db/seed-demo.ts`)  

---

## 1. Executive Summary

CareerSync ships with a fully automated, idempotent demo data provisioning system that seeds a multi-tenant university environment into Neon PostgreSQL. It configures the platform root tenant, an institutional college tenant (`Apex Institute of Technology`), canonical skills taxonomies, a hiring partner company, active placement drives, student profiles across all 5 skill validation states, and the **6 Canonical Demo Personas**.

### Key Architectural Guarantees:
1. **100% Idempotent:** Safe to run repeatedly against development, staging, or production branches without creating duplicate records or throwing primary/unique key constraint errors.
2. **Deterministic Credentials:** All 6 demo personas share the standard password `DemoPassword@123`, hashed using `bcrypt` (10 salt rounds).
3. **Zero PII & 100% Synthetic:** All names, emails, roll numbers, and companies are fictional.
4. **Adult Cohorts Only:** Date of birth for all synthetic students is $\ge 2004$ (age $\ge 20$), ensuring zero minor behavioral tracking.
5. **₹0 Zero-Cost Footprint:** Operates within free-tier Neon PostgreSQL compute limits using lightweight pooled/unpooled connections.

---

## 2. Quickstart: Running the Seed Command

The seed task can be executed from either the project root or the `server/` directory:

### From Project Root:
```bash
npm run db:seed:demo
```

### From `server/` Directory:
```bash
npm run db:seed:demo --prefix server
# or directly using tsx:
npx tsx src/db/seed-demo.ts
```

### Expected Output
```text
--------------------------------------------------------------------------------
CarrerSync Phase 19: Pilot Synthetic Demo Data Provisioner
Connecting to Neon PostgreSQL...
--------------------------------------------------------------------------------
[1/9] Platform Tenant exists: ...
[2/9] Pilot College Tenant exists: ... (slug: apex-institute)
[3/9] Demo Super Admin updated & verified: admin@carrersync.internal
[4/9] Updated Demo Staff: admin@apex.edu (college_admin)
[4/9] Updated Demo Staff: tpo@apex.edu (tpo_admin)
[4/9] Updated Demo Staff: coordinator@apex.edu (faculty_coordinator)
[5/9] Verified 6 canonical skills.
[6/9] Demo Recruiter updated: recruiter@cloudscale.example.com
[7/9] Demo Alumni updated: alumni@apex.edu
[8/9] Student profile verified for Aditya Sharma
[8/9] Student profile verified for Aditya Sharma (Demo)
[8/9] Student profile verified for Priya Nair
[8/9] Student profile verified for Rohit Verma
[9/9] Pilot Placement Drive already exists.
--------------------------------------------------------------------------------
Synthetic Pilot Demo Data successfully provisioned into Neon PostgreSQL!
Credentials Summary (all passwords: DemoPassword@123):
  1. Student     : aditya.sharma@apex.edu (or student@apex.edu)
  2. TPO Admin    : tpo@apex.edu
  3. College Admin: admin@apex.edu
  4. Recruiter   : recruiter@cloudscale.example.com
  5. Super Admin  : admin@carrersync.internal
  6. Alumni       : alumni@apex.edu
--------------------------------------------------------------------------------
```

---

## 3. Canonical 6 Demo Accounts Matrix

The seed script provisions 6 canonical roles (plus a demo student alias) with pre-verified email addresses:

| # | Role | Email | Password | Tenant Slug | Organization / College | Primary Responsibility |
|---|---|---|---|---|---|---|
| **1** | **Student** | `aditya.sharma@apex.edu`<br>*(Alias: `student@apex.edu`)* | `DemoPassword@123` | `apex-institute`<br>*(or `apex-tech`)* | Apex Institute of Technology | **Aditya Sharma** (B.Tech CSE, Batch 2026). Has verified skills, mock interviews, and drive applications. |
| **2** | **TPO Admin** | `tpo@apex.edu` | `DemoPassword@123` | `apex-institute` | Apex Institute of Technology | **Prof. Sunita Rao** (Training & Placement Officer). Orchestrates placement drives, verifies evidence, and monitors cohort metrics. |
| **3** | **College Admin** | `admin@apex.edu` | `DemoPassword@123` | `apex-institute` | Apex Institute of Technology | **Dr. Rajesh Sharma** (Principal / Dean). Accesses institutional accreditation reports (NIRF/NAAC), governance, and audits. |
| **4** | **Recruiter** | `recruiter@cloudscale.example.com` | `DemoPassword@123` | `apex-institute` | CloudScale Systems | **Vikram Mehta** (Primary Recruiter). Posts campus drives, reviews student skills, and schedules technical interviews. |
| **5** | **Super Admin** | `admin@carrersync.internal` | `DemoPassword@123` | *Platform Tenant* (`carrersync-platform`) | CareerSync Platform Authority | **Platform Administrator**. Multi-tenant management, tenant onboarding, system metrics, and audit log inspection. |
| **6** | **Alumni** | `alumni@apex.edu` | `DemoPassword@123` | `apex-institute` | Apex Institute of Technology | **Neha Kapoor** (Senior Software Engineer at Google, Class of 2023). Conducts mock interviews and provides mentorship. |

---

## 4. Seeded Data Entities & Schemas

The seed script establishes relational entities across the following 9 domains:

### 4.1 Multi-Tenant Foundations
- **Platform Root Tenant:**
  - Name: `CarrerSync Platform Authority`
  - Slug: `carrersync-platform`
  - Domain: `carrersync.internal`
- **Pilot College Tenant:**
  - Name: `Apex Institute of Technology`
  - Slugs: `apex-institute` (canonical) & `apex-tech` (legacy alias)
  - Domain: `apex.edu`
  - Location: `Bengaluru, India`

### 4.2 Canonical Skills Taxonomy
Six foundational skills registered globally in the `skills` table:
1. **React** (`react` / Category: `frameworks`)
2. **Node.js** (`nodejs` / Category: `frameworks`)
3. **TypeScript** (`typescript` / Category: `programming_languages`)
4. **PostgreSQL** (`postgresql` / Category: `databases`)
5. **Docker** (`docker` / Category: `cloud_devops`)
6. **Data Structures & Algorithms** (`dsa` / Category: `core_cs`)

### 4.3 Corporate Hiring Ecosystem
- **Partner Company:** `CloudScale Systems` (`https://cloudscale.example.com`, Domain: *Cloud & Distributed Systems*)
- **Recruiter Membership:** `Vikram Mehta` linked to `CloudScale Systems` as `primary_recruiter` with active membership status.
- **Job Role:** `Full Stack Software Engineer` (Experience: *Fresher 2026 Batch*, CTC: ₹14.00 LPA).

### 4.4 Alumni Network
- **Alumni Record:** `Neha Kapoor` (`alumni@apex.edu`)
- **Profile:** Graduation Year `2023`, B.Tech CSE, Current Company `Google`, Current Role `"Senior Software Engineer"`, Domain `Cloud Computing`.

### 4.5 Synthetic Student Cohorts
Four synthetic student accounts with full academic histories:
1. **Aditya Sharma** (`aditya.sharma@apex.edu` / Roll: `APEX-2022-CS041`): CGPA 8.85, 0 backlogs.
2. **Aditya Sharma Demo** (`student@apex.edu` / Roll: `APEX-2022-CS001`): Quick-login demo account.
3. **Priya Nair** (`priya.nair@apex.edu` / Roll: `APEX-2022-IT019`): CGPA 9.20, Top percentile.
4. **Rohit Verma** (`rohit.verma@apex.edu` / Roll: `APEX-2022-CS102`): CGPA 7.40, Candidate for academic intervention.

Each student record is provisioned with:
- **Academic Semesters:** Semesters 1 through 6 with SGPA and credits earned.
- **Five Canonical Skill States:**
  - `Claimed`: Student self-attested skill (e.g. PostgreSQL, Node.js).
  - `Observed`: Monitored through coding activities or lab assessments.
  - `Evidence-linked`: Tied to GitHub repos, test scores, or project code artifacts.
  - `Verified`: Formally validated by faculty coordinator or automated evaluation harness.
  - `Expired`: Previously valid skill requiring recertification or fresh evidence.

### 4.6 Placement Drive & Hiring Workflow
- **Drive Title:** `CloudScale Systems Campus Drive 2026`
- **Eligibility:** Min CGPA 7.00, Max 0 active backlogs, Departments: CSE & IT.
- **Window:** Active 30-day window from current timestamp.
- **Stage Status:** `REGISTRATION_OPEN` (published state).

---

## 5. Technical Implementation & Idempotency Mechanics

The provisioning logic in `scripts/seed_pilot_demo_data.ts` uses idempotent SQL patterns:
1. **Existence Checks with Upsert Fallbacks:**
   - Existing users are matched by `email`. If present, their `password_hash`, `role`, and `is_verified` flags are updated in place, preventing stale credentials or password drift across test runs.
2. **Constraint Conflict Handling:**
   - Skills, student records, and memberships utilize `ON CONFLICT DO NOTHING` or explicit existence queries (`SELECT id FROM ... WHERE ... LIMIT 1`).
3. **Keyword Escaping:**
   - Columns matching PostgreSQL reserved identifiers (e.g. `"current_role"` in `alumni_profiles`) are safely quoted in raw SQL queries.
4. **Dynamic Driver Resolution:**
   - `resolveModule` automatically resolves `@neondatabase/serverless` and `bcryptjs` whether the script is invoked from the repository root, `/server`, or a child package directory.

---

## 6. Verification & Troubleshooting

### Verifying Seeded Credentials via cURL

To test authentication against the seeded database:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tpo@apex.edu",
    "password": "DemoPassword@123",
    "tenantSlug": "apex-institute"
  }'
```

**Expected Response (HTTP 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "...",
    "email": "tpo@apex.edu",
    "fullName": "Prof. Sunita Rao",
    "role": "tpo_admin",
    "tenantId": "..."
  }
}
```

### Common Issues & Remedies

| Issue | Root Cause | Solution |
|---|---|---|
| `DATABASE_URL or DATABASE_URL_UNPOOLED is required` | Environment variables not set. | Ensure `.env` or `server/.env` contains a valid Neon PostgreSQL connection string. |
| `Cannot find module '@neondatabase/serverless'` | Node dependencies uninstalled in server. | Run `npm install --prefix server`. |
| `ENOTFOUND` or DNS failure | Sandbox environment network restriction. | Seed against live DB in environment with outbound connectivity to Neon (`*.neon.tech`). |
| Duplicate key violation on re-run | Manual inserts bypassed idempotency logic. | Run `npm run db:seed:demo`, which handles updates cleanly. |
