# CarrerSync — Platform Known Limitations & Phase 19 Technical Debt Ledger
## Transparent Architectural Disclosure, Persistence Boundaries, and Planned Phase 19 Remediations

**Document Version:** 1.0.0  
**Audit Scope:** Active Platform Baseline (Phases 01 through 18)  
**Date:** November 16, 2026  
**Auditor / QA Lead:** `@p18-qa`  
**Classification:** Technical Architecture & Roadmap  

---

## 1. Executive Summary & Philosophy of Transparency

In accordance with CarrerSync engineering principles, this document provides an honest, rigorous, and transparent catalog of active platform limitations, technical debt, and architectural trade-offs present at the conclusion of Phase 18.

CarrerSync features a robust core: 106 normalized PostgreSQL relational tables, 72 database enums, 1,060 passing automated tests across 5 tiers, and an Express 5 runtime free of vendor lock-in. However, specific subsystems rely on in-memory representations or free-tier cloud constraints that must be understood by operators and will be systematically addressed in **Phase 19: End-to-End Database Wiring & Cloud Hardening**.

---

## 2. Active Technical Limitations & Persistence Boundaries

### 2.1 In-Memory Service Repositories in Phases 13, 14, and 17
- **Current State:** 
  The relational schemas for Phase 13 (Industry Intelligence), Phase 14 (Predictive Analytics), and Phase 17 (Institutional Governance, Fairness, Accreditation, and Recruiter Outreach) are fully declared in `server/src/db/schema.ts` and generated in migrations `0005_nappy_ego.sql`, `0006_previous_eternity.sql`, and `0007_hot_human_fly.sql`.
  However, the active runtime services (`industry-skill-intelligence.service.ts`, `predictive-analytics.service.ts`, `institutional-kpi.service.ts`, `cohort-skill-intelligence.service.ts`, `fairness-governance.service.ts`, `accreditation-reporting.service.ts`, and `recruiter-outreach.service.ts`) currently initialize and operate over **in-memory data structures (`new Map<string, ...>()`)**.
- **Impact:** 
  On local development or continuous processes, these modules function with 100% test coverage. However, if the hosting container restarts or spins down, dynamic mutations (such as customized outreach campaigns or newly created training interventions) revert to server boot seed states.
- **Phase 19 Remediation Plan:** 
  Wire all in-memory repository methods to direct Drizzle ORM SQL queries (`getDb().insert(...)`, `getDb().select(...)`) to persist across container lifecycles.

---

### 2.2 Render Free-Tier Web Service Cold Starts & Idle Spin-Down
- **Current State:** 
  Under the strict ₹0 budget architecture, the backend runs on Render's free compute tier. Render spins down web services after 15 minutes of zero incoming HTTP traffic.
- **Impact:** 
  The first user request after an idle period incurs a **30 to 50 second wake latency** while the Linux container provisions and starts. In addition, Neon PostgreSQL serverless compute unpauses with a ~500ms latency.
- **Mitigation / Workaround:** 
  Operators can configure an external ₹0 uptime monitor (e.g., Cron-Job.org or UptimeRobot) to ping `GET /health` every 10 minutes during institutional working hours (08:00–18:00 IST) to keep the container warm.

---

### 2.3 Ephemeral Local Filesystem Storage on Free Containers
- **Current State:** 
  The default configuration uses `STORAGE_ENGINE=local`, which writes uploaded student certificates, resumes, and evidence files to `server/uploads/` on the local container disk.
- **Impact:** 
  Render free web service disks are **ephemeral**. Whenever Render restarts or redeploys the container, all locally stored files on disk are cleared (though file metadata in PostgreSQL `documents` table remains intact).
- **Production Solution:** 
  In production deployments, operators must configure an S3-compatible cloud bucket (e.g., Cloudflare R2 cardless free tier, Backblaze B2, or AWS S3 free tier) by setting `STORAGE_ENGINE=s3_compatible` along with `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.

---

### 2.4 Frontend Mock Binding in Super Admin & Recruiter Portals
- **Current State:** 
  While the backend Express routes for Super Admin (`/api/v1/super-admin/*`) and Recruiter Orchestration (`/api/v1/recruiter/*`, `/api/v1/jobs/*`) are fully functional with 56+ passing automated tests, several frontend components in `client/src/pages/superadmin/` and `client/src/pages/recruiter/` still bind to hardcoded initial state fixtures rather than calling Axios API methods.
- **Impact:** 
  Users viewing the Super Admin portal or Recruiter portal in the browser see synthetic sample records that do not immediately reflect database mutations created via API tools like Postman or cURL.
- **Phase 19 Remediation Plan:** 
  Refactor client-side portal components to replace static default state with standard React `useEffect` hooks consuming `superAdminService.js` and `recruiterService.js`.

---

### 2.5 Single-Node Realtime WebSockets & Peer Audio/Video Signaling
- **Current State:** 
  The Phase 16 Realtime Collaboration Engine (`websocket.server.ts`) runs as an in-process Node.js `ws` server on port 5050.
- **Impact:** 
  WebSocket rooms, study pods, and WebRTC peer signaling are bound to the specific server memory instance. This architecture operates smoothly on single-instance Render deployments but cannot scale horizontally across multiple container instances without a centralized publish/subscribe bus.
- **Future Roadmap:** 
  Integrate an Upstash Redis (free tier) pub/sub backplane to synchronize WebSocket broadcasts across multiple scaled worker instances.

---

### 2.6 Outbound Recruiter Outreach Relies on CSV Mail Merge (No Direct SMTP)
- **Current State:** 
  To enforce the strict ₹0 budget policy and prevent accidental spam or credit card billing from external email APIs (SendGrid, Mailgun, AWS SES), Phase 17 implements outreach via **Instant CSV Mail Merge Export**.
- **Impact:** 
  The system generates personalized recruiter outreach messages with resolved dynamic tokens (`{{company_name}}`, `{{batch_year}}`), but TPOs must import the exported CSV into their institutional email client (Outlook, Gmail Mail Merge) rather than dispatching directly with one click from the UI.
- **Future Roadmap:** 
  Provide optional institutional SMTP configuration enabling universities to supply their own campus relay servers.

---

### 2.7 Frontend Vite Production Bundle Chunk Size
- **Current State:** 
  The client application compiles cleanly to `client/dist/`, but Vite emits a warning:
  `(!) Some chunks are larger than 500 kB after minification: dist/assets/index-C9FA3lkn.js (2,053 kB / 527 kB gzip)`.
- **Impact:** 
  Initial page load downloads a single large JavaScript bundle. While cached efficiently after the first visit, slower 3G mobile networks may experience initial render delay.
- **Phase 19 Remediation Plan:** 
  Implement dynamic code splitting using `React.lazy()` and `Suspense` across portal routes (`/student/*`, `/admin/*`, `/recruiter/*`, `/superadmin/*`).

---

## 3. Platform Technical Debt & Remediation Summary

| Component | Current Implementation | Active Limitation | Planned Phase 19 Resolution |
| :--- | :--- | :--- | :--- |
| **Phases 13, 14, 17 Data** | In-Memory `Map<string, ...>` | Does not survive container restarts | Wire Drizzle ORM SQL queries to PostgreSQL tables |
| **Render Web Service** | Free-tier container | 30–50s cold-start latency after 15m idle | Configure 10-minute ₹0 HTTP uptime ping |
| **Document Storage** | Local container filesystem | Ephemeral disk resets on deployment | Deploy S3-compatible cloud storage bucket |
| **Super Admin / Recruiter UI**| Synthetic mock UI state | Visuals decoupled from live API | Connect Axios services in React components |
| **WebSocket Engine** | In-process `ws` server | Limited to single container instance | Add Upstash Redis free-tier pub/sub broker |
| **Recruiter Campaigns** | CSV Mail Merge Export | Requires manual email client merge | Add campus institutional SMTP connector |
| **Client JS Bundle** | Monolithic 2.05MB chunk | Sub-optimal initial mobile load | Code-split routes via `React.lazy()` |

---

## 4. Conclusion & Stop Condition Confirmation

These limitations reflect deliberate, disciplined engineering trade-offs made to deliver an enterprise-grade platform while adhering 100% to the strict ₹0 zero-cost mandate and Zero Cloudflare policy. 

**Stop Condition Notice**: Per project governance directives, all work for Phase 18 is complete. **Phase 19 has NOT been started.**
