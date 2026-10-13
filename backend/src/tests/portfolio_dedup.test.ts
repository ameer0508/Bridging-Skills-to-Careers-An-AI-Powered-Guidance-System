import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import PortfolioService from '../services/PortfolioService.js';
import { PortfolioEntry } from '../models/PortfolioEntry.js';
import { EVIDENCE_POINTS } from '../services/EvidenceCalculator.js';
import { creditedProjectKeys, linkIdentitiesIn, linkIdentity, linkKey, projectKey, repoKey } from '../utils/projectIdentity.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * One project, one credit: the same project on the resume and in the portfolio (or in two
 * portfolio entries) earns project points once per skill, and no record is deleted to achieve it.
 */

const resume = (projectName: string) =>
  [
    'Sam Candidate',
    'Email: sam.candidate@example.com',
    '',
    'Experience:',
    'Frontend Developer at Example Co (2022-2023)',
    'Built dashboards with React, JavaScript, HTML and CSS.',
    '',
    'Projects:',
    projectName,
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

const [FIRST, SECOND] = EVIDENCE_POINTS.projects;
const LISTED = EVIDENCE_POINTS.listed;
const today = new Date().toISOString().slice(0, 10);

export async function runPortfolioDedupTests() {
  console.log('🧪 Running Project De-duplication Tests...');

  // === Matching rule ============================================================================
  assert.equal(projectKey('Shop API'), 'shopapi');
  assert.equal(projectKey('  shop-api!  '), 'shopapi', 'case, spacing and punctuation do not matter');
  assert.notEqual(projectKey('Shop API v2'), projectKey('Shop API'), 'a different title is a different project');
  assert.equal(projectKey('API'), null, 'a very short title is never used to merge projects');
  assert.equal(projectKey(''), null);
  assert.equal(linkKey('https://www.Example.com/sam/shop-api/?tab=readme#top'), 'example.com/sam/shop-api');
  assert.equal(linkKey('https://example.com/sam/shop-api'), linkKey('https://www.example.com/sam/shop-api/'));
  assert.notEqual(linkKey('https://example.com/sam/shop-api'), linkKey('https://example.com/sam/other'));
  assert.equal(linkKey(null), null);
  assert.deepEqual(
    [...creditedProjectKeys([
      { sourceType: 'resume_projects', description: 'Applied in project: Shop API', points: 25 },
      { sourceType: 'resume_projects', description: 'Applied in project: old', label: 'Legacy Tool', points: 10 },
      { sourceType: 'portfolio_project', description: 'x', label: 'Uncredited one', points: 0 },
      { sourceType: 'resume_skills', description: 'Mentioned in the resume', points: 10 }
    ])].sort(),
    ['legacytool', 'shopapi'],
    'only projects that earn points count, including records that carry the title only in their description'
  );
  // Repository identity: every way of linking one repository is one project; folders of a monorepo are not
  for (const url of ['https://github.com/Sam/Shop-API', 'http://www.github.com/sam/shop-api/', 'https://github.com/sam/shop-api.git', 'https://github.com/sam/shop-api/tree/main', 'https://github.com/sam/shop-api/blob/main/README.md', 'https://sam.github.io/shop-api/']) {
    assert.equal(repoKey(url), 'github.com/sam/shop-api', url);
  }
  assert.equal(repoKey('https://github.com/sam/mono/tree/main/app-a'), 'github.com/sam/mono/app-a');
  assert.notEqual(repoKey('https://github.com/sam/mono/tree/main/app-a'), repoKey('https://github.com/sam/mono/tree/main/app-b'), 'two folders of a monorepo are two projects');
  assert.notEqual(repoKey('https://github.com/sam/mono/tree/main/app-a'), repoKey('https://github.com/sam/mono'));
  assert.notEqual(repoKey('https://github.com/sam/shop-api'), repoKey('https://github.com/alex/shop-api'), 'the same name under another owner is another project');
  assert.equal(repoKey('https://sam.github.io'), 'github.com/sam/sam.github.io');
  assert.equal(repoKey('https://github.com/sam'), null, 'a profile is not a project');
  assert.equal(repoKey('https://example.com/sam/shop-api'), null);
  assert.equal(linkIdentity('https://example.com/sam/shop-api'), 'example.com/sam/shop-api', 'other sites fall back to host and path');
  assert.deepEqual(linkIdentitiesIn('Code at github.com/sam/shop-api, live at https://shop.example.com/app.').sort(), ['github.com/sam/shop-api', 'shop.example.com/app']);
  console.log('  ✓ Matching: equal titles after normalisation, or links to the same repository or page; short titles, different wording, other owners and monorepo folders are never merged');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('alice');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(resume('Shop API')) })).status));
    await waitForResume(h, alice.token);

    const score = async (name: string) => ((await h.api('GET', '/skills/freshness', { token: alice.token })).body.data.skills as any[]).find(s => s.name === name)?.evidenceScore ?? null;
    const entries = async () => (await h.api('GET', '/portfolio', { token: alice.token })).body.data.entries as any[];
    const skillOf = (entry: any, name: string) => entry.skills.find((s: any) => s.skill === name);
    const whatIf = async (name: string, skills: string[]) =>
      Object.fromEntries(((await h.api('POST', '/careers/what-if', { token: alice.token, json: { changes: [{ type: 'add_project', skills, name }] } })).body.data.hypotheticalSkills as any[]).map(s => [s.name, s.evidenceScore]));
    const add = (json: Record<string, unknown>) => h.api('POST', '/portfolio', { token: alice.token, json: { completedOn: today, ...json } });
    assert.equal(await score('Node.js'), LISTED + FIRST);

    // === The same project in the resume and the portfolio =========================================
    const predictedSame = await whatIf('Shop API', ['Node.js', 'Docker']);
    assert.equal(predictedSame['Node.js'], undefined, 'what-if: the project is already credited for Node.js, so nothing changes for it');
    const same = await add({ title: 'shop-api!', skills: ['Node.js', 'Docker'], evidenceUrl: 'https://example.com/sam/shop-api' });
    assert.equal(same.status, 201);
    assert.deepEqual(
      same.body.data.entry.skills.map((s: any) => [s.skill, s.points, s.countedElsewhere]),
      [['Node.js', 0, 'resume_project'], ['Docker', FIRST, null]],
      'no second credit for Node.js; Docker, which the resume project did not credit, counts'
    );
    assert.equal(await score('Node.js'), LISTED + FIRST, 'the resume project is not counted twice');
    assert.equal(await score('Docker'), FIRST);
    assert.equal(predictedSame.Docker, LISTED + FIRST, 'the what-if figure for a skill new to the profile includes the resume listing points (documented difference)');

    // === A different project counts =================================================================
    const predictedOther = await whatIf('Deploy tool', ['Node.js']);
    const other = await add({ title: 'Deploy tool', skills: ['Node.js'], evidenceUrl: 'https://example.com/sam/deploy-tool' });
    assert.deepEqual(skillOf(other.body.data.entry, 'Node.js'), { skill: 'Node.js', points: SECOND, countedElsewhere: null, countedElsewhereBecause: null, verifiedBySkillCheck: false });
    assert.equal(await score('Node.js'), LISTED + FIRST + SECOND);
    assert.equal(predictedOther['Node.js'], LISTED + FIRST + SECOND, 'what-if predicted exactly this');

    // === Saving the same entry twice is not a second project ======================================
    for (let i = 0; i < 2; i++) {
      const again = await h.api('PUT', `/portfolio/${other.body.data.entry.id}`, { token: alice.token, json: { title: 'Deploy tool', skills: ['Node.js'], completedOn: today, evidenceUrl: 'https://example.com/sam/deploy-tool' } });
      assert.equal(again.body.data.recalculation.status, 'skipped_duplicate');
    }
    assert.equal(await score('Node.js'), LISTED + FIRST + SECOND);

    // === The same work under another title, or the same title with another link ===================
    const sameLink = await add({ title: 'Deployment helper', skills: ['Node.js'], evidenceUrl: 'https://www.example.com/sam/deploy-tool/' });
    assert.deepEqual([skillOf(sameLink.body.data.entry, 'Node.js').points, skillOf(sameLink.body.data.entry, 'Node.js').countedElsewhere], [0, 'portfolio_entry'], 'the same link is the same project');
    const sameTitle = await add({ title: 'DEPLOY TOOL', skills: ['Node.js', 'Git'], evidenceUrl: 'https://example.com/sam/mirror' });
    assert.deepEqual(sameTitle.body.data.entry.skills.map((s: any) => [s.skill, s.points, s.countedElsewhere]), [['Node.js', 0, 'portfolio_entry'], ['Git', SECOND, null]]);
    assert.equal(await score('Node.js'), LISTED + FIRST + SECOND, 'four portfolio records, two projects, two credits');
    assert.equal((await entries()).length, 4, 'every record is kept');
    console.log(`  ✓ Credit: resume + same portfolio project = ${LISTED + FIRST}; a different project adds ${SECOND}; repeats by title or link add nothing; what-if agrees`);

    // === Idempotence =================================================================================
    const before = JSON.stringify((await h.api('GET', '/skills/me', { token: alice.token })).body.data);
    assert.equal(await PortfolioService.syncEvidence(alice.userId), false, 'rebuilding the evidence again changes nothing');
    assert.equal(await PortfolioService.syncEvidence(alice.userId), false);
    const { default: RecalculationService } = await import('../services/RecalculationService.js');
    assert.equal((await RecalculationService.run(alice.userId, 'skill_evidence_changed')).status, 'skipped_duplicate');
    const after = JSON.parse(JSON.stringify((await h.api('GET', '/skills/me', { token: alice.token })).body.data));
    assert.deepEqual(after.totalSkills, JSON.parse(before).totalSkills);
    assert.equal(await score('Node.js'), LISTED + FIRST + SECOND);

    // === Replacing the resume moves the credit, it does not lose or double it ======================
    // The new resume calls its project "Deploy tool": now that one is on the resume and "Shop API" is not
    assert.ok([200, 201].includes((await h.api('PUT', '/resumes/replace', { token: alice.token, form: resumeForm(resume('Deploy tool')) })).status));
    await waitForResume(h, alice.token);
    let list = await entries();
    const byTitle = (title: string) => list.find(e => e.title === title);
    assert.deepEqual([skillOf(byTitle('shop-api!'), 'Node.js').points, skillOf(byTitle('shop-api!'), 'Node.js').countedElsewhere], [SECOND, null], 'no longer on the resume, so the portfolio entry is credited');
    assert.deepEqual([skillOf(byTitle('Deploy tool'), 'Node.js').points, skillOf(byTitle('Deploy tool'), 'Node.js').countedElsewhere], [0, 'resume_project']);
    assert.deepEqual([skillOf(byTitle('Deployment helper'), 'Node.js').points, skillOf(byTitle('Deployment helper'), 'Node.js').countedElsewhere], [0, 'portfolio_entry'], 'its link is the resume project\'s portfolio twin');
    assert.equal(await score('Node.js'), LISTED + FIRST + SECOND, 'still two projects, two credits');
    assert.equal(list.length, 4);

    // === Deleting the resume leaves the portfolio, credited once per project =======================
    assert.equal((await h.api('DELETE', '/resumes', { token: alice.token })).status, 200);
    list = await entries();
    assert.equal(list.length, 4, 'deleting the resume deletes no portfolio entry');
    const credits = list.map(e => [e.title, skillOf(e, 'Node.js').points]).sort();
    assert.equal(credits.filter(([, points]) => points > 0).length, 2, `two distinct projects are credited: ${JSON.stringify(credits)}`);
    assert.equal(await score('Node.js'), FIRST + SECOND, 'first and second project, no resume listing points');
    assert.equal(await PortfolioEntry.countDocuments({ userId: alice.userId }), 4);
    assert.equal(await PortfolioService.syncEvidence(alice.userId), false);
    console.log('  ✓ Lifecycle: idempotent; replacing the resume moves the credit to whichever record is not a repeat; deleting the resume keeps every entry and credits each project once');

    // === Adversarial: the same project renamed, linked differently ===============================
    const bob = await h.registerUser('bob-dedup');
    const bobResume = ['Bob Builder', 'Email: bob@example.com', '', 'Projects:', 'Inventory Service', 'Stock API in Node.js; code at github.com/bob/inventory-svc', '', 'Skills:', 'Node.js, Git'].join('\n');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: bob.token, form: resumeForm(bobResume) })).status));
    await waitForResume(h, bob.token);
    const bobAdd = (json: Record<string, unknown>) => h.api('POST', '/portfolio', { token: bob.token, json: { completedOn: today, ...json } });
    const bobScore = async () => ((await h.api('GET', '/skills/freshness', { token: bob.token })).body.data.skills as any[]).find(s => s.name === 'Node.js')?.evidenceScore;
    const baseline = await bobScore();
    // Renamed, and linked through its GitHub Pages site: still the resume's project
    const renamed = await bobAdd({ title: 'Warehouse stock API', skills: ['Node.js'], evidenceUrl: 'https://bob.github.io/inventory-svc/' });
    assert.deepEqual([skillOf(renamed.body.data.entry, 'Node.js').points, skillOf(renamed.body.data.entry, 'Node.js').countedElsewhere, skillOf(renamed.body.data.entry, 'Node.js').countedElsewhereBecause], [0, 'resume_project', 'same_link'], 'a renamed copy that links to the same repository earns nothing');
    assert.equal(await bobScore(), baseline);
    // A folder of that repository is a different project (monorepos hold several): credited
    const folder = await bobAdd({ title: 'Stock dashboard', skills: ['Node.js'], evidenceUrl: 'https://github.com/bob/inventory-svc/tree/main/dashboard' });
    assert.equal(skillOf(folder.body.data.entry, 'Node.js').countedElsewhere, null, 'not merged on a shared repository alone');
    // The same repository written another way, under another title: one credit
    const chat = await bobAdd({ title: 'Chat app', skills: ['Node.js'], evidenceUrl: 'https://github.com/bob/chat-app' });
    const chatAgain = await bobAdd({ title: 'Realtime messenger', skills: ['Node.js'], evidenceUrl: 'https://www.github.com/Bob/Chat-App.git' });
    assert.ok(skillOf(chat.body.data.entry, 'Node.js').points > 0);
    assert.deepEqual([skillOf(chatAgain.body.data.entry, 'Node.js').points, skillOf(chatAgain.body.data.entry, 'Node.js').countedElsewhere, skillOf(chatAgain.body.data.entry, 'Node.js').countedElsewhereBecause], [0, 'portfolio_entry', 'same_link']);
    // Different title and unrelated link: nothing says it is the same work, so it counts (known limit)
    const unrelated = await bobAdd({ title: 'Payroll exporter', skills: ['Node.js'], evidenceUrl: 'https://gitlab.com/bob/payroll-exporter' });
    assert.equal(skillOf(unrelated.body.data.entry, 'Node.js').countedElsewhere, null);
    assert.equal((await h.api('GET', '/portfolio', { token: bob.token })).body.data.entries.length, 5, 'every record is kept');
    assert.equal(await PortfolioService.syncEvidence(bob.userId), false, 'idempotent');
    console.log('  ✓ Adversarial: a renamed copy linking the same repository (via its Pages site) and a re-cased .git link are counted once with the reason shown; a monorepo folder and unrelated work are credited; nothing deleted');

    console.log('✅ Project De-duplication Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runPortfolioDedupTests();
    } catch (err) {
      console.error('❌ De-duplication Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
