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
            className="group relative overflow-hidden rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-5 shadow-lg backdrop-blur-md transition-all hover:border-aurora-line hover:bg-aurora-canvas/60"
          >
            {/* Ambient accent hover glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-aurora-canvas blur-2xl transition group-hover:bg-aurora-canvas" />

            <div className="relative z-10 space-y-3">
              {/* Header: Label + Icon */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-aurora-muted uppercase tracking-wider">
                  {vec.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-aurora-canvas border border-aurora-line flex items-center justify-center text-aurora-muted group-hover:text-aurora-indigo transition">
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              {/* Value & Delta */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-aurora-ink">
                  {vec.value}
                </span>

                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    vec.delta > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : vec.delta < 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-aurora-canvas/80 text-aurora-muted border border-aurora-line'
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
              <div className="pt-2 border-t border-aurora-line flex items-center justify-between text-xs text-aurora-muted">
                <span>{vec.subtext}</span>
                <span className="text-[10px] text-aurora-muted capitalize">{periodName}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

CurrentTrajectoryVector.displayName = 'CurrentTrajectoryVector';
