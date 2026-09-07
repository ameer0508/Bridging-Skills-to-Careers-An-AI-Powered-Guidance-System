import mongoose from 'mongoose';
import { GapAnalysis, IGapItem } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import PriorityCalculator from './PriorityCalculator.js';
import ResourceMatcher from './ResourceMatcher.js';
import logger from '../config/logger.js';

export class RecommendationEngine {
  /**
   * Generates recommendations based on the user's latest gap analysis for all matched careers.
   */
  public async generateForUser(userId: string): Promise<void> {
    try {
      logger.info(`Starting Recommendation Generation for user ${userId}`);

      const gaps = await GapAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) });
      const newRecommendations = [];

      // Wipe active, unconverted recommendations (refresh) to avoid duplicates
      await Recommendation.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active'
      });

      for (const gapAnalysis of gaps) {
        // Analyze Critical Gaps first
        for (const gap of gapAnalysis.criticalGaps) {
          const recs = await this.buildRecommendationsForGap(
            userId,
            gapAnalysis.careerId.toString(),
            gap,
            true
          );
          newRecommendations.push(...recs);
        }

        // Analyze Weak Areas next
        for (const gap of gapAnalysis.weakAreas) {
          const recs = await this.buildRecommendationsForGap(
            userId,
            gapAnalysis.careerId.toString(),
            gap,
            false
          );
          newRecommendations.push(...recs);
        }

        // If they have strengths but a low overall readiness, maybe recommend Resume Improvements
        // (Assuming if they have the skill, they just need to showcase it better, though our evidence score
        // already accounts for resume sections. Just a conceptual demonstration.)
        if (gapAnalysis.strengthAreas.length > 0) {
          const strength = gapAnalysis.strengthAreas[0]; // Pick their top strength
          const { priorityScore, priority } = PriorityCalculator.calculate(
            40,
            'Resume Improvements'
          );
          newRecommendations.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: gapAnalysis.careerId,
            category: 'Resume Improvements',
            title: `Highlight ${strength.skillName} in your Executive Summary`,
            description: `You have strong evidence for ${strength.skillName}. Make sure it is highly visible at the top of your resume to catch recruiters' eyes.`,
            priority,
            priorityScore,
            reason: strength.reason,
            impact: 40,
            difficulty: 'Beginner',
            estimatedTime: '30 mins',
            dependencies: [],
            confidence: 90,
            targetSkill: strength.skillName
          });
        }
      }

      if (newRecommendations.length > 0) {
        // We use try-catch to safely ignore uniqueness constraint errors if a duplicate somehow slips in
        // across different careers (e.g. recommending Python for both Backend and Data Science)
        // Mongoose insertMany with ordered: false will insert successful ones and skip errors
        try {
          await Recommendation.insertMany(newRecommendations, { ordered: false });
          logger.info(`Generated new recommendations for user ${userId}`);
        } catch (err: unknown) {
          // ordered: false throws a BulkWriteError if ANY fail, but still inserts the rest
          if ((err as Record<string, unknown>).code === 11000) {
            logger.warn(`Some duplicate recommendations were skipped for user ${userId}`);
          } else {
            logger.error(`Failed to insert recommendations: ${(err as Error).message}`);
          }
        }
      }

      // 6. Regenerate any existing active roadmaps now that recommendations changed
      const LearningRoadmap = (await import('../models/LearningRoadmap.js')).default;
      const RoadmapEngineInstance = (await import('./RoadmapEngine.js')).default;

      const existingRoadmaps = await LearningRoadmap.find({
        userId: new mongoose.Types.ObjectId(userId)
      });
      for (const roadmap of existingRoadmaps) {
        await RoadmapEngineInstance.generateRoadmap(userId, roadmap.careerId.toString());
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error generating recommendations for user ${userId}: ${err.message}`);
    }
  }

  private async buildRecommendationsForGap(
    userId: string,
    careerId: string,
    gap: IGapItem,
    isCritical: boolean
  ) {
    const recs = [];

    // 1. Learning Resources
    const resources = await ResourceMatcher.matchLearningResources(gap.skillName);
    for (const res of resources) {
      const { priorityScore, priority } = PriorityCalculator.calculate(
        gap.impactScore,
        'Learning Resources'
      );
      recs.push({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        category: 'Learning Resources',
        title: `Learn ${gap.skillName}: ${res.title}`,
        description: `Take this ${res.difficulty.toLowerCase()} ${res.type.toLowerCase()} by ${res.provider} to build foundational knowledge.`,
        priority,
        priorityScore,
        reason: gap.reason,
        impact: gap.impactScore,
        difficulty: res.difficulty,
        estimatedTime: res.estimatedTime,
        dependencies: [],
        confidence: isCritical ? 95 : 75,
        actionLink: res.url,
        actionType: res.type,
        targetSkill: gap.skillName
      });
    }

    // 2. Projects
    const projects = await ResourceMatcher.matchProjects(gap.skillName);
    for (const proj of projects) {
      const { priorityScore, priority } = PriorityCalculator.calculate(gap.impactScore, 'Projects');
      recs.push({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        category: 'Projects',
        title: `Build Project: ${proj.title}`,
        description: proj.description,
        priority,
        priorityScore,
        reason: `Hands-on application is required to prove proficiency in ${gap.skillName}.`,
        impact: gap.impactScore,
        difficulty: proj.difficulty,
        estimatedTime: proj.estimatedTime,
        dependencies: [`Understand ${gap.skillName} basics`],
        confidence: 90,
        actionType: 'Project',
        targetSkill: gap.skillName
      });
    }

    // 3. Certifications (Only if critical or high impact)
    if (gap.impactScore > 75) {
      const certs = await ResourceMatcher.matchCertifications(gap.skillName);
      for (const cert of certs) {
        const { priorityScore, priority } = PriorityCalculator.calculate(
          gap.impactScore,
          'Certifications'
        );
        recs.push({
          userId: new mongoose.Types.ObjectId(userId),
          careerId: new mongoose.Types.ObjectId(careerId),
          category: 'Certifications',
          title: `Get Certified: ${cert.title}`,
          description: `Earning this official certification from ${cert.provider} will strongly validate your ${gap.skillName} skills.`,
          priority,
          priorityScore,
          reason: gap.reason,
          impact: gap.impactScore,
          difficulty: cert.difficulty,
          estimatedTime: cert.estimatedTime,
          dependencies: [`Deep experience with ${gap.skillName}`],
          confidence: 85,
          actionLink: cert.url,
          actionType: 'Certification',
          targetSkill: gap.skillName
        });
      }
    }

    return recs;
  }
}

export default new RecommendationEngine();
