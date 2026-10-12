import React from 'react';
import {
  ShieldCheck,
} from 'lucide-react';

export interface JobSearchAgentStatusBarProps {
  isSearching: boolean;
  providerStatus: string;
  totalFound: number;
}

export const JobSearchAgentStatusBar: React.FC<JobSearchAgentStatusBarProps> = ({
  isSearching,
  providerStatus,
  totalFound,
}) => {
  const stages = [
    { id: 'query', label: 'Intent Query' },
    { id: 'collect', label: 'Collecting Feeds' },
    { id: 'normalize', label: 'Deduplicating' },
    { id: 'enrich', label: 'Skill Match Scoring' },
    { id: 'rank', label: 'Ranked Pipeline' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-lg backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left: Agent Status Badge */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative">
          <span
            className={`w-3 h-3 rounded-full block ${
              isSearching ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`w-3 h-3 rounded-full block absolute top-0 left-0 ${
              isSearching ? 'bg-indigo-500' : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="text-xs">
          <span className="font-bold text-white block">
            {isSearching ? 'Job Search Agent Active' : 'Agent Ready'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {isSearching ? 'Fetching and ranking opportunities...' : `Showing ${totalFound} ${totalFound === 1 ? 'opportunity' : 'opportunities'}`}
          </span>
        </div>
      </div>

      {/* Middle: Stepper */}
      <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400">
        {stages.map((stg, idx) => (
          <React.Fragment key={stg.id}>
            <span
              className={`px-2 py-0.5 rounded ${
                isSearching
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {stg.label}
            </span>
            {idx < stages.length - 1 && <span className="text-slate-600">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Right: Telemetry Attribution */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>JSearch Provider: {providerStatus}</span>
      </div>
    </div>
  );
};

JobSearchAgentStatusBar.displayName = 'JobSearchAgentStatusBar';
