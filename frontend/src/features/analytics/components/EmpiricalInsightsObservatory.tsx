import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface BackendInsight {
  _id?: string;
  type: string;
  title: string;
  description: string;
  metricsReference?: Record<string, unknown>;
  createdAt?: string | number | Date;
}

export interface EmpiricalInsightsObservatoryProps {
  insights: BackendInsight[];
  targetRoleTitle: string;
  snapshotCount: number;
}

export const EmpiricalInsightsObservatory: React.FC<EmpiricalInsightsObservatoryProps> = ({
  insights = [],
  targetRoleTitle,
  snapshotCount,
}) => {
  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'growth':
        return {
          icon: TrendingUp,
          border: 'border-aurora-violet/25',
          bg: 'bg-aurora-violet/[0.06]',
          badge: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25',
          indicator: 'bg-cyan-400',
        };
      case 'trend':
        return {
          icon: Award,
          border: 'border-aurora-violet/25',
          bg: 'bg-aurora-violet/[0.06]',
          badge: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25',
          indicator: 'bg-indigo-400',
        };
      case 'achievement':
        return {
          icon: CheckCircle2,
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/5',
          badge: 'bg-purple-500/10 text-aurora-violet border-purple-500/30',
          indicator: 'bg-purple-400',
        };
      default:
        return {
          icon: Brain,
          border: 'border-aurora-line',
          bg: 'bg-aurora-canvas/60',
          badge: 'bg-aurora-canvas text-aurora-muted border-aurora-line',
          indicator: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-aurora-canvas/60 p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-aurora-line pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
              <Brain className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-aurora-ink">
              What the Data Is Telling You
            </h3>
          </div>
          <p className="text-xs text-aurora-muted">
            Empirical observations derived from cross-snapshot delta calculations targeting {targetRoleTitle}.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-aurora-canvas text-aurora-muted border border-aurora-line shrink-0">
          {insights.length} Verified {insights.length === 1 ? 'Insight' : 'Insights'}
        </span>
      </div>

      {/* Insights Content */}
      {insights.length === 0 ? (
        <div className="p-6 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 flex items-center justify-center text-aurora-indigo">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-aurora-ink">
                Longitudinal Insights Calibrating
              </h4>
              <p className="text-xs text-aurora-muted">
                {snapshotCount < 2
                  ? `Telemetry engine requires at least 2 snapshots to compute mathematical deltas. Currently: ${snapshotCount} snapshot recorded.`
                  : 'No significant metric deviations detected between recent snapshots.'}
              </p>
            </div>
          </div>
          <p className="text-xs text-aurora-muted leading-relaxed pl-11">
            As you interact with the platform across consecutive days—completing roadmap items, uploading updated resumes, or adding skills—SkillBridge will surface deterministic evidence of capability velocity and readiness acceleration here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((ins, idx) => {
            const style = getInsightStyle(ins.type);
            const IconComp = style.icon;
            const refs = ins.metricsReference;

            return (
              <motion.div
                key={ins._id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.06 }}
                className={`p-5 rounded-2xl border ${style.border} ${style.bg} space-y-3 relative overflow-hidden backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${style.indicator}`} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                      {ins.type}
                    </span>
                  </div>
                  <IconComp className="w-4 h-4 text-aurora-muted" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-aurora-ink tracking-tight">
                    {ins.title}
                  </h4>
                  <p className="text-xs text-aurora-muted leading-relaxed">
                    {ins.description}
                  </p>
                </div>

                {/* Mathematical Evidence Reference if available */}
                {refs && Object.keys(refs).length > 0 && (
                  <div className="pt-2 border-t border-aurora-line flex items-center gap-3 text-[11px] text-aurora-muted flex-wrap">
                    <span className="text-aurora-muted">Metric Delta:</span>
                    {Object.entries(refs).map(([key, val]) => (
                      <span key={key} className="text-aurora-muted">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:{' '}
                        <strong className="text-aurora-indigo">{String(val)}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

EmpiricalInsightsObservatory.displayName = 'EmpiricalInsightsObservatory';
