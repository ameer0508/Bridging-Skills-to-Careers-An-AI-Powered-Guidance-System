import mongoose from 'mongoose';
import { Insight } from '../models/Insight.js';
import { AnalyticsSnapshot } from '../models/AnalyticsSnapshot.js';
import logger from '../config/logger.js';

export class InsightGenerator {
  /**
   * Compares the latest snapshot with a previous one to derive insights.
   */
  public async generateInsights(userId: string): Promise<void> {
    try {
      const snapshots = await AnalyticsSnapshot.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ date: -1 })
        .limit(2)
        .lean();

      if (snapshots.length < 2) {
        return; // Need at least two snapshots to compare
      }

      const current = snapshots[0].metrics;
      const previous = snapshots[1].metrics;
      
      const newInsights = [];

      // Wipe active daily insights (for simplicity, we just keep a rolling window of recent ones)
      await Insight.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      // Growth Insight
      if (current.totalSkills > previous.totalSkills) {
        const diff = current.totalSkills - previous.totalSkills;
        newInsights.push({
          userId: new mongoose.Types.ObjectId(userId),
          type: 'growth',
          title: 'Skill Base Expanding',
          description: `You have added ${diff} new verified skill${diff > 1 ? 's' : ''} to your profile recently.`,
          metricsReference: { previousSkills: previous.totalSkills, currentSkills: current.totalSkills }
        });
      }

      // Trend Insight
      if (current.averageReadinessScore > previous.averageReadinessScore) {
        const diff = current.averageReadinessScore - previous.averageReadinessScore;
        newInsights.push({
          userId: new mongoose.Types.ObjectId(userId),
          type: 'trend',
          title: 'Career Readiness Improving',
          description: `Your average career readiness score increased by ${diff}%. You are getting closer to your target roles!`,
          metricsReference: { previousReadiness: previous.averageReadinessScore, currentReadiness: current.averageReadinessScore }
        });
      }

      // Achievement Insight
      if (current.completedRoadmapItems > previous.completedRoadmapItems) {
        const diff = current.completedRoadmapItems - previous.completedRoadmapItems;
        newInsights.push({
          userId: new mongoose.Types.ObjectId(userId),
          type: 'achievement',
          title: 'Roadmap Velocity',
          description: `Great job! You completed ${diff} roadmap action${diff > 1 ? 's' : ''} since your last snapshot.`,
          metricsReference: { newCompletions: diff }
        });
      }

      // Gap Closure Insight
      if (current.totalGaps < previous.totalGaps) {
        const diff = previous.totalGaps - current.totalGaps;
        newInsights.push({
          userId: new mongoose.Types.ObjectId(userId),
          type: 'achievement',
          title: 'Closing the Gaps',
          description: `You successfully closed ${diff} critical or weak area gap${diff > 1 ? 's' : ''}. Your profile is getting stronger.`,
          metricsReference: { gapsClosed: diff }
        });
      }

      if (newInsights.length > 0) {
        await Insight.insertMany(newInsights);
      }

    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error generating insights for user ${userId}: ${err.message}`);
    }
  }

  public async getInsights(userId: string) {
    return await Insight.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default new InsightGenerator();
