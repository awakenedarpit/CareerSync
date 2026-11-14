/**
 * Graph Memory Permissions & Multi-Tenant Isolation
 * 
 * Ensures graph operations cannot breach multi-tenant boundaries.
 * Every Cypher query and projection MUST include tenant parameterization.
 */

class MemoryPermissions {
  /**
   * Validates and injects tenant constraints into graph query parameters.
   * @param {string} tenantId - Tenant identifier
   * @param {object} params - Query parameters
   * @returns {object} Safe parameters with guaranteed tenant binding
   */
  enforceTenantScope(tenantId, params = {}) {
    if (!tenantId) {
      throw new Error('Tenant isolation violation: tenantId is strictly required for graph memory access.');
    }

    return {
      ...params,
      tenantId: String(tenantId).trim(),
    };
  }

  /**
   * Asserts that a node or relationship belongs to the requesting tenant.
   * @param {object} graphEntity 
   * @param {string} tenantId 
   */
  assertEntityTenant(graphEntity, tenantId) {
    if (!graphEntity || graphEntity.tenantId !== tenantId) {
      throw new Error('Unauthorized cross-tenant graph access attempt blocked.');
    }
    return true;
  }
}

module.exports = new MemoryPermissions();
