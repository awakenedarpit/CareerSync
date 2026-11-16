# Phase 17 — Institutional Intelligence & Placement KPI Engine

## 1. Executive Overview

Phase 17 delivers CarrerSync's **Institutional Intelligence & Placement KPI Suite**, transforming multi-tenant placement operations into an empirical, explainable, and audit-grade analytics platform. Designed specifically for Training & Placement Officers (TPOs), College Principals, and Deans, this system eliminates opaque metrics, synthetic figures, and ungrounded claims, ensuring all institutional insights trace directly to verified database rows.

Every key performance indicator (KPI) produced by the platform exposes its exact mathematical numerator, denominator, sample size ($N$), observation count, and data quality classification. When historical or cohort data is sparse ($N < 5$), the platform enforces small-group suppression and returns explicit `INSUFFICIENT_DATA` status rather than fabricating misleading percentages.

---

## 2. Core Mathematical Formulations & KPIs

### 2.1 Empirical Placement Rate

Placement rates across traditional portals frequently distort reality by altering the denominator (e.g., counting only registered students who attended interviews, or omitting students placed off-campus). CarrerSync enforces a strict, transparent formulation:

$$\text{Placement Rate (\%)} = \left( \frac{N_{\text{placed}}}{N_{\text{eligible}}} \right) \times 100$$

Where:
- $N_{\text{placed}}$: Count of eligible students holding at least one confirmed placement offer within the reporting period.
- $N_{\text{eligible}}$: Total cohort population minus students formally declared ineligible (e.g., opting exclusively for higher studies, family business, military service, or failing minimum institutional attendance/academic clearance thresholds).
- **Rule**: $N_{\text{eligible}} \le N_{\text{total\_enrolled}}$. Ineligible students are never counted in the placement denominator, ensuring fair assessment of placement efficiency.
- **Data Quality Gate**: Requires $N_{\text{eligible}} \ge 5$ for `SUFFICIENT_DATA`. When $N_{\text{eligible}} < 5$, `status = INSUFFICIENT_DATA` is emitted.

### 2.2 Verified Skill Coverage

Measures the proportion of the student body possessing empirically verified, evidence-backed competencies (distinguishing verified skills from self-declared claims):

$$\text{Verified Skill Coverage (\%)} = \left( \frac{N_{\text{students\_with\_verified\_skills}}}{N_{\text{total\_enrolled}}} \right) \times 100$$

$$\text{Average Verified Skills Per Student} = \frac{\sum_{i=1}^{N_{\text{total\_enrolled}}} \text{VerifiedSkillCount}_i}{N_{\text{total\_enrolled}}}$$

- **Verification Standard**: A skill is only counted as verified if it is confirmed via TPO faculty review, automated coding assessment with AST validation, or approved external credentialing.
- **Status**: Requires $N_{\text{total\_enrolled}} \ge 5$.

### 2.3 Skill-Gap Closure Rate

Measures how effectively training interventions and student upskilling resolve previously diagnosed industry skill deficits:

$$\text{Skill-Gap Closure Rate (\%)} = \left( \frac{N_{\text{closed\_gaps}}}{N_{\text{total\_identified\_gaps}}} \right) \times 100$$

- **Audit Grounding**: Diagnosed through mock assessments and recruiter JD requirements (Phase 12 & Phase 13). A gap is classified as closed only when the student submits demonstrable project evidence verified by institutional reviewers.

### 2.4 Shortlist-to-Offer Conversion Ratio

Measures drive-level conversion efficiency from initial shortlist publication to final job offer:

$$\text{Shortlist-to-Offer Ratio (\%)} = \left( \frac{N_{\text{offers\_secured}}}{N_{\text{candidates\_shortlisted}}} \right) \times 100$$

- Tracks recruiter drop-off and interview pass-through rates across corporate hiring pipelines.

### 2.5 Time-to-Shortlist

Quantifies the velocity of recruiter review cycles, tracking latency from campus drive launch to shortlist announcement:

$$\text{Time-to-Shortlist (Days)} = \frac{1}{M} \sum_{d=1}^{M} \left( \text{Timestamp}_{\text{shortlist\_published}, d} - \text{Timestamp}_{\text{drive\_launched}, d} \right)$$

- Reports both arithmetic **mean** and **median** days to safeguard against skew from protracted recruitment cycles. Minimum $M \ge 3$ drives required for statistical sufficiency.

### 2.6 Explainable Recruiter Engagement Score

The platform computes a normalized index (0–100) reflecting institutional recruiter relationship strength and campus appeal. The formula is fully transparent:

$$\text{Engagement Score} = (S_{\text{active}} \times 0.25) + (S_{\text{drives}} \times 0.20) + (S_{\text{participation}} \times 0.20) + (S_{\text{feedback}} \times 0.15) + (S_{\text{conversion}} \times 0.20)$$

Component breakdown:
1. **Active Recruiters (Weight: 25%)**: Ratio of active hiring partners participating in the current season relative to target benchmark.
2. **Drives Conducted (Weight: 20%)**: Normalized volume of campus selection drives hosted.
3. **Student Participation (Weight: 20%)**: Proportion of eligible students participating in scheduled drives.
4. **Feedback Completion Rate (Weight: 15%)**: Timely completion of post-interview feedback and candidate rubrics by recruiters.
5. **Offer Conversion Rate (Weight: 20%)**: Efficiency of drives culminating in verified offers extended.

---

## 3. Data Quality Observability & Privacy Safeguards

### 3.1 Status Enums and Safeguards
All KPI outputs include a `dataQuality` indicator with the following attributes:
- `reportingPeriod`: Active filter parameters (batch year, academic year, department, program).
- `lastUpdated`: ISO-8601 timestamp of data computation.
- `observationCount`: Cumulative total of underlying entities evaluated.
- `completenessScore`: Multi-factor completeness score (0–100).
- `status`: `SUFFICIENT_DATA` or `INSUFFICIENT_DATA`.
- `warnings`: Explanatory advisories on missing filters, small sample sizes, or sparse cohorts.
- `zeroFabricatedDataGuaranteed`: Explicit boolean guarantee (`true`) confirming no synthetic extrapolation occurred.

### 3.2 Small-Group Suppression ($N < 5$)
In compliance with international educational privacy standards (FERPA / GDPR / DPDP), any group, branch, or sub-cohort where observation count $N < 5$ is suppressed from public and aggregate comparison tables. Statistical ratios are rendered as `null` with explicit `INSUFFICIENT_DATA` warnings, preventing deanonymization of individual students.

---

## 4. Architecture and Service Implementation

The institutional intelligence backend is housed in `server/src/institutional/`:
- **`institutional-kpi.service.ts`**: Implements singleton `InstitutionalKpiService`, computing empirical KPIs, departmental breakdowns, recruiter engagement metrics, and data quality indicators.
- **`institutional.types.ts`**: TypeScript contracts defining metric structures, denominators, data quality states, and filter parameters.
- **REST Routes (`server/src/routes/institutional.routes.ts`)**:
  - `GET /api/v1/tpo/institutional/overview`: Full institutional KPI snapshot.
  - `GET /api/v1/tpo/institutional/cohort`: Longitudinal student support and cohort breakdown.
  - `GET /api/v1/tpo/institutional/skills`: Interactive skill coverage heatmaps.
  - `GET /api/v1/tpo/institutional/placements`: Placement rate and funnel analytics.
  - `GET /api/v1/tpo/institutional/recruiters`: Recruiter engagement score and drive stats.
  - `GET /api/v1/college-admin/institutional/overview`: High-level institutional executive view for College Admins and Superadmins.

---

## 5. Frontend Dashboard Experience

The frontend UI is implemented in `client/src/pages/tpo/InstitutionalIntelligence.jsx` and serviced by `client/src/services/institutionalService.js`:
- **Executive Metric Cards**: Dynamic cards showing placement rate, verified skill coverage, gap closure, shortlist-to-offer ratio, time-to-shortlist, and recruiter engagement. Each card displays explicit numerators, denominators ($N$), and formula inspector tooltips.
- **Filter Toolbar**: Multi-dimensional filtering across Academic Year, Graduation Batch, Department, and Placement Season.
- **Departmental Placement Ledger**: Granular table breaking down eligible students, placed students, placement percentage, and verified skills per branch.
- **Data Quality Badges**: Dynamic indicators alerting administrators when small-group suppression or insufficient data conditions are active.
