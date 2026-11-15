import type { Tenant } from './db/schema';
export {
  ROLES,
  ALL_ROLES,
  CANONICAL_ROLES,
  CanonicalRole,
  normalizeRole,
  isRole,
  hasAnyRole,
  toDatabaseRole
} from './utils/roles';

export type UserRole =
  | 'student'
  | 'college_admin'
  | 'tpo_admin'
  | 'faculty_coordinator'
  | 'recruiter'
  | 'superadmin'
  | 'alumni';

export interface AuthUserContext {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  fullName?: string;
  hasVerificationPermission?: boolean;
  isDelegatedReviewer?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: Tenant;
      user?: AuthUserContext;
    }
  }
}
