import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Compass,
  FileText,
  Layers,
  MessageSquare,
  Target,
} from 'lucide-react';

export interface NeuralSubsystemLaunchpadProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  matchScore: number | null;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

interface SubsystemModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  statusBadge: string;
  accentColor: string;
  glowBg: string;
}

export const NeuralSubsystemLaunchpad: React.FC<NeuralSubsystemLaunchpadProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  matchScore,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const modules: SubsystemModule[] = [
    {
      id: 'resume',
      title: 'Resume Intelligence',
      description: 'ATS scoring, semantic parsing, and capability vector extraction.',
      icon: FileText,
      route: '/resume',
      statusBadge: hasResume ? 'Document Active' : 'Upload Required',
      accentColor: 'text-indigo-400',
      glowBg: 'bg-indigo-500/10',
    },
    {
      id: 'skills',
      title: 'Competency Matrix',
      description: 'Audited skill inventory, verified strengths, and critical gap taxonomy.',
      icon: Layers,
      route: '/skills',
      statusBadge: `${totalSkills} Audited`,
      accentColor: 'text-cyan-400',
      glowBg: 'bg-cyan-500/10',
    },
    {
      id: 'careers',
      title: 'Target Path Alignment',
      description: 'High-dimensional role vector matching and market trajectory calibration.',
      icon: Target,
      route: '/careers',
      statusBadge: matchScore !== null ? `${matchScore}% Match` : 'Awaiting Match',
      accentColor: 'text-purple-400',
      glowBg: 'bg-purple-500/10',
    },
    {
      id: 'readiness',
      title: 'Readiness Diagnostics',
      description: 'Comprehensive capability benchmark across 4 readiness dimensions.',
      icon: Activity,
      route: '/readiness',
      statusBadge: readinessScore !== null ? `${readinessScore}% Ready` : 'Baseline',
      accentColor: 'text-emerald-400',
      glowBg: 'bg-emerald-500/10',
    },
    {
      id: 'roadmap',
      title: 'Adaptive Learning Roadmap',
      description: 'Dynamic phase-by-phase learning modules, project goals, and milestones.',
      icon: Compass,
      route: '/roadmap',
      statusBadge: 'Curriculum Track',
      accentColor: 'text-violet-400',
      glowBg: 'bg-violet-500/10',
    },
    {
      id: 'opportunities',
      title: 'Opportunity Pipeline',
      description: 'Live job market radar with semantic skill-matching and application tracking.',
      icon: Briefcase,
      route: '/opportunities',
      statusBadge: `${savedOpportunities} Saved`,
      accentColor: 'text-amber-400',
      glowBg: 'bg-amber-500/10',
    },
    {
      id: 'interview',
      title: 'Interview Simulator',
      description: 'Interactive AI mock interview sessions with real-time response telemetry.',
      icon: MessageSquare,
      route: '/interview-agent',
      statusBadge: `${totalInterviews} Sessions`,
      accentColor: 'text-rose-400',
      glowBg: 'bg-rose-500/10',
    },
    {
      id: 'analytics',
      title: 'Progression Telemetry',
      description: 'Long-term readiness time series, percentile benchmarks, and skill velocity.',
      icon: BarChart3,
      route: '/analytics',
      statusBadge: 'Biometrics Active',
      accentColor: 'text-blue-400',
      glowBg: 'bg-blue-500/10',
    },
  ];

  return (
    <section className="quantum-glass-panel p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold font-display text-white tracking-tight">
            Neural Subsystem Matrix
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Direct Access to Core Career Intelligence Engines
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
          8 Subsystems Calibrated
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => onNavigate(mod.route)}
              className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${mod.glowBg} border border-white/10 flex items-center justify-center ${mod.accentColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-medium">
                  {mod.statusBadge}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white font-display group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>{mod.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {mod.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
