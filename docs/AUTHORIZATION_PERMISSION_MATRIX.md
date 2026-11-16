# CareerSync Authorization & Role-Based Access Control (RBAC) Permission Matrix

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-16  
**Security Standard:** Multi-Tenant Role-Based Access Control (RBAC) + Tenant Isolation  
**Target Architecture:** Node.js Express API + Neon PostgreSQL + React Client  

---

## 1. Executive Overview

CareerSync enforces a strict, multi-tenant, defense-in-depth authorization model across all 6 platform roles:
1. **Super Admin** (`superadmin`): Cross-institutional platform operator with tenant lifecycle, system observability, and global administrative authority.
2. **College Admin** (`college_admin`): Institutional executive overseeing departments, invitations, campus-wide placement policies, and tenant users.
3. **TPO Admin** (`tpo_admin` / `admin`): Training & Placement Officer managing recruitment drives, candidate shortlisting, verification queues, and mock drives.
4. **Recruiter** (`recruiter`): Corporate hiring partner defining job roles, viewing verified candidate profiles, conducting drive rounds, and issuing offers.
5. **Student** (`student`): Candidate learner claiming skills, uploading proof-of-work evidence, taking mock interviews, and applying for placement drives.
6. **Alumni** (`alumni`): Institutional graduate conducting mentorship sessions and peer mock interviews with current students.

---

## 2. Token Claims & Role Encoding

Every authenticated request carries an `Authorization: Bearer <JWT>` header verified with `HS256`. The decoded token payload contains:

```json
{
  "sub": "usr_94b15c92-d04b-4861-8ee4-2a6c0b9a3041",
  "tenant_id": "ten_c7802871-38e9-4e5b-b9ce-089c8a9ef712",
  "role": "student",
  "email": "aditya.sharma@apex.edu",
  "hasVerificationPermission": false,
  "isDelegatedReviewer": false,
  "iat": 1700000000,
  "exp": 1700007200
}
```

### Authorization Rules:
- **No Client-Controlled Headers**: Client cannot override `tenant_id`, `user_id`, or `role` via headers (`x-tenant-id`, `x-role`, etc.). All identity context is derived strictly from the cryptographically verified JWT.
- **Tenant Isolation**: Non-superadmin users have queries scoped to `WHERE tenant_id = req.user.tenantId`.
- **Super Admin Bypass**: Super Admin possesses a null/platform tenant ID and can access multi-tenant reporting.

---

## 3. End-to-End API Permission Matrix

| Endpoint Route | HTTP Method | Minimum Role Required | Middleware Applied | Tenant Scoped? | Description & Constraints |
| :--- | :---: | :---: | :--- | :---: | :--- |
| **Authentication & Registration** | | | | | |
| `/api/v1/auth/register` | `POST` | Public | None | Dynamic | Self-registration limited to `student`. Privileged roles require invitation token. |
| `/api/v1/auth/login` | `POST` | Public | Rate Limiter | Dynamic | Authenticates against PostgreSQL `users` table via bcrypt. |
| `/api/v1/auth/me` | `GET` | Authenticated | `authenticateToken` | ✅ | Returns profile and permissions of authenticated user. |
| `/api/v1/auth/logout` | `POST` | Authenticated | `authenticateToken` | ✅ | Revokes client session. |
| **Tenant Lifecycle (Super Admin Only)** | | | | | |
| `/api/v1/tenants` | `GET` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Lists all active and pending institutional tenants. |
| `/api/v1/tenants` | `POST` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Provisions a new college tenant with domain isolation. |
| `/api/v1/tenants/:id` | `GET` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Fetches tenant configuration and subscription status. |
| `/api/v1/tenants/:id` | `PATCH` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Updates tenant status (active, suspended). |
| **Super Admin Platform Operations** | | | | | |
| `/api/v1/super-admin/stats` | `GET` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Returns global platform health, user count, tenant metrics (HTTP 200). |
| `/api/v1/super-admin/colleges` | `GET` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Lists colleges for management. |
| `/api/v1/super-admin/users` | `POST` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | Out-of-band creation of authorized test/administrative accounts. |
| `/api/v1/super-admin/audit-logs` | `GET` | `superadmin` | `authenticateToken`, `requireRole(['superadmin'])` | ❌ (Global) | System-wide compliance and security audit logs. |
| **College Admin Institutional Governance** | | | | | |
| `/api/v1/college-admin/departments` | `GET`, `POST` | `college_admin` | `authenticateToken`, `requireRole(['college_admin', 'superadmin'])` | ✅ | Manages college academic departments and branches. |
| `/api/v1/college-admin/invitations` | `POST` | `college_admin` | `authenticateToken`, `requireRole(['college_admin', 'superadmin'])` | ✅ | Generates cryptographic single-use invitation tokens for faculty/TPO. |
| `/api/v1/college-admin/users` | `GET` | `college_admin` | `authenticateToken`, `requireRole(['college_admin', 'superadmin'])` | ✅ | Lists all users registered within the college tenant. |
| `/api/v1/institutional/accreditation` | `GET` | `college_admin` | `authenticateToken`, `requireRole(['college_admin', 'tpo_admin'])` | ✅ | NAAC/NIRF accreditation analytics and report downloads. |
| **TPO Placement Drive & Verification Management** | | | | | |
| `/api/v1/tpo/drives` | `GET`, `POST` | `tpo_admin` | `authenticateToken`, `requireRole(['tpo_admin', 'college_admin'])` | ✅ | Creates and configures campus placement drives. |
| `/api/v1/tpo/drives/:id/status` | `PATCH` | `tpo_admin` | `authenticateToken`, `requireRole(['tpo_admin'])` | ✅ | Transitions drive stages (announced, active, closed). |
| `/api/v1/tpo/verification-queue` | `GET` | `tpo_admin` | `authenticateToken`, `requireRole(['tpo_admin', 'faculty_coordinator'])` | ✅ | Lists pending student proof-of-work evidence for vetting. |
| `/api/v1/tpo/verify-evidence` | `POST` | `tpo_admin` | `authenticateToken`, `requireRole(['tpo_admin', 'faculty_coordinator'])` | ✅ | Approves or rejects student skill evidence records. |
| `/api/v1/tpo/mock-drives` | `GET`, `POST` | `tpo_admin` | `authenticateToken`, `requireRole(['tpo_admin'])` | ✅ | Configures AI mock interview and coding test drives. |
| **Recruiter Candidate Discovery & Offers** | | | | | |
| `/api/v1/recruiter/job-roles` | `GET`, `POST` | `recruiter` | `authenticateToken`, `requireRole(['recruiter'])` | ✅ | Defines hiring roles and skill proficiency criteria. |
| `/api/v1/recruiter/shortlists` | `GET`, `POST` | `recruiter` | `authenticateToken`, `requireRole(['recruiter'])` | ✅ | Discovers verified candidates meeting eligibility criteria. |
| `/api/v1/recruiter/interviews` | `POST` | `recruiter` | `authenticateToken`, `requireRole(['recruiter'])` | ✅ | Schedules technical and HR interview rounds. |
| `/api/v1/recruiter/offers` | `POST` | `recruiter` | `authenticateToken`, `requireRole(['recruiter'])` | ✅ | Releases binding placement offers to candidates. |
| **Student Self-Service & Readiness** | | | | | |
| `/api/v1/students/me` | `GET` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Returns student profile, readiness score, radar dimensions. |
| `/api/v1/students/me/profile` | `PATCH` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Updates contact info, GitHub, LinkedIn, portfolio links. |
| `/api/v1/students/me/skills` | `POST` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Claims a skill and links proof-of-work evidence artifacts. |
| `/api/v1/students/me/applications` | `GET`, `POST` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Applies to eligible placement drives; tracks application status. |
| `/api/v1/student/learning-path` | `GET` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Fetches personalized remediation modules and challenges. |
| `/api/v1/student/mock-drives` | `GET` | `student` | `authenticateToken`, `requireRole(['student'])` | ✅ | Participates in mock aptitude, coding sandbox, and AI interviews. |
| **Alumni Mentorship & Collaboration** | | | | | |
| `/api/v1/alumni/profile` | `GET`, `PATCH` | `alumni` | `authenticateToken`, `requireRole(['alumni'])` | ✅ | Manages alumni company, designation, and bio. |
| `/api/v1/alumni/availability` | `GET`, `POST` | `alumni` | `authenticateToken`, `requireRole(['alumni'])` | ✅ | Defines open 1:1 mentorship consultation slots. |
| `/api/v1/mentorship/requests` | `GET`, `POST` | `student` / `alumni`| `authenticateToken` | ✅ | Student requests session; alumni accepts or declines. |
| `/api/v1/peer-interviews` | `GET`, `POST` | `student` / `alumni`| `authenticateToken` | ✅ | Joins WebRTC peer mock interview sessions. |

---

## 4. Frontend Role-Based Route Protection Matrix

The client application (`client/src/routes/AppRoutes.jsx`) implements client-side route guards matching backend permissions:

| Client Path | Permitted Roles | Unauthorized Redirect | Key View Component |
| :--- | :--- | :--- | :--- |
| `/super-admin/*` | `superadmin` | `/login` (or `/unauthorized`) | `SuperAdminDashboard`, `CollegeManagement`, `UserManagement` |
| `/college-admin/*` | `college_admin`, `superadmin` | `/login` | `CollegeAdminDashboard`, `InstitutionalIntelligence` |
| `/admin/*` | `tpo_admin`, `admin`, `superadmin` | `/login` | `TpoDashboard`, `PlacementDrives`, `VerificationPortal` |
| `/recruiter/*` | `recruiter` | `/login` | `RecruiterDashboard`, `CandidateDiscovery`, `JobPostings` |
| `/student/*` | `student` | `/login` | `StudentDashboard`, `SkillsEvidence`, `StudentProfileEdit` |
| `/alumni/*` | `alumni` | `/login` | `AlumniDashboard`, `MentorshipHub`, `PeerInterviews` |

---

## 5. Security & Isolation Controls

1. **Defense-in-Depth**: Client-side route guards provide responsive UX, but server-side Express middleware (`authenticateToken` + `requireRole()`) independently evaluates every HTTP request.
2. **Tenant Scoping in ORM**: All database queries enforce tenant isolation via Drizzle:
   ```ts
   and(eq(schema.students.tenantId, req.user.tenantId), eq(schema.students.userId, req.user.id))
   ```
3. **Database RLS Session Context**: In transactional multi-tenant operations, `withTenantContext(tenantId, callback)` sets `SET LOCAL app.current_tenant_id` on the PostgreSQL connection session.
4. **IDOR Prevention**: Student endpoints strictly access student records tied to `req.user.id` or `req.user.studentId`. Cross-student reading or modification throws HTTP 403 Forbidden.
