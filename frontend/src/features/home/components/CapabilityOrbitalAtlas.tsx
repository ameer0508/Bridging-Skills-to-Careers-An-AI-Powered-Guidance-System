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

export interface CapabilityOrbitalAtlasProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  matchScore: number | null;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}


export const CapabilityOrbitalAtlas: React.FC<CapabilityOrbitalAtlasProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  matchScore,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const clusters = [
    {
      name: 'Profile & Capability Core',
      description: 'Foundational inputs and verified skill profile',
      nodes: [
        {
          id: 'resume',
          title: 'Resume Intelligence',
          subtitle: 'Semantic parsing & experience extraction',
          route: '/resume',
          statusText: hasResume ? 'Profile Active' : 'Awaiting Upload',
          icon: FileText,
        },
        {
          id: 'skills',
          title: 'Competency Portfolio',
          subtitle: 'Audited skills & gap analysis',
          route: '/skills',
          statusText: `${totalSkills} Verified`,
          icon: Layers,
        },
        {
          id: 'careers',
          title: 'Target Role Alignment',
          subtitle: 'Industry benchmark comparison',
          route: '/careers',
          statusText: matchScore !== null ? `${matchScore}% Match` : 'Uncalibrated',
          icon: Target,
        },
      ],
    },
    {
      name: 'Strategy & Learning Trajectory',
      description: 'Dynamic diagnostics, milestones, and progress',
      nodes: [
        {
          id: 'readiness',
          title: 'Readiness Diagnostics',
          subtitle: 'Multi-dimensional readiness benchmark',
          route: '/readiness',
          statusText: readinessScore !== null ? `${readinessScore}% Ready` : 'Evaluating',
          icon: Activity,
        },
        {
          id: 'roadmap',
          title: 'Adaptive Learning Roadmap',
          subtitle: 'Phased curriculum & capstone projects',
          route: '/roadmap',
          statusText: 'Curriculum Plan',
          icon: Compass,
        },
        {
          id: 'analytics',
          title: 'Progression Analytics',
          subtitle: 'Growth velocity & benchmark history',
          route: '/analytics',
          statusText: 'Active Tracking',
          icon: BarChart3,
        },
      ],
    },
    {
      name: 'Market Radar & Placement',
      description: 'Active opportunities and interview readiness',
      nodes: [
        {
          id: 'opportunities',
          title: 'Opportunity Pipeline',
          subtitle: 'Matched job openings & application funnel',
          route: '/opportunities',
          statusText: `${savedOpportunities} Saved`,
          icon: Briefcase,
        },
        {
          id: 'interview',
          title: 'Interview Simulator',
          subtitle: 'AI technical & behavioral coaching',
          route: '/interview-agent',
          statusText: `${totalInterviews} Sessions`,
          icon: MessageSquare,
        },
      ],
    },
  ];

  return (
    <section className="atelier-glass-card p-6 sm:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight font-display">
            Career Intelligence Ecosystem
          </h3>
        </div>
        <p className="text-xs text-slate-400 max-w-sm">
          Seamless navigation across all 8 intelligence domains
        </p>
      </div>

      {/* 3 Unified Functional Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clusters.map((cluster) => (
          <div
            key={cluster.name}
            className="p-5 rounded-2xl bg-white/[0.015] border border-white/5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-1 pb-3 border-b border-white/5">
              <h4 className="text-sm font-semibold text-slate-200">{cluster.name}</h4>
              <p className="text-xs text-slate-400">{cluster.description}</p>
            </div>

            <div className="space-y-2.5 flex-1">
              {cluster.nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    onClick={() => onNavigate(node.route)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-sky-300 group-hover:bg-sky-500/10 transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                          {node.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {node.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium">
                        {node.statusText}
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
