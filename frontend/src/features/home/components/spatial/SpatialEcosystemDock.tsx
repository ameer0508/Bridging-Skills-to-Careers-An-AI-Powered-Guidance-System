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
import { SpotlightSurface } from './SpotlightSurface';

export interface SpatialEcosystemDockProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

export const SpatialEcosystemDock: React.FC<SpatialEcosystemDockProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const sectors = [
    {
      category: 'Capability Architecture',
      modules: [
        {
          id: 'resume',
          title: 'Profile Intelligence',
          subtitle: hasResume ? 'Document active' : 'Resume awaiting',
          icon: FileText,
          route: '/resume',
        },
        {
          id: 'skills',
          title: 'Skill Portfolio',
          subtitle: `${totalSkills} verified nodes`,
          icon: Cpu,
          route: '/skills',
        },
        {
          id: 'readiness',
          title: 'Readiness Audit',
          subtitle: readinessScore !== null ? `${readinessScore}% alignment` : 'Audit pending',
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
          subtitle: 'Real-time telemetry',
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
          subtitle: `${savedOpportunities} tracked roles`,
          icon: Briefcase,
          route: '/opportunities',
        },
        {
          id: 'interview-agent',
          title: 'Mock Coaching',
          subtitle: `${totalInterviews} sessions completed`,
          icon: Video,
          route: '/interview-agent',
        },
      ],
    },
  ];

  return (
    <SpotlightSurface
      spotlightColor="rgba(255, 255, 255, 0.05)"
      spotlightRadius={400}
      className="p-6 sm:p-9 space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium tracking-wide">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrated Platform Architecture</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            Autonomous Ecosystem Dock
          </h3>
        </div>
        <span className="text-xs text-slate-400">8 Functional Gateways</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sectors.map((sector, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400/80 px-1">
              {sector.category}
            </span>

            <div className="space-y-2">
              {sector.modules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    onClick={() => onNavigate(mod.route)}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/15 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:text-amber-300 group-hover:border-amber-400/30 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
                          {mod.title}
                        </h4>
                        <p className="text-[10px] text-slate-400">{mod.subtitle}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SpotlightSurface>
  );
};
