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
    <GlassCard className={`p-6 border-purple-500/20 bg-purple-950/20 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Side-by-Side Trade-off Analyzer</h3>
            <p className="text-xs text-neutral-400">
              Evaluating trade-offs between target career trajectories
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Path A */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">{tradeoff.pathA.title}</h4>
            <span className="text-sm font-extrabold text-emerald-400">
              {tradeoff.pathA.score}% Match
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-neutral-400 block font-semibold">Unique Skill Gaps:</span>
            <div className="flex flex-wrap gap-1">
              {tradeoff.pathA.uniqueGaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Path B */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">{tradeoff.pathB.title}</h4>
            <span className="text-sm font-extrabold text-indigo-400">
              {tradeoff.pathB.score}% Match
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-neutral-400 block font-semibold">Unique Skill Gaps:</span>
            <div className="flex flex-wrap gap-1">
              {tradeoff.pathB.uniqueGaps.map((gap, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  {gap}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Skills & Tradeoff Insights */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs text-neutral-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Shared Transferable Competencies ({tradeoff.sharedSkills.length}):</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>+{tradeoff.additionalLearningHours} hrs extra learning</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tradeoff.sharedSkills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-white/5 space-y-1">
          <span className="font-bold text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Trade-off Decision Advice:
          </span>
          <p className="leading-relaxed text-neutral-200">{tradeoff.reasoning}</p>
        </div>
      </div>
    </GlassCard>
  );
};

export default TradeoffAnalyzer;
