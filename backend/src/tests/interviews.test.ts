import interviewService from '../services/InterviewService.js';

export async function runInterviewTests() {
  console.log('🧪 Running Interview Intelligence Infrastructure Tests...');

  const testUserId = '507f1f77bcf86cd799439011';
  const unauthorizedUserId = '507f1f77bcf86cd799439022';

  // Test 1: Start Grounded Interview Session
  const session = await interviewService.startSession(testUserId, {
    targetCareerTitle: 'Senior Full Stack Architect',
    mode: 'technical',
    questionCount: 3,
  });

  console.log('  ✓ Grounded Session Initialized:', session._id, 'Role:', session.targetCareerTitle);
  if (!session._id || session.questions.length === 0) {
    throw new Error('Failed to initialize interview session');
  }

  // Test 2: Multi-Tenant Access Security
  try {
    await interviewService.getSession(unauthorizedUserId, session._id.toString());
    throw new Error('Unauthorized user was incorrectly granted access to interview session');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (!msg.includes('Interview session not found or access denied')) {
      throw new Error(`Unexpected error message for unauthorized session access: ${msg}`);
    }
  }
  console.log('  ✓ Multi-Tenant Session Isolation Security Verified');

  // Test 3: Candidate Response Evaluation
  const updatedSession = await interviewService.respondToQuestion(testUserId, session._id.toString(), {
    questionIndex: 0,
    candidateResponse:
      'I architected a high-throughput microservice in TypeScript and FastAPI with Redis caching, which reduced end-to-end P99 latency by 45% and handled over 50,000 requests per second under peak load.',
  });

  const evaluatedQ = updatedSession.questions[0];
  if (!evaluatedQ.evaluation || typeof evaluatedQ.evaluation.score !== 'number') {
    throw new Error('Failed to evaluate candidate response');
  }
  console.log('  ✓ Response Evaluated (Score:', evaluatedQ.evaluation.score, '/ 100, STAR Compliant:', evaluatedQ.evaluation.starFormatted, ')');

  // Test 4: Complete Session & Calculate Overall Score
  const completedSession = await interviewService.completeSession(testUserId, session._id.toString());
  if (completedSession.status !== 'completed' || typeof completedSession.overallScore !== 'number') {
    throw new Error('Session completion or score calculation failed');
  }
  console.log('  ✓ Session Completed (Overall Score:', completedSession.overallScore, '%)');

  // Test 5: Verify Report Generation
  if (!completedSession.preparationRecommendations || completedSession.preparationRecommendations.length === 0) {
    throw new Error('Post-interview preparation recommendations missing');
  }
  console.log('  ✓ Grounded Preparation Recommendations Generated (Count:', completedSession.preparationRecommendations.length, ')');

  // Test 6: Retrieve Session History
  const history = await interviewService.getHistory(testUserId);
  console.log(`  ✓ Session History Retrieved (${history.length} persistent sessions)`);

  console.log('✅ All Interview Intelligence Tests Passed Successfully!\n');
}

runInterviewTests().catch((err) => {
  console.error('❌ Interview Test Failed:', err);
  process.exit(1);
});
