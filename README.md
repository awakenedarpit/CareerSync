# CarrerSync — Agentic Placement Intelligence Platform

> Transforming collegiate campus placements through evidence-based skill profiles, graph memory, and multi-agent hiring orchestration.

---

## 1. Project Overview

**CarrerSync** is a full-stack MERN application engineered to eliminate the fundamental inefficiencies of traditional campus placements: resume exaggeration, arbitrary CGPA-only filtering, spreadsheet chaos, and lack of actionable student guidance.

The platform establishes an end-to-end evidence-based pipeline:
$$\text{Student Evidence} \longrightarrow \text{Verified Skill Profile} \longrightarrow \text{Skill-Gap Analysis} \longrightarrow \text{Learning Path} \longrightarrow \text{Placement Workflow}$$

### Multi-Stakeholder Support
- **Students**: Connect inspectable GitHub evidence, verify authentic competencies, view target-role skill gaps, and track drive eligibility.
- **T&P Admins**: Automate drive eligibility, eliminate spreadsheet tracking, and monitor cohort readiness.
- **Recruiters**: Access pre-verified candidate shortlists backed by authentic code proofs of work.

---

## 2. Technology Stack & Zero-Cost Policy

CarrerSync is engineered under a **strict ₹0 budget policy**. All services leverage open-source packages, permanent free tiers, or offline-capable fallback modes.

- **Frontend**:
  - React 19
  - Vite
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - React Router v7 (`react-router-dom`)
  - Axios
  - Lucide React
- **Backend**:
  - Node.js (LTS v24)
  - Express.js v5 (REST API architecture)
  - Mongoose ODM v9
  - CORS, Dotenv
  - JWT (`jsonwebtoken`), `bcryptjs`
- **Database**:
  - MongoDB Atlas M0 Free Tier (Canonical source of truth)
- **Graph Memory (Future)**:
  - FalkorDB (Cypher / RedisGraph protocol - derived, rebuildable projection)
- **AI Architecture**:
  - Google Gemini Free Tier (for semantic tasks when quota is available)
  - Deterministic rule-based fallbacks (for 100% offline uptime)
- **Hosting Targets**:
  - Frontend: Vercel Hobby
  - Backend: Render Free Web Service
  - Database: MongoDB Atlas Free Tier

---

## 3. Project Directory Structure

```
CarrerSync/
│
├── client/                               # Frontend Single Page Application
│   ├── public/
│   │   └── favicon.svg                   # Branded vector favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                   # Reusable UI primitives
│   │   │   │   ├── Button.jsx            # Button supporting Link and button
│   │   │   │   ├── SectionHeading.jsx    # Section header with badge & gradients
│   │   │   │   ├── FeatureCard.jsx       # Problem & Solution feature card
│   │   │   │   └── AgentCard.jsx         # 4 Agent showcase card with fallback info
│   │   │   └── layout/
│   │   │       ├── Navbar.jsx            # Responsive header with live API badge
│   │   │       └── Footer.jsx            # SaaS footer with architecture links
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx            # Main app shell with outlet
│   │   ├── pages/
│   │   │   ├── landing/                  # Landing page (Hero, Problem, Solution,
│   │   │   │   └── LandingPage.jsx       # Agents, Workflow, Audiences)
│   │   │   ├── auth/                     # Onboarding & persona selector previews
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── student/                  # Student portal preview
│   │   │   │   └── StudentPreview.jsx
│   │   │   ├── admin/                    # T&P Admin command center preview
│   │   │   │   └── AdminPreview.jsx
│   │   │   └── recruiter/                # Recruiter talent pipeline preview
│   │   │       └── RecruiterPreview.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx             # React Router v7 routes & 404 fallback
│   │   ├── services/
│   │   │   ├── api.js                    # Axios instance with interceptors
│   │   │   └── health.service.js         # Backend /api/health client
│   │   ├── App.jsx                       # BrowserRouter wrapper
│   │   ├── index.css                     # Tailwind CSS v4 entrypoint
│   │   └── main.jsx                      # Vite entrypoint
│   ├── index.html                        # Branded HTML entrypoint
│   ├── vite.config.js                    # Vite 6 + Tailwind 4 config
│   └── package.json
│
├── server/                               # Backend REST API Service
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                    # Environment validation & defaults
│   │   │   └── db.js                     # Reusable, non-blocking Mongoose connection
│   │   ├── controllers/
│   │   │   └── health.controller.js      # GET /api/health implementation
│   │   ├── middleware/
│   │   │   ├── error.middleware.js       # Centralized error handler (masked in prod)
│   │   │   └── notFound.middleware.js    # Uniform 404 handler
│   │   ├── models/
│   │   │   └── index.js                  # 11 planned collections & tenant isolation
│   │   ├── routes/
│   │   │   ├── api.routes.js             # Base /api router
│   │   │   └── health.routes.js          # Health check router
│   │   ├── services/
│   │   │   └── ai.service.js             # Hybrid Gemini / deterministic boundary
│   │   ├── agents/                       # 4 AI Agent interfaces with rule fallbacks
│   │   │   ├── student-profiling/
│   │   │   ├── industry-skill-gap/
│   │   │   ├── predictive-analytics/
│   │   │   └── placement-orchestration/
│   │   ├── memory/                       # FalkorDB graph integration boundary
│   │   │   ├── graph.service.js
│   │   │   ├── graph.schema.js
│   │   │   ├── graph.sync.js
│   │   │   ├── context.retriever.js
│   │   │   ├── memory.permissions.js
│   │   │   └── memory.audit.js
│   │   ├── utils/
│   │   │   └── logger.js                 # Timestamped console logger
│   │   └── app.js                        # Express application configuration
│   ├── server.js                         # Server listener & graceful shutdown
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md                   # System design, multi-tenancy & graph
│   ├── API.md                            # Endpoints, request/response samples
│   └── DEVELOPMENT_STATUS.md             # Verified milestone progress tracker
│
├── .env.example                          # Environment template
├── .gitignore                            # Secrets & dependency exclusions
└── README.md
```

---

## 4. Local Development Setup

### Prerequisites
- **macOS** or Linux / Windows with Node.js
- **Node.js**: v20+ LTS (Tested on v24.21.0)
- **npm**: v10+ (Tested on v11.19.0)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd CarrerSync
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   *Note: `MONGODB_URI` and `GEMINI_API_KEY` are optional during initial startup. The server will boot normally and report disconnected state without crashing.*

3. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

---

## 5. Running the Application

Open two terminal windows:

### Terminal 1 — Start Backend Server
```bash
cd server
npm run dev
```
- Server starts at `http://localhost:5000`
- Live Health Check: `http://localhost:5000/api/health`

### Terminal 2 — Start Frontend Application
```bash
cd client
npm run dev
```
- Client starts at `http://localhost:5173`
- Open your browser to explore the CarrerSync landing page and portal previews.

---

## 6. Build & Verification Commands

### Frontend Production Build
```bash
cd client
npm run build
```
Generates optimized production assets in `client/dist`.

### Backend Production Start
```bash
cd server
npm start
```

### Health Check Verification
```bash
curl http://localhost:5000/api/health
```
Expected output:
```json
{
  "success": true,
  "message": "CarrerSync API is running",
  "database": "disconnected"
}
```

---

## 7. Current Implementation Status (Phase 1 Complete)

| Component | Status | Details |
| :--- | :--- | :--- |
| **Monorepo Architecture** | **COMPLETED** | Decoupled client and server directories |
| **Backend API Foundation** | **COMPLETED** | Express 5, CORS, centralized errors, 404 handler |
| **Health Check API** | **COMPLETED** | GET `/api/health` with dynamic DB status |
| **MongoDB Service** | **COMPLETED** | Non-blocking Mongoose connection service |
| **Multi-Tenant Models Blueprint** | **COMPLETED** | 11 collections planned with mandatory `tenantId` |
| **Graph Memory Boundary** | **COMPLETED** | 6 FalkorDB modules under `server/src/memory/` |
| **Hybrid AI Service Boundary** | **COMPLETED** | Zero-cost guarantee with deterministic fallbacks |
| **4 Agent Interfaces** | **COMPLETED** | Profiling, Skill-Gap, Predictive, Orchestration |
| **Frontend Foundation** | **COMPLETED** | React 19 + Tailwind CSS v4 + React Router v7 |
| **Landing Page UI** | **COMPLETED** | Hero, Problem, Solution, Agents, Workflow, Audiences |
| **Portal Previews** | **COMPLETED** | Student, Admin, Recruiter, and Auth previews |
| **Documentation Suite** | **COMPLETED** | README, ARCHITECTURE, API, DEVELOPMENT_STATUS |

---

## 8. License & Zero-Cost Guarantee

Built with 100% free and open-source software under the ISC / MIT licenses. No credit cards or paid services required.
