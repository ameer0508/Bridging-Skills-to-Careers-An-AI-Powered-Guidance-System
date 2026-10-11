import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export interface AmbientIntelligenceDockProps {
  provider: string;
  lastUpdated: string;
  isOnline?: boolean;
  aiStatus?: 'LIVE' | 'FALLBACK';
  marketStatus?: 'LIVE' | 'SANDBOX';
}

export const AmbientIntelligenceDock: React.FC<AmbientIntelligenceDockProps> = ({
  provider,
  lastUpdated,
  isOnline = true,
  aiStatus = 'FALLBACK',
  marketStatus = 'SANDBOX',
}) => {
  return (
    <footer className="py-4 px-6 rounded-2xl bg-white/[0.015] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <Cpu className="w-3 h-3" />
        </div>
        <span>
          Intelligence Core: <strong className="text-slate-300 font-medium">{provider}</strong>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
            aiStatus === 'LIVE'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
          }`}
          title={
            aiStatus === 'LIVE'
              ? 'Real-time Generative AI Core Active'
              : 'Local Deterministic AI Engine (GEMINI_API_KEY pending)'
          }
        >
          {aiStatus === 'LIVE' ? 'LIVE AI' : 'DETERMINISTIC FALLBACK'}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
            marketStatus === 'LIVE'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
              : 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
          }`}
          title={
            marketStatus === 'LIVE'
              ? 'Live Opportunity Provider Connected'
              : 'Normalized Sandbox Market (RAPIDAPI_KEY pending)'
          }
        >
          {marketStatus === 'LIVE' ? 'LIVE MARKET' : 'SANDBOX MARKET'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Isolated User Context</span>
        </div>
        <span className="text-slate-600">•</span>
        <span>Last Synced {lastUpdated}</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </span>
      </div>
    </footer>
  );
};
