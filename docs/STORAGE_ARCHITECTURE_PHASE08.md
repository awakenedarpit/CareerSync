# CarrerSync — File Storage Architecture & Secure Upload System
## Phase 08 — Master Architecture & Storage Provider Assessment Report

---

## 1. Executive Summary

Phase 08 establishes a **secure, scalable, and provider-independent file storage subsystem** for CarrerSync. The subsystem manages private student resumes, academic certificates, technical credentials, project evidence artifacts, and placement documentation under strict multi-tenant isolation, five-role RBAC enforcement, and a ₹0 zero-cost policy.

Cloudflare products (Workers, Pages, R2, D1, KV, Queues) remain **permanently excluded**.

---

## 2. Storage Provider Research & Eligibility Verification

Per Section 4 of Prompt 08, an exhaustive investigation of **Neon Object Storage** and candidate cloud storage providers was conducted against official documentation.

### 2.1 Neon Object Storage Evaluation (10-Point Audit)

| # | Audit Criterion | Official Verification Result | Source / Citation |
| :- | :--- | :--- | :--- |
| **1** | **Availability to this project** | **Conditionally Available**. Supported regions include `aws-ap-southeast-1` (our active region). However, our project (`delicate-hat-84628894`) was initialized with `--services postgres` only. Storage buckets have not yet been provisioned or activated on the active branch. | [Neon Architecture Overview](https://neon.com/docs/get-started/backend-overview.md) |
| **2** | **S3-compatible operations** | **YES**. Supports `PutObject`, `GetObject`, `DeleteObject`, `HeadObject`, multipart uploads (up to 10 GiB), and presigned GET URLs with AWS SigV4. Requires `forcePathStyle: true`. `PutBucketWebsite` returns 501 (not needed for private storage). | [Neon S3 Compatibility Guide](https://neon.com/docs/storage/s3-compatibility.md) |
| **3** | **Project region support** | **YES**. Explicitly supported in `aws-ap-southeast-1` (Singapore), `aws-us-east-1`, `aws-us-east-2`, and `aws-eu-central-1`. | [Neon Backend Primitives](https://neon.com/docs/storage/overview.md) |
| **4** | **Payment card required** | **NO**. The Neon Free Plan operates permanently with **no credit card required**. | [Neon Pricing & Free Plan](https://neon.com/docs/introduction/plans.md) |
| **5** | **Billing activation required** | **NO**. The included free storage tier does not require billing activation. | [Neon Billing Documentation](https://neon.com/docs/manage/billing.md) |
| **6** | **Free storage allowance** | **5 GB** of object storage per project included in the Free tier. | [Neon Storage Overview](https://neon.com/docs/storage/overview.md) |
| **7** | **Upload & download operations** | **YES**. Standard S3 read/write operations are included. No egress fees on the free tier within normal limits. | [Neon Storage Buckets](https://neon.com/docs/storage/buckets.md) |
| **8** | **Request or bandwidth limits** | Single-request upload cap: **5 GiB**; multipart upload cap: **10 GiB**. Free tier volume cap: **5 GB** total. | [Neon Storage Limits](https://neon.com/docs/storage/objects.md) |
| **9** | **Free-tier restrictions** | Volume hard-cap at 5 GB. Buckets are branch-scoped. No custom domains (must stream through backend or CDN). Database compute scale-to-zero does not block object storage. | [Neon Storage Overview](https://neon.com/docs/storage/overview.md) |
| **10**| **Cardless credential generation**| **YES**. Credentials can be declared via `neon.ts` (`buckets: { 'student-files': {} }`) and deployed via `neon deploy` or configured in the Neon Console without payment. | [Neon Storage Authentication](https://neon.com/docs/storage/authentication.md) |

### 2.2 Provider Selection Decision & Production Blocker Notice

> [!IMPORTANT]
> **Provider Selection Decision & Blocker Notice**
> Although Neon Object Storage qualifies under the cardless ₹0 rule (5 GB free allowance, `aws-ap-southeast-1` support, no credit card required), storage credentials have **not yet been provisioned** for project `delicate-hat-84628894`.
> 
> In accordance with the strict project safeguard:
> *"If no verified cardless production storage provider exists, document that production uploads are BLOCKED until a suitable provider is approved. Stop at the provider-independent abstraction and local development implementation."*
> 
> **Status:**
> - **Production Cloud Storage**: Marked as **PROPOSED / BLOCKED PENDING USER APPROVAL**.
> - **Active Storage Engine**: **Local Disk Storage Engine (`local.storage.ts`)** for development and automated testing.
> - **S3 Adapter (`s3-compatible.storage.ts`)**: Built and ready to activate as soon as S3 credentials are supplied.

---

## 3. Provider-Independent Storage Architecture

The storage subsystem is decoupled from any concrete cloud provider via an interface abstraction:

```
server/src/storage/
├── storage.types.ts          # Core types: UploadOptions, UploadResult, FileMetadata, DownloadResult
├── storage.errors.ts         # Domain errors: FileNotFoundError, PathTraversalError, InvalidFileTypeError
├── storage.interface.ts      # Authoritative contract: IStorageService
├── local.storage.ts          # Local disk storage engine (Development / Test)
├── s3-compatible.storage.ts  # Generic S3-compatible engine (Neon Object Storage / MinIO)
└── storage.factory.ts        # Singleton factory resolving STORAGE_PROVIDER ('local' | 's3')
```

### 3.1 Interface Contract (`IStorageService`)

```typescript
export interface IStorageService {
  upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  download(storageKey: string): Promise<DownloadResult>;
  delete(storageKey: string): Promise<boolean>;
  getMetadata(storageKey: string): Promise<FileMetadata>;
  exists(storageKey: string): Promise<boolean>;
  generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string>;
}
```

### 3.2 Local Disk Storage Engine (`local.storage.ts`)
- **Directory Isolation**: Configured outside public client directories (`STORAGE_LOCAL_DIRECTORY` or `uploads/`).
- **Path Traversal Prevention**: Strips leading path separators, rejects `..` and null bytes, asserts `resolvedPath.startsWith(baseDirectory)`.
- **Restricted Permissions**: Directories created with `0o700` (`rwx------`); files written with `0o600` (`rw-------`).
- **Server-Side Key Generation**: Key format `${tenantId}/${documentType}/${randomUUID()}.${ext}` prevents user-supplied filename collisions.
- **Ephemeral Notice**: Explicitly documented that Render's container disk is ephemeral and resets upon redeploy.

### 3.3 S3-Compatible Cloud Storage Engine (`s3-compatible.storage.ts`)
- Built with official `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- Enforces `forcePathStyle: true` for compatibility with Neon Object Storage and MinIO.
- Authenticates via AWS-standard environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`).

---

## 4. Database Metadata Specification

Document records are tracked in a dedicated relational table in [server/src/db/schema.ts](file:///Users/user/CarrerSync/server/src/db/schema.ts):

### `documents` Table Definition

| Column | Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key (`gen_random_uuid()`) | Unique document identifier |
| `tenant_id` | UUID | NOT NULL, REFERENCES `tenants.id` CASCADE | Mandatory institutional tenant isolation |
| `owner_user_id`| UUID | NOT NULL, REFERENCES `users.id` CASCADE | Bound to authenticated user |
| `original_filename`| VARCHAR(255) | NOT NULL | Sanitized display filename |
| `storage_key` | VARCHAR(512) | NOT NULL, UNIQUE | Abstract object path in storage engine |
| `mime_type` | VARCHAR(127) | NOT NULL | Verified MIME type |
| `file_size` | INTEGER | NOT NULL | Exact binary size in bytes |
| `checksum` | VARCHAR(64) | NOT NULL | SHA-256 cryptographic digest |
| `document_type`| VARCHAR(50) | NOT NULL | Document category |
| `upload_status`| VARCHAR(20) | NOT NULL, DEFAULT `'completed'` | Upload lifecycle status |
| `is_private` | BOOLEAN | NOT NULL, DEFAULT `true` | Private-by-default flag |
| `metadata` | JSONB | Nullable | Optional extended metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last mutation timestamp |

---

## 5. File Validation & Safety Policy

All uploads are evaluated before writing to storage:

1. **Document Categories**:
   - `resume`
   - `academic_certificate`
   - `technical_certificate`
   - `project_evidence`
   - `portfolio_attachment`
   - `placement_document`
2. **Permitted Formats**: PDF (`.pdf`), PNG (`.png`), JPEG (`.jpg`, `.jpeg`), DOCX (`.docx`).
3. **Magic Signature Inspection**:
   - PDF: must begin with `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
   - PNG: must begin with `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`)
   - JPEG: must begin with `\xFF\xD8\xFF`
   - DOCX: must begin with `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)
4. **File Size Enforcement**: Hard-capped at **5 MB** (5,242,880 bytes).
5. **Executable Rejection**: Executable binaries, shell scripts, HTML, and SVG are rejected.
6. **Delivery Headers**: Downloads are streamed with:
   - `Content-Disposition: attachment; filename="..."`
   - `X-Content-Type-Options: nosniff`
   - `Cache-Control: private, no-cache, no-store, must-revalidate`

---

## 6. Five-Role Access Control Matrix

| Role | Upload Permission | View / Download Scope | Deletion Scope |
| :--- | :--- | :--- | :--- |
| **`STUDENT`** | Permitted for own documents (`resume`, `certificates`, `evidence`) | **Own documents only** (`ownerUserId === req.user.id`) | **Own documents only** |
| **`TPO_ADMIN`** | Institutional documents (`placement_document`) | **All student documents within assigned college tenant** | **Prohibited** (403 on student records) |
| **`COLLEGE_ADMIN`** | Institutional documents | **All documents within assigned college tenant** | **Tenant cleanup permitted** |
| **`RECRUITER`** | Prohibited (403) | **Shared resumes & evidence within placement scope only** | **Prohibited** (403) |
| **`SUPER_ADMIN`** | Platform documents | **Platform-wide audit scope with compliance logging** | **Compliance deletion permitted** |

Cross-tenant access attempts are strictly rejected with `403 FORBIDDEN_DOCUMENT_ACCESS`.

---

## 7. REST API Endpoints

All endpoints are mounted under `/api/v1/files` and require `requireAuth` and `tenantMiddleware`:

- `POST /api/v1/files/upload`: Multipart file upload with category and validation.
- `GET /api/v1/files`: Lists accessible documents for authenticated user.
- `GET /api/v1/files/:id`: Retrieves document metadata by UUID.
- `GET /api/v1/files/:id/download`: Streams authenticated file binary.
- `DELETE /api/v1/files/:id`: Deletes physical object and metadata record.

---

## 8. Automated Test Verification Results

All 22 test scenarios in [server/tests/files.test.ts](file:///Users/user/CarrerSync/server/tests/files.test.ts) pass with zero errors:

| Test Group | Test Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **Storage Engine** | Upload mode 0o600 & SHA-256 calculation | Verified | **PASS** |
| **Storage Engine** | Path traversal rejection (`../../etc/passwd`) | Throws `PathTraversalError` | **PASS** |
| **Storage Engine** | Stream download & mime mapping | Stream verified | **PASS** |
| **Storage Engine** | Physical file deletion & re-delete handling | Verified | **PASS** |
| **File Validator** | PDF, PNG, JPEG magic signature checks | Signature matched | **PASS** |
| **File Validator** | Disguised text file claiming to be PDF | Rejected | **PASS** |
| **File Validator** | Dangerous filename sanitization | Sanitized | **PASS** |
| **File Validator** | Oversized file rejection (> 5 MB) | Throws `FileTooLargeError` | **PASS** |
| **File Validator** | Empty file rejection (0 bytes) | Throws `InvalidFileTypeError` | **PASS** |
| **Upload API** | Unauthenticated upload attempt | 401 `MISSING_BEARER_TOKEN` | **PASS** |
| **Upload API** | Missing file payload in request | 400 `MISSING_FILE` | **PASS** |
| **Upload API** | Valid student resume upload | 201 with document metadata | **PASS** |
| **Upload API** | Executable file upload (`.exe`) | 400 `INVALID_FILE_TYPE` | **PASS** |
| **Upload API** | Spoofed binary signature upload | 400 `INVALID_FILE_TYPE` | **PASS** |
| **Upload API** | Unsupported document category upload | 400 `INVALID_DOCUMENT_TYPE` | **PASS** |
| **Access Control** | Student accesses own document & downloads | 200 with `attachment; nosniff` | **PASS** |
| **Access Control** | Student accesses another student document | 403 `FORBIDDEN_DOCUMENT_ACCESS`| **PASS** |
| **Access Control** | TPO Admin accesses student document in college | 200 with metadata | **PASS** |
| **Access Control** | TPO Admin accesses cross-tenant college document| 403 `FORBIDDEN_DOCUMENT_ACCESS`| **PASS** |
| **Access Control** | Recruiter accesses resume, blocked from deletion | 200 read, 403 on delete | **PASS** |
| **Access Control** | Super Admin audit access across tenants | 200 across tenants | **PASS** |
| **Access Control** | Student deletes own document, cannot delete other| 200 own, 403 other | **PASS** |
