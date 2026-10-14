import React from 'react';
import {
  UserCheck,
  Compass,
  FileText,
  Cpu,
  Target,
  Layers,
  Briefcase,
  Send,
  Video,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface CareerJourneyProgressionTimelineProps {
  hasTargetRole: boolean;
  targetRole: string;
  primaryDomain: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore?: number | null;
  roadmapProgress: number;
  savedOpportunitiesCount: number;
  applicationsCount: number;
  interviewsCount: number;
  onNavigateNode?: (route: string) => void;
}

export const CareerJourneyProgressionTimeline: React.FC<CareerJourneyProgressionTimelineProps> = ({
  hasTargetRole,
  targetRole,
  primaryDomain,
  hasResume,
  totalSkills,
  readinessScore,
  roadmapProgress,
  savedOpportunitiesCount,
  applicationsCount,
  interviewsCount,
  onNavigateNode,
}) => {
  const isReadinessValid = typeof readinessScore === 'number' && readinessScore > 0;

  const steps = [
    {
      id: 'profile',
      label: 'IDENTITY',
      subtitle: 'Profile Active',
      icon: UserCheck,
      status: 'COMPLETED' as const,
      route: '/profile',
    },
    {
      id: 'target',
      label: 'CAREER TARGET',
      subtitle: hasTargetRole ? targetRole : 'Target Unset',
      icon: Compass,
      status: hasTargetRole ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/careers',
    },
    {
      id: 'resume',
      label: 'RESUME VAULT',
      subtitle: hasResume ? 'ATS Parsed' : 'Upload Needed',
      icon: FileText,
      status: hasResume ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/resume',
    },
    {
      id: 'skills',
      label: 'SKILL ENGINE',
      subtitle: totalSkills > 0 ? `${totalSkills} Verified` : 'No Skills Yet',
      icon: Cpu,
      status: totalSkills > 0 ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/skills',
    },
    {
      id: 'readiness',
      label: 'READINESS',
      subtitle: isReadinessValid ? `${readinessScore}% Score` : 'Unevaluated',
      icon: Target,
      status: isReadinessValid ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/readiness',
    },
    {
      id: 'roadmap',
      label: 'ROADMAP',
      subtitle: roadmapProgress > 0 ? `${roadmapProgress}% Complete` : 'Not Initialized',
      icon: Layers,
      status: roadmapProgress > 0 ? (roadmapProgress >= 100 ? ('COMPLETED' as const) : ('IN_PROGRESS' as const)) : ('NOT_STARTED' as const),
      route: '/roadmap',
    },
    {
      id: 'opportunities',
      label: 'OPPORTUNITIES',
      subtitle: savedOpportunitiesCount > 0 ? `${savedOpportunitiesCount} Saved` : 'Live Discovery',
      icon: Briefcase,
      status: savedOpportunitiesCount > 0 ? ('COMPLETED' as const) : ('ACTIVE' as const),
      route: '/opportunities',
    },
    {
      id: 'applications',
      label: 'APPLICATIONS',
      subtitle: applicationsCount > 0 ? `${applicationsCount} Tracking` : 'Pipeline Ready',
      icon: Send,
      status: applicationsCount > 0 ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/opportunities?tab=SAVED&status=applied',
    },
    {
      id: 'interviews',
      label: 'INTERVIEWS',
      subtitle: interviewsCount > 0 ? `${interviewsCount} Conducted` : 'STAR Studio',
      icon: Video,
      status: interviewsCount > 0 ? ('COMPLETED' as const) : ('NOT_STARTED' as const),
      route: '/interview-agent',
    },
    {
      id: 'outcome',
      label: 'CAREER OUTCOME',
      subtitle: 'Target Role Offer',
      icon: Award,
      status: 'ACTIVE' as const,
      route: '/opportunities',
    },
  ];

  const completedCount = steps.filter((s) => s.status === 'COMPLETED').length;
  const overallPercentage = Math.round((completedCount / steps.length) * 100);

  return (
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25">
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
              CAREER PIPELINE VISUALIZATION
            </span>
            <span className="text-xs text-aurora-muted font-mono">
              Domain: <strong className="text-aurora-violet">{primaryDomain || 'General'}</strong>
            </span>
          </div>
          <h3 className="text-base font-bold text-aurora-ink tracking-tight mt-1 flex items-center gap-2">
            End-to-End Personal Career Progression
          </h3>
        </div>

        <div className="flex items-center gap-3 bg-aurora-canvas/60 px-4 py-2 rounded-xl border border-aurora-line shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-aurora-muted block uppercase">Pipeline Completion</span>
            <strong className="text-sm text-emerald-700">{overallPercentage}% Complete</strong>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-200 bg-emerald-50 flex items-center justify-center font-bold text-xs text-emerald-700">
            {completedCount}/{steps.length}
          </div>
        </div>
      </div>

      {/* PROGRESS BAR TRACK */}
      <div className="w-full bg-aurora-canvas h-2 rounded-full overflow-hidden p-0.5 border border-aurora-line">
        <div
          className="bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-md"
          style={{ width: `${Math.max(10, overallPercentage)}%` }}
        />
      </div>

      {/* HORIZONTAL STEP NODES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'COMPLETED';
          const isInProgress = step.status === 'IN_PROGRESS';
          const isActive = step.status === 'ACTIVE';

          return (
            <div
              key={step.id}
              onClick={() => onNavigateNode && onNavigateNode(step.route)}
              className={`p-2.5 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer group hover:scale-[1.02] ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isInProgress
                  ? 'bg-violet-50 border-aurora-violet/25 text-aurora-indigo shadow-lg shadow-indigo-600/20'
                  : isActive
                  ? 'bg-cyan-50 border-aurora-violet/25 text-aurora-violet'
                  : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:text-aurora-muted'
              }`}
            >
              <div className="flex items-center justify-center">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isInProgress
                      ? 'bg-aurora-violet/[0.06] text-aurora-indigo border border-indigo-400/40 animate-pulse'
                      : isActive
                      ? 'bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25'
                      : 'bg-aurora-canvas text-aurora-muted border border-aurora-line'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <strong className="text-[10px] font-bold block truncate text-aurora-ink">
                {step.label}
              </strong>

              <span className="text-[9px] block truncate text-aurora-muted">
                {step.subtitle}
              </span>

              <div className="pt-1 flex items-center justify-center text-[9px] font-bold">
                {isCompleted ? (
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Done
                  </span>
                ) : isInProgress ? (
                  <span className="text-aurora-indigo flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 animate-spin" /> Active
                  </span>
                ) : (
                  <span className="text-aurora-muted flex items-center gap-0.5 group-hover:text-aurora-indigo">
                    View <ArrowRight className="w-2 h-2" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export default CareerJourneyProgressionTimeline;
