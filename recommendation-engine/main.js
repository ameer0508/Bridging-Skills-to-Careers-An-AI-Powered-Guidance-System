/**
 * main.js
 * Learning Resource Recommendation Engine — Entry Point
 *
 * Demonstrates all engine capabilities and writes sample outputs
 * to the /output directory for backend integration reference.
 *
 * Usage:
 *   node recommendation-engine/main.js
 *
 * Environment variables:
 *   LOG_LEVEL=debug|info|warn|error  (default: info)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Services
const { generateRecommendations, recommendResources,
        getResourcesBySkill, getResourcesByRole }  = require('./services/resourceService');
const { listCareers, getLearningSequence,
        matchCareersToSkills }                      = require('./services/careerService');
const { listSkills, searchSkills }                  = require('./services/skillService');
const logger                                        = require('./utils/logger');

const OUTPUT_DIR = path.join(__dirname, 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────
// Helper: write output file
// ─────────────────────────────────────────────────────────────
function saveOutput(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✓ Saved: output/${filename}`);
}

// ─────────────────────────────────────────────────────────────
// Helper: print section header
// ─────────────────────────────────────────────────────────────
function section(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ─────────────────────────────────────────────────────────────
// DEMO SCENARIOS
// ─────────────────────────────────────────────────────────────

function runDemo() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Learning Resource Recommendation Engine  v1.0.0       ║');
  console.log('║   Bridging Skills to Careers — AI-Powered Guidance      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // ── 1. List all available skills ──────────────────────────
  section('MODULE 1 · Skill Database');
  const skillsResult = listSkills();
  console.log(`  Skills in database: ${skillsResult.data.length}`);
  skillsResult.data.forEach(s =>
    console.log(`    • ${s.name.padEnd(22)} [${s.category}]  ${s.difficultyLevel}  ~${s.durationWeeks}w`)
  );
  saveOutput('01_all_skills.json', skillsResult);

  // ── 2. Career goal mapping ─────────────────────────────────
  section('MODULE 2 · Career Goal Mapping');
  const careersResult = listCareers();
  console.log(`  Supported career roles: ${careersResult.data.length}`);
  careersResult.data.forEach(c =>
    console.log(`    • ${c.title.padEnd(30)} demand: ${c.demandLevel}`)
  );
  saveOutput('02_career_goals.json', careersResult);

  // ── 3. Learning sequence for Full Stack Developer ──────────
  section('MODULE 2 · Learning Sequence — Full Stack Developer');
  const seqResult = getLearningSequence('fullstack_developer');
  seqResult.data.sequence.forEach(s =>
    console.log(`    ${s.order}. ${s.skillName.padEnd(20)} ~${s.durationWeeks}w  priority: ${s.priority}`)
  );
  saveOutput('03_fullstack_sequence.json', seqResult);

  // ── 4. Content-based filtering — single skill ─────────────
  section('MODULE 3 · Content-Based Filter — React Resources');
  const reactResult = getResourcesBySkill('react', 'frontend_developer');
  console.log(`  Courses:          ${reactResult.data.courses.length}`);
  console.log(`  Certifications:   ${reactResult.data.certifications.length}`);
  console.log(`  Practice:         ${reactResult.data.practicePlatforms.length}`);
  console.log(`  Documentation:    ${reactResult.data.documentation.length}`);
  saveOutput('04_react_resources.json', reactResult);

  // ── 5. Scenario A: Junior dev targeting Full Stack ─────────
  section('MODULE 3+4 · Scenario A — Junior Dev → Full Stack');
  const scenarioA = recommendResources(
    ['git', 'sql'],                // skills user already has
    'fullstack_developer'
  );
  console.log(`  Match score:      ${scenarioA.data.matchScore}%`);
  console.log(`  Missing required: ${scenarioA.data.skillGap.missingRequired.join(', ')}`);
  console.log(`  Missing optional: ${scenarioA.data.skillGap.missingOptional.join(', ')}`);
  console.log(`  Total resources:  ${scenarioA.data.totalResources}`);
  console.log(`  Top tier:         ${Object.values(scenarioA.data.recommendations.top).flat().length} resources`);
  saveOutput('05_scenario_a_fullstack.json', scenarioA);

  // ── 6. Scenario B: Python dev targeting ML Engineer ───────
  section('MODULE 3+4 · Scenario B — Python Dev → ML Engineer');
  const scenarioB = recommendResources(
    ['python', 'git', 'sql'],
    'ml_engineer'
  );
  console.log(`  Match score:      ${scenarioB.data.matchScore}%`);
  console.log(`  Missing required: ${scenarioB.data.skillGap.missingRequired.join(', ')}`);
  console.log(`  Total resources:  ${scenarioB.data.totalResources}`);
  saveOutput('06_scenario_b_ml_engineer.json', scenarioB);

  // ── 7. Scenario C: No skills → Cybersecurity Analyst ──────
  section('MODULE 3+4 · Scenario C — Beginner → Cybersecurity');
  const scenarioC = recommendResources(
    [],
    'cybersecurity_analyst'
  );
  console.log(`  Match score:      ${scenarioC.data.matchScore}%`);
  console.log(`  Missing required: ${scenarioC.data.skillGap.missingRequired.join(', ')}`);
  console.log(`  Total resources:  ${scenarioC.data.totalResources}`);
  saveOutput('07_scenario_c_cybersecurity.json', scenarioC);

  // ── 8. Full recommendation pipeline (Module 5) ────────────
  section('MODULE 5 · Full Recommendation Pipeline');

  const profiles = [
    {
      userId       : 'user_001',
      name         : 'Alex Chen',
      currentSkills: ['git', 'python'],
      careerGoal   : 'data_analyst',
    },
    {
      userId       : 'user_002',
      name         : 'Sara Malik',
      currentSkills: ['react', 'git'],
      careerGoal   : 'fullstack_developer',
    },
    {
      userId       : 'user_003',
      name         : 'James Okafor',
      currentSkills: [],
      careerGoal   : 'backend_developer',
    },
  ];

  profiles.forEach((profile, i) => {
    const result = generateRecommendations(profile);
    const d      = result.data;
    console.log(`\n  User: ${profile.name} → ${d.careerGoal.title}`);
    console.log(`    Match score:    ${d.careerGoal.matchScore}%`);
    console.log(`    Missing skills: ${d.skillGap.totalMissing}`);
    console.log(`    Courses:        ${d.recommendations.courses.length}`);
    console.log(`    Certs:          ${d.recommendations.certifications.length}`);
    console.log(`    Practice:       ${d.recommendations.practicePlatforms.length}`);
    saveOutput(`08_profile_${String(i + 1).padStart(2, '0')}_${profile.userId}.json`, result);
  });

  // ── 9. Career matching from skills ────────────────────────
  section('MODULE 6 · Career Matching from User Skills');
  const matchResult = matchCareersToSkills(['python', 'sql', 'git', 'machine_learning']);
  console.log('  Best career matches for [python, sql, git, machine_learning]:');
  matchResult.data.forEach(m =>
    console.log(`    ${m.matchScore.toString().padStart(3)}%  ${m.title}`)
  );
  saveOutput('09_career_matches.json', matchResult);

  // ── 10. Resources by role ──────────────────────────────────
  section('MODULE 6 · All Resources for Backend Developer Role');
  const roleResult = getResourcesByRole('backend_developer');
  console.log(`  Total resources: ${roleResult.data.totalResources}`);
  console.log(`  Top tier:        ${Object.values(roleResult.data.recommendations.top).flat().length}`);
  console.log(`  Medium tier:     ${Object.values(roleResult.data.recommendations.medium).flat().length}`);
  saveOutput('10_backend_developer_resources.json', roleResult);

  // ── 11. Skill search ──────────────────────────────────────
  section('MODULE 6 · Skill Search');
  const searchResult = searchSkills('python');
  console.log(`  Search "python": ${searchResult.data.length} results`);
  searchResult.data.forEach(s => console.log(`    • ${s.name} [${s.category}]`));
  saveOutput('11_skill_search_python.json', searchResult);

  // ── Summary ───────────────────────────────────────────────
  section('COMPLETE — Output files written to /output');
  const outputFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  console.log(`\n  ${outputFiles.length} output files generated:`);
  outputFiles.forEach(f => console.log(`    • ${f}`));

  console.log('\n  Engine is ready for backend integration.');
  console.log('  Import from: recommendation-engine/services/resourceService.js\n');
}

// ─────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────
try {
  runDemo();
} catch (err) {
  logger.error('Fatal error in main', { error: err.message, stack: err.stack });
  process.exit(1);
}
