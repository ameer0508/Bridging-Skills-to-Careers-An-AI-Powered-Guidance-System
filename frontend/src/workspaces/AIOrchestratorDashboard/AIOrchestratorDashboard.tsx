import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';
import {
  OrchestratorCommandDeck,
  AgentTopologyNetwork,
  AgentSubsystemInspector,
  DAGExecutionCenter,
  OrchestrationAuditLog,
} from '../../features/orchestrator/components';
import {
  IAgentMetadata,
  IWorkflowExecution,
} from '../../types/orchestrator';

export const AIOrchestratorDashboard: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Management
  const [goalQuery, setGoalQuery] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('OpenScale AI Systems');
  const [selectedAgent, setSelectedAgent] = useState<IAgentMetadata | null>(null);
  const [currentExecution, setCurrentExecution] = useState<IWorkflowExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETED'>('COMPLETED');

  // Query 1: Real Registered Autonomous Agents
  const {
    data: agentsData,
    isLoading: isAgentsLoading,
  } = useQuery({
    queryKey: ['orchestrator', 'agents'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/orchestrator/agents');
        return response.data.data.agents as IAgentMetadata[];
      } catch {
        // Fallback default definitions if server degraded
        return [] as IAgentMetadata[];
      }
    },
  });

  // Query 2: Real Workflow History & Living Event Stream
  const {
    data: historyData,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['orchestrator', 'history'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/orchestrator/history');
        return response.data.data;
      } catch {
        return { executions: [], recentEvents: [] };
      }
    },
  });

  // Query 3: Top Career Matches for Default Goal Grounding
  const { data: matchesData } = useQuery({
    // The bare list is cached under its own key: ['careers', 'matches'] holds { matches }
    queryKey: ['careers', 'matches', 'list'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/careers/matches');
        return response.data.data.matches || [];
      } catch {
        return [];
      }
    },
  });


  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const topCareerTitle = topMatch?.careerId?.title || '';

  // Derived Telemetry
  const agentsList: IAgentMetadata[] = useMemo(() => {
    if (agentsData && agentsData.length > 0) return agentsData;
    return [
      {
        id: 'orchestrator',
        name: 'Multi-Agent Orchestrator',
        version: '2.4.0',
        status: 'ACTIVE',
        route: '/orchestrator',
        category: 'CORE',
        purpose: 'Coordinates multi-agent DAG workflows, task scheduling, and conflict arbitration.',
        capabilities: ['4-Phase DAG Workflow Execution', 'Inter-Agent Dependency Resolution'],
        inputContracts: ['User Career Goal', 'Candidate Snapshot State'],
        outputContracts: ['Synthesized Strategy Plan', 'Task Execution DAG'],
        tools: ['TaskPlanner', 'DependencyManager', 'ExecutionScheduler'],
        upstreamDependencies: [],
        downstreamDependents: ['career_agent', 'skill_agent', 'interview_agent'],
        candidateContext: { targetCareer: topCareerTitle },
      },
    ] as IAgentMetadata[];
  }, [agentsData, topCareerTitle]);

  const activeAgentsCount = agentsList.filter((a) => a.status === 'ACTIVE').length;
  const latestLatency = currentExecution?.latencyMs ?? 0;

  // Handler: Execute Multi-Agent Workflow DAG
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setWorkflowStatus('RUNNING');

    addToast({
      type: 'info',
      message: `Dispatching 4-phase DAG execution for [${goalQuery}]...`,
    });

    try {
      const response = await apiClient.post('/orchestrator/execute', {
        goal: goalQuery,
        targetCompany,
      });

      const execResult: IWorkflowExecution = response.data.data;
      setCurrentExecution(execResult);
      setWorkflowStatus('COMPLETED');
      refetchHistory();

      // Refresh cross-subsystem queries
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });

      addToast({
        type: 'success',
        message: `DAG Executed! 4 Phases & ${execResult.dagPhases.length} steps synchronized in ${execResult.latencyMs}ms.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Orchestration execution failed';
      setWorkflowStatus('IDLE');
      addToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Handler: Select execution from history to inspect
  const handleSelectExecution = (exec: IWorkflowExecution) => {
    setCurrentExecution(exec);
    setGoalQuery(exec.goal);
    setTargetCompany(exec.targetCompany);
  };

  if (isAgentsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 tabular-nums">
        <div className="p-12 rounded-2xl border border-aurora-line bg-aurora-canvas/60 flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Loading the module overview" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 px-4 tabular-nums">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Overview"
        title="Module Overview"
        description="A module-by-module overview of your stored SkillBridge data: career match, skills, readiness, roadmap, jobs and interviews. It summarises saved results and does not run autonomous AI agents."
        aiSummary={`${activeAgentsCount} modules summarised`}
        stats={[
          {
            label: 'Modules',
            value: `${agentsList.length}`,
            change: 'Each summarises one area of your data',
            isPositive: true,
          },
          {
            label: 'Last summary',
            value: !currentExecution ? 'Not run yet' : workflowStatus === 'RUNNING' ? 'Writing…' : 'Completed',
            change: currentExecution ? `Took ${latestLatency} ms` : 'Write one below',
            isPositive: true,
          },
        ]}
      />

      {/* AI STATUS BAR */}
      <AIStatusBar status="idle" provider="Summary of your stored data (no AI model is run here)" />

      {/* LAYER 01 — ORCHESTRATOR COMMAND DECK */}
      <OrchestratorCommandDeck
        goalQuery={goalQuery}
        onGoalChange={setGoalQuery}
        targetCompany={targetCompany}
        onCompanyChange={setTargetCompany}
        isExecuting={isExecuting}
        onExecute={handleExecuteWorkflow}
        activeAgentsCount={activeAgentsCount}
        totalAgentsCount={agentsList.length}
        latestLatencyMs={latestLatency}
        workflowStatus={workflowStatus}
      />

      {/* LAYER 02 — LIVING AGENT TOPOLOGY NETWORK */}
      <AgentTopologyNetwork
        agents={agentsList}
        selectedAgentId={selectedAgent?.id || null}
        onSelectAgent={setSelectedAgent}
        isExecuting={isExecuting}
      />

      {/* LAYER 03 — AGENT SUBSYSTEM INSPECTOR (MODAL DRAWER) */}
      {selectedAgent && (
        <AgentSubsystemInspector
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onNavigateToSubsystem={(route) => navigate(route)}
        />
      )}

      {/* LAYER 04 — ACTIVE DAG EXECUTION CENTER */}
      <DAGExecutionCenter
        execution={currentExecution}
        onNavigateToAction={(route) => navigate(route)}
      />

      {/* LAYER 05 — INTELLIGENCE AUDIT LOG & WORKFLOW HISTORY */}
      <OrchestrationAuditLog
        executions={historyData?.executions || []}
        recentEvents={historyData?.recentEvents || []}
        onSelectExecution={handleSelectExecution}
      />
    </div>
  );
};

export default AIOrchestratorDashboard;
