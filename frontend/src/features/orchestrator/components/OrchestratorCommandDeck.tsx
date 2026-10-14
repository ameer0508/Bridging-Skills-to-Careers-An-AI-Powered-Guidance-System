import React from 'react';
import {
  Workflow,
  Cpu,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface OrchestratorCommandDeckProps {
  goalQuery: string;
  onGoalChange: (val: string) => void;
  targetCompany: string;
  onCompanyChange: (val: string) => void;
  isExecuting: boolean;
  onExecute: () => void;
  activeAgentsCount: number;
  totalAgentsCount: number;
  latestLatencyMs?: number;
  workflowStatus: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
}

export const OrchestratorCommandDeck: React.FC<OrchestratorCommandDeckProps> = ({
  goalQuery,
  onGoalChange,
  targetCompany,
  onCompanyChange,
  isExecuting,
  onExecute,
  activeAgentsCount,
  totalAgentsCount,
  latestLatencyMs = 120,
  workflowStatus,
}) => {
  const goalPresets = [
    'Principal AI Infrastructure Architect',
    'Senior Full Stack & Distributed Systems',
    'Cloud Reliability & Platform Architect',
    'Target Role Competency Gap Closure',
  ];

  return (
    <div className="space-y-6 font-mono">
      {/* Control Plane Masthead */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-aurora-surface to-aurora-sidebar border border-aurora-violet/25 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-aurora-violet/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-aurora-violet/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI AGENT CONTROL PLANE • SYSTEM COMMAND
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-canvas text-aurora-muted border border-aurora-line">
                10 AUTONOMOUS SUBSYSTEMS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-aurora-ink tracking-tight">
              Multi-Agent Orchestration Engine
            </h1>

            <p className="text-xs text-aurora-muted leading-relaxed">
              Coordinate intelligence across your entire career ecosystem. Dispatch directed acyclic graph (DAG)
              workflows that sequence and parallelize tasks across Career, Skills, Readiness, Roadmap, Jobs, and Interview agents.
            </p>
          </div>

          {/* Operational Status HUD */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
              <div>
                <span className="text-[10px] text-aurora-muted uppercase block">Active AI Agents</span>
                <span className="text-lg font-bold text-emerald-700">
                  {activeAgentsCount} / {totalAgentsCount} ONLINE
                </span>
              </div>
              <Cpu className="w-5 h-5 text-emerald-700/70" />
            </div>

            <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
              <div>
                <span className="text-[10px] text-aurora-muted uppercase block">Workflow Latency</span>
                <span className="text-lg font-bold text-aurora-violet">{latestLatencyMs}ms</span>
              </div>
              <Zap className="w-5 h-5 text-aurora-violet/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Command Surface Card */}
      <GlassPanel className="p-6 space-y-5 border-aurora-violet/25">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <Workflow className="w-4 h-4 text-aurora-indigo" />
              Direct the Agent Network
            </span>
            <span className="text-[11px] text-aurora-muted block mt-0.5">
              Specify your target objective and simulated employer to dispatch a coordinated 4-phase DAG workflow.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                workflowStatus === 'RUNNING'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {workflowStatus === 'RUNNING' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              DAG STATUS: {workflowStatus}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <label htmlFor="goal-input" className="sr-only">Target Career Objective</label>
            <input
              id="goal-input"
              type="text"
              value={goalQuery}
              onChange={(e) => onGoalChange(e.target.value)}
              placeholder="What career objective should the agent network execute? (e.g. Principal AI Infrastructure Architect)"
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-xs sm:text-sm text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-aurora-muted absolute left-3 top-3.5" />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="company-input" className="sr-only">Simulated Organization</label>
            <input
              id="company-input"
              type="text"
              value={targetCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
              placeholder="Target Organization (e.g. OpenScale AI Systems)"
              className="w-full px-3.5 py-3 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-xs sm:text-sm text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={onExecute}
              disabled={isExecuting || !goalQuery.trim()}
              type="button"
              className="w-full h-full min-h-[46px] py-2 px-4 rounded-2xl [background:var(--aurora-gradient-action)] hover:brightness-110 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Dispatch DAG</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-aurora-muted uppercase tracking-wider text-[10px] font-bold">Goal Presets:</span>
          {goalPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onGoalChange(preset)}
              type="button"
              className="px-2.5 py-1 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition cursor-pointer text-[10px]"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Real System Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-aurora-line">
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Registered Subsystems</span>
            <strong className="text-sm text-aurora-ink block">{totalAgentsCount} Agents Online</strong>
          </div>
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Execution Topology</span>
            <strong className="text-sm text-aurora-indigo block">4-Phase Hybrid DAG</strong>
          </div>
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Signal Arbitration</span>
            <strong className="text-sm text-emerald-700 block">Zero Contention</strong>
          </div>
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
            <span className="text-[10px] text-aurora-muted uppercase block">Context Isolation</span>
            <strong className="text-sm text-aurora-violet block">Multi-Tenant Isolated</strong>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
