import './setupEnv.js';
import orchestratorService from '../services/OrchestratorService.js';

export async function runOrchestratorServiceTests() {
  console.log('🧪 Running AI Orchestrator Service & DAG Execution Tests...');

  const testUserId = '507f1f77bcf86cd799439011';

  // Test 1: Registered Agents Discovery
  const agents = await orchestratorService.getRegisteredAgents(testUserId);
  console.log(`  ✓ Discovered ${agents.length} Registered Autonomous AI Agents:`, agents.map(a => a.id).join(', '));
  if (agents.length !== 10) {
    throw new Error(`Expected exactly 10 registered agents, got ${agents.length}`);
  }

  const orchestratorAgent = agents.find(a => a.id === 'orchestrator');
  if (!orchestratorAgent || orchestratorAgent.status !== 'ACTIVE') {
    throw new Error('Orchestrator agent metadata missing or inactive');
  }

  // Test 2: 4-Phase DAG Workflow Execution
  const execution = await orchestratorService.executeWorkflow(
    testUserId,
    'Principal Cloud AI Architect',
    'OpenScale AI Systems'
  );

  console.log('  ✓ 4-Phase DAG Workflow Executed Successfully:', {
    workflowId: execution.workflowId,
    status: execution.status,
    latencyMs: execution.latencyMs,
    phasesCount: execution.dagPhases.length,
    reasoningLength: execution.orchestrationReasoning.length,
    followUpActionsCount: execution.followUpActions.length,
  });

  if (execution.status !== 'COMPLETED' || execution.dagPhases.length < 4) {
    throw new Error('DAG Workflow execution returned invalid phase status');
  }

  // Test 3: Verify Parallel vs Sequential Steps
  const step2Steps = execution.dagPhases.filter(p => p.step === 2);
  if (step2Steps.length < 2 || !step2Steps.every(s => s.parallel)) {
    throw new Error('Phase 2 steps expected to be parallel execution');
  }
  console.log('  ✓ Parallel Execution Verified for Phase 2 (Skill & Resume Agents)');

  // Test 4: History Retrieval
  const history = await orchestratorService.getHistory(testUserId);
  if (!history.executions || history.executions.length === 0) {
    throw new Error('Workflow execution was not recorded in history');
  }
  console.log(`  ✓ Workflow Execution History Verified (${history.executions.length} recorded run)`);

  console.log('✅ All AI Orchestrator Service Tests Passed Cleanly!\n');
}

// Auto-run if executed directly
if (process.argv[1]?.includes('orchestrator_service.test')) {
  runOrchestratorServiceTests().catch((err) => {
    console.error('❌ Orchestrator Service Test Failed:', err);
    process.exit(1);
  });
}
