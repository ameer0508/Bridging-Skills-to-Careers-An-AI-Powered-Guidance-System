import React from 'react';
import { Activity, TrendingUp, HelpCircle } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { CountUpNumber } from '../typography/CountUpNumber';
import { MomentumScoreData } from './MomentumScoreEngine';

export interface MomentumScoreBreakdownProps {
  momentumScoreData?: MomentumScoreData;
  className?: string;
}

export const MomentumScoreBreakdown: React.FC<MomentumScoreBreakdownProps> = ({
  momentumScoreData = {
    overallScore: 68,
    recentDelta: 5,
    confidence: 'High Confidence (Verified Data)',
    factors: [
      {
        name: 'Roadmap Execution',
        weightPercentage: 35,
        score: 70,
        contribution: 24,
        evidence: '40% curriculum completed',
      },
      {
        name: 'Verified Skill Graph',
        weightPercentage: 30,
        score: 60,
        contribution: 18,
        evidence: '6 skills verified',
      },
      {
        name: 'Target Role Readiness',
        weightPercentage: 20,
        score: 80,
        contribution: 16,
        evidence: '80% match model alignment',
      },
      {
        name: 'Learning Consistency',
        weightPercentage: 15,
        score: 65,
        contribution: 10,
        evidence: 'Active session streak',
      },
    ],
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 space-y-5 ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Overall Career Momentum</h3>
            <p className="text-xs text-neutral-400">
              Transparent, evidence-weighted professional momentum score
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <TrendingUp className="w-4 h-4" />
          <span>+{momentumScoreData.recentDelta}% Recent Growth</span>
        </div>
      </div>

      {/* Main Score Hero */}
      <div className="flex items-baseline justify-between p-5 rounded-xl bg-black/40 border border-white/5">
        <div>
          <span className="text-xs font-medium text-neutral-400 block mb-1">
            Calculated Momentum Rating
          </span>
          <div className="text-4xl font-extrabold text-white">
            <CountUpNumber value={momentumScoreData.overallScore} suffix="%" />
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-indigo-300 px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/30">
            {momentumScoreData.confidence}
          </span>
        </div>
      </div>

      {/* Transparent Contributing Factor Weights */}
      <div className="space-y-3 pt-1">
        <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
          <span>Contributing Telemetry Factors</span>
          <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
        </span>

        <div className="space-y-2.5">
          {momentumScoreData.factors.map((factor, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  {factor.name}{' '}
                  <span className="text-neutral-500 font-normal">({factor.weightPercentage}% Weight)</span>
                </span>
                <span className="font-bold text-indigo-400">+{factor.contribution}% Score</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${Math.min(100, factor.score)}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 block">{factor.evidence}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default MomentumScoreBreakdown;
