import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import CareerScenarioService from '../services/CareerScenarioService.js';
import SkillFreshnessService from '../services/SkillFreshnessService.js';
import RecalculationService from '../services/RecalculationService.js';
import { Career } from '../models/Career.js';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z.string().refine(value => mongoose.Types.ObjectId.isValid(value), { message: 'is not a valid id' });
const skillName = z.string().trim().min(1).max(80);
const skillList = z.array(skillName).min(1).max(10);
const label = z.string().trim().max(120).optional();

const changeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('add_skill'), skill: skillName }).strict(),
  z.object({ type: z.literal('remove_skill'), skill: skillName }).strict(),
  z.object({ type: z.literal('add_project'), skills: skillList, name: label }).strict(),
  z.object({ type: z.literal('add_certification'), skills: skillList, name: label }).strict(),
  z.object({ type: z.literal('add_experience'), skills: skillList, name: label }).strict()
]);

const compareSchema = z.object({ careerIds: z.array(objectId).min(2).max(4) }).strict();
const whatIfSchema = z.object({ changes: z.array(changeSchema).min(1).max(10), careerIds: z.array(objectId).min(1).max(20).optional() }).strict();
const planSchema = z.object({ targetCareerId: objectId }).strict();
const revalidateSchema = z.object({ note: z.string().max(200).optional() }).strict();

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

/** Career comparison, what-if analysis, counterfactuals, transition plans, skill freshness. */
class CareerLabController {
  /** Every career that can be compared or targeted. */
  listCareers = handle(async (req, res) => {
    userIdOf(req);
    const careers = await Career.find({ isActive: { $ne: false } }).sort({ title: 1 }).select('title category description');
    res.status(200).json({ success: true, data: { careers: careers.map(c => ({ id: c._id.toString(), title: c.title, category: c.category, description: c.description })) } });
  });

  compare = handle(async (req, res) => {
    const { careerIds } = parse(compareSchema, req.body);
    if (new Set(careerIds).size !== careerIds.length) throw new AppError('Choose different careers to compare.', 400, 'VALIDATION_ERROR');
    res.status(200).json({ success: true, data: await CareerScenarioService.compare(userIdOf(req), careerIds) });
  });

  whatIf = handle(async (req, res) => {
    const { changes, careerIds } = parse(whatIfSchema, req.body);
    res.status(200).json({ success: true, data: await CareerScenarioService.whatIf(userIdOf(req), changes, careerIds) });
  });

  counterfactuals = handle(async (req, res) => {
    const careerId = parse(objectId, req.params.careerId);
    const raw = req.query.targetScore;
    const targetScore = raw === undefined ? undefined : Number(raw);
    if (targetScore !== undefined && (!Number.isFinite(targetScore) || targetScore < 0 || targetScore > 100)) {
      throw new AppError('targetScore must be a number from 0 to 100.', 400, 'VALIDATION_ERROR');
    }
    res.status(200).json({ success: true, data: await CareerScenarioService.counterfactuals(userIdOf(req), careerId, targetScore) });
  });

  createPlan = handle(async (req, res) => {
    const userId = userIdOf(req);
    const { targetCareerId } = parse(planSchema, req.body);
    await CareerScenarioService.buildTransitionPlan(userId, targetCareerId);
    const plans = await CareerScenarioService.listTransitionPlans(userId);
    res.status(201).json({ success: true, data: { plan: plans.find(p => p.targetCareerId === targetCareerId) } });
  });

  listPlans = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { plans: await CareerScenarioService.listTransitionPlans(userIdOf(req)) } });
  });

  deletePlan = handle(async (req, res) => {
    await CareerScenarioService.deleteTransitionPlan(userIdOf(req), req.params.planId);
    res.status(200).json({ success: true, data: { deleted: true } });
  });

  freshness = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await SkillFreshnessService.list(userIdOf(req)) });
  });

  revalidate = handle(async (req, res) => {
    const userId = userIdOf(req);
    const { note } = parse(revalidateSchema, req.body);
    const skill = await SkillFreshnessService.revalidate(userId, req.params.userSkillId, note);
    // A confirmation adds no points, so the service records that nothing needed recomputing
    const run = await RecalculationService.run(userId, 'skill_evidence_changed', req.params.userSkillId);
    res.status(200).json({ success: true, data: { skill, recalculation: { status: run.status, modulesRecomputed: run.modulesRecomputed } } });
  });

  /** What each event changed: the audit trail of recalculations. */
  intelligenceHistory = handle(async (req, res) => {
    const runs = await RecalculationService.history(userIdOf(req));
    res.status(200).json({
      success: true,
      data: {
        runs: runs.map(run => ({
          id: run._id.toString(),
          at: run.createdAt,
          trigger: run.trigger,
          status: run.status,
          modulesRecomputed: run.modulesRecomputed,
          modulesSkipped: run.modulesSkipped,
          before: run.before,
          after: run.after,
          scoringVersion: run.scoringVersion,
          taxonomyVersion: run.taxonomyVersion,
          durationMs: run.durationMs
        }))
      }
    });
  });
}

export default new CareerLabController();
