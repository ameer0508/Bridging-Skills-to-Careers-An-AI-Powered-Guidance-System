import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import TechnicalAssessmentService, { MAX_TASKS, MIN_TASKS, TASK_KINDS } from '../services/interview/TechnicalAssessmentService.js';
import { ASSESSMENT_BANK } from '../seed/technicalAssessmentBank.js';
import { AppError } from '../middlewares/errorHandler.js';

const BANK_SKILLS = [...new Set(ASSESSMENT_BANK.map(t => t.skill))] as [string, ...string[]];

const startSchema = z
  .object({
    skills: z.array(z.enum(BANK_SKILLS)).max(BANK_SKILLS.length).optional(),
    kinds: z.array(z.enum(TASK_KINDS as [string, ...string[]])).max(TASK_KINDS.length).optional(),
    count: z.number().int().min(MIN_TASKS).max(MAX_TASKS).optional(),
  })
  .strict();

// The response type depends on the task; the service checks it against the task's answer type
const answerSchema = z
  .object({
    taskId: z.string().trim().min(1).max(80),
    response: z.union([z.number().int(), z.string().max(400)]),
  })
  .strict();

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): T {
  const parsed = schema.safeParse(input ?? {});
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

/** D4: read-and-answer technical assessments; no code is executed. */
class TechnicalAssessmentController {
  catalog = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: TechnicalAssessmentService.catalog() });
  });

  start = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(startSchema, req.body);
    const data = await TechnicalAssessmentService.start(userId, body as Parameters<typeof TechnicalAssessmentService.start>[1]);
    res.status(201).json({ success: true, data });
  });

  list = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { assessments: await TechnicalAssessmentService.list(userIdOf(req)) } });
  });

  get = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await TechnicalAssessmentService.get(userIdOf(req), req.params.id) });
  });

  answer = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(answerSchema, req.body);
    res.status(200).json({ success: true, data: await TechnicalAssessmentService.answer(userId, req.params.id, body.taskId, body.response) });
  });

  finish = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await TechnicalAssessmentService.finish(userIdOf(req), req.params.id) });
  });
}

export default new TechnicalAssessmentController();
