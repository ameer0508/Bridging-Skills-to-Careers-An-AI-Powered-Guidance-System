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
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI AGENT CONTROL PLANE • SYSTEM COMMAND
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-300 border border-white/10">
                10 AUTONOMOUS SUBSYSTEMS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Multi-Agent Orchestration Engine
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Coordinate intelligence across your entire career ecosystem. Dispatch directed acyclic graph (DAG)
              workflows that sequence and parallelize tasks across Career, Skills, Readiness, Roadmap, Jobs, and Interview agents.
            </p>
          </div>

          {/* Operational Status HUD */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Active AI Agents</span>
                <span className="text-lg font-bold text-emerald-400">
                  {activeAgentsCount} / {totalAgentsCount} ONLINE
                </span>
              </div>
              <Cpu className="w-5 h-5 text-emerald-400/70" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Workflow Latency</span>
                <span className="text-lg font-bold text-cyan-400">{latestLatencyMs}ms</span>
              </div>
              <Zap className="w-5 h-5 text-cyan-400/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Command Surface Card */}
      <GlassPanel className="p-6 space-y-5 border-indigo-500/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-400" />
              Direct the Agent Network
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Specify your target objective and simulated employer to dispatch a coordinated 4-phase DAG workflow.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                workflowStatus === 'RUNNING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="company-input" className="sr-only">Simulated Organization</label>
            <input
              id="company-input"
              type="text"
              value={targetCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
              placeholder="Target Organization (e.g. OpenScale AI Systems)"
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={onExecute}
              disabled={isExecuting || !goalQuery.trim()}
              type="button"
              className="w-full h-full min-h-[46px] py-2 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
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
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Goal Presets:</span>
          {goalPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => onGoalChange(preset)}
              type="button"
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer text-[10px]"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Real System Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Registered Subsystems</span>
            <strong className="text-sm text-white block">{totalAgentsCount} Agents Online</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Execution Topology</span>
            <strong className="text-sm text-indigo-300 block">4-Phase Hybrid DAG</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Signal Arbitration</span>
            <strong className="text-sm text-emerald-400 block">Zero Contention</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Context Isolation</span>
            <strong className="text-sm text-cyan-400 block">Multi-Tenant Isolated</strong>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
