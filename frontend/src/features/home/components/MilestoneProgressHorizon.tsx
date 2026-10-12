import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface MilestoneProgressHorizonProps {
  hasTargetRole: boolean;
  targetRole: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  savedOpportunitiesCount: number;
  applicationsCount: number;
  interviewsCount: number;
  onNavigate: (route: string) => void;
}

interface MilestoneStep {
  id: string;
  number: number;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  subtext: string;
  route: string;
}

export const MilestoneProgressHorizon: React.FC<MilestoneProgressHorizonProps> = ({
  hasTargetRole,
  targetRole,
  hasResume,
  totalSkills,
  readinessScore,
  roadmapProgress,
  savedOpportunitiesCount,
  applicationsCount,
  interviewsCount,
  onNavigate,
}) => {
  // Compute milestones sequentially
  const milestones: MilestoneStep[] = React.useMemo(() => {
    const list: Omit<MilestoneStep, 'status'>[] = [
      { id: 'profile', number: 1, label: 'Profile', subtext: 'Preferences', route: '/profile' },
      { id: 'resume', number: 2, label: 'Resume', subtext: hasResume ? 'Uploaded' : 'Pending', route: '/resume' },
      { id: 'skills', number: 3, label: 'Skills', subtext: totalSkills > 0 ? `${totalSkills} extracted` : 'None', route: '/skills' },
      { id: 'role', number: 4, label: 'Target Role', subtext: hasTargetRole && targetRole ? targetRole : (hasTargetRole ? 'Aligned' : 'Pending'), route: '/careers' },
      { id: 'readiness', number: 5, label: 'Readiness', subtext: readinessScore ? `${readinessScore}%` : 'Not run', route: '/readiness' },
      { id: 'roadmap', number: 6, label: 'Roadmap', subtext: `${roadmapProgress}% done`, route: '/roadmap' },
      { id: 'opportunities', number: 7, label: 'Opportunities', subtext: `${savedOpportunitiesCount} saved`, route: '/opportunities' },
      { id: 'applications', number: 8, label: 'Applications', subtext: `${applicationsCount} active`, route: '/opportunities' },
      { id: 'interviews', number: 9, label: 'Interviews', subtext: `${interviewsCount} sessions`, route: '/interview-agent' },
      { id: 'outcome', number: 10, label: 'Career Offer', subtext: 'Target', route: '/analytics' },
    ];

    // Determine completion states sequentially
    const completedFlags = [
      true, // Profile assumed active
      hasResume,
      totalSkills > 0,
      hasTargetRole,
      readinessScore !== null && readinessScore > 0,
      roadmapProgress > 0,
      savedOpportunitiesCount > 0,
      applicationsCount > 0,
      interviewsCount > 0,
      false, // Final outcome
    ];

    let firstIncompleteFound = false;

    return list.map((step, idx) => {
      if (completedFlags[idx]) {
        return { ...step, status: 'complete' as const };
      }
      if (!firstIncompleteFound) {
        firstIncompleteFound = true;
        return { ...step, status: 'current' as const };
      }
      return { ...step, status: 'upcoming' as const };
    });
  }, [
    hasResume,
    totalSkills,
    hasTargetRole,
    targetRole,
    readinessScore,
    roadmapProgress,
    savedOpportunitiesCount,
    applicationsCount,
    interviewsCount,
  ]);

  const completedCount = milestones.filter((m) => m.status === 'complete').length;

  return (
    <section className="editorial-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="editorial-tag">Career Milestones</span>
          <span className="text-xs text-slate-400">
            ({completedCount} of 10 Completed)
          </span>
        </div>
        <button
          onClick={() => onNavigate('/roadmap')}
          className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View progression details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Milestone Tracker */}
      <div className="relative">
        <div className="overflow-x-auto no-scrollbar pb-2 pt-1 touch-pan-x">
          <div className="flex items-center min-w-[760px] justify-between relative">
            {/* Subtle connecting line */}
            <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-800 -z-0" />

            {milestones.map((step) => {
              const isComplete = step.status === 'complete';
              const isCurrent = step.status === 'current';

              return (
                <div
                  key={step.id}
                  onClick={() => onNavigate(step.route)}
                  className="relative z-10 flex flex-col items-center text-center cursor-pointer group px-2"
                  style={{ flex: 1 }}
                >
                  {/* Step Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                      isComplete
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 font-bold ring-4 ring-amber-500/20'
                        : 'bg-slate-900 text-slate-500 border border-slate-700/60 group-hover:border-slate-500'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`mt-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isCurrent
                        ? 'text-amber-400 font-semibold'
                        : isComplete
                        ? 'text-slate-200'
                        : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Step Subtext */}
                  <span className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap max-w-[85px] truncate">
                    {step.subtext}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subtle Right Fade Gradient for Mobile/Small Screens */}
        <div className="lg:hidden absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-900/90 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
