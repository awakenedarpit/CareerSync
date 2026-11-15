/**
 * Skill Gap Diagnostics Service
 * CarrerSync Phase 10
 *
 * Deterministic diagnostic comparison of student verified & evidence-backed
 * skills against target job/role technical requirements.
 */

import { profilingService } from '../services/profiling.service';
import { getDb } from '../db/client';
import { studentSkills, skills, students } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import {
  SkillGapItem,
  SkillGapDiagnosis,
  SkillGapStatus,
  SkillGapSeverity
} from './readiness.types';

// Curated learning pathways and recommended activities for common technical domains
const CURATED_LEARNING_MAP: Record<
  string,
  { category: string; learning: string; activity: string }
> = {
  python: {
    category: 'Programming Languages',
    learning: 'Master Python core data structures, OOP concepts, and asynchronous programming (asyncio).',
    activity: 'Build a production-grade REST API with FastAPI or an automated data pipeline with PyTest suite.'
  },
  javascript: {
    category: 'Programming Languages',
    learning: 'Deep-dive into modern ES6+ features, closures, event loop, and asynchronous JavaScript (Promises/Async-Await).',
    activity: 'Implement an interactive frontend application with state management and automated Jest testing.'
  },
  typescript: {
    category: 'Programming Languages',
    learning: 'Study strict type systems, generics, utility types, and AST configuration for production TypeScript.',
    activity: 'Refactor an untyped JavaScript codebase to strict TypeScript with 100% type safety and custom type guards.'
  },
  java: {
    category: 'Programming Languages',
    learning: 'Master Java 17/21 LTS features, JVM internals, multithreading, and Spring Boot framework fundamentals.',
    activity: 'Develop a microservices backend with Spring Boot, Spring Data JPA, and JUnit 5 unit tests.'
  },
  react: {
    category: 'Web Development',
    learning: 'Study React 18 concurrency, custom hooks, context API, and server-side rendering with Next.js.',
    activity: 'Build a responsive single-page application with TailwindCSS, React Query, and end-to-end Playwright tests.'
  },
  'node.js': {
    category: 'Backend Development',
    learning: 'Understand Node.js event loop, streams, worker threads, and secure API architecture with Express/Fastify.',
    activity: 'Build a high-throughput RESTful API with authentication, rate-limiting, and PostgreSQL integration.'
  },
  sql: {
    category: 'Databases',
    learning: 'Master relational schema design, indexing strategies, query execution plans (EXPLAIN ANALYZE), and ACID transactions.',
    activity: 'Design a normalized database schema with complex JOINs, CTEs, and window functions on PostgreSQL.'
  },
  postgresql: {
    category: 'Databases',
    learning: 'Study PostgreSQL performance tuning, JSONB querying, full-text search, and connection pooling.',
    activity: 'Optimize slow queries, add composite indexes, and implement partition tables for time-series data.'
  },
  docker: {
    category: 'Cloud & DevOps',
    learning: 'Learn containerization best practices, multi-stage Docker builds, image slimming, and security scanning.',
    activity: 'Containerize a full-stack web application with multi-stage Dockerfile and Docker Compose orchestration.'
  },
  kubernetes: {
    category: 'Cloud & DevOps',
    learning: 'Understand Pods, Deployments, Services, ConfigMaps, Ingress controllers, and Helm charts.',
    activity: 'Deploy a high-availability multi-service app to Minikube or local K8s cluster with health checks.'
  },
  aws: {
    category: 'Cloud & DevOps',
    learning: 'Study AWS core services: EC2, S3, RDS, Lambda, IAM policies, and VPC networking architecture.',
    activity: 'Deploy an automated serverless pipeline using AWS CDK or Terraform with automated CI/CD.'
  },
  git: {
    category: 'Developer Tools',
    learning: 'Master Git branching workflows (GitFlow, trunk-based), interactive rebase, and conflict resolution.',
    activity: 'Maintain an active GitHub repository with conventional commits, PR templates, and GitHub Actions CI.'
  }
};

export class SkillGapService {
  private static instance: SkillGapService;

  private constructor() {}

  public static getInstance(): SkillGapService {
    if (!SkillGapService.instance) {
      SkillGapService.instance = new SkillGapService();
    }
    return SkillGapService.instance;
  }

  /**
   * Normalizes skill string for comparison (removes punctuation, lowercases, handles aliases)
   */
  public normalizeSkillName(name: string): string {
    const cleaned = name.trim().toLowerCase().replace(/[\s\-_.]+/g, '');
    if (cleaned === 'nodejs' || cleaned === 'node') return 'node.js';
    if (cleaned === 'reactjs' || cleaned === 'react') return 'react';
    if (cleaned === 'postgres' || cleaned === 'psql') return 'postgresql';
    if (cleaned === 'golang') return 'go';
    if (cleaned === 'k8s') return 'kubernetes';
    return name.trim();
  }

  /**
   * Diagnoses skill gaps for a student given a set of required and optional preferred skills.
   *
   * @param studentId Student user ID or student record ID
   * @param tenantId Tenant ID for isolation
   * @param requiredSkills Array of mandatory skill names
   * @param preferredSkills Optional array of preferred skill names
   * @param targetRole Optional target role description
   */
  public async diagnoseSkillGaps(
    studentId: string,
    tenantId: string,
    requiredSkills: string[],
    preferredSkills: string[] = [],
    targetRole?: string
  ): Promise<SkillGapDiagnosis> {
    // 1. Gather all student evidence and declared skills
    const studentSkillsMap = await this.getStudentSkillEvidenceMap(studentId, tenantId);

    const items: SkillGapItem[] = [];
    let requiredScoreAccumulator = 0;
    let preferredScoreAccumulator = 0;

    let verifiedMatches = 0;
    let evidenceMatches = 0;
    let pendingVerification = 0;
    let missingSkills = 0;

    // 2. Evaluate Required Skills
    for (const reqSkill of requiredSkills) {
      const match = this.findMatchingSkill(reqSkill, studentSkillsMap);
      const curated = this.getCuratedLearning(reqSkill);

      if (match) {
        if (match.verificationStatus === 'VERIFIED') {
          items.push({
            skillName: reqSkill,
            category: match.category || curated.category,
            status: 'VERIFIED_MATCH',
            gapSeverity: 'MINOR',
            suggestedLearning: curated.learning,
            recommendedActivity: curated.activity
          });
          requiredScoreAccumulator += 1.0;
          verifiedMatches++;
        } else if (
          match.verificationStatus === 'EVIDENCE_FOUND' ||
          match.evidenceType === 'PROJECT' ||
          match.evidenceType === 'CERTIFICATE'
        ) {
          items.push({
            skillName: reqSkill,
            category: match.category || curated.category,
            status: 'EVIDENCE_MATCH',
            gapSeverity: 'MODERATE',
            suggestedLearning: 'Evidence exists. Prepare documentation for formal TPO verification.',
            recommendedActivity: 'Submit repository link or certificate to TPO for one-click verification.'
          });
          requiredScoreAccumulator += 0.75;
          evidenceMatches++;
        } else {
          items.push({
            skillName: reqSkill,
            category: match.category || curated.category,
            status: 'PENDING_VERIFICATION',
            gapSeverity: 'MODERATE',
            suggestedLearning: curated.learning,
            recommendedActivity: 'Provide verifiable code or assessment proof to support your claim.'
          });
          requiredScoreAccumulator += 0.4;
          pendingVerification++;
        }
      } else {
        items.push({
          skillName: reqSkill,
          category: curated.category,
          status: 'MISSING_SKILL',
          gapSeverity: 'CRITICAL',
          suggestedLearning: curated.learning,
          recommendedActivity: curated.activity
        });
        missingSkills++;
      }
    }

    // 3. Evaluate Preferred Skills (if any)
    for (const prefSkill of preferredSkills) {
      // Skip if already in required
      if (requiredSkills.some((r) => this.normalizeSkillName(r) === this.normalizeSkillName(prefSkill))) {
        continue;
      }

      const match = this.findMatchingSkill(prefSkill, studentSkillsMap);
      const curated = this.getCuratedLearning(prefSkill);

      if (match) {
        if (match.verificationStatus === 'VERIFIED') {
          items.push({
            skillName: prefSkill,
            category: match.category || curated.category,
            status: 'VERIFIED_MATCH',
            gapSeverity: 'MINOR',
            suggestedLearning: curated.learning,
            recommendedActivity: curated.activity
          });
          preferredScoreAccumulator += 1.0;
        } else if (match.verificationStatus === 'EVIDENCE_FOUND') {
          items.push({
            skillName: prefSkill,
            category: match.category || curated.category,
            status: 'EVIDENCE_MATCH',
            gapSeverity: 'MINOR',
            suggestedLearning: 'Evidence found. Verification recommended.',
            recommendedActivity: curated.activity
          });
          preferredScoreAccumulator += 0.75;
        } else {
          items.push({
            skillName: prefSkill,
            category: match.category || curated.category,
            status: 'PENDING_VERIFICATION',
            gapSeverity: 'MINOR',
            suggestedLearning: curated.learning,
            recommendedActivity: curated.activity
          });
          preferredScoreAccumulator += 0.4;
        }
      } else {
        items.push({
          skillName: prefSkill,
          category: curated.category,
          status: 'MISSING_SKILL',
          gapSeverity: 'MINOR',
          suggestedLearning: curated.learning,
          recommendedActivity: curated.activity
        });
      }
    }

    // 4. Calculate Overall Fit Score
    const totalRequired = requiredSkills.length;
    const totalPreferred = preferredSkills.length;

    let overallFitScore = 0;
    if (totalRequired > 0 && totalPreferred > 0) {
      const reqPercent = (requiredScoreAccumulator / totalRequired) * 80;
      const prefPercent = (preferredScoreAccumulator / totalPreferred) * 20;
      overallFitScore = Math.round(reqPercent + prefPercent);
    } else if (totalRequired > 0) {
      overallFitScore = Math.round((requiredScoreAccumulator / totalRequired) * 100);
    } else if (totalPreferred > 0) {
      overallFitScore = Math.round((preferredScoreAccumulator / totalPreferred) * 100);
    } else {
      overallFitScore = 100;
    }

    // Ensure range 0 - 100
    overallFitScore = Math.max(0, Math.min(100, overallFitScore));

    // 5. Generate Targeted Recommendations
    const recommendations: string[] = [];
    const criticalMissing = items.filter(
      (i) => i.status === 'MISSING_SKILL' && i.gapSeverity === 'CRITICAL'
    );
    const unverifiedEvidence = items.filter((i) => i.status === 'EVIDENCE_MATCH');
    const pendingVerificationItems = items.filter((i) => i.status === 'PENDING_VERIFICATION');

    if (criticalMissing.length > 0) {
      recommendations.push(
        `High Priority: Acquire foundational skills in ${criticalMissing
          .map((i) => i.skillName)
          .join(', ')} before applying.`
      );
    }

    if (unverifiedEvidence.length > 0) {
      recommendations.push(
        `Verification Opportunity: Request TPO review for ${unverifiedEvidence
          .map((i) => i.skillName)
          .join(', ')} to convert evidence into verified matches.`
      );
    }

    if (pendingVerificationItems.length > 0) {
      recommendations.push(
        `Evidence Needed: Attach project or assessment proof for self-declared skills: ${pendingVerificationItems
          .map((i) => i.skillName)
          .join(', ')}.`
      );
    }

    if (items.length > 0 && criticalMissing.length === 0 && unverifiedEvidence.length === 0) {
      recommendations.push(
        'Strong Match: Student meets core technical requirements. Focus on interview prep and domain projects.'
      );
    }

    return {
      studentId,
      targetRole,
      overallFitScore,
      summary: {
        totalRequired,
        verifiedMatches,
        evidenceMatches,
        pendingVerification,
        missingSkills
      },
      gaps: items,
      recommendations
    };
  }

  /**
   * Helper to retrieve all skill evidence for a student across both profileSkillEvidence and studentSkills
   */
  public async getStudentSkillEvidenceMap(
    studentId: string,
    tenantId: string
  ): Promise<
    Map<
      string,
      {
        skillName: string;
        category: string;
        verificationStatus: string;
        evidenceType: string;
      }
    >
  > {
    const skillMap = new Map<
      string,
      {
        skillName: string;
        category: string;
        verificationStatus: string;
        evidenceType: string;
      }
    >();

    // 1. Evidence records from profiling service
    try {
      const evidenceList = await profilingService.getStudentEvidence(studentId, tenantId);
      for (const ev of evidenceList) {
        const key = this.normalizeSkillName(ev.skillName);
        const existing = skillMap.get(key);

        // Prefer VERIFIED > EVIDENCE_FOUND > PENDING_REVIEW > SELF_DECLARED
        if (!existing || ev.verificationStatus === 'VERIFIED') {
          skillMap.set(key, {
            skillName: ev.skillName,
            category: ev.category || 'Technical',
            verificationStatus: ev.verificationStatus,
            evidenceType: ev.evidenceType
          });
        }
      }
    } catch {
      // Fallback
    }

    // 2. Query studentSkills table if available
    try {
      const db = getDb();

      // Resolve student record if studentId was userId or studentId
      const studentRecords = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.tenantId, tenantId),
            // match either student id or user id
            eq(students.userId, studentId)
          )
        );

      const targetStudentId = studentRecords.length > 0 ? studentRecords[0].id : studentId;

      const rows = await db
        .select({
          skillName: skills.name,
          category: skills.category,
          state: studentSkills.state
        })
        .from(studentSkills)
        .innerJoin(skills, eq(studentSkills.skillId, skills.id))
        .where(
          and(
            eq(studentSkills.tenantId, tenantId),
            eq(studentSkills.studentId, targetStudentId)
          )
        );

      for (const row of rows) {
        const key = this.normalizeSkillName(row.skillName);
        const existing = skillMap.get(key);

        const statusMapped =
          row.state === 'Verified'
            ? 'VERIFIED'
            : row.state === 'Evidence-linked'
            ? 'EVIDENCE_FOUND'
            : row.state === 'Observed'
            ? 'PENDING_REVIEW'
            : 'SELF_DECLARED';

        if (!existing || statusMapped === 'VERIFIED') {
          skillMap.set(key, {
            skillName: row.skillName,
            category: row.category || 'Technical',
            verificationStatus: statusMapped,
            evidenceType: 'PROJECT'
          });
        }
      }
    } catch {
      // DB offline fallback
    }

    return skillMap;
  }

  private findMatchingSkill(
    searchName: string,
    skillMap: Map<string, { skillName: string; category: string; verificationStatus: string; evidenceType: string }>
  ) {
    const normalized = this.normalizeSkillName(searchName);
    return skillMap.get(normalized);
  }

  private getCuratedLearning(skillName: string): {
    category: string;
    learning: string;
    activity: string;
  } {
    const key = skillName.trim().toLowerCase();
    if (CURATED_LEARNING_MAP[key]) {
      return CURATED_LEARNING_MAP[key];
    }

    return {
      category: 'Technical Skills',
      learning: `Review documentation and core architectural patterns for ${skillName}.`,
      activity: `Build and document an end-to-end project demonstrating competence in ${skillName}.`
    };
  }
}

export const skillGapService = SkillGapService.getInstance();
