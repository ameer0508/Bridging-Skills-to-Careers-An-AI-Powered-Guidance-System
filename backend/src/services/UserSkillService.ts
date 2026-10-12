import mongoose from 'mongoose';
import { UserSkill } from '../models/UserSkill.js';
import { ExtractedSkill } from '../models/ExtractedSkill.js';
import { ParsedResume } from '../models/ParsedResume.js';
import SkillNormalizationService from './SkillNormalizationService.js';
import EvidenceCalculator from './EvidenceCalculator.js';
import logger from '../config/logger.js';
import type { IResumeSkillChanges } from '../models/Resume.js';

class UserSkillService {
  /** Canonical names of the skills currently on the user's profile. */
  private async currentSkillNames(userId: string): Promise<string[]> {
    const docs = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    return docs
      .map(d => (d.skillId as unknown as { canonicalName?: string } | null)?.canonicalName)
      .filter((n): n is string => typeof n === 'string');
  }

  /**
   * Removes everything derived from the user's resume skills: the skill profile, career
   * matches, readiness, gap analysis and still-active recommendations.
   *
   * Roadmaps (with their completed items), completed or saved recommendations, readiness
   * history, interviews and saved jobs are the user's own history and are left untouched.
   */
  async clearDerivedIntelligence(userId: string): Promise<void> {
    const uid = new mongoose.Types.ObjectId(userId);
    const { CareerMatch } = await import('../models/CareerMatch.js');
    const { CareerReadiness } = await import('../models/CareerReadiness.js');
    const { GapAnalysis } = await import('../models/GapAnalysis.js');
    const { Recommendation } = await import('../models/Recommendation.js');
    await UserSkill.deleteMany({ userId: uid });
    await CareerMatch.deleteMany({ userId: uid });
    await CareerReadiness.deleteMany({ userId: uid });
    await GapAnalysis.deleteMany({ userId: uid });
    await Recommendation.deleteMany({ userId: uid, status: 'active' });
  }

  /**
   * Called after a resume is parsed and ExtractedSkills are saved.
   * It takes those raw skills, normalizes them, calculates evidence, and saves to UserSkill.
   */
  async buildUserSkillsFromResume(userId: string, resumeId: string): Promise<IResumeSkillChanges | null> {
    try {
      const previousNames = await this.currentSkillNames(userId);
      const diffAgainst = (current: string[]): IResumeSkillChanges => {
        const before = new Set(previousNames);
        const after = new Set(current);
        return {
          comparedToPrevious: previousNames.length > 0,
          added: current.filter(n => !before.has(n)).sort(),
          removed: previousNames.filter(n => !after.has(n)).sort(),
          unchangedCount: current.filter(n => before.has(n)).length,
        };
      };

      // 1. Fetch raw extracted skills and parsed resume data
      const extractedSkills = await ExtractedSkill.find({ resumeId });
      const parsedResume = await ParsedResume.findOne({ resumeId });

      if (!parsedResume) {
        logger.warn(`Cannot build user skills. Missing data for resume: ${resumeId}`);
        return null;
      }
      if (!extractedSkills.length) {
        // A resume with no recognisable skills must not leave the previous resume's skills,
        // matches and readiness on screen as if they still applied.
        await this.clearDerivedIntelligence(userId);
        logger.warn(`No skills recognised in resume ${resumeId}; derived data cleared for user ${userId}`);
        return diffAgainst([]);
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
          category: canonicalSkill.category || 'General',
          evidenceScore: score,
          proficiency: EvidenceCalculator.estimateProficiency(score),
          evidences: evidences
        });
      }

      if (userSkillsToInsert.length > 0) {
        await UserSkill.insertMany(userSkillsToInsert);
        logger.info(
          `Successfully built ${userSkillsToInsert.length} UserSkills for user ${userId}`
        );

        // 5. Recompute Career Matching & Readiness
        const CareerMatchingEngine = (await import('./CareerMatchingEngine.js')).default;
        const CareerReadinessService = (await import('./CareerReadinessService.js')).default;

        // Awaited in order so the resume is only reported as processed once every
        // downstream record (matches -> readiness/gaps -> recommendations) is consistent.
        await CareerMatchingEngine.evaluateUser(userId);
        await CareerReadinessService.evaluateUser(userId);
      } else {
        await this.clearDerivedIntelligence(userId);
      }
      return diffAgainst(await this.currentSkillNames(userId));
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Failed to build UserSkills for user ${userId}: ${err.message}`);
      return null;
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
