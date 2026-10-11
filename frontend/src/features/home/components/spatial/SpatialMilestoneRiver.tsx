import React from 'react';
import { Compass, CheckCircle2, Circle, Clock, ArrowUpRight } from 'lucide-react';

export interface TrajectoryPhaseItem {
  title: string;
  description?: string;
  items?: Array<{ title: string; status: string }>;
}

export interface SpatialMilestoneRiverProps {
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

export const SpatialMilestoneRiver: React.FC<SpatialMilestoneRiverProps> = ({
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
  const safeSkillsCount = totalSkills || 0;
  const safeProgress = roadmapProgress || 0;
  const safeOppsCount = savedOpportunitiesCount || 0;
  const safeInterviewsCount = interviewsCount || 0;

  const milestones = [
    {
      id: 'm1',
      label: 'Summit Focus',
      description: targetRole || 'Target Career Track',
      isComplete: Boolean(hasTargetRole),
      route: '/careers',
    },
    {
      id: 'm2',
      label: 'Profile Intel',
      description: hasResume ? 'Resume Synthesized' : 'Upload Resume Document',
      isComplete: Boolean(hasResume),
      route: '/resume',
    },
    {
      id: 'm3',
      label: 'Competencies',
      description: `${safeSkillsCount} Verified Nodes`,
      isComplete: safeSkillsCount > 0,
      route: '/skills',
    },
    {
      id: 'm4',
      label: 'Readiness Audit',
      description: readinessScore !== null && readinessScore !== undefined ? `${readinessScore}% Match` : 'Awaiting Audit',
      isComplete: readinessScore !== null && readinessScore !== undefined && readinessScore > 0,
      route: '/readiness',
    },
    {
      id: 'm5',
      label: 'Strategy Roadmap',
      description: isInitialized ? `${safeProgress}% Trajectory` : 'Generate Trajectory',
      isComplete: Boolean(isInitialized && safeProgress > 0),
      route: '/roadmap',
    },
    {
      id: 'm6',
      label: 'Market Alignment',
      description: `${safeOppsCount} Tracked Positions`,
      isComplete: safeOppsCount > 0,
      route: '/opportunities',
    },
    {
      id: 'm7',
      label: 'Simulation Prep',
      description: `${safeInterviewsCount} Mock Interviews`,
      isComplete: safeInterviewsCount > 0,
      route: '/interview-agent',
    },
  ];

  return (
    <div className="spatial-glass-blade p-7 sm:p-10 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold tracking-wide">
            <Compass className="w-4 h-4" />
            <span>Developmental Trajectory Horizon</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Strategic Milestones & Career River
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-4 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {safeProgress}% Trajectory Progress
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

      {/* Fluid Milestone Stream */}
      <div className="relative pt-6 pb-3 overflow-x-auto no-scrollbar">
        <div className="relative min-w-[780px] px-4">
          {/* Luminous Stream Light Beam */}
          <div className="absolute top-[32px] left-8 right-8 spatial-luminous-river h-[3px] rounded-full z-0" />

          {/* Milestones Flow */}
          <div className="relative flex justify-between z-10">
            {milestones.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => onNavigate(m.route)}
                className="flex flex-col items-center text-center cursor-pointer group max-w-[105px]"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                    m.isComplete
                      ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:scale-115'
                      : 'bg-slate-950/80 border-white/10 text-slate-500 group-hover:border-amber-400/50 group-hover:text-amber-200'
                  }`}
                >
                  {m.isComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>

                <span className="text-xs font-bold text-white mt-3 group-hover:text-amber-300 transition-colors">
                  {m.label}
                </span>
                <span className="text-[11px] text-slate-400 truncate w-full mt-0.5 leading-snug">
                  {m.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trajectory Phases (if present) */}
      {phases && Array.isArray(phases) && phases.length > 0 && (
        <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {phases.slice(0, 3).map((phase, pIdx) => (
            <div
              key={pIdx}
              onClick={onViewFullRoadmap}
              className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Phase 0{pIdx + 1}</span>
                <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
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
    </div>
  );
};
