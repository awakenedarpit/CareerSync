/**
 * CarrerSync Role Normalization & Taxonomy Unit Tests
 * Phase 10.1 — Correction D: Role-Based Access Control Audit
 *
 * Verifies canonical 5-role taxonomy and backward-compatible token normalization:
 * 1. SUPER_ADMIN
 * 2. COLLEGE_ADMIN
 * 3. TPO_ADMIN
 * 4. RECRUITER
 * 5. STUDENT
 */

import { describe, it, expect } from 'vitest';
import {
  CANONICAL_ROLES,
  normalizeRole,
  isRole,
  hasAnyRole,
  toDatabaseRole,
  type CanonicalRole
} from '../src/utils/roles';

describe('Role Normalization & Canonical Taxonomy (Phase 10.1)', () => {
  describe('1. Canonical Roles Taxonomy', () => {
    it('defines exactly the 5 canonical roles', () => {
      expect(CANONICAL_ROLES).toEqual([
        'SUPER_ADMIN',
        'COLLEGE_ADMIN',
        'TPO_ADMIN',
        'RECRUITER',
        'STUDENT'
      ]);
      expect(CANONICAL_ROLES.length).toBe(5);
    });
  });

  describe('2. normalizeRole() mapping and legacy aliases', () => {
    it('normalizes canonical role strings verbatim', () => {
      expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
      expect(normalizeRole('COLLEGE_ADMIN')).toBe('COLLEGE_ADMIN');
      expect(normalizeRole('TPO_ADMIN')).toBe('TPO_ADMIN');
      expect(normalizeRole('RECRUITER')).toBe('RECRUITER');
      expect(normalizeRole('STUDENT')).toBe('STUDENT');
    });

    it('normalizes legacy database and token role variations', () => {
      // Super Admin variations
      expect(normalizeRole('super_admin')).toBe('SUPER_ADMIN');
      expect(normalizeRole('superadmin')).toBe('SUPER_ADMIN');
      expect(normalizeRole('SUPERADMIN')).toBe('SUPER_ADMIN');

      // College Admin variations
      expect(normalizeRole('college_admin')).toBe('COLLEGE_ADMIN');
      expect(normalizeRole('collegeadmin')).toBe('COLLEGE_ADMIN');
      expect(normalizeRole('admin')).toBe('COLLEGE_ADMIN');
      expect(normalizeRole('ADMIN')).toBe('COLLEGE_ADMIN');

      // TPO Admin variations
      expect(normalizeRole('tpo_admin')).toBe('TPO_ADMIN');
      expect(normalizeRole('tpoadmin')).toBe('TPO_ADMIN');
      expect(normalizeRole('tpo')).toBe('TPO_ADMIN');
      expect(normalizeRole('TPO')).toBe('TPO_ADMIN');

      // Recruiter variations
      expect(normalizeRole('recruiter')).toBe('RECRUITER');
      expect(normalizeRole('company')).toBe('RECRUITER');
      expect(normalizeRole('employer')).toBe('RECRUITER');

      // Student variations
      expect(normalizeRole('student')).toBe('STUDENT');
      expect(normalizeRole('STUDENT')).toBe('STUDENT');
      expect(normalizeRole('candidate')).toBe('STUDENT');
    });

    it('handles whitespace and case variations gracefully', () => {
      expect(normalizeRole('  TPO_ADMIN  ')).toBe('TPO_ADMIN');
      expect(normalizeRole('  tpo_admin ')).toBe('TPO_ADMIN');
      expect(normalizeRole('  student\n')).toBe('STUDENT');
    });

    it('falls back to default role when fallback parameter is supplied, or returns null without fallback', () => {
      expect(normalizeRole(undefined)).toBeNull();
      expect(normalizeRole(null as any)).toBeNull();
      expect(normalizeRole('')).toBeNull();
      expect(normalizeRole('unknown_role_xyz')).toBeNull();

      expect(normalizeRole(undefined, 'STUDENT')).toBe('STUDENT');
      expect(normalizeRole(null as any, 'STUDENT')).toBe('STUDENT');
      expect(normalizeRole('', 'STUDENT')).toBe('STUDENT');
      expect(normalizeRole('unknown_role_xyz', 'STUDENT')).toBe('STUDENT');
      expect(normalizeRole('guest', 'COLLEGE_ADMIN')).toBe('COLLEGE_ADMIN');
    });
  });

  describe('3. isRole() and hasAnyRole() predicates', () => {
    it('accurately evaluates isRole against canonical and legacy inputs', () => {
      expect(isRole('tpo_admin', 'TPO_ADMIN')).toBe(true);
      expect(isRole('tpo', 'TPO_ADMIN')).toBe(true);
      expect(isRole('student', 'TPO_ADMIN')).toBe(false);
      expect(isRole('superadmin', 'SUPER_ADMIN')).toBe(true);
    });

    it('accurately evaluates hasAnyRole across allowed sets', () => {
      const adminRoles: CanonicalRole[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'TPO_ADMIN'];
      expect(hasAnyRole('tpo_admin', adminRoles)).toBe(true);
      expect(hasAnyRole('admin', adminRoles)).toBe(true);
      expect(hasAnyRole('superadmin', adminRoles)).toBe(true);
      expect(hasAnyRole('student', adminRoles)).toBe(false);
      expect(hasAnyRole('recruiter', adminRoles)).toBe(false);
    });
  });

  describe('4. toDatabaseRole() backward compatibility', () => {
    it('converts canonical roles to database schema lowercase values', () => {
      expect(toDatabaseRole('SUPER_ADMIN')).toBe('superadmin');
      expect(toDatabaseRole('COLLEGE_ADMIN')).toBe('college_admin');
      expect(toDatabaseRole('TPO_ADMIN')).toBe('tpo_admin');
      expect(toDatabaseRole('RECRUITER')).toBe('recruiter');
      expect(toDatabaseRole('STUDENT')).toBe('student');
    });
  });
});
