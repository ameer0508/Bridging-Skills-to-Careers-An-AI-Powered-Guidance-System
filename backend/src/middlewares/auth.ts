import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Middleware to authenticate requests via JWT Bearer tokens.
 * Decodes the access token and binds user information to `req.user`.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is missing or invalid.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch (error) {
    const isExpired = error instanceof Error && error.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      error: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired ? 'Access token has expired.' : 'Access token is invalid.',
      },
    });
  }
};

export const requireAuth = authenticate;

/**
 * Middleware factory to authorize user actions based on roles (RBAC).
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions.',
        },
      });
      return;
    }
    next();
  };
};

export default authenticate;
