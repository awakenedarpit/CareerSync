/**
 * Graph Memory Audit & Access Logger
 * Tracks graph queries, sync operations, and potential boundary violations.
 */

const logger = require('../utils/logger');

class MemoryAudit {
  /**
   * Logs a graph access event for security auditing.
   * @param {string} tenantId 
   * @param {string} actorId 
   * @param {string} operation 
   * @param {object} metadata 
   */
  logAccess(tenantId, actorId, operation, metadata = {}) {
    logger.debug(`[Memory Audit] Tenant: ${tenantId} | Actor: ${actorId} | Op: ${operation}`, metadata);
  }

  /**
   * Logs a security breach attempt for immediate triage.
   */
  logSecurityViolation(tenantId, actorId, reason) {
    logger.error(`[SECURITY ALERT] [Memory Audit] Cross-tenant violation detected! Tenant: ${tenantId} | Actor: ${actorId} | Reason: ${reason}`);
  }
}

module.exports = new MemoryAudit();
