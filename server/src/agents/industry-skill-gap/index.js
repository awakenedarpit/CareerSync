/**
 * Agent 2: Industry Skill-Gap Agent (Interface Boundary)
 * 
 * ROLE:
 * Analyzes live industry job descriptions and drives, compares them against
 * a student's verified profile, identifies missing proficiencies, and generates
 * actionable learning paths.
 * 
 * HYBRID EXECUTION:
 * - Primary (Free Quota): Gemini API semantically evaluates job specs vs student profile.
 * - Fallback: Set-theoretic subtraction of required skills vs verified skills.
 * 
 * STATUS: Phase 1 Interface Boundary Prepared.
 */

const aiService = require('../../services/ai.service');

class IndustrySkillGapAgent {
  /**
   * Deterministic rule-based fallback for identifying skill gaps.
   */
  fallbackGapAnalysis({ studentSkills = [], jobRequirements = [] }) {
    const verifiedSet = new Set(studentSkills.map((s) => s.toLowerCase()));
    const missingSkills = jobRequirements.filter((req) => !verifiedSet.has(req.toLowerCase()));

    return {
      matchPercentage: Math.round(((jobRequirements.length - missingSkills.length) / (jobRequirements.length || 1)) * 100),
      missingSkills,
      recommendedActions: missingSkills.map((skill) => `Complete project milestone covering ${skill}`),
      mode: 'deterministic_set_difference',
    };
  }

  async analyzeGaps(payload) {
    return aiService.executeHybridTask(
      'industry_skill_gap',
      payload,
      this.fallbackGapAnalysis
    );
  }
}

module.exports = new IndustrySkillGapAgent();
