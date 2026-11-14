/**
 * Agent 4: Placement Orchestration Agent (Interface Boundary)
 * 
 * ROLE:
 * Automates and orchestrates the campus recruitment workflow: drive setup,
 * eligibility enforcement, dynamic shortlist generation, student notifications,
 * and round progression.
 * 
 * HYBRID EXECUTION:
 * - Primary (Free Quota): Gemini API generates automated contextual communications and summaries.
 * - Fallback: Finite state machine governing drive lifecycles and eligibility rules.
 * 
 * STATUS: Phase 1 Interface Boundary Prepared.
 */

const aiService = require('../../services/ai.service');

class PlacementOrchestrationAgent {
  /**
   * Deterministic rule-based fallback for eligibility rule matching.
   */
  fallbackEligibilityEvaluation({ student, criteria }) {
    const reasons = [];

    if (student.cgpa < criteria.minCgpa) {
      reasons.push(`CGPA ${student.cgpa} is below minimum requirement of ${criteria.minCgpa}`);
    }

    if (criteria.allowedBranches && !criteria.allowedBranches.includes(student.department)) {
      reasons.push(`Department ${student.department} is not in eligible branches`);
    }

    const isEligible = reasons.length === 0;

    return {
      studentId: student.id,
      isEligible,
      reasons,
      mode: 'deterministic_criteria_engine',
    };
  }

  async evaluateEligibility(payload) {
    return aiService.executeHybridTask(
      'placement_orchestration',
      payload,
      this.fallbackEligibilityEvaluation
    );
  }
}

module.exports = new PlacementOrchestrationAgent();
