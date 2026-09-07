import { PriorityLevel } from '../models/Recommendation.js';

export class PriorityCalculator {
  /**
   * Calculates a deterministic priority score (0-100) and priority level
   * based on gap impact, career readiness overall score, and recommendation type.
   */
  public static calculate(
    gapImpact: number, // 0-100 impact of missing skill
    category: string
  ): { priorityScore: number; priority: PriorityLevel } {
    let score = gapImpact;

    // Weight the score slightly based on the category of recommendation
    switch (category) {
      case 'Projects':
        score *= 1.2; // High value for hands-on application
        break;
      case 'Learning Resources':
        score *= 1.1; // Essential for missing critical knowledge
        break;
      case 'Certifications':
        score *= 0.9; // Good, but usually longer term and lower immediate priority
        break;
      case 'Resume Improvements':
        score *= 1.5; // Very high value if they already have the skill but aren't showing it
        break;
      default:
        break;
    }

    score = Math.round(Math.min(score, 100));

    let priority: PriorityLevel = 'Low';
    if (score >= 85) priority = 'Highest';
    else if (score >= 60) priority = 'High';
    else if (score >= 40) priority = 'Medium';

    return { priorityScore: score, priority };
  }
}

export default PriorityCalculator;
