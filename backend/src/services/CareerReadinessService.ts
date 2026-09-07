import mongoose from 'mongoose';
import { Career } from '../models/Career.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { ReadinessHistory } from '../models/ReadinessHistory.js';
import { UserSkill } from '../models/UserSkill.js';
import ReadinessCalculator from './ReadinessCalculator.js';
import GapPrioritizer from './GapPrioritizer.js';
import logger from '../config/logger.js';

export class CareerReadinessService {
  /**
   * Re-evaluates readiness and gap analysis for a specific user.
   * This is typically invoked asynchronously after skill updates or manually.
   */
  public async evaluateUser(userId: string): Promise<void> {
    try {
      logger.info(`Starting Career Readiness Evaluation for user ${userId}`);

      const userSkills = await UserSkill.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('skillId');

      if (!userSkills.length) {
        logger.warn(`No skills found for user ${userId}. Cannot run Readiness.`);
        return;
      }

      const allCareers = await Career.find({ isActive: true });

      // Clean up previous readiness data (replace with fresh computed data)
      await CareerReadiness.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
      await GapAnalysis.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      const newReadiness = [];
      const newGaps = [];
      const newHistories = [];

      for (const career of allCareers) {
        const requirements = await CareerRequirement.find({ careerId: career._id });

        if (!requirements.length) continue;

        // 1. Compute Readiness
        const readinessData = ReadinessCalculator.calculate(requirements, userSkills);

        // 2. Compute Gaps
        const gapData = GapPrioritizer.analyze(requirements, userSkills);

        // Only save if there's at least some non-zero base compatibility to avoid database bloat
        // e.g. overallScore > 5
        if (readinessData.overallScore > 5) {
          newReadiness.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: career._id,
            overallScore: readinessData.overallScore,
            readinessTier: readinessData.tier,
            dimensions: readinessData.dimensions
          });

          newGaps.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: career._id,
            criticalGaps: gapData.criticalGaps,
            weakAreas: gapData.weakAreas,
            strengthAreas: gapData.strengthAreas
          });

          newHistories.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: career._id,
            overallScore: readinessData.overallScore
          });
        }
      }

      if (newReadiness.length > 0) {
        await CareerReadiness.insertMany(newReadiness);
        await GapAnalysis.insertMany(newGaps);
        await ReadinessHistory.insertMany(newHistories);
        logger.info(`Saved ${newReadiness.length} Readiness records for user ${userId}`);

        // 3. Trigger Recommendations Async
        const RecommendationEngine = (await import('./RecommendationEngine.js')).default;
        RecommendationEngine.generateForUser(userId).catch(e => {
          logger.error(`Async Recommendation Generation failed for ${userId}: ${e.message}`);
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error evaluating readiness for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Retrieves all computed readiness data for a user.
   */
  public async getUserReadiness(userId: string) {
    const readiness = await CareerReadiness.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ overallScore: -1 })
      .populate('careerId', 'title category description')
      .lean();

    const gaps = await GapAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();

    // Map gaps to their respective readiness
    const gapMap = new Map();
    gaps.forEach(g => {
      gapMap.set(g.careerId.toString(), g);
    });

    return readiness.map(r => {
      return {
        ...r,
        gaps: gapMap.get(r.careerId.toString()) || {
          criticalGaps: [],
          weakAreas: [],
          strengthAreas: []
        }
      };
    });
  }
}

export default new CareerReadinessService();
