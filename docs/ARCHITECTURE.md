# CarrerSync System Architecture Specification

> **Document Type**: Canonical System Architecture & Engineering Specification  
> **Status**: APPROVED & CANONICAL  
> **Target Release**: Phase 06 Backend Migration (Node.js + Express + Neon PostgreSQL + Drizzle ORM + Render Deployment)  
> **Master Policy**: Strict ₹0 Zero-Cost Architecture | Zero Data Loss Guarantee  

---

## 1. Executive Summary & Core Mission

**CarrerSync** is an enterprise-grade **Agentic Placement Intelligence Platform** engineered to modernize collegiate campus hiring. It bridges the gap between student evidence, certified skills, industry demand, and campus recruitment workflows.

Traditional placements rely on unverified resumes, arbitrary GPA cutoffs, and spreadsheet chaos. CarrerSync establishes an **evidence-driven, verifiable competency pipeline**:

```
Student Evidence (GitHub Repositories, PRs, Commits, R2 Artifacts)
       │
       ▼
5-Stage Skill Verification Lifecycle (Claimed → Observed → Evidence-linked → Verified → Expired)
       │
       ▼
Deterministic & Hybrid Skill-Gap Benchmarking (Target Role Demands vs. Verified Competencies)
       │
       ▼
Personalized Remediation Learning Paths (Milestones, Curated Tasks & Assessments)
       │
       ▼
Multi-Tenant Campus Placement Drive Orchestration (Deterministic Eligibility & Human Decision Audit)
```

---

## 2. High-Level System Architecture

CarrerSync deploys an enterprise-grade, zero-cost architecture featuring an active **Node.js + Express** REST API tier (hosted on **Render Free Tier** with dynamic `$PORT` binding and graceful shutdown), **Neon Serverless PostgreSQL** as the single canonical source of truth, **Drizzle ORM** for type-safe database queries, and a standby **Cloudflare Workers** edge runtime temporarily retained per Section 14 for dual-engine validation and instant rollback.

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (React 19 + Vite SPA)"]
        SPA["Vite Single Page Application\n(Tailwind CSS v4 + React Router v7)"]
        SP1["Student Intelligence Portal\n(10 Pages + Cytoscape.js Graph)"]
        SP2["T&P Admin Command Center\n(13 Pages + Cohort Analytics)"]
        SP3["Recruiter Talent Portal\n(9 Pages + Candidate Discovery)"]
        SPA --- SP1
        SPA --- SP2
        SPA --- SP3
    end

    subgraph ActiveBackendTier["Active Backend Tier (Node.js + Express on Render)"]
        ExpressApp["Express.js v5 REST API (/api/v1)\n(Dynamic $PORT Binding & Graceful Shutdown)"]
        MW1["CORS & Request Logger"]
        MW2["Tenant Isolation Middleware\n(Anti-Spoofing & UUID Validator)"]
        MW3["JWT Auth & RBAC Middleware\n(Role Enforcement & Token Claims)"]
        
        ExpressApp --> MW1 --> MW2 --> MW3
    end

    subgraph StandbyEdgeTier["Standby Edge Tier (Cloudflare Workers - Section 14)"]
        CFWorkers["Cloudflare Workers + Hono\n(112/112 Parity Standby Engine)"]
    end

    subgraph ObjectStorageTier["Object Storage & Proofs"]
        R2["Cloudflare R2 Object Storage\n(Resumes, Code Artifacts, Proofs)"]
    end

    subgraph PersistenceTier["Canonical Persistence Tier"]
        NeonDB[("Neon PostgreSQL Serverless\n(16 Normalized Relational Tables\nPostgreSQL RLS Dual-Layer Security)")]
        NeonAuth["Neon Auth / Better Auth\n(neon_auth Schema & Session Mgmt)"]
        NeonDB --- NeonAuth
    end

    subgraph AIEngineTier["Hybrid AI & Rule Fallback Tier"]
        AI["Hybrid Agentic Engine\n(Gemini Free API + Edge AI)"]
        RuleEngine["Deterministic Rule Engines\n(Offline AST Parsers, Scoring Formulas)"]
    end

    SPA -->|HTTPS / REST API /api/v1| ExpressApp
    SPA -.->|Rollback Target| CFWorkers
    MW3 -->|Drizzle ORM + Connection Caching| NeonDB
    CFWorkers -.->|Drizzle ORM| NeonDB
    MW3 -->|S3 API| R2
    MW3 -->|Async Evaluation| AI
    AI -.->|Fallback on Quota/Offline| RuleEngine
```

---

## 3. Technology Stack & Zero-Cost Architecture Policy

The platform strictly adheres to a **₹0 operational budget** utilizing enterprise-grade open-source tools and perpetual free tiers. Core platform operations (authentication, eligibility evaluation, student records, audit logs) **never** depend on paid third-party APIs.

| Architectural Layer | Technology | Version / Spec | Free Tier Strategy & Operational Rationale | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Active Backend Compute** | Node.js + Express | Node v20+/v24+, Express v5 | Render Free Tier Web Service: 512 MB RAM, dynamic `$PORT` binding, auto-sleep, zero hosting costs | **₹0** |
| **Standby Edge Compute** | Cloudflare Workers | V8 Isolates / Hono v4 | Standby / comparison runtime per Section 14 (100k req/day free, 0ms cold starts) | **₹0** |
| **API Web Framework** | Express.js / Hono | Express v5.1.0 / Hono v4.7.2 | Standard enterprise Node.js HTTP pipeline with full Vitest test parity (112/112 tests) | **₹0** |
| **Frontend Framework** | React 19 + Vite | React 19.x, Vite 6.x | Static SPA hosted on Vercel Hobby / Cloudflare Pages with CDN edge caching | **₹0** |
| **Styling & Icons** | Tailwind CSS v4, Lucide | v4.0.0, Lucide-React | Zero-runtime CSS extraction, consistent institutional light theme tokens | **₹0** |
| **Canonical Database** | Neon PostgreSQL | Serverless v16 | Single source of truth: 0.5 GB storage, auto-suspend, zero-cost pooling | **₹0** |
| **Data Access / ORM** | Drizzle ORM | v0.38.4 | Zero-overhead SQL generation, TypeScript safety, `@neondatabase/serverless` | **₹0** |
| **Database Migrations** | Alembic / Drizzle Kit | Python / Node | Version-controlled async migrations and bidirectional rollback testing | **₹0** |
| **Authentication & RBAC** | Neon Auth / Better Auth | JWT (HS256) + bcrypt | Stateless JWT, bcrypt salt rounds 10, multi-tenant RBAC role guards | **₹0** |
| **Object Storage** | Cloudflare R2 | S3-Compatible API | 10 GB storage free, 1M Class A operations/month, zero egress bandwidth fees | **₹0** |
| **Graph Visualization** | Cytoscape.js | v3.30+ | Client-side interactive knowledge graph rendering with CoSE layout | **₹0** |
| **AI Intelligence** | Hybrid Engine | Gemini API + Rules | Deterministic fallback ensures 100% platform availability with zero paid API | **₹0** |

---

## 4. Active Node.js + Express Backend Architecture (`server/`)

### 4.1 Enterprise Express Engine & Lifecycle Management
The primary backend engine resides in `server/` and provides an enterprise-ready, maintainable, and inspectable Node.js + Express foundation:
- **Runtime**: Node.js LTS v20+ / v24+ with TypeScript execution via `tsx`.
- **Dynamic Port Binding**: Honors Render's injected `$PORT` environment variable, defaulting locally to port `5000`:
  ```typescript
  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, '0.0.0.0', () => { ... });
  ```
- **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` signals, closes active HTTP keep-alive connections cleanly within a 10-second timeout, and releases database client handles.
- **Health Probing**: Exposes `/health`, `/api/health`, and `/api/v1/health` endpoints returning server timestamp, version, and database connectivity state.

### 4.2 Database Access & RLS Context Binding
Direct database operations use Drizzle ORM with the `@neondatabase/serverless` client:
1. **Connection Caching**: The pool factory in `server/src/db/client.ts` caches driver instances across requests.
2. **Protocol Normalization**: Normalizes incoming connection strings (e.g., automatically handling `postgresql+asyncpg://` or `postgres://` prefixes).
3. **Transaction-Scoped RLS Helper**:
   ```typescript
   export async function withTenantContext<T>(
     tenantId: string,
     callback: (tx: any) => Promise<T>
   ): Promise<T> {
     return db.transaction(async (tx) => {
       await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
       return callback(tx);
     });
   }
   ```

### 4.3 Defense-in-Depth Middleware Pipeline
1. **CORS & Logger**: Permissive origin header validation and console request tracing (`METHOD PATH STATUS - TIME ms`).
2. **Tenant Isolation (`server/src/middleware/tenant.ts`)**:
   - Authoritative tenant identity derived from verified JWT.
   - Header/body spoofing rejected immediately with HTTP 403 `TENANT_SPOOFING_REJECTED`.
   - Super Admin cross-tenant governance bypass supported for platform administration.
3. **Authentication & RBAC (`server/src/middleware/auth.ts`)**:
   - `requireAuth`: Bearer token extraction and HS256 signature verification.
   - `requireRole`: Strict role hierarchy checking (`superadmin`, `college_admin`, `tpo_admin`, `faculty_coordinator`, `recruiter`, `student`).
4. **Centralized Error Handling (`server/src/middleware/error.ts`)**:
   - Standardized JSON responses (`success: false`, `error: { code, message }`).
   - Redacts credentials and internal stack traces in production environments.

---

## 5. Standby Cloudflare Workers Runtime & Parity Architecture (`workers/`)

### 5.1 V8 Isolate Architecture & Retention Rationale
As documented in Section 14, Cloudflare Workers operates directly on Google V8 isolates with sub-millisecond cold starts and is temporarily maintained alongside Express:
- Retained to guarantee 100% architectural parity and zero-downtime rollback capabilities.
- Shares the identical 16-table Drizzle schema (`workers/src/db/schema.ts` ↔ `server/src/db/schema.ts`).
- Executes an identical 112-test Vitest suite covering cryptography, tenant isolation, RBAC, and route behaviors.

### 5.2 Connection Acceleration via Cloudflare Hyperdrive
Direct connection from edge serverless workers to PostgreSQL leverages **Cloudflare Hyperdrive**:
1. Maintains pooled persistent connections to Neon PostgreSQL from edge PoPs.
2. Eliminates TLS handshake latency on every worker invocation.
3. Automatically caches read queries when appropriate while guaranteeing write consistency.

---

## 5. Hono REST API Architecture (`/api/v1`)

The edge API is organized under the `/api/v1` namespace with a modular Hono router structure:

```
workers/
├── wrangler.toml              # Cloudflare Worker configuration, bindings & secrets
├── package.json               # Dependencies (Hono, Drizzle, Neon serverless, bcryptjs, Zod)
├── tsconfig.json              # Strict TypeScript configuration
├── src/
│   ├── index.ts               # Hono root app, global CORS, logger, 404 & error handlers
│   ├── types.ts               # Environment bindings, AppEnv, UserRole, session contexts
│   ├── db/
│   │   ├── client.ts          # Neon Serverless + Drizzle ORM singleton factory
│   │   └── schema.ts          # 16 normalized tables, 9 enums, relations & indexes
│   ├── middleware/
│   │   ├── auth.ts            # JWT Bearer token validator & RBAC role guard
│   │   └── tenant.ts          # Anti-spoofing tenant isolation & UUID format validator
│   ├── utils/
│   │   └── crypto.ts          # bcrypt hashing (salt rounds 10) & JWT token signing/verifying
│   └── routes/
│       ├── auth.routes.ts     # /api/v1/auth (register, login, me, logout, refresh)
│       ├── tenant.routes.ts   # /api/v1/tenants (list active, provision tenant, verify)
│       ├── student.routes.ts  # /api/v1/students (profiles, verified skills, evidence)
│       ├── skill.routes.ts    # /api/v1/skills (taxonomy, 5-stage transitions, binding)
│       ├── drive.routes.ts    # /api/v1/drives (placements, criteria, applications)
│       └── admin.routes.ts    # /api/v1/admin (analytics, audit trails, tenant config)
```

### 5.1 Route & Middleware Execution Pipeline

Every incoming request traverses a defense-in-depth pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Vite React SPA
    participant Edge as Cloudflare Worker (Hono)
    participant CORS as CORS & Logger MW
    participant TM as Tenant Middleware
    participant Auth as Auth & RBAC MW
    participant DB as Neon PostgreSQL (via Drizzle)

    Client->>Edge: HTTP Request to /api/v1/...
    Edge->>CORS: Validate Origin, Methods & Headers
    CORS->>TM: Check x-tenant-id & Context
    alt Tenant Spoofing Detected
        TM-->>Client: 403 Forbidden (TENANT_SPOOFING_REJECTED)
    else Malformed UUID Header
        TM-->>Client: 400 Bad Request (INVALID_TENANT_ID)
    else Tenant Validated
        TM->>Auth: Evaluate Route Auth Requirements
        alt Protected Route & Missing Token
            Auth-->>Client: 401 Unauthorized (MISSING_BEARER_TOKEN)
        else Token Expired or Tampered
            Auth-->>Client: 401 Unauthorized (TOKEN_VERIFICATION_FAILED)
        else Role Insufficient
            Auth-->>Client: 403 Forbidden (FORBIDDEN)
        else Claims Verified
            Auth->>DB: Execute Query (Scoped to tenant_id)
            DB-->>Edge: Relational Results
            Edge-->>Client: 200 OK (Typed JSON Payload)
        end
    end
```

### 5.2 Core API Endpoints Specification

| Namespace | Method & Endpoint | Auth & RBAC | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET /health` | Public | Health ping, worker service name, version, timestamp |
| **System** | `GET /api/v1/health` | Public | Extended health check reporting database connection status |
| **Auth** | `POST /api/v1/auth/register` | Public (Tenant Context) | Registers student, admin, coordinator, or recruiter under college tenant |
| **Auth** | `POST /api/v1/auth/login` | Public (Tenant Context) | Authenticates credentials, issues signed JWT token with tenant claims |
| **Auth** | `GET /api/v1/auth/me` | `requireAuth` | Returns active user profile, tenant identity, and authorized permissions |
| **Tenants** | `GET /api/v1/tenants/` | Public | Lists active college institutions for registration onboarding |
| **Tenants** | `POST /api/v1/tenants/` | `requireAuth` (`superadmin`) | Provisions a new college institution tenant with custom slug & domain |
| **Students** | `GET /api/v1/students/me` | `requireAuth` (`student`) | Returns authenticated student's full academic and verified skill profile |
| **Skills** | `GET /api/v1/skills/` | `requireAuth` (Any Role) | Canonical taxonomy search filtered by category or canonical slug |
| **Drives** | `GET /api/v1/drives/` | `requireAuth` (Any Role) | Returns active campus placement drives matching student eligibility |
| **Admin** | `GET /api/v1/admin/analytics` | `requireAuth` (`college_admin`) | Institutional placement metrics, skill distribution, and cohort trends |

---

## 6. Drizzle ORM Relational Schema (Neon PostgreSQL)

The relational schema is defined with TypeScript type safety in `workers/src/db/schema.ts` and mirrors the PostgreSQL 16 schema. It enforces referential integrity through foreign keys, cascade rules, composite uniqueness, and categorical check constraints.

### 6.1 The 16 Canonical Relational Tables

```mermaid
erDiagram
    tenants ||--o{ users : "hosts"
    tenants ||--o{ students : "enrolls"
    tenants ||--o{ placement_drives : "conducts"
    tenants ||--o{ audit_events : "logs"
    tenants ||--o{ notifications : "dispatches"

    users ||--o| students : "identifies"
    users ||--o{ audit_events : "acts"
    users ||--o{ notifications : "receives"

    students ||--o{ student_skills : "acquires"
    students ||--o{ evidence_records : "submits"
    students ||--o{ skill_assessments : "completes"
    students ||--o{ academic_semesters : "records"
    students ||--o{ applications : "submits"
    students ||--o{ interviews : "attends"

    skills ||--o{ student_skills : "categorizes"
    skills ||--o{ job_requirements : "demanded_by"

    student_skills ||--o{ evidence_records : "supported_by"

    companies ||--o{ job_roles : "defines"
    companies ||--o{ placement_drives : "participates"
    job_roles ||--o{ job_requirements : "requires"
    job_roles ||--o{ placement_drives : "hiring_for"

    placement_drives ||--o{ applications : "receives"
    applications ||--o{ interviews : "progresses_to"
```

1. **`tenants`**: Institutional boundary. Stores college name, unique slug, verified custom domain, institutional settings, and active status flag.
2. **`users`**: Platform actors (`superadmin`, `college_admin`, `faculty_coordinator`, `recruiter`, `student`). Contains email, bcrypt password hash, tenant foreign key, active status, and audit timestamps.
3. **`students`**: Academic profile linked 1:1 with `users`. Stores roll number, department, batch year, degree, cumulative CGPA, verified backlogs count, date of birth, and Cloudflare R2 resume key.
4. **`skills`**: Standardized canonical competency catalog. Stores skill name, canonical slug, category (`programming_languages`, `frameworks`, `databases`, `cloud_devops`, `core_cs`, `data_ai`, `soft_skills`), and active status.
5. **`studentSkills`**: Relational junction connecting students to skills. Encapsulates the **5-Stage Verification Lifecycle**, proficiency level (`beginner`, `intermediate`, `advanced`, `expert`), validation score (0–100), and last active timestamp.
6. **`evidenceRecords`**: Verifiable proof objects. Stores evidence type (`github_commit`, `github_pr`, `project_repository`, `deployed_application`, `coding_assessment`, `certification`), external repository URL, git commit hash, Cloudflare R2 storage key, evaluation score, and human verification status.
7. **`skillAssessments`**: Automated and proctored coding assessments. Captures assessment title, score, max score, percentile rank, proctoring flags, and completion timestamp.
8. **`academicSemesters`**: Normalized term-by-term academic audit trail. Tracks semester number, SGPA, credits attempted, credits earned, and backlog flags.
9. **`companies`**: Participating hiring organizations. Stores company name, industry sector, corporate website, tier (`tier_1`, `tier_2`, `mass_recruiter`, `startup`), and partnership status.
10. **`jobRoles`**: Specific hiring designations offered by companies. Stores title, department focus, minimum compensation (LPA), maximum compensation (LPA), and work location.
11. **`jobRequirements`**: Competency specifications for job roles. Stores required skill foreign key, mandatory flag (`is_mandatory`), minimum required proficiency, and relative evaluation weight.
12. **`placementDrives`**: Campus recruitment events. Stores drive title, hiring company, target batch year, allowed departments, minimum CGPA cutoff, maximum allowed backlogs, drive lifecycle status (`draft`, `published`, `ongoing`, `completed`, `cancelled`), and drive schedule dates.
13. **`applications`**: Student candidacy submissions for placement drives. Captures application lifecycle (`applied`, `eligible`, `shortlisted`, `interview_scheduled`, `offered`, `rejected`, `withdrawn`), deterministic eligibility evaluation outcome, and human decision maker ID (`final_decision_by`).
14. **`interviews`**: Multi-stage evaluation rounds. Stores application foreign key, round number, round type (`online_test`, `technical_1`, `technical_2`, `hr`, `management`), interviewer name, numeric rating (1–5), qualitative feedback, and recommendation.
15. **`auditEvents`**: Tamper-proof security and compliance log. Captures actor ID, tenant ID, action verb, target entity, IP address, user agent, and contextual JSON metadata.
16. **`notifications`**: Targeted user alerts. Stores title, message, alert category, read status, and link target.

### 6.2 The 5-Stage Skill Verification Lifecycle

A foundational principle of CarrerSync is that **skills are not binary claims; they are dynamic, evidence-backed states**:

```mermaid
stateDiagram-v2
    [*] --> Claimed : Student self-declares skill
    Claimed --> Observed : Profiling Agent detects repo/commits
    Observed --> EvidenceLinked : Artifact bound (Commit hash / R2 file)
    EvidenceLinked --> Verified : Human Faculty / T&P Admin validates
    Verified --> Expired : Inactive > 180 days / Unre-certified
    Claimed --> Expired : Inactive without evidence
    Expired --> EvidenceLinked : New proof submitted
    Verified --> [*]
```

1. **`Claimed`**: Self-reported by the student without verifiable evidence attached. Excluded from recruiter shortlisting filters.
2. **`Observed`**: Detected automatically by the Profiling Agent via repository source parsing, AST analysis, or commit log scans. Represents an unconfirmed signal.
3. **`Evidence-linked`**: Formally bound to inspectable code evidence (GitHub commit SHA, merged pull request, deployed URL, or Cloudflare R2 code artifact).
4. **`Verified`**: Formally reviewed and signed off by a human faculty coordinator, placement officer, or validated proctored coding assessment. **AI agents cannot independently assign Verified status.**
5. **`Expired`**: Competency lapsed due to lack of ongoing activity, commits, or recertification over a defined period (e.g., 180 days).

---

## 7. Multi-Tenant Transaction-Scoped Security & Isolation

CarrerSync enforces a strict **Dual-Layer Multi-Tenancy Architecture** ensuring that no institution can access, view, or mutate another institution’s records under any circumstance.

### 7.1 Layer 1: Edge Gateway Validation & Anti-Spoofing Middleware
Executed at the Cloudflare Worker layer on every incoming request (`workers/src/middleware/tenant.ts`):
- **Authoritative JWT Tenant Identity**: For authenticated requests, the user’s `tenant_id` embedded in the cryptographically signed JWT is strictly authoritative.
- **Tenant Spoofing Prevention**: If a client supplies a custom `x-tenant-id` header or body parameter that differs from the JWT tenant claim, the request is immediately rejected with HTTP `403 Forbidden` (`TENANT_SPOOFING_REJECTED`) and logged as a security alert.
- **UUID Validation**: All tenant identifiers must conform to canonical RFC 4122 UUID v4 formatting. Malformed strings are rejected with HTTP `400 Bad Request`.
- **Institutional State Verification**: Ensures the tenant institution exists and is currently active before dispatching database transactions.

### 7.2 Layer 2: PostgreSQL Row-Level Security (RLS)
Executed at the database kernel level within Neon PostgreSQL:
- **Transaction-Scoped Context**: Every database connection or transaction sets the session variable:
  ```sql
  SET LOCAL app.current_tenant_id = '11111111-1111-1111-1111-111111111111';
  ```
- **Database Engine Policies**: Every tenant-owned table is secured with PostgreSQL RLS:
  ```sql
  ALTER TABLE students ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY tenant_isolation_policy ON students
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
  ```
- **Zero-Leakage Assurance**: Even if an application query inadvertently omits a `WHERE tenant_id = ...` clause, the PostgreSQL engine filters out rows belonging to all other institutions.

---

## 8. Neon Auth & Better Auth Compatibility

CarrerSync integrates **Neon Auth** (powered by **Better Auth**) to provide seamless, secure identity management without adding recurring monthly SaaS costs.

### 8.1 Schema Separation & Coexistence
- Managed authentication tables live inside the dedicated `neon_auth` PostgreSQL schema (`neon_auth.users`, `neon_auth.sessions`, `neon_auth.accounts`, `neon_auth.verifications`).
- Core business entities live in the `public` schema (`public.users`, `public.students`, `public.tenants`), linking to authentication identities via immutable UUID keys.
- Drizzle ORM queries interact cleanly with application tables while delegating credential and session verification to the auth engine.

### 8.2 Stateless Edge Token Architecture
- **JWT Cryptography**: Signed using HMAC-SHA256 (`HS256`) via Web Crypto APIs supported natively in V8 isolates.
- **Token Claims**: Contains `sub` (user UUID), `tenant_id` (institution UUID), `role` (`UserRole`), `email`, issued-at (`iat`), and expiration (`exp`, default 2 hours).
- **Password Security**: Passwords hashed using `bcrypt` with 10 salt rounds (`bcryptjs`). Plain text credentials are never persisted or logged.

### 8.3 Role-Based Access Control (RBAC) Hierarchy

```mermaid
flowchart TD
    SA["superadmin\n(Global platform overseer, tenant provisioning)"]
    CA["college_admin\n(Institutional T&P Director, drives, analytics, policies)"]
    TPO["tpo_admin\n(Training & Placement Officer, drive execution, student tracking)"]
    FC["faculty_coordinator\n(Department coordinator, skill verification, approvals)"]
    RC["recruiter\n(Company hiring team, candidate discovery, interviews)"]
    ST["student\n(Undergraduate candidate, evidence submission, goals)"]

    SA --> CA
    CA --> TPO
    CA --> FC
    CA --> RC
    TPO --> ST
    FC --> ST
    RC -.->|View Verified Only| ST
```

- **`superadmin`**: Platform administrator; possesses platform root authority, provisions new college tenants, manages system policies, monitors platform-wide audit trails, and manages user accounts cross-tenant.
- **`college_admin`**: Institutional Training & Placement (T&P) Director; possesses full administrative control over their college’s students, drives, recruiters, and eligibility rules.
- **`tpo_admin`**: Training & Placement Officer; manages day-to-day placement operations, drive applications, company interview slots, and student communications.
- **`faculty_coordinator`**: Department faculty; reviews student code evidence, conducts proctored reviews, and upgrades skill states from `Evidence-linked` to `Verified`.
- **`recruiter`**: Verified corporate hiring representative; browses verified talent pools, shortlists eligible candidates, and submits interview evaluations.
- **`student`**: Enrolled candidate; manages personal profile, links GitHub accounts, reviews skill gaps, and applies for campus placement drives.

### 8.4 Super Admin Platform Authority & Multi-Tenant Boundaries

CarrerSync balances multi-tenant data isolation with centralized platform operations:

```mermaid
flowchart TD
    subgraph PlatformScope["Platform Authority Scope (Cross-Tenant)"]
        SA["Platform Super Admin\n(role: 'superadmin')"]
        SAPath["/api/v1/super-admin/*"]
        SAPortal["Super Admin Portal\n(/super-admin/*)"]
        SA --- SAPath
        SA --- SAPortal
    end

    subgraph InstitutionalScope["Isolated Collegiate Tenants (Single-Tenant RLS Boundary)"]
        TenantA["College Tenant A\n(e.g., IIT Bombay)"]
        TenantB["College Tenant B\n(e.g., BITS Pilani)"]
        TenantC["College Tenant C\n(e.g., NIT Trichy)"]
    end

    SAPath -->|Cross-Tenant Governance| TenantA
    SAPath -->|Cross-Tenant Governance| TenantB
    SAPath -->|Cross-Tenant Governance| TenantC

    TenantA x-.-x|Strict Layer 1 & 2 RLS Isolation| TenantB
    TenantB x-.-x|Strict Layer 1 & 2 RLS Isolation| TenantC
```

#### 1. Universal Cross-Tenant Governance vs. Single-Tenant Boundaries
- **Single-Tenant Actors**: Users with roles `student`, `faculty_coordinator`, `tpo_admin`, or `college_admin` are strictly bounded to their assigned college (`tenantId`). Attempts to access resources belonging to another college are blocked at Layer 1 (Edge Anti-Spoofing Middleware) and Layer 2 (PostgreSQL Row-Level Security).
- **Super Admin Governance**: The `superadmin` role has platform-level authority. Routes under `/api/v1/super-admin/*` enforce:
  1. `requireAuth`: Validates JWT signature, non-tampered claims, and expiration.
  2. `requireRole(['superadmin'])`: Enforces that only users with the `superadmin` role can access the portal endpoints (returning `403 Forbidden` for all other roles).
  3. **Isolation Exemption**: Super Admin handlers execute queries across all registered collegiate tenants, allowing system-wide statistics, global user directories, college activation/suspension, and platform-wide audit analytics.

#### 2. Institutional Tenant Lifecycle Governance
- **College Provisioning (`POST /api/v1/super-admin/colleges`)**: Registers a new educational institution with verified name, unique URL slug, custom official domain, physical location, and contact metadata.
- **Suspension & Reactivation (`PATCH /api/v1/super-admin/colleges/:id/status`)**: Super Admins can toggle `isSuspended` and `status` (`active`, `suspended`, `inactive`). When a college is suspended, all associated students, faculty, and administrators from that tenant are immediately barred from authenticating (`TENANT_SUSPENDED`).
- **Domain & Configuration Controls**: Super Admins can update institutional settings, allowed email domains, and maximum seat allocations.

#### 3. Out-of-Band Initial Bootstrapping Policy
- **Zero Public Registration**: To eliminate privilege escalation vulnerabilities, CarrerSync does **not** expose a public registration page for Super Admins.
- **Initial Bootstrapping**: The platform root administrator is provisioned out-of-band via CLI using `scripts/provision_superadmin.ts` or `scripts/provision_superadmin.py` with direct `DATABASE_URL` credentials.
- **Subsequent Administrative Users**: Additional administrators, TPOs, and recruiters are onboarded through authenticated invitations or direct creation with mandatory audit trail logging.

---

### 8.5 Cryptographic Single-Use Invitation Lifecycle Mechanics

User onboarding across institutions and recruitment partners is governed by an expiring, cryptographically secure invitation state machine.

```mermaid
stateDiagram-v2
    [*] --> Pending : Super Admin / College Admin creates invitation\n(Token generated with 256-bit entropy)
    Pending --> Accepted : Invitee redeems token & sets password\n(Single-use token atomically invalidated)
    Pending --> Expired : Current time > expiresAt (default 7 days)\n(Token rejected by edge validator)
    Pending --> Revoked : Administrator cancels invitation\n(Revocation logged in audit trail)
    Expired --> Pending : Resend invitation (Refreshes token & expiry)
    Accepted --> [*]
    Revoked --> [*]
```

#### 1. Relational Schema (`invitations` Table)
Defined in `workers/src/db/schema.ts`:
- `id`: Primary key UUID.
- `tenantId`: Foreign key to `tenants.id` (nullable for cross-tenant recruiter invites; non-null for college-scoped roles).
- `email`: Target invitee email address.
- `role`: Role to be granted upon acceptance (`college_admin`, `tpo_admin`, `recruiter`, `student`).
- `fullName`: Invitee full name.
- `token`: Unique cryptographically random single-use verification token.
- `status`: Enum (`pending`, `accepted`, `expired`, `revoked`).
- `metadataJson`: Contextual parameters (department, roll number, company, batch year).
- `invitedByUserId`: Foreign key to the issuing administrator's `users.id`.
- `expiresAt`: Expiration timestamp (default 7 days from generation).
- `acceptedAt`: Timestamp of successful redemption.

#### 2. Cryptographic Security Mechanics
- **High-Entropy Token Generation**: Generated using cryptographic pseudo-random number generators (`crypto.randomBytes(32).toString('hex')` or Web Crypto `crypto.getRandomValues()`), producing 256 bits of entropy to prevent brute-force token enumeration.
- **Atomic Single-Use Invalidation**: Token acceptance executes inside an atomic transaction:
  ```sql
  UPDATE invitations 
  SET status = 'accepted', acceptedAt = NOW(), updatedAt = NOW()
  WHERE token = $1 AND status = 'pending' AND expiresAt > NOW()
  RETURNING id, email, role, tenant_id;
  ```
  If zero rows are updated, the request is rejected with `400 Bad Request` (`INVITATION_INVALID_OR_CONSUMED`), preventing replay attacks and race conditions.
- **Resend & Token Rotation**: When an invitation is resent (`POST /api/v1/super-admin/invitations/:id/resend`), the existing token is discarded, a new high-entropy token is generated, and `expiresAt` is extended.

---

### 8.6 Super Admin Platform Audit Trails & Compliance Logging

All platform mutations executed by Super Admins and institutional administrators are immutably captured in the `audit_events` relational table.

#### 1. Audit Trail Specifications
- **Tamper-Proof Design**: Audit records are insert-only. No API endpoint exists to update or delete audit events (`FORBIDDEN`).
- **Comprehensive Event Capture**:
  - `tenant_id`: Scoped college tenant or platform root tenant.
  - `actor_user_id`: Authenticated administrator UUID.
  - `action`: Authoritative action verb (`COLLEGE_CREATED`, `COLLEGE_STATUS_UPDATED`, `USER_CREATED`, `USER_STATUS_UPDATED`, `USER_ROLE_UPDATED`, `INVITATION_CREATED`, `INVITATION_REVOKED`, `INVITATION_RESENT`, `SUPERADMIN_INITIAL_PROVISIONING`).
  - `entity_type`: Target entity class (`college`, `user`, `invitation`, `policy`).
  - `entity_id`: UUID of the affected entity.
  - `details`: JSON payload capturing old vs. new state diffs, IP addresses, and metadata.
  - `created_at`: UTC timestamp with timezone.
- **Query & Analytics**: The Super Admin Audit Trail is queryable via `GET /api/v1/super-admin/audit-logs` with full-text search, actor filtering, entity filtering, and date range criteria, and displayed at `/super-admin/audit-logs`.

---

## 9. Canonical Database Reconciliation & Zero-Loss MongoDB Migration Roadmap

### 9.1 The Canonical Decision: Neon PostgreSQL
During early architecture development (Phase 01), a dual data store concept was explored with MongoDB Atlas and FalkorDB. Concurrently, an authoritative 16-table relational schema was created for **Neon PostgreSQL**.

**Architectural Decision**: **Neon PostgreSQL is established as the single canonical source of truth for CarrerSync.** MongoDB Atlas is completely retired.

### 9.2 Zero Data Loss Guarantee
The complete decommissioning of MongoDB involves **zero data loss** due to four verified platform facts:
1. **No Instantiated Mongoose Models**: The legacy file `server/src/models/index.js` only defined string constants for collections. No Mongoose schemas or models were instantiated or compiled.
2. **Disconnected Operational Mode**: The legacy Express connection manager (`server/src/config/db.js`) ran in non-blocking disconnected mode whenever `MONGODB_URI` was unconfigured.
3. **Zero Production Data**: The project was in development preview; zero live student, drive, or institutional records were ever written to MongoDB Atlas.
4. **Complete Relational Superset**: The 16 normalized PostgreSQL tables completely subsume and expand upon the 11 planned MongoDB collections, adding relational integrity constraints, foreign key cascades, and row-level security.

### 9.3 Planned Collections to Relational Tables Mapping

| Planned MongoDB Collection | Canonical Neon PostgreSQL Table(s) | Relational Enhancements & Constraints |
| :--- | :--- | :--- |
| `Users` | `tenants`, `users`, `neon_auth.users` | Separation of institution from user; composite unique `(tenant_id, email)`; bcrypt credential hashing. |
| `Students` | `students`, `academic_semesters` | Normalized semester SGPA/backlog tracking; composite unique `(tenant_id, roll_number)`. |
| `Skills` | `skills` | Standardized canonical ontology with slug indexing (`canonical_slug`) and categorical taxonomy. |
| `Evidence` | `evidence_records`, `skill_assessments` | Direct binding to verified skills; Cloudflare R2 object key tracking; commit SHA auditability. |
| *Embedded Skills Array* | `student_skills` | **The 5-Stage Verification Lifecycle** (`Claimed` → `Verified`); composite unique `(student_id, skill_id)`. |
| `Projects` | `evidence_records` (`project_artifact`) | Unified evidence tracking with inspectable GitHub URLs and R2 artifacts. |
| `JobRequirements` | `companies`, `job_roles`, `job_requirements` | 3-tier hierarchy: Companies → Roles → Weighted skill requirements with mandatory flags. |
| `Drives` | `placement_drives` | Drive lifecycle (`draft`, `published`, `ongoing`, `completed`, `cancelled`); batch & department filters. |
| `EligibilityRules` | `placement_drives` (relational criteria) | Deterministic criteria: `min_cgpa`, `max_active_backlogs`, allowed departments. |
| `EligibilityResults` | `applications` | Normalized application record; composite unique `(drive_id, student_id)`; human decision audit. |
| *New Interview Entity* | `interviews` | Multi-round interview tracking (`online_test`, `technical_1`, `technical_2`, `hr`, `management`). |
| `LearningPaths` | `learning_recommendations`, `skill_gap_analyses` | Analytical gap computation separated from actionable remediation milestones. |
| `AuditLogs` | `audit_events`, `agent_execution_logs` | Tamper-proof compliance log storing actor ID, action, resource, metadata, and agent telemetry. |

### 9.4 Migration & Phase Roadmap

```mermaid
flowchart LR
    P1["Phase 1\nDatabase Foundation\n(16 Tables & Alembic)"] --> P2["Phase 2\nFrontend System\n(32 Dashboard Pages)"]
    P2 --> P25["Phase 2.5\nStack Reconciliation\n(Docs & Roadmap)"]
    P25 --> P3["Phase 3\nCloudflare Workers API\n(Hono, Auth & RBAC)"]
    P3 --> P4["Phase 4\nSuper Admin Portal\n(8 Pages & Governance)"]
    P4 --> P6["Phase 6\nExpress Migration\n(112/112 Vitest Parity)"]
    P6 --> P5["Future Phases\nAgents & Live Graph\n(Evidence & Projections)"]
```

1. **Phase 1: Relational Database Foundation (COMPLETED)**: 16 normalized tables created in Neon PostgreSQL, Alembic migrations verified, synthetic multi-tenant seeder executed, 12/12 Pytest tests passing.
2. **Phase 2: UI/UX Design System & Dashboard Foundation (COMPLETED)**: 22 reusable UI components, public SaaS landing page, 32 dashboard pages across Student (10), Admin (13), and Recruiter (9) portals, Cytoscape.js knowledge graph, Vite production build passing in 340ms.
3. **Phase 2.5: Architecture & Stack Reconciliation (COMPLETED)**: Full architectural audit, complete MongoDB retirement with zero data loss, approved canonical stack specification (`docs/RECONCILIATION.md`).
4. **Phase 3: Cloudflare Workers Edge API & Security (COMPLETED)**: Edge API under `/api/v1` built with Hono v4, Drizzle ORM schema, dual-layer tenant isolation, JWT authentication, RBAC middleware, and 76 Vitest tests passing.
5. **Phase 4: Super Admin Portal, Governance & User Provisioning (COMPLETED)**: 8 Super Admin portal pages (`/super-admin/*`), out-of-band CLI bootstrapper (`scripts/provision_superadmin.ts`), expiring single-use invitations (`invitations` table), platform audit trail, and 112/112 Vitest tests.
6. **Phase 06: Node.js + Express Backend Migration (COMPLETED)**: Ported API engine to Node.js + Express (`server/`) with dynamic Render `$PORT` binding, graceful shutdown, Neon PostgreSQL connection caching, transaction-scoped RLS context helper (`withTenantContext`), and full 112/112 Vitest test parity (100% parity gate met). Standby Cloudflare Workers runtime preserved per Section 14 for zero-downtime rollback assurance.
7. **Future Phases: Agentic Evidence Ingestion & Live Graph Projections (PLANNED)**: Profiling Agent AST code ingestion, Skill-Gap Agent deterministic benchmarking, and Placement Orchestration Agent workflows.

---

## 10. AI Boundary & Deterministic Reliability Guarantees

CarrerSync implements an agentic AI architecture that guarantees **100% operational uptime** without requiring paid external model subscriptions:

1. **Provider-Independent Hybrid Strategy**: Utilizes Google Gemini API Free Tier (or Cloudflare Workers AI) for semantic summarization and repository inspection when quota is available.
2. **Offline Deterministic Fallbacks**: Every AI agent capability is backed by a deterministic, offline rule engine:
   - *Student Profiling*: Regex & Abstract Syntax Tree (AST) language keyword parser.
   - *Skill Gap Analysis*: Set-difference matching algorithm between student competencies and job requirement thresholds.
   - *Predictive Analytics*: Weighted multi-factor readiness scoring formula.
   - *Drive Orchestration*: Deterministic finite-state machine (FSM).
3. **Core Platform Operations Immunity**: Critical business logic—including authentication, password validation, tenant isolation, role verification, academic eligibility evaluation, and drive shortlisting—**never invokes external LLMs**. Core decisions remain tamper-proof, auditable, and mathematically deterministic.

---

## 11. Phase 07: Database & Authentication Reconciliation Specification

### 11.1 Live Database Catalog Discovery & Audit
A catalog-level discovery was executed against the active Neon Serverless PostgreSQL instance (`neondb` on PostgreSQL 18.7), querying `information_schema` and `pg_catalog` via `scripts/inspect_live_db.py` and `scripts/inspect_live_db.ts`:
- **Physical Relational Inventory**: Exactly **22 relational tables** (21 application domain tables + 1 `alembic_version` table tracking revision `fdf3af0b3748`).
- **Column Volume**: Exactly **207 columns** with data types, nullability, and application-layer defaults.
- **Foreign Key Cascades**: **44 foreign keys**, with all tenant-child domain tables enforcing `ON DELETE CASCADE` referencing `tenants.id`.
- **Indexing**: **85 indexes** (22 primary keys, 12 unique constraints, and 51 composite tenancy and query indexes).
- **Enum Catalog State**: 0 native PostgreSQL enums in `pg_type`/`pg_enum`; domain enums stored as `character varying(50)` (and `character varying(19)` on `users.role`), with application-layer validation.
- **Row-Level Security (RLS) Baseline**: Live database catalogs indicated `rls_enabled = false` and 0 active policies in `pg_policies`, establishing that multi-tenant isolation currently exists primarily at the application middleware and query composite index layer.

### 11.2 Multi-Tenant RLS Pooling Isolation Hardening
Because connection poolers (Neon connection pooler, PgBouncer) share physical database sessions across diverse requests, executing `SET app.current_tenant_id` at the session level introduces severe risk of tenant context leaking to subsequent requests. In `server/src/db/client.ts`, `withTenantContext` has been hardened to eliminate pooling leakage:
1. **Dedicated Pool Client**: Acquires a dedicated client instance via `pool.connect()`.
2. **Transaction Scope**: Explicitly executes `BEGIN`, ensuring all operations remain isolated within a database transaction.
3. **Transaction-Local GUC Configuration**: Sets tenant context using `SELECT set_config('app.current_tenant_id', :tenantId, true)` and `SET LOCAL app.current_tenant_id = :tenantId`. The third parameter `is_local = true` ensures PostgreSQL automatically discards the setting when the transaction commits or aborts.
4. **Guaranteed Context Teardown**: In a mandatory `finally` block before releasing the client back to the pool, executes `RESET app.current_tenant_id` and `SELECT set_config('app.current_tenant_id', '', false)`.
5. **Injection Defense**: Strictly sanitizes and validates tenant UUID format prior to GUC assignment.

### 11.3 Drizzle ORM Schema Reconciliation & Non-Destructive Column Compatibility
`server/src/db/schema.ts` has been established as the canonical source of truth for Drizzle ORM:
- **Full Domain Coverage**: Implements all 16 canonical domain tables, the `invitations` table, and all 5 AI/analytics tables (`skill_gap_analyses`, `placement_predictions`, `learning_recommendations`, `agent_execution_logs`, `agent_workflows`).
- **Non-Destructive Column Compatibility**:
  - `students`: Defines canonical `resumeR2Url` (`resume_r2_url`) alongside `resumeUrl` (`resume_url`), backed by `resolveStudentResumeUrl` dual-read resolver and `normalizeStudentResumeInput`.
  - `evidenceRecords`: Defines canonical `r2StorageKey` (`r2_storage_key`) alongside `fileStorageKey` (`file_storage_key`), backed by `resolveEvidenceStorageKey` dual-read resolver and `normalizeEvidenceStorageInput`.
  - Ensures zero existing columns are dropped or broken while maintaining forward compatibility.
- **Role Hierarchy**: `userRoleEnum` explicitly includes `tpo_admin` alongside `superadmin`, `college_admin`, `faculty_coordinator`, `recruiter`, and `student`.

### 11.4 Authentication Provider Architectural Decision
**Decision**: CarrerSync preserves its custom, self-hosted **stateless JWT (HS256) + bcryptjs (10 salt rounds)** authentication engine, explicitly rejecting migrations to Neon Auth (Managed Better Auth) or external third-party identity providers (Auth0, Clerk, Supabase Auth).

**Architectural Justification**:
1. **Strict ₹0 Zero-Cost Compliance**: External identity providers charge per Monthly Active User (MAU) beyond minimal free tiers. For university cohorts with tens of thousands of active students and alumni, external auth creates uncontrolled monthly financial liabilities.
2. **Multi-Tenant Data Ownership & Colocation**: Authentication credentials (`users.password_hash`), tenant bindings (`users.tenant_id`), roles, and student profiles reside directly within CarrerSync's Neon PostgreSQL instance, guaranteeing atomic transactions and zero cross-cloud metadata sync delays.
3. **Open Standards & Runtime Portability**: Standard RFC 7519 JWT and bcrypt are 100% portable across Node.js Express, Python FastAPI, Cloudflare Workers, and edge runtimes with zero vendor lock-in.
4. **Self-Contained Offline Verification**: The test suites (`Vitest` in `server/` and `Pytest` in `backend/`) run 100% offline with zero external network dependencies, ensuring lightning-fast CI/CD execution.
5. **Zero Credential or PII Egress**: No student email addresses, passwords, or session tokens are transmitted to external SaaS identity vendors.

### 11.5 Five-Role RBAC & Super Admin Platform Security
- **Role Hierarchy**:
  - `SUPER_ADMIN`: System-wide governance, college provisioning/suspension, cross-tenant user management, audit logs.
  - `COLLEGE_ADMIN`: Institutional placement director, company approvals, drive rules, cohort analytics.
  - `TPO_ADMIN`: Training & Placement operational execution, student tracking, drive monitoring.
  - `RECRUITER`: Corporate talent acquisition, candidate evaluation, interview scheduling.
  - `STUDENT`: Candidate portfolio, verified skill proofs, drive applications.
- **Server-Side Enforcement**: All `/api/v1/super-admin/*` endpoints enforce `requireAuth` and `requireRole(['superadmin'])`. Unauthorized callers receive 401 `MISSING_BEARER_TOKEN` or 403 `FORBIDDEN_INSUFFICIENT_ROLE`.
- **Public Registration Protection**: `POST /api/v1/auth/register` explicitly forbids `role: 'superadmin'`, returning 403 `SUPERADMIN_REGISTRATION_PROHIBITED`. Platform Super Admins must be provisioned out-of-band via CLI bootstrapper (`scripts/provision_superadmin.ts` / `.py`).
- **Cryptographic Invitation Lifecycle**: Expiring single-use tokens generated with 192-bit cryptographic entropy (`crypto.randomBytes(24)`), enforced with atomic redemption, status transition (`pending` → `accepted` / `revoked` / `expired`), and 410 error on re-use.

### 11.6 Student Privacy & Ethical Data Protection
- **Under-18 Protection**: Relational database CHECK constraint on `students.date_of_birth` strictly enforces age $\ge 18$.
- **Zero Behavioral Surveillance**: The platform explicitly forbids background keystroke logging, webcam monitoring, eye-tracking, or ambient surveillance.
- **No Student Data Egress to External AI**: No student PII, academic transcripts, or resume data is forwarded to proprietary external AI models. All profiling and evaluation workflows run through deterministic rule fallbacks or offline AST parsers.

---

## 12. Phase 08 — Provider-Independent File Storage Subsystem

### 12.1 Overview & Provider Independence
CarrerSync implements a provider-independent storage architecture under `server/src/storage/` governed by the `IStorageService` interface. The subsystem decouples application controllers and student workflows from specific cloud vendors, enabling seamless operation across local disk (development/test) and S3-compatible cloud storage (production).

### 12.2 Storage Engines
1. **Local Disk Storage Engine (`local.storage.ts`)**:
   - Designed strictly for **Development, CI, and Automated Testing**.
   - Implements strict path traversal prevention, restricting operations to `STORAGE_LOCAL_DIRECTORY`.
   - Files are written with mode `0o600` (read/write by owner only); directories with `0o700`.
   - **Ephemeral Notice**: Render's container filesystem is ephemeral and resets on each redeploy. Local storage is never used as persistent production storage.
2. **S3-Compatible Cloud Storage Engine (`s3-compatible.storage.ts`)**:
   - Production adapter built on AWS SDK v3 (`@aws-sdk/client-s3`), supporting Neon Object Storage, MinIO, and AWS S3.
   - Configured with `forcePathStyle: true` and AWS SigV4 presigned download URLs.

### 12.3 Relational Document Registry (`documents` Table)
File metadata is persisted in the PostgreSQL `documents` table, enforcing:
- **Tenant Isolation**: Every file record is bound to `tenant_id` with `ON DELETE CASCADE`.
- **Owner Binding**: Bound to `owner_user_id` (`users.id`).
- **Integrity**: SHA-256 cryptographic checksum verified on upload.
- **Categories**: `resume`, `academic_certificate`, `technical_certificate`, `project_evidence`, `portfolio_attachment`, `placement_document`.

### 12.4 Validation & Five-Role Access Control
- **Validation**: Enforces 5 MB file size limit, MIME type whitelist, file extension match, and magic binary signatures (PDF `%PDF-`, PNG `\x89PNG`, JPEG `\xFF\xD8\xFF`, DOCX `PK\x03\x04`).
- **Access Control**:
  - `STUDENT`: Can access, download, and delete only their own documents.
  - `TPO_ADMIN` & `COLLEGE_ADMIN`: Can view/download documents belonging to their assigned college tenant.
  - `RECRUITER`: Permitted access only to shared placement resumes/evidence within their authorized drive scope.
  - `SUPER_ADMIN`: Platform compliance view with explicit audit event logging.
- **Delivery**: Binary streams served with `Content-Disposition: attachment; filename="..."`, `X-Content-Type-Options: nosniff`, and `Cache-Control: private, no-cache`.

---

## 13. Phase 09 — AI Profiling Agent & Evidence Ingestion Subsystem

### 13.1 Overview & Foundational Axiom
Phase 09 establishes the **Student Profiling Agent** and the **13-Step Document Ingestion Engine** within the active Node.js + Express backend (`server/src/ai/`, `server/src/ingestion/`, `server/src/services/`, and `server/src/routes/profiling.routes.ts`).

The entire profiling subsystem is governed by the foundational axiom:
$$\mathbf{\text{“Resume\ mention\ is\ not\ verification.”}}$$

The Profiling Agent acts strictly as an **evidence discovery and extraction service**, not an autonomous certifier. It identifies claimed competencies, maps them to contextual project applications, extracts certifications, calculates multi-signal confidence scores $[0.10, 0.99]$, and stages them for mandatory student review. Full `VERIFIED` status remains the exclusive authority of human evaluators (TPO Admins and Faculty Coordinators).

### 13.2 The 13-Step Document Ingestion Pipeline
```
[1. Upload] ──► [2. Bearer JWT Auth] ──► [3. Anti-Spoof Tenant Check] ──► [4. Secure Buffer Stream]
       │
       ▼
[5. Magic Byte Validation] ──► [6. PDF/DOCX Parser] ──► [7. Scanned Doc Check] ──► [8. Normalizer]
       │
       ▼
[9. Local PII Scrubber] ──► [10. Hybrid AI Analysis] ──► [11. Staging in profileExtractions]
       │
       ▼
[12. Student Review UI] ──► [13. Relational Persistence & Profile Snapshot Versioning]
```

1. **Upload**: Multipart document upload (`POST /api/v1/files/upload`) bounded by 5 MB limit.
2. **Auth**: Validates Bearer JWT (`sub`, `role`, `tenant_id`) via `requireAuth`.
3. **Tenant Check**: Enforces anti-spoofing tenant verification (`tenantIsolationMiddleware`).
4. **Storage Retrieval**: Binary buffer streamed via `IStorageService` using SHA-256 content key.
5. **Magic Byte Check**: Validates `%PDF-`, `PK\x03\x04` (DOCX), PNG, JPEG binary signatures.
6. **Native Parsing**: Zero-cost text extraction:
   - *PDF*: `zlib.inflateSync` stream decompression and `BT...ET` text block decoding.
   - *DOCX*: ZIP directory parsing and `word/document.xml` text tag extraction.
7. **Scanned Check**: Detects image files or raster-only PDFs; marks `requiresManualReview: true` with zero hallucinated text.
8. **Normalization**: XML entity unescaping, control character stripping, punctuation standardization, and section header detection (`normalizer.ts`).
9. **PII Scrubbing**: Local redaction of emails, Indian/international phone numbers, Aadhaar, PAN, SSN, postal addresses, and candidate names (`pii-filter.ts`).
10. **Hybrid AI Profiling**: Structured extraction via `AIFactory` targeting Gemini Free Tier or Rule-Based Provider.
11. **Staging**: Persisted to `profileExtractions` with status `PENDING_REVIEW`.
12. **Student Review**: Student inspects extracted skills, projects, and confidence scores in `ProfileReviewModal.jsx`, accepting or rejecting items.
13. **Profile Persistence**: Approved skills saved to `profileSkillEvidence` with `EVIDENCE_FOUND` or `PENDING_REVIEW` (never auto-`VERIFIED`); audit logged in `profileReviewEvents`; snapshot appended to `profileVersions`.

### 13.3 Hybrid AI Architecture & Zero-Cost Policy
- **Primary Tier**: Google Gemini Free Tier (`gemini-1.5-flash` / `gemini-2.0-flash`) accessed cardlessly via Google AI Studio API (15 RPM, 1,500 RPD). Enforces strict JSON output validated via Zod (`profiling.schema.ts`).
- **Deterministic Fallback Tier**: Local regex-based `RuleBasedAIProvider` operating 100% offline with zero network overhead, sub-15ms latency, and zero hallucination risk.
- **Auto-Degradation**: API quota exhaustion (HTTP 429), missing `GEMINI_API_KEY`, or network timeouts transparently degrade to the rule-based provider without application crash.

### 13.4 Relational Data Model Extensions (`server/src/db/schema.ts`)
- `documentProcessingJobs`: Tracks ingestion job lifecycle (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- `profileExtractions`: Staging table holding proposed skills, projects, certifications, warnings, and confidence.
- `profileSkillEvidence`: Canonical skill evidence ledger (`RESUME`, `PROJECT`, `CERTIFICATE`, `ASSESSMENT`, `SELF_DECLARED`).
- `profileReviewEvents`: Immutable audit log of all human and student review actions (`APPROVE`, `REJECT`, `MODIFY`).
- `profileVersions`: Immutable JSON snapshot ledger tracking point-in-time profile state across versions.

### 13.5 Evidence Verification Rules & Role Authority
- **Evidence Hierarchy**: Self-Declared ($0.15$) $\rightarrow$ Resume-Mentioned ($0.35$) $\rightarrow$ Project-Supported ($0.65$) $\rightarrow$ Certificate-Supported ($0.75$) $\rightarrow$ Assessment-Supported ($0.90$) $\rightarrow$ Human-Reviewed ($1.00$).
- **State Transitions**: `SELF_DECLARED` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `EVIDENCE_FOUND` $\rightarrow$ `VERIFIED` (or `REJECTED` / `NEEDS_MORE_EVIDENCE`).
- **Authority Boundary**:
  - `STUDENT`: Can approve/reject their own proposed extractions.
  - `TPO_ADMIN` & `FACULTY_COORDINATOR`: Exclusive authority to award `VERIFIED` status upon inspecting physical/code artifacts.
  - `AI AGENT`: Recommendation and evidence discovery only; strictly forbidden from transitioning records to `VERIFIED`.


---

## 14. Phase 10 — TPO Verification Portal, Placement Readiness Engine & Job Eligibility Subsystem

### 14.1 Overview & Architecture Integration
Phase 10 completes the end-to-end placement workflow by operationalizing institutional credential verification, automated explainable readiness scoring, diagnostic skill gap analysis, and declarative campus job eligibility gating. Built directly into the active Node.js + Express backend (`server/src/verification/`, `server/src/readiness/`, `server/src/eligibility/`, `server/src/routes/`) and React Single Page Application (`client/src/pages/tpo/`, `client/src/services/`), Phase 10 translates verified student artifacts into qualified, audit-compliant candidate pipelines for corporate recruitment.

```mermaid
flowchart TD
    subgraph Phase09["Phase 09: Discovery & Ingestion"]
        Upload["Document Upload / Parser"] --> AI_Profile["AI Profiling & Rule Extractor"]
        AI_Profile --> Staging["Staged in profileSkillEvidence\n(PENDING_REVIEW / EVIDENCE_FOUND)"]
    end

    subgraph Phase10_Verification["Phase 10: TPO Verification Subsystem"]
        TPO_Queue["TPO Verification Queue\n(GET /api/v1/tpo/verification/pending)"]
        Decision{"TPO Institutional Review\n(Student NEVER self-verifies)"}
        TPO_Audit["Audit Ledger\n(skillVerificationReviews)"]
        
        Staging --> TPO_Queue --> Decision
        Decision -->|Verify Artifact| Verified["VERIFIED Status\n(Institutional Seal)"]
        Decision -->|Reject / Request More| Feedback["REJECTED / NEEDS_MORE_EVIDENCE\n(Student Resubmission Flow)"]
        Decision --> TPO_Audit
    end

    subgraph Phase10_Readiness["Phase 10: Readiness & Diagnostics Engine"]
        Verified --> ReadinessEngine["Placement Readiness Engine\n(35% Verified + 25% Coverage + 20% Project + 20% Academic)"]
        ReadinessEngine --> Snapshot["studentReadinessSnapshots\n(READY / DEVELOPING / NEEDS_SUPPORT)"]
        ReadinessEngine --> GapEngine["Skill Gap Diagnostics\n(4-Tier Match & Severity Classification)"]
    end

    subgraph Phase10_Eligibility["Phase 10: Declarative Job Eligibility"]
        JobDef["Declarative Job Requirements\n(Departments, Graduation Year, CGPA, Skills)"]
        EvalEngine["Two-Stage Eligibility Evaluator\n(Stage 1: Hard Criteria | Stage 2: Advisory Skills)"]
        Override["TPO Override Protocol\n(Mandatory Justification Audit)"]
        
        Snapshot --> EvalEngine
        JobDef --> EvalEngine
        EvalEngine --> EligibleResult["Result: ELIGIBLE / INELIGIBLE / NEEDS_REVIEW"]
        EvalEngine -.->|Exception Case| Override
    end
```

### 14.2 TPO Evidence Verification Subsystem & State Machine
- **The Core Rule**: The student candidate **NEVER self-verifies**. Student access to verification mutation endpoints yields `403 FORBIDDEN` (`STUDENT_CANNOT_SELF_VERIFY`). Full `VERIFIED` status remains the exclusive mandate of `TPO_ADMIN` and `COLLEGE_ADMIN`.
- **State Machine Transitions**:
  - `PENDING_REVIEW` $\rightarrow$ `VERIFIED`, `REJECTED`, `NEEDS_MORE_EVIDENCE`
  - `EVIDENCE_FOUND` $\rightarrow$ `VERIFIED`, `REJECTED`, `NEEDS_MORE_EVIDENCE`
  - `SELF_DECLARED` $\rightarrow$ `NEEDS_MORE_EVIDENCE`, `REJECTED` (Direct promotion to `VERIFIED` without physical/digital artifact is rejected with `400 BAD_REQUEST`)
  - `NEEDS_MORE_EVIDENCE` $\rightarrow$ `PENDING_REVIEW` (on student artifact resubmission), `REJECTED`
  - `REJECTED` $\rightarrow$ `PENDING_REVIEW` (on formal student appeal with updated evidence)
- **Immutable Verification Audit Ledger**: Every decision persists reviewer UUID, prior status, new status, timestamp, and justification reason to `skillVerificationReviews` and platform-wide `auditEvents`.
- **Reference**: Detailed in [docs/TPO_VERIFICATION_WORKFLOW.md](file:///Users/user/CarrerSync/docs/TPO_VERIFICATION_WORKFLOW.md).

### 14.3 Placement Readiness Intelligence Engine
- **Composite Scoring Formula**:
  $$S = 0.35 \cdot S_{\text{verified}} + 0.25 \cdot S_{\text{coverage}} + 0.20 \cdot S_{\text{project}} + 0.20 \cdot S_{\text{academic}}$$
- **Four Core Dimensions**:
  1. *Verified Skills Score* ($35\%$): Count and domain breadth of institutional `VERIFIED` competencies.
  2. *Evidence Coverage Score* ($25\%$): Ratio of evidence-backed skill claims to total claimed skills, penalizing uncorroborated resume stuffing.
  3. *Project Evidence Depth* ($20\%$): Evaluates code repositories, deployment links, and complexity of practical deliverables.
  4. *Academic & Assessment Score* ($20\%$): Normalized CGPA/percentage and internal technical assessment benchmarks.
- **Data Completeness Safeguard ($C$)**: Missing optional academic records produce $C < 1.00$ rather than a 0-point penalty. Profiles with $C < 0.40$ are categorized as `INSUFFICIENT_DATA` rather than prematurely penalizing students.
- **Categorization Matrix**:
  - $S \ge 80.0 \land C \ge 0.40 \implies \mathbf{READY}$
  - $60.0 \le S < 80.0 \land C \ge 0.40 \implies \mathbf{DEVELOPING}$
  - $S < 60.0 \land C \ge 0.40 \implies \mathbf{NEEDS\_SUPPORT}$
  - $C < 0.40 \implies \mathbf{INSUFFICIENT\_DATA}$
- **Advisory Policy**: The Readiness Score is explicitly an advisory benchmark of portfolio rigor. It is **never a guaranteed probability of placement**.
- **Reference**: Detailed in [docs/PLACEMENT_READINESS_ENGINE.md](file:///Users/user/CarrerSync/docs/PLACEMENT_READINESS_ENGINE.md).

### 14.4 Skill Gap Diagnostics Engine
- **Four-Tier Match Taxonomy**:
  1. `VERIFIED_MATCH`: Skill attested with institutional `VERIFIED` seal (100% credit).
  2. `EVIDENCE_MATCH`: Artifact-supported competency (`EVIDENCE_FOUND`) awaiting TPO review (75% credit).
  3. `PENDING_VERIFICATION`: Resume-extracted or self-declared claim lacking external artifact (35% credit).
  4. `MISSING_SKILL`: Zero recorded demonstration in profile (0% credit).
- **Gap Severity Classification**:
  - `CRITICAL`: Mandatory `requiredSkills` competency missing from profile.
  - `MODERATE`: Mandatory skill is unverified (`PENDING_VERIFICATION`), or preferred skill is missing.
  - `MINOR`: Preferred skill has pending evidence, or minor tool discrepancy.
- **Targeted Action Framework**: Every diagnosed gap outputs curated learning modules, concrete engineering project activities (e.g., containerizing an API, setting up Redis caching), and verification steps.
- **Reference**: Detailed in [docs/SKILL_GAP_DIAGNOSTICS.md](file:///Users/user/CarrerSync/docs/SKILL_GAP_DIAGNOSTICS.md).

### 14.5 Declarative Job Requirements & Eligibility Engine
- **Declarative Requirement Schema**: Stored in `jobRequirements` with structured criteria: `eligibleDepartments` (JSON), `graduationYear` (int), `minimumCgpa` (numeric), `requiredSkills` (JSON), `preferredSkills` (JSON), and `assessmentRequirements` (JSON).
- **Two-Stage Evaluation**:
  - *Stage 1 (Hard Criteria)*: Strict gating on Department, Cohort Graduation Year, and Minimum CGPA cutoff.
  - *Stage 2 (Competency Matching)*: Advisory skill gap evaluation comparing verified student skills against job competencies.
- **Missing Data Handling ("Missing Data Is Not Ineligibility")**: When CGPA or semester marks are unrecorded in the student database, the engine returns `NEEDS_REVIEW` or `INSUFFICIENT_DATA` rather than rejecting the student as `INELIGIBLE`.
- **TPO Override Protocol**: Institutional officers (`TPO_ADMIN`, `COLLEGE_ADMIN`) may override an evaluation with a mandatory documented justification string ($\ge 10$ characters), recorded immutably in `jobEligibilityEvaluations` and `auditEvents`.
- **Reference**: Detailed in [docs/JOB_ELIGIBILITY_ENGINE.md](file:///Users/user/CarrerSync/docs/JOB_ELIGIBILITY_ENGINE.md).

### 14.6 Relational Data Model Extensions (`server/src/db/schema.ts`)
Phase 10 extends the canonical PostgreSQL schema with tenant-isolated, foreign-key-constrained relational entities:
- **`skillVerificationReviews`**: Audit ledger tracking every TPO verification decision (`id`, `tenantId`, `studentId`, `evidenceId`, `reviewerId`, `previousStatus`, `newStatus`, `reason`, `reviewerNotes`, `createdAt`).
- **`studentReadinessSnapshots`**: Longitudinal snapshot ledger storing computed readiness (`id`, `tenantId`, `studentId`, `score`, `category`, `dimensions`, `explanation`, `dataCompleteness`, `calculatedAt`).
- **`jobRequirements`**: Declarative company recruitment specifications (`id`, `tenantId`, `companyName`, `jobTitle`, `jobDescription`, `eligibleDepartments`, `graduationYear`, `minimumCgpa`, `requiredSkills`, `preferredSkills`, `status`, `createdBy`).
- **`jobEligibilityEvaluations`**: Evaluation outcomes with rule-by-rule breakdowns (`id`, `tenantId`, `studentId`, `jobId`, `result`, `matchedRequirements`, `unmetRequirements`, `missingInformation`, `explanation`, `overriddenBy`, `overrideReason`, `evaluatedAt`).
- **Enums**: `readinessCategoryEnum` (`READY`, `DEVELOPING`, `NEEDS_SUPPORT`, `INSUFFICIENT_DATA`), `eligibilityResultEnum` (`ELIGIBLE`, `INELIGIBLE`, `NEEDS_REVIEW`, `INSUFFICIENT_DATA`), `recruitmentJobStatusEnum` (`DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED`).

### 14.7 Security Architecture & Privacy Safeguards
- **Anti-Spoofing Tenant Isolation**: Authoritative tenant ID extracted exclusively from verified Bearer JWT; header/query/body spoofing rejected with 403 `TENANT_SPOOFING_REJECTED`; queries scoped with `withTenantContext`.
- **5-Role RBAC Enforcement**: Strict server-side role gating separating `SUPER_ADMIN`, `COLLEGE_ADMIN`, `TPO_ADMIN`, `RECRUITER`, and `STUDENT`.
- **Zero Student Data Egress to AI**: All readiness calculations, gap diagnostics, and eligibility checks run locally in deterministic TypeScript with zero outbound network calls to external LLMs.
- **Recruiter View Limits**: Corporate recruiters have read access to readiness scores and verified badges, but internal TPO reviewer notes, correction requests, and disciplinary remarks are strictly redacted at the API boundary.
- **Reference**: Detailed in [docs/VERIFICATION_SECURITY_MODEL.md](file:///Users/user/CarrerSync/docs/VERIFICATION_SECURITY_MODEL.md).

---

## 15. Phase 10.1 — Security, Eligibility & Architecture Corrections

Phase 10.1 establishes rigorous correctness, fairness, and security enhancements to the Phase 10 foundations:

### 15.1 Strict Verification Authority & Delegation
- **Authoritative Reviewer**: Evidence verification decisions (`VERIFIED`, `REJECTED`, `NEEDS_MORE_EVIDENCE`) are restricted strictly to `TPO_ADMIN` and explicitly designated faculty review committees (`hasExplicitVerificationPermission: true`).
- **Defensive Role Blocking**: `COLLEGE_ADMIN` (without explicit reviewer delegation), `SUPER_ADMIN`, `RECRUITER`, and `STUDENT` are blocked with `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`).
- **Audit Logging**: Every transition records reviewer ID, actor email, prior/new status, mandatory justification reason, and timestamp in `skill_verification_reviews` and `audit_events`.

### 15.2 Two-Stage Eligibility Engine Fairness
- **Separation of Concerns**: Orthogonal separation of `administrativeEligibility` (`ELIGIBLE` | `INELIGIBLE` | `NEEDS_REVIEW`) from `skillMatchStatus` (`VERIFIED_MATCH` | `EVIDENCE_MATCH` | `PENDING_VERIFICATION` | `MISSING_SKILL` | `NOT_ASSESSED`) and `overallReviewStatus`.
- **Critical Fairness Invariant**: Missing skill evidence or unverified claims **never** mark a candidate administratively `INELIGIBLE`. When administrative criteria pass but skills are missing or pending, status is deterministically held as `NEEDS_REVIEW` with clear explanation: `"Administratively eligible; pending skill verification for required skills"`.
- **Recruiter Postings Gate**: Recruiter-created job postings default to `DRAFT` status and require explicit TPO activation before becoming active for student viewing or applications.

### 15.3 Generalized Dynamic Reweighting in Readiness Engine
- **Formula**: $S_{\text{adj}} = \frac{\sum_{i \in A} w_i S_i}{\sum_{i \in A} w_i}$ across active dimensions $A \subseteq \{\text{Verified Skills (0.35)}, \text{Coverage (0.25)}, \text{Projects (0.20)}, \text{Academics (0.20)}\}$.
- **Fairness Principle**: Missing optional records (academics, project artifacts) are omitted without scoring penalty by dynamically renormalizing available dimension weights.
- **Safeguard**: If completeness $< 0.40$ or available weight sum $< 0.40$, status is flagged as `INSUFFICIENT_DATA`.
- **Mandatory Placement Disclaimer**: Every generated explanation itemizes contributing and reweighted dimensions and explicitly states that readiness indicates profile preparedness and does not guarantee placement.

### 15.4 Canonical 5-Role Normalization Taxonomy
- Enforces canonical roles (`SUPER_ADMIN`, `COLLEGE_ADMIN`, `TPO_ADMIN`, `RECRUITER`, `STUDENT`) across all authentication, middleware, and route barriers via `server/src/utils/roles.ts`.
- Legacy token variants (`superadmin`, `admin`, `tpo`, `company`, etc.) are normalized safely with transparent backward compatibility.

### 15.5 Verified Non-Destructive Migrations
- Migration files generated into `server/drizzle/0000_shocking_echo.sql` via `drizzle-kit` under `server/drizzle.config.ts`.
- Zero destructive operations (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`). All 4 Phase 10 tables enforce tenant isolation, foreign keys, and indexes.

### 15.6 Reference Documentation
- [docs/PHASE_10_1_INITIAL_AUDIT.md](file:///Users/user/CarrerSync/docs/PHASE_10_1_INITIAL_AUDIT.md)
- [docs/PHASE_10_1_SECURITY_CORRECTIONS.md](file:///Users/user/CarrerSync/docs/PHASE_10_1_SECURITY_CORRECTIONS.md)
- [docs/PHASE_10_1_ELIGIBILITY_AND_READINESS.md](file:///Users/user/CarrerSync/docs/PHASE_10_1_ELIGIBILITY_AND_READINESS.md)
- [docs/PHASE_10_1_DATABASE_MIGRATION_AUDIT.md](file:///Users/user/CarrerSync/docs/PHASE_10_1_DATABASE_MIGRATION_AUDIT.md)
- [docs/PHASE_10_1_FINAL_REPORT.md](file:///Users/user/CarrerSync/docs/PHASE_10_1_FINAL_REPORT.md)

