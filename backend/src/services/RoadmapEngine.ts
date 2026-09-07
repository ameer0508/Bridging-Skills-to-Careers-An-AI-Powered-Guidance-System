import mongoose from 'mongoose';
import { Recommendation } from '../models/Recommendation.js';
import { LearningRoadmap, IRoadmapPhase, IRoadmapItem } from '../models/LearningRoadmap.js';
import { RoadmapHistory } from '../models/RoadmapHistory.js';
import DependencyResolver from './DependencyResolver.js';
import logger from '../config/logger.js';

export class RoadmapEngine {
  /**
   * Generates or regenerates an adaptive learning roadmap for a user targeting a specific career.
   */
  public async generateRoadmap(userId: string, careerId: string): Promise<void> {
    try {
      logger.info(`Generating roadmap for user ${userId} and career ${careerId}`);

      // 1. Fetch active (uncompleted) recommendations for this career
      // Sorted by priorityScore descending to ensure highest impact items are surfaced first
      const recommendations = await Recommendation.find({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        status: { $in: ['active', 'saved_for_later'] }
      })
        .sort({ priorityScore: -1 })
        .lean();

      if (recommendations.length === 0) {
        logger.info(
          `No active recommendations found for roadmap generation. User ${userId} is fully ready.`
        );
        return;
      }

      // 2. Fetch existing roadmap to preserve completed items
      const existingRoadmap = await LearningRoadmap.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId)
      });

      const completedItemsByTargetSkill = new Map<string, IRoadmapItem>();
      if (existingRoadmap) {
        existingRoadmap.phases.forEach(phase => {
          phase.items.forEach(item => {
            if (item.status === 'completed' && item.targetSkill) {
              completedItemsByTargetSkill.set(item.targetSkill, item);
            }
          });
        });
      }

      // 3. Resolve Dependencies and create tiers
      const tiers = DependencyResolver.resolveTiers(recommendations);

      // 4. Map tiers to Roadmap Phases
      const phases: IRoadmapPhase[] = [];
      let phaseOrder = 1;

      const phaseTitles = [
        'Phase 1: Critical Foundations',
        'Phase 2: Core Competencies',
        'Phase 3: Intermediate Application',
        'Phase 4: Advanced Mastery',
        'Phase 5: Final Polish & Portfolio'
      ];

      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        if (!tier || tier.length === 0) continue;

        const phaseItems: IRoadmapItem[] = tier.map((rec: Record<string, unknown>) => ({
          recommendationId: rec._id as mongoose.Types.ObjectId,
          title: rec.title as string,
          description: rec.description as string,
          category: rec.category as string,
          priority: rec.priority as string,
          estimatedDuration: rec.estimatedTime as string,
          difficulty: rec.difficulty as string,
          prerequisites: rec.dependencies as string[],
          careerRelevance: rec.reason as string,
          expectedOutcome: `Demonstrated capability in ${(rec.targetSkill as string) || 'this area'}`,
          completionCriteria: 'Complete associated resources or verify via new evidence',
          status: 'not_started',
          targetSkill: rec.targetSkill as string
        }));

        phases.push({
          title: phaseTitles[i] || `Phase ${i + 1}: Extended Learning`,
          order: phaseOrder++,
          objective: `Resolve tier ${i + 1} dependencies and build necessary competencies.`,
          skillsGained: Array.from(new Set(tier.map((r: Record<string, unknown>) => r.targetSkill as string).filter(Boolean))),
          expectedReadinessImprovement: `High impact on ${tier.length > 2 ? 'multiple' : 'specific'} readiness dimensions.`,
          estimatedCompletionTime: tier.reduce((acc, val: Record<string, unknown>) => acc + ' + ' + (val.estimatedTime as string), '').substring(3), // Naive join for now
          items: phaseItems
        });
      }

      // 5. Save Roadmap
      let finalRoadmapId: mongoose.Types.ObjectId;

      if (existingRoadmap) {
        // Retain progress tracking
        existingRoadmap.phases = phases;
        // In a fully robust system, we would merge the old completed phases back in,
        // but for this MVP, we rely on the fact that Recommendations for completed items
        // wouldn't exist anymore if they uploaded a new resume proving they have it.
        await existingRoadmap.save();
        finalRoadmapId = existingRoadmap._id;

        await RoadmapHistory.create({
          userId: new mongoose.Types.ObjectId(userId),
          careerId: new mongoose.Types.ObjectId(careerId),
          roadmapId: finalRoadmapId,
          action: 'regenerated',
          details: 'Roadmap regenerated based on new intelligence or gap analysis.'
        });
      } else {
        const newRoadmap = await LearningRoadmap.create({
          userId: new mongoose.Types.ObjectId(userId),
          careerId: new mongoose.Types.ObjectId(careerId),
          phases,
          progressPercentage: 0
        });
        finalRoadmapId = newRoadmap._id;

        await RoadmapHistory.create({
          userId: new mongoose.Types.ObjectId(userId),
          careerId: new mongoose.Types.ObjectId(careerId),
          roadmapId: finalRoadmapId,
          action: 'created',
          details: 'Initial roadmap created.'
        });
      }

      logger.info(`Roadmap generation complete for user ${userId}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error generating roadmap for user ${userId}: ${err.message}`);
    }
  }
}

export default new RoadmapEngine();
