import React from 'react';
import { Award, Compass, Cpu, Layers } from 'lucide-react';

interface MetricItem {
  title: string;
  value: string | number;
  suffix?: string;
  subtext: string;
  icon: React.ElementType;
  route: string;
}

interface CareerOSMetricGridProps {
  readinessScore?: number;
  matchScore?: number;
  totalSkills?: number;
  milestoneProgress?: number;
  onNavigate?: (route: string) => void;
}

export const CareerOSMetricGrid: React.FC<CareerOSMetricGridProps> = ({
  readinessScore,
  matchScore,
  totalSkills = 0,
  milestoneProgress,
  onNavigate,
}) => {
  const metrics: MetricItem[] = [
    {
      title: 'Career Readiness Score',
      value: readinessScore !== undefined ? readinessScore : 'Pending',
      suffix: readinessScore !== undefined ? '%' : undefined,
      subtext: readinessScore !== undefined ? 'Verified Readiness Rating' : 'Upload Resume to Evaluate',
      icon: Award,
      route: '/readiness',
    },
    {
      title: 'Target Path Match Rate',
      value: matchScore !== undefined ? matchScore : 'Pending',
      suffix: matchScore !== undefined ? '%' : undefined,
      subtext: matchScore !== undefined ? 'AI Vector Alignment' : 'Select Target Path',
      icon: Compass,
      route: '/careers',
    },
    {
      title: 'Extracted Skill Nodes',
      value: totalSkills,
      suffix: 'Skills',
      subtext: totalSkills > 0 ? 'Verified In Profile' : 'No Skills Extracted Yet',
      icon: Cpu,
      route: '/skills',
    },
    {
      title: 'Active Roadmap Completion',
      value: milestoneProgress !== undefined ? milestoneProgress : 0,
      suffix: '%',
      subtext: milestoneProgress !== undefined ? 'Active Blueprint Progress' : 'No Active Roadmap',
      icon: Layers,
      route: '/roadmap',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((item, idx) => {
        const Icon = item.icon;

        return (
          <div
            key={idx}
            onClick={() => onNavigate && onNavigate(item.route)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl p-5 hover:border-indigo-500/40 transition-all duration-300 shadow-lg flex flex-col justify-between space-y-3 cursor-pointer hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {item.title}
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                {item.value}
              </span>
              {item.suffix && (
                <span className="font-display text-base font-bold text-slate-400">
                  {item.suffix}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>{item.subtext}</span>
              <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">View →</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CareerOSMetricGrid;
