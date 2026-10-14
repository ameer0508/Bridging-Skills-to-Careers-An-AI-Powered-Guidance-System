import React from 'react';
import { ArrowLeftRight, Check, Clock, Sparkles } from 'lucide-react';

import { GlassCard } from '../cards/GlassCard';
import { TradeoffAnalysisResult } from './TradeoffAnalyzerEngine';

export interface TradeoffAnalyzerProps {
  tradeoff?: TradeoffAnalysisResult;
  className?: string;
}

export const TradeoffAnalyzer: React.FC<TradeoffAnalyzerProps> = ({
  tradeoff = {
    pathA: { title: 'Full Stack Engineer', score: 85, uniqueGaps: ['System Architecture'] },
    pathB: { title: 'Cloud Architect', score: 65, uniqueGaps: ['Kubernetes', 'Cloud Security', 'DevOps Pipelines'] },
    sharedSkills: ['Core Programming', 'Git Version Control', 'SQL Fundamentals'],
    additionalLearningHours: 45,
    readinessDelta: 20,
    recommendedChoice: 'Full Stack Engineer',
    reasoning:
      'Full Stack Engineer provides a higher immediate match score (+20%) and requires 45 fewer additional learning hours.',
  },
  className = '',
}) => {
  return (
    <GlassCard className={`p-6 border-purple-500/20 bg-purple-50 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-aurora-violet">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Side-by-Side Trade-off Analyzer</h3>
            <p className="text-xs text-aurora-muted">
              Evaluating trade-offs between target career trajectories
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Path A */}
        <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-aurora-ink">{tradeoff.pathA.title}</h4>
            <span className="text-sm font-extrabold text-emerald-700">
              {tradeoff.pathA.score}% Match
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-aurora-muted block font-semibold">Unique Skill Gaps:</span>
            <div className="flex flex-wrap gap-1">
              {tradeoff.pathA.uniqueGaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Path B */}
        <div className="p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-aurora-ink">{tradeoff.pathB.title}</h4>
            <span className="text-sm font-extrabold text-aurora-indigo">
              {tradeoff.pathB.score}% Match
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-aurora-muted block font-semibold">Unique Skill Gaps:</span>
            <div className="flex flex-wrap gap-1">
              {tradeoff.pathB.uniqueGaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-violet-50 text-aurora-violet border border-purple-500/30"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Skills & Tradeoff Insights */}
      <div className="p-4 rounded-xl bg-aurora-canvas border border-aurora-line space-y-3 text-xs text-aurora-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-aurora-ink">
            <Check className="w-4 h-4 text-emerald-700" />
            <span>Shared Transferable Competencies ({tradeoff.sharedSkills.length}):</span>
          </div>
          <div className="flex items-center gap-1 text-aurora-muted">
            <Clock className="w-3.5 h-3.5 text-aurora-indigo" />
            <span>+{tradeoff.additionalLearningHours} hrs extra learning</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tradeoff.sharedSkills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-aurora-line space-y-1">
          <span className="font-bold text-aurora-violet flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Trade-off Decision Advice:
          </span>
          <p className="leading-relaxed text-aurora-ink">{tradeoff.reasoning}</p>
        </div>
      </div>
    </GlassCard>
  );
};

export default TradeoffAnalyzer;
