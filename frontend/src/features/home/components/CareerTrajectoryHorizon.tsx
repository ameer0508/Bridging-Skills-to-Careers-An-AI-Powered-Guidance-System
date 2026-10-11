import React, { useMemo } from 'react';
import { ArrowUpRight, Check, Compass } from 'lucide-react';

export interface CareerTrajectoryHorizonProps {
  hasTargetRole: boolean;
  targetRole: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  isInitialized: boolean;
  savedOpportunitiesCount: number;
  applicationsCount: number;
  interviewsCount: number;
  phases: Array<{
    title: string;
    description?: string;
    items?: Array<{ title: string; status: string }>;
  }>;
  onViewFullRoadmap: () => void;
  onNavigate: (route: string) => void;
}

interface MilestoneNode {
  id: string;
  label: string;
  subtext: string;
  status: 'complete' | 'current' | 'upcoming';
  route: string;
}

export const CareerTrajectoryHorizon: React.FC<CareerTrajectoryHorizonProps> = ({
  hasTargetRole,
  targetRole,
  hasResume,
  totalSkills,
  readinessScore,
  roadmapProgress,
  isInitialized,
  savedOpportunitiesCount,
  applicationsCount,
  interviewsCount,
  phases,
  onViewFullRoadmap,
  onNavigate,
}) => {
  const steps: MilestoneNode[] = useMemo(() => {
    const rawSteps = [
      { id: 'profile', label: 'Onboarding', subtext: 'Preferences', route: '/profile' },
      { id: 'resume', label: 'Resume', subtext: hasResume ? 'Processed' : 'Awaiting', route: '/resume' },
      { id: 'skills', label: 'Skills', subtext: totalSkills > 0 ? `${totalSkills} Verified` : 'Pending', route: '/skills' },
      { id: 'role', label: 'Target Track', subtext: hasTargetRole && targetRole ? targetRole : 'Select Role', route: '/careers' },
      { id: 'readiness', label: 'Readiness', subtext: readinessScore ? `${readinessScore}% Ready` : 'Evaluating', route: '/readiness' },
      { id: 'roadmap', label: 'Curriculum', subtext: isInitialized ? `${roadmapProgress}% Done` : 'Unplanned', route: '/roadmap' },
      { id: 'opportunities', label: 'Market Radar', subtext: `${savedOpportunitiesCount} Saved`, route: '/opportunities' },
      { id: 'interviews', label: 'Interview Prep', subtext: `${interviewsCount} Sessions`, route: '/interview-agent' },
      { id: 'offer', label: 'Career Offer', subtext: 'Final Milestone', route: '/analytics' },
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

    return rawSteps.map((step, idx) => {
      if (completed[idx]) {
        return { ...step, status: 'complete' as const };
      }
      if (!currentFound) {
        currentFound = true;
        return { ...step, status: 'current' as const };
      }
      return { ...step, status: 'upcoming' as const };
    });
  }, [hasResume, totalSkills, hasTargetRole, targetRole, readinessScore, roadmapProgress, isInitialized, savedOpportunitiesCount, interviewsCount]);

  const completedCount = steps.filter((s) => s.status === 'complete').length;

  return (
    <section className="atelier-glass-card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight font-display">
              Career Trajectory Horizon
            </h3>
            <p className="text-xs text-slate-400">
              End-to-end advancement from capability auditing to final placement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
            Step {completedCount + 1} of {steps.length}
          </span>
          <button
            onClick={onViewFullRoadmap}
            className="atelier-ghost-btn py-1 px-2.5 text-xs group"
          >
            <span>Full Roadmap</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Horizontal Trajectory Flow */}
      <div className="overflow-x-auto no-scrollbar pb-2 pt-2">
        <div className="flex items-center min-w-[700px] justify-between relative px-2">
          {/* Subtle Connecting Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/10 -z-0" />

          {steps.map((step, idx) => {
            const isComplete = step.status === 'complete';
            const isCurrent = step.status === 'current';

            return (
              <div
                key={step.id}
                onClick={() => onNavigate(step.route)}
                className="flex flex-col items-center text-center space-y-2 relative z-10 cursor-pointer group flex-1"
              >
                {/* Node Dot */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-white text-slate-950 ring-4 ring-sky-500/20 font-bold scale-110 shadow-lg'
                      : 'bg-slate-900 border border-white/15 text-slate-500 group-hover:border-white/30'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>

                {/* Node Label & Subtext */}
                <div className="space-y-0.5 max-w-[90px]">
                  <span
                    className={`text-xs font-medium block truncate ${
                      isCurrent ? 'text-white font-semibold' : isComplete ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {step.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Phase Context (If initialized) */}
      {isInitialized && phases.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-sky-400 font-medium">Current Learning Phase:</span>
            <p className="text-slate-200 font-semibold">{phases[0]?.title}</p>
          </div>
          <button
            onClick={onViewFullRoadmap}
            className="text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Continue Phase Exercises</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
