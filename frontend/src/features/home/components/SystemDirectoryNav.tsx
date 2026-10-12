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

interface SystemDirectoryNavProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  matchScore: number | null;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
}

interface DirectoryModule {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  statusBadge: string;
}

export const SystemDirectoryNav: React.FC<SystemDirectoryNavProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  matchScore,
  readinessScore,
  savedOpportunities,
  totalInterviews,
}) => {
  const modules: DirectoryModule[] = [
    {
      title: 'Resume Intelligence',
      description: 'Upload, parse, and verify ATS compatibility and candidate profile data.',
      icon: FileText,
      route: '/resume',
      statusBadge: hasResume ? 'Document Active' : 'Action Required',
    },
    {
      title: 'Competency Matrix',
      description: 'Audit verified skill vectors, identify gaps, and inspect role prerequisites.',
      icon: Layers,
      route: '/skills',
      statusBadge: `${totalSkills} Skills`,
    },
    {
      title: 'Target Role Alignment',
      description: 'Explore market career tracks and evaluate semantic vector match scores.',
      icon: Target,
      route: '/careers',
      statusBadge: matchScore !== null ? `${matchScore}% Match` : 'Awaiting Match',
    },
    {
      title: 'Readiness Diagnostic',
      description: 'Multi-dimensional readiness breakdown across all target role criteria.',
      icon: Activity,
      route: '/readiness',
      statusBadge: readinessScore !== null ? `${readinessScore}% Ready` : 'Baseline',
    },
    {
      title: 'Learning Roadmap',
      description: 'Sequential milestones, project modules, and curated learning resources.',
      icon: Compass,
      route: '/roadmap',
      statusBadge: 'Roadmap Track',
    },
    {
      title: 'Opportunity Pipeline',
      description: 'Discover live market opportunities matched directly to your capabilities.',
      icon: Briefcase,
      route: '/opportunities',
      statusBadge: `${savedOpportunities} Saved`,
    },
    {
      title: 'Interview Studio',
      description: 'Practice interactive AI technical and behavioral mock interview sessions.',
      icon: MessageSquare,
      route: '/interview-agent',
      statusBadge: `${totalInterviews} Completed`,
    },
    {
      title: 'Career Analytics',
      description: 'Long-term readiness trajectories, peer benchmarks, and telemetry history.',
      icon: BarChart3,
      route: '/analytics',
      statusBadge: 'Biometrics Active',
    },
  ];

  return (
    <section className="editorial-card p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between pb-3 hairline-divider">
        <span className="editorial-tag text-slate-200">System Directory</span>
        <span className="text-xs text-slate-400">8 Integrated Intelligence Modules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.route}
              onClick={() => onNavigate(m.route)}
              className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800/60 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-md bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700 font-medium">
                    {m.statusBadge}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {m.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="pt-2 hairline-divider flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
                <span>Access module</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
