# CarrerSync Document Ingestion Pipeline Specification

> **Document Type**: Canonical Ingestion & Parsing Subsystem Specification  
> **Status**: APPROVED & CANONICAL  
> **Phase**: Phase 09 — AI Profiling Agent & Evidence Ingestion Engine  
> **Target Release**: Active Node.js + Express Backend (`server/src/ingestion/`, `server/src/services/`, `server/src/routes/`)  
> **Master Policy**: Strict ₹0 Zero-Cost Architecture | Zero External PII Egress | Resilient Zero-Crash Parsing  

---

## 1. Executive Summary & Pipeline Mission

The **Document Ingestion Pipeline** is the secure ingestion gateway of CarrerSync. It transforms raw binary document uploads (PDF resumes, DOCX resumes, certification records, and project portfolios) into sanitized, normalized, and structured textual context ready for evidence extraction by the Student Profiling Agent.

In college recruitment environments, student uploads exhibit extreme variance: malformed PDF binary structures, corrupt ZIP containers, non-standard font encodings, scanned image documents with zero text layers, and sensitive personal identifiers (Aadhaar cards, phone numbers, home addresses).

The CarrerSync Ingestion Pipeline is engineered to meet five strict architectural mandates:
1. **Strict ₹0 Operational Budget**: 100% built upon native Node.js standard libraries (`zlib`, `crypto`, `buffer`) and lightweight parsers. Zero dependencies on commercial OCR SaaS, paid document parsing APIs, or memory-heavy external headless browsers.
2. **Deterministic Security & Tenant Isolation**: Every document undergoes cryptographic signature verification, owner validation, and transaction-scoped tenant isolation prior to processing.
3. **No Fake Extractions on Scanned Artifacts**: If a document is a scanned image or photo without extractable text, the pipeline strictly refuses to invent or hallucinate text. It flags the artifact with `requiresManualReview: true`, routing it to human institutional reviewers.
4. **Zero Student PII Egress**: Before any text is evaluated by external AI models, all personal identifying numbers, phone numbers, emails, addresses, and candidate names are scrubbed locally.
5. **Human-in-the-Loop Review**: No extracted data automatically mutates a student's live profile without explicit student review and institutional sign-off.

---

## 2. The 13-Step Ingestion Flow Architecture

The end-to-end ingestion lifecycle comprises exactly 13 deterministic steps:

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Candidate
    participant API as Express API (/api/v1/profiling)
    participant Auth as Auth & Tenant Guard
    participant Storage as IStorageService
    participant Validator as File & MIME Validator
    participant Parsers as Ingestion Engine (PDF/DOCX/Img)
    participant Normalizer as Text Normalizer
    participant PII as PII Filter (Local Scrubber)
    participant AI as Hybrid AI Profiling Agent
    participant DB as Neon PostgreSQL (Drizzle ORM)
    actor TPO as TPO Admin / Faculty Reviewer

    %% Upload & Validation
    Student->>API: 1. POST /api/v1/files/upload (multipart binary)
    API->>Auth: 2. Validate Bearer JWT (sub, role, tenant_id)
    Auth->>Auth: 3. Verify Tenant Isolation & Anti-Spoofing
    API->>Storage: 4. Persist binary & retrieve storage key
    API->>Validator: 5. Verify magic bytes & MIME signature
    
    %% Extraction & Processing
    API->>Parsers: 6. Extract text (PDF FlateDecode / DOCX XML)
    Parsers-->>API: 7. Check text layer; flag scanned if empty
    API->>Normalizer: 8. Normalize unicode, control chars & whitespace
    API->>PII: 9. Scrub emails, phones, Aadhaar, PAN, names
    
    %% AI Profiling & Staging
    PII->>AI: 10. Analyze sanitized text (Gemini / Rule-based)
    AI-->>DB: 11. Stage proposed updates in profileExtractions (PENDING_REVIEW)
    
    %% Review & Persistence
    DB-->>Student: 12. Student inspects & selects skills in Review UI
    Student->>API: Approve chosen skills (POST /extractions/:id/approve)
    API->>DB: 13. Persist profileSkillEvidence & snapshot profileVersions
    opt Formal Institutional Verification
        TPO->>API: Review evidence proofs & certify skill (VERIFIED)
        API->>DB: Update verificationStatus to VERIFIED & log audit event
    end
```

---

## 3. Detailed Step-by-Step Specification

### Step 1: Document Upload
- **Endpoint**: `POST /api/v1/files/upload` (multipart/form-data).
- **Transport**: Encrypted over TLS 1.3 HTTPS.
- **Constraints**: Maximum upload size enforced at 5 MB (`MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024`).
- **Metadata**: Category tag (`resume`, `project_evidence`, `technical_certificate`, etc.).

### Step 2: Authentication & Token Claim Extraction
- **Middleware**: `requireAuth` (`server/src/middleware/auth.ts`).
- **Validation**: Verifies Bearer JWT signature via HS256 HMAC-SHA256.
- **Claims Extraction**: Validates expiration (`exp`), subject (`sub`), role (`role`), and tenant binding (`tenant_id`).

### Step 3: Tenant Verification & Anti-Spoofing Check
- **Middleware**: `tenantIsolationMiddleware` (`server/src/middleware/tenant.ts`).
- **Security Check**: Asserts that `req.user.tenant_id` matches the document's destination tenant. Rejects mismatched body or header tenant hints with 403 `TENANT_SPOOFING_REJECTED`.
- **Database Context**: Attaches `tenant_id` to PostgreSQL transaction context (`set_config('app.current_tenant_id', ...)`).

### Step 4: Secure Storage Persistence & Buffer Retrieval
- **Storage Subsystem**: `IStorageService` (`server/src/storage/`).
- **Checksum Calculation**: Generates SHA-256 cryptographic digest of the binary payload:
  $$\text{SHA-256}(\text{buffer}) \rightarrow \text{unique content hash}$$
- **Storage Key**: Generated as `tenants/{tenantId}/users/{userId}/{category}/{sha256}.{ext}`.
- **Retrieval**: Downloaded directly into an in-memory buffer via `storageService.downloadFile(storageKey)`.

### Step 5: MIME & Magic Signature Binary Validation
- **Engine**: `FileValidator` (`server/src/utils/file-validator.ts`).
- **Binary Signature Whitelist**:
  - PDF: Initial bytes must match `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`).
  - DOCX: Initial bytes must match PKZIP signature `PK\x03\x04` (`0x50 0x4B 0x03 0x04`).
  - PNG: Initial bytes must match `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`).
  - JPEG: Initial bytes must match `\xFF\xD8\xFF`.
- **Defense**: Mismatched file extensions or spoofed extensions are rejected immediately with 400 `INVALID_FILE_SIGNATURE`.

### Step 6: Text Extraction (PDF & DOCX)
- **Engine**: `IDocumentParser` implementations (`server/src/ingestion/parsers/`).
- **PDF Extraction**:
  - Scans PDF binary object table and stream definitions (`stream ... endstream`).
  - Filters for `/FlateDecode` compressed text streams and decompresses them using built-in `zlib.inflateSync`.
  - Parses text blocks (`BT ... ET`) and text rendering operators (`Tj`, `TJ`, `\'`, `\"`).
  - Unescapes PDF literal strings (`\(`, `\)`, `\\`, octal byte encodings `\ddd`).
- **DOCX Extraction**:
  - Treats DOCX as a ZIP archive. Scans Central Directory or Local File Headers for `word/document.xml`.
  - Decompresses `word/document.xml` using built-in `zlib.inflateRawSync`.
  - Strips XML element tags while extracting text contents from `<w:t>` and `<w:t xml:space="preserve">` nodes.
  - Inserts paragraph linebreaks at `</w:p>` boundaries.

### Step 7: Scanned Document & Image Handling
- **Engine**: `ImageParser` (`server/src/ingestion/parsers/image.parser.ts`).
- **Policy**: In accordance with the ₹0 zero-cost budget, heavyweight proprietary cloud OCR APIs (e.g. AWS Textract, Google Cloud Vision OCR) are not licensed.
- **Invariant**: The system **refuses to pretend** that text was extracted when none exists.
- **Review Flagging**:
  - If MIME type is `image/*` or if a PDF contains only rasterized bitmap streams with zero text operators, the parser returns:
    ```json
    {
      "text": "",
      "requiresManualReview": true,
      "warning": "Scanned document or image format detected. Optical character recognition requires manual human review."
    }
    ```
  - The document processing job completes with status `COMPLETED`, but creates an `ExtractionWarning` flagging the artifact for human review.

### Step 8: Document Text Normalization
- **Engine**: `normalizer.ts` (`server/src/ingestion/normalizer.ts`).
- **Processing Steps**:
  1. *Entity Unescaping*: Converts XML/HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, hex references) to UTF-8 characters.
  2. *Control Character Stripping*: Removes unprintable ASCII control codes (`0x00`-`0x08`, `0x0B`, `0x0C`, `0x0E`-`0x1F`, `0x7F`, zero-width spaces `\u200B-\u200D`, `\uFEFF`, soft hyphens `\u00AD`). Tab (`\t`) and newline (`\n`) are preserved.
  3. *Punctuation Standardization*: Replaces curly smart quotes (`‘’“”`) with standard quotes, em/en-dashes (`—`, `–`) with standard hyphens, and decorative bullets (`•`, `◦`, `▪`, `●`) with standard bullet markers (`• `).
  4. *Linebreak & Whitespace Collapsing*: Standardizes CRLF/CR to LF, collapses redundant horizontal spaces, and clamps excessive blank lines to a maximum of two newlines.
  5. *Structural Header Detection*: Identifies candidate section boundaries (`Summary`, `Education`, `Experience`, `Projects`, `Skills`, `Certifications`).

### Step 9: PII Redaction & Data Protection Filter
- **Engine**: `PIIFilter` (`server/src/ai/utils/pii-filter.ts`).
- **Target**: Protects student privacy by purging identifying data before text reaches AI providers:
  - *Email*: Replaced with `[REDACTED_EMAIL]`.
  - *Phone Numbers*: Redacts Indian 10-digit, `+91`, and international numbers with `[REDACTED_PHONE]`.
  - *National Identity*: Redacts 12-digit Indian Aadhaar (`[REDACTED_AADHAAR]`), 10-character PAN (`[REDACTED_PAN]`), and US SSN (`[REDACTED_SSN]`).
  - *Postal Address*: Redacts street names, layouts, sectors, and 6-digit PIN codes (`[REDACTED_ADDRESS]`, `[REDACTED_PINCODE]`).
  - *Candidate Names*: Redacts explicit name lines and standalone resume header lines (`[REDACTED_NAME]`).
- **Output**: Returns `sanitizedText` alongside an audit log of applied redactions.

### Step 10: Hybrid AI Profiling Analysis
- **Engine**: `AIFactory` & `IAIService` (`server/src/ai/`).
- **Execution**: The sanitized text is dispatched to the active AI provider:
  - Primary: Google Gemini Free Tier (`gemini-1.5-flash` or `gemini-2.0-flash`).
  - Fallback: Deterministic `RuleBasedAIProvider` (executed instantly if `GEMINI_API_KEY` is absent, or on HTTP 429 quota exhaustion, or on schema mismatch).
- **Validation**: Enforces strict Zod parsing against `profilingExtractionSchema`. Rejects any result where confidence is outside $[0.0, 1.0]$ or verification statuses are invalid.

### Step 11: Staging of Proposed Profile Updates
- **Table**: `profileExtractions` in PostgreSQL.
- **Initial Status**: `status = 'PENDING_REVIEW'`.
- **Payload**: Stores structured skills, projects, certifications, extraction warnings, overall confidence, provider metadata, and a preview of the sanitized text.
- **Job Status**: The associated `documentProcessingJobs` row transitions to `COMPLETED` with `completedAt = CURRENT_TIMESTAMP`.

### Step 12: Interactive Student Review Workflow
- **Frontend Component**: `ProfileReviewModal.jsx` (`client/src/components/profiling/ProfileReviewModal.jsx`).
- **Student Agency**:
  - The student inspects all proposed skills, category classifications, confidence scores, and contextual explanations.
  - The student can uncheck incorrectly extracted skills or modify proficiency claims.
  - The UI clearly reminds the student: *"AI extraction identifies evidence in your documents; it does not grant verified status."*
- **Action**: Student submits approval via `POST /api/v1/profiling/extractions/:id/approve` or rejection via `POST /api/v1/profiling/extractions/:id/reject`.

### Step 13: Final Profile Persistence & Snapshot Versioning
- **Database Operations** (executed atomically in a transaction):
  1. *Evidence Insertion*: Converts approved skills into `profileSkillEvidence` records:
     - `skillName`: Normalized skill string.
     - `category`: Canonical category (`programming_languages`, `frameworks`, etc.).
     - `evidenceType`: `RESUME`, `PROJECT`, or `CERTIFICATE`.
     - `verificationStatus`: Set to `EVIDENCE_FOUND` (if project-backed) or `PENDING_REVIEW` (if resume-backed). **Never `VERIFIED`.**
  2. *Extraction State Update*: Marks `profileExtractions.status` as `APPROVED` or `PARTIALLY_APPROVED`.
  3. *Audit Trail Logging*: Writes an immutable event record to `profileReviewEvents`:
     - `action: 'APPROVE'`, `reviewerId: req.user.id`, `reviewerRole: 'student'`.
  4. *Profile Version Ledger*: Appends a complete JSON snapshot to `profileVersions` with an incremented `versionNumber` and `triggerEvent = 'DOCUMENT_INGESTION_APPROVED'`.

---

## 4. Parser Implementations, Technical Mechanics & Limitations

### 4.1 Zero-Cost Native PDF Parser (`PDFParser`)
The CarrerSync PDF Parser extracts text from binary buffers without external command-line binaries (e.g. `pdftotext`) or heavyweight C++ dependencies.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PDF PARSING ARCHITECTURE                             │
│                                                                             │
│  [Binary Buffer] ──► Scan Stream Boundaries ('stream' ... 'endstream')      │
│                            │                                                │
│                            ▼                                                │
│                 Check /FlateDecode Filter?                                 │
│                   ├── YES ──► zlib.inflateSync() ──► Decompressed Stream    │
│                   └── NO  ──► Raw Stream Bytes ──► Text Stream Buffer       │
│                                                          │                  │
│                            ┌─────────────────────────────┘                  │
│                            ▼                                                │
│       Parse Text Blocks ('BT' ... 'ET') & Operators (Tj, TJ)                │
│                            │                                                │
│                            ▼                                                │
│     Decode String Literals, Font Octal Escapes & Spacing Arrays             │
│                            │                                                │
│                            ▼                                                │
│                 Cleaned Plain Text Output                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Known PDF Limitations & Defensive Measures:
- **FlateDecode Only**: Proprietary or legacy filters (`/CCITTFaxDecode`, `/JBIG2Decode`, `/Crypt`) are not supported in the zero-cost parser. If encountered, the parser safely logs a warning and continues with available uncompressed streams.
- **Two-Column Formats**: PDF streams store text in drawing order, which does not always match reading order in multi-column layouts. The normalizer mitigates this through section header recognition.
- **Scanned / Raster-Only PDFs**: PDFs containing only full-page images yield zero text operators. The parser detects `text.length === 0` and marks `requiresManualReview: true`.

### 4.2 Zero-Cost DOCX Parser (`DOCXParser`)
A `.docx` file is a standard PKZIP archive containing an OpenXML document hierarchy. The CarrerSync DOCX parser parses the zip directory structure using native Node.js buffers and `zlib`:
1. Scans the end of the buffer for the **End of Central Directory Record** (`0x06054b50`).
2. Iterates through **Central Directory File Headers** (`0x02014b50`) to locate the entry `word/document.xml`.
3. Reads the compression method (`0 = stored`, `8 = deflated`).
4. Decompresses the file data using `zlib.inflateRawSync`.
5. Parses XML text runs (`<w:t>`) and paragraph breaks (`<w:p>`), stripping XML tags with zero HTML renderer overhead.

#### Known DOCX Limitations:
- **Embedded Objects**: Binary OLE objects and embedded PDF previews inside DOCX files are skipped.
- **Password Protection**: Encrypted OOXML packages (standard password-protected Office files) cannot be decompressed and trigger an informative `ExtractionWarning`.

### 4.3 Scanned Document & Image Parser (`ImageParser`)
- **Supported Formats**: PNG, JPEG, WEBP, TIFF, BMP, HEIC.
- **Behavior**: Strictly returns an empty text string with `requiresManualReview: true` and an explicit diagnostic message.
- **Rationale**: Prevents hallucinated skill extractions, protects candidate integrity, and ensures equal opportunity for candidates with non-standard document formats.

---

## 5. Security, Tenancy & Compliance Invariants

| Invariant | Enforcement Mechanism | Failure Response |
| :--- | :--- | :--- |
| **Strict Tenant Isolation** | `tenantIsolationMiddleware` and transaction-local `app.current_tenant_id` GUC | Request aborted with 403 `TENANT_SPOOFING_REJECTED` |
| **Document Ownership Guard** | Ownership check: `document.owner_user_id === req.user.id` or institutional role | Request aborted with 403 `FORBIDDEN_DOCUMENT_ACCESS` |
| **Buffer Memory Protection** | Maximum 5 MB payload limit checked before parsing | Multer / middleware returns 413 `FILE_TOO_LARGE` |
| **Safe Decompression** | Uncompressed byte limit clamped at 50 MB to prevent zip bomb attacks | Decompression aborts with `PAYLOAD_TOO_LARGE` |
| **Zero External PII Leakage** | `PIIFilter.scrub()` applied prior to all AI provider calls | Guaranteed by automated test suite in CI |
| **Tamper-Evident History** | Version increment and snapshot in `profileVersions` | Atomic transaction rollback on DB failure |
