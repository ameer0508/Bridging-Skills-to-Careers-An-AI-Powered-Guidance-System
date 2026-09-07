import SnapshotService from './SnapshotService.js';
import InsightGenerator from './InsightGenerator.js';
import ProgressEventService from './ProgressEventService.js';
import logger from '../config/logger.js';

class AnalyticsService {
  /**
   * Triggers the generation of the latest snapshot and insights.
   */
  public async refreshAnalytics(userId: string): Promise<void> {
    try {
      await SnapshotService.createSnapshot(userId);
      await InsightGenerator.generateInsights(userId);
      logger.info(`Refreshed analytics for user ${userId}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error refreshing analytics for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Gathers all necessary data for the frontend Analytics Dashboard.
   */
  public async getDashboardData(userId: string, period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    // 1. Refresh so we have the absolute latest snapshot for today
    await this.refreshAnalytics(userId);

    // 2. Fetch data
    let snapshotLimit = 30; // default monthly
    if (period === 'weekly') snapshotLimit = 7;
    else if (period === 'quarterly') snapshotLimit = 90;
    else if (period === 'yearly') snapshotLimit = 365;

    const snapshots = await SnapshotService.getSnapshots(userId, snapshotLimit);
    const insights = await InsightGenerator.getInsights(userId);
    const recentEvents = await ProgressEventService.getEvents(userId, 10);

    // 3. Current Metrics (from latest snapshot)
    const currentMetrics = snapshots.length > 0 
      ? snapshots[snapshots.length - 1].metrics 
      : {
          totalSkills: 0,
          averageReadinessScore: 0,
          totalGaps: 0,
          completedRecommendations: 0,
          completedRoadmapItems: 0
        };

    // 4. Calculate trend velocity (latest vs oldest in the selected period)
    const oldestMetrics = snapshots.length > 0 
      ? snapshots[0].metrics 
      : currentMetrics;

    const trends = {
      readinessGrowth: currentMetrics.averageReadinessScore - oldestMetrics.averageReadinessScore,
      skillsAdded: currentMetrics.totalSkills - oldestMetrics.totalSkills,
      gapsClosed: oldestMetrics.totalGaps - currentMetrics.totalGaps,
      itemsCompleted: currentMetrics.completedRoadmapItems - oldestMetrics.completedRoadmapItems
    };

    return {
      period,
      currentMetrics,
      trends,
      insights,
      recentEvents,
      historicalSnapshots: snapshots.map(s => ({
        date: s.date,
        averageReadinessScore: s.metrics.averageReadinessScore,
        totalSkills: s.metrics.totalSkills,
        completedItems: s.metrics.completedRoadmapItems
      }))
    };
  }
}

export default new AnalyticsService();
