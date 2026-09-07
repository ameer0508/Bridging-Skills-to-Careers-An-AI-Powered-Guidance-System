import mongoose from 'mongoose';
import { AnalyticsSnapshot } from '../models/AnalyticsSnapshot.js';
import { UserSkill } from '../models/UserSkill.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import logger from '../config/logger.js';

export class SnapshotService {
  /**
   * Takes a current snapshot of the user's intelligence states.
   * Typically called via a daily cron job or triggered manually for this MVP.
   */
  public async createSnapshot(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      // Check if we already snapped today
      const existing = await AnalyticsSnapshot.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        period: 'daily',
        date: today
      });

      if (existing) {
        return; // Already snapped today
      }

      // Compute metrics
      const totalSkills = await UserSkill.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
      
      const readinesses = await CareerReadiness.find({ userId: new mongoose.Types.ObjectId(userId) });
      const averageReadinessScore = readinesses.length > 0
        ? readinesses.reduce((acc, r) => acc + r.overallScore, 0) / readinesses.length
        : 0;

      const gaps = await GapAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) });
      const totalGaps = gaps.reduce((acc, g) => acc + g.criticalGaps.length + g.weakAreas.length, 0);

      const completedRecommendations = await Recommendation.countDocuments({ 
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      });

      const roadmaps = await LearningRoadmap.find({ userId: new mongoose.Types.ObjectId(userId) });
      let completedRoadmapItems = 0;
      roadmaps.forEach(r => {
        r.phases.forEach(p => {
          p.items.forEach(i => {
            if (i.status === 'completed') completedRoadmapItems++;
          });
        });
      });

      await AnalyticsSnapshot.create({
        userId: new mongoose.Types.ObjectId(userId),
        period: 'daily',
        date: today,
        metrics: {
          totalSkills,
          averageReadinessScore: Math.round(averageReadinessScore),
          totalGaps,
          completedRecommendations,
          completedRoadmapItems
        }
      });

      logger.info(`Created daily analytics snapshot for user ${userId}`);

    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error creating snapshot for user ${userId}: ${err.message}`);
    }
  }

  public async getSnapshots(userId: string, limit: number = 30) {
    return await AnalyticsSnapshot.find({ userId: new mongoose.Types.ObjectId(userId), period: 'daily' })
      .sort({ date: 1 })
      .limit(limit)
      .lean();
  }

  /**
   * Assembles a unified canonical server-side career intelligence snapshot across all 12 platform subsystems
   */
  public async getUnifiedCareerSnapshot(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID provided');
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Dynamic imports to prevent circular dependencies
    const { default: CareerMatch } = await import('../models/CareerMatch.js');
    const { default: ParsedResume } = await import('../models/ParsedResume.js');
    const { default: SavedOpportunity } = await import('../models/SavedOpportunity.js');
    const { default: InterviewSession } = await import('../models/InterviewSession.js');

    const { default: User } = await import('../models/User.js');
    const userDoc = await User.findById(userObjId).select('targetRole primaryCareerDomain');

    if (mongoose.connection.readyState !== 1) {
      return {
        targetCareer: userDoc?.targetRole || userDoc?.primaryCareerDomain || 'Target Career Role',
        matchScore: 0,
        readinessScore: 0,
        totalSkills: 0,
        criticalGaps: [],
        roadmapProgress: 0,
        activeRecommendationsCount: 0,
        opportunities: { saved: 0, applied: 0, interviewing: 0, offer: 0 },
        interviews: { total: 0, completed: 0, averageScore: 0, latestScore: 0 },
      };
    }

    // 1. Target career match
    const topMatch = await CareerMatch.findOne({ userId: userObjId }).sort({ matchScore: -1 }).populate<{ careerId: { title: string } }>('careerId');
    const targetCareer = topMatch?.careerId && typeof topMatch.careerId === 'object'
      ? topMatch.careerId.title
      : userDoc?.targetRole || userDoc?.primaryCareerDomain || 'Target Career Role';
    const matchScore = topMatch?.matchScore || 0;

    // 2. Readiness & dimensions
    const readiness = await CareerReadiness.findOne({ userId: userObjId }).sort({ updatedAt: -1 });
    const readinessScore = readiness?.overallScore || 0;

    // 3. User Skills
    const totalSkills = await UserSkill.countDocuments({ userId: userObjId });

    // 4. Critical Gaps
    const gapDoc = await GapAnalysis.findOne({ userId: userObjId }).sort({ updatedAt: -1 });
    const criticalGaps = gapDoc?.criticalGaps?.map((g) => g.skillName) || [];

    // 5. Active Recommendations
    const activeRecsCount = await Recommendation.countDocuments({ userId: userObjId, status: { $ne: 'completed' } });

    // 6. Roadmap progress
    const roadmaps = await LearningRoadmap.find({ userId: userObjId });
    let totalItems = 0;
    let completedItems = 0;
    roadmaps.forEach((r) => {
      r.phases.forEach((p) => {
        p.items.forEach((item) => {
          totalItems++;
          if (item.status === 'completed') completedItems++;
        });
      });
    });
    const roadmapProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // 7. Saved Opportunity Telemetry
    const savedDocs = await SavedOpportunity.find({ userId: userObjId });
    const opportunityTelemetry = {
      saved: savedDocs.filter((d) => d.status === 'saved').length,
      applied: savedDocs.filter((d) => d.status === 'applied').length,
      interviewing: savedDocs.filter((d) => d.status === 'interviewing').length,
      offer: savedDocs.filter((d) => d.status === 'offer').length,
      rejected: savedDocs.filter((d) => d.status === 'rejected').length,
      withdrawn: savedDocs.filter((d) => d.status === 'withdrawn').length,
    };

    // 8. Interview Telemetry
    const sessions = await InterviewSession.find({ userId: userObjId }).sort({ createdAt: -1 });
    const completedSessions = sessions.filter((s) => s.status === 'completed' && typeof s.overallScore === 'number');
    const averageInterviewScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
      : 0;

    const latestSession = completedSessions[0];
    const latestInterviewScore = latestSession?.overallScore || 0;

    // 9. Active Resume ATS
    const resumeDoc = await ParsedResume.findOne({ userId: userObjId }).sort({ updatedAt: -1 });

    return {
      targetCareer,
      matchScore,
      readinessScore,
      totalSkills,
      criticalGaps,
      roadmapProgress,
      activeRecommendationsCount: activeRecsCount,
      opportunities: opportunityTelemetry,
      interviews: {
        total: sessions.length,
        completed: completedSessions.length,
        averageScore: averageInterviewScore,
        latestScore: latestInterviewScore,
        latestWeaknesses: latestSession?.weaknesses || [],
      },
      resumeInfo: {
        hasResume: Boolean(resumeDoc),
        updatedAt: resumeDoc?.updatedAt || null,
      },
    };
  }
}

export default new SnapshotService();
