# CarrerSync AI Privacy & Student Data Protection Policy

> **Document Type**: Canonical AI Ethics, Privacy & Compliance Specification  
> **Status**: APPROVED & CANONICAL  
> **Phase**: Phase 09 — AI Profiling Agent & Evidence Ingestion Engine  
> **Target Release**: Platform-Wide Architecture & Governance  
> **Master Policy**: Strict ₹0 Zero-Cost Architecture | Absolute Student Data Sovereignty | Zero External PII Egress  

---

## 1. Executive Summary & Privacy Manifesto

At **CarrerSync**, student privacy, ethical data governance, and financial accessibility are non-negotiable architectural axioms. College placement platforms handle some of the most sensitive personal and professional data of emerging professionals: academic transcripts, contact numbers, national identity identifiers, resumes, and socio-economic demographic details.

Too often, modern educational software compromises student dignity by submitting unvetted student resumes to commercial LLM APIs, harvesting behavioral telemetry, or introducing opaque subscription fees that price out underprivileged collegiate institutions.

CarrerSync rejects these practices entirely. This specification codifies our twin foundational covenants:
1. **The Strict ₹0 Zero-Cost Guarantee**: The platform will **never** require a credit card, introduce per-student subscription tiers, or incur runtime billing charges.
2. **The Absolute Student Privacy Covenant**: No raw student PII is ever transmitted to external AI providers. The platform strictly forbids behavioral surveillance, refuses to train machine learning models on student work, and guarantees student data ownership through open relational standards.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE CARRERSYNC PRIVACY COVENANT                           │
│                                                                                        │
│  "A student's resume is their personal intellectual and professional property.          │
│   It shall not be used to train proprietary frontier AI models.                        │
│   It shall not be exposed to third-party ad networks or data brokers.                  │
│   It shall not be analyzed by external services without cryptographic PII redaction.   │
│   And the student shall always maintain the sovereign right to inspect, edit,          │
│   and delete every piece of evidence held in their name."                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Strict ₹0 Zero-Cost Budget Architecture

CarrerSync is engineered from the ground up to operate indefinitely with **zero operational cloud costs**.

### 2.1 The Zero Financial Liability Rule
- **No Credit Card Required**: No component of the deployment stack—whether compute, database, object storage, or AI extraction—relies on a paid tier or requires an active credit card on file.
- **Institutional Equity**: Tier-2 and Tier-3 rural engineering colleges with zero software licensing budgets can deploy and run CarrerSync with the exact same enterprise capabilities as well-funded metropolitan universities.
- **Runaway Cost Prevention**: All cloud services are configured to hard-fail or gracefully degrade into offline deterministic fallbacks rather than automatically scaling into billed usage.

### 2.2 Stack Cost & Quota Mapping

| Architectural Layer | Zero-Cost Infrastructure Provider | Free-Tier Allowance | Hard Guardrail & Fallback Mechanism | Monthly Cost |
| :--- | :--- | :--- | :--- | :---: |
| **Active REST Backend** | Render Free Tier Web Service | 750 free instance hours/month | Dynamic `$PORT` binding; ephemeral worker safety | **₹0.00** |
| **Relational Database** | Neon Serverless PostgreSQL | 0.5 GiB storage, 1 compute branch | Connection pooling with `@neondatabase/serverless` | **₹0.00** |
| **File Storage Subsystem**| Local Storage / Neon Object Storage / MinIO | 5 GB S3-compatible free storage | Bounded 5 MB per-file upload ceiling | **₹0.00** |
| **Frontend SPA Hosting** | Vercel / Render Static / Cloudflare Pages | Unlimited bandwidth & requests | Pre-rendered static assets via Vite | **₹0.00** |
| **Primary AI Profiler** | Google Gemini Free Tier API (`gemini-1.5-flash`) | 15 RPM, 1,500 RPD, cardless | Hard fallback to local deterministic Rule-Based Provider | **₹0.00** |
| **Fallback AI Engine** | Self-Hosted Rule-Based Regex Extractor | Unlimited offline execution | 100% in-process Node.js execution (0ms network cost) | **₹0.00** |
| **Total Platform Cost** | **Fully Verified Zero-Cost Architecture** | — | — | **₹0.00 / mo** |

---

## 3. Student Privacy Protections & Ethical Guarantees

### 3.1 Zero Real Student Data Transmitted to External AI
Before any text extracted from a student document is sent to an external model (such as Google Gemini), it must pass through the local **PII Sanitizer & Scrubber** (`server/src/ai/utils/pii-filter.ts`).

The external AI provider receives only an anonymized, de-identified technical text corpus:
- Real student names are replaced with generic markers (`[REDACTED_NAME]`).
- Email addresses are scrubbed (`[REDACTED_EMAIL]`).
- Phone numbers are purged (`[REDACTED_PHONE]`).
- National identity tokens (Aadhaar, PAN, SSN) are scrubbed.
- Physical mailing addresses and PIN codes are removed.

```
Raw Student Resume
┌────────────────────────────────────────────────────────┐
│ Rahul Sharma                                           │
│ rahul.sharma@pes.edu | +91 98765 43210                 │
│ 45/2 100ft Road, Indiranagar, Bangalore - 560038       │
│ Aadhaar: 9876 5432 1098                                │
│                                                        │
│ Technical Skills: React, TypeScript, PostgreSQL        │
│ Project: E-Commerce Store utilizing React & Node.js    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
             PIIFilter.scrub(rawText) [Local Node.js]
                            │
                            ▼
Sanitized Corpus Transmitted to Gemini
┌────────────────────────────────────────────────────────┐
│ [REDACTED_NAME]                                        │
│ [REDACTED_EMAIL] | [REDACTED_PHONE]                    │
│ Address: [REDACTED_ADDRESS]                            │
│ [REDACTED_AADHAAR]                                     │
│                                                        │
│ Technical Skills: React, TypeScript, PostgreSQL        │
│ Project: E-Commerce Store utilizing React & Node.js    │
└────────────────────────────────────────────────────────┘
```

### 3.2 Automated PII Scrubbing Specifications

The `PIIFilter` enforces comprehensive regex pattern matching across international and Indian-specific formats:
1. **Email Redaction**: Matches standard RFC 5322 compliant email formats (`EMAIL_REGEX`).
2. **Indian Mobile Numbers**: Matches 10-digit mobile numbers prefixed with `+91`, `91`, `0`, or without country code, commencing with valid telecom digits `[6-9]`.
3. **International Phone Numbers**: Matches E.164 formats, North American NANP formats, and delimited strings with area codes.
4. **Indian Aadhaar**: Matches 12-digit UIDAI numbers formatted as `XXXX XXXX XXXX` or unseparated 12-digit strings with first digit $\in [2-9]$.
5. **Indian Permanent Account Number (PAN)**: Matches 10-character alphanumeric sequences (`[A-Z]{5}[0-9]{4}[A-Z]{1}`).
6. **United States Social Security Number (SSN)**: Matches standard `XXX-XX-XXXX` formats with invalid prefix guards.
7. **Street & Postal Addresses**: Identifies address keywords (`Road`, `Street`, `Nagar`, `Colony`, `Sector`, `Phase`, `Layout`) and Indian 6-digit postal PIN codes (`PINCODE_REGEX`).
8. **Candidate Name Identification**: Detects explicit label prefixes (`Name:`, `Candidate Name:`, `Full Name:`) and isolates standalone capitalized name tokens in the document header.

### 3.3 Strict No-Training Guarantee
- **No Training on Student Data**: CarrerSync uses the Google Gemini API solely through inference endpoints. Google's enterprise and developer terms of service explicitly prohibit using data submitted via paid or developer API endpoints to train Google models.
- **No Persistent Caching by AI Vendors**: Document payloads are sent as ephemeral prompt parameters without server-side persistent context or fine-tuning datasets.
- **Local Fallback Option**: Students and colleges may opt to force `provider: 'rule-based'` platform-wide, guaranteeing that 100% of document processing occurs exclusively within their own private Node.js process without any external network request.

### 3.4 Zero Behavioral Surveillance Policy
CarrerSync explicitly rejects all invasive behavioral monitoring tools:
- **No Keystroke Logging**: The platform never tracks typing speed, keystroke latency, or clipboard paste frequency.
- **No Eye Tracking / Webcam Surveillance**: The platform contains zero camera-monitoring scripts, gaze tracking, or biometric emotion detection.
- **No Ambient Audio Monitoring**: The platform will never record ambient microphone audio.
- **No Covert Screen Recording**: Browser screen captures are strictly prohibited during normal student operations.

### 3.5 Under-18 Protection & Age Safeguards
In compliance with international child privacy standards and India's Digital Personal Data Protection Act (DPDPA 2023):
- **Database CHECK Constraint**: The relational PostgreSQL schema enforces an explicit birthdate invariant on `students.date_of_birth`:
  $$\text{date\_of\_birth} \le \text{CURRENT\_DATE} - \text{INTERVAL '18 years'}$$
- **Protection of Minors**: Any registration attempt by an individual under the age of 18 is blocked at the database layer. No personal data belonging to minors is collected, stored, or processed by CarrerSync.

---

## 4. Local Deterministic Processing & Offline Reliability

CarrerSync regards offline determinism not merely as a safety net, but as a core architectural feature.

```
                    ┌────────────────────────────────────┐
                    │      Document Processing Job       │
                    └─────────────────┬──────────────────┘
                                      │
                         Is Network Available & Allowed?
                                      │
                     ┌────────────────┴────────────────┐
                 YES │                              NO │
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │  Gemini Free API Tier │         │  Local Rule-Based     │
         │  (With PII Scrubbing) │         │  Deterministic Engine │
         └───────────┬───────────┘         └───────────┬───────────┘
                     │                                 │
                     │  Quota Exceeded (429) / Error   │
                     └───────────────►─────────────────┤
                                                       │
                                                       ▼
                                           ┌───────────────────────┐
                                           │  Identical Normalized │
                                           │  Schema Result        │
                                           └───────────────────────┘
```

- **Deterministic Taxonomy Dictionaries**: The `RuleBasedAIProvider` uses curated taxonomies covering hundreds of standardized technologies, frameworks, and tools.
- **Sub-15ms Processing**: The deterministic engine processes resumes in under 15 milliseconds, compared to 1,500ms–3,000ms for network LLM roundtrips.
- **100% CI/CD Test Isolation**: All unit, integration, and security test suites run completely offline without mocking API credentials or relying on network connections.

---

## 5. Regulatory Compliance & Data Sovereignty

### 5.1 Alignment with Global Privacy Frameworks

| Regulatory Framework | Jurisdiction | CarrerSync Compliance Guarantee |
| :--- | :--- | :--- |
| **DPDPA 2023** | India | Explicit student consent; PII scrubbing; right to correction and erasure; mandatory purpose limitation. |
| **FERPA** | United States | Directory information safeguards; restriction of academic record access strictly to authorized faculty and recruiters. |
| **GDPR Principles** | European Union | Data minimization (only essential placement fields collected); purpose limitation; transparency; right of access. |

### 5.2 Multi-Tenant Data Sovereignty
- **Tenant-Scoped Authorization**: Every student record, document, and skill evidence link is bound to an immutable `tenant_id`. Cross-tenant data leaks are physically blocked by transaction-scoped `SET LOCAL app.current_tenant_id` PostgreSQL configurations.
- **Right to Erasure (Data Purge)**: Students can delete uploaded documents and associated evidence at any time. When a document is removed, the physical file is purged from `IStorageService`, the `documents` row is deleted, and orphaned evidence entries are unlinked.
- **Right to Export**: Students may download a full cryptographic JSON snapshot of their profile, skills, and verification events at any time via the web interface.
