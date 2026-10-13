import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { CAREER_DOMAIN_CATALOGUE, ONET_ATTRIBUTION, PROPOSED_LEXICON_SKILLS } from '../seed/careerDomainCatalogue.js';
import { lexiconStatus, scoreCareers } from '../services/careers/CareerDomainPreviewService.js';
import { lookupSkill } from '../utils/skillLexicon.js';
import { Skill } from '../models/Skill.js';
import UserSkill, { IUserSkill } from '../models/UserSkill.js';
import CareerMatch from '../models/CareerMatch.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * E1 proposed career domains: catalogue integrity and compatibility with the 14 existing careers,
 * lexicon consistency, matching behaviour with the shared scoring function, isolation from live
 * matching, and a read-only HTTP preview.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

/** An in-memory user skill as the scoring engine reads it. */
const skill = (canonicalName: string, evidenceScore = 70) =>
  ({ skillId: { canonicalName, aliases: [] }, evidenceScore, evidences: [] }) as unknown as IUserSkill;

export async function runCareerDomainTests() {
  console.log('🧪 Running Career Domain Catalogue (E1) Tests...');

  // === Catalogue and compatibility ===============================================================
  const existingTitles = new Set(CAREER_TAXONOMY.map(c => c.title));
  const newTitles = CAREER_DOMAIN_CATALOGUE.map(c => c.title);
  assert.equal(CAREER_TAXONOMY.length, 14, 'the shared taxonomy is unchanged on this branch');
  assert.equal(new Set(newTitles).size, newTitles.length);
  assert.ok(newTitles.every(t => !existingTitles.has(t)), 'no proposed title collides with an existing career');
  const knownTitles = new Set([...existingTitles, ...newTitles]);
  const existingDomains = new Set(CAREER_TAXONOMY.map(c => c.domain));
  for (const c of CAREER_DOMAIN_CATALOGUE) {
    assert.equal(c.newDomain, !existingDomains.has(c.domain), `${c.title}: newDomain flag is accurate`);
    assert.match(c.onet.code, /^\d{2}-\d{4}\.\d{2}$/);
    assert.ok(c.requirements.some(r => r.importance === 'required'), `${c.title}: has required skills`);
    assert.equal(new Set(c.requirements.map(r => r.skill)).size, c.requirements.length, `${c.title}: no duplicate requirement`);
    for (const r of c.requirements) {
      assert.ok(Number.isInteger(r.weight) && r.weight >= 1 && r.weight <= 5, `${c.title}/${r.skill}: weight 1-5`);
      if (r.basis.type === 'onet_software') assert.ok(r.basis.examples.length > 0);
      if (r.basis.type === 'onet_knowledge') assert.ok(r.basis.importance >= 1 && r.basis.importance <= 5);
      if (r.basis.type === 'editorial') assert.ok(r.basis.note.length >= 30, `${c.title}/${r.skill}: editorial choices are explained`);
    }
    for (const s of c.similar) assert.ok(knownTitles.has(s.title) && s.score > 0 && s.score <= 100, `${c.title}: similar to known ${s.title}`);
  }
  assert.equal(CAREER_DOMAIN_CATALOGUE.filter(c => c.newDomain).length, 4, 'four new domains');
  assert.match(ONET_ATTRIBUTION, /O\*NET 31\.0 Database/);
  assert.match(ONET_ATTRIBUTION, /CC BY 4\.0/);
  assert.match(ONET_ATTRIBUTION, /has not approved, endorsed, or tested/);
  console.log(`  ✓ Catalogue: ${CAREER_DOMAIN_CATALOGUE.length} roles, 4 new domains, no clash with the 14 careers, every requirement sourced or explained`);

  // === Lexicon consistency ===========================================================================
  const proposedNames = new Set(PROPOSED_LEXICON_SKILLS.map(s => s.name));
  for (const c of CAREER_DOMAIN_CATALOGUE) {
    for (const r of c.requirements) {
      if (lexiconStatus(r.skill) === 'present') assert.equal(lookupSkill(r.skill)?.name, r.skill);
      else assert.ok(proposedNames.has(r.skill), `${r.skill} is either in the lexicon or proposed`);
    }
  }
  for (const s of PROPOSED_LEXICON_SKILLS) {
    assert.equal(lookupSkill(s.name), undefined, `${s.name} is not already in the lexicon`);
    for (const alias of [...s.aliases, ...s.exactAliases]) assert.equal(lookupSkill(alias), undefined, `alias "${alias}" does not clash with an existing skill`);
    for (const implied of s.implies) assert.ok(lookupSkill(implied), `${s.name} implies an existing skill`);
  }
  const used = new Set(CAREER_DOMAIN_CATALOGUE.flatMap(c => c.requirements.map(r => r.skill)));
  assert.ok(PROPOSED_LEXICON_SKILLS.every(s => used.has(s.name)), 'every proposed skill is needed by a role');
  console.log(`  ✓ Lexicon: present skills resolve exactly; ${PROPOSED_LEXICON_SKILLS.length} proposed skills and their aliases clash with nothing`);

  // === Matching with the shared scoring function ======================================================
  const top = (names: string[]) => scoreCareers(names.map(n => skill(n)))[0];
  assert.equal(top(['Testing', 'Selenium', 'Python', 'Git', 'SQL', 'Jenkins', 'Postman']).title, 'QA Automation Engineer');
  assert.equal(top(['SQL', 'Python', 'Apache Spark', 'Kafka', 'AWS', 'Hadoop', 'Linux']).title, 'Data Engineer');
  assert.equal(top(['C', 'C++', 'Linux', 'MATLAB', 'Git']).title, 'Embedded Systems Engineer');
  assert.equal(top(['Excel', 'HTML', 'CSS', 'Communication', 'Data Analysis']).title, 'Digital Marketing Analyst');
  const empty = scoreCareers([]);
  assert.ok(empty.every(c => c.score === 0), 'no evidence, no score');
  const marketing = scoreCareers([skill('Excel'), skill('Communication')]).find(c => c.title === 'Digital Marketing Analyst')!;
  assert.deepEqual(marketing.notYetRecognisable.sort(), ['Google Ads', 'Google Analytics', 'Google Tag Manager', 'SEO', 'WordPress'].sort(), 'proposed skills are reported as not yet recognisable');
  const strong = scoreCareers(['Testing', 'Selenium', 'Python', 'Java', 'SQL', 'Git', 'REST APIs', 'Postman', 'Jenkins', 'Jira'].map(n => skill(n, 100))).find(c => c.title === 'QA Automation Engineer')!;
  assert.ok(strong.score < 100 && strong.missingSkills.includes('Playwright'), 'a role cannot be fully matched while its proposed skills are unrecognisable');
  console.log('  ✓ Matching: each profile ranks its role first with the shared scoring; unrecognisable skills stay missing and are listed');

  // === Isolation from live matching ===================================================================
  for (const file of ['../services/CareerMatchingEngine.ts', '../services/CareerService.ts', '../services/RecommendationEngine.ts', '../services/RoadmapEngine.ts', '../services/CareerReadinessService.ts', '../seed/careerTaxonomy.ts', '../utils/versions.ts']) {
    const source = fs.readFileSync(path.resolve(here, file), 'utf8');
    assert.ok(!source.includes('careerDomainCatalogue'), `${file} does not read the proposed catalogue`);
  }
  console.log('  ✓ Live matching, readiness, recommendations, roadmaps and the taxonomy version do not read the catalogue');

  // === HTTP ======================================================================================
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/career-domains')).status, 401);
    const alice = await h.registerUser('domains-alice');
    const bob = await h.registerUser('domains-bob');
    const catalogue = await h.api('GET', '/career-domains', { token: alice.token });
    assert.equal(catalogue.status, 200);
    assert.equal(catalogue.body.data.status, 'preview');
    assert.match(catalogue.body.data.source.attribution, /O\*NET 31\.0 Database/);
    assert.ok(catalogue.body.data.careers.find((c: { title: string }) => c.title === 'Digital Marketing Analyst').requirements.some((r: { lexicon: string }) => r.lexicon === 'proposed'));
    assert.equal((await h.api('GET', '/career-domains?userId=x', { token: alice.token })).status, 400);

    let preview = (await h.api('GET', '/career-domains/preview', { token: alice.token })).body.data;
    assert.equal(preview.hasProfile, false);
    assert.ok(preview.careers.every((c: { score: number }) => c.score === 0));

    for (const name of ['Testing', 'Selenium', 'Python', 'Git', 'SQL']) {
      const s = await Skill.findOneAndUpdate({ canonicalName: name }, { $setOnInsert: { canonicalName: name, name } }, { upsert: true, new: true });
      await UserSkill.create({ userId: alice.userId, skillId: s._id, evidenceScore: 70 });
    }
    const matchesBefore = await CareerMatch.countDocuments({});
    preview = (await h.api('GET', '/career-domains/preview', { token: alice.token })).body.data;
    assert.equal(preview.careers[0].title, 'QA Automation Engineer');
    assert.equal(await CareerMatch.countDocuments({}), matchesBefore, 'the preview stores nothing');
    const bobPreview = (await h.api('GET', '/career-domains/preview', { token: bob.token })).body.data;
    assert.ok(bobPreview.careers.every((c: { score: number }) => c.score === 0), "bob's preview uses only bob's skills");
    console.log('  ✓ HTTP: sign-in required, attribution served, invalid query 400, preview from own skills only, nothing stored');
  } finally {
    await h.close();
  }
  console.log('✅ Career Domain Catalogue (E1) Tests Passed\n');
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
    }
  })();
}
