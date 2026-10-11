import React from 'react';
import {
  Cpu,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Wrench,
  CheckCircle2,
  Database,
  GitFork
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { IAgentMetadata } from '../../../../../backend/src/services/OrchestratorService';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${agent.name} Subsystem Inspector`}
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 font-mono"
    >
      <GlassPanel className="max-w-xl w-full h-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 border-indigo-500/50 relative shadow-2xl bg-slate-950/95 text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close inspector"
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Subsystem Header */}
        <div className="space-y-2 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
              {agent.category} SUBSYSTEM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: {agent.status}
            </span>
            <span className="text-slate-500 text-[10px]">v{agent.version}</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">{agent.name}</h2>
          <p className="text-slate-300 leading-relaxed text-xs">{agent.purpose}</p>
        </div>

        {/* Connected Candidate Context */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
          <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Connected Candidate Telemetry
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {Object.entries(agent.candidateContext).map(([key, val]) => (
              <div key={key} className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-0.5">
                <span className="text-[9px] uppercase text-slate-400 block truncate">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <strong className="text-white block truncate">
                  {Array.isArray(val) ? val.join(', ') || 'None' : String(val ?? 'N/A')}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Core Subsystem Capabilities
          </span>
          <div className="space-y-1.5">
            {agent.capabilities.map((cap, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Contracts (Inputs & Outputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
              Input Contracts:
            </span>
            <div className="space-y-1">
              {agent.inputContracts.map((inp, i) => (
                <div key={i} className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 text-[10px]">
                  • {inp}
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
              Output Contracts:
            </span>
            <div className="space-y-1">
              {agent.outputContracts.map((out, i) => (
                <div key={i} className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-200 text-[10px]">
                  • {out}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Invoked */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            Underlying Tools & Modules
          </span>
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map((tool, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-white/10 text-[10px] font-bold"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Inter-Agent Dependencies */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            Inter-Agent Pipeline Relationships
          </span>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div>
              <span className="text-slate-500">Upstream Feeds: </span>
              <strong>{agent.upstreamDependencies.join(', ') || 'Root Context Trigger'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Downstream Dependents: </span>
              <strong>{agent.downstreamDependents.join(', ') || 'Orchestrator Synthesis'}</strong>
            </div>
          </div>
        </div>

        {/* Direct Action */}
        <div className="pt-2">
          <button
            onClick={() => onNavigateToSubsystem(agent.route)}
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <span>Open Dedicated {agent.name} Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </GlassPanel>
    </div>
  );
};
