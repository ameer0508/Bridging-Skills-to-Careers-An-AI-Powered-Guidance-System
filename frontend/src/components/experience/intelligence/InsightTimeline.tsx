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
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'readiness':
        return <TrendingUp className="w-4 h-4 text-aurora-indigo" />;
      case 'recommendation':
        return <Sparkles className="w-4 h-4 text-aurora-violet" />;
      default:
        return <Award className="w-4 h-4 text-sky-800" />;
    }
  };

  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-aurora-violet/[0.06] text-aurora-indigo">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Insight Timeline</h3>
            <p className="text-xs text-aurora-muted">
              Chronological AI observations and telemetry log
            </p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 border-l border-aurora-line my-2">
        {defaultEvents.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Dot Icon */}
            <div className="absolute -left-7.75 top-0.5 p-1 rounded-full bg-aurora-canvas/60 border border-aurora-line">

              {getEventIcon(event.type)}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-aurora-ink">{event.title}</h4>
                <span className="text-[10px] text-aurora-muted">{event.timestamp}</span>
              </div>
              {event.description && (
                <p className="text-xs text-aurora-muted">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default InsightTimeline;
