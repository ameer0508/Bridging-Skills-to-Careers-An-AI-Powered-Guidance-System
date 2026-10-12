import React from 'react';
import { ArrowUpRight, Compass, CheckCircle2, Circle, Clock } from 'lucide-react';
import { SpotlightSurface } from './SpotlightSurface';

export interface TrajectoryPhaseItem {
  title: string;
  description?: string;
  items?: Array<{ title: string; status: string }>;
}

export interface SpatialTrajectoryHorizonProps {
  hasTargetRole: boolean;
  targetRole: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  isInitialized: boolean;
  savedOpportunitiesCount: number;
  interviewsCount: number;
  phases: TrajectoryPhaseItem[];
  onViewFullRoadmap: () => void;
  onNavigate: (route: string) => void;
}

export const SpatialTrajectoryHorizon: React.FC<SpatialTrajectoryHorizonProps> = ({
  hasTargetRole,
  targetRole,
  hasResume,
  totalSkills,
  readinessScore,
  roadmapProgress,
  isInitialized,
  savedOpportunitiesCount,
  interviewsCount,
  phases,
  onViewFullRoadmap,
  onNavigate,
}) => {
  // Synthesize progression milestones across candidate lifecycle
  const milestones = [
    {
      id: 'm1',
      label: 'Summit Focus',
      description: targetRole || 'Target Career Track',
      isComplete: hasTargetRole,
      route: '/careers',
    },
    {
      id: 'm2',
      label: 'Profile Intel',
      description: hasResume ? 'Resume Synthesized' : 'Upload Resume Document',
      isComplete: hasResume,
      route: '/resume',
    },
    {
      id: 'm3',
      label: 'Competencies',
      description: `${totalSkills} Verified Nodes`,
      isComplete: totalSkills > 0,
      route: '/skills',
    },
    {
      id: 'm4',
      label: 'Readiness Audit',
      description: readinessScore !== null ? `${readinessScore}% Match` : 'Awaiting Audit',
      isComplete: readinessScore !== null && readinessScore > 0,
      route: '/readiness',
    },
    {
      id: 'm5',
      label: 'Strategy Roadmap',
      description: isInitialized ? `${roadmapProgress}% Trajectory` : 'Generate Trajectory',
      isComplete: isInitialized && roadmapProgress > 0,
      route: '/roadmap',
    },
    {
      id: 'm6',
      label: 'Market Alignment',
      description: `${savedOpportunitiesCount} Tracked Positions`,
      isComplete: savedOpportunitiesCount > 0,
      route: '/opportunities',
    },
    {
      id: 'm7',
      label: 'Simulation Prep',
      description: `${interviewsCount} Mock Interviews`,
      isComplete: interviewsCount > 0,
      route: '/interview-agent',
    },
  ];

  return (
    <SpotlightSurface
      spotlightColor="rgba(16, 185, 129, 0.08)"
      spotlightRadius={400}
      className="p-6 sm:p-9 space-y-6"
    >
      {/* Narrative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium tracking-wide">
            <Compass className="w-3.5 h-3.5" />
            <span>Developmental Trajectory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Strategic Milestones & Trajectory River
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 font-medium">
            {roadmapProgress}% Trajectory Complete
          </span>
          <button
            onClick={onViewFullRoadmap}
            className="spatial-ghost-btn group"
          >
            <span>Active Curriculum</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Horizontal Milestone River */}
      <div className="relative pt-4 pb-2 overflow-x-auto no-scrollbar">
        <div className="relative min-w-[760px] px-3">
          {/* Continuous River Vector Track */}
          <div className="absolute top-[28px] left-6 right-6 spatial-river-track rounded-full z-0" />

          {/* Milestones Flow */}
          <div className="relative flex justify-between z-10">
            {milestones.map((m) => {
              return (
                <div
                  key={m.id}
                  onClick={() => onNavigate(m.route)}
                  className="flex flex-col items-center text-center cursor-pointer group max-w-[100px]"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      m.isComplete
                        ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-115'
                        : 'bg-slate-900/80 border-white/10 text-slate-500 group-hover:border-white/30 group-hover:text-slate-300'
                    }`}
                  >
                    {m.isComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>

                  <span className="text-xs font-semibold text-white mt-3 group-hover:text-emerald-300 transition-colors">
                    {m.label}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate w-full mt-0.5">
                    {m.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trajectory Phases Preview (if initialized) */}
      {phases && phases.length > 0 && (
        <div className="pt-2 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {phases.slice(0, 3).map((phase, pIdx) => (
            <div
              key={pIdx}
              onClick={onViewFullRoadmap}
              className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Phase 0{pIdx + 1}</span>
                <Clock className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                {phase.title}
              </h4>
              {phase.description && (
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {phase.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </SpotlightSurface>
  );
};
