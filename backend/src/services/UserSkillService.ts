import mongoose from 'mongoose';
import { UserSkill } from '../models/UserSkill.js';
import { ExtractedSkill } from '../models/ExtractedSkill.js';
import { ParsedResume } from '../models/ParsedResume.js';
import SkillNormalizationService from './SkillNormalizationService.js';
import EvidenceCalculator from './EvidenceCalculator.js';
import logger from '../config/logger.js';

class UserSkillService {
  /**
   * Called after a resume is parsed and ExtractedSkills are saved.
   * It takes those raw skills, normalizes them, calculates evidence, and saves to UserSkill.
   */
  async buildUserSkillsFromResume(userId: string, resumeId: string): Promise<void> {
    try {
      // 1. Fetch raw extracted skills and parsed resume data
      const extractedSkills = await ExtractedSkill.find({ resumeId });
      const parsedResume = await ParsedResume.findOne({ resumeId });

      if (!extractedSkills.length || !parsedResume) {
        logger.warn(`Cannot build user skills. Missing data for resume: ${resumeId}`);
        return;
      }

      const rawSkillNames = extractedSkills.map(s => s.name);

      // 2. Normalize skills via AI / Cache
      const normalizedMap = await SkillNormalizationService.normalizeSkills(rawSkillNames);

      // 3. Clear existing UserSkills associated with this resume (if we're rebuilding)
      // Since UserSkill is a union of all user evidences, we'll just recalculate for the given skills.
      // For now, if they replace a resume, we can just replace their entire skill profile based on that resume.
      // (Assuming 1 active resume = 1 skill profile for this milestone).
      await UserSkill.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      const userSkillsToInsert = [];

      // 4. Calculate Evidence and build UserSkill docs
      // We iterate over the unique canonical skills returned by the normalizer.
      const processedCanonicalIds = new Set<string>();

      for (const [, canonicalSkill] of normalizedMap.entries()) {
        const canonicalIdStr = canonicalSkill._id.toString();

        // Prevent duplicate UserSkill entries if multiple raw skills map to the same canonical skill
        if (processedCanonicalIds.has(canonicalIdStr)) continue;
        processedCanonicalIds.add(canonicalIdStr);

        const { score, evidences } = EvidenceCalculator.calculateForSkill(
          canonicalSkill.canonicalName,
          canonicalSkill.aliases,
          parsedResume
        );

        userSkillsToInsert.push({
          userId: new mongoose.Types.ObjectId(userId),
          skillId: canonicalSkill._id,
          evidenceScore: score,
          evidences: evidences
        });
      }

      if (userSkillsToInsert.length > 0) {
        await UserSkill.insertMany(userSkillsToInsert);
        logger.info(
          `Successfully built ${userSkillsToInsert.length} UserSkills for user ${userId}`
        );

        // 5. Trigger Career Matching & Readiness asynchronously
        const CareerMatchingEngine = (await import('./CareerMatchingEngine.js')).default;
        const CareerReadinessService = (await import('./CareerReadinessService.js')).default;

        CareerMatchingEngine.evaluateUser(userId)
          .then(() => {
            return CareerReadinessService.evaluateUser(userId);
          })
          .catch(e => {
            logger.error(`Async Career Match/Readiness failed for ${userId}: ${e.message}`);
          });
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Failed to build UserSkills for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Fetches the user's mapped skills with populated canonical skill data.
   */
  async getUserSkills(userId: string) {
    return UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('skillId')
      .sort({ evidenceScore: -1 });
  }
}

export default new UserSkillService();
