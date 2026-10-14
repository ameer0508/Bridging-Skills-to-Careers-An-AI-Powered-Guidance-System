import React from 'react';
import {
  X,
  ExternalLink,
  Zap,
  Wrench,
  CheckCircle2,
  Database,
  GitFork
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { IAgentMetadata } from '../../../types/orchestrator';
import { DialogFrame } from '../../../design/aurora/DialogFrame';

export interface AgentSubsystemInspectorProps {
  agent: IAgentMetadata | null;
  onClose: () => void;
  onNavigateToSubsystem: (route: string) => void;
}

export const AgentSubsystemInspector: React.FC<AgentSubsystemInspectorProps> = ({
  agent,
  onClose,
  onNavigateToSubsystem,
}) => {
  if (!agent) return null;

  return (
    <DialogFrame onClose={onClose} label={`${agent.name} details`} side="right">
      <GlassPanel className="max-w-xl w-full h-full overflow-y-auto p-6 sm:p-8 space-y-6 border-aurora-violet/25 relative shadow-aurora-lg bg-white text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close inspector"
          className="absolute top-6 right-6 p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Subsystem Header */}
        <div className="space-y-2 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
              {agent.category} SUBSYSTEM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              STATUS: {agent.status}
            </span>
            <span className="text-aurora-muted text-[10px]">v{agent.version}</span>
          </div>

          <h2 className="text-xl font-bold text-aurora-ink tracking-tight">{agent.name}</h2>
          <p className="text-aurora-muted leading-relaxed text-xs">{agent.purpose}</p>
        </div>

        {/* Connected Candidate Context */}
        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-violet/25 space-y-2.5">
          <span className="text-[10px] uppercase font-bold text-aurora-indigo tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-aurora-violet" />
            Connected Candidate Telemetry
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {Object.entries(agent.candidateContext).map(([key, val]) => (
              <div key={key} className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-0.5">
                <span className="text-[9px] uppercase text-aurora-muted block truncate">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <strong className="text-aurora-ink block truncate">
                  {Array.isArray(val) ? val.join(', ') || 'None' : String(val ?? 'N/A')}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-aurora-muted tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-aurora-indigo" />
            Core Subsystem Capabilities
          </span>
          <div className="space-y-1.5">
            {agent.capabilities.map((cap, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-aurora-ink flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Contracts (Inputs & Outputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-aurora-violet tracking-wider block">
              Input Contracts:
            </span>
            <div className="space-y-1">
              {agent.inputContracts.map((inp, i) => (
                <div key={i} className="p-2 rounded-lg bg-cyan-50 border border-aurora-violet/25 text-aurora-violet text-[10px]">
                  • {inp}
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-aurora-violet tracking-wider block">
              Output Contracts:
            </span>
            <div className="space-y-1">
              {agent.outputContracts.map((out, i) => (
                <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-500/20 text-aurora-violet text-[10px]">
                  • {out}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Invoked */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-aurora-muted tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-700" />
            Underlying Tools & Modules
          </span>
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map((tool, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-aurora-canvas text-aurora-muted border border-aurora-line text-[10px] font-bold"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Inter-Agent Dependencies */}
        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <span className="text-[10px] uppercase font-bold text-aurora-muted tracking-wider flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-aurora-indigo" />
            Inter-Agent Pipeline Relationships
          </span>
          <div className="text-[11px] text-aurora-muted space-y-1">
            <div>
              <span className="text-aurora-muted">Upstream Feeds: </span>
              <strong>{agent.upstreamDependencies.join(', ') || 'Root Context Trigger'}</strong>
            </div>
            <div>
              <span className="text-aurora-muted">Downstream Dependents: </span>
              <strong>{agent.downstreamDependents.join(', ') || 'Orchestrator Synthesis'}</strong>
            </div>
          </div>
        </div>

        {/* Direct Action */}
        <div className="pt-2">
          <button
            onClick={() => onNavigateToSubsystem(agent.route)}
            type="button"
            className="w-full py-3 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <span>Open Dedicated {agent.name} Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassPanel>
    </DialogFrame>
  );
};
