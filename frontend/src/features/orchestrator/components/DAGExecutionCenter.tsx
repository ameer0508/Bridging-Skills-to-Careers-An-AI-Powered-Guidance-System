import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Database
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { IWorkflowExecution } from '../../../types/orchestrator';

export interface DAGExecutionCenterProps {
  execution: IWorkflowExecution | null;
  onNavigateToAction: (route: string) => void;
}

export const DAGExecutionCenter: React.FC<DAGExecutionCenterProps> = ({
  execution,
  onNavigateToAction,
}) => {
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);

  if (!execution) {
    return (
      <div className="w-full">
        <GlassPanel className="w-full p-8 text-center text-slate-400 font-mono text-xs border-dashed border-white/10 space-y-2">
          <Workflow className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No active DAG workflow executed yet.</p>
          <p className="text-[11px] text-slate-500">
            Enter a career objective in the Command Deck above and click "Dispatch DAG" to observe live multi-agent execution.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 font-mono">
      <GlassPanel className="w-full p-6 sm:p-8 space-y-6 border-indigo-500/40 shadow-2xl">
        {/* Execution Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ORCHESTRATION {execution.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-400 border border-white/10">
                {execution.workflowId}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                LATENCY: {execution.latencyMs}ms
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Goal: {execution.goal}
            </h3>
            <span className="text-[11px] text-slate-400 block">
              Simulated Employer: <strong className="text-cyan-300">{execution.targetCompany}</strong>
            </span>
          </div>

          {/* Toggle Data Payload Inspector */}
          <button
            onClick={() => setShowPayloadInspector((prev) => !prev)}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showPayloadInspector ? 'Hide Data Payload' : 'Inspect Context Payload'}</span>
            {showPayloadInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sanitized Context Data Payload Inspector (Collapsible) */}
        {showPayloadInspector && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Sanitized Cross-Agent Data Payload
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                CREDENTIALS & TOKENS SANITIZED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(execution.sanitizedPayload).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase text-slate-400 block">
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <strong className="text-slate-100 text-xs block truncate">
                    {String(v)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainable AI Reasoning Banner */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white">Explainable Orchestration Rationale:</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px] italic pl-6">
            "{execution.orchestrationReasoning}"
          </p>
        </div>

        {/* 4-Phase DAG Step Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              DAG Phase Sequencing ({execution.dagPhases.length} Execution Steps)
            </span>
            <span className="text-[10px] text-slate-500">
              Parallel branches synchronized before subsequent phase
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {execution.dagPhases.map((phase, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-indigo-500/30 transition space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center border border-indigo-500/30 shrink-0">
                      {phase.step}
                    </span>
                    <span className="font-bold text-white text-xs sm:text-sm">
                      Phase {phase.step}: {phase.phaseTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        phase.parallel
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {phase.parallel ? 'PARALLEL BRANCH' : 'SEQUENTIAL STEP'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ✓ {phase.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong>{phase.agentName}:</strong> {phase.action}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300">
                  <span className="text-slate-500">Synthesized Output: </span>
                  {phase.outputResult}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Synthesized Cross-System Next Actions */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Synthesized Next Actions (Execute in Subsystems)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {execution.followUpActions.map((act, i) => (
              <div
                key={i}
                onClick={() => onNavigateToAction(act.route)}
                className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition cursor-pointer space-y-1.5 flex flex-col justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      {act.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-[10px] text-indigo-400 font-bold">
                  <span>Open Subsystem →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
