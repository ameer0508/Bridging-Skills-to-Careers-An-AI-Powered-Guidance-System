import React, { useState, useMemo } from 'react';
import {
  Bot,
  Target,
  Search,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Layers,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const CareerPlanningAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [userId, setUserId] = useState<string>('usr-agent-777');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Simulated Datasets
  const agentPlanMetrics = useMemo(
    () => ({
      targetRole: 'Principal AI Infrastructure Architect',
      targetSalaryUSD: 240000,
      targetHorizonMonths: 6,
      completionRatePercent: 88.5,
      readinessScore: 96.0,
      readinessTier: 'FAANG L6 Senior / Principal Ready',
      marketDemandPercent: 98.8,
      reasoningSummary:
        'Strategy prioritizes Vector DB Indexing & System Design based on 98.8% market demand for AI Infrastructure Architects.',
      quarterlyMilestones: [
        { quarter: 'Q3 2026', focus: 'Master Distributed Vector Indexing & RAG Systems', status: 'In Progress' },
        { quarter: 'Q4 2026', focus: 'Publish Open-Source Middleware & Execute System Design Interviews', status: 'Upcoming' },
      ],
      actionableTasks: [
        { id: 'tsk_01', title: 'Implement HNSW vector search benchmark script', category: 'System Design', status: 'Completed' },
        { id: 'tsk_02', title: 'Perform 3 LeetCode Hard Graph problems', category: 'DSA Practice', status: 'In Progress' },
        { id: 'tsk_03', title: 'Submit 1 PR to FastAPI core middleware repository', category: 'Open Source', status: 'Pending' },
      ],
    }),
    []
  );

  const handleRunAgent = (adapt: boolean = false) => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: adapt
        ? `Running autonomous adaptation for [${userId}] due to market trend shift...`
        : `Executing autonomous reasoning session for [${userId}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: adapt
          ? `Adapted Strategy! Rebalanced weekly milestone tasks with 0 target date shift.`
          : `Plan Generated! Target: Principal AI Infrastructure Architect ($240,000 USD)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Autonomous AI Career Planning Agent"
        subtitle="AUTONOMOUS REASONING, STRATEGY PLANNING, MARKET ADAPTATION, & TASK DECOMPOSITION ENGINE"
        badge="Career Agent"
        badgeColor="indigo"
        metrics={[
          { label: 'Target Career Goal', value: 'Principal Architect', change: '$240,000 USD Target', trend: 'up' },
          { label: 'Hiring Readiness', value: '96.0 / 100', change: 'FAANG L6 Ready', trend: 'up' },
          { label: 'Strategy Progress', value: '88.5%', change: '1.2 Milestones / Wk', trend: 'up' },
          { label: 'Market Demand', value: '98.8%', change: 'High Demand Surge', trend: 'up' },
        ]}
      />

      {/* TOP USER ID SEARCH BAR & CONTROLS */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleRunAgent(true)}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 font-mono"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Trigger Adaptation</span>
          </button>

          <button
            onClick={() => handleRunAgent(false)}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Planning Strategy...' : 'Run Agent Session'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* STRATEGY CANVAS & AI REASONING (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* STRATEGY CANVAS & MILESTONE TIMELINE (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Target Strategy & Milestone Timeline
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                88.5% Strategy Completion
              </span>
            </div>

            <div className="space-y-3">
              {agentPlanMetrics.quarterlyMilestones.map((m) => (
                <div key={m.quarter} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300">{m.quarter}</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded">
                      {m.status}
                    </span>
                  </div>
                  <span className="text-white font-bold block">{m.focus}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* ACTIONABLE WEEKLY PLANNER & TASKS */}
          <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Actionable Weekly Tasks ({agentPlanMetrics.actionableTasks.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {agentPlanMetrics.actionableTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${t.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-white font-bold">{t.title}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* AI REASONING & READINESS EVALUATION (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Explainable AI Strategy Reasoning
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono">
              <span className="text-purple-300 font-bold block">Why this strategy?</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {agentPlanMetrics.reasoningSummary}
              </p>
            </div>
          </GlassPanel>

          {/* READINESS EVALUATION */}
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Macro Hiring Readiness Evaluation
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold text-lg block">96.0 / 100</span>
              <span className="text-white font-bold block">{agentPlanMetrics.readinessTier}</span>
              <span className="text-[10px] text-slate-400 block">Target Compensation: $240,000 USD</span>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.8}
        lastUpdated="Career Agent Active"
      />
    </div>
  );
};

export default CareerPlanningAgentWorkspace;
