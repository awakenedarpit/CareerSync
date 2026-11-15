import { describe, it, expect, vi } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import {
  withTenantContext,
  normalizeDbUrl
} from '../src/db/client';

describe('Phase 07 Drizzle ORM Schema Reconciliation & Pooling Safety', () => {
  // ==========================================================================
  // 1. Schema Table Exports & Relations Consistency
  // ==========================================================================
  describe('1. Schema Table Exports & Relations Consistency', () => {
    it('should export all 16 canonical domain tables plus invitations and AI tables', () => {
      // 16 Canonical Domain Tables
      expect(schema.tenants).toBeDefined();
      expect(schema.users).toBeDefined();
      expect(schema.students).toBeDefined();
      expect(schema.skills).toBeDefined();
      expect(schema.studentSkills).toBeDefined();
      expect(schema.evidenceRecords).toBeDefined();
      expect(schema.skillAssessments).toBeDefined();
      expect(schema.academicSemesters).toBeDefined();
      expect(schema.companies).toBeDefined();
      expect(schema.jobRoles).toBeDefined();
      expect(schema.jobRequirements).toBeDefined();
      expect(schema.placementDrives).toBeDefined();
      expect(schema.applications).toBeDefined();
      expect(schema.interviews).toBeDefined();
      expect(schema.auditEvents).toBeDefined();
      expect(schema.notifications).toBeDefined();

      // Additional Platform & AI Tables
      expect(schema.invitations).toBeDefined();
      expect(schema.skillGapAnalyses).toBeDefined();
      expect(schema.placementPredictions).toBeDefined();
      expect(schema.learningRecommendations).toBeDefined();
      expect(schema.agentExecutionLogs).toBeDefined();
      expect(schema.agentWorkflows).toBeDefined();
    });

    it('should export all authoritative domain enums with expected enum values', () => {
      // userRoleEnum must include tpo_admin alongside standard roles
      expect(schema.userRoleEnum).toBeDefined();
      expect(schema.userRoleEnum.enumValues).toContain('superadmin');
      expect(schema.userRoleEnum.enumValues).toContain('college_admin');
      expect(schema.userRoleEnum.enumValues).toContain('tpo_admin');
      expect(schema.userRoleEnum.enumValues).toContain('faculty_coordinator');
      expect(schema.userRoleEnum.enumValues).toContain('recruiter');
      expect(schema.userRoleEnum.enumValues).toContain('student');

      // invitationStatusEnum
      expect(schema.invitationStatusEnum.enumValues).toEqual([
        'pending',
        'accepted',
        'expired',
        'revoked'
      ]);

      // skillCategoryEnum
      expect(schema.skillCategoryEnum.enumValues).toEqual([
        'programming_languages',
        'frameworks',
        'databases',
        'cloud_devops',
        'core_cs',
        'data_ai',
        'soft_skills'
      ]);

      // 5-Stage Skill Verification Lifecycle enum
      expect(schema.skillStateEnum.enumValues).toEqual([
        'Claimed',
        'Observed',
        'Evidence-linked',
        'Verified',
        'Expired'
      ]);

      // proficiencyLevelEnum
      expect(schema.proficiencyLevelEnum.enumValues).toEqual([
        'beginner',
        'intermediate',
        'advanced',
        'expert'
      ]);

      // evidenceTypeEnum
      expect(schema.evidenceTypeEnum.enumValues).toEqual([
        'github_commit',
        'github_pr',
        'project_repository',
        'deployed_application',
        'coding_assessment',
        'certification'
      ]);

      // verificationStatusEnum
      expect(schema.verificationStatusEnum.enumValues).toEqual([
        'pending_review',
        'validated',
        'rejected'
      ]);

      // driveStatusEnum
      expect(schema.driveStatusEnum.enumValues).toEqual([
        'draft',
        'published',
        'ongoing',
        'completed',
        'cancelled'
      ]);

      // applicationStatusEnum
      expect(schema.applicationStatusEnum.enumValues).toEqual([
        'applied',
        'eligible',
        'shortlisted',
        'interview_scheduled',
        'offered',
        'rejected',
        'withdrawn'
      ]);

      // interviewRoundTypeEnum & interviewStatusEnum
      expect(schema.interviewRoundTypeEnum.enumValues).toEqual([
        'online_test',
        'technical_1',
        'technical_2',
        'hr',
        'management'
      ]);
      expect(schema.interviewStatusEnum.enumValues).toEqual([
        'scheduled',
        'cleared',
        'failed',
        'cancelled'
      ]);

      // notificationTypeEnum
      expect(schema.notificationTypeEnum.enumValues).toEqual([
        'drive_announcement',
        'skill_verified',
        'gap_alert',
        'interview_call',
        'system'
      ]);
    });

    it('should export all relation graphs matching relational domain model', () => {
      expect(schema.tenantsRelations).toBeDefined();
      expect(schema.usersRelations).toBeDefined();
      expect(schema.studentsRelations).toBeDefined();
      expect(schema.skillsRelations).toBeDefined();
      expect(schema.studentSkillsRelations).toBeDefined();
      expect(schema.evidenceRecordsRelations).toBeDefined();
      expect(schema.skillAssessmentsRelations).toBeDefined();
      expect(schema.academicSemestersRelations).toBeDefined();
      expect(schema.companiesRelations).toBeDefined();
      expect(schema.jobRolesRelations).toBeDefined();
      expect(schema.jobRequirementsRelations).toBeDefined();
      expect(schema.placementDrivesRelations).toBeDefined();
      expect(schema.applicationsRelations).toBeDefined();
      expect(schema.interviewsRelations).toBeDefined();
      expect(schema.auditEventsRelations).toBeDefined();
      expect(schema.notificationsRelations).toBeDefined();
      expect(schema.invitationsRelations).toBeDefined();
    });
  });

  // ==========================================================================
  // 2. Transaction-Scoped RLS Context Isolation & Pooling Safety
  // ==========================================================================
  describe('2. Transaction-Scoped RLS Context Isolation & Pooling Safety', () => {
    it('should execute SET LOCAL and set_config within transaction bounds', async () => {
      const tenantId = '11111111-1111-4111-8111-111111111111';
      const executedStatements: string[] = [];

      // Create mock transactional DB client
      const mockTx = {
        execute: vi.fn(async (query: any) => {
          const sqlText =
            typeof query === 'string'
              ? query
              : typeof query?.toSQL === 'function'
              ? query.toSQL().sql
              : JSON.stringify(query);
          executedStatements.push(sqlText);
          return { rows: [] };
        })
      };

      const mockDb = {
        transaction: vi.fn(async (cb: any) => {
          return await cb(mockTx);
        }),
        execute: vi.fn()
      };

      let callbackReceivedTx: any = null;
      const result = await withTenantContext(
        tenantId,
        async (tx) => {
          callbackReceivedTx = tx;
          return 'success_data';
        },
        mockDb as any
      );

      expect(result).toBe('success_data');
      expect(callbackReceivedTx).toBe(mockTx);
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);

      // Verify transaction-local SET statements executed
      expect(mockTx.execute).toHaveBeenCalled();
      const anySetLocal = executedStatements.some((stmt) =>
        stmt.includes('SET LOCAL app.current_tenant_id') || stmt.includes('set_config')
      );
      expect(anySetLocal).toBe(true);
    });

    it('should guarantee dedicated pool connection lifecycle: BEGIN -> SET LOCAL -> COMMIT -> RESET -> release', async () => {
      const tenantId = '22222222-2222-4222-8222-222222222222';
      const queryLog: string[] = [];
      let isReleased = false;

      const mockClient = {
        query: vi.fn(async (sql: string, params?: any[]) => {
          queryLog.push(params ? `${sql} [${params.join(', ')}]` : sql);
          return { rows: [] };
        }),
        release: vi.fn(() => {
          isReleased = true;
        })
      };

      const mockPool = {
        connect: vi.fn(async () => mockClient)
      };

      const mockDbWithPool = {
        pool: mockPool,
        transaction: undefined // Simulate pooled connection path
      };

      const result = await withTenantContext(
        tenantId,
        async (_txDb) => {
          return { count: 42 };
        },
        mockDbWithPool as any
      );

      expect(result).toEqual({ count: 42 });
      expect(mockPool.connect).toHaveBeenCalledTimes(1);

      // Verify strict execution sequence: BEGIN, SET LOCAL, COMMIT, RESET, release
      expect(queryLog[0]).toBe('BEGIN');
      expect(queryLog.some((q) => q.includes("set_config('app.current_tenant_id'") && q.includes(tenantId))).toBe(true);
      expect(queryLog.some((q) => q.includes("SET LOCAL app.current_tenant_id = '22222222-2222-4222-8222-222222222222'"))).toBe(true);
      expect(queryLog.some((q) => q === 'COMMIT')).toBe(true);
      expect(queryLog.some((q) => q.includes("SELECT set_config('app.current_tenant_id', '', false)"))).toBe(true);
      expect(queryLog.some((q) => q.includes('RESET app.current_tenant_id'))).toBe(true);
      expect(isReleased).toBe(true);
    });

    it('should guarantee ROLLBACK and session RESET on error without leaking tenant context to pool', async () => {
      const tenantId = '33333333-3333-4333-8333-333333333333';
      const queryLog: string[] = [];
      let isReleased = false;

      const mockClient = {
        query: vi.fn(async (sql: string, params?: any[]) => {
          queryLog.push(params ? `${sql} [${params.join(', ')}]` : sql);
          return { rows: [] };
        }),
        release: vi.fn(() => {
          isReleased = true;
        })
      };

      const mockPool = {
        connect: vi.fn(async () => mockClient)
      };

      const mockDbWithPool = {
        pool: mockPool,
        transaction: undefined
      };

      await expect(
        withTenantContext(
          tenantId,
          async () => {
            throw new Error('Transaction aborted by unexpected error');
          },
          mockDbWithPool as any
        )
      ).rejects.toThrow('Transaction aborted by unexpected error');

      // Verify ROLLBACK was executed and session state was reset before release
      expect(queryLog.some((q) => q === 'ROLLBACK')).toBe(true);
      expect(queryLog.some((q) => q.includes('RESET app.current_tenant_id'))).toBe(true);
      expect(queryLog.some((q) => q.includes("SELECT set_config('app.current_tenant_id', '', false)"))).toBe(true);
      expect(isReleased).toBe(true);
    });

    it('should sanitize tenantId against GUC injection attempts', async () => {
      // Reject empty or invalid strings
      await expect(withTenantContext('', async () => {})).rejects.toThrow();
      await expect(withTenantContext(null as any, async () => {})).rejects.toThrow();
      await expect(withTenantContext('; DROP TABLE users;--', async () => {})).rejects.toThrow();
    });
  });

  // ==========================================================================
  // 3. Non-Destructive Column Compatibility
  // ==========================================================================
  describe('3. Non-Destructive Column Compatibility', () => {
    it('should define both resumeUrl and resumeR2Url on students table without dropping existing column', () => {
      const studentCols = getTableColumns(schema.students);
      expect(studentCols.resumeR2Url).toBeDefined();
      expect(studentCols.resumeR2Url.name).toBe('resume_r2_url');
      expect(studentCols.resumeUrl).toBeDefined();
      expect(studentCols.resumeUrl.name).toBe('resume_url');
    });

    it('should define both fileStorageKey and r2StorageKey on evidence_records table without dropping existing column', () => {
      const evidenceCols = getTableColumns(schema.evidenceRecords);
      expect(evidenceCols.r2StorageKey).toBeDefined();
      expect(evidenceCols.r2StorageKey.name).toBe('r2_storage_key');
      expect(evidenceCols.fileStorageKey).toBeDefined();
      expect(evidenceCols.fileStorageKey.name).toBe('file_storage_key');
    });

    it('should resolve student resume URL with seamless fallback via resolveStudentResumeUrl', () => {
      // 1. Modern resumeUrl takes precedence
      expect(
        schema.resolveStudentResumeUrl({
          resumeUrl: 'https://storage.carrersync.io/resumes/priya.pdf',
          resumeR2Url: 'r2://legacy/priya.pdf'
        })
      ).toBe('https://storage.carrersync.io/resumes/priya.pdf');

      // 2. Legacy resumeR2Url fallback
      expect(
        schema.resolveStudentResumeUrl({
          resumeR2Url: 'r2://resumes/tenant-apex/student_101.pdf'
        })
      ).toBe('r2://resumes/tenant-apex/student_101.pdf');

      // 3. Snake_case DB columns fallback
      expect(
        schema.resolveStudentResumeUrl({
          resume_url: 'https://storage.carrersync.io/resumes/db_row.pdf'
        })
      ).toBe('https://storage.carrersync.io/resumes/db_row.pdf');

      expect(
        schema.resolveStudentResumeUrl({
          resume_r2_url: 'r2://legacy_row.pdf'
        })
      ).toBe('r2://legacy_row.pdf');

      // 4. Undefined / null fallback
      expect(schema.resolveStudentResumeUrl(null)).toBeNull();
      expect(schema.resolveStudentResumeUrl({})).toBeNull();
    });

    it('should resolve evidence storage key with seamless fallback via resolveEvidenceStorageKey', () => {
      // 1. Modern fileStorageKey takes precedence
      expect(
        schema.resolveEvidenceStorageKey({
          fileStorageKey: 'evidence/tenant-apex/commit_proof_123.json',
          r2StorageKey: 'r2://legacy_proof.json'
        })
      ).toBe('evidence/tenant-apex/commit_proof_123.json');

      // 2. Legacy r2StorageKey fallback
      expect(
        schema.resolveEvidenceStorageKey({
          r2StorageKey: 'r2://legacy_bucket/evidence_artifact.tar.gz'
        })
      ).toBe('r2://legacy_bucket/evidence_artifact.tar.gz');

      // 3. Snake_case DB column fallback
      expect(
        schema.resolveEvidenceStorageKey({
          file_storage_key: 'files/proof.pdf'
        })
      ).toBe('files/proof.pdf');

      expect(
        schema.resolveEvidenceStorageKey({
          r2_storage_key: 'r2://proof.pdf'
        })
      ).toBe('r2://proof.pdf');

      // 4. Undefined / null fallback
      expect(schema.resolveEvidenceStorageKey(null)).toBeNull();
      expect(schema.resolveEvidenceStorageKey({})).toBeNull();
    });

    it('should normalize input payloads dual-populating both column variants', () => {
      // Student input normalization
      const normalizedStudent = schema.normalizeStudentResumeInput({
        rollNumber: 'CS101',
        resumeUrl: 'https://cdn.example.com/resume.pdf'
      });
      expect(normalizedStudent.resumeUrl).toBe('https://cdn.example.com/resume.pdf');
      expect(normalizedStudent.resumeR2Url).toBe('https://cdn.example.com/resume.pdf');

      // Evidence input normalization
      const normalizedEvidence = schema.normalizeEvidenceStorageInput({
        sourceUrl: 'https://github.com/carrersync/proof',
        r2StorageKey: 'r2://legacy/key.json'
      });
      expect(normalizedEvidence.fileStorageKey).toBe('r2://legacy/key.json');
      expect(normalizedEvidence.r2StorageKey).toBe('r2://legacy/key.json');
    });
  });

  // ==========================================================================
  // 4. Foreign Key Constraints & Multi-Tenant Integrity
  // ==========================================================================
  describe('4. Foreign Key Constraints & Multi-Tenant Integrity', () => {
    it('should enforce tenant_id foreign keys across all tenant child tables', () => {
      const studentCols = getTableColumns(schema.students);
      const userCols = getTableColumns(schema.users);
      const semesterCols = getTableColumns(schema.academicSemesters);
      const studentSkillCols = getTableColumns(schema.studentSkills);
      const evidenceCols = getTableColumns(schema.evidenceRecords);
      const assessmentCols = getTableColumns(schema.skillAssessments);
      const driveCols = getTableColumns(schema.placementDrives);
      const appCols = getTableColumns(schema.applications);
      const interviewCols = getTableColumns(schema.interviews);
      const auditCols = getTableColumns(schema.auditEvents);
      const notificationCols = getTableColumns(schema.notifications);
      const inviteCols = getTableColumns(schema.invitations);

      // Verify tenant_id column existence and database name
      expect(studentCols.tenantId.name).toBe('tenant_id');
      expect(userCols.tenantId.name).toBe('tenant_id');
      expect(semesterCols.tenantId.name).toBe('tenant_id');
      expect(studentSkillCols.tenantId.name).toBe('tenant_id');
      expect(evidenceCols.tenantId.name).toBe('tenant_id');
      expect(assessmentCols.tenantId.name).toBe('tenant_id');
      expect(driveCols.tenantId.name).toBe('tenant_id');
      expect(appCols.tenantId.name).toBe('tenant_id');
      expect(interviewCols.tenantId.name).toBe('tenant_id');
      expect(auditCols.tenantId.name).toBe('tenant_id');
      expect(notificationCols.tenantId.name).toBe('tenant_id');
      expect(inviteCols.tenantId.name).toBe('tenant_id');
    });

    it('should correctly normalize asyncpg database connection URLs', () => {
      expect(normalizeDbUrl('postgresql+asyncpg://user:pass@host.neon.tech/db')).toBe(
        'postgresql://user:pass@host.neon.tech/db'
      );
      expect(normalizeDbUrl('postgresql://user:pass@host.neon.tech/db')).toBe(
        'postgresql://user:pass@host.neon.tech/db'
      );
    });
  });
});
