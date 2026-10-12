import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import ReadinessCalculator from '../services/ReadinessCalculator.js';
import { SKILL_ASSESSMENTS } from '../seed/skillAssessments.js';
import type { ICareerRequirement } from '../models/CareerRequirement.js';
import type { IUserSkill } from '../models/UserSkill.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Evidence basis of readiness: how much of the credited evidence was stated, self-reported,
 * assessed or inferred.
 */

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2023)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Shop API',
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  await new Promise(r => setTimeout(r, 150));
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

const requirement = (skillName: string, importance = 'required', weight = 1) => ({ skillName, importance, weight }) as unknown as ICareerRequirement;
const skill = (canonicalName: string, evidenceScore: number, evidences: Array<{ sourceType: string; points?: number }>) =>
  ({ skillId: { canonicalName, aliases: [] }, evidenceScore, evidences }) as unknown as IUserSkill;

export async function runReadinessBasisTests() {
  console.log('🧪 Running Readiness Evidence-Basis Tests...');

  // === Arithmetic =================================================================================
  const none = ReadinessCalculator.evidenceBasis([requirement('Docker'), requirement('Git', 'preferred')], []);
  assert.deepEqual(none, { assessed: null, selfReported: null, stated: null, inferred: null, requirementsTotal: 2, requirementsCovered: 0, requirementsAssessed: 0, requiredMissing: 1 }, 'nothing credited: no percentages are invented');

  const resumeOnly = ReadinessCalculator.evidenceBasis([requirement('Docker')], [skill('Docker', 35, [{ sourceType: 'resume_skills', points: 10 }, { sourceType: 'resume_projects', points: 25 }])]);
  assert.deepEqual([resumeOnly.assessed, resumeOnly.selfReported, resumeOnly.stated, resumeOnly.inferred], [0, 0, 100, 0]);

  // 10 stated + 25 portfolio + 15 assessed on one skill: 20%, 50%, 30%
  const mixed = ReadinessCalculator.evidenceBasis([requirement('Docker')], [skill('Docker', 50, [{ sourceType: 'resume_skills', points: 10 }, { sourceType: 'portfolio_project', points: 25 }, { sourceType: 'assessment', points: 15 }])]);
  assert.deepEqual([mixed.stated, mixed.selfReported, mixed.assessed, mixed.inferred, mixed.requirementsAssessed], [20, 50, 30, 0, 1]);

  // Weighted by importance: a required skill (x3) counts three times a supporting one
  const weighted = ReadinessCalculator.evidenceBasis(
    [requirement('Docker', 'required'), requirement('Git', 'supporting')],
    [skill('Docker', 50, [{ sourceType: 'assessment', points: 50 }]), skill('Git', 50, [{ sourceType: 'resume_skills', points: 50 }])]
  );
  assert.deepEqual([weighted.assessed, weighted.stated], [75, 25]);

  // A requirement met only through a related skill is "inferred", whatever backs that skill
  const inferred = ReadinessCalculator.evidenceBasis([requirement('SQL')], [skill('PostgreSQL', 50, [{ sourceType: 'assessment', points: 50 }])]);
  assert.deepEqual([inferred.inferred, inferred.assessed, inferred.requirementsAssessed], [100, 0, 0]);

  // Old records without stored points are treated as resume evidence; a 0-point confirmation adds no share
  const legacy = ReadinessCalculator.evidenceBasis([requirement('Docker')], [skill('Docker', 40, [{ sourceType: 'resume_experience' }, { sourceType: 'self_attested', points: 0 }])]);
  assert.equal(legacy.stated, 100);

  // Shares always add up to 100
  const thirds = ReadinessCalculator.evidenceBasis([requirement('Docker')], [skill('Docker', 30, [{ sourceType: 'resume_skills', points: 10 }, { sourceType: 'portfolio_project', points: 10 }, { sourceType: 'assessment', points: 10 }])]);
  assert.equal((thirds.assessed ?? 0) + (thirds.selfReported ?? 0) + (thirds.stated ?? 0) + (thirds.inferred ?? 0), 100);
  console.log('  ✓ Arithmetic: shares follow evidence points and requirement weight, add up to 100, and are absent when nothing is credited');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('alice');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);
    const readiness = async (title = 'Frontend Engineer') => ((await h.api('GET', '/readiness', { token: alice.token })).body.data.readiness as any[]).find(r => r.careerId.title === title);
    const total = (b: any) => b.assessed + b.selfReported + b.stated + b.inferred;

    const before = await readiness();
    assert.ok(before.evidenceBasis, 'the readiness record carries its evidence basis');
    assert.deepEqual([before.evidenceBasis.assessed, before.evidenceBasis.selfReported, before.evidenceBasis.requirementsAssessed], [0, 0, 0], 'a resume alone is all stated or inferred');
    assert.equal(total(before.evidenceBasis), 100);
    assert.ok(before.evidenceBasis.stated > 0);

    // A passed skill check moves part of the basis to "assessed"
    const attempt = (await h.api('POST', '/skills/assessments', { token: alice.token, json: { skill: 'JavaScript' } })).body.data.attempt;
    const answers = attempt.questions.map((q: any) => {
      const question = SKILL_ASSESSMENTS.JavaScript.find(b => b.prompt === q.prompt)!;
      return q.options.indexOf(question.options[question.answer]);
    });
    assert.equal((await h.api('POST', `/skills/assessments/${attempt.attemptId}/submit`, { token: alice.token, json: { answers } })).body.data.passed, true);
    const afterCheck = await readiness();
    assert.ok(afterCheck.evidenceBasis.assessed > 0 && afterCheck.evidenceBasis.requirementsAssessed === 1);
    assert.ok(afterCheck.evidenceBasis.stated < before.evidenceBasis.stated);
    assert.equal(total(afterCheck.evidenceBasis), 100);
    assert.ok(afterCheck.overallScore >= before.overallScore);

    // A portfolio entry with a link adds a self-reported share, never an assessed one
    const added = await h.api('POST', '/portfolio', { token: alice.token, json: { title: 'Typed dashboard', skills: ['TypeScript'], completedOn: new Date().toISOString().slice(0, 10), evidenceUrl: 'https://example.com/sam/dashboard' } });
    assert.equal(added.status, 201);
    const afterPortfolio = await readiness();
    assert.ok(afterPortfolio.evidenceBasis.selfReported > 0);
    assert.equal(afterPortfolio.evidenceBasis.requirementsAssessed, 1, 'a portfolio entry does not count as verified');
    assert.equal(total(afterPortfolio.evidenceBasis), 100);
    assert.equal(afterPortfolio.evidenceBasis.requirementsCovered, afterCheck.evidenceBasis.requirementsCovered + 1);
    console.log(`  ✓ Recalculated with the score: stated ${before.evidenceBasis.stated}% → ${afterPortfolio.evidenceBasis.stated}%, assessed ${afterPortfolio.evidenceBasis.assessed}%, self-reported ${afterPortfolio.evidenceBasis.selfReported}%, inferred ${afterPortfolio.evidenceBasis.inferred}%`);

    console.log('✅ Readiness Evidence-Basis Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runReadinessBasisTests();
    } catch (err) {
      console.error('❌ Readiness Basis Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
