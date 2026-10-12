import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { RoadmapHistory } from '../models/RoadmapHistory.js';
import { buildSchedule, HOURS_PER_WEEK_LIMITS } from '../services/RoadmapScheduler.js';
import { AppError } from '../middlewares/errorHandler.js';

const preferencesSchema = z
  .object({
    hoursPerWeek: z
      .number()
      .int('must be a whole number of hours')
      .min(HOURS_PER_WEEK_LIMITS.min, `must be at least ${HOURS_PER_WEEK_LIMITS.min}`)
      .max(HOURS_PER_WEEK_LIMITS.max, `must be at most ${HOURS_PER_WEEK_LIMITS.max}`)
      .nullable()
      .optional(),
    reminders: z.boolean().optional(),
    milestoneNotifications: z.boolean().optional()
  })
  .strict()
  .refine(value => Object.values(value).some(v => v !== undefined), { message: 'needs hoursPerWeek, reminders or milestoneNotifications' });

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

export async function hoursPerWeekOf(userId: string): Promise<number | null> {
  const user = await User.findById(userId).select('learningPreferences').lean();
  return user?.learningPreferences?.hoursPerWeek ?? null;
}

/** Everything is as the user left it; reminders and milestone notifications are off by default. */
async function preferencesOf(userId: string) {
  const user = await User.findById(userId).select('learningPreferences').lean();
  return {
    hoursPerWeek: user?.learningPreferences?.hoursPerWeek ?? null,
    reminders: Boolean(user?.learningPreferences?.reminders),
    milestoneNotifications: Boolean(user?.learningPreferences?.milestoneNotifications),
    limits: HOURS_PER_WEEK_LIMITS
  };
}

/** The user's stated study time and the roadmap schedule that follows from it. */
class LearningPlanController {
  getPreferences = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await preferencesOf(userIdOf(req)) });
  });

  /** Only the fields sent are changed. `hoursPerWeek: null` clears it; SkillBridge never fills one in. */
  updatePreferences = handle(async (req, res) => {
    const userId = userIdOf(req);
    const parsed = preferencesSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const detail = parsed.error.issues.map(i => `${i.path.join('.') || 'request'} ${i.message}`).join('; ');
      throw new AppError(`Invalid request: ${detail}`, 400, 'VALIDATION_ERROR');
    }
    const set: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(parsed.data)) {
      if (value !== undefined) set[`learningPreferences.${field}`] = value;
    }
    await User.updateOne({ _id: userId }, { $set: set });
    res.status(200).json({ success: true, data: await preferencesOf(userId) });
  });

  /** Computed on every read, so it always reflects current progress and the current weekly hours. */
  schedule = handle(async (req, res) => {
    const userId = userIdOf(req);
    const { careerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(careerId)) throw new AppError('Invalid career id.', 400, 'INVALID_ID');
    const roadmap = await LearningRoadmap.findOne({ userId: new mongoose.Types.ObjectId(userId), careerId: new mongoose.Types.ObjectId(careerId) });
    if (!roadmap) throw new AppError('There is no roadmap for this career yet.', 404, 'ROADMAP_NOT_FOUND');

    const lastUpdate = await RoadmapHistory.findOne({ roadmapId: roadmap._id, userId: roadmap.userId, action: { $in: ['regenerated', 'created'] } }).sort({ createdAt: -1, _id: -1 });
    res.status(200).json({
      success: true,
      data: {
        schedule: buildSchedule(roadmap.phases, await hoursPerWeekOf(userId)),
        progressPercentage: roadmap.progressPercentage,
        lastUpdate: lastUpdate ? { at: lastUpdate.createdAt, action: lastUpdate.action, details: lastUpdate.details, changes: lastUpdate.changes ?? null } : null
      }
    });
  });
}

export default new LearningPlanController();
