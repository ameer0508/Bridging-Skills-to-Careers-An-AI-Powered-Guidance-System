import { ComprehensiveMomentumTelemetry } from '../momentum/CareerMomentumEngine';
import { ComprehensivePlan } from '../planning/CareerPlanningEngine';

export type PrimaryWorkspaceFocus = 'coaching' | 'planning' | 'strategy' | 'opportunity' | 'overview';

export interface ContextPrioritizationResult {
  primaryFocus: PrimaryWorkspaceFocus;
  focusTitle: string;
  focusDescription: string;
  explanation: string;
  evidence: string;
  urgencyScore: number; // 0-100
}

export const ContextPrioritizationEngine = {
  determineFocus(
    plan: ComprehensivePlan,
    momentum: ComprehensiveMomentumTelemetry
  ): ContextPrioritizationResult {
    // 1. Plateau Check (Highest Urgency)
    if (momentum.plateau.isPlateauDetected) {
      return {
        primaryFocus: 'coaching',
        focusTitle: 'Break Through Milestone Plateau',
        focusDescription: momentum.plateau.observation,
        explanation: 'Prioritized because learning consistency is high, but milestone completion has stalled over recent sessions.',
        evidence: 'Active session consistency with 0% recent roadmap item delta',
        urgencyScore: 90,
      };
    }

    // 2. Unlocked Opportunity / High Match (Strategy Focus)
    if (plan.forecast.unlockedRoleCount >= 3 || plan.aiContext.confidenceScore >= 75) {
      return {
        primaryFocus: 'strategy',
        focusTitle: 'Accelerate Career Strategy Alignment',
        focusDescription: `Your verified skill profile exhibits ${plan.aiContext.confidenceScore}% alignment for ${
          plan.aiContext.topMatch?.careerId?.title || 'your target role'
        }.`,
        explanation: 'Prioritized because your verified skills unlock high-confidence role matches and placement opportunities.',
        evidence: `${plan.aiContext.confidenceScore}% match confidence score`,
        urgencyScore: 80,
      };
    }

    // 3. Active Roadmap Milestone Pending (Planning Focus)
    if (plan.missions.length > 0) {
      const topMission = plan.missions[0];
      return {
        primaryFocus: 'planning',
        focusTitle: `Focus: ${topMission.title}`,
        focusDescription: topMission.reason,
        explanation: 'Prioritized because executing this milestone directly advances your roadmap progress percentage.',
        evidence: `Estimated time: ${topMission.estimatedTime}`,
        urgencyScore: 70,
      };
    }

    // 4. Default Overview Focus
    return {
      primaryFocus: 'overview',
      focusTitle: 'AI Career Operating System Active',
      focusDescription: 'Your workspace is synchronized with real-time career match telemetry.',
      explanation: 'Standard adaptive layout displaying complete platform workspace.',
      evidence: 'All engines operational',
      urgencyScore: 50,
    };
  },
};
