import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import {
  agentOrchestrationService,
  delegationService,
  observabilityService,
  getRegisteredWorkflows,
  getWorkflowDefinition,
  type AgentName,
  type WorkflowStatus
} from '../orchestration';

export const orchestrationRoutes = Router();

orchestrationRoutes.use(requireAuth);
orchestrationRoutes.use(tenantMiddleware);

/**
 * 1. GET /api/v1/orchestration/registry
 * Returns all pre-configured registered workflow definitions
 */
orchestrationRoutes.get('/registry', (req: Request, res: Response) => {
  try {
    const registry = getRegisteredWorkflows();
    return res.json({
      success: true,
      data: registry,
      count: registry.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch workflow registry'
    });
  }
});

/**
 * 2. POST /api/v1/orchestration/workflows
 * Initiate a workflow with RBAC validation, idempotency, and payload verification
 */
orchestrationRoutes.post('/workflows', async (req: Request, res: Response) => {
  try {
    const { workflowDefinitionId, inputPayload, idempotencyKey, priority } = req.body;

    if (!workflowDefinitionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: workflowDefinitionId'
      });
    }

    if (!inputPayload || typeof inputPayload !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid field: inputPayload must be an object'
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Tenant context is missing from request'
      });
    }

    const result = await agentOrchestrationService.initiateWorkflow({
      tenantId,
      initiatedBy: req.user!.id,
      initiatingRole: req.user!.role,
      workflowDefinitionId,
      inputPayload,
      idempotencyKey,
      priority
    });

    const statusCode = result.isIdempotentReplay ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      data: result.workflow,
      isIdempotentReplay: result.isIdempotentReplay,
      message: result.isIdempotentReplay
        ? 'Workflow returned from idempotent replay'
        : 'Workflow initiated successfully'
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to initiate workflow';
    if (message.includes('not authorized')) {
      return res.status(403).json({ success: false, error: message });
    }
    if (message.includes('validation failed') || message.includes('not registered')) {
      return res.status(400).json({ success: false, error: message });
    }
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * 3. GET /api/v1/orchestration/workflows
 * List workflows for tenant with optional status filter and pagination
 */
orchestrationRoutes.get('/workflows', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const status = req.query.status as WorkflowStatus | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await agentOrchestrationService.listWorkflows(tenantId, {
      status,
      limit,
      offset
    });

    return res.json({
      success: true,
      data: result.workflows,
      total: result.total,
      limit,
      offset
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to list workflows'
    });
  }
});

/**
 * 4. GET /api/v1/orchestration/workflows/:id
 * Get workflow execution status, steps, execution events, and output
 */
orchestrationRoutes.get('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const workflowId = String(req.params.id);
    const workflow = await agentOrchestrationService.getWorkflow(tenantId, workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: `Workflow '${workflowId}' not found`
      });
    }

    const eventsResult = await observabilityService.getEvents(tenantId, {
      workflowId
    });

    return res.json({
      success: true,
      data: {
        ...workflow,
        events: eventsResult.events
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get workflow'
    });
  }
});

/**
 * 5. POST /api/v1/orchestration/workflows/:id/approve
 * Human-in-the-loop approval or rejection for waiting workflow
 */
orchestrationRoutes.post('/workflows/:id/approve', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const { action, reviewerNotes = '' } = req.body;
    if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Action must be either 'APPROVED' or 'REJECTED'"
      });
    }

    const workflowId = String(req.params.id);
    const updated = await agentOrchestrationService.approveWorkflow(
      tenantId,
      workflowId,
      req.user!.id,
      req.user!.role,
      action,
      reviewerNotes
    );

    return res.json({
      success: true,
      data: updated,
      message: `Workflow ${action.toLowerCase()} successfully`
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to process approval';
    if (message.includes('authority') || message.includes('Forbidden') || message.includes('does not possess')) {
      return res.status(403).json({ success: false, error: message });
    }
    if (message.includes('not found')) {
      return res.status(404).json({ success: false, error: message });
    }
    return res.status(400).json({ success: false, error: message });
  }
});

/**
 * 6. POST /api/v1/orchestration/workflows/:id/cancel
 * Cancel running or waiting workflow
 */
orchestrationRoutes.post('/workflows/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const workflowId = String(req.params.id);
    const cancelled = await agentOrchestrationService.cancelWorkflow(
      tenantId,
      workflowId,
      req.user!.id
    );

    return res.json({
      success: true,
      data: cancelled,
      message: 'Workflow cancelled successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to cancel workflow'
    });
  }
});

/**
 * 7. POST /api/v1/orchestration/workflows/:id/retry
 * Retry a failed workflow
 */
orchestrationRoutes.post('/workflows/:id/retry', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const workflowId = String(req.params.id);
    const retried = await agentOrchestrationService.retryWorkflow(
      tenantId,
      workflowId,
      req.user!.id
    );

    return res.json({
      success: true,
      data: retried,
      message: 'Workflow retry initiated successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to retry workflow'
    });
  }
});

/**
 * 8. GET /api/v1/orchestration/observability/stats
 * Platform execution metrics and agent health
 */
orchestrationRoutes.get('/observability/stats', async (req: Request, res: Response) => {
  try {
    const stats = await observabilityService.getStats(req.tenantId);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to retrieve observability statistics'
    });
  }
});

/**
 * 9. GET /api/v1/orchestration/observability/events
 * Filterable execution event log
 */
orchestrationRoutes.get('/observability/events', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const { workflowId, agentName, eventType, correlationId } = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await observabilityService.getEvents(tenantId, {
      workflowId: workflowId as string,
      agentName: agentName as AgentName,
      eventType: eventType as string,
      correlationId: correlationId as string,
      limit,
      offset
    });

    return res.json({
      success: true,
      data: result.events,
      total: result.total,
      limit,
      offset
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to retrieve observability events'
    });
  }
});

/**
 * 10. GET /api/v1/orchestration/delegation
 * List active delegated faculty reviewers for tenant
 */
orchestrationRoutes.get('/delegation', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const activeOnly = req.query.activeOnly !== 'false';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const reviewers = await delegationService.getDelegatedReviewers(tenantId, {
      activeOnly,
      limit,
      offset
    });

    return res.json({
      success: true,
      data: reviewers,
      count: reviewers.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch delegated reviewers'
    });
  }
});

/**
 * 11. POST /api/v1/orchestration/delegation
 * Delegate review permissions to faculty coordinator (requires TPO / College Admin)
 */
orchestrationRoutes.post('/delegation', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    // Role check: Only TPO_ADMIN, COLLEGE_ADMIN, or SUPER_ADMIN can delegate authority
    const canonical = normalizeRole(req.user!.role);
    if (!canonical || !['TPO_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(canonical)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.user!.role}' is not authorized to delegate reviewer authority`
      });
    }

    const { userId, permissions, validUntil, notes } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const record = await delegationService.delegateReviewer(tenantId, req.user!.id, {
      userId,
      permissions: permissions || ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
      validUntil,
      notes
    });

    return res.status(201).json({
      success: true,
      data: record,
      message: 'Reviewer delegation granted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to grant reviewer delegation'
    });
  }
});

/**
 * 12. DELETE /api/v1/orchestration/delegation/:id
 * Revoke reviewer delegation immediately (requires TPO / College Admin)
 */
orchestrationRoutes.delete('/delegation/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: 'Tenant context is missing' });
    }

    const canonical = normalizeRole(req.user!.role);
    if (!canonical || !['TPO_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(canonical)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.user!.role}' is not authorized to revoke reviewer delegation`
      });
    }

    const delegationId = String(req.params.id);
    const result = await delegationService.revokeDelegation(
      tenantId,
      delegationId,
      req.user!.id
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || 'Delegation not found'
      });
    }

    return res.json({
      success: true,
      data: result.revokedDelegation,
      message: 'Reviewer delegation revoked successfully with immediate effect'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to revoke reviewer delegation'
    });
  }
});
