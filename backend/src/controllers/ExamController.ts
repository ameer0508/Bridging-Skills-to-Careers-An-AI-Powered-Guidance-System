import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ExamPracticeService, { catalogEntry, examOrThrow, MAX_QUESTIONS, MIN_QUESTIONS } from '../services/exams/ExamPracticeService.js';
import ExamStudyService from '../services/exams/ExamStudyService.js';
import { AppError } from '../middlewares/errorHandler.js';

const id = z.string().trim().min(1).max(60);

const startSchema = z
  .object({
    sectionIds: z.array(id).max(20).optional(),
    topicIds: z.array(id).max(40).optional(),
    count: z.number().int().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
    mode: z.enum(['practice', 'timed']),
  })
  .strict();

const answerSchema = z
  .object({
    questionId: id,
    // Option index (MCQ), option indices (MSQ), a number (NAT), or null to clear
    response: z.union([z.number(), z.array(z.number().int()).max(10), z.null()]),
  })
  .strict();

const planSchema = z
  .object({
    hoursPerWeek: z.number().int().min(1).max(60),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD').optional(),
  })
  .strict();

const itemSchema = z.object({ status: z.enum(['pending', 'done']) }).strict();

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

/** E2/E3/E4: exam syllabi, practice attempts, topic performance and study plans. */
class ExamController {
  catalog = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: { exams: ExamPracticeService.catalog() } });
  });

  exam = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: catalogEntry(examOrThrow(req.params.examId)) });
  });

  startAttempt = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(startSchema, req.body);
    res.status(201).json({ success: true, data: await ExamPracticeService.start(userId, req.params.examId, body) });
  });

  listAttempts = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { attempts: await ExamPracticeService.list(userIdOf(req), req.params.examId) } });
  });

  getAttempt = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await ExamPracticeService.get(userIdOf(req), req.params.attemptId) });
  });

  answer = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(answerSchema, req.body);
    res.status(200).json({ success: true, data: await ExamPracticeService.answer(userId, req.params.attemptId, body.questionId, body.response) });
  });

  startSection = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await ExamPracticeService.startSection(userIdOf(req), req.params.attemptId, req.params.sectionId) });
  });

  submit = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await ExamPracticeService.submit(userIdOf(req), req.params.attemptId) });
  });

  performance = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await ExamStudyService.performance(userIdOf(req), req.params.examId) });
  });

  getPlan = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { plan: await ExamStudyService.getPlan(userIdOf(req), req.params.examId) } });
  });

  generatePlan = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(planSchema, req.body);
    res.status(200).json({ success: true, data: { plan: await ExamStudyService.generatePlan(userId, req.params.examId, body) } });
  });

  setPlanItem = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(itemSchema, req.body);
    res.status(200).json({ success: true, data: { plan: await ExamStudyService.setItemStatus(userId, req.params.examId, req.params.itemId, body.status) } });
  });
}

export default new ExamController();
