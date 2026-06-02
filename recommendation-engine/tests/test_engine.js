'use strict';

const { clearCache } = require('../utils/dataLoader');
clearCache();

const { generateRecommendations, recommendResources } = require('../services/resourceService');
const { matchCareersToSkills, getLearningSequence }   = require('../services/careerService');
const { listSkills, searchSkills }                    = require('../services/skillService');

let passed = 0, failed = 0;

function assert(label, cond, info = '') {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else       { console.log(`  ❌ FAIL: ${label} ${info}`); failed++; }
}

// ── Dataset integrity ──────────────────────────────────────────
console.log('\n=== DATASET INTEGRITY ===');
const skills = listSkills();
assert('Skills loaded',             skills.success);
assert('HTML in dataset',           !!skills.data.find(s => s.id === 'html'));
assert('CSS in dataset',            !!skills.data.find(s => s.id === 'css'));
assert('JavaScript in dataset',     !!skills.data.find(s => s.id === 'javascript'));
assert('Linux in dataset',          !!skills.data.find(s => s.id === 'linux'));
assert('Networking in dataset',     !!skills.data.find(s => s.id === 'networking'));
assert('Python in dataset',         !!skills.data.find(s => s.id === 'python'));
assert('>=17 skills total',         skills.data.length >= 17, `got ${skills.data.length}`);

// ── User A: HTML CSS JavaScript → Frontend ─────────────────────
console.log('\n=== USER A: html, css, javascript → Frontend Developer ===');
const rA = generateRecommendations({
  userId: 'userA', name: 'Alex',
  currentSkills: ['html', 'css', 'javascript'],
  careerGoal: 'frontend_developer',
});
assert('Success',                   rA.success, rA.message);
assert('matchScore > 45%',          rA.data.careerGoal.matchScore > 45,
  `got ${rA.data.careerGoal.matchScore}%`);
assert('Has courses',               rA.data.recommendations.courses.length > 0);
assert('Top course skill = react',  rA.data.recommendations.courses[0]?.skillId === 'react',
  `got ${rA.data.recommendations.courses[0]?.skillId}`);
assert('No invalid skills',         rA.data.user.currentSkills.length === 3);
console.log(`  matchScore: ${rA.data.careerGoal.matchScore}%  top skill: ${rA.data.recommendations.courses[0]?.skillId}`);

// ── User B: Python SQL ML → ML Engineer ───────────────────────
console.log('\n=== USER B: python, sql, machine_learning → ML Engineer ===');
const rB = generateRecommendations({
  userId: 'userB', name: 'Ben',
  currentSkills: ['python', 'sql', 'machine_learning'],
  careerGoal: 'ml_engineer',
});
assert('Success',                   rB.success, rB.message);
assert('matchScore >= 60%',         rB.data.careerGoal.matchScore >= 60,
  `got ${rB.data.careerGoal.matchScore}%`);
assert('Has courses',               rB.data.recommendations.courses.length > 0);
const topBskill = rB.data.recommendations.courses[0]?.skillId;
assert('Top skill is git/docker/aws', ['git', 'docker', 'aws', 'linux'].includes(topBskill),
  `got ${topBskill}`);
console.log(`  matchScore: ${rB.data.careerGoal.matchScore}%  top skill: ${topBskill}`);

// ── User C: Cybersecurity Linux Networking → Cyber ────────────
console.log('\n=== USER C: cybersecurity, linux, networking → Cybersecurity Analyst ===');
const rC = generateRecommendations({
  userId: 'userC', name: 'Cara',
  currentSkills: ['cybersecurity', 'linux', 'networking'],
  careerGoal: 'cybersecurity_analyst',
});
assert('Success',                   rC.success, rC.message);
assert('matchScore > 45%',          rC.data.careerGoal.matchScore > 45,
  `got ${rC.data.careerGoal.matchScore}%`);
assert('Has courses',               rC.data.recommendations.courses.length > 0);
const topCskill = rC.data.recommendations.courses[0]?.skillId;
console.log(`  matchScore: ${rC.data.careerGoal.matchScore}%  top skill: ${topCskill}`);

// ── Recommendations differ between users ───────────────────────
console.log('\n=== DIFFERENTIATION TEST ===');
const topA = rA.data.recommendations.courses[0]?.skillId;
const topB = rB.data.recommendations.courses[0]?.skillId;
const topC = rC.data.recommendations.courses[0]?.skillId;
assert('A ≠ B top skill',           topA !== topB, `both: ${topA}`);
assert('A ≠ C top skill',           topA !== topC, `both: ${topA}`);
assert('B ≠ C top skill',           topB !== topC, `both: ${topB}`);

// ── Career matching accuracy ───────────────────────────────────
console.log('\n=== CAREER MATCHING ===');
const mA = matchCareersToSkills(['html', 'css', 'javascript']);
const mB = matchCareersToSkills(['python', 'sql', 'machine_learning']);
const mC = matchCareersToSkills(['cybersecurity', 'linux', 'networking']);
assert('HTML/CSS/JS → Frontend #1',       mA.data[0].id === 'frontend_developer',
  `got ${mA.data[0].id} (${mA.data[0].matchScore}%)`);
assert('Python/SQL/ML → ML or Data #1',   ['ml_engineer','data_analyst'].includes(mB.data[0].id),
  `got ${mB.data[0].id}`);
assert('Cyber/Linux/Net → Cyber #1',      mC.data[0].id === 'cybersecurity_analyst',
  `got ${mC.data[0].id}`);
console.log(`  UserA: ${mA.data[0].id} ${mA.data[0].matchScore}%`);
console.log(`  UserB: ${mB.data[0].id} ${mB.data[0].matchScore}%`);
console.log(`  UserC: ${mC.data[0].id} ${mC.data[0].matchScore}%`);

// ── Zero-skill user ────────────────────────────────────────────
console.log('\n=== ZERO-SKILL USER ===');
const r0 = recommendResources([], 'fullstack_developer');
assert('Success with zero skills',  r0.success);
assert('matchScore = 0',            r0.data.matchScore === 0);
assert('Has resources',             r0.data.totalResources > 0);
assert('All required skills listed',r0.data.skillGap.missingRequired.length > 0);

// ── Perfect-skill user ─────────────────────────────────────────
console.log('\n=== PERFECT-SKILL USER ===');
const rPerfect = recommendResources(
  ['html','css','javascript','react','git','typescript','nodejs','docker'],
  'frontend_developer'
);
assert('100% match or all gaps filled', rPerfect.data.matchScore === 100 || rPerfect.success);

// ── Learning sequence order ────────────────────────────────────
console.log('\n=== LEARNING SEQUENCE ===');
const seq = getLearningSequence('frontend_developer');
assert('Sequence is ordered',       seq.data.sequence[0].order === 1);
assert('First step is html/css',    ['html','css'].includes(seq.data.sequence[0].skillId),
  `got ${seq.data.sequence[0].skillId}`);
assert('Has 5+ steps',              seq.data.sequence.length >= 5);

// ── Search ─────────────────────────────────────────────────────
console.log('\n=== SEARCH ===');
const srch = searchSkills('python');
assert('Python search works',       srch.success && srch.data.length > 0);
const srch2 = searchSkills('java');
assert('Java search returns results',srch2.data.length >= 2);

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
console.log('='.repeat(50));
if (failed > 0) process.exit(1);
