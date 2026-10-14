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
        <GlassPanel className="w-full p-8 text-center text-aurora-muted text-xs border-dashed border-aurora-line space-y-2">
          <Workflow className="w-8 h-8 text-aurora-muted mx-auto" />
          <p className="font-semibold text-aurora-muted">No active DAG workflow executed yet.</p>
          <p className="text-[11px] text-aurora-muted">
            Enter a career objective in the Command Deck above and click "Dispatch DAG" to observe live multi-agent execution.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 tabular-nums">
      <GlassPanel className="w-full p-6 sm:p-8 space-y-6 border-aurora-violet/25 shadow-2xl">
        {/* Execution Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-aurora-line">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ORCHESTRATION {execution.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aurora-canvas text-aurora-muted border border-aurora-line">
                {execution.workflowId}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                LATENCY: {execution.latencyMs}ms
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-aurora-ink tracking-tight">
              Goal: {execution.goal}
            </h3>
            <span className="text-[11px] text-aurora-muted block">
              Simulated Employer: <strong className="text-aurora-violet">{execution.targetCompany}</strong>
            </span>
          </div>

          {/* Toggle Data Payload Inspector */}
          <button
            onClick={() => setShowPayloadInspector((prev) => !prev)}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink hover:text-aurora-indigo text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-aurora-violet" />
            <span>{showPayloadInspector ? 'Hide Data Payload' : 'Inspect Context Payload'}</span>
            {showPayloadInspector ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sanitized Context Data Payload Inspector (Collapsible) */}
        {showPayloadInspector && (
          <div className="p-5 rounded-2xl bg-aurora-canvas border border-aurora-violet/25 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-aurora-ink flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Sanitized Cross-Agent Data Payload
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                CREDENTIALS & TOKENS SANITIZED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(execution.sanitizedPayload).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
                  <span className="text-[9px] uppercase text-aurora-muted block">
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <strong className="text-aurora-ink text-xs block truncate">
                    {String(v)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainable AI Reasoning Banner */}
        <div className="p-4 rounded-2xl bg-violet-50 border border-aurora-violet/25 space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-aurora-indigo" />
            <span className="font-bold text-aurora-ink">Explainable Orchestration Rationale:</span>
          </div>
          <p className="text-aurora-muted leading-relaxed text-[11px] italic pl-6">
            "{execution.orchestrationReasoning}"
          </p>
        </div>

        {/* 4-Phase DAG Step Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted flex items-center gap-2">
              <Layers className="w-4 h-4 text-aurora-indigo" />
              DAG Phase Sequencing ({execution.dagPhases.length} Execution Steps)
            </span>
            <span className="text-[10px] text-aurora-muted">
              Parallel branches synchronized before subsequent phase
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {execution.dagPhases.map((phase, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-violet/25 transition space-y-2 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-50 text-aurora-indigo text-[10px] font-bold flex items-center justify-center border border-aurora-violet/25 shrink-0">
                      {phase.step}
                    </span>
                    <span className="font-bold text-aurora-ink text-xs sm:text-sm">
                      Phase {phase.step}: {phase.phaseTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        phase.parallel
                          ? 'bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25'
                          : 'bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25'
                      }`}
                    >
                      {phase.parallel ? 'PARALLEL BRANCH' : 'SEQUENTIAL STEP'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ {phase.status}
                    </span>
                  </div>
                </div>

                <p className="text-aurora-muted text-xs leading-relaxed">
                  <strong>{phase.agentName}:</strong> {phase.action}
                </p>

                <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-[11px] text-aurora-muted">
                  <span className="text-aurora-muted">Synthesized Output: </span>
                  {phase.outputResult}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Synthesized Cross-System Next Actions */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted block">
            Synthesized Next Actions (Execute in Subsystems)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {execution.followUpActions.map((act, i) => (
              <div
                key={i}
                onClick={() => onNavigateToAction(act.route)}
                className="p-4 rounded-2xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 transition cursor-pointer space-y-1.5 flex flex-col justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-aurora-ink group-hover:text-aurora-indigo transition">
                      {act.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-aurora-muted group-hover:text-aurora-indigo transition" />
                  </div>
                  <p className="text-[11px] text-aurora-muted leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-[10px] text-aurora-indigo font-bold">
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
