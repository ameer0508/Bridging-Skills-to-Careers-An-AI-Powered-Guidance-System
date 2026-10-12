import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { UserSkill } from '../models/UserSkill.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { Recommendation } from '../models/Recommendation.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import RecalculationRun, {
  type IIntelligenceFigures,
  type IntelligenceModule,
  type IRecalculationRun,
  type RecalculationTrigger
} from '../models/RecalculationRun.js';
import { SCORING_VERSION, taxonomyVersion } from '../utils/versions.js';
import { withUserLock } from '../utils/userLock.js';
import logger from '../config/logger.js';

/**
 * Which derived modules each kind of event can change. Modules are recomputed in the order
 * matches -> readiness -> recommendations, and only the ones listed for the trigger.
 *
 * Readiness recomputes gap analysis and then recommendations itself, so a trigger that lists
 * readiness always lists recommendations too.
 */
export const AFFECTED_MODULES: Record<RecalculationTrigger, IntelligenceModule[]> = {
  resume_processed: ['matches', 'readiness', 'recommendations'],
  skill_evidence_changed: ['matches', 'readiness', 'recommendations'],
  taxonomy_changed: ['matches', 'readiness', 'recommendations'],
  manual: ['matches', 'readiness', 'recommendations'],
  // The role the user is aiming for decides which career's actions lead; scores do not depend on it
  target_role_changed: ['recommendations'],
  // Interview weaknesses feed recommendations; they are not skill evidence
  interview_completed: ['recommendations'],
  // The caller has already removed everything derived from the resume; nothing is left to compute
  resume_deleted: [],
  // Roadmap progress is read live by the snapshot; it changes no scored module
  roadmap_progress: []
};

const ALL_MODULES: IntelligenceModule[] = ['matches', 'readiness', 'recommendations'];

class RecalculationService {
  /**
   * Recomputes the modules a trigger affects, once.
   *
   * Runs for one user are serialised. A trigger whose inputs are identical to the last completed
   * run, and whose modules that run already covered, is recorded as `skipped_duplicate` and
   * recomputes nothing. Every call writes one RecalculationRun, so the effect of each event on
   * the user's figures can be read back.
   */
  public run(userId: string, trigger: RecalculationTrigger, triggerRef?: string): Promise<IRecalculationRun> {
    return withUserLock(`recalculate:${userId}`, () => this.execute(userId, trigger, triggerRef));
  }

  /** The user's recalculation history, newest first. */
  public async history(userId: string, limit = 20): Promise<IRecalculationRun[]> {
    return RecalculationRun.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
  }

  private async execute(userId: string, trigger: RecalculationTrigger, triggerRef?: string): Promise<IRecalculationRun> {
    const started = Date.now();
    const uid = new mongoose.Types.ObjectId(userId);
    const needed = AFFECTED_MODULES[trigger];
    const versions = { scoringVersion: SCORING_VERSION, taxonomyVersion: taxonomyVersion() };
    const fingerprint = await this.fingerprint(uid);
    const before = await this.figures(uid);

    const base = { userId: uid, trigger, triggerRef, fingerprint, before, ...versions };

    // Same inputs as the last completed run, and that run already refreshed what is needed now
    const last = await RecalculationRun.findOne({ userId: uid, status: 'completed' }).sort({ createdAt: -1, _id: -1 });
    const alreadyCurrent =
      last && last.fingerprint === fingerprint && needed.every(module => last.modulesRecomputed.includes(module));
    if (needed.length > 0 && alreadyCurrent) {
      return RecalculationRun.create({
        ...base,
        status: 'skipped_duplicate',
        modulesRecomputed: [],
        modulesSkipped: ALL_MODULES,
        after: before,
        durationMs: Date.now() - started
      });
    }

    try {
      if (needed.includes('matches')) {
        const { default: CareerMatchingEngine } = await import('./CareerMatchingEngine.js');
        await CareerMatchingEngine.evaluateUser(userId);
      }
      if (needed.includes('readiness')) {
        // Also rebuilds gap analysis and recommendations
        const { default: CareerReadinessService } = await import('./CareerReadinessService.js');
        await CareerReadinessService.evaluateUser(userId);
      } else if (needed.includes('recommendations')) {
        const { default: RecommendationEngine } = await import('./RecommendationEngine.js');
        await RecommendationEngine.generateForUser(userId);
      }

      return await RecalculationRun.create({
        ...base,
        status: 'completed',
        modulesRecomputed: needed,
        modulesSkipped: ALL_MODULES.filter(module => !needed.includes(module)),
        after: await this.figures(uid),
        durationMs: Date.now() - started
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Recalculation (${trigger}) failed for user ${userId}: ${message}`);
      return RecalculationRun.create({
        ...base,
        status: 'failed',
        modulesRecomputed: [],
        modulesSkipped: ALL_MODULES,
        after: await this.figures(uid),
        durationMs: Date.now() - started,
        error: message
      });
    }
  }

  /**
   * Hash of everything the derived modules are computed from: each skill's evidence score, the
   * target role, completed interviews, and the scoring and taxonomy versions. Two calls with the
   * same hash would produce the same results.
   */
  private async fingerprint(uid: mongoose.Types.ObjectId): Promise<string> {
    const [skills, user, interviews] = await Promise.all([
      UserSkill.find({ userId: uid }).select('skillId evidenceScore').lean(),
      User.findById(uid).select('targetRole').lean(),
      InterviewSession.countDocuments({ userId: uid, status: 'completed' })
    ]);
    const state = {
      skills: skills.map(s => `${String(s.skillId)}:${s.evidenceScore}`).sort(),
      targetRole: user?.targetRole || '',
      interviews,
      scoring: SCORING_VERSION,
      taxonomy: taxonomyVersion()
    };
    return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex').slice(0, 16);
  }

  private async figures(uid: mongoose.Types.ObjectId): Promise<IIntelligenceFigures> {
    const [skillCount, topMatch, activeRecommendations] = await Promise.all([
      UserSkill.countDocuments({ userId: uid }),
      CareerMatch.findOne({ userId: uid })
        .sort({ matchScore: -1, confidence: -1, _id: 1 })
        .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } | null }>('careerId', 'title'),
      Recommendation.countDocuments({ userId: uid, status: 'active' })
    ]);
    const readiness = topMatch?.careerId
      ? await CareerReadiness.findOne({ userId: uid, careerId: topMatch.careerId._id }).select('overallScore')
      : null;
    return {
      skillCount,
      topCareerTitle: topMatch?.careerId?.title ?? null,
      topMatchScore: topMatch?.matchScore ?? null,
      readinessScore: readiness?.overallScore ?? null,
      activeRecommendations
    };
  }
}

export default new RecalculationService();
