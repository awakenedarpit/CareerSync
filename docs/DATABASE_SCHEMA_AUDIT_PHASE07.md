# CarrerSync Phase 07: Live Neon PostgreSQL Database Schema & Security Audit

**Document Reference**: `docs/DATABASE_SCHEMA_AUDIT_PHASE07.md`  
**Execution Timestamp**: 2026-11-15 02:20:00 UTC  
**Auditor**: Database Auditor (`@db-auditor`)  
**Target Environment**: Neon Serverless PostgreSQL (ap-southeast-1.aws.neon.tech)  
**Primary Database**: `neondb` (PostgreSQL 18.7)  
**Audit Tools**: `scripts/inspect_live_db.py`, `scripts/inspect_live_db.ts`, PostgreSQL System Catalogs (`information_schema`, `pg_catalog`, `pg_class`, `pg_policies`, `pg_type`, `pg_trigger`)

---

## 1. Executive Summary

A comprehensive, live catalog-level database discovery and security audit was executed against the active **Neon Serverless PostgreSQL** database for CarrerSync. 

The audit connected directly to Neon PostgreSQL using connection strings specified in `.env.local` to inspect system catalogs (`information_schema.tables`, `information_schema.columns`, `information_schema.table_constraints`, `pg_class`, `pg_indexes`, `pg_type`, `pg_policies`, `pg_trigger`, and `pg_extension`).

### Key Discovery Highlights:
1. **Live Tables**: Exactly **22 relational tables** exist in the `public` schema. All 21 domain tables currently contain **0 rows** (empty state), with exactly **1 row** in `alembic_version` referencing migration revision `fdf3af0b3748`.
2. **Column Volume**: A total of **207 columns** across all 22 tables.
3. **Foreign Keys & Cascades**: **44 foreign key relationships** are enforced. All tenant-scoped child entities enforce `ON DELETE CASCADE` referencing `tenants.id`.
4. **Indexes**: **85 indexes** (including 22 primary keys, 12 unique constraints, and 51 composite/single-column performance and tenancy indexes).
5. **CRITICAL FINDING — Row-Level Security (RLS) is 100% DISABLED**:
   - `rls_enabled`: `false` across **all 22 tables**.
   - `rls_forced`: `false` across **all 22 tables**.
   - Active RLS policies in `pg_policies`: **0 policies**.
   - Multi-tenant data segregation currently relies entirely on application-layer query filtering and index composite keys (`tenant_id`), creating a severe cross-tenant data leakage vulnerability if queries execute as the database connection owner (`neondb_owner`).
6. **CRITICAL FINDING — Severe Schema Drift Across 3 Layers**:
   - **Live DB vs Drizzle ORM (`server/src/db/schema.ts`)**:
     - **5 Missing Tables in Drizzle**: `agent_execution_logs`, `agent_workflows`, `learning_recommendations`, `placement_predictions`, and `skill_gap_analyses` exist in Live DB and SQLAlchemy but are completely omitted from Drizzle schema.
     - **1 Phantom Table in Drizzle**: `invitations` is defined in Drizzle ORM but does **not exist** in the live database or SQLAlchemy.
     - **Column Drift on `tenants`**: Drizzle defines 6 extra columns (`location`, `contact_email`, `contact_phone`, `status`, `is_suspended`, `settings`) that do **not exist** in the live database.
     - **Nullability Mismatch on `audit_events.tenant_id`**: Live DB strictly enforces `NOT NULL`, while Drizzle allows `null`.
   - **Custom Enums vs Varchar**:
     - The live PostgreSQL database contains **0 custom enum types** in `pg_type`/`pg_enum`.
     - In the live DB and SQLAlchemy, domain enums are stored as plain `character varying` (`varchar`) types.
     - In Drizzle (`server/src/db/schema.ts`), enums are declared as native PostgreSQL enums (`pgEnum`).
     - In `users.role`, the live database column is restricted to `character varying(19)`. Drizzle defines `userRoleEnum` including `'tpo_admin'`, whereas SQLAlchemy/Alembic omitted `'tpo_admin'` and generated uppercase symbols (`SUPERADMIN`).

---

## 2. Live Database Infrastructure & Catalog Metadata

| Attribute | Live Value | Notes / Significance |
| :--- | :--- | :--- |
| **Database Engine** | PostgreSQL 18.7 (a21afb5) on aarch64-linux | Neon Serverless PostgreSQL Compute |
| **Database Name** | `neondb` | Default Neon application database |
| **Connected Role** | `neondb_owner` | Superuser / DDL owner with bypass capabilities |
| **Host Region** | `ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech` | AWS Asia Pacific (Singapore) Neon Pooler |
| **Active Extensions** | `plpgsql` (v1.0) | Procedural language. `uuid-ossp` not needed (Postgres 13+ native `gen_random_uuid`) |
| **Alembic Version** | `fdf3af0b3748` | Matches `backend/alembic/versions/fdf3af0b3748_initial_schema.py` |
| **Total Physical Tables** | 22 | 21 application domain tables + 1 Alembic tracking table |
| **Total Live Rows** | 1 row | `alembic_version` has 1 row; all 21 application tables have 0 rows |
| **Total Database Size** | ~848 kB | Initial unpopulated catalog size |
| **RLS Status** | 0 / 22 enabled (0%) | 🚨 Immediate security remediation required |
| **Active Policies** | 0 | No tenant isolation policies active in database |
| **Triggers** | 0 | No auto-timestamp or audit triggers in database |

---

## 3. Complete Live Inventory (Summary Matrix of 22 Tables)

| # | Table Name | Type | Row Count | Physical Size | RLS Enabled | RLS Forced | PK Column(s) | FKs | Indexes |
| :- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| 1 | `academic_semesters` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 2 | 4 |
| 2 | `agent_execution_logs` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 2 | 3 |
| 3 | `agent_workflows` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 1 | 3 |
| 4 | `alembic_version` | BASE TABLE | 1 | 24 kB | ❌ False | ❌ False | `version_num` | 0 | 1 |
| 5 | `applications` | BASE TABLE | 0 | 48 kB | ❌ False | ❌ False | `id` | 4 | 6 |
| 6 | `audit_events` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 2 | 4 |
| 7 | `companies` | BASE TABLE | 0 | 24 kB | ❌ False | ❌ False | `id` | 0 | 2 |
| 8 | `evidence_records` | BASE TABLE | 0 | 48 kB | ❌ False | ❌ False | `id` | 4 | 5 |
| 9 | `interviews` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 2 | 3 |
| 10 | `job_requirements` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 2 | 4 |
| 11 | `job_roles` | BASE TABLE | 0 | 24 kB | ❌ False | ❌ False | `id` | 1 | 2 |
| 12 | `learning_recommendations` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 4 | 4 |
| 13 | `notifications` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 2 | 4 |
| 14 | `placement_drives` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 2 | 4 |
| 15 | `placement_predictions` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 3 | 4 |
| 16 | `skill_assessments` | BASE TABLE | 0 | 40 kB | ❌ False | ❌ False | `id` | 3 | 4 |
| 17 | `skill_gap_analyses` | BASE TABLE | 0 | 48 kB | ❌ False | ❌ False | `id` | 3 | 5 |
| 18 | `skills` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 0 | 3 |
| 19 | `student_skills` | BASE TABLE | 0 | 48 kB | ❌ False | ❌ False | `id` | 4 | 6 |
| 20 | `students` | BASE TABLE | 0 | 56 kB | ❌ False | ❌ False | `id` | 2 | 6 |
| 21 | `tenants` | BASE TABLE | 0 | 32 kB | ❌ False | ❌ False | `id` | 0 | 3 |
| 22 | `users` | BASE TABLE | 0 | 48 kB | ❌ False | ❌ False | `id` | 1 | 5 |

---

## 4. Detailed Table-by-Table Live Schema Specifications

Below is the verified schema for every table queried directly from PostgreSQL system catalogs.

### 4.1 Tenancy & Identity Module

#### `tenants`
*Core participating universities, colleges, or autonomous hiring entities.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (7)**:
  - `id`: `uuid` | `not null` | PK
  - `name`: `character varying(255)` | `not null` | Unique index `ix_tenants_name`
  - `slug`: `character varying(100)` | `not null` | Unique index `ix_tenants_slug`
  - `domain`: `character varying(255)` | nullable
  - `is_active`: `boolean` | `not null`
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys**: None (Root entity)
- **Indexes (3)**:
  - `tenants_pkey`: UNIQUE PK (`id`)
  - `ix_tenants_name`: UNIQUE (`name`)
  - `ix_tenants_slug`: UNIQUE (`slug`)
- **🚨 Schema Drift Alert**: Drizzle schema defines 6 additional columns (`location`, `contact_email`, `contact_phone`, `status`, `is_suspended`, `settings`) which **do not exist** in this live table.

#### `users`
*Platform actors and authentication credentials bound to tenant.*
- **Physical Size**: 48 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (10)**:
  - `id`: `uuid` | `not null` | PK
  - `email`: `character varying(255)` | `not null`
  - `password_hash`: `character varying(255)` | `not null`
  - `full_name`: `character varying(255)` | `not null`
  - `role`: `character varying(19)` | `not null` (Domain enum stored as varchar)
  - `is_active`: `boolean` | `not null`
  - `is_verified`: `boolean` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (1)**:
  - `users.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (5)**:
  - `users_pkey`: UNIQUE PK (`id`)
  - `uq_users_tenant_email`: UNIQUE (`tenant_id`, `email`)
  - `ix_users_tenant_role`: (`tenant_id`, `role`)
  - `ix_users_tenant_id`: (`tenant_id`)
  - `ix_users_email`: (`email`)

---

### 4.2 Student Profiles & Academics Module

#### `students`
*Extended student profile, enrollment, CGPA, and readiness metrics.*
- **Physical Size**: 56 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (14)**:
  - `id`: `uuid` | `not null` | PK
  - `user_id`: `uuid` | `not null` | FK -> `users.id` ON DELETE CASCADE (Unique)
  - `roll_number`: `character varying(50)` | `not null`
  - `department`: `character varying(100)` | `not null`
  - `batch_year`: `integer` | `not null`
  - `degree`: `character varying(50)` | `not null`
  - `cgpa`: `numeric(4, 2)` | `not null`
  - `backlog_count`: `integer` | `not null`
  - `date_of_birth`: `date` | nullable
  - `resume_r2_url`: `character varying(512)` | nullable
  - `readiness_score`: `numeric(5, 2)` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `students.user_id` -> `users.id` (ON DELETE CASCADE)
  - `students.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (6)**:
  - `students_pkey`: UNIQUE PK (`id`)
  - `students_user_id_key`: UNIQUE (`user_id`)
  - `uq_students_tenant_roll`: UNIQUE (`tenant_id`, `roll_number`)
  - `ix_students_tenant_batch_dept`: (`tenant_id`, `batch_year`, `department`)
  - `ix_students_tenant_cgpa`: (`tenant_id`, `cgpa`)
  - `ix_students_tenant_id`: (`tenant_id`)

#### `academic_semesters`
*Granular semester-by-semester academic progression (SGPA, credits, backlogs).*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (9)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `semester_number`: `integer` | `not null`
  - `sgpa`: `numeric(4, 2)` | `not null`
  - `credits_earned`: `numeric(5, 2)` | `not null`
  - `backlogs_in_semester`: `integer` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `academic_semesters.student_id` -> `students.id` (ON DELETE CASCADE)
  - `academic_semesters.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `academic_semesters_pkey`: UNIQUE PK (`id`)
  - `uq_semester_student_num`: UNIQUE (`student_id`, `semester_number`)
  - `ix_academic_semesters_student_id`: (`student_id`)
  - `ix_academic_semesters_tenant_id`: (`tenant_id`)

---

### 4.3 Skill Taxonomy & 5-Stage Verification Lifecycle Module

#### `skills`
*Global standardized skills taxonomy.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (7)**:
  - `id`: `uuid` | `not null` | PK
  - `name`: `character varying(150)` | `not null`
  - `canonical_slug`: `character varying(150)` | `not null`
  - `category`: `character varying(50)` | `not null`
  - `description`: `text` | nullable
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys**: None (Global shared master taxonomy)
- **Indexes (3)**:
  - `skills_pkey`: UNIQUE PK (`id`)
  - `ix_skills_canonical_slug`: UNIQUE (`canonical_slug`)
  - `ix_skills_name`: UNIQUE (`name`)

#### `student_skills`
*Tenant-scoped skill association enforcing the mandatory 5-stage verification lifecycle.*
- **Physical Size**: 48 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (12)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `skill_id`: `uuid` | `not null` | FK -> `skills.id` ON DELETE CASCADE
  - `state`: `character varying(50)` | `not null` (5-Stage lifecycle: Claimed, Observed, Evidence-linked, Verified, Expired)
  - `proficiency_level`: `character varying(50)` | `not null`
  - `confidence_score`: `numeric(3, 2)` | nullable
  - `verified_at`: `timestamp with time zone` | nullable
  - `verified_by_user_id`: `uuid` | nullable | FK -> `users.id` ON DELETE SET NULL
  - `expiry_date`: `timestamp with time zone` | nullable
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (4)**:
  - `student_skills.student_id` -> `students.id` (ON DELETE CASCADE)
  - `student_skills.skill_id` -> `skills.id` (ON DELETE CASCADE)
  - `student_skills.verified_by_user_id` -> `users.id` (ON DELETE SET NULL)
  - `student_skills.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (6)**:
  - `student_skills_pkey`: UNIQUE PK (`id`)
  - `uq_student_skills_student_skill`: UNIQUE (`student_id`, `skill_id`)
  - `ix_student_skills_tenant_state`: (`tenant_id`, `state`, `skill_id`)
  - `ix_student_skills_skill_id`: (`skill_id`)
  - `ix_student_skills_student_id`: (`student_id`)
  - `ix_student_skills_tenant_id`: (`tenant_id`)

#### `evidence_records`
*Verifiable artifacts and cryptographic/commit evidence supporting claimed skills.*
- **Physical Size**: 48 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (12)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `skill_id`: `uuid` | `not null` | FK -> `skills.id` ON DELETE CASCADE
  - `evidence_type`: `character varying(50)` | `not null`
  - `source_url`: `character varying(512)` | `not null`
  - `r2_storage_key`: `character varying(255)` | nullable
  - `metadata_json`: `json` | `not null`
  - `verification_status`: `character varying(50)` | `not null`
  - `validated_by`: `uuid` | nullable | FK -> `users.id` ON DELETE SET NULL
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (4)**:
  - `evidence_records.student_id` -> `students.id` (ON DELETE CASCADE)
  - `evidence_records.skill_id` -> `skills.id` (ON DELETE CASCADE)
  - `evidence_records.validated_by` -> `users.id` (ON DELETE SET NULL)
  - `evidence_records.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (5)**:
  - `evidence_records_pkey`: UNIQUE PK (`id`)
  - `ix_evidence_tenant_student_skill`: (`tenant_id`, `student_id`, `skill_id`)
  - `ix_evidence_records_skill_id`: (`skill_id`)
  - `ix_evidence_records_student_id`: (`student_id`)
  - `ix_evidence_records_tenant_id`: (`tenant_id`)

#### `skill_assessments`
*Evaluations, quizzes, and proctored coding assessments.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (11)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `skill_id`: `uuid` | `not null` | FK -> `skills.id` ON DELETE CASCADE
  - `assessment_name`: `character varying(255)` | `not null`
  - `score`: `numeric(5, 2)` | `not null`
  - `max_score`: `numeric(5, 2)` | `not null`
  - `evaluation_metrics`: `json` | nullable
  - `completed_at`: `timestamp with time zone` | nullable
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (3)**:
  - `skill_assessments.student_id` -> `students.id` (ON DELETE CASCADE)
  - `skill_assessments.skill_id` -> `skills.id` (ON DELETE CASCADE)
  - `skill_assessments.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `skill_assessments_pkey`: UNIQUE PK (`id`)
  - `ix_skill_assessments_skill_id`: (`skill_id`)
  - `ix_skill_assessments_student_id`: (`student_id`)
  - `ix_skill_assessments_tenant_id`: (`tenant_id`)

---

### 4.4 Industry Demand & Placement Orchestration Module

#### `companies`
*Recruiting partners and enterprise hiring entities.*
- **Physical Size**: 24 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (6)**:
  - `id`: `uuid` | `not null` | PK
  - `name`: `character varying(255)` | `not null`
  - `industry_domain`: `character varying(150)` | nullable
  - `website`: `character varying(512)` | nullable
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys**: None (Master employer registry)
- **Indexes (2)**:
  - `companies_pkey`: UNIQUE PK (`id`)
  - `ix_companies_name`: UNIQUE (`name`)

#### `job_roles`
*Specific open positions offered by companies.*
- **Physical Size**: 24 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (8)**:
  - `id`: `uuid` | `not null` | PK
  - `company_id`: `uuid` | `not null` | FK -> `companies.id` ON DELETE CASCADE
  - `title`: `character varying(255)` | `not null`
  - `description`: `text` | `not null`
  - `experience_level`: `character varying(50)` | `not null`
  - `ctc_lpa`: `numeric(6, 2)` | nullable
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (1)**:
  - `job_roles.company_id` -> `companies.id` (ON DELETE CASCADE)
- **Indexes (2)**:
  - `job_roles_pkey`: UNIQUE PK (`id`)
  - `ix_job_roles_company_id`: (`company_id`)

#### `job_requirements`
*Skill criteria mapping skills to specific job roles.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (8)**:
  - `id`: `uuid` | `not null` | PK
  - `job_role_id`: `uuid` | `not null` | FK -> `job_roles.id` ON DELETE CASCADE
  - `skill_id`: `uuid` | `not null` | FK -> `skills.id` ON DELETE CASCADE
  - `is_mandatory`: `boolean` | `not null`
  - `min_proficiency`: `character varying(50)` | `not null`
  - `weight`: `numeric(3, 2)` | `not null`
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `job_requirements.job_role_id` -> `job_roles.id` (ON DELETE CASCADE)
  - `job_requirements.skill_id` -> `skills.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `job_requirements_pkey`: UNIQUE PK (`id`)
  - `uq_job_req_role_skill`: UNIQUE (`job_role_id`, `skill_id`)
  - `ix_job_requirements_job_role_id`: (`job_role_id`)
  - `ix_job_requirements_skill_id`: (`skill_id`)

#### `placement_drives`
*Institutional hiring events with deterministic eligibility rules.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (13)**:
  - `id`: `uuid` | `not null` | PK
  - `job_role_id`: `uuid` | `not null` | FK -> `job_roles.id` ON DELETE CASCADE
  - `batch_year`: `integer` | `not null`
  - `min_cgpa`: `numeric(4, 2)` | `not null`
  - `max_backlogs_allowed`: `integer` | `not null`
  - `eligible_departments`: `json` | `not null`
  - `registration_start`: `timestamp with time zone` | `not null`
  - `registration_end`: `timestamp with time zone` | `not null`
  - `drive_date`: `timestamp with time zone` | `not null`
  - `status`: `character varying(50)` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `placement_drives.job_role_id` -> `job_roles.id` (ON DELETE CASCADE)
  - `placement_drives.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `placement_drives_pkey`: UNIQUE PK (`id`)
  - `ix_drives_tenant_status_batch`: (`tenant_id`, `status`, `batch_year`)
  - `ix_placement_drives_job_role_id`: (`job_role_id`)
  - `ix_placement_drives_tenant_id`: (`tenant_id`)

#### `applications`
*Student applications for placement drives with human decision audit.*
- **Physical Size**: 48 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (8)**:
  - `id`: `uuid` | `not null` | PK
  - `drive_id`: `uuid` | `not null` | FK -> `placement_drives.id` ON DELETE CASCADE
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `status`: `character varying(50)` | `not null`
  - `final_decision_by`: `uuid` | nullable | FK -> `users.id` ON DELETE SET NULL
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (4)**:
  - `applications.drive_id` -> `placement_drives.id` (ON DELETE CASCADE)
  - `applications.student_id` -> `students.id` (ON DELETE CASCADE)
  - `applications.final_decision_by` -> `users.id` (ON DELETE SET NULL)
  - `applications.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (6)**:
  - `applications_pkey`: UNIQUE PK (`id`)
  - `uq_applications_drive_student`: UNIQUE (`drive_id`, `student_id`)
  - `ix_applications_tenant_status`: (`tenant_id`, `status`, `drive_id`)
  - `ix_applications_drive_id`: (`drive_id`)
  - `ix_applications_student_id`: (`student_id`)
  - `ix_applications_tenant_id`: (`tenant_id`)

#### `interviews`
*Interview stages and progression tracking.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (10)**:
  - `id`: `uuid` | `not null` | PK
  - `application_id`: `uuid` | `not null` | FK -> `applications.id` ON DELETE CASCADE
  - `round_number`: `integer` | `not null`
  - `round_type`: `character varying(50)` | `not null`
  - `scheduled_at`: `timestamp with time zone` | `not null`
  - `status`: `character varying(50)` | `not null`
  - `interviewer_feedback`: `text` | nullable
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `interviews.application_id` -> `applications.id` (ON DELETE CASCADE)
  - `interviews.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (3)**:
  - `interviews_pkey`: UNIQUE PK (`id`)
  - `ix_interviews_application_id`: (`application_id`)
  - `ix_interviews_tenant_id`: (`tenant_id`)

---

### 4.5 AI Agent Intelligence & Analytics Module

#### `skill_gap_analyses`
*Semantic and deterministic gap evaluations between student skills and job requirements.*
- **Physical Size**: 48 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (10)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `job_role_id`: `uuid` | `not null` | FK -> `job_roles.id` ON DELETE CASCADE
  - `match_percentage`: `numeric(5, 2)` | `not null`
  - `missing_skills_json`: `json` | `not null`
  - `matching_skills_json`: `json` | `not null`
  - `analysis_mode`: `character varying(50)` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (3)**:
  - `skill_gap_analyses.student_id` -> `students.id` (ON DELETE CASCADE)
  - `skill_gap_analyses.job_role_id` -> `job_roles.id` (ON DELETE CASCADE)
  - `skill_gap_analyses.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (5)**:
  - `skill_gap_analyses_pkey`: UNIQUE PK (`id`)
  - `ix_gap_analysis_tenant_student_role`: (`tenant_id`, `student_id`, `job_role_id`)
  - `ix_skill_gap_analyses_job_role_id`: (`job_role_id`)
  - `ix_skill_gap_analyses_student_id`: (`student_id`)
  - `ix_skill_gap_analyses_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: Present in Live DB & SQLAlchemy, **MISSING from Drizzle schema**.

#### `placement_predictions`
*Probabilistic machine learning / agent predictions of placement success.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (10)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `drive_id`: `uuid` | `not null` | FK -> `placement_drives.id` ON DELETE CASCADE
  - `probability_score`: `numeric(5, 4)` | `not null`
  - `risk_tier`: `character varying(50)` | `not null`
  - `contributing_factors_json`: `json` | `not null`
  - `is_advisory_only`: `boolean` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (3)**:
  - `placement_predictions.student_id` -> `students.id` (ON DELETE CASCADE)
  - `placement_predictions.drive_id` -> `placement_drives.id` (ON DELETE CASCADE)
  - `placement_predictions.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `placement_predictions_pkey`: UNIQUE PK (`id`)
  - `ix_predictions_tenant_student`: (`tenant_id`, `student_id`)
  - `ix_placement_predictions_student_id`: (`student_id`)
  - `ix_placement_predictions_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: Present in Live DB & SQLAlchemy, **MISSING from Drizzle schema**.

#### `learning_recommendations`
*Personalized remediation roadmap actions to close identified skill gaps.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (12)**:
  - `id`: `uuid` | `not null` | PK
  - `student_id`: `uuid` | `not null` | FK -> `students.id` ON DELETE CASCADE
  - `skill_id`: `uuid` | `not null` | FK -> `skills.id` ON DELETE CASCADE
  - `target_role_id`: `uuid` | nullable | FK -> `job_roles.id` ON DELETE SET NULL
  - `title`: `character varying(255)` | `not null`
  - `action_type`: `character varying(50)` | `not null`
  - `description`: `text` | nullable
  - `estimated_hours`: `integer` | nullable
  - `is_completed`: `boolean` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (4)**:
  - `learning_recommendations.student_id` -> `students.id` (ON DELETE CASCADE)
  - `learning_recommendations.skill_id` -> `skills.id` (ON DELETE CASCADE)
  - `learning_recommendations.target_role_id` -> `job_roles.id` (ON DELETE SET NULL)
  - `learning_recommendations.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `learning_recommendations_pkey`: UNIQUE PK (`id`)
  - `ix_learning_recommendations_skill_id`: (`skill_id`)
  - `ix_learning_recommendations_student_id`: (`student_id`)
  - `ix_learning_recommendations_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: Present in Live DB & SQLAlchemy, **MISSING from Drizzle schema**.

#### `agent_execution_logs`
*Observability audit trail tracking AI agent executions, token usage, latency, and fallbacks.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (11)**:
  - `id`: `uuid` | `not null` | PK
  - `agent_type`: `character varying(50)` | `not null`
  - `triggered_by`: `uuid` | nullable | FK -> `users.id` ON DELETE SET NULL
  - `execution_mode`: `character varying(50)` | `not null`
  - `input_payload_digest`: `character varying(64)` | nullable
  - `tokens_consumed`: `integer` | `not null`
  - `latency_ms`: `integer` | `not null`
  - `status`: `character varying(50)` | `not null`
  - `error_message`: `text` | nullable
  - `executed_at`: `timestamp with time zone` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
- **Foreign Keys (2)**:
  - `agent_execution_logs.triggered_by` -> `users.id` (ON DELETE SET NULL)
  - `agent_execution_logs.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (3)**:
  - `agent_execution_logs_pkey`: UNIQUE PK (`id`)
  - `ix_agent_logs_tenant_type_status`: (`tenant_id`, `agent_type`, `status`)
  - `ix_agent_execution_logs_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: Present in Live DB & SQLAlchemy, **MISSING from Drizzle schema**.

#### `agent_workflows`
*State machine tracking multi-agent background workflows.*
- **Physical Size**: 32 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (9)**:
  - `id`: `uuid` | `not null` | PK
  - `workflow_name`: `character varying(150)` | `not null`
  - `target_entity_type`: `character varying(50)` | `not null`
  - `target_entity_id`: `uuid` | `not null`
  - `current_stage`: `character varying(100)` | `not null`
  - `state_history`: `json` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (1)**:
  - `agent_workflows.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (3)**:
  - `agent_workflows_pkey`: UNIQUE PK (`id`)
  - `ix_workflows_tenant_entity`: (`tenant_id`, `target_entity_type`, `target_entity_id`)
  - `ix_agent_workflows_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: Present in Live DB & SQLAlchemy, **MISSING from Drizzle schema**.

---

### 4.6 Compliance, Notifications & Migrations Module

#### `audit_events`
*Immutable, tamper-evident security audit log.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (10)**:
  - `id`: `uuid` | `not null` | PK
  - `actor_id`: `uuid` | nullable | FK -> `users.id` ON DELETE SET NULL
  - `actor_email`: `character varying(255)` | nullable
  - `action`: `character varying(100)` | `not null`
  - `resource_type`: `character varying(100)` | `not null`
  - `resource_id`: `character varying(255)` | nullable
  - `changes_diff`: `json` | `not null`
  - `ip_address`: `character varying(45)` | nullable
  - `timestamp`: `timestamp with time zone` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
- **Foreign Keys (2)**:
  - `audit_events.actor_id` -> `users.id` (ON DELETE SET NULL)
  - `audit_events.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `audit_events_pkey`: UNIQUE PK (`id`)
  - `ix_audit_tenant_action`: (`tenant_id`, `action`)
  - `ix_audit_tenant_timestamp`: (`tenant_id`, `timestamp`)
  - `ix_audit_events_tenant_id`: (`tenant_id`)
- **🚨 Schema Drift Alert**: In the Live DB, `tenant_id` is strictly `NOT NULL`. In Drizzle, `tenantId` is declared without `.notNull()` (allowing nulls).

#### `notifications`
*User-facing notification and event alert dispatch queue.*
- **Physical Size**: 40 kB | **Rows**: 0 | **RLS**: Disabled
- **Columns (9)**:
  - `id`: `uuid` | `not null` | PK
  - `recipient_user_id`: `uuid` | `not null` | FK -> `users.id` ON DELETE CASCADE
  - `title`: `character varying(255)` | `not null`
  - `message`: `text` | `not null`
  - `type`: `character varying(50)` | `not null`
  - `is_read`: `boolean` | `not null`
  - `tenant_id`: `uuid` | `not null` | FK -> `tenants.id` ON DELETE CASCADE
  - `created_at`: `timestamp with time zone` | `not null`
  - `updated_at`: `timestamp with time zone` | `not null`
- **Foreign Keys (2)**:
  - `notifications.recipient_user_id` -> `users.id` (ON DELETE CASCADE)
  - `notifications.tenant_id` -> `tenants.id` (ON DELETE CASCADE)
- **Indexes (4)**:
  - `notifications_pkey`: UNIQUE PK (`id`)
  - `ix_notifications_tenant_recipient`: (`tenant_id`, `recipient_user_id`, `is_read`)
  - `ix_notifications_recipient_user_id`: (`recipient_user_id`)
  - `ix_notifications_tenant_id`: (`tenant_id`)

#### `alembic_version`
*Database migration version tracking table.*
- **Physical Size**: 24 kB | **Rows**: 1 | **RLS**: Disabled
- **Columns (1)**:
  - `version_num`: `character varying(32)` | `not null` | PK
- **Value**: `'fdf3af0b3748'`

---

## 5. Custom Enums vs. Varchar Storage Deep Dive

### 5.1 System Catalog Query Result (`pg_type` & `pg_enum`)
Query executed:
```sql
SELECT t.typname, array_agg(e.enumlabel)
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname;
```
**Result**: `0 rows returned`. There are **no native PostgreSQL enum types** registered in the database.

### 5.2 Root Cause Analysis
In Alembic migration `backend/alembic/versions/fdf3af0b3748_initial_schema.py`:
```python
sa.Column('role', sa.Enum('SUPERADMIN', 'COLLEGE_ADMIN', 'FACULTY_COORDINATOR', 'RECRUITER', 'STUDENT', name='user_role_enum', native_enum=False), nullable=False)
```
Because `native_enum=False` was passed, SQLAlchemy emitted:
- A `VARCHAR(19)` column for `users.role` (19 is `len("FACULTY_COORDINATOR")`).
- A `VARCHAR(50)` column for all other enums (`category`, `state`, `proficiency_level`, `evidence_type`, etc.).
- Furthermore, no `CHECK (role IN (...))` check constraints were created on the table in PostgreSQL!

### 5.3 Three-Way Enum Discrepancy Matrix

| Domain Enum | Live DB Column Type | SQLAlchemy Enum Definition | Drizzle Enum Definition (`server/src/db/schema.ts`) | Discrepancy / Risk |
| :--- | :--- | :--- | :--- | :--- |
| `user_role_enum` | `varchar(19)` | `UserRole` (5 values: `superadmin`, `college_admin`, `faculty_coordinator`, `recruiter`, `student`) | `userRoleEnum` (6 values: includes `'tpo_admin'`) | 🚨 `'tpo_admin'` is valid in Drizzle but absent in SQLAlchemy. Drizzle expects native `user_role_enum`. |
| `skill_category_enum` | `varchar(50)` | `SkillCategory` (7 lowercase values) | `skillCategoryEnum` (7 lowercase values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `skill_state_enum` | `varchar(50)` | `SkillState` (`Claimed`, `Observed`, `Evidence-linked`, `Verified`, `Expired`) | `skillStateEnum` (`Claimed`, `Observed`, `Evidence-linked`, `Verified`, `Expired`) | Exact match in casing, but Live DB is `varchar(50)`. |
| `proficiency_level_enum` | `varchar(50)` | `ProficiencyLevel` (4 values) | `proficiencyLevelEnum` (4 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `evidence_type_enum` | `varchar(50)` | `EvidenceType` (6 values) | `evidenceTypeEnum` (6 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `verification_status_enum`| `varchar(50)` | `VerificationStatus` (3 values) | `verificationStatusEnum` (3 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `drive_status_enum` | `varchar(50)` | `DriveStatus` (5 values) | `driveStatusEnum` (5 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `application_status_enum` | `varchar(50)` | `ApplicationStatus` (7 values) | `applicationStatusEnum` (7 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `round_type_enum` | `varchar(50)` | `InterviewRoundType` (5 values) | `interviewRoundTypeEnum` (5 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `interview_status_enum` | `varchar(50)` | `InterviewStatus` (4 values) | `interviewStatusEnum` (4 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `notification_type_enum` | `varchar(50)` | `NotificationType` (5 values) | `notificationTypeEnum` (5 values) | Live DB is `varchar(50)`. Drizzle expects native enum type. |
| `invitation_status_enum` | N/A (Table missing) | None (Model missing) | `invitationStatusEnum` (4 values) | Table and model do not exist in live DB. |

---

## 6. Row-Level Security (RLS) & Multi-Tenant Isolation Audit

### 6.1 Current Security Posture
PostgreSQL catalog verification via `pg_class.relrowsecurity` and `pg_policies`:
- **Tables with RLS Enabled**: **0 / 22 (0%)**
- **Tables with RLS Forced**: **0 / 22 (0%)**
- **Registered Policies in `pg_policies`**: **0**

### 6.2 Vulnerability Assessment
1. **Tenant Isolation Breach Risk**:
   - The platform relies on a single shared PostgreSQL database (`neondb`) with pooled connections (`neondb_owner`).
   - If an API route or background agent queries `students`, `applications`, or `audit_events` without explicitly appending `WHERE tenant_id = :current_tenant_id`, the database returns data across **all colleges and tenants**.
   - `neondb_owner` possesses superuser-like table ownership. Without `ALTER TABLE ... FORCE ROW LEVEL SECURITY;`, even table owners bypass RLS when acting as normal session roles.
2. **Express Server Context Readiness**:
   - In `server/src/db/client.ts`, the helper `withTenantContext()` is already implemented:
     ```typescript
     await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
     ```
   - However, because **no RLS policies exist** in the live database, `set_config('app.current_tenant_id', ...)` currently has **zero security effect**!

### 6.3 Required Remediation SQL DDL
To achieve true ₹0 zero-trust multi-tenancy, every tenant-scoped table must execute:
```sql
-- 1. Enable and Force RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

-- 2. Apply Tenant Isolation Policy
CREATE POLICY tenant_isolation_policy ON students
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_superadmin', true), 'false')::boolean = true
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR NULLIF(current_setting('app.is_superadmin', true), 'false')::boolean = true
  );
```
*(This must be applied across all 18 tenant-scoped tables listed in Section 7).*

---

## 7. Schema Drift Analysis: 3-Way Reconciliation Matrix

### 7.1 Table-Level Reconciliation

| Table Name | Live Database | Drizzle Schema (`server/src/db/schema.ts`) | SQLAlchemy (`backend/src/models/`) | Reconciliation Action Required |
| :--- | :---: | :---: | :---: | :--- |
| `academic_semesters` | ✅ | ✅ | ✅ | Synchronized. |
| `agent_execution_logs` | ✅ | ❌ **Missing** | ✅ | **Add table to Drizzle schema**. |
| `agent_workflows` | ✅ | ❌ **Missing** | ✅ | **Add table to Drizzle schema**. |
| `alembic_version` | ✅ | ❌ | ❌ | Expected internal migration metadata. |
| `applications` | ✅ | ✅ | ✅ | Synchronized. |
| `audit_events` | ✅ | ✅ | ✅ | Reconcile `tenant_id` nullability. |
| `companies` | ✅ | ✅ | ✅ | Synchronized. |
| `evidence_records` | ✅ | ✅ | ✅ | Synchronized. |
| `interviews` | ✅ | ✅ | ✅ | Synchronized. |
| `invitations` | ❌ **Missing** | ✅ **Present** | ❌ **Missing** | **Run migration to create in Live DB** & add model to SQLAlchemy. |
| `job_requirements` | ✅ | ✅ | ✅ | Synchronized. |
| `job_roles` | ✅ | ✅ | ✅ | Synchronized. |
| `learning_recommendations` | ✅ | ❌ **Missing** | ✅ | **Add table to Drizzle schema**. |
| `notifications` | ✅ | ✅ | ✅ | Synchronized. |
| `placement_drives` | ✅ | ✅ | ✅ | Synchronized. |
| `placement_predictions` | ✅ | ❌ **Missing** | ✅ | **Add table to Drizzle schema**. |
| `skill_assessments` | ✅ | ✅ | ✅ | Synchronized. |
| `skill_gap_analyses` | ✅ | ❌ **Missing** | ✅ | **Add table to Drizzle schema**. |
| `skills` | ✅ | ✅ | ✅ | Synchronized. |
| `student_skills` | ✅ | ✅ | ✅ | Synchronized. |
| `students` | ✅ | ✅ | ✅ | Synchronized. |
| `tenants` | ✅ | ⚠️ **Extra Cols** | ✅ | **Run migration to add 6 missing columns** to Live DB & SQLAlchemy. |
| `users` | ✅ | ✅ | ✅ | Synchronized (reconcile `role` enum type). |

### 7.2 Column-Level Reconciliation

1. **`tenants` Table**:
   - **Live DB & SQLAlchemy**: `id`, `name`, `slug`, `domain`, `is_active`, `created_at`, `updated_at`.
   - **Drizzle**: Defines 6 additional columns:
     - `location`: `varchar(255)`
     - `contact_email`: `varchar(255)`
     - `contact_phone`: `varchar(50)`
     - `status`: `varchar(50)` default `'active'`
     - `is_suspended`: `boolean` default `false`
     - `settings`: `jsonb` default `{}`
   - **Impact**: Any Express / Drizzle query selecting `schema.tenants` will fail with: `column tenants.location does not exist`!
   - **Fix**: Apply a PostgreSQL DDL migration to add these 6 columns to `tenants` with appropriate defaults.

2. **`audit_events.tenant_id`**:
   - **Live DB**: `tenant_id` is `NOT NULL`.
   - **Drizzle**: Declares `tenantId: uuid('tenant_id').references(...)` (nullable).
   - **Impact**: Superadmin or system-level audit events cannot insert `tenant_id = null` into the live DB without triggering a constraint violation.
   - **Fix**: Either make `audit_events.tenant_id` nullable in PostgreSQL via `ALTER TABLE audit_events ALTER COLUMN tenant_id DROP NOT NULL;`, or enforce a root platform tenant UUID for all system events.

3. **Database-Level Defaults (`DEFAULT` expressions)**:
   - **Live DB**: Exactly **0 columns** have PostgreSQL `DEFAULT` expressions!
     - `id` has no `DEFAULT gen_random_uuid()`
     - `created_at` has no `DEFAULT now()`
     - `is_active` has no `DEFAULT true`
   - **Reason**: SQLAlchemy used client-side defaults (`default=uuid.uuid4`) rather than `server_default=sa.text('gen_random_uuid()')`.
   - **Impact**: If raw SQL inserts or external services insert rows without supplying `id` or `created_at`, the insert fails. Drizzle relies partly on `defaultRandom()` and `defaultNow()` which it expects in the DB or generates client-side.
   - **Fix**: Add `server_default` constraints to the live database for `id` (`gen_random_uuid()`), `created_at` (`now()`), `updated_at` (`now()`), and boolean flags.

---

## 8. Actionable Reconciliation Roadmap for Swarm Colleagues

### 8.1 For `@drizzle-security-reconciler`
1. **Add the 5 Missing Tables to `server/src/db/schema.ts`**:
   - `agent_execution_logs`
   - `agent_workflows`
   - `learning_recommendations`
   - `placement_predictions`
   - `skill_gap_analyses`
   *(Ensure table definitions match live DB column types and foreign key constraints).*
2. **Reconcile Enum Typing in Drizzle**:
   - Because the live PostgreSQL database uses `varchar(50)` (and `varchar(19)` for `users.role`), determine whether to:
     - **Option A (Recommended)**: Run a DDL migration script to create PostgreSQL native types (`CREATE TYPE user_role_enum AS ENUM (...)`) and alter table columns using `TYPE user_role_enum USING role::user_role_enum`.
     - **Option B**: Change Drizzle column definitions from `userRoleEnum('role')` to `varchar('role', { length: 50 })` with TS union types.
3. **Handle `invitations` Table**:
   - Create and execute a migration to add the `invitations` table to the live Neon database so that invitation flows function in production.
4. **Fix `audit_events.tenant_id` Nullability**:
   - Match Drizzle's definition or update the live DB column definition.

### 8.2 For `@auth-security-verifier`
1. **Deploy Row-Level Security (RLS) DDL Migration**:
   - Execute an idempotent SQL migration that enables and forces RLS on all 18 tenant-scoped tables:
     `academic_semesters`, `agent_execution_logs`, `agent_workflows`, `applications`, `audit_events`, `evidence_records`, `interviews`, `invitations` (once created), `job_requirements`, `learning_recommendations`, `notifications`, `placement_drives`, `placement_predictions`, `skill_assessments`, `skill_gap_analyses`, `student_skills`, `students`, `users`.
   - Create RLS policies binding queries to `current_setting('app.current_tenant_id', true)::uuid`.
2. **Verify Express & FastAPI Tenant Middleware**:
   - Verify that all database transactions execute `SELECT set_config('app.current_tenant_id', :tenant_id, true)`.
3. **Test Superadmin Provisioning**:
   - Run `scripts/provision_superadmin.py` or `.ts` and ensure platform root tenant creation succeeds without column mismatch errors.

### 8.3 For `@coordinator`
- Audit milestone complete. The live PostgreSQL state on Neon is thoroughly inventoried and documented in `docs/DATABASE_SCHEMA_AUDIT_PHASE07.md`.
- Both TypeScript (`scripts/inspect_live_db.ts`) and Python (`scripts/inspect_live_db.py`) inspection utilities are in place for automated CI/CD and verification.
- Handing off to `@drizzle-security-reconciler` and `@auth-security-verifier` to execute the schema synchronization and RLS activation.
