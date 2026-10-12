import React from 'react';
import {
  FileText,
  Cpu,
  ShieldCheck,
  Compass,
  TrendingUp,
  Sparkles,
  Briefcase,
  Video,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

export interface SpatialCommandRailProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

export const SpatialCommandRail: React.FC<SpatialCommandRailProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const safeSkills = totalSkills || 0;
  const safeOpps = savedOpportunities || 0;
  const safeInterviews = totalInterviews || 0;

  const sectors = [
    {
      category: 'Capability Architecture',
      modules: [
        {
          id: 'resume',
          title: 'Profile Intelligence',
          subtitle: hasResume ? 'Document active' : 'Upload document',
          icon: FileText,
          route: '/resume',
        },
        {
          id: 'skills',
          title: 'Skill Portfolio',
          subtitle: `${safeSkills} verified nodes`,
          icon: Cpu,
          route: '/skills',
        },
        {
          id: 'readiness',
          title: 'Readiness Audit',
          subtitle: readinessScore !== null && readinessScore !== undefined ? `${readinessScore}% match` : 'Audit pending',
          icon: ShieldCheck,
          route: '/readiness',
        },
      ],
    },
    {
      category: 'Strategy & Growth',
      modules: [
        {
          id: 'roadmap',
          title: 'Curriculum Roadmap',
          subtitle: 'Adaptive milestones',
          icon: Compass,
          route: '/roadmap',
        },
        {
          id: 'careers',
          title: 'Market Pathways',
          subtitle: 'Taxonomy benchmark',
          icon: TrendingUp,
          route: '/careers',
        },
        {
          id: 'recommendations',
          title: 'AI Advisory',
          subtitle: 'Active directives',
          icon: Sparkles,
          route: '/recommendations',
        },
      ],
    },
    {
      category: 'Placement & Simulation',
      modules: [
        {
          id: 'opportunities',
          title: 'Opportunity Radar',
          subtitle: `${safeOpps} tracked roles`,
          icon: Briefcase,
          route: '/opportunities',
        },
        {
          id: 'interview-agent',
          title: 'Mock Coaching',
          subtitle: `${safeInterviews} sessions finished`,
          icon: Video,
          route: '/interview-agent',
        },
      ],
    },
  ];

  return (
    <div className="spatial-glass-blade p-7 sm:p-10 space-y-7">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold tracking-wide">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Platform Capabilities</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Autonomous Ecosystem Dock
          </h3>
        </div>
        <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
          8 Subsystem Gateways
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sectors.map((sector, sIdx) => (
          <div key={sIdx} className="space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400/90 px-1">
              {sector.category}
            </span>

            <div className="space-y-2.5">
              {sector.modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    onClick={() => onNavigate(mod.route)}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.05] hover:border-amber-400/40 transition-all flex items-center justify-between cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:text-amber-300 group-hover:border-amber-400/40 transition-colors shadow-inner">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                          {mod.title}
                        </h4>
                        <p className="text-[11px] text-slate-400">{mod.subtitle}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
