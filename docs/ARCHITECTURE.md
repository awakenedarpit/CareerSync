# CarrerSync System Architecture

## 1. Executive Summary

**CarrerSync** is an Agentic Placement Intelligence Platform engineered to modernize collegiate campus hiring. It bridges the gap between student evidence, certified skills, industry demand, and campus recruitment workflows.

Traditional placements rely on unverified resumes, arbitrary GPA cutoffs, and spreadsheet chaos. CarrerSync establishes an **evidence-driven pipeline**:
```
Student Evidence (GitHub / Code Artifacts)
       │
       ▼
Verified Skill Graph (FalkorDB + MongoDB)
       │
       ▼
Industry Skill-Gap Analysis (Target Role Benchmarking)
       │
       ▼
Personalized Learning Paths (Remediation Milestones)
       │
       ▼
Placement Drive Orchestration (Rule-Based Shortlisting)
```

---

## 2. Technology Stack & Zero-Cost Policy

The architecture strictly adheres to a **₹0 budget** using enterprise-ready open source technologies and generous free tiers with zero credit card requirements:

| Component | Technology | Free Tier Strategy / Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7 | Vercel Hobby hosting, static CDN caching |
| **Backend** | Node.js, Express.js (REST API) | Render Free Web Service (or Railway free hobby) |
| **Database** | MongoDB Atlas (Mongoose ODM) | M0 Free Shared Cluster (512MB storage, free forever) |
| **Authentication** | JWT, bcryptjs | Stateless, zero external service dependency |
| **Graph Memory** | FalkorDB (Cypher / RedisGraph protocol) | Derived projection, runs local Docker or free cloud instance |
| **AI Layer** | Hybrid: Google Gemini Free Tier + Rule Fallback | 100% operational uptime via deterministic rule engines |

---

## 3. High-Level System Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │                 Client Tier                   │
                  │   React 19 + Tailwind CSS + React Router v7   │
                  │    - Student Intelligence Portal              │
                  │    - T&P Admin Command Center                 │
                  │    - Recruiter Talent Portal                  │
                  └───────────────────────┬───────────────────────┘
                                          │ HTTPS / REST API
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │                 Server Tier                   │
                  │             Express.js REST API               │
                  │    - Centralized Error & CORS Middleware      │
                  │    - Multi-Tenant Boundary Enforcement        │
                  │    - Health & Observability Endpoints         │
                  └───────┬───────────────┬───────────────┬───────┘
                          │               │               │
         Primary State    │               │ AI Boundary   │ Graph Memory
                          ▼               ▼               ▼
                   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                   │   MongoDB   │ │Hybrid Engine│ │  FalkorDB   │
                   │ Atlas (M0)  │ │Gemini + Rule│ │Graph Memory │
                   │  Canonical  │ │  Fallback   │ │  Derived    │
                   └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 4. Frontend & Backend Separation

- **Client (`/client`)**: Completely decoupled Single Page Application (SPA) bundled with Vite and Tailwind CSS v4. Communicates strictly with the backend via Axios with base URL configuration (`VITE_API_URL`).
- **Server (`/server`)**: Stateless Express REST API handling CORS, authentication, payload validation, business logic, and database access.

---

## 5. Multi-Tenant Isolation Architecture

A core architectural pillar is **strict multi-tenancy**:
- Every college or institution is a tenant identified by a unique `tenantId`.
- Every college-owned record across all collections contains a mandatory `tenantId`.
- Tenant isolation is strictly enforced at the backend database query level (e.g., `Model.find({ tenantId, ... })`), never relying on frontend filtering.
- Graph traversals inject `$tenantId` into every Cypher `MATCH` condition.

---

## 6. Authoritative Database vs. Graph Memory

### 6.1 MongoDB as the Canonical Store of Truth
MongoDB Atlas Free Tier stores authoritative institutional records across 11 planned collections:
1. `Users` (Authentication, credentials, roles)
2. `Students` (Academic profile, roll number, department)
3. `Evidence` (GitHub repositories, commits, code artifacts)
4. `Skills` (Standardized skill ontology)
5. `Projects` (Student projects and repositories)
6. `JobRequirements` (Recruiter hiring specifications)
7. `LearningPaths` (Skill remediation paths)
8. `Drives` (Placement drives and timelines)
9. `EligibilityRules` (Multi-factor eligibility criteria)
10. `EligibilityResults` (Deterministic evaluation logs)
11. `AuditLogs` (Tamper-proof compliance log)

### 6.2 FalkorDB Graph Memory as Derived Projection
- FalkorDB stores derived relational graph models (`(Student)-[:HAS_SKILL]->(Skill)`, `(Student)-[:HAS_GAP]->(SkillGap)`).
- **Rebuildability**: If FalkorDB crashes or is cleared, the full graph state can be completely rebuilt from MongoDB.
- **Graceful Fallback**: The backend boots and runs normally even if FalkorDB is offline.

---

## 7. AI Strategy & Zero-Cost Guarantees

The platform employs a **Hybrid AI Architecture**:
1. **Gemini API Free Tier**: Dispatches semantic tasks (code summarization, job specification decomposition) when quota is available.
2. **Deterministic Rule-Based Fallback**: Every AI task has an offline, rule-based equivalent:
   - *Student Profiling*: Regex & AST keyword taxonomy parser.
   - *Skill Gap Analysis*: Set-difference matching.
   - *Predictive Analytics*: Weighted multi-factor scoring formula.
   - *Orchestration*: Deterministic finite state machine.
3. **Core Immunity**: Authentication, authorization, student profile loading, and drive eligibility checking **never** invoke AI APIs.

---

## 8. Deployment Target Specifications

- **Frontend**: Vercel Hobby (zero-cost static build deployment).
- **Backend**: Render Free Web Service (`node server.js` on port `10000`/`$PORT`).
- **Database**: MongoDB Atlas M0 cluster (free tier, Frankfurt/Mumbai AWS region).
