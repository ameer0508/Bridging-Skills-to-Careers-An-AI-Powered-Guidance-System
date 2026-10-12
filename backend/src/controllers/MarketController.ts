import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listMarketSources } from '../config/marketSources.js';
import MarketIngestionService, { importRequestSchema } from '../services/market/MarketIngestionService.js';
import MarketHistoryService, { MAX_HISTORY_MONTHS, monthRange } from '../services/market/MarketHistoryService.js';
import MarketSkillTrendService from '../services/market/MarketSkillTrendService.js';
import MarketOpportunityService from '../services/market/MarketOpportunityService.js';
import mongoose from 'mongoose';
import { Career } from '../models/Career.js';
import { AppError } from '../middlewares/errorHandler.js';
import { lookupSkill } from '../utils/skillLexicon.js';

const month = z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/, 'must be YYYY-MM');

const historyQuerySchema = z
  .object({
    dataset: z.enum(['sourced', 'synthetic_fixture']).default('sourced'),
    skill: z.string().trim().min(1).max(80).optional(),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, 'must be an ISO 3166-1 alpha-2 code').optional(),
    from: month.optional(),
    to: month.optional(),
  })
  .strict();

const skillTrendQuerySchema = z
  .object({
    dataset: z.enum(['sourced', 'synthetic_fixture']).default('sourced'),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, 'must be an ISO 3166-1 alpha-2 code').optional(),
    from: month.optional(),
    to: month.optional(),
    granularity: z.enum(['month', 'quarter']).default('quarter'),
    // Comma-separated skill names; aliases are accepted and canonicalised
    skills: z.string().trim().max(400).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(15),
  })
  .strict();

const summaryQuerySchema = z
  .object({
    dataset: z.enum(['sourced', 'synthetic_fixture']).default('sourced'),
    country: z.string().trim().regex(/^[A-Za-z]{2}$/, 'must be an ISO 3166-1 alpha-2 code').optional(),
    from: month.optional(),
    to: month.optional(),
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

const currentMonth = (now = new Date()) => now.toISOString().slice(0, 7);
const monthsBefore = (monthText: string, count: number) => {
  const [y, m] = monthText.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 - count, 1));
  return d.toISOString().slice(0, 7);
};

/** Sourced market history (C1): registered sources, admin imports and dated posting counts. */
class MarketController {
  listSources = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: { sources: listMarketSources() } });
  });

  history = handle(async (req, res) => {
    userIdOf(req);
    const q = parse(historyQuerySchema, req.query);
    const to = q.to ?? currentMonth();
    const from = q.from ?? monthsBefore(to, 11);
    if (from > to) throw new AppError('Invalid request: from must not be after to', 400, 'VALIDATION_ERROR');
    if (monthRange(from, to).length > MAX_HISTORY_MONTHS) {
      throw new AppError(`Invalid request: the period may span at most ${MAX_HISTORY_MONTHS} months`, 400, 'VALIDATION_ERROR');
    }
    let skill: string | undefined;
    if (q.skill) {
      skill = lookupSkill(q.skill)?.name;
      if (!skill) throw new AppError(`Invalid request: '${q.skill}' is not a recognised skill`, 400, 'UNKNOWN_SKILL');
    }
    const data = await MarketHistoryService.history({
      dataset: q.dataset,
      skill,
      country: q.country?.toUpperCase(),
      from,
      to,
    });
    res.status(200).json({ success: true, data });
  });

  skillTrends = handle(async (req, res) => {
    userIdOf(req);
    const q = parse(skillTrendQuerySchema, req.query);
    const { from, to } = this.period(q.from, q.to);
    let skills: string[] | undefined;
    if (q.skills) {
      const names = q.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (names.length > 10) throw new AppError('Invalid request: at most 10 skills may be compared', 400, 'VALIDATION_ERROR');
      const unknown = names.filter(n => !lookupSkill(n));
      if (unknown.length) throw new AppError(`Invalid request: not recognised skill(s): ${unknown.join(', ')}`, 400, 'UNKNOWN_SKILL');
      skills = [...new Set(names.map(n => lookupSkill(n)!.name))];
    }
    const data = await MarketSkillTrendService.trends({
      dataset: q.dataset,
      country: q.country?.toUpperCase(),
      from,
      to,
      granularity: q.granularity,
      skills,
      limit: q.limit,
    });
    res.status(200).json({ success: true, data });
  });

  /** The requested period, or the 12 months ending now; validated for order and length. */
  private period(fromQuery?: string, toQuery?: string) {
    const to = toQuery ?? currentMonth();
    const from = fromQuery ?? monthsBefore(to, 11);
    if (from > to) throw new AppError('Invalid request: from must not be after to', 400, 'VALIDATION_ERROR');
    if (monthRange(from, to).length > MAX_HISTORY_MONTHS) {
      throw new AppError(`Invalid request: the period may span at most ${MAX_HISTORY_MONTHS} months`, 400, 'VALIDATION_ERROR');
    }
    return { from, to };
  }

  /** MarketOpportunitySummary for one career (contract for Career Lab and next-best-action). */
  careerSummary = handle(async (req, res) => {
    userIdOf(req);
    const { careerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(careerId)) throw new AppError('Invalid request: careerId is not a valid id', 400, 'VALIDATION_ERROR');
    const q = parse(summaryQuerySchema, req.query);
    const { from, to } = this.period(q.from, q.to);
    const career = await Career.findById(careerId).select('title');
    if (!career) throw new AppError('Career not found.', 404, 'CAREER_NOT_FOUND');
    const data = await MarketOpportunityService.summaryForCareer(
      { id: career._id.toString(), title: career.title },
      { dataset: q.dataset, country: q.country?.toUpperCase(), from, to }
    );
    res.status(200).json({ success: true, data });
  });

  importPostings = handle(async (req, res) => {
    const request = parse(importRequestSchema, req.body);
    const batch = await MarketIngestionService.importBatch(request, userIdOf(req));
    res.status(201).json({ success: true, data: { batch } });
  });

  listImports = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: { batches: await MarketIngestionService.listBatches() } });
  });
}

export default new MarketController();
