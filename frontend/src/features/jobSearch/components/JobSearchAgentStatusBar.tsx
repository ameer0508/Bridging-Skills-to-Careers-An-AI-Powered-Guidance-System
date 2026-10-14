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
    { id: 'collect', label: 'Reading sources' },
    { id: 'normalize', label: 'Deduplicating' },
    { id: 'enrich', label: 'Skill Match Scoring' },
    { id: 'rank', label: 'Ranked Pipeline' },
  ];

  return (
    <div className="rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
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
          <span className="font-bold text-aurora-ink block">
            {isSearching ? 'Searching…' : 'Ready'}
          </span>
          <span className="text-[10px] text-aurora-muted">
            {isSearching ? 'Fetching and ranking opportunities...' : `Showing ${totalFound} ${totalFound === 1 ? 'opportunity' : 'opportunities'}`}
          </span>
        </div>
      </div>

      {/* Middle: Stepper */}
      <div className="hidden lg:flex items-center gap-1 text-[11px] text-aurora-muted">
        {stages.map((stg, idx) => (
          <React.Fragment key={stg.id}>
            <span
              className={`px-2 py-0.5 rounded ${
                isSearching
                  ? 'bg-aurora-violet/[0.06] text-aurora-indigo font-semibold'
                  : 'bg-aurora-canvas text-aurora-muted'
              }`}
            >
              {stg.label}
            </span>
            {idx < stages.length - 1 && <span className="text-aurora-muted">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Right: Telemetry Attribution */}
      <div className="flex items-center gap-2 text-xs text-aurora-muted shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
        <span>Source: {providerStatus}</span>
      </div>
    </div>
  );
};

JobSearchAgentStatusBar.displayName = 'JobSearchAgentStatusBar';
