import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ApplicationOutcomeService, { MAX_OUTCOME_MONTHS, monthRange } from '../services/applications/ApplicationOutcomeService.js';
import { AppError } from '../middlewares/errorHandler.js';

const month = z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, 'must be YYYY-MM');

const outcomeQuerySchema = z
  .object({
    from: month.optional(),
    to: month.optional(),
    includeDemoListings: z.enum(['true', 'false']).optional(),
  })
  .strict();

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

/** C6: conversion from application to interview to offer over the caller's own applications. */
class ApplicationOutcomeController {
  outcomes = handle(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const parsed = outcomeQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      const detail = parsed.error.issues.map(i => `${i.path.join('.') || 'request'} ${i.message}`).join('; ');
      throw new AppError(`Invalid request: ${detail}`, 400, 'VALIDATION_ERROR');
    }
    const { from, to, includeDemoListings } = parsed.data;
    const effectiveTo = to ?? new Date().toISOString().slice(0, 7);
    if (from) {
      if (from > effectiveTo) throw new AppError('Invalid request: from must not be after to', 400, 'VALIDATION_ERROR');
      if (monthRange(from, effectiveTo).length > MAX_OUTCOME_MONTHS) {
        throw new AppError(`Invalid request: the period may span at most ${MAX_OUTCOME_MONTHS} months`, 400, 'VALIDATION_ERROR');
      }
    }
    const data = await ApplicationOutcomeService.forUser(userId, { from, to, includeDemoListings: includeDemoListings === 'true' });
    res.status(200).json({ success: true, data });
  });
}

export default new ApplicationOutcomeController();
