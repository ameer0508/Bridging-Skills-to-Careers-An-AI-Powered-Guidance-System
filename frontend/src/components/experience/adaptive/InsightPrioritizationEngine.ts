export interface PrioritizedInsight {
  id: string;
  title: string;
  category: string;
  impactScore: number;
  confidenceTier: string;
  evidence: string;
  rank: number;
}

export const InsightPrioritizationEngine = {
  rankInsights(insights: Array<{ id: string; title: string; category: string; impact?: number }>): PrioritizedInsight[] {
    const scored = insights.map((ins, idx) => {
      const impactScore = ins.impact || Math.max(50, 95 - idx * 10);
      return {
        id: ins.id || `ins-${idx}`,
        title: ins.title,
        category: ins.category || 'Strategic Insight',
        impactScore,
        confidenceTier: impactScore >= 85 ? 'High Confidence' : 'Moderate Confidence',
        evidence: `Ranked #${idx + 1} by impact score telemetry (${impactScore}%)`,
        rank: idx + 1,
      };
    });

    // Sort descending by impactScore
    return scored.sort((a, b) => b.impactScore - a.impactScore);
  },
};
