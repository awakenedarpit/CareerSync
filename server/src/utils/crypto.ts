import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env';

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
    hasVerificationPermission?: boolean;
    isDelegatedReviewer?: boolean;
    [key: string]: unknown;
  },
  secret: string = env.JWT_SECRET || DEFAULT_SECRET,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtTokenPayload = {
    ...payload,
    sub: payload.sub,
    tenant_id: payload.tenant_id,
    role: payload.role,
    email: payload.email,
    iat: now,
    exp: now + expiresInSeconds
  };

  return new Promise((resolve, reject) => {
    jwt.sign(
      fullPayload,
      secret,
      { algorithm: 'HS256' },
      (err, token) => {
        if (err || !token) {
          reject(err || new Error('Failed to generate JWT token'));
        } else {
          resolve(token);
        }
      }
    );
  });
}

/**
 * Verify and decode a JWT token.
 * Throws an error if the token is tampered, invalid, or expired.
 */
export async function verifyJwtToken(
  token: string,
  secret: string = env.JWT_SECRET || DEFAULT_SECRET
): Promise<JwtTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      secret,
      { algorithms: ['HS256'] },
      (err, decoded) => {
        if (err || !decoded) {
          reject(err || new Error('Invalid or expired token'));
        } else {
          resolve(decoded as JwtTokenPayload);
        }
      }
    );
  });
}
