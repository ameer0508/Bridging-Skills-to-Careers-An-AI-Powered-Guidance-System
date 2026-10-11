import { assertIsolatedDatabase } from './setupEnv.js';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runAuthTests } from './auth.test.js';
import { runOnboardingDomainTests } from './onboarding_domain.test.js';
import { runOpportunityTests } from './opportunities.test.js';
import { runInterviewTests } from './interviews.test.js';
import { runUnifiedOrchestrationTests } from './unified_orchestration.test.js';
import { runResumeDifferentialTest } from './resume_differential.test.js';
import { runSnapshotResilienceTests } from './snapshot_resilience.test.js';
import { runOrchestratorServiceTests } from './orchestrator_service.test.js';
import { runCorePipelineTests } from './core_pipeline.test.js';
import { runApiIntegrationTests } from './api_integration.test.js';
import { runLegacyMigrationTests } from './legacy_migration.test.js';
import { runScoringAccuracyTests } from './scoring_accuracy.test.js';
import { runInterviewEvaluationTests } from './interview_evaluation.test.js';

async function runAll() {
  console.log('🚀 Starting Comprehensive SkillBridge Backend Test Suite...');
  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    assertIsolatedDatabase(mongoServer.getUri());
  }

  // Tripwire: the suite must never touch real developer data on disk.
  const protectedPaths = ['data/users_backup.json', 'data/local_db', 'uploads'].map(p =>
    path.resolve(process.cwd(), p)
  );
  const fingerprint = () =>
    protectedPaths.map(p => {
      if (!fs.existsSync(p)) return `${p}:absent`;
      const stat = fs.statSync(p);
      return `${p}:${stat.size}:${stat.mtimeMs}`;
    });
  const before = fingerprint();

  try {
    await runAuthTests();
    await runOnboardingDomainTests();
    await runSnapshotResilienceTests();
    await runOpportunityTests();
    await runInterviewTests();
    await runUnifiedOrchestrationTests();
    await runOrchestratorServiceTests();
    await runResumeDifferentialTest();
    await runCorePipelineTests();
    await runApiIntegrationTests();
    await runLegacyMigrationTests();
    await runScoringAccuracyTests();
    await runInterviewEvaluationTests();
    const after = fingerprint();
    const touched = before.filter((entry, i) => entry !== after[i]);
    if (touched.length > 0) {
      throw new Error(
        `Test isolation breach: real data paths changed during the run: ${touched.join(', ')}`
      );
    }
    console.log('  ✓ Isolation verified: real backup file, local database and uploads untouched');
    console.log('\n🎉 All backend test suites passed.');
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
