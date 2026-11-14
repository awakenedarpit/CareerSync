/**
 * CarrerSync Hybrid AI Service Boundary
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Zero-Cost Policy: Uses Google Gemini Free Tier only. No paid tiers or credit cards.
 * 2. Deterministic Fallback: Every agent operation has a deterministic, rule-based
 *    fallback function. If Gemini API is unconfigured, unreachable, or rate-limited,
 *    the platform remains 100% operational.
 * 3. Core Operation Immunity: Basic operations (authentication, profile viewing,
 *    eligibility criteria checking, database queries) NEVER depend on AI.
 * 4. Phase 1 Status: Interface boundary prepared. No external API calls are dispatched in this phase.
 */

const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.isAvailable = Boolean(this.apiKey);
  }

  /**
   * Returns current AI provider status and availability.
   */
  getStatus() {
    return {
      provider: 'Google Gemini Free Tier',
      configured: this.isAvailable,
      fallbackMode: this.isAvailable ? 'hybrid' : 'rule_based_only',
      zeroCostEnforced: true,
    };
  }

  /**
   * Dispatches task to Gemini or invokes the deterministic fallback.
   * In Phase 1, always invokes the rule-based fallback safely.
   * 
   * @param {string} taskName 
   * @param {object} payload 
   * @param {Function} deterministicFallback 
   */
  async executeHybridTask(taskName, payload, deterministicFallback) {
    logger.debug(`[AI Service] Executing task "${taskName}" via deterministic engine.`);
    
    // In Phase 1 foundation, execute the rule-based fallback directly
    if (typeof deterministicFallback === 'function') {
      return deterministicFallback(payload);
    }
    
    return {
      status: 'fallback_executed',
      task: taskName,
      data: payload,
    };
  }
}

module.exports = new AIService();
