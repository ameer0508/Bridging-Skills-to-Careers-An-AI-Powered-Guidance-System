import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import LearningResourceService from '../services/LearningResourceService.js';
import { requireAuth } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = Router();
router.use(requireAuth);

const statusSchema = z.object({ status: z.enum(['saved', 'done']).nullable() }).strict();

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};
type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

/** Free third-party resources for the caller's gaps for a career (`careerId` query; default the best match). */
router.get(
  '/',
  handle(async (req, res) => {
    const raw = req.query.careerId;
    if (raw !== undefined && (typeof raw !== 'string' || !mongoose.Types.ObjectId.isValid(raw))) {
      throw new AppError('Invalid request: careerId is not a valid id', 400, 'VALIDATION_ERROR');
    }
    res.status(200).json({ success: true, data: await LearningResourceService.forCareer(userIdOf(req), raw as string | undefined) });
  })
);

router.get(
  '/mine',
  handle(async (req, res) => {
    res.status(200).json({ success: true, data: { resources: await LearningResourceService.mine(userIdOf(req)) } });
  })
);

router.put(
  '/:resourceId/status',
  handle(async (req, res) => {
    const parsed = statusSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw new AppError('Invalid request: status must be "saved", "done" or null', 400, 'VALIDATION_ERROR');
    res.status(200).json({ success: true, data: { resource: await LearningResourceService.setStatus(userIdOf(req), req.params.resourceId, parsed.data.status) } });
  })
);

export default router;
