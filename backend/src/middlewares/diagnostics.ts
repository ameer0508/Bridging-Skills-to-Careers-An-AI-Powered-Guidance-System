import { Request, Response, NextFunction } from 'express';
import env from '../config/env.js';
import { authenticate } from './auth.js';
import { User } from '../models/User.js';

/** True only for a developer's local run. Tests and deployments are both treated as restricted. */
export const diagnosticsAreOpen = (): boolean => env.NODE_ENV === 'development';

/**
 * Guards infrastructure diagnostics (uptime, memory use, database host and record counts).
 *
 * In local development they are open, so the status page at `/` works without signing in. In
 * every other environment the caller must be signed in as an administrator. The role is read
 * from the database on each request, so a demoted account loses access immediately even if its
 * token still says otherwise. Accounts become administrators only by a direct database change;
 * no API can set the role.
 */
export const requireDiagnosticsAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (diagnosticsAreOpen()) {
    next();
    return;
  }

  authenticate(req, res, () => {
    User.findById(req.user?.userId)
      .select('role')
      .then(user => {
        if (user?.role === 'admin') {
          next();
          return;
        }
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Administrator access is required.' },
        });
      })
      .catch(next);
  });
};
