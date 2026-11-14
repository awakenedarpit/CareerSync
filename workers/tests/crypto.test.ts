import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createJwtToken,
  verifyJwtToken,
  type JwtTokenPayload,
} from '../src/utils/crypto';

describe('Cryptographic & Security Utilities', () => {
  describe('Password Hashing (bcryptjs)', () => {
    it('should generate a valid bcrypt hash with salt', async () => {
      const password = 'StrongPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // bcrypt hashes typically start with $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it('should generate different hashes for the same password due to random salt', async () => {
      const password = 'IdenticalPassword456';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });

    it('should return true when verifying correct password against hash', async () => {
      const password = 'CorrectHorseBatteryStaple!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false when verifying wrong password against hash', async () => {
      const password = 'CorrectPassword';
      const wrongPassword = 'IncorrectPassword';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle malformed, empty, or corrupted hashes gracefully without throwing', async () => {
      expect(await verifyPassword('password', '')).toBe(false);
      expect(await verifyPassword('password', 'not-a-valid-bcrypt-hash')).toBe(false);
      expect(await verifyPassword('password', '$2a$10$invalidtruncatedhash')).toBe(false);
    });

    it('should support passwords containing special characters and unicode', async () => {
      const complexPassword = 'P@sswørd_#2026!🚀_Special';
      const hash = await hashPassword(complexPassword);

      expect(await verifyPassword(complexPassword, hash)).toBe(true);
      expect(await verifyPassword('P@sswørd_#2026!🚀_Wrong', hash)).toBe(false);
    });
  });

  describe('JWT Token Security & Validation', () => {
    const validPayload = {
      sub: '12345678-1234-4234-8234-123456789abc',
      tenant_id: 'aaaa1111-2222-4333-8444-555566667777',
      role: 'student',
      email: 'student@college.edu',
    };
    const testSecret = 'test_jwt_secret_key_32_characters_long!';

    it('should issue a valid 3-segment signed JWT token', async () => {
      const token = await createJwtToken(validPayload, testSecret);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should successfully decode and verify a valid JWT token payload', async () => {
      const token = await createJwtToken(validPayload, testSecret);
      const decoded: JwtTokenPayload = await verifyJwtToken(token, testSecret);

      expect(decoded.sub).toBe(validPayload.sub);
      expect(decoded.tenant_id).toBe(validPayload.tenant_id);
      expect(decoded.role).toBe(validPayload.role);
      expect(decoded.email).toBe(validPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
    });

    it('should respect custom expiration durations', async () => {
      const expiresIn = 3600; // 1 hour
      const beforeNow = Math.floor(Date.now() / 1000);
      const token = await createJwtToken(validPayload, testSecret, expiresIn);
      const decoded = await verifyJwtToken(token, testSecret);

      expect(decoded.exp! - decoded.iat!).toBe(expiresIn);
      expect(decoded.exp!).toBeGreaterThanOrEqual(beforeNow + expiresIn - 2);
    });

    it('should reject expired tokens with an error', async () => {
      // Create a token expired in the past (-10 seconds)
      const expiredToken = await createJwtToken(validPayload, testSecret, -10);

      await expect(verifyJwtToken(expiredToken, testSecret)).rejects.toThrow();
    });

    it('should reject tokens with tampered payload', async () => {
      const token = await createJwtToken(validPayload, testSecret);
      const parts = token.split('.');

      // Tamper with payload (second part): replace base64 content
      const tamperedPayload = Buffer.from(
        JSON.stringify({
          sub: validPayload.sub,
          tenant_id: validPayload.tenant_id,
          role: 'superadmin', // attempted privilege escalation
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 7200,
        })
      )
        .toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      await expect(verifyJwtToken(tamperedToken, testSecret)).rejects.toThrow();
    });

    it('should reject tokens with tampered signature', async () => {
      const token = await createJwtToken(validPayload, testSecret);
      const parts = token.split('.');

      // Invert the last character of the signature
      const corruptedSig =
        parts[2].slice(0, -1) + (parts[2].slice(-1) === 'a' ? 'b' : 'a');
      const corruptedToken = `${parts[0]}.${parts[1]}.${corruptedSig}`;

      await expect(verifyJwtToken(corruptedToken, testSecret)).rejects.toThrow();
    });

    it('should reject tokens verified with a different secret', async () => {
      const token = await createJwtToken(validPayload, testSecret);
      const wrongSecret = 'completely_different_secret_key_32_chars';

      await expect(verifyJwtToken(token, wrongSecret)).rejects.toThrow();
    });

    it('should handle optional email in payload correctly', async () => {
      const payloadWithoutEmail = {
        sub: '87654321-4321-4321-8321-cba987654321',
        tenant_id: 'bbbb2222-3333-4444-8555-666677778888',
        role: 'recruiter',
      };

      const token = await createJwtToken(payloadWithoutEmail, testSecret);
      const decoded = await verifyJwtToken(token, testSecret);

      expect(decoded.sub).toBe(payloadWithoutEmail.sub);
      expect(decoded.tenant_id).toBe(payloadWithoutEmail.tenant_id);
      expect(decoded.role).toBe(payloadWithoutEmail.role);
      expect(decoded.email).toBeUndefined();
    });
  });
});
