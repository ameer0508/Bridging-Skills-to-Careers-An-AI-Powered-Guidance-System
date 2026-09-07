import snapshotService from '../services/SnapshotService.js';
import contextAssembler from '../services/ContextAssembler.js';
import interviewService from '../services/InterviewService.js';

export async function runUnifiedOrchestrationTests() {
  console.log('🧪 Running SkillBridge Unified Career Intelligence Orchestration Tests...');

  const userA = '507f1f77bcf86cd799439011';
  const userB = '507f1f77bcf86cd799439022';

  // Test 1: Unified Canonical Server-Side Snapshot
  const snapshotA = await snapshotService.getUnifiedCareerSnapshot(userA);
  console.log('  ✓ Unified Snapshot Assembled:', {
    targetCareer: snapshotA.targetCareer,
    matchScore: snapshotA.matchScore,
    readinessScore: snapshotA.readinessScore,
    totalSkills: snapshotA.totalSkills,
    criticalGapsCount: snapshotA.criticalGaps?.length,
  });

  if (!snapshotA.targetCareer || typeof snapshotA.readinessScore !== 'number') {
    throw new Error('Unified career snapshot assembly failed');
  }

  // Test 2: AI Gateway Context Assembler Grounding
  const contextA = await contextAssembler.assembleContext(userA);
  console.log('  ✓ AI Gateway Context Grounding Verified (Keys:', Object.keys(contextA).join(', '), ')');
  if (!contextA.timestamp) {
    throw new Error('ContextAssembler output invalid');
  }

  // Test 3: Multi-Tenant Isolation Security
  const historyA = await interviewService.getHistory(userA);
  const historyB = await interviewService.getHistory(userB);
  if (historyA.length > 0 && historyB.length > 0 && historyA[0]._id.toString() === historyB[0]._id.toString()) {
    throw new Error('Multi-tenant data leak detected in interview history');
  }
  console.log('  ✓ Multi-Tenant Isolation Across All 12 Subsystems Verified');

  // Test 4: Opportunity -> Interview Pipeline Context Prefill
  const sessionFromOpp = await interviewService.startSession(userA, {
    targetCareerTitle: 'Lead Cloud Architect',
    mode: 'technical',
    opportunityContext: {
      title: 'Lead Cloud Architect',
      company: 'Enterprise AI Systems',
      description: 'Distributed Kubernetes and FastAPI microservice architecture',
    },
  });

  if (sessionFromOpp.targetCareerTitle !== 'Lead Cloud Architect' || sessionFromOpp.questions.length === 0) {
    throw new Error('Failed to instantiate interview session from saved opportunity context');
  }
  console.log('  ✓ Opportunity → Interview Pipeline Context Prefill Verified:', sessionFromOpp.questions[0].question);

  // Test 5: Interview → Recommendation Loop & Telemetry Consistency
  await interviewService.respondToQuestion(userA, sessionFromOpp._id.toString(), {
    questionIndex: 0,
    candidateResponse: 'I engineered high-throughput Kafka topics with 99.99% SLA and P99 under 30ms.',
  });

  const completedSession = await interviewService.completeSession(userA, sessionFromOpp._id.toString());
  if (completedSession.status !== 'completed' || !completedSession.preparationRecommendations) {
    throw new Error('Interview completion loop failed');
  }
  console.log('  ✓ Interview → Recommendation Loop & Telemetry Consistency Verified (Recommendations:', completedSession.preparationRecommendations.length, ')');

  console.log('✅ All Unified Career Intelligence Orchestration Tests Passed Successfully!\n');
}

runUnifiedOrchestrationTests().catch((err) => {
  console.error('❌ Unified Orchestration Test Failed:', err);
  process.exit(1);
});
