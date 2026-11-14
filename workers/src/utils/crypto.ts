import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import type { SignatureAlgorithm } from 'hono/utils/jwt/jwa';

export interface JwtTokenPayload {
  sub: string;
  tenant_id: string;
  role: string;
  email?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const DEFAULT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const DEFAULT_EXPIRY_SECONDS = 7200; // 2 hours
const JWT_ALGORITHM: SignatureAlgorithm = 'HS256';

/**
 * Hash plain text password using bcrypt with salt rounds 10.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify plain text password against bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Issue a signed JWT token matching the platform specification.
 */
export async function createJwtToken(
  payload: {
    sub: string;
    tenant_id: string;
    role: string;
    email?: string;
  },
  secret: string = DEFAULT_SECRET,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtTokenPayload = {
    sub: payload.sub,
    tenant_id: payload.tenant_id,
    role: payload.role,
    email: payload.email,
    iat: now,
    exp: now + expiresInSeconds
  };

  return sign(fullPayload, secret, JWT_ALGORITHM);
}

/**
 * Verify and decode a JWT token.
 * Throws an error if the token is tampered, invalid, or expired.
 */
export async function verifyJwtToken(
  token: string,
  secret: string = DEFAULT_SECRET
): Promise<JwtTokenPayload> {
  const verified = await verify(token, secret, JWT_ALGORITHM);
  return verified as unknown as JwtTokenPayload;
}
