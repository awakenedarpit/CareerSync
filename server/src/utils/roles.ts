/**
 * Role Normalization & Authorization Utilities
 * CarrerSync Platform — Phase 10.1
 *
 * Enforces canonical 5-role taxonomy across JWTs, middleware, database, and client:
 * 1. SUPER_ADMIN
 * 2. COLLEGE_ADMIN
 * 3. TPO_ADMIN
 * 4. RECRUITER
 * 5. STUDENT
 */

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  COLLEGE_ADMIN: 'college_admin',
  TPO_ADMIN: 'tpo_admin',
  FACULTY_COORDINATOR: 'faculty_coordinator',
  RECRUITER: 'recruiter',
  STUDENT: 'student',
  ALUMNI: 'alumni'
} as const;

export const ALL_ROLES = [
  'student',
  'faculty_coordinator',
  'recruiter',
  'tpo_admin',
  'college_admin',
  'superadmin',
  'alumni'
] as const;

export const CANONICAL_ROLES = [
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'TPO_ADMIN',
  'RECRUITER',
  'STUDENT'
] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number] | 'ALUMNI';

/**
 * Normalizes any legacy, lowercase, or variant role representation to canonical uppercase.
 *
 * Examples:
 * - 'superadmin' -> 'SUPER_ADMIN'
 * - 'super_admin' -> 'SUPER_ADMIN'
 * - 'tpo_admin' -> 'TPO_ADMIN'
 * - 'college_admin' -> 'COLLEGE_ADMIN'
 * - 'recruiter' -> 'RECRUITER'
 * - 'student' -> 'STUDENT'
 */
export function normalizeRole(
  role: string | undefined | null,
  fallback?: CanonicalRole
): CanonicalRole | null {
  if (!role || typeof role !== 'string') return fallback || null;

  const cleaned = role.trim().toUpperCase().replace(/[\s-]+/g, '_');

  switch (cleaned) {
    case 'SUPER_ADMIN':
    case 'SUPERADMIN':
      return 'SUPER_ADMIN';

    case 'COLLEGE_ADMIN':
    case 'COLLEGEADMIN':
    case 'ADMIN':
      return 'COLLEGE_ADMIN';

    case 'TPO_ADMIN':
    case 'TPOADMIN':
    case 'TPO':
      return 'TPO_ADMIN';

    case 'FACULTY_COORDINATOR':
    case 'FACULTY':
      // Faculty coordinator maps to designated reviewer context or college admin
      return 'COLLEGE_ADMIN';

    case 'RECRUITER':
    case 'EMPLOYER':
    case 'COMPANY':
      return 'RECRUITER';

    case 'STUDENT':
    case 'CANDIDATE':
      return 'STUDENT';

    case 'ALUMNI':
    case 'GRADUATE':
      return 'ALUMNI';

    default:
      return fallback || null;
  }
}

/**
 * Checks if a user's role matches the target canonical role.
 */
export function isRole(userRole: string | undefined | null, targetRole: CanonicalRole): boolean {
  return normalizeRole(userRole) === targetRole;
}

/**
 * Checks if a user's role is included in an array of allowed canonical roles.
 */
export function hasAnyRole(
  userRole: string | undefined | null,
  allowedRoles: readonly CanonicalRole[]
): boolean {
  const normalized = normalizeRole(userRole);
  if (!normalized) return false;
  return allowedRoles.includes(normalized);
}

/**
 * Converts a canonical role back to legacy lowercase database token if required.
 */
export function toDatabaseRole(role: CanonicalRole | string): string {
  const canonical = normalizeRole(role);
  switch (canonical) {
    case 'SUPER_ADMIN':
      return 'superadmin';
    case 'COLLEGE_ADMIN':
      return 'college_admin';
    case 'TPO_ADMIN':
      return 'tpo_admin';
    case 'RECRUITER':
      return 'recruiter';
    case 'STUDENT':
      return 'student';
    case 'ALUMNI':
      return 'alumni';
    default:
      return String(role).toLowerCase();
  }
}
