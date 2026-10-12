import React from 'react';
import { ArrowUpRight, Check, Compass, Sparkles, CheckCircle2, Circle } from 'lucide-react';

export interface RoadmapTrajectorySpineProps {
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

interface MilestoneStep {
  id: string;
  number: number;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  subtext: string;
  route: string;
}

export const RoadmapTrajectorySpine: React.FC<RoadmapTrajectorySpineProps> = ({
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
  const milestones: MilestoneStep[] = React.useMemo(() => {
    const list: Omit<MilestoneStep, 'status'>[] = [
      { id: 'profile', number: 1, label: 'Profile', subtext: 'Preferences', route: '/profile' },
      { id: 'resume', number: 2, label: 'Resume', subtext: hasResume ? 'Uploaded' : 'Pending', route: '/resume' },
      { id: 'skills', number: 3, label: 'Skills', subtext: totalSkills > 0 ? `${totalSkills} nodes` : 'None', route: '/skills' },
      { id: 'role', number: 4, label: 'Target Track', subtext: hasTargetRole && targetRole ? targetRole : 'Select Role', route: '/careers' },
      { id: 'readiness', number: 5, label: 'Readiness', subtext: readinessScore ? `${readinessScore}%` : 'Pending', route: '/readiness' },
      { id: 'roadmap', number: 6, label: 'Roadmap', subtext: `${roadmapProgress}% done`, route: '/roadmap' },
      { id: 'opportunities', number: 7, label: 'Opportunities', subtext: `${savedOpportunitiesCount} saved`, route: '/opportunities' },
      { id: 'applications', number: 8, label: 'Applications', subtext: `${applicationsCount} active`, route: '/opportunities' },
      { id: 'interviews', number: 9, label: 'Interviews', subtext: `${interviewsCount} sessions`, route: '/interview-agent' },
      { id: 'outcome', number: 10, label: 'Career Offer', subtext: 'Target', route: '/analytics' },
    ];

    const completedFlags = [
      true,
      hasResume,
      totalSkills > 0,
      hasTargetRole,
      readinessScore !== null && readinessScore > 0,
      roadmapProgress > 0,
      savedOpportunitiesCount > 0,
      applicationsCount > 0,
      interviewsCount > 0,
      false,
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
    <section className="quantum-glass-panel p-6 sm:p-7 space-y-7">
      {/* 1. HORIZONTAL 10-STAGE CAREER PROGRESSION SPINE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white tracking-tight">
                Career Trajectory Horizon
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Stage {completedCount + 1} of 10 • {completedCount * 10}% End-to-End Progression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold">
              {completedCount}/10 Stages Complete
            </span>
          </div>
        </div>

        {/* 10-NODE HORIZONTAL SPINE SCROLLER */}
        <div className="overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center min-w-[760px] justify-between relative px-2">
            {milestones.map((ms) => {
              const isComplete = ms.status === 'complete';
              const isCurrent = ms.status === 'current';

              return (
                <div
                  key={ms.id}
                  onClick={() => onNavigate(ms.route)}
                  className="flex flex-col items-center text-center cursor-pointer group transition-all relative z-10"
                  style={{ width: `${100 / milestones.length}%` }}
                >
                  {/* Node Circle */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                      isComplete
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 group-hover:scale-110'
                        : isCurrent
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/30 scale-110 animate-pulse'
                        : 'bg-slate-900 border border-white/10 text-slate-500 group-hover:border-white/20 group-hover:text-slate-400'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4 text-emerald-400" /> : ms.number}
                  </div>

                  {/* Node Label & Subtext */}
                  <div className="mt-2 space-y-0.5">
                    <span
                      className={`text-xs font-bold block truncate max-w-[75px] ${
                        isComplete
                          ? 'text-slate-200'
                          : isCurrent
                          ? 'text-cyan-300'
                          : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {ms.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[75px]">
                      {ms.subtext}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. ACTIVE LEARNING ROADMAP BLUEPRINT */}
      <div className="pt-4 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white font-display">Active Skill Mastery Roadmap</h4>
            <p className="text-xs text-slate-400 font-mono">
              Targeted Curriculum for {targetRole || 'Current Career Path'}
            </p>
          </div>
          <button
            onClick={onViewFullRoadmap}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer group"
          >
            <span>Launch Roadmap</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {!isInitialized || phases.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3 rounded-xl bg-slate-950/40 border border-white/5">
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Synthesize a tailored milestone learning plan that bridges your capabilities to {targetRole || 'your goal'}.
            </p>
            <button
              onClick={onViewFullRoadmap}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesize Career Roadmap</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Roadmap Completion Vector</span>
                <span className="text-purple-300 font-bold">{roadmapProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-700 shadow-md shadow-purple-500/20"
                  style={{ width: `${Math.max(5, Math.min(100, roadmapProgress))}%` }}
                />
              </div>
            </div>

            {/* Upcoming Phase Peek */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {phases.slice(0, 2).map((phase, idx) => (
                <div
                  key={phase.title || idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                      Phase {idx + 1}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Active Focus
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{phase.title}</h5>
                  {phase.items && phase.items.length > 0 && (
                    <div className="space-y-1 text-[11px] text-slate-400">
                      {phase.items.slice(0, 2).map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-1.5 truncate">
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-600 shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
