import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { eq, or } from 'drizzle-orm';
import crypto from 'crypto';
import { getDb } from '../db/client';
import { tenants } from '../db/schema';
import { isValidUuid } from '../middleware/tenant';
import { authenticateToken, requireRole } from '../middleware/auth';
import env from '../config/env';

const router = Router();

const CreateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  domain: z.string().max(255).optional(),
  settings: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true)
});

/**
 * GET /api/v1/tenants/
 * List active college tenants. (Protected: superadmin only)
 */
router.get('/', authenticateToken, requireRole(['superadmin']), async (req: Request, res: Response) => {
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const allTenants = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          domain: tenants.domain,
          isActive: tenants.isActive,
          createdAt: tenants.createdAt
        })
        .from(tenants)
        .where(eq(tenants.isActive, true));

      return res.json({
        success: true,
        count: allTenants.length,
        tenants: allTenants
      });
    } catch (err: any) {
      console.error('List tenants error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error listing tenants',
        details: err?.message
      });
    }
  }

  // Offline mock fallback
  return res.json({
    success: true,
    count: 1,
    tenants: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Apex Institute of Technology',
        slug: 'apex-institute',
        domain: 'apex.edu',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

/**
 * POST /api/v1/tenants/
 * Provision a new college tenant. (Protected: superadmin only)
 */
router.post('/', authenticateToken, requireRole(['superadmin']), async (req: Request, res: Response) => {
  const parseResult = CreateTenantSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parseResult.error.errors
    });
  }

  const data = parseResult.data;
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Check for slug or name conflict
      const [existing] = await db
        .select()
        .from(tenants)
        .where(or(eq(tenants.slug, data.slug), eq(tenants.name, data.name)))
        .limit(1);

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'A tenant with this name or slug already exists',
          code: 'TENANT_CONFLICT'
        });
      }

      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          domain: data.domain?.trim(),
          settings: data.settings,
          isActive: data.isActive
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: 'Tenant provisioned successfully',
        tenant: newTenant
      });
    } catch (err: any) {
      console.error('Provision tenant error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error provisioning tenant',
        details: err?.message
      });
    }
  }

  // Offline mock fallback
  const mockTenant = {
    id: crypto.randomUUID(),
    name: data.name,
    slug: data.slug,
    domain: data.domain || null,
    settings: data.settings,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return res.status(201).json({
    success: true,
    message: 'Tenant provisioned successfully (offline mode)',
    tenant: mockTenant
  });
});

/**
 * GET /api/v1/tenants/:id
 * Retrieve tenant details by UUID or unique slug.
 */
router.get('/:id', async (req: Request, res: Response) => {
  const idOrSlug = String(req.params.id).trim();
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const condition = isValidUuid(idOrSlug)
        ? eq(tenants.id, idOrSlug)
        : eq(tenants.slug, idOrSlug.toLowerCase());

      const [tenant] = await db.select().from(tenants).where(condition).limit(1);

      if (!tenant) {
        return res.status(404).json({ success: false, error: 'Tenant not found' });
      }

      return res.json({
        success: true,
        tenant
      });
    } catch (err: any) {
      console.error('Fetch tenant error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database error fetching tenant',
        details: err?.message
      });
    }
  }

  return res.json({
    success: true,
    tenant: {
      id: isValidUuid(idOrSlug) ? idOrSlug : crypto.randomUUID(),
      name: 'Apex Institute of Technology',
      slug: idOrSlug,
      domain: 'apex.edu',
      isActive: true,
      settings: {}
    }
  });
});

export { router as tenantRoutes };
