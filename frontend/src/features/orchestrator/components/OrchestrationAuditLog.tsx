import React from 'react';
import {
  History,
  Activity,
  Layers,
  Clock,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { IWorkflowExecution } from '../../../../../backend/src/services/OrchestratorService';

export interface OrchestrationAuditLogProps {
  executions: IWorkflowExecution[];
  recentEvents: Array<{
    id: string;
    eventType: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
  onSelectExecution: (exec: IWorkflowExecution) => void;
}

export const OrchestrationAuditLog: React.FC<OrchestrationAuditLogProps> = ({
  executions,
  recentEvents,
  onSelectExecution,
}) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
      {/* Historical Workflow Executions (7 Cols) */}
      <div className="w-full lg:col-span-7">
        <GlassPanel className="w-full h-full p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              DAG Execution History ({executions.length})
            </span>
            <span className="text-[10px] text-slate-500">Persistent Multi-Agent Runs</span>
          </div>

          {executions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
              No past DAG workflows recorded yet. Dispatch a workflow in the Command Deck to begin logging.
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((exec) => (
                <div
                  key={exec.workflowId}
                  onClick={() => onSelectExecution(exec)}
                  className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition cursor-pointer flex items-center justify-between flex-wrap gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white group-hover:text-indigo-300 transition text-xs sm:text-sm">
                        {exec.goal}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ✓ {exec.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {exec.latencyMs}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {exec.dagPhases?.length || 4} Steps
                      </span>
                      <span className="text-cyan-300">{exec.targetCompany}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(exec.completedAt || exec.startedAt).toLocaleTimeString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Living Platform Event Stream (5 Cols) */}
      <div className="w-full lg:col-span-5">
        <GlassPanel className="w-full h-full p-6 space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Telemetry Event Stream ({recentEvents.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {recentEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-2xl">
              No system events captured yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentEvents.map((ev) => {
                const formattedType = ev.eventType.replace(/_/g, ' ').toUpperCase();
                return (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                        {formattedType}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <p className="text-slate-400 text-[10px] truncate">
                        {JSON.stringify(ev.details)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
};
