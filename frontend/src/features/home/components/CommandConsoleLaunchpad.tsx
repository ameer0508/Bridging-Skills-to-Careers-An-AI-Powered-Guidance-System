import React from 'react';
import {
  FileText,
  Cpu,
  Target,
  Award,
  Briefcase,
  Video,
  ArrowUpRight,
} from 'lucide-react';

export interface CommandConsoleLaunchpadProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  matchScore: number | null;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

export const CommandConsoleLaunchpad: React.FC<CommandConsoleLaunchpadProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  matchScore,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const launchControls = [
    {
      id: 'resume',
      title: 'Resume Studio',
      status: hasResume ? 'ATS Parsed' : 'Upload Required',
      route: '/resume',
      shortcut: '⌘1',
      icon: FileText,
      accentColor: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/40',
      bgHover: 'hover:bg-cyan-950/20',
    },
    {
      id: 'skills',
      title: 'Skill Taxonomy Mesh',
      status: totalSkills > 0 ? `${totalSkills} Verified Vectors` : 'Awaiting Profile',
      route: '/skills',
      shortcut: '⌘2',
      icon: Cpu,
      accentColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/40',
      bgHover: 'hover:bg-emerald-950/20',
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      status: matchScore !== null ? `${matchScore}% Role Match` : 'Awaiting Verification',
      route: '/careers',
      shortcut: '⌘3',
      icon: Target,
      accentColor: 'text-blue-400',
      borderColor: 'hover:border-blue-500/40',
      bgHover: 'hover:bg-blue-950/20',
    },
    {
      id: 'readiness',
      title: 'Readiness Benchmarks',
      status: readinessScore !== null ? `${readinessScore}% Benchmark` : 'Unevaluated',
      route: '/readiness',
      shortcut: '⌘4',
      icon: Award,
      accentColor: 'text-purple-400',
      borderColor: 'hover:border-purple-500/40',
      bgHover: 'hover:bg-purple-950/20',
    },
    {
      id: 'opportunities',
      title: 'Live Opportunities',
      status: savedOpportunities > 0 ? `${savedOpportunities} Saved In Pipeline` : 'JSearch Live Radar',
      route: '/opportunities',
      shortcut: '⌘5',
      icon: Briefcase,
      accentColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/40',
      bgHover: 'hover:bg-amber-950/20',
    },
    {
      id: 'interview-agent',
      title: 'STAR Interview Studio',
      status: totalInterviews > 0 ? `${totalInterviews} Tracked Sessions` : 'Simulation Ready',
      route: '/interview-agent',
      shortcut: '⌘6',
      icon: Video,
      accentColor: 'text-rose-400',
      borderColor: 'hover:border-rose-500/40',
      bgHover: 'hover:bg-rose-950/20',
    },
  ];

  return (
    <div className="hcc-panel p-5 rounded-2xl border border-white/10 bg-[#0a0f1a]">
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Tactical Subsystem Launch Console</span>
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          Direct navigation to core AI intelligence engines
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {launchControls.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.route)}
              className={`p-3.5 rounded-xl bg-slate-950/70 border border-white/5 ${item.borderColor} ${item.bgHover} transition-all cursor-pointer group flex items-start justify-between`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 group-hover:text-white transition-colors">
                  <Icon className={`w-4 h-4 ${item.accentColor}`} />
                </div>
                <div className="space-y-0.5">
                  <h6 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors font-sans">
                    {item.title}
                  </h6>
                  <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[170px]">
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-[9px] font-mono font-bold text-slate-400">
                  {item.shortcut}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
