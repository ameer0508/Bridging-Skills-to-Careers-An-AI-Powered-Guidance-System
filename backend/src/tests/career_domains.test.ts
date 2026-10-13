import './setupEnv.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { CAREER_DOMAIN_CATALOGUE, E1_LEXICON_SKILLS, ONET_ATTRIBUTION } from '../seed/careerDomainCatalogue.js';
import { LEARNING_RESOURCES } from '../seed/learningResources.js';
import { PROJECT_BRIEFS } from '../seed/projectBriefs.js';
import { SKILL_LEXICON_VERSION } from '../seed/skillLexicon.js';
import { extractSkills, impliedSkills, lookupSkill } from '../utils/skillLexicon.js';
import { Skill } from '../models/Skill.js';
import Career from '../models/Career.js';
import UserSkill from '../models/UserSkill.js';
import CareerMatch from '../models/CareerMatch.js';
import RecalculationRun from '../models/RecalculationRun.js';
import CareerRequirement from '../models/CareerRequirement.js';
import { CareerScoringEngine } from '../services/CareerScoringEngine.js';
import CareerService from '../services/CareerService.js';
import RecommendationService from '../services/RecommendationService.js';
import RecalculationService from '../services/RecalculationService.js';
import { refreshUsersForTaxonomy, staleUserIds } from '../services/careers/TaxonomyRefreshService.js';
import { taxonomyVersion } from '../utils/versions.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * E1 additional career domains, integrated: the six O*NET-informed careers are in the shared
 * taxonomy and lexicon and work across matching, readiness, roadmaps, learning resources and
 * practice projects; the original fourteen careers are byte-for-byte unchanged; existing users are
 * recomputed once without touching their evidence; provenance and the US-source caveat are served.
 */

/** sha256 (first 16 hex) of the fourteen original careers as they were before E1. */
const ORIGINAL_FOURTEEN_HASH = 'f893cd3244e27676';
const hash = (x: unknown) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

/** A profile per new career: its required skills and most preferred ones, nothing else. */
const PROFILES: Record<string, string[]> = {
  'QA Automation Engineer': ['Testing', 'Selenium', 'Playwright', 'Python', 'Java', 'Git', 'Postman', 'Jenkins'],
  'Data Engineer': ['SQL', 'Python', 'Data Warehousing', 'ETL', 'Apache Spark', 'Kafka', 'AWS'],
  'Embedded Systems Engineer': ['C', 'C++', 'Microcontrollers', 'Verilog', 'RTOS', 'Linux'],
  'Digital Marketing Analyst': ['Google Analytics', 'SEO', 'Google Ads', 'Excel', 'Google Tag Manager', 'Communication', 'Data Analysis'],
  'Financial Analyst': ['Excel', 'Financial Modeling', 'VBA', 'SQL', 'Power BI', 'Statistics'],
  'Health Informatics Specialist': ['EHR Systems', 'SQL', 'Healthcare Data Standards', 'Excel', 'Python', 'Tableau'],
};

async function giveSkills(userId: string, names: string[]) {
  for (const name of names) {
    const s = await Skill.findOneAndUpdate({ canonicalName: name }, { $setOnInsert: { canonicalName: name, name } }, { upsert: true, new: true });
    await UserSkill.create({ userId, skillId: s._id, evidenceScore: 75 });
  }
}

async function waitForResume(h: HttpHarness, token: string) {
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runCareerDomainTests() {
  console.log('🧪 Running Career Domains (E1) Tests...');

  // === Taxonomy: six careers added, fourteen untouched =================================================
  assert.equal(CAREER_TAXONOMY.length, 20);
  assert.equal(hash(CAREER_TAXONOMY.slice(0, 14)), ORIGINAL_FOURTEEN_HASH, 'the original fourteen careers are byte-for-byte unchanged');
  const e1 = CAREER_TAXONOMY.slice(14);
  assert.deepEqual(e1.map(c => c.title), CAREER_DOMAIN_CATALOGUE.map(c => c.title));
  assert.equal(new Set(CAREER_TAXONOMY.map(c => c.title)).size, 20, 'no duplicate titles');
  const originalDomains = new Set(CAREER_TAXONOMY.slice(0, 14).map(c => c.domain));
  assert.equal(new Set(e1.map(c => c.domain).filter(d => !originalDomains.has(d))).size, 4, 'four new domains');
  for (const c of e1) {
    assert.equal(c.source?.kind, 'onet');
    assert.match(c.source!.code, /^\d{2}-\d{4}\.\d{2}$/);
    const catalogue = CAREER_DOMAIN_CATALOGUE.find(x => x.title === c.title)!;
    for (const r of catalogue.requirements) {
      if (r.basis.type === 'editorial') assert.ok(r.basis.note.length >= 30, `${c.title}/${r.skill}: editorial choices are explained`);
    }
  }
  assert.match(ONET_ATTRIBUTION, /O\*NET 31\.0 Database/);
  assert.match(ONET_ATTRIBUTION, /has not approved, endorsed, or tested/);
  console.log('  ✓ Taxonomy: 20 careers, the original 14 byte-identical (hash), 6 added with their O*NET source, 4 new domains');

  // === Lexicon v2: the new skills are recognisable, aliases reviewed =====================================
  assert.equal(SKILL_LEXICON_VERSION, 2);
  for (const c of CAREER_TAXONOMY) for (const r of c.requirements) assert.equal(lookupSkill(r.skill)?.name, r.skill, `${c.title}: "${r.skill}" resolves exactly`);
  for (const name of E1_LEXICON_SKILLS) assert.equal(lookupSkill(name)?.name, name);
  const found = (text: string) => extractSkills(text);
  assert.deepEqual(found('Automated browser tests with Playwright and load tests in Apache JMeter').filter(s => ['Playwright', 'JMeter'].includes(s)).sort(), ['JMeter', 'Playwright']);
  assert.deepEqual([impliedSkills('Playwright'), impliedSkills('VBA')], [['Testing'], ['Excel']], 'test tools imply Testing; VBA implies Excel');
  assert.ok(found('Built HL7 FHIR interfaces').includes('Healthcare Data Standards'));
  assert.ok(found('Firmware on an STM32 MCU running FreeRTOS').includes('Microcontrollers') && found('Firmware on an STM32 MCU running FreeRTOS').includes('RTOS'));
  // Reviewed false positives: employer names and other meanings of an abbreviation
  assert.ok(!found('Led the go-to-market (GTM) plan for a product launch').includes('Google Tag Manager'), 'GTM is go-to-market');
  assert.ok(!found('Sales engineer at Informatica and Talend partners').includes('ETL'), 'employer names are not ETL');
  assert.ok(!found('Maintained the AVR (automatic voltage regulator) on site').includes('Microcontrollers'), 'AVR is not read as a microcontroller');
  assert.ok(!found('the mcu was not mentioned in upper case').includes('Microcontrollers'), 'MCU only in exact case');
  console.log(`  ✓ Lexicon v${SKILL_LEXICON_VERSION}: every requirement of the 20 careers resolves; ${E1_LEXICON_SKILLS.length} new skills and their aliases read correctly; GTM, Informatica, AVR and lower-case mcu are not false positives`);

  // === Learning content exists for the new gaps ========================================================
  const withResource = new Set(LEARNING_RESOURCES.flatMap(r => r.targetSkills));
  const e1Skills = new Set(e1.flatMap(c => c.requirements.map(r => r.skill)));
  const covered = [...e1Skills].filter(s => withResource.has(s));
  assert.ok(covered.length >= 38, `resources for ${covered.length} of ${e1Skills.size} skills of the new careers`);
  for (const c of e1) {
    const required = c.requirements.filter(r => r.importance === 'required').map(r => r.skill);
    const brief = PROJECT_BRIEFS.find(b => required.filter(s => b.skills.includes(s)).length >= Math.min(2, required.length));
    assert.ok(brief, `${c.title}: a practice brief exercises its required skills`);
  }
  for (const r of LEARNING_RESOURCES) assert.ok(r.url.startsWith('https://') && !/[?&](utm_|visit_id|ref_topic)/.test(r.url), `${r.url}: https without tracking`);
  console.log(`  ✓ Learning content: resources for ${covered.length} of ${e1Skills.size} skills of the new careers; each new career has a brief for its required skills`);

  // === Live pipeline ===================================================================================
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  await CareerService.seedInitialTaxonomy();
  await RecommendationService.seedInitialResources();
  const h = await startHttpHarness();
  try {
    for (const c of CAREER_TAXONOMY) assert.equal(await Career.countDocuments({ title: c.title }), 1, `${c.title} is seeded once`);
    const qa = await Career.findOne({ title: 'QA Automation Engineer' }).lean();
    assert.deepEqual(qa?.source, { kind: 'onet', code: '15-1253.00', title: 'Software Quality Assurance Analysts and Testers' });

    // Each profile ranks its own career first in the ordinary matches, readiness follows, and
    // the roadmap and resources address the remaining gaps
    for (const [title, skills] of Object.entries(PROFILES)) {
      const u = await h.registerUser(`e1-${title.split(' ')[0].toLowerCase()}`);
      await giveSkills(u.userId, skills);
      assert.equal((await RecalculationService.run(u.userId, 'manual')).status, 'completed');
      const matches = (await h.api('GET', '/careers/matches', { token: u.token })).body.data.matches as Array<{ careerId: { _id: string; title: string }; matchScore: number }>;
      assert.equal(matches[0].careerId.title, title, `${title} ranks first (got ${matches.slice(0, 3).map(m => `${m.careerId.title} ${m.matchScore}`).join(', ')})`);
      const careerId = matches[0].careerId._id;
      const readiness = (await h.api('GET', '/readiness', { token: u.token })).body.data.readiness as Array<{ careerId: { title: string }; overallScore: number }>;
      assert.ok(readiness.some(r => r.careerId.title === title && r.overallScore > 0), `${title}: readiness computed`);
      const roadmap = (await h.api('GET', `/roadmap/${careerId}`, { token: u.token })).body.data.roadmap;
      const items = (roadmap?.phases ?? []).flatMap((p: { items: Array<{ targetSkill?: string }> }) => p.items);
      const gaps = CAREER_TAXONOMY.find(c => c.title === title)!.requirements.map(r => r.skill).filter(s => !skills.includes(s));
      assert.ok(items.length > 0 && items.every((i: { targetSkill?: string }) => !i.targetSkill || gaps.includes(i.targetSkill) || CAREER_TAXONOMY.some(c => c.requirements.some(r => r.skill === i.targetSkill))), `${title}: a roadmap for the gaps`);
      const resources = (await h.api('GET', `/learning-resources?careerId=${careerId}`, { token: u.token })).body.data;
      assert.equal(resources.career.title, title);
      const suggestions = (await h.api('GET', `/projects/suggestions?careerId=${careerId}`, { token: u.token })).body.data;
      assert.ok(suggestions && (suggestions.suggestions ?? []).length >= 0);
      console.log(`    ${title}: first at ${matches[0].matchScore}; gaps ${gaps.join(', ') || 'none'}; ${items.length} roadmap items; resources for ${resources.coverage.withResources} of ${resources.coverage.gapSkills} gaps`);
    }
    // A QA profile missing JMeter and Appium gets the official links for them
    const qaUser = await h.registerUser('e1-qa-gaps');
    await giveSkills(qaUser.userId, ['Testing', 'Selenium', 'Python', 'Git']);
    await RecalculationService.run(qaUser.userId, 'manual');
    const qaResources = (await h.api('GET', `/learning-resources?careerId=${qa!._id}`, { token: qaUser.token })).body.data;
    const urls = qaResources.groups.flatMap((g: { resources: Array<{ url: string }> }) => g.resources.map(r => r.url));
    assert.ok(urls.includes('https://playwright.dev/docs/intro') && urls.includes('https://jmeter.apache.org/usermanual/get-started.html'), 'official links for the new skills');
    console.log('  ✓ Pipeline: each of the 6 profiles ranks its career first in normal matches, with readiness, a roadmap, resources and project suggestions');

    // === A resume naming the new skills is read into evidence =========================================
    const resumeUser = await h.registerUser('e1-resume');
    const resume = ['Asha Rao', 'Email: asha.rao@example.com', '', 'Experience:', 'Test Engineer at Example Labs (2022-2024)', 'Automated UI tests with Playwright and Appium; load tests with JMeter.', '', 'Skills:', 'Playwright, Appium, JMeter, Python, Git, SQL'].join('\n');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: resumeUser.token, form: resumeForm(resume) })).status));
    await waitForResume(h, resumeUser.token);
    const evidenced = (await h.api('GET', '/skills/freshness', { token: resumeUser.token })).body.data.skills.map((s: { name: string }) => s.name);
    assert.ok(['Playwright', 'Appium', 'JMeter'].every(s => evidenced.includes(s)), `new skills become evidence: ${evidenced.join(', ')}`);
    const resumeMatches = (await h.api('GET', '/careers/matches', { token: resumeUser.token })).body.data.matches as Array<{ careerId: { title: string } }>;
    assert.ok(resumeMatches.some(m => m.careerId.title === 'QA Automation Engineer'), 'and the resume is matched to the new career');
    console.log('  ✓ Resume: Playwright, Appium and JMeter in a resume become evidence and a QA Automation Engineer match');

    // === Existing users are recomputed once, without touching their evidence ===========================
    const legacy = await h.registerUser('e1-legacy');
    await giveSkills(legacy.userId, ['SQL', 'Python', 'Excel', 'Tableau', 'Statistics']);
    await RecalculationService.run(legacy.userId, 'manual');
    // Pretend the stored results predate E1: older version, and no match for the new careers
    // (the run fingerprint hashes the taxonomy version, so an older taxonomy gives another fingerprint)
    await RecalculationRun.updateMany({ userId: legacy.userId }, { $set: { taxonomyVersion: 'pre-e1-version', fingerprint: 'pre-e1-fingerprint' } });
    const e1Ids = (await Career.find({ title: { $in: e1.map(c => c.title) } }).select('_id').lean()).map(c => c._id);
    await CareerMatch.deleteMany({ userId: legacy.userId, careerId: { $in: e1Ids } });
    const evidenceBefore = JSON.stringify(await UserSkill.find({ userId: legacy.userId }).select('skillId evidenceScore').sort({ _id: 1 }).lean());
    const { stale } = await staleUserIds();
    assert.ok(stale.some(id => String(id) === legacy.userId), 'a user whose results predate the taxonomy is found');
    const dry = await refreshUsersForTaxonomy({ dryRun: true });
    assert.equal(dry.refreshed, 0);
    assert.equal(await CareerMatch.countDocuments({ userId: legacy.userId, careerId: { $in: e1Ids } }), 0, 'a dry run changes nothing');
    const refreshed = await refreshUsersForTaxonomy();
    assert.ok(refreshed.refreshed >= 1 && refreshed.failed === 0, JSON.stringify(refreshed));
    // Matches are stored above 10 (CareerMatchingEngine); the same scoring says which new careers qualify
    const legacySkills = await UserSkill.find({ userId: legacy.userId }).populate('skillId');
    const expected = [];
    for (const id of e1Ids) {
      const score = CareerScoringEngine.calculateScore(await CareerRequirement.find({ careerId: id }), legacySkills).totalScore;
      if (score > 10) expected.push(String(id));
    }
    assert.ok(expected.length >= 3, 'this profile qualifies for several new careers');
    assert.deepEqual((await CareerMatch.find({ userId: legacy.userId, careerId: { $in: e1Ids } }).lean()).map(m => String(m.careerId)).sort(), expected.sort(), 'the new careers it qualifies for now appear in its matches');
    const run = await RecalculationRun.findOne({ userId: legacy.userId }).sort({ createdAt: -1, _id: -1 }).lean();
    assert.deepEqual([run?.trigger, run?.taxonomyVersion, run?.status], ['taxonomy_changed', taxonomyVersion(), 'completed'], 'recorded as a taxonomy refresh');
    assert.equal(JSON.stringify(await UserSkill.find({ userId: legacy.userId }).select('skillId evidenceScore').sort({ _id: 1 }).lean()), evidenceBefore, 'evidence untouched');
    assert.equal((await refreshUsersForTaxonomy()).refreshed, 0, 'a second run finds nothing to do');
    console.log('  ✓ Refresh: stale users found, dry run changes nothing, one taxonomy_changed run adds the new careers it qualifies for, evidence untouched, idempotent');

    // === HTTP: provenance and the user's own matches =====================================================
    assert.equal((await h.api('GET', '/career-domains')).status, 401);
    const catalogue = (await h.api('GET', '/career-domains', { token: legacy.token })).body.data;
    assert.equal(catalogue.status, 'integrated');
    assert.match(catalogue.scopeNote, /United States/);
    assert.match(catalogue.scopeNote, /not a measure of hiring demand, pay or job availability in India/);
    assert.match(catalogue.source.attribution, /O\*NET 31\.0 Database/);
    assert.equal(catalogue.careers.filter((c: { newDomain: boolean }) => c.newDomain).length, 4);
    assert.equal((await h.api('GET', '/career-domains?userId=x', { token: legacy.token })).status, 400);
    const mine = (await h.api('GET', '/career-domains/matches', { token: legacy.token })).body.data;
    assert.equal(mine.careers.length, 6);
    const stored = await CareerMatch.find({ userId: legacy.userId, careerId: { $in: e1Ids } }).lean();
    for (const c of mine.careers) assert.equal(c.matchScore, stored.find(s => String(s.careerId) === c.careerId)?.matchScore ?? null, `${c.title}: the stored match (or none below the threshold), not a separate figure`);
    const nobody = await h.registerUser('e1-nobody');
    assert.ok((await h.api('GET', '/career-domains/matches', { token: nobody.token })).body.data.careers.every((c: { matchScore: number | null }) => c.matchScore === null), "another user's matches are never shown");
    assert.equal((await h.api('GET', '/career-domains/preview', { token: legacy.token })).status, 404, 'the preview endpoint is gone');
    console.log('  ✓ HTTP: sign-in required, integrated status, US-source caveat, attribution, invalid query 400, own stored matches only');
  } finally {
    await h.close();
  }
  console.log('✅ Career Domains (E1) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runCareerDomainTests();
    } catch (err) {
      console.error('❌ Career Domain Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
