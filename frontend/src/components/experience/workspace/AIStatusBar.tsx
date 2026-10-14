import React, { useState } from 'react';
import { Brain, Cpu, CheckCircle2, RefreshCw, AlertTriangle, Zap, Terminal } from 'lucide-react';
import { AIGatewayService } from '../../../services/aiGatewayService';

export type AIStatus = 'active' | 'thinking' | 'synced' | 'idle' | 'retry' | 'unavailable' | 'error';

export interface AIStatusBarProps {
  status?: AIStatus;
  /** Accepted for compatibility but never displayed: no confidence value is measured. */
  confidence?: number;
  lastUpdated?: string;
  provider?: string;
  latencyMs?: number;
  retryCount?: number;
  errorMessage?: string;
  className?: string;
}

export const AIStatusBar: React.FC<AIStatusBarProps> = ({
  status = 'active',
  lastUpdated = 'Just now',
  provider = 'SkillBridge',
  latencyMs,
  retryCount = 0,
  errorMessage,
  className = '',
}) => {
  const [showDevTelemetry, setShowDevTelemetry] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'thinking':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-aurora-violet animate-spin" />,
          label: 'AI Gateway Synthesizing...',
          color: 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-violet',
        };
      case 'retry':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />,
          label: `Retrying Request (Attempt ${retryCount + 1})...`,
          color: 'bg-amber-50 border-amber-200 text-amber-700',
        };
      case 'unavailable':
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />,
          label: errorMessage || 'AI Gateway Fallback Mode',
          color: 'bg-rose-50 border-rose-200 text-rose-700',
        };
      case 'active':
        return {
          icon: <Brain className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />,
          label: 'AI Gateway Connected',
          color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        };
      case 'synced':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-aurora-indigo" />,
          label: 'Telemetry Synced',
          color: 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-indigo',
        };
      case 'idle':
      default:
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-aurora-muted" />,
          label: 'Engine Standby',
          color: 'bg-aurora-canvas border-aurora-line text-aurora-muted',
        };
    }
  };

  const badge = getStatusBadge();
  const providerDisplay = AIGatewayService.formatProviderBadge(provider);

  return (
    <div className="space-y-2">
      <div
        className={`px-4 py-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line backdrop-blur-md flex items-center justify-between text-xs gap-4 ${className}`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          {typeof latencyMs === 'number' && latencyMs > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-aurora-canvas border border-aurora-line text-aurora-muted">
              <Zap className="w-3 h-3 text-aurora-violet" />
              <span>{latencyMs}ms</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-aurora-muted text-[11px] shrink-0">
          <span>Last verified: {lastUpdated}</span>
          <span className="hidden md:inline text-aurora-muted">•</span>
          <span className="hidden md:inline font-bold text-aurora-muted">{providerDisplay}</span>

          <button
            onClick={() => setShowDevTelemetry(!showDevTelemetry)}
            title="Toggle AI Gateway Dev Telemetry"
            className="p-1 hover:bg-aurora-canvas rounded text-aurora-muted hover:text-aurora-violet transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDevTelemetry && (
        <div className="p-3 bg-aurora-canvas border border-aurora-violet/25 rounded-xl text-[11px] text-aurora-muted space-y-1">
          <div className="flex justify-between items-center text-aurora-violet font-bold border-b border-aurora-violet/25 pb-1">
            <span>[AI GATEWAY GROUNDED TELEMETRY]</span>
            <span>STATUS: {status.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div><span className="text-aurora-muted">Provider:</span> {providerDisplay}</div>
            <div>
              <span className="text-aurora-muted">Latency:</span>{' '}
              {typeof latencyMs === 'number' ? `${latencyMs} ms` : 'Persistent Gateway'}
            </div>
            <div><span className="text-aurora-muted">Retry Count:</span> {retryCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};
