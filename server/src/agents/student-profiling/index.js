/**
 * Agent 1: Student Profiling Agent (Interface Boundary)
 * 
 * ROLE:
 * Ingests evidence (GitHub repositories, commits, project artifacts, code submissions)
 * and extracts verified skills and confidence levels.
 * 
 * HYBRID EXECUTION:
 * - Primary (Free Quota): Gemini API parses code structures and generates skill summaries.
 * - Fallback: Deterministic keyword taxonomy parser and dependency manifest analyzer.
 * 
 * STATUS: Phase 1 Interface Boundary Prepared.
 */

const aiService = require('../../services/ai.service');

class StudentProfilingAgent {
  /**
   * Deterministic rule-based fallback for profiling code evidence.
   */
  fallbackProfileExtractor(evidence) {
    const extractedSkills = [];
    const text = JSON.stringify(evidence).toLowerCase();

    const taxonomy = [
      { skill: 'React', patterns: ['react', 'jsx', 'tsx'] },
      { skill: 'Node.js', patterns: ['express', 'node', 'npm'] },
      { skill: 'JavaScript', patterns: ['javascript', '.js'] },
      { skill: 'Python', patterns: ['python', '.py', 'django', 'flask'] },
      { skill: 'MongoDB', patterns: ['mongodb', 'mongoose'] },
      { skill: 'SQL', patterns: ['sql', 'postgres', 'mysql'] },
    ];

    taxonomy.forEach(({ skill, patterns }) => {
      if (patterns.some((p) => text.includes(p))) {
        extractedSkills.push({ name: skill, confidence: 0.8, method: 'rule_based_keyword' });
      }
    });

    return {
      studentId: evidence.studentId,
      verifiedSkills: extractedSkills,
      mode: 'deterministic_fallback',
    };
  }

  async profileStudentEvidence(evidence) {
    return aiService.executeHybridTask(
      'student_profiling',
      evidence,
      this.fallbackProfileExtractor
    );
  }
}

module.exports = new StudentProfilingAgent();
