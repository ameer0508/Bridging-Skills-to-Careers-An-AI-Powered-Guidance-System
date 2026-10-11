import React, { useMemo } from 'react';
import { ArrowUpRight, Check, Compass } from 'lucide-react';

export interface NarrativeTrajectoryRiverProps {
  hasTargetRole: boolean;
  targetRole: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  isInitialized: boolean;
  savedOpportunitiesCount: number;
  interviewsCount: number;
  phases: Array<{
    title: string;
    description?: string;
    items?: Array<{ title: string; status: string }>;
  }>;
  onViewFullRoadmap: () => void;
  onNavigate: (route: string) => void;
}

interface RiverMilestone {
  id: string;
  title: string;
  subtitle: string;
  status: 'complete' | 'current' | 'upcoming';
  route: string;
}

export const NarrativeTrajectoryRiver: React.FC<NarrativeTrajectoryRiverProps> = ({
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
  const milestones: RiverMilestone[] = useMemo(() => {
    const rawList = [
      { id: 'profile', title: 'Profile Initiation', subtitle: 'Target preferences set', route: '/profile' },
      { id: 'resume', title: 'Resume Parsing', subtitle: hasResume ? 'Experience extracted' : 'Awaiting document', route: '/resume' },
      { id: 'skills', title: 'Skill Inventory', subtitle: totalSkills > 0 ? `${totalSkills} competencies` : 'Needs audit', route: '/skills' },
      { id: 'role', title: 'Summit Calibration', subtitle: hasTargetRole && targetRole ? targetRole : 'Select role', route: '/careers' },
      { id: 'readiness', title: 'Readiness Benchmark', subtitle: readinessScore ? `${readinessScore}% alignment` : 'Pending evaluation', route: '/readiness' },
      { id: 'roadmap', title: 'Curriculum Trajectory', subtitle: isInitialized ? `${roadmapProgress}% completed` : 'Unplanned', route: '/roadmap' },
      { id: 'opportunities', title: 'Market Radar', subtitle: `${savedOpportunitiesCount} saved roles`, route: '/opportunities' },
      { id: 'interviews', title: 'Interview Simulator', subtitle: `${interviewsCount} mock sessions`, route: '/interview-agent' },
      { id: 'offer', title: 'Career Offer', subtitle: 'Target attainment', route: '/analytics' },
    ];

    const completed = [
      true,
      hasResume,
      totalSkills > 0,
      hasTargetRole,
      readinessScore !== null && readinessScore > 0,
      roadmapProgress > 0,
      savedOpportunitiesCount > 0,
      interviewsCount > 0,
      false,
    ];

    let currentFound = false;

    return rawList.map((item, idx) => {
      if (completed[idx]) {
        return { ...item, status: 'complete' as const };
      }
      if (!currentFound) {
        currentFound = true;
        return { ...item, status: 'current' as const };
      }
      return { ...item, status: 'upcoming' as const };
    });
  }, [hasResume, totalSkills, hasTargetRole, targetRole, readinessScore, roadmapProgress, isInitialized, savedOpportunitiesCount, interviewsCount]);

  const completedCount = milestones.filter((m) => m.status === 'complete').length;

  return (
    <section className="carto-surface p-8 sm:p-10 space-y-7 relative overflow-hidden">
      {/* Header Narrative */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>Trajectory River</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            The Continuous Ascent Timeline
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            Stage {completedCount + 1} of {milestones.length}
          </span>
          <button
            onClick={onViewFullRoadmap}
            className="carto-ghost-btn group"
          >
            <span>Curriculum Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Fluid Continuous River Track */}
      <div className="overflow-x-auto no-scrollbar py-3">
        <div className="flex items-center min-w-[780px] justify-between relative px-4">
          {/* Continuous Flowing River Filament */}
          <div className="absolute top-5 left-8 right-8 river-track -z-0" />

          {milestones.map((milestone, idx) => {
            const isComplete = milestone.status === 'complete';
            const isCurrent = milestone.status === 'current';

            return (
              <div
                key={milestone.id}
                onClick={() => onNavigate(milestone.route)}
                className="flex flex-col items-center text-center space-y-2.5 relative z-10 cursor-pointer group flex-1"
              >
                {/* Node Orb */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/25 font-bold scale-110 shadow-lg shadow-amber-400/30'
                      : 'bg-slate-900 border border-white/15 text-slate-500 group-hover:border-white/30'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>

                {/* Text Description */}
                <div className="space-y-0.5 max-w-[100px]">
                  <span
                    className={`text-xs font-medium block truncate ${
                      isCurrent ? 'text-white font-semibold' : isComplete ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {milestone.title}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {milestone.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Phase Context Ribbon (If initialized) */}
      {isInitialized && phases.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-amber-400 font-medium">Active Learning Phase:</span>
            <p className="text-slate-200 font-semibold">{phases[0]?.title}</p>
          </div>
          <button
            onClick={onViewFullRoadmap}
            className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Resume Phase Practice</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
