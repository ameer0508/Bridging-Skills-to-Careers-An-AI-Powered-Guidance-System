import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runAuthTests } from './auth.test.js';
import { runOnboardingDomainTests } from './onboarding_domain.test.js';
import { runOpportunityTests } from './opportunities.test.js';
import { runInterviewTests } from './interviews.test.js';
import { runUnifiedOrchestrationTests } from './unified_orchestration.test.js';
import { runResumeDifferentialTest } from './resume_differential.test.js';
import { runSnapshotResilienceTests } from './snapshot_resilience.test.js';

async function runAll() {
  console.log('🚀 Starting Comprehensive SkillBridge Backend Test Suite...');
  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  try {
    await runAuthTests();
    await runOnboardingDomainTests();
    await runSnapshotResilienceTests();
    await runOpportunityTests();
    await runInterviewTests();
    await runUnifiedOrchestrationTests();
    await runResumeDifferentialTest();
    console.log('\n🎉 ALL BACKEND INTEGRATION & UNIT TESTS EXECUTED SUCCESSFULLY WITH ZERO FAILURES!');
  } catch (error) {
    console.error('\n❌ Test Suite Execution Failed:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runAll();
