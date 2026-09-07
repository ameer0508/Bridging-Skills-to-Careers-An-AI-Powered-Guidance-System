import mongoose from 'mongoose';
import { UserSkill } from '../models/UserSkill.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { AnalyticsSnapshot } from '../models/AnalyticsSnapshot.js';
import { ProgressEvent } from '../models/ProgressEvent.js';

export class ContextAssembler {
  /**
   * Gathers all verified platform intelligence for a specific user and career target.
   * This object serves as the sole source of truth for the LLM.
   */
  public async assembleContext(userId: string, careerId?: string): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const { default: User } = await import('../models/User.js');
        const userDoc = await User.findById(userId).select('primaryCareerDomain secondaryCareerDomains targetRole fullName email');
        if (userDoc) {
          context.userDomain = {
            primaryCareerDomain: userDoc.primaryCareerDomain || '',
            secondaryCareerDomains: userDoc.secondaryCareerDomains || [],
            targetRole: userDoc.targetRole || '',
            fullName: userDoc.fullName,
          };
        }
      } catch {
        // Continue gracefully
      }
    }

    // 1. Skill Intelligence
    if (mongoose.connection.readyState === 1) {
      try {
        const skills = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) })
          .populate('skillId')
          .lean();
        context.skills = skills.map((s: Record<string, unknown>) => {
          const skillObj = s.skillId as Record<string, unknown> | undefined;
          const evidencesList = (s.evidences as Record<string, unknown>[]) || [];
          return {
            name: skillObj?.name || s.skillId,
            evidenceScore: s.evidenceScore,
            verifiedVia: evidencesList.map(e => e.sourceType),
          };
        });
      } catch {
        context.skills = [];
      }
    } else {
      context.skills = [{ name: 'TypeScript', evidenceScore: 90, verifiedVia: ['github'] }];
    }

    if (!careerId) {
      return context; // Generic context if no career is targeted yet
    }

    // 2. Career specific intelligence
    const careerObjectId = new mongoose.Types.ObjectId(careerId);

    const readiness = await CareerReadiness.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: careerObjectId,
    }).lean();
    if (readiness) {
      context.readiness = {
        overallScore: readiness.overallScore,
        dimensions: readiness.dimensions,
      };
    }

    const gaps = await GapAnalysis.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: careerObjectId,
    }).lean();
    if (gaps) {
      context.gaps = {
        criticalGaps: gaps.criticalGaps.map((g: Record<string, unknown>) => g.skillName),
        weakAreas: gaps.weakAreas.map((g: Record<string, unknown>) => g.skillName),
      };
    }

    const recommendations = await Recommendation.find({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: careerObjectId,
      status: { $ne: 'completed' },
    })
      .sort({ priorityScore: -1 })
      .limit(5)
      .lean();

    context.topRecommendations = recommendations.map(r => ({
      title: r.title,
      reason: r.reason,
      estimatedTime: r.estimatedTime,
    }));

    const roadmap = await LearningRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: careerObjectId,
    }).lean();
    if (roadmap) {
      context.roadmapProgress = roadmap.progressPercentage;
      const activePhase = roadmap.phases.find((p: Record<string, unknown>) =>
        (p.items as Record<string, unknown>[]).some(
          (i: Record<string, unknown>) =>
            i.status === 'in_progress' || i.status === 'not_started'
        )
      );
      if (activePhase) {
        context.currentLearningPhase = {
          title: activePhase.title,
          objective: activePhase.objective,
          pendingItems: (activePhase.items as Record<string, unknown>[])
            .filter((i: Record<string, unknown>) => i.status !== 'completed')
            .map((i: Record<string, unknown>) => i.title),
        };
      }
    }

    const latestSnapshot = await AnalyticsSnapshot.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      period: 'daily',
    })
      .sort({ date: -1 })
      .lean();
    if (latestSnapshot) {
      context.analytics = latestSnapshot.metrics;
    }

    const recentEvents = await ProgressEvent.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    context.recentActivity = recentEvents.map(e => ({
      event: e.eventType,
      date: e.createdAt,
    }));

    // 3. Interview Intelligence & Opportunity Pipeline Grounding
    if (mongoose.connection.readyState === 1) {
      try {
        const { default: InterviewSession } = await import('../models/InterviewSession.js');
        const { default: SavedOpportunity } = await import('../models/SavedOpportunity.js');

        const latestInterview = await InterviewSession.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed',
        }).sort({ createdAt: -1 }).lean();

        if (latestInterview) {
          context.latestInterview = {
            overallScore: latestInterview.overallScore,
            mode: latestInterview.mode,
            weaknesses: latestInterview.weaknesses,
            recommendations: latestInterview.preparationRecommendations,
          };
        }

        const savedOppCount = await SavedOpportunity.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        const appliedOppCount = await SavedOpportunity.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
          status: 'applied',
        });

        context.opportunityPipeline = {
          savedTotal: savedOppCount,
          appliedTotal: appliedOppCount,
        };
      } catch {
        // Fallback gracefully if database models are loading
      }
    }

    return context;
  }
}

export default new ContextAssembler();
