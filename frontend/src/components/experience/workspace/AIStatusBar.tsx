import React, { useState } from 'react';
import { Brain, Cpu, CheckCircle2, RefreshCw, AlertTriangle, Zap, Terminal } from 'lucide-react';
import { AIGatewayService } from '../../../services/aiGatewayService';

export type AIStatus = 'active' | 'thinking' | 'synced' | 'idle' | 'retry' | 'unavailable' | 'error';

export interface AIStatusBarProps {
  status?: AIStatus;
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
  confidence = 98.4,
  lastUpdated = 'Just now',
  provider = 'Gemini 1.5 & Vector Engine',
  latencyMs = 120,
  retryCount = 0,
  errorMessage,
  className = '',
}) => {
  const [showDevTelemetry, setShowDevTelemetry] = useState(false);

  const getStatusBadge = () => {
    switch (status) {
      case 'thinking':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
          label: 'AI Gateway Synthesizing...',
          color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        };
      case 'retry':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
          label: `Retrying Request (Attempt ${retryCount + 1})...`,
          color: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        };
      case 'unavailable':
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: errorMessage || 'AI Gateway Fallback Mode',
          color: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        };
      case 'active':
        return {
          icon: <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
          label: 'AI Gateway Active',
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        };
      case 'synced':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Telemetry Synced',
          color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
        };
      case 'idle':
      default:
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Engine Standby',
          color: 'bg-slate-800 border-white/10 text-slate-400',
        };
    }
  };

  const badge = getStatusBadge();
  const providerDisplay = AIGatewayService.formatProviderBadge(provider);

  return (
    <div className="space-y-2">
      <div
        className={`px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center justify-between text-xs gap-4 ${className}`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold flex items-center gap-1.5 ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
            Confidence: <strong className="text-emerald-400 font-bold">{confidence}%</strong>
          </span>
          {latencyMs > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-400">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{latencyMs}ms</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono shrink-0">
          <span>Updated: {lastUpdated}</span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline font-bold text-slate-300">{providerDisplay}</span>

          <button
            onClick={() => setShowDevTelemetry(!showDevTelemetry)}
            title="Toggle AI Gateway Dev Telemetry"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showDevTelemetry && (
        <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-xl text-[11px] font-mono text-slate-300 space-y-1">
          <div className="flex justify-between items-center text-cyan-400 font-bold border-b border-cyan-500/20 pb-1">
            <span>[AI GATEWAY DEV TELEMETRY]</span>
            <span>STATUS: {status.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div><span className="text-slate-500">Provider:</span> {provider}</div>
            <div><span className="text-slate-500">Confidence:</span> {confidence}%</div>
            <div><span className="text-slate-500">Latency:</span> {latencyMs} ms</div>
            <div><span className="text-slate-500">Retry Count:</span> {retryCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};
