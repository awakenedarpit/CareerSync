import type { Tenant } from './db/schema';

export type UserRole =
  | 'student'
  | 'college_admin'
  | 'tpo_admin'
  | 'faculty_coordinator'
  | 'recruiter'
  | 'superadmin';

export interface AuthUserContext {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  fullName?: string;
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
