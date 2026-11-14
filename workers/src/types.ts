import type { Tenant, User } from './db/schema';

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

export interface AppEnv {
  Bindings: {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    ENVIRONMENT?: string;
  };
  Variables: {
    tenantId: string;
    tenant?: Tenant;
    user?: AuthUserContext;
  };
}
