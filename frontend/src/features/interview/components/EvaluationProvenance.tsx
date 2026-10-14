import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import { Bot, ListChecks } from 'lucide-react';
import { QUESTION_SOURCE_LABEL, SCORING_SOURCE_LABEL } from './evaluationLabels';

/** Rubric dimensions returned by the API, each 0-100. technicalAccuracy is null when it was not judged. */
export interface EvaluationDimensions {
  relevance?: number | null;
  completeness?: number | null;
  specificity?: number | null;
  structure?: number | null;
  technicalAccuracy?: number | null;
}

const DIMENSIONS: Array<{ key: keyof EvaluationDimensions; label: string; hint: string }> = [
  { key: 'relevance', label: 'Relevance', hint: 'Does the answer address the question?' },
  { key: 'completeness', label: 'Completeness', hint: 'Does it cover the question fully?' },
  { key: 'specificity', label: 'Specificity', hint: 'Concrete details, examples and results' },
  { key: 'structure', label: 'Structure', hint: 'Clear, logical flow (STAR for behavioural questions)' },
  { key: 'technicalAccuracy', label: 'Technical accuracy', hint: 'Correctness of the technical claims' },
];

interface SourceBadgeProps {
  kind: 'questions' | 'scoring';
  source?: string | null;
}

/** Labels who wrote the questions or who scored the answers. Renders nothing when the source is unknown. */
export const SourceBadge: React.FC<SourceBadgeProps> = ({ kind, source }) => {
  if (!source) return null;
  const label = (kind === 'questions' ? QUESTION_SOURCE_LABEL : SCORING_SOURCE_LABEL)[source];
  if (!label) return null;
  const isAi = source === 'ai';
  const Icon = isAi ? Bot : ListChecks;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
        isAi ? 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25' : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
      data-testid={`${kind}-source`}
      data-source={source}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

interface DimensionBarsProps {
  dimensions?: EvaluationDimensions | Record<string, number | null> | null;
}

/** The rubric dimensions exactly as scored. A dimension that was not judged says so instead of showing a number. */
export const DimensionBars: React.FC<DimensionBarsProps> = ({ dimensions }) => {
  const values = (dimensions || {}) as Record<string, number | null | undefined>;
  const reduce = useReducedMotion();
  const hasAny = DIMENSIONS.some((d) => typeof values[d.key] === 'number');
  if (!hasAny) {
    return <p className="text-xs text-aurora-muted">No dimension scores were recorded for this answer.</p>;
  }
  return (
    <dl className="space-y-3" data-testid="evaluation-dimensions">
      {DIMENSIONS.map((dimension) => {
        const value = values[dimension.key];
        const scored = typeof value === 'number';
        return (
          <div key={dimension.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs">
            <dt className="font-medium text-aurora-muted" title={dimension.hint}>
              {dimension.label}
            </dt>
            <dd className={`font-bold ${scored ? 'text-aurora-indigo' : 'text-aurora-muted'}`}>
              {scored ? `${value}/100` : 'Not assessed'}
            </dd>
            <dd className="col-span-2 h-2 w-full overflow-hidden rounded-full border border-aurora-line bg-aurora-canvas" aria-hidden="true">
              {scored && (
                <motion.div
                  className="h-full rounded-full [background:var(--aurora-gradient-action)]"
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};
