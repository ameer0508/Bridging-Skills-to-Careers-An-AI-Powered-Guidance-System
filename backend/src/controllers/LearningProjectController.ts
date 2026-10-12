import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import ProjectSuggestionService from '../services/ProjectSuggestionService.js';
import { LEARNING_PROJECT_STATUSES } from '../models/LearningProject.js';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z.string().refine(value => mongoose.Types.ObjectId.isValid(value), { message: 'is not a valid id' });
const startSchema = z.object({ briefId: z.string().trim().min(1).max(80), careerId: objectId.optional() }).strict();
const updateSchema = z
  .object({
    status: z.enum(LEARNING_PROJECT_STATUSES as [string, ...string[]]).optional(),
    task: z.object({ index: z.number().int().min(0).max(50), done: z.boolean() }).strict().optional()
  })
  .strict()
  .refine(value => value.status !== undefined || value.task !== undefined, { message: 'needs a status or a task' });

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

/** Practice projects: suggestions from the user's gaps, and the ones they have taken on. */
class LearningProjectController {
  suggestions = handle(async (req, res) => {
    const raw = req.query.careerId;
    const careerId = raw === undefined ? undefined : parse(objectId, raw);
    res.status(200).json({ success: true, data: await ProjectSuggestionService.suggest(userIdOf(req), careerId) });
  });

  list = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { projects: await ProjectSuggestionService.list(userIdOf(req)) } });
  });

  start = handle(async (req, res) => {
    const userId = userIdOf(req);
    const { briefId, careerId } = parse(startSchema, req.body);
    const { project, created } = await ProjectSuggestionService.start(userId, briefId, careerId);
    res.status(created ? 201 : 200).json({ success: true, data: { project } });
  });

  update = handle(async (req, res) => {
    const userId = userIdOf(req);
    const change = parse(updateSchema, req.body) as { status?: 'planned' | 'in_progress' | 'completed'; task?: { index: number; done: boolean } };
    res.status(200).json({ success: true, data: { project: await ProjectSuggestionService.update(userId, req.params.projectId, change) } });
  });

  remove = handle(async (req, res) => {
    await ProjectSuggestionService.remove(userIdOf(req), req.params.projectId);
    res.status(200).json({ success: true, data: { deleted: true } });
  });
}

export default new LearningProjectController();
