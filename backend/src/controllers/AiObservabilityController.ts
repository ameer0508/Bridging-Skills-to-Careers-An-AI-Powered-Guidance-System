import { Request, Response, NextFunction } from 'express';
import AiObservabilityService from '../services/aiObservability/AiObservabilityService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { User } from '../models/User.js';

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

const MAX_WINDOW_HOURS = 24 * 90;

/** Only the listed parameters, each a whole number within its range. */
const readQuery = (req: Request, allowed: Record<string, { min: number; max: number; fallback: number }>) => {
  const out: Record<string, number> = {};
  for (const key of Object.keys(req.query ?? {})) {
    if (!(key in allowed)) throw new AppError(`Invalid request: unknown parameter "${key}"`, 400, 'VALIDATION_ERROR');
  }
  for (const [key, rule] of Object.entries(allowed)) {
    const raw = req.query[key];
    if (raw === undefined) {
      out[key] = rule.fallback;
      continue;
    }
    const value = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
      throw new AppError(`Invalid request: ${key} must be a whole number from ${rule.min} to ${rule.max}`, 400, 'VALIDATION_ERROR');
    }
    out[key] = value;
  }
  return out;
};

/** Administrators only. The role is read from the database on each request, not from the token. */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  User.findById(req.user?.userId)
    .select('role')
    .then(user => {
      if (user?.role === 'admin') return next();
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } });
    })
    .catch(next);
};

class AiObservabilityController {
  summary = handle(async (req, res) => {
    const q = readQuery(req, { windowHours: { min: 1, max: MAX_WINDOW_HOURS, fallback: 24 } });
    res.status(200).json({ success: true, data: await AiObservabilityService.summary(q.windowHours) });
  });

  events = handle(async (req, res) => {
    const q = readQuery(req, {
      limit: { min: 1, max: 500, fallback: 100 },
      windowHours: { min: 1, max: MAX_WINDOW_HOURS, fallback: 24 },
    });
    res.status(200).json({ success: true, data: await AiObservabilityService.events(q.limit, q.windowHours) });
  });

  providers = handle(async (req, res) => {
    readQuery(req, {});
    res.status(200).json({ success: true, data: await AiObservabilityService.providers() });
  });
}

export default new AiObservabilityController();
