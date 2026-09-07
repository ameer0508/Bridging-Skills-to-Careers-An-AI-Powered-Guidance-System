import mongoose from 'mongoose';
import { Career } from '../models/Career.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { UserSkill } from '../models/UserSkill.js';
import CareerScoringEngine from './CareerScoringEngine.js';
import ExplanationGenerator from './ExplanationGenerator.js';
import logger from '../config/logger.js';

export class CareerMatchingEngine {
  /**
   * Recomputes career matches for a specific user.
   * Typically called after their skills are updated.
   */
  public async evaluateUser(userId: string): Promise<void> {
    try {
      logger.info(`Starting deterministic Career Matching for user ${userId}`);

      const userSkills = await UserSkill.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).populate('skillId');

      if (!userSkills.length) {
        logger.warn(`No skills found for user ${userId}. Cannot run Career Matching.`);
        return;
      }

      const allCareers = await Career.find({ isActive: true });
      const newMatches = [];

      // Clear old matches
      await CareerMatch.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      for (const career of allCareers) {
        const requirements = await CareerRequirement.find({ careerId: career._id });

        if (!requirements.length) {
          continue; // Skip careers with no requirements mapped
        }

        const scoreResult = CareerScoringEngine.calculateScore(requirements, userSkills);
        const { strengths, weaknesses } = ExplanationGenerator.generate(
          requirements,
          userSkills,
          scoreResult.missingSkills
        );

        // Only save matches above a baseline threshold (e.g., > 10%) so we don't spam the DB
        if (scoreResult.totalScore > 10) {
          newMatches.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: career._id,
            matchScore: scoreResult.totalScore,
            matchingSkills: scoreResult.matchingSkills,
            missingSkills: scoreResult.missingSkills,
            strengths,
            weaknesses,
            confidence: scoreResult.confidence
          });
        }
      }

      if (newMatches.length > 0) {
        await CareerMatch.insertMany(newMatches);
        logger.info(`Saved ${newMatches.length} valid Career Matches for user ${userId}`);
      } else {
        logger.info(`No careers matched above threshold for user ${userId}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error evaluating careers for user ${userId}: ${err.message}`);
    }
  }
}

export default new CareerMatchingEngine();
