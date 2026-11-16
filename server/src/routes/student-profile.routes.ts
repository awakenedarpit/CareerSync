/**
 * CarrerSync Student Profile Management REST API Routes
 * Phase 18 — Comprehensive Student Profile Management
 *
 * Implements endpoints for:
 * 1. GET   /api/v1/student/profile
 * 2. PATCH /api/v1/student/profile
 * 3. PATCH /api/v1/student/profile/contact
 * 4. PATCH /api/v1/student/profile/social-links
 * 5. PATCH /api/v1/student/profile/preferences
 * 6. POST  /api/v1/student/profile/academic-correction-request
 * 7. GET   /api/v1/student/profile/academic-correction-requests
 *
 * Protected strictly by requireAuth, tenantMiddleware, and requireRole(['STUDENT']).
 * All inputs validated via Zod schemas.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { studentProfileService } from '../services/student-profile.service';
import type { AuthUserContext } from '../types';

export const studentProfileRoutes = Router();

// ============================================================================
// Router Protection Middlewares
// ============================================================================

studentProfileRoutes.use(requireAuth);
studentProfileRoutes.use(tenantMiddleware);
studentProfileRoutes.use(requireRole(['STUDENT']));

// ============================================================================
// Validation Schemas
// ============================================================================

const URL_REFINE_MESSAGE = 'Must be a valid HTTP or HTTPS URL';

const isValidHttpUrl = (val: string | null | undefined): boolean => {
  if (!val || val.trim() === '') return true;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isValidHttpUrl, { message: URL_REFINE_MESSAGE })
  .nullable()
  .optional();

const CustomLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform is required').max(100),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((val: string) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, { message: URL_REFINE_MESSAGE }),
  label: z.string().max(200).nullable().optional()
});

const PersonalInfoSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  bio: z.string().max(2000).nullable().optional(),
  professionalSummary: z.string().max(2000).nullable().optional(),
  careerObjective: z.string().max(2000).nullable().optional(),
  avatarUrl: optionalUrlSchema,
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().max(50).nullable().optional(),
  currentCity: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional()
});

const ContactInfoSchema = z.object({
  phoneNumber: z.string().max(20).nullable().optional(),
  alternatePhoneNumber: z.string().max(20).nullable().optional(),
  personalEmail: z
    .string()
    .email('Invalid personal email format')
    .max(255)
    .nullable()
    .optional()
    .or(z.literal('')),
  preferredContactMethod: z.string().max(50).nullable().optional(),
  currentCity: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional()
});

const SocialLinksSchema = z.object({
  githubUrl: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  portfolioUrl: optionalUrlSchema,
  leetcodeUrl: optionalUrlSchema,
  hackerrankUrl: optionalUrlSchema,
  codeforcesUrl: optionalUrlSchema,
  codechefUrl: optionalUrlSchema,
  kaggleUrl: optionalUrlSchema,
  geeksforgeeksUrl: optionalUrlSchema,
  personalWebsiteUrl: optionalUrlSchema,
  customLinks: z.array(CustomLinkSchema).optional()
});

const ProfileVisibilitySchema = z
  .object({
    tpoTeam: z.boolean().optional(),
    recruitersOnShare: z.boolean().optional(),
    professionalLinksVisible: z.boolean().optional(),
    contactDetailsHidden: z.boolean().optional(),
    portfolioOnShare: z.boolean().optional()
  })
  .optional();

const PreferencesSchema = z.object({
  targetJobRoles: z.array(z.string().max(100)).optional(),
  preferredIndustries: z.array(z.string().max(100)).optional(),
  careerInterests: z.union([z.string().max(2000), z.array(z.string().max(100))]).optional(),
  preferredLocations: z.array(z.string().max(100)).optional(),
  preferredEmploymentTypes: z.array(z.string().max(100)).optional(),
  profileVisibility: ProfileVisibilitySchema
});

const AcademicCorrectionRequestSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required').max(100),
  currentValue: z.string().nullable().optional(),
  requestedValue: z.string().min(1, 'Requested value is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters')
});

// ============================================================================
// Anti-Tampering & Security Guards
// ============================================================================

const LOCKED_ACADEMIC_FIELDS = [
  'cgpa',
  'rollNumber',
  'roll_number',
  'department',
  'batchYear',
  'batch_year',
  'degree',
  'backlogCount',
  'backlog_count',
  'currentSemester',
  'current_semester',
  'readinessScore',
  'readiness_score'
];

function checkTampering(req: Request, res: Response): boolean {
  const body = req.body;
  if (!body || typeof body !== 'object') return false;

  // 1. Role tampering
  if (body.role !== undefined) {
    res.status(403).json({
      success: false,
      error: 'Role tampering forbidden: students cannot alter account role',
      code: 'ROLE_TAMPERING_FORBIDDEN'
    });
    return true;
  }

  // 2. Tenant tampering
  if (body.tenantId !== undefined || body.tenant_id !== undefined) {
    const targetTenant = body.tenantId || body.tenant_id;
    if (targetTenant !== (req.user as AuthUserContext).tenantId) {
      res.status(403).json({
        success: false,
        error: 'Tenant access forbidden: tenant spoofing detected in body',
        code: 'TENANT_SPOOFING_REJECTED'
      });
      return true;
    }
  }

  // 3. Self-verification of skills/credentials
  if (
    body.isVerified !== undefined ||
    body.is_verified !== undefined ||
    body.verified !== undefined ||
    body.verificationStatus === 'VERIFIED' ||
    body.state === 'Verified'
  ) {
    res.status(403).json({
      success: false,
      error: 'Students cannot self-verify credentials or skills',
      code: 'SELF_VERIFICATION_FORBIDDEN'
    });
    return true;
  }

  // 4. Direct academic fields modification
  for (const field of LOCKED_ACADEMIC_FIELDS) {
    if (body[field] !== undefined) {
      res.status(400).json({
        success: false,
        error: `Academic field '${field}' is verified and locked against direct student modification. Submit an academic correction request instead.`,
        code: 'ACADEMIC_FIELDS_LOCKED'
      });
      return true;
    }
  }

  return false;
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * 1. GET /api/v1/student/profile
 * Retrieves full student profile with completeness score, suggestions, and verified skills.
 */
studentProfileRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const profile = await studentProfileService.getStudentProfile(user.id, user.tenantId);
    return res.json({
      success: true,
      data: profile
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to fetch student profile',
      code: err.code
    });
  }
});

/**
 * 2. PATCH /api/v1/student/profile
 * Updates personal info (bio, professional summary, career objective, avatarUrl, location, etc.).
 */
studentProfileRoutes.patch('/', async (req: Request, res: Response) => {
  if (checkTampering(req, res)) return;

  const parseResult = PersonalInfoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.errors
    });
  }

  try {
    const user = req.user as AuthUserContext;
    const updated = await studentProfileService.updateStudentProfile(user.id, user.tenantId, parseResult.data);
    return res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: updated
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to update student profile',
      code: err.code
    });
  }
});

/**
 * 3. PATCH /api/v1/student/profile/contact
 * Updates contact information (phoneNumber, alternatePhoneNumber, personalEmail, preferredContactMethod).
 * Enforces rule: Login email cannot be changed without verification.
 */
studentProfileRoutes.patch('/contact', async (req: Request, res: Response) => {
  if (checkTampering(req, res)) return;

  // Direct check for login email modification attempt
  if (req.body.email !== undefined) {
    const user = req.user as AuthUserContext;
    if (req.body.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Login email cannot be changed directly without verification',
        code: 'LOGIN_EMAIL_IMMUTABLE'
      });
    }
  }

  const parseResult = ContactInfoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.errors
    });
  }

  try {
    const user = req.user as AuthUserContext;
    const updated = await studentProfileService.updateContactInfo(user.id, user.tenantId, parseResult.data);
    return res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: updated
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to update contact information',
      code: err.code
    });
  }
});

/**
 * 4. PATCH /api/v1/student/profile/social-links
 * Updates social and coding platform links and manages custom links in student_custom_links.
 */
studentProfileRoutes.patch('/social-links', async (req: Request, res: Response) => {
  if (checkTampering(req, res)) return;

  const parseResult = SocialLinksSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed: Invalid URL format',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.errors
    });
  }

  try {
    const user = req.user as AuthUserContext;
    const updated = await studentProfileService.updateSocialLinks(user.id, user.tenantId, parseResult.data);
    return res.json({
      success: true,
      message: 'Social links updated successfully',
      data: updated
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to update social links',
      code: err.code
    });
  }
});

/**
 * 5. PATCH /api/v1/student/profile/preferences
 * Updates placement career preferences and privacy visibility settings.
 */
studentProfileRoutes.patch('/preferences', async (req: Request, res: Response) => {
  if (checkTampering(req, res)) return;

  const parseResult = PreferencesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.errors
    });
  }

  try {
    const user = req.user as AuthUserContext;
    const updated = await studentProfileService.updatePreferences(user.id, user.tenantId, parseResult.data);
    return res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to update preferences',
      code: err.code
    });
  }
});

/**
 * 6. POST /api/v1/student/profile/academic-correction-request
 * Submits a formal request to correct locked academic records.
 */
studentProfileRoutes.post('/academic-correction-request', async (req: Request, res: Response) => {
  if (checkTampering(req, res)) return;

  const parseResult = AcademicCorrectionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: parseResult.error.errors
    });
  }

  try {
    const user = req.user as AuthUserContext;
    const request = await studentProfileService.createAcademicCorrectionRequest(
      user.id,
      user.tenantId,
      parseResult.data
    );
    return res.status(201).json({
      success: true,
      message: 'Academic correction request submitted successfully',
      data: request
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to submit academic correction request',
      code: err.code
    });
  }
});

/**
 * 7. GET /api/v1/student/profile/academic-correction-requests
 * Retrieves all academic correction requests submitted by authenticated student.
 */
studentProfileRoutes.get('/academic-correction-requests', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const requests = await studentProfileService.getAcademicCorrectionRequests(user.id, user.tenantId);
    return res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to fetch academic correction requests',
      code: err.code
    });
  }
});
