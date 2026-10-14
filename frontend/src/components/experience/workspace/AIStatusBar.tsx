import React from 'react';
import { Database, CheckCircle2, RefreshCw, AlertTriangle, Cpu } from 'lucide-react';
import { AIGatewayService } from '../../../services/aiGatewayService';

export type AIStatus = 'active' | 'thinking' | 'synced' | 'idle' | 'retry' | 'unavailable' | 'error';

export interface AIStatusBarProps {
  status?: AIStatus;
  /** Accepted for compatibility but never displayed: no confidence value is measured. */
  confidence?: number;
  /** Shown only when given; pass a real time or description, never a placeholder. */
  lastUpdated?: string;
  /** Where the content comes from, in plain words. */
  provider?: string;
  /** Accepted for compatibility but never displayed: no latency is measured here. */
  latencyMs?: number;
  retryCount?: number;
  errorMessage?: string;
  className?: string;
}

/**
 * States what a page is doing with the user's data. It claims no AI connection, confidence or
 * latency: none of those is measured by the pages that show this bar.
 */
export const AIStatusBar: React.FC<AIStatusBarProps> = ({
  status = 'active',
  lastUpdated,
  provider = 'Your SkillBridge data',
  retryCount = 0,
  errorMessage,
  className = '',
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'thinking':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-aurora-violet motion-safe:animate-spin" />,
          label: 'Loading…',
          color: 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-indigo',
        };
      case 'retry':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-700 motion-safe:animate-spin" />,
          label: `Retrying (attempt ${retryCount + 1})…`,
          color: 'bg-amber-50 border-amber-200 text-amber-800',
        };
      case 'unavailable':
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />,
          label: errorMessage || 'Could not load',
          color: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      case 'active':
        return {
          icon: <Database className="w-3.5 h-3.5 text-emerald-700" />,
          label: 'Loaded',
          color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      case 'synced':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-aurora-indigo" />,
          label: 'Up to date',
          color: 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-indigo',
        };
      case 'idle':
      default:
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-aurora-muted" />,
          label: 'Ready',
          color: 'bg-aurora-canvas border-aurora-line text-aurora-muted',
        };
    }
  };

  const badge = getStatusBadge();
  const providerDisplay = AIGatewayService.formatProviderBadge(provider);

  return (
    <div
      role="status"
      className={`px-4 py-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex flex-wrap items-center justify-between text-xs gap-x-4 gap-y-1.5 ${className}`}
    >
      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${badge.color}`}>
        {badge.icon}
        <span>{badge.label}</span>
      </span>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-aurora-muted text-[11px]">
        {lastUpdated && <span>{lastUpdated}</span>}
        {lastUpdated && <span aria-hidden="true">•</span>}
        <span className="font-semibold">Source: {providerDisplay}</span>
      </div>
    </div>
  );
};
