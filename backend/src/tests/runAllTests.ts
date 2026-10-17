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
import { runResumeLifecycleTests } from './resume_lifecycle.test.js';
import { runInterviewQuestionTests } from './interview_questions.test.js';
import { runOpportunityTrackingTests } from './opportunity_tracking.test.js';
import { runChatReliabilityTests } from './chat_reliability.test.js';
import { runCorsOriginTests } from './cors_origin.test.js';
import { runAnalyticsAuthorizationTests } from './analytics_authorization.test.js';
import { runChatCapacityTests } from './chat_capacity.test.js';
import { runCareerExplanationTests } from './career_explanations.test.js';
import { runGuidanceExplanationTests } from './guidance_explanations.test.js';
import { runExplanationFlagTests } from './explanation_flag.test.js';
import { runInputValidationTests } from './input_validation.test.js';
import { runDiagnosticsAccessTests } from './diagnostics_access.test.js';
import { runCareerLabTests } from './career_lab.test.js';
import { runSkillAssessmentTests } from './skill_assessment.test.js';
import { runLearningPlanTests } from './learning_plan.test.js';
import { runLearningProjectTests } from './learning_projects.test.js';
import { runPortfolioTests } from './portfolio.test.js';
import { runLearningActivityTests } from './learning_activity.test.js';
import { runLearningResourceTests } from './learning_resources.test.js';
import { runNextBestActionTests } from './next_best_action.test.js';
import { runReadinessBasisTests } from './readiness_basis.test.js';
import { runPortfolioDedupTests } from './portfolio_dedup.test.js';
import { runCareerMarketTests } from './career_market.test.js';
import { runOnJobLiveListingsTests } from './onjob_live_listings.test.js';
import { runEmployerPostingTests } from './employer_postings.test.js';
import { runVoiceRetentionTests } from './voice_retention.test.js';
import { runInterviewIntegrationTests } from './interview_integration.test.js';
import { runJobFreshnessTests } from './job_freshness.test.js';
import { runCostPolicyTests } from './cost_policy.test.js';
import { runMarketIntelligenceTests } from './market_intelligence.test.js';
import { runZeroCostRuntimeTests } from './zero_cost_runtime.test.js';
import { runApplicationOutcomeTests } from './application_outcomes.test.js';
import { runMarketSkillTrendTests } from './market_skill_trends.test.js';
import { runMarketOpportunitySummaryTests } from './market_opportunity_summary.test.js';
import { runMarketSalaryTests } from './market_salaries.test.js';
import { runApplicationHistoryTests } from './application_history.test.js';
import { runMarketForecastTests } from './market_forecast.test.js';
import { runMarketSignalTests } from './market_signals.test.js';
import { runInterviewRubricTests } from './interview_rubrics.test.js';
import { runTechnicalAssessmentTests } from './technical_assessments.test.js';
import { runInterviewFollowUpTests } from './interview_followups.test.js';
import { runInterviewProgressTests } from './interview_progress.test.js';
import { runVoiceInterviewTests } from './voice_interviews.test.js';
import { runExamPrepTests } from './exam_prep.test.js';
import { runCareerDomainTests } from './career_domains.test.js';
import { runMultilingualTests } from './multilingual.test.js';
import { runInterviewQualityTests } from './interview_quality.test.js';
import { runAiObservabilityTests } from './ai_observability.test.js';
import { runSecuritySweepTests } from './security_sweep.test.js';
import { runAccountDeletionTests } from './account_deletion.test.js';
import { runApiReferenceTests } from './api_reference.test.js';

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
    await runResumeLifecycleTests();
    await runInterviewQuestionTests();
    await runOpportunityTrackingTests();
    await runChatReliabilityTests();
    await runCorsOriginTests();
    await runAnalyticsAuthorizationTests();
    await runChatCapacityTests();
    await runCareerExplanationTests();
    await runGuidanceExplanationTests();
    await runExplanationFlagTests();
    await runInputValidationTests();
    await runDiagnosticsAccessTests();
    await runCareerLabTests();
    await runSkillAssessmentTests();
    await runLearningPlanTests();
    await runLearningProjectTests();
    await runPortfolioTests();
    await runLearningActivityTests();
    await runLearningResourceTests();
    await runNextBestActionTests();
    await runReadinessBasisTests();
    await runCostPolicyTests();
    await runMarketIntelligenceTests();
    await runZeroCostRuntimeTests();
    await runApplicationOutcomeTests();
    await runMarketSkillTrendTests();
    await runMarketOpportunitySummaryTests();
    await runMarketSalaryTests();
    await runPortfolioDedupTests();
    await runCareerMarketTests();
    await runOnJobLiveListingsTests();
    await runEmployerPostingTests();
    await runApplicationHistoryTests();
    await runMarketForecastTests();
    await runMarketSignalTests();
    await runInterviewRubricTests();
    await runTechnicalAssessmentTests();
    await runInterviewFollowUpTests();
    await runInterviewProgressTests();
    await runVoiceInterviewTests();
    await runVoiceRetentionTests();
    await runInterviewIntegrationTests();
    await runJobFreshnessTests();
    await runExamPrepTests();
    await runCareerDomainTests();
    await runMultilingualTests();
    await runInterviewQualityTests();
    await runAiObservabilityTests();
    await runSecuritySweepTests();
    await runAccountDeletionTests();
    await runApiReferenceTests();
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
