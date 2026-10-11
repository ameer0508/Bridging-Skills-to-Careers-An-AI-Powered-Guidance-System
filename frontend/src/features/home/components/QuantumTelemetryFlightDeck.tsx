import React from 'react';
import { Target, Cpu, Compass, ArrowUpRight, Layers } from 'lucide-react';

export interface QuantumTelemetryFlightDeckProps {
  matchScore: number | null;
  isMatchEvaluated: boolean;
  totalSkills: number;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  savedOpportunitiesCount: number;
  roadmapProgress: number;
  isRoadmapInitialized: boolean;
  onNavigate: (route: string) => void;
}

export const QuantumTelemetryFlightDeck: React.FC<QuantumTelemetryFlightDeckProps> = ({
  matchScore,
  isMatchEvaluated,
  totalSkills,
  readinessScore,
  isReadinessEvaluated,
  savedOpportunitiesCount: _savedOpportunitiesCount,
  roadmapProgress,
  isRoadmapInitialized,
  onNavigate,
}) => {
  const telemetryPods = [
    {
      id: 'match',
      title: 'Target Path Match Vector',
      value: isMatchEvaluated && matchScore !== null ? `${matchScore}%` : '—',
      subtext: isMatchEvaluated ? 'Semantic AI Role Alignment' : 'Profile Awaiting Calibration',
      icon: Target,
      color: 'text-cyan-400',
      glowBg: 'bg-cyan-500/10',
      borderGlow: 'hover:border-cyan-500/40',
      route: '/careers',
      metricDelta: isMatchEvaluated ? 'Calibrated' : 'Pending',
    },
    {
      id: 'skills',
      title: 'Verified Competencies',
      value: totalSkills > 0 ? totalSkills : '0',
      unit: 'Skills',
      subtext: totalSkills > 0 ? 'Active Capability Inventory' : 'Upload Resume to Populate',
      icon: Layers,
      color: 'text-indigo-400',
      glowBg: 'bg-indigo-500/10',
      borderGlow: 'hover:border-indigo-500/40',
      route: '/skills',
      metricDelta: totalSkills > 0 ? `${totalSkills} Audited` : 'Empty',
    },
    {
      id: 'readiness',
      title: 'Career Readiness Index',
      value: isReadinessEvaluated && readinessScore !== null ? `${readinessScore}%` : '—',
      subtext: isReadinessEvaluated ? 'Multi-Dimensional Diagnostic' : 'Diagnostic Unevaluated',
      icon: Cpu,
      color: 'text-emerald-400',
      glowBg: 'bg-emerald-500/10',
      borderGlow: 'hover:border-emerald-500/40',
      route: '/readiness',
      metricDelta: isReadinessEvaluated ? 'Target Benchmarked' : 'Awaiting Run',
    },
    {
      id: 'roadmap',
      title: 'Blueprint Trajectory',
      value: isRoadmapInitialized ? `${roadmapProgress}%` : '—',
      subtext: isRoadmapInitialized ? 'Milestone Execution Progress' : 'Roadmap Not Yet Generated',
      icon: Compass,
      color: 'text-purple-400',
      glowBg: 'bg-purple-500/10',
      borderGlow: 'hover:border-purple-500/40',
      route: '/roadmap',
      metricDelta: isRoadmapInitialized ? `${roadmapProgress}% Completed` : 'Uninitialized',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {telemetryPods.map((pod) => {
        const Icon = pod.icon;
        return (
          <div
            key={pod.id}
            onClick={() => onNavigate(pod.route)}
            className={`hud-pod p-5 flex flex-col justify-between space-y-4 cursor-pointer group transition-all duration-300 ${pod.borderGlow}`}
          >
            {/* Pod Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {pod.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${pod.glowBg} border border-white/10 flex items-center justify-center ${pod.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Pod Apex Metric */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
                  {pod.value}
                </span>
                {pod.unit && (
                  <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                    {pod.unit}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-snug">
                {pod.subtext}
              </p>
            </div>

            {/* Pod Footer Bar */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">{pod.metricDelta}</span>
              <span className="text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                Launch <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
