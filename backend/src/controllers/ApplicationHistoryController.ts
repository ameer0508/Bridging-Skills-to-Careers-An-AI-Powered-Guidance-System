import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import ApplicationHistoryService, { EVENT_STATUSES } from '../services/applications/ApplicationHistoryService.js';
import { AppError } from '../middlewares/errorHandler.js';
import type { ApplicationStatus } from '../models/SavedOpportunity.js';

const dateText = z.string().trim().min(1).max(40);
const note = z.string().max(500);

const addEventSchema = z
  .object({
    status: z.enum(EVENT_STATUSES as [string, ...string[]]),
    occurredAt: dateText.optional(),
    note: note.optional(),
  })
  .strict();

const correctEventSchema = z
  .object({ occurredAt: dateText.optional(), note: note.optional() })
  .strict()
  .refine(b => b.occurredAt !== undefined || b.note !== undefined, { message: 'nothing to change' });

const reminderSchema = z.object({ at: dateText.nullable(), note: z.string().max(300).optional() }).strict();

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(v => {
    try {
      return ['http:', 'https:'].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'must be an http or https link');

const manualSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    company: z.string().trim().min(1).max(200),
    location: z.string().trim().max(200).optional(),
    applicationUrl: httpUrl.optional(),
    appliedAt: dateText.optional(),
    note: note.optional(),
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

/** X8: the caller's own applications, their dated event history, corrections and reminders. */
class ApplicationHistoryController {
  list = handle(async (req, res) => {
    const applications = await ApplicationHistoryService.list(userIdOf(req));
    res.status(200).json({ success: true, data: { applications } });
  });

  history = handle(async (req, res) => {
    const data = await ApplicationHistoryService.history(userIdOf(req), req.params.id);
    res.status(200).json({ success: true, data });
  });

  createManual = handle(async (req, res) => {
    const userId = userIdOf(req);
    const data = await ApplicationHistoryService.createManual(userId, parse(manualSchema, req.body));
    res.status(201).json({ success: true, data });
  });

  addEvent = handle(async (req, res) => {
    const userId = userIdOf(req);
    const body = parse(addEventSchema, req.body);
    const data = await ApplicationHistoryService.addEvent(userId, req.params.id, { ...body, status: body.status as ApplicationStatus });
    res.status(201).json({ success: true, data });
  });

  correctEvent = handle(async (req, res) => {
    const userId = userIdOf(req);
    const data = await ApplicationHistoryService.correctEvent(userId, req.params.id, req.params.eventId, parse(correctEventSchema, req.body));
    res.status(200).json({ success: true, data });
  });

  removeEvent = handle(async (req, res) => {
    const data = await ApplicationHistoryService.removeEvent(userIdOf(req), req.params.id, req.params.eventId);
    res.status(200).json({ success: true, data });
  });

  setReminder = handle(async (req, res) => {
    const userId = userIdOf(req);
    const data = await ApplicationHistoryService.setReminder(userId, req.params.id, parse(reminderSchema, req.body));
    res.status(200).json({ success: true, data });
  });
}

export default new ApplicationHistoryController();
