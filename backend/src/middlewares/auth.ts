import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { isRevokedAccount } from '../utils/revokedAccounts.js';

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
    if (isRevokedAccount(payload.userId)) {
      res.status(401).json({ success: false, error: { code: 'ACCOUNT_DELETED', message: 'This account has been deleted.' } });
      return;
    }
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
/**
 * Allows only the given roles. The role is read from the database on every request, not from the
 * token: a promotion takes effect at once, and a demoted account loses access immediately even
 * while its token is still valid. Roles change only by a direct database update; no API sets them.
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const deny = () =>
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: insufficient permissions.',
        },
      });
    if (!req.user?.userId) {
      deny();
      return;
    }
    User.findById(req.user.userId)
      .select('role')
      .lean()
      .then(user => (user?.role && roles.includes(user.role) ? next() : deny()))
      .catch(next);
  };
};

export default authenticate;
