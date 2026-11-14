/**
 * CarrerSync Database Model Registry & Schema Blueprints
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Multi-Tenant Isolation: Every college/institution record MUST include a mandatory `tenantId`.
 *    Tenant isolation is enforced strictly at the database query level on the backend.
 * 2. Source of Truth: MongoDB Atlas Free Tier is the authoritative persistence store.
 *    Graph memory (FalkorDB) is a derived, rebuildable projection.
 * 3. Minimal Schema Genesis: In this foundation phase, collections are planned and documented.
 *    Concrete models are instantiated only as features are implemented.
 * 
 * PLANNED COLLECTIONS & SCHEMA BLUEPRINTS:
 * 
 * 1. Users:
 *    - _id, tenantId, email, passwordHash, role ('student' | 'admin' | 'recruiter'), status, createdAt, updatedAt
 * 
 * 2. Students:
 *    - _id, tenantId, userId, rollNumber, department, graduationYear, cgpa, verifiedSkills: [], profileStatus
 * 
 * 3. Evidence:
 *    - _id, tenantId, studentId, type ('github_repo' | 'project_artifact' | 'certificate' | 'assessment'),
 *      sourceUrl, verificationStatus ('pending' | 'verified' | 'rejected'), extractedMetrics: {}, verifiedAt
 * 
 * 4. Skills:
 *    - _id, name, category ('languages' | 'frameworks' | 'databases' | 'cloud' | 'core_cs'), canonicalSlug
 * 
 * 5. Projects:
 *    - _id, tenantId, studentId, title, description, repoUrl, liveUrl, techStack: [], evidenceId
 * 
 * 6. JobRequirements:
 *    - _id, tenantId, driveId, companyName, roleTitle, requiredSkills: [], minimumCgpa, eligibleBranches: []
 * 
 * 7. LearningPaths:
 *    - _id, tenantId, studentId, targetRoleId, identifiedGaps: [], recommendations: [], progressPercentage
 * 
 * 8. Drives:
 *    - _id, tenantId, companyName, hiringBatch, jobRoles: [], dates: {}, driveStatus ('upcoming' | 'active' | 'completed')
 * 
 * 9. EligibilityRules:
 *    - _id, tenantId, driveId, criteria: { minCgpa, maxBacklogs, requiredSkills, branchFilters }, ruleEngineVersion
 * 
 * 10. EligibilityResults:
 *    - _id, tenantId, driveId, studentId, isEligible, evaluationLog: [], evaluatedAt
 * 
 * 11. AuditLogs:
 *    - _id, tenantId, actorId, actorRole, action, targetResource, ipAddress, userAgent, timestamp
 */

module.exports = {
  COLLECTIONS: {
    USERS: 'Users',
    STUDENTS: 'Students',
    EVIDENCE: 'Evidence',
    SKILLS: 'Skills',
    PROJECTS: 'Projects',
    JOB_REQUIREMENTS: 'JobRequirements',
    LEARNING_PATHS: 'LearningPaths',
    DRIVES: 'Drives',
    ELIGIBILITY_RULES: 'EligibilityRules',
    ELIGIBILITY_RESULTS: 'EligibilityResults',
    AUDIT_LOGS: 'AuditLogs',
  },
  TENANT_FIELD: 'tenantId',
};
