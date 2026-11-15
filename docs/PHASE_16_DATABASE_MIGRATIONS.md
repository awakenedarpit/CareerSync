# CarrerSync Phase 16 — Relational Database Schema & Migrations Specification
## Exhaustive Documentation of PostgreSQL Enums, 15 Relational Tables, Multi-Tenant Foreign Keys, and Non-Destructive Migration Audit

**Document Version:** 1.0.0  
**Phase:** Phase 16 — Alumni Mentorship Network, Live Peer Mock Interviews & Realtime Collaboration  
**Date:** November 15, 2026  
**Audience:** Database Administrators, Backend Engineers, Security Auditors  
**Classification:** Canonical Database Specification  

---

## 1. Schema Architecture & Design Principles

The Phase 16 database extensions expand the CarrerSync PostgreSQL schema to support Alumni Mentorship, Live Peer Mock Interviews, and Real-Time Collaboration. 

### Core Database Principles:
1. **Additive Non-Destructive Operations**:
   All modifications are strictly additive. The generated Drizzle migration contains **ZERO `DROP TABLE`**, **ZERO `DROP COLUMN`**, and **ZERO `TRUNCATE`** operations, maintaining complete backward compatibility with all prior phases (01–15).
2. **Universal Multi-Tenant Scoping**:
   All 15 tables feature a non-nullable `tenantId` referencing `tenants.id` with `onDelete: 'cascade'`, enforcing structural institutional boundaries.
3. **Auditability & Integrity**:
   Every record includes cryptographic UUID primary keys (`defaultRandom()`) and dual audit timestamps (`createdAt`, `updatedAt` with timezone).
4. **Relational Completeness**:
   Comprehensive bidirectional Drizzle relations connect tenants, users, rooms, participants, messages, and moderation reports.

---

## 2. PostgreSQL Enums

### 2.1 Role Extension
- `user_role_enum`: Extended additively via `ALTER TYPE "public"."user_role_enum" ADD VALUE 'alumni';`

### 2.2 Domain Enums
1. `alumni_verification_status_enum`: `['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']`
2. `mentorship_request_status_enum`: `['PENDING', 'ACCEPTED', 'DECLINED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED']`
3. `peer_interview_type_enum`: `['TECHNICAL', 'HR', 'BEHAVIORAL', 'APTITUDE_DISCUSSION', 'PROJECT_EXPLANATION', 'SYSTEM_DESIGN', 'GENERAL_PREP']`
4. `peer_interview_mode_enum`: `['STRUCTURED_INTERVIEW', 'COLLABORATIVE_PRACTICE']`
5. `peer_interview_status_enum`: `['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']`
6. `collaboration_room_category_enum`: `['DSA', 'WEB_DEV', 'BACKEND', 'DATABASE', 'AI', 'APTITUDE', 'INTERVIEW', 'PROJECT', 'GENERAL_STUDY']`
7. `collaboration_room_status_enum`: `['ACTIVE', 'ARCHIVED', 'CLOSED']`
8. `moderation_report_status_enum`: `['PENDING_REVIEW', 'INVESTIGATING', 'RESOLVED_ACTION_TAKEN', 'DISMISSED']`
9. `moderation_action_enum`: `['NO_ACTION', 'WARNING_ISSUED', 'SESSION_TERMINATED', 'PARTICIPANT_BLOCKED', 'ACCOUNT_SUSPENDED']`

---

## 3. Relational Table Specifications

### 3.1 Alumni Mentorship Subsystem (5 Tables)

#### 1. `alumni_profiles`
Stores extended professional backgrounds, verification status, and mentorship preferences.
- `id` (UUID PK)
- `tenant_id` (UUID FK $\to$ `tenants.id`, cascade)
- `user_id` (UUID FK $\to$ `users.id`, cascade)
- `graduation_year` (INTEGER)
- `degree`, `department` (VARCHAR 150)
- `current_company`, `current_role` (VARCHAR 255)
- `industry_domain` (VARCHAR 150)
- `total_experience_years` (INTEGER, default: 0)
- `linkedin_url`, `github_url`, `portfolio_url` (VARCHAR 500)
- `bio` (TEXT)
- `skills` (JSONB, default: `[]`)
- `expertise_areas` (JSONB, default: `[]`)
- `mentorship_enabled` (BOOLEAN, default: true)
- `max_active_mentees` (INTEGER, default: 3)
- `verification_status` (`alumni_verification_status_enum`, default: `'PENDING'`)
- `verified_by` (UUID FK $\to$ `users.id`, set null)
- `verified_at` (TIMESTAMPTZ)
- `verification_notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Indexes*: `(tenant_id, user_id)` (UNIQUE), `(tenant_id, verification_status)`, `(tenant_id, industry_domain)`

#### 2. `mentor_availability`
Stores recurring and one-off mentorship availability slots.
- `id` (UUID PK), `tenant_id`, `alumni_profile_id`, `user_id`
- `day_of_week` (INTEGER, 0–6)
- `start_time`, `end_time` (VARCHAR 10, e.g. "18:00")
- `slot_duration_minutes` (INTEGER, default: 45)
- `is_recurring` (BOOLEAN, default: true)
- `specific_date` (DATE)
- `is_active` (BOOLEAN, default: true)

#### 3. `mentorship_requests`
Stateful student mentorship requests.
- `id` (UUID PK), `tenant_id`, `student_id`, `student_user_id`, `alumni_profile_id`, `mentor_user_id`
- `topic`, `message`, `goals`
- `preferred_slot_id`, `preferred_date`
- `status` (`mentorship_request_status_enum`, default: `'PENDING'`)
- `rejection_reason`, `reschedule_note`
- *Indexes*: `(tenant_id, student_user_id)`, `(tenant_id, mentor_user_id)`, `(tenant_id, status)`

#### 4. `mentorship_sessions`
Confirmed mentorship appointments.
- `id` (UUID PK), `tenant_id`, `request_id`, `alumni_profile_id`, `mentor_user_id`, `student_user_id`
- `scheduled_at`, `duration_minutes`
- `meeting_link`, `session_notes`, `action_items`
- `status` (VARCHAR 50, default: `'SCHEDULED'`)
- `started_at`, `completed_at`

#### 5. `mentorship_feedback`
Evaluations submitted following completed mentorship sessions.
- `id` (UUID PK), `tenant_id`, `session_id`, `submitted_by_user_id`
- `feedback_target` (VARCHAR 20, `'ALUMNI'` | `'STUDENT'`)
- `rating` (INTEGER, 1–5)
- `covered_topics` (JSONB)
- `feedback_text`, `strengths_text`, `growth_areas_text`

---

### 3.2 Peer Mock Interview Subsystem (4 Tables)

#### 6. `peer_interview_rooms`
Mock interview sessions across Mode A and Mode B.
- `id` (UUID PK), `tenant_id`, `room_code` (VARCHAR 50 UNIQUE)
- `host_user_id` (UUID FK $\to$ `users.id`)
- `title`, `target_role`, `domain`
- `interview_type` (`peer_interview_type_enum`)
- `mode` (`peer_interview_mode_enum`, default: `'STRUCTURED_INTERVIEW'`)
- `difficulty` (VARCHAR 20, default: `'MEDIUM'`)
- `duration_minutes`, `participant_capacity`
- `status` (`peer_interview_status_enum`, default: `'SCHEDULED'`)
- `scheduled_at`, `started_at`, `completed_at`

#### 7. `peer_interview_participants`
Active participants joined in an interview room.
- `id` (UUID PK), `tenant_id`, `room_id`, `user_id`
- `role` (VARCHAR 30, `'INTERVIEWER'` | `'CANDIDATE'` | `'PEER'`)
- `joined_at`, `left_at`
- `is_active` (BOOLEAN, default: true)
- `notes` (TEXT)
- *Indexes*: `(room_id, user_id)` (UNIQUE)

#### 8. `peer_interview_questions`
Assigned questions per room with hidden answer keys for candidates.
- `id` (UUID PK), `tenant_id`, `room_id`
- `question_title`, `question_description`
- `difficulty` (VARCHAR 20)
- `standard_answer` (TEXT)
- `evaluation_rubric_cues` (JSONB)
- `order_index` (INTEGER)

#### 9. `peer_interview_feedback`
Structured constructive evaluations with the `isPeerProvidedLabel: true` guarantee.
- `id` (UUID PK), `tenant_id`, `room_id`, `evaluator_user_id`, `evaluatee_user_id`
- `overall_rating` (INTEGER 1–5)
- `technical_score`, `communication_score`, `problem_solving_score`, `code_quality_score` (INTEGER 1–5)
- `strengths_text`, `improvements_text`, `action_items_text`
- `is_peer_provided_label` (BOOLEAN, default: true)

---

### 3.3 Real-Time Collaboration Subsystem (4 Tables)

#### 10. `collaboration_rooms`
Study rooms organized across 9 core engineering disciplines.
- `id` (UUID PK), `tenant_id`, `slug` (VARCHAR 100)
- `name`, `description`
- `category` (`collaboration_room_category_enum`)
- `host_user_id` (UUID FK $\to$ `users.id`)
- `is_private` (BOOLEAN, default: false)
- `passcode_hash` (VARCHAR 255)
- `max_members` (INTEGER, default: 8)
- `status` (`collaboration_room_status_enum`, default: `'ACTIVE'`)
- `notes_content` (TEXT, default: `''`)
- `notes_version` (INTEGER, default: 1)
- `tags` (JSONB, default: `[]`)
- *Indexes*: `(tenant_id, slug)` (UNIQUE), `(tenant_id, category)`, `(tenant_id, status)`

#### 11. `collaboration_participants`
Active and historical membership records.
- `id` (UUID PK), `tenant_id`, `room_id`, `user_id`
- `role` (VARCHAR 30, `'HOST'` | `'MEMBER'`)
- `joined_at`, `left_at`, `last_active_at`
- `is_active` (BOOLEAN, default: true)
- *Indexes*: `(room_id, user_id)` (UNIQUE)

#### 12. `collaboration_messages`
In-room chat stream with text and code snippet support.
- `id` (UUID PK), `tenant_id`, `room_id`, `sender_user_id`
- `message_type` (VARCHAR 50, default: `'TEXT'`)
- `content` (TEXT)
- `code_snippet_json` (JSONB)
- `attachment_url` (VARCHAR 500)
- `is_pinned`, `is_edited` (BOOLEAN)
- `reactions` (JSONB)

#### 13. `collaboration_tasks`
Collaborative task checklists.
- `id` (UUID PK), `tenant_id`, `room_id`, `created_by_user_id`, `assigned_to_user_id`
- `title`, `description`
- `priority` (VARCHAR 20, `'LOW'` | `'MEDIUM'` | `'HIGH'`)
- `status` (VARCHAR 30, `'TODO'` | `'IN_PROGRESS'` | `'COMPLETED'`)
- `due_date`, `completed_at`

---

### 3.4 Moderation & Safety Subsystem (2 Tables)

#### 14. `moderation_reports`
Incident reports filed by participants.
- `id` (UUID PK), `tenant_id`, `reporter_user_id`, `reported_user_id`
- `entity_type` (VARCHAR 50, `'MENTORSHIP'` | `'PEER_INTERVIEW'` | `'COLLABORATION_ROOM'`)
- `entity_id` (VARCHAR 100)
- `reason` (VARCHAR 100)
- `description` (TEXT)
- `evidence_json` (JSONB)
- `status` (`moderation_report_status_enum`, default: `'PENDING_REVIEW'`)
- `investigated_by` (UUID FK $\to$ `users.id`)
- `investigation_notes` (TEXT)
- `resolved_at` (TIMESTAMPTZ)
- *Indexes*: `(tenant_id, status)`, `(tenant_id, reported_user_id)`

#### 15. `moderation_actions`
Administrative sanctions and participant blocking records.
- `id` (UUID PK), `tenant_id`, `report_id`
- `target_user_id`, `actioned_by_user_id`
- `action_type` (`moderation_action_enum`)
- `notes` (TEXT)
- `expires_at` (TIMESTAMPTZ)
- `is_active` (BOOLEAN, default: true)
- *Indexes*: `(tenant_id, target_user_id, is_active)`

---

## 4. Migration Execution & Audit Log

The additive migration file `server/drizzle/0006_previous_eternity.sql` was generated using Drizzle Kit:
- **Command**: `npm run db:generate --prefix server`
- **Output Artifact**: `server/drizzle/0006_previous_eternity.sql`
- **Migration Verification**:
  * Total statements: 78
  * `CREATE TYPE`: 9 enums
  * `ALTER TYPE ADD VALUE`: 1 (`user_role_enum` + `'alumni'`)
  * `CREATE TABLE`: 15 tables
  * `CREATE INDEX` / `UNIQUE INDEX`: 32 indexes
  * `DROP TABLE`: **0**
  * `DROP COLUMN`: **0**
  * `TRUNCATE`: **0**
- **Test Validation**: `server/tests/phase16-schema.test.ts` (32/32 tests passing).
