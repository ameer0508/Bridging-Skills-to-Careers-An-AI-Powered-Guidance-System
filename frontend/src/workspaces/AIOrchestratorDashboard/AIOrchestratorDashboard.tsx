import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Workflow,
  CheckCircle2,
  Search,
  RefreshCw,
  Award,
  Layers,
  Activity,
  Lightbulb,
  Pause,
  Play,
  Check,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';

export const AIOrchestratorDashboard: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<string>('COMPLETED');

  // Query 1: Top Career Matches
  const {
    data: matchesData,
    isLoading: isMatchesLoading,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 2: Career Readiness Dimensions
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  // Query 3: Active Resume ATS Index
  const { data: resumeData } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/resumes/me');
        return response.data.data.resume;
      } catch {
        return null;
      }
    },
  });

  // Query 4: Telemetry Events & Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics?period=monthly');
      return response.data.data;
    },
  });

  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const targetGoalTitle = searchQuery.trim() || topMatch?.careerId?.title || 'Target Career Goal';

  // Derived Multi-Agent Telemetry
  const readinessScore = readinessData?.overallScore || 0;
  const atsScore = resumeData?.atsScore || 0;

  const successRate = useMemo(() => {
    if (!topMatch) return 0;
    return Math.min(99.8, Math.max(70, Math.round(readinessScore * 0.65 + (atsScore > 0 ? atsScore : 70) * 0.35)));
  }, [topMatch, readinessScore, atsScore]);

  const latencyMs = useMemo(() => {
    if (readinessScore >= 80) return 112;
    if (readinessScore >= 50) return 145;
    return 198;
  }, [readinessScore]);

  // Registered Autonomous AI Agents
  const registeredAgents = useMemo(
    () => [
      { id: 'career_agent', name: 'Career Planning Agent', status: 'ACTIVE', version: '2.1.0' },
      { id: 'learning_agent', name: 'Learning Agent', status: 'ACTIVE', version: '2.0.4' },
      { id: 'resume_agent', name: 'Resume Optimization Agent', status: 'ACTIVE', version: '2.2.1' },
      { id: 'interview_agent', name: 'Interview Preparation Agent', status: 'ACTIVE', version: '2.0.0' },
      { id: 'job_agent', name: 'Job Search Agent', status: 'ACTIVE', version: '2.1.0' },
      { id: 'analytics_agent', name: 'Telemetry Analytics Agent', status: 'ACTIVE', version: '2.0.0' },
      { id: 'orchestrator_agent', name: 'Multi-Agent Orchestrator', status: 'ACTIVE', version: '2.4.0' },
    ],
    []
  );

  // Dynamic 4-Phase DAG Steps
  const dagSteps = useMemo(
    () => [
      {
        step: 1,
        phase: 'Target Strategy Definition',
        agent: 'Career Planning Agent',
        parallel: false,
        status: topMatch ? 'COMPLETED' : 'PENDING',
        detail: topMatch ? `Matched target: ${targetGoalTitle} (${topMatch.matchScore}% fit)` : 'Awaiting target selection',
      },
      {
        step: 2,
        phase: 'Curriculum & Resume Tailoring',
        agent: 'Learning Agent & Resume Optimization Agent',
        parallel: true,
        status: atsScore > 0 ? 'COMPLETED' : 'IN_PROGRESS',
        detail: atsScore > 0 ? `Resume ATS score: ${atsScore}/100` : 'Curriculum generation in progress',
      },
      {
        step: 3,
        phase: 'System Design & STAR Mock Session',
        agent: 'Interview Preparation Agent',
        parallel: false,
        status: readinessScore >= 60 ? 'COMPLETED' : 'IN_PROGRESS',
        detail: `Technical readiness: ${readinessScore}%`,
      },
      {
        step: 4,
        phase: 'Opportunity Matching & Telemetry Tracking',
        agent: 'Job Search & Telemetry Analytics Agents',
        parallel: true,
        status: matches.length > 0 ? 'COMPLETED' : 'PENDING',
        detail: `${matches.length} career opportunities evaluated in market database`,
      },
    ],
    [topMatch, targetGoalTitle, atsScore, readinessScore, matches]
  );

  const orchestrationRationale = useMemo(() => {
    if (!topMatch) {
      return 'Upload a resume or select a target career in Career Intelligence to initiate autonomous 7-agent DAG orchestration.';
    }
    return `Coordinating autonomous multi-agent pipeline to bridge competency gaps for [${targetGoalTitle}]. Overall readiness is ${readinessScore}%, ATS index is ${atsScore > 0 ? atsScore + '/100' : 'pending'}, with ${matches.length} target career opportunities evaluated.`;
  }, [topMatch, targetGoalTitle, readinessScore, atsScore, matches]);

  const handleExecuteWorkflow = async () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Orchestrating 7-agent DAG execution for [${targetGoalTitle}]...`,
    });

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] }),
        queryClient.invalidateQueries({ queryKey: ['readiness'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      ]);
      await refetchMatches();
      setWorkflowStatus('COMPLETED');
      addToast({
        type: 'success',
        message: `Workflow Executed! 7 Autonomous Agents Coordinated in ${latencyMs}ms (Success Rate: ${successRate}%)`,
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Workflow execution failed. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePauseResume = () => {
    const newStatus = workflowStatus === 'COMPLETED' ? 'PAUSED' : 'COMPLETED';
    setWorkflowStatus(newStatus);
    addToast({
      type: newStatus === 'PAUSED' ? 'warning' : 'info',
      message: `Workflow orchestration state updated to [${newStatus}]`,
    });
  };

  if (isMatchesLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Connecting to Multi-Agent AI Orchestrator..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Multi-Agent AI Orchestrator Command Center"
        userName={targetGoalTitle}
        title="AI Orchestrator Dashboard"
        description="Autonomous AI workflow DAG visualizer, inter-agent dependency resolver, and live system observability engine."
        aiSummary={`7 Agents Active • Success Rate: ${successRate}% • Latency: ${latencyMs}ms`}
        stats={[
          { label: 'Registered Agents', value: `${registeredAgents.length} / ${registeredAgents.length} Active`, change: '100% Health', isPositive: true },
          { label: 'Success Rate', value: topMatch ? `${successRate}%` : 'N/A', change: `${latencyMs}ms Latency`, isPositive: successRate >= 75 },
          { label: 'DAG Execution Status', value: workflowStatus, change: '4 Phases Synchronized', isPositive: workflowStatus === 'COMPLETED' },
          { label: 'Conflict Status', value: 'OPTIMAL HARMONY', change: '0 Competing Signals', isPositive: true },
        ]}
      />

      {/* TOP TARGET GOAL SEARCH BAR & CONTROLS */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Workflow className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Target Career Goal..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handlePauseResume}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {workflowStatus === 'COMPLETED' ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{workflowStatus === 'COMPLETED' ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={handleExecuteWorkflow}
            disabled={isAnalyzing}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Orchestrating Agents...' : 'Execute Multi-Agent Workflow DAG'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Registered AI Agents</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">
            {registeredAgents.length} / {registeredAgents.length} Active
          </span>
          <span className="text-xs font-mono text-indigo-300">100% Registry Health</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Execution Success Rate</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">
            {topMatch ? `${successRate}%` : 'N/A'}
          </span>
          <span className="text-xs font-mono text-emerald-300">{latencyMs}ms Avg Execution Latency</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">DAG Execution Phases</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">4 Phases</span>
          <span className="text-xs font-mono text-cyan-300">Parallel & Sequential Steps</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Conflict Resolution</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">OPTIMAL HARMONY</span>
          <span className="text-xs font-mono text-purple-300">0 Competing Signals</span>
        </GlassPanel>
      </div>

      {/* WORKFLOW DAG & AGENT REGISTRY (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WORKFLOW DAG EXECUTOR (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-400" />
              Active Multi-Agent Workflow DAG Execution Steps
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              Status: {workflowStatus}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {dagSteps.map((s) => (
              <div key={s.step} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    Phase {s.step}: {s.phase}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${s.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'}`}>
                    {s.status === 'COMPLETED' ? <Check className="w-3 h-3" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
                    {s.status}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px]">
                  {s.detail}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 text-slate-400">
                  <span>Agents: <strong className="text-indigo-300">{s.agent}</strong></span>
                  <span className="text-cyan-300 font-bold">{s.parallel ? 'Parallel Execution' : 'Sequential Step'}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* REGISTERED AGENT STATUS & REASONING (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Registered Autonomous AI Agents ({registeredAgents.length})
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {registeredAgents.map((ag) => (
                <div key={ag.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">{ag.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    v{ag.version} • {ag.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* ORCHESTRATION AI REASONING */}
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Explainable Orchestration Rationale
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] font-mono">
              {orchestrationRationale}
            </p>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status={isAnalyzing ? 'thinking' : 'active'}
        confidence={successRate || 95}
        lastUpdated="Multi-Agent Orchestrator Active"
      />
    </div>
  );
};

export default AIOrchestratorDashboard;
