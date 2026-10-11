import React from 'react';
import {
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

export interface QuantumTrajectorySpineProps {
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

export const QuantumTrajectorySpine: React.FC<QuantumTrajectorySpineProps> = ({
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
  const stations = [
    {
      id: 'profile',
      index: '01',
      title: 'Identity',
      status: 'Verified',
      route: '/profile',
      icon: UserCheck,
      isComplete: true,
      isActive: false,
    },
    {
      id: 'target',
      index: '02',
      title: 'Target',
      status: hasTargetRole ? 'Locked' : 'Select Role',
      route: '/careers',
      icon: Target,
      isComplete: hasTargetRole,
      isActive: !hasTargetRole,
    },
    {
      id: 'resume',
      index: '03',
      title: 'Resume Vault',
      status: hasResume ? 'ATS Parsed' : 'Required',
      route: '/resume',
      icon: FileText,
      isComplete: hasResume,
      isActive: !hasResume,
    },
    {
      id: 'skills',
      index: '04',
      title: 'Skill Engine',
      status: totalSkills > 0 ? `${totalSkills} Vectors` : 'Standby',
      route: '/skills',
      icon: Cpu,
      isComplete: totalSkills > 0,
      isActive: hasResume && totalSkills === 0,
    },
    {
      id: 'readiness',
      index: '05',
      title: 'Readiness',
      status: readinessScore !== null ? `${readinessScore}% Score` : 'Unevaluated',
      route: '/readiness',
      icon: Award,
      isComplete: readinessScore !== null,
      isActive: totalSkills > 0 && readinessScore === null,
    },
    {
      id: 'roadmap',
      index: '06',
      title: 'Roadmap',
      status: roadmapProgress > 0 ? `${roadmapProgress}% Active` : 'Standby',
      route: '/roadmap',
      icon: Layers,
      isComplete: roadmapProgress >= 100,
      isActive: roadmapProgress > 0 && roadmapProgress < 100,
    },
    {
      id: 'opportunities',
      index: '07',
      title: 'Opportunities',
      status: savedOpportunitiesCount > 0 ? `${savedOpportunitiesCount} Saved` : 'Live Feed',
      route: '/opportunities',
      icon: Briefcase,
      isComplete: savedOpportunitiesCount > 0,
      isActive: false,
    },
    {
      id: 'applications',
      index: '08',
      title: 'Pipeline',
      status: applicationsCount > 0 ? `${applicationsCount} Tracking` : 'Standby',
      route: '/opportunities?tab=SAVED&status=applied',
      icon: Send,
      isComplete: applicationsCount > 0,
      isActive: false,
    },
    {
      id: 'interviews',
      index: '09',
      title: 'STAR Studio',
      status: interviewsCount > 0 ? `${interviewsCount} Sessions` : 'Available',
      route: '/interview-agent',
      icon: Video,
      isComplete: interviewsCount > 0,
      isActive: false,
    },
    {
      id: 'outcome',
      index: '10',
      title: 'Career Outcome',
      status: targetRole && totalSkills > 5 && readinessScore !== null && readinessScore >= 70 ? 'Aligned' : 'In Flight',
      route: '/careers',
      icon: CheckCircle2,
      isComplete: Boolean(targetRole && totalSkills > 5 && readinessScore !== null && readinessScore >= 70),
      isActive: false,
    },
  ];

  return (
    <div className="hcc-monolith p-5 rounded-3xl border border-white/10 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-bold text-slate-300 uppercase tracking-widest text-[11px]">
            Quantum Career Trajectory Spine
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          Continuous 10-Stage Career Intelligence Flight Path
        </span>
      </div>

      {/* CONTINUOUS TRAJECTORY VECTOR GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {stations.map((station) => {
          const Icon = station.icon;
          return (
            <div
              key={station.id}
              onClick={() => onNavigate(station.route)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                station.isComplete
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60'
                  : station.isActive
                  ? 'bg-cyan-950/30 border-cyan-500/50 hover:border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono font-black text-slate-500 group-hover:text-slate-300 transition-colors">
                  {station.index}
                </span>
                {station.isComplete ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ) : station.isActive ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      station.isComplete
                        ? 'text-emerald-400'
                        : station.isActive
                        ? 'text-cyan-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-200 truncate font-sans">
                    {station.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate block">
                  {station.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
