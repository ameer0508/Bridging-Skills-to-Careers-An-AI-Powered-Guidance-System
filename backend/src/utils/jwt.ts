import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

/**
 * Signs a stateless access token containing the user identity and permission role.
 */
export const signAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role } as AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn']
  });
};

/**
 * Signs a refresh token for authorization rotation.
 */
export const signRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, jti: Math.random().toString(36).substring(2) + Date.now().toString(36) },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Validates and decodes an access token. Throws if invalid or expired.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

/**
 * Validates and decodes a refresh token. Throws if invalid or expired.
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};
