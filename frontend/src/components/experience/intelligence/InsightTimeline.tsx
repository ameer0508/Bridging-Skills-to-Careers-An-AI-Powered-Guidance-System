import React from 'react';
import { History, TrendingUp, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';

export interface InsightTimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: 'milestone' | 'readiness' | 'recommendation' | 'skill';
}

export interface InsightTimelineProps {
  events?: InsightTimelineEvent[];
  className?: string;
}

export const InsightTimeline: React.FC<InsightTimelineProps> = ({
  events = [],
  className = '',
}) => {
  const defaultEvents: InsightTimelineEvent[] = events.length > 0 ? events : [
    {
      id: '1',
      title: 'AI Career Workspace Synchronized',
      description: 'Profile skill graph initialized and readiness models evaluated.',
      timestamp: 'Today',
      type: 'readiness',
    },
    {
      id: '2',
      title: 'Skill Taxonomy Evaluation Active',
      description: 'Career matches computed against target market taxonomies.',
      timestamp: 'Session Started',
      type: 'skill',
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'milestone':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'readiness':
        return <TrendingUp className="w-4 h-4 text-indigo-400" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Award className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Insight Timeline</h3>
            <p className="text-xs text-neutral-400">
              Chronological AI observations and telemetry log
            </p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 border-l border-white/10 my-2">
        {defaultEvents.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Dot Icon */}
            <div className="absolute -left-7.75 top-0.5 p-1 rounded-full bg-neutral-900 border border-white/20">

              {getEventIcon(event.type)}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{event.title}</h4>
                <span className="text-[10px] font-mono text-neutral-400">{event.timestamp}</span>
              </div>
              {event.description && (
                <p className="text-xs text-neutral-300">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default InsightTimeline;
