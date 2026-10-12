import React from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Compass,
  FileText,
  Layers,
  MessageSquare,
  Sparkles,
  Target,
  Activity,
} from 'lucide-react';

export interface EcosystemGatewayRibbonProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  matchScore: number | null;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

export const EcosystemGatewayRibbon: React.FC<EcosystemGatewayRibbonProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  matchScore,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const domains = [
    {
      title: 'Capability Architecture',
      caption: 'Foundational inputs & inventory',
      tools: [
        {
          id: 'resume',
          name: 'Resume Intelligence',
          status: hasResume ? 'Processed' : 'Needs Upload',
          route: '/resume',
          icon: FileText,
        },
        {
          id: 'skills',
          name: 'Competency Portfolio',
          status: `${totalSkills} Verified`,
          route: '/skills',
          icon: Layers,
        },
        {
          id: 'careers',
          name: 'Target Summit Alignment',
          status: matchScore !== null ? `${matchScore}% Match` : 'Uncalibrated',
          route: '/careers',
          icon: Target,
        },
      ],
    },
    {
      title: 'Strategy & Learning',
      caption: 'Trajectory & milestone progress',
      tools: [
        {
          id: 'readiness',
          name: 'Readiness Diagnostics',
          status: readinessScore !== null ? `${readinessScore}% Ready` : 'Evaluating',
          route: '/readiness',
          icon: Activity,
        },
        {
          id: 'roadmap',
          name: 'Adaptive Roadmap',
          status: 'Curriculum Active',
          route: '/roadmap',
          icon: Compass,
        },
        {
          id: 'analytics',
          name: 'Progression Analytics',
          status: 'Continuous',
          route: '/analytics',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Market & Placement',
      caption: 'Live pipeline & coaching',
      tools: [
        {
          id: 'opportunities',
          name: 'Opportunity Pipeline',
          status: `${savedOpportunities} Saved`,
          route: '/opportunities',
          icon: Briefcase,
        },
        {
          id: 'interview',
          name: 'Interview Simulator',
          status: `${totalInterviews} Sessions`,
          route: '/interview-agent',
          icon: MessageSquare,
        },
      ],
    },
  ];

  return (
    <section className="carto-surface p-8 sm:p-10 space-y-7 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Specialized Intelligence Engines</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Platform Capability Ecosystem
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-sm">
          Direct gateway into all 8 specialized career intelligence domains
        </p>
      </div>

      {/* 3 Domain Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {domains.map((domain) => (
          <div
            key={domain.title}
            className="p-6 rounded-2xl bg-white/[0.015] border border-white/[0.06] space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-1 pb-3 border-b border-white/[0.05]">
              <h3 className="text-sm font-semibold text-slate-200">{domain.title}</h3>
              <p className="text-xs text-slate-400">{domain.caption}</p>
            </div>

            <div className="space-y-2 flex-1">
              {domain.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => onNavigate(tool.route)}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/15 transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-amber-300 group-hover:bg-amber-500/10 transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors truncate">
                        {tool.name}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
                        {tool.status}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
