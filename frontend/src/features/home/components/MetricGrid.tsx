import React from 'react';
import { Card } from '../../../components/base/Card';

export interface MetricItem {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'ai';
}

export interface MetricGridProps {
  metrics: MetricItem[];
}

const colorStyles = {
  primary: 'text-[var(--color-interactive-primary)] bg-[hsl(226,84%,57%,0.10)] border-[hsl(226,84%,57%,0.20)]',
  success: 'text-[var(--color-status-success-text)] bg-[var(--color-status-success-bg)] border-[var(--color-status-success-border)]',
  warning: 'text-[var(--color-status-warning-text)] bg-[var(--color-status-warning-bg)] border-[var(--color-status-warning-border)]',
  info: 'text-[var(--color-status-info-text)] bg-[var(--color-status-info-bg)] border-[var(--color-status-info-border)]',
  ai: 'text-[var(--color-ai-accent)] bg-[var(--color-ai-accent-subtle)] border-[hsl(185,66%,57%,0.20)]',
};

export const MetricGrid: React.FC<MetricGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map(m => {
        const style = colorStyles[m.color || 'primary'];

        return (
          <Card key={m.id} variant="default" className="flex items-center gap-4 p-5 hover:border-[var(--color-border-strong)] transition-all">
            <div className={`w-12 h-12 rounded-[var(--radius-lg)] border flex items-center justify-center shrink-0 ${style}`}>
              {m.icon}
            </div>
            <div>
              <div className="text-2xl font-extrabold font-display text-[var(--color-text-primary)]">
                {m.value}
              </div>
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {m.label}
              </div>
              {m.subtext && (
                <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                  {m.subtext}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

MetricGrid.displayName = 'MetricGrid';
