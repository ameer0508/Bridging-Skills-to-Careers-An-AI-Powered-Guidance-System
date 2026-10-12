import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Cpu,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export interface TrajectoryMetrics {
  totalSkills: number;
  averageReadinessScore: number;
  totalGaps: number;
  completedRecommendations: number;
  completedRoadmapItems: number;
}

export interface TrajectoryTrends {
  readinessGrowth: number;
  skillsAdded: number;
  gapsClosed: number;
  itemsCompleted: number;
}

export interface CurrentTrajectoryVectorProps {
  currentMetrics: TrajectoryMetrics;
  trends: TrajectoryTrends;
  periodName: string;
  roadmapProgress?: number;
}

export const CurrentTrajectoryVector: React.FC<CurrentTrajectoryVectorProps> = ({
  currentMetrics,
  trends,
  periodName,
  roadmapProgress = 0,
}) => {
  const vectors = [
    {
      id: 'readiness',
      label: 'Readiness Trajectory',
      value: `${currentMetrics.averageReadinessScore}%`,
      subtext: 'Overall target alignment',
      delta: trends.readinessGrowth,
      deltaLabel: trends.readinessGrowth !== 0
        ? `${trends.readinessGrowth > 0 ? '+' : ''}${trends.readinessGrowth}% ${periodName}`
        : 'Steady',
      isPositive: trends.readinessGrowth >= 0,
      icon: Award,
      accent: 'indigo',
    },
    {
      id: 'skills',
      label: 'Capability Index',
      value: `${currentMetrics.totalSkills}`,
      subtext: 'Verified technical skills',
      delta: trends.skillsAdded,
      deltaLabel: trends.skillsAdded !== 0
        ? `${trends.skillsAdded > 0 ? '+' : ''}${trends.skillsAdded} added`
        : 'No new skills',
      isPositive: trends.skillsAdded >= 0,
      icon: Cpu,
      accent: 'cyan',
    },
    {
      id: 'curriculum',
      label: 'Curriculum Velocity',
      value: `${currentMetrics.completedRoadmapItems}`,
      subtext: `${roadmapProgress}% roadmap completed`,
      delta: trends.itemsCompleted,
      deltaLabel: trends.itemsCompleted !== 0
        ? `${trends.itemsCompleted > 0 ? '+' : ''}${trends.itemsCompleted} completed`
        : 'Velocity steady',
      isPositive: trends.itemsCompleted >= 0,
      icon: Layers,
      accent: 'purple',
    },
    {
      id: 'gaps',
      label: 'Gap Remediation',
      value: `${currentMetrics.totalGaps}`,
      subtext: 'Remaining capability gaps',
      delta: trends.gapsClosed,
      deltaLabel: trends.gapsClosed !== 0
        ? `${trends.gapsClosed > 0 ? '+' : ''}${trends.gapsClosed} resolved`
        : 'Gaps stable',
      isPositive: trends.gapsClosed >= 0,
      icon: AlertTriangle,
      accent: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {vectors.map((vec, idx) => {
        const IconComponent = vec.icon;
        return (
          <motion.div
            key={vec.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-white/20 hover:bg-slate-900/80"
          >
            {/* Ambient accent hover glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/5 blur-2xl transition group-hover:bg-white/10" />

            <div className="relative z-10 space-y-3">
              {/* Header: Label + Icon */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  {vec.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white transition">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              {/* Value & Delta */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                  {vec.value}
                </span>

                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold ${
                    vec.delta > 0
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : vec.delta < 0
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  }`}
                >
                  {vec.delta > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : vec.delta < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {vec.deltaLabel}
                </div>
              </div>

              {/* Context subtext */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>{vec.subtext}</span>
                <span className="text-[10px] font-mono text-slate-500 capitalize">{periodName}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

CurrentTrajectoryVector.displayName = 'CurrentTrajectoryVector';
