// API contract for /api/v1/orchestrator. Mirrors backend/src/services/OrchestratorService.ts;
// the frontend must not import backend source files directly.

export interface IAgentMetadata {
  id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'READY' | 'RUNNING' | 'IDLE';
  route: string;
  category: 'CORE' | 'ANALYSIS' | 'PREPARATION' | 'DISCOVERY';
  purpose: string;
  capabilities: string[];
  inputContracts: string[];
  outputContracts: string[];
  tools: string[];
  upstreamDependencies: string[];
  downstreamDependents: string[];
  candidateContext: Record<string, unknown>;
}

export interface IDAGStep {
  step: number;
  phaseTitle: string;
  agentId: string;
  agentName: string;
  action: string;
  parallel: boolean;
  status: 'COMPLETED' | 'RUNNING' | 'PENDING' | 'FAILED';
  /** Per-step timing is not measured (all steps read one snapshot), so this is null. */
  durationMs: number | null;
  payloadSummary: Record<string, unknown>;
  outputResult: string;
}

export interface IWorkflowExecution {
  workflowId: string;
  userId: string;
  goal: string;
  targetCompany: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  /** Plain statement of what this run did and did not do. */
  notice: string;
  dagPhases: IDAGStep[];
  sanitizedPayload: Record<string, unknown>;
  orchestrationReasoning: string;
  followUpActions: Array<{
    title: string;
    description: string;
    route: string;
    agentId: string;
  }>;
}
