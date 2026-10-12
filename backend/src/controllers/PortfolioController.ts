import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import PortfolioService, { PORTFOLIO_LIMITS, type PortfolioInput } from '../services/PortfolioService.js';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z.string().refine(value => mongoose.Types.ObjectId.isValid(value), { message: 'is not a valid id' });

const entrySchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().max(1000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).min(1).max(PORTFOLIO_LIMITS.skillsPerEntry),
    completedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date written as YYYY-MM-DD'),
    evidenceUrl: z.string().max(300).nullable().optional(),
    sourceProjectId: objectId.nullable().optional(),
    visibility: z.enum(['private', 'shared']).optional()
  })
  .strict();

const shareSchema = z
  .object({ enabled: z.boolean().optional(), showName: z.boolean().optional() })
  .strict()
  .refine(value => value.enabled !== undefined || value.showName !== undefined, { message: 'needs enabled or showName' });

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    const detail = parsed.error.issues.map(i => `${i.path.join('.') || 'request'} ${i.message}`).join('; ');
    throw new AppError(`Invalid request: ${detail}`, 400, 'VALIDATION_ERROR');
  }
  return parsed.data;
}

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

/** The user's portfolio of finished work, and the optional public link to the shared part of it. */
class PortfolioController {
  list = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(200).json({ success: true, data: { ...(await PortfolioService.list(userId)), share: await PortfolioService.shareSettings(userId) } });
  });

  create = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(201).json({ success: true, data: await PortfolioService.create(userId, parse(entrySchema, req.body) as PortfolioInput) });
  });

  update = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(200).json({ success: true, data: await PortfolioService.update(userId, req.params.entryId, parse(entrySchema, req.body) as PortfolioInput) });
  });

  remove = handle(async (req, res) => {
    const result = await PortfolioService.remove(userIdOf(req), req.params.entryId);
    res.status(200).json({ success: true, data: { deleted: true, ...result } });
  });

  updateShare = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(200).json({ success: true, data: { share: await PortfolioService.updateShare(userId, parse(shareSchema, req.body)) } });
  });

  /** No sign-in: reachable by anyone who has the link. */
  publicView = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await PortfolioService.publicView(String(req.params.token || '')) });
  });
}

export default new PortfolioController();
