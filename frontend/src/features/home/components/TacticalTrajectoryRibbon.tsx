import React from 'react';
import {
  Zap,
  ArrowRight,
  UserCheck,
  Target,
  FileText,
  Cpu,
  Award,
  Layers,
  Briefcase,
  Send,
  Video,
  CheckCircle2,
} from 'lucide-react';

export interface NextBestActionInfo {
  action: string;
  title: string;
  subtitle: string;
  route: string;
  actionLabel: string;
  badge: string;
}

export interface TacticalTrajectoryRibbonProps {
  nextBestAction: NextBestActionInfo;
  hasTargetRole: boolean;
  targetRole: string;
  primaryDomain: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  savedOpportunitiesCount: number;
  applicationsCount: number;
  interviewsCount: number;
  onNavigate: (route: string) => void;
}

export const TacticalTrajectoryRibbon: React.FC<TacticalTrajectoryRibbonProps> = ({
  nextBestAction,
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
  // 10-Stage Canonical Flight-Plan Definitions
  const stages = [
    {
      id: 'profile',
      number: '01',
      label: 'Identity',
      sublabel: 'Profile Active',
      route: '/profile',
      icon: UserCheck,
      isCompleted: true,
      isInProgress: false,
    },
    {
      id: 'target',
      number: '02',
      label: 'Target',
      sublabel: hasTargetRole ? 'Target Locked' : 'Select Target',
      route: '/careers',
      icon: Target,
      isCompleted: hasTargetRole,
      isInProgress: !hasTargetRole,
    },
    {
      id: 'resume',
      number: '03',
      label: 'Resume',
      sublabel: hasResume ? 'ATS Parsed' : 'Upload Required',
      route: '/resume',
      icon: FileText,
      isCompleted: hasResume,
      isInProgress: !hasResume,
    },
    {
      id: 'skills',
      number: '04',
      label: 'Skills',
      sublabel: totalSkills > 0 ? `${totalSkills} Verified` : 'No Skills',
      route: '/skills',
      icon: Cpu,
      isCompleted: totalSkills > 0,
      isInProgress: hasResume && totalSkills === 0,
    },
    {
      id: 'readiness',
      number: '05',
      label: 'Readiness',
      sublabel: readinessScore !== null ? `${readinessScore}% Evaluated` : 'Unevaluated',
      route: '/readiness',
      icon: Award,
      isCompleted: readinessScore !== null,
      isInProgress: totalSkills > 0 && readinessScore === null,
    },
    {
      id: 'roadmap',
      number: '06',
      label: 'Roadmap',
      sublabel: roadmapProgress > 0 ? `${roadmapProgress}% Progress` : 'Standby',
      route: '/roadmap',
      icon: Layers,
      isCompleted: roadmapProgress >= 100,
      isInProgress: roadmapProgress > 0 && roadmapProgress < 100,
    },
    {
      id: 'opportunities',
      number: '07',
      label: 'Discovery',
      sublabel: savedOpportunitiesCount > 0 ? `${savedOpportunitiesCount} Saved` : 'Live Radar',
      route: '/opportunities',
      icon: Briefcase,
      isCompleted: savedOpportunitiesCount > 0,
      isInProgress: false,
    },
    {
      id: 'applications',
      number: '08',
      label: 'Pipeline',
      sublabel: applicationsCount > 0 ? `${applicationsCount} Applied` : 'Ready',
      route: '/opportunities?tab=SAVED&status=applied',
      icon: Send,
      isCompleted: applicationsCount > 0,
      isInProgress: false,
    },
    {
      id: 'interviews',
      number: '09',
      label: 'STAR Studio',
      sublabel: interviewsCount > 0 ? `${interviewsCount} Sessions` : 'Available',
      route: '/interview-agent',
      icon: Video,
      isCompleted: interviewsCount > 0,
      isInProgress: false,
    },
    {
      id: 'outcome',
      number: '10',
      label: 'Outcome',
      sublabel: targetRole ? 'Target Aligned' : 'Deployable',
      route: '/careers',
      icon: CheckCircle2,
      isCompleted: Boolean(targetRole && totalSkills > 5 && readinessScore !== null && readinessScore >= 70),
      isInProgress: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* TACTICAL NEXT BEST ACTION DOSSIER */}
      <div className="hcc-panel p-5 rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-950/20 via-[#0e1524] to-[#090d16] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                {nextBestAction.badge}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Real-Time Career Intelligence Directive
              </span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              {nextBestAction.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {nextBestAction.subtitle}
            </p>
          </div>

          <button
            onClick={() => onNavigate(nextBestAction.route)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0 transition-all font-mono"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 10-STAGE CAREER FLIGHT-PLAN RIBBON */}
      <div className="hcc-panel p-4 rounded-2xl border border-white/5 bg-[#090e18]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>10-Stage Career Trajectory Vector</span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Click any checkpoint to jump directly to subsystem
          </span>
        </div>

        {/* HORIZONTAL CHECKPOINT GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                onClick={() => onNavigate(stage.route)}
                className={`hcc-trajectory-node p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  stage.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                    : stage.isInProgress
                    ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-500/70'
                    : 'bg-slate-950/50 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-500">
                    {stage.number}
                  </span>
                  {stage.isCompleted ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ) : stage.isInProgress ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        stage.isCompleted
                          ? 'text-emerald-400'
                          : stage.isInProgress
                          ? 'text-cyan-400'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 truncate block">
                    {stage.sublabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
