/**
 * FalkorDB Graph Schema & Ontological Graph Definition
 * 
 * Defines node labels, relationship types, and Cypher query templates
 * representing the multi-tenant skill and placement knowledge graph.
 * 
 * KNOWLEDGE GRAPH TRAVERSAL:
 * (Student)-[:HAS_SKILL]->(Skill)
 * (Skill)-[:VERIFIED_BY]->(Evidence)
 * (Evidence)-[:PRODUCED_IN]->(Project)
 * (Student)-[:ASPIRES_TO]->(CareerGoal)
 * (CareerGoal)-[:TARGETS_ROLE]->(JobRole)
 * (JobRole)-[:REQUIRES_SKILL]->(Skill)
 * (Student)-[:HAS_GAP]->(SkillGap)
 * (SkillGap)-[:RESOLVED_BY]->(LearningTask)
 */

const LABELS = {
  STUDENT: 'Student',
  SKILL: 'Skill',
  EVIDENCE: 'Evidence',
  PROJECT: 'Project',
  CAREER_GOAL: 'CareerGoal',
  JOB_ROLE: 'JobRole',
  SKILL_GAP: 'SkillGap',
  LEARNING_TASK: 'LearningTask',
};

const RELATIONSHIPS = {
  HAS_SKILL: 'HAS_SKILL',
  VERIFIED_BY: 'VERIFIED_BY',
  PRODUCED_IN: 'PRODUCED_IN',
  ASPIRES_TO: 'ASPIRES_TO',
  TARGETS_ROLE: 'TARGETS_ROLE',
  REQUIRES_SKILL: 'REQUIRES_SKILL',
  HAS_GAP: 'HAS_GAP',
  RESOLVED_BY: 'RESOLVED_BY',
};

// Standardized Cypher Query Templates for future projection and agent traversal
const CYPHER_TEMPLATES = {
  // Enforces tenant isolation in Cypher traversals
  GET_STUDENT_SKILL_GRAPH: `
    MATCH (s:Student { id: $studentId, tenantId: $tenantId })-[r:HAS_SKILL]->(sk:Skill)
    OPTIONAL MATCH (sk)-[:VERIFIED_BY]->(e:Evidence { tenantId: $tenantId })
    RETURN s, r, sk, e
  `,

  IDENTIFY_SKILL_GAPS: `
    MATCH (s:Student { id: $studentId, tenantId: $tenantId })-[:ASPIRES_TO]->(g:CareerGoal)-[:TARGETS_ROLE]->(jr:JobRole)
    MATCH (jr)-[:REQUIRES_SKILL]->(reqSkill:Skill)
    WHERE NOT (s)-[:HAS_SKILL]->(reqSkill)
    RETURN reqSkill.name AS missingSkill, reqSkill.category AS category, jr.title AS targetRole
  `,
};

module.exports = {
  LABELS,
  RELATIONSHIPS,
  CYPHER_TEMPLATES,
};
