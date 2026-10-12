import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SKILL_LEXICON } from '../seed/skillLexicon.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { extractSkills, lookupSkill } from '../utils/skillLexicon.js';
import { buildUserSkillIndex } from '../utils/skillMatching.js';
import EvidenceCalculator from '../services/EvidenceCalculator.js';
import CareerScoringEngine from '../services/CareerScoringEngine.js';
import ReadinessCalculator from '../services/ReadinessCalculator.js';
import ExplanationGenerator from '../services/ExplanationGenerator.js';
import {
  extractJobRequirements,
  matchOpportunity,
  JobRequirement
} from '../services/opportunities/OpportunityMatcher.js';
import type { IUserSkill, IEvidence } from '../models/UserSkill.js';
import type { ICareerRequirement } from '../models/CareerRequirement.js';
import type { IParsedResume } from '../models/ParsedResume.js';

/**
 * Deterministic accuracy tests for the scoring engines. Pure functions only: no database,
 * no network. Every expected number below can be reproduced by hand from the documented
 * formulas in CareerScoringEngine and OpportunityMatcher.
 */

const v = (value: string) => ({ value });

type SkillSpec = [name: string, evidenceScore: number, sources?: IEvidence['sourceType'][]];

/** Builds populated UserSkill-shaped objects without touching the database. */
const skills = (...specs: SkillSpec[]): IUserSkill[] =>
  specs.map(([name, evidenceScore, sources = ['resume_skills']]) => ({
    skillId: { canonicalName: name, aliases: [] },
    evidenceScore,
    evidences: sources.map(sourceType => ({ sourceType, description: '', weight: 0 }))
  })) as unknown as IUserSkill[];

const APPLIED: IEvidence['sourceType'][] = ['resume_experience', 'resume_skills'];

const requirementsFor = (careerTitle: string): ICareerRequirement[] => {
  const career = CAREER_TAXONOMY.find(c => c.title === careerTitle);
  assert.ok(career, `career ${careerTitle} exists in the taxonomy`);
  return career.requirements.map(r => ({
    skillName: r.skill,
    importance: r.importance,
    weight: r.weight
  })) as unknown as ICareerRequirement[];
};

/** The synthetic resume used in the milestone-2 live check (11 listed skills, 1 internship, 1 project). */
const LIVE_CHECK_RESUME = {
  id: 'resume-fixture',
  experience: [
    {
      role: v('Software Engineering Intern'),
      company: v('Example Technologies'),
      responsibilities: [
        v('Built REST APIs with Node.js and Express backed by MongoDB.'),
        v('Developed dashboards in React and TypeScript.')
      ]
    }
  ],
  projects: [
    {
      name: v('Campus Marketplace'),
      description: v('Full stack marketplace using React, Node.js and PostgreSQL, deployed with Docker on AWS.'),
      technologies: [v('React'), v('Node.js'), v('PostgreSQL'), v('Docker'), v('AWS')],
      contributions: []
    }
  ],
  education: [{ degree: v('B.Tech'), institution: v('Example Institute of Technology') }],
  certifications: []
} as unknown as IParsedResume;

const LIVE_CHECK_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'MongoDB',
  'PostgreSQL', 'Python', 'Docker', 'Git', 'AWS', 'REST APIs'
];

const liveCheckUserSkills = (): IUserSkill[] =>
  LIVE_CHECK_SKILLS.map(name => {
    const aliases = lookupSkill(name)?.aliases ?? [];
    const exact = lookupSkill(name)?.exactAliases ?? [];
    const { score, evidences } = EvidenceCalculator.calculateForSkill(name, [...aliases, ...exact], LIVE_CHECK_RESUME);
    return { skillId: { canonicalName: name, aliases }, evidenceScore: score, evidences };
  }) as unknown as IUserSkill[];

export async function runScoringAccuracyTests() {
  console.log('🧪 Running Scoring Accuracy Tests (deterministic fixtures)...');

  // === Lexicon ==============================================================
  const here = path.dirname(fileURLToPath(import.meta.url));
  const aiLexiconPath = path.resolve(here, '../../../ai/app/resources/skill_lexicon.json');
  if (fs.existsSync(aiLexiconPath)) {
    const aiLexicon = JSON.parse(fs.readFileSync(aiLexiconPath, 'utf-8')) as { skills: unknown[] };
    assert.deepEqual(
      SKILL_LEXICON,
      aiLexicon.skills,
      'backend and AI service skill lexicons must be identical'
    );
  }
  for (const career of CAREER_TAXONOMY) {
    for (const requirement of career.requirements) {
      assert.ok(
        lookupSkill(requirement.skill),
        `"${requirement.skill}" (${career.title}) must exist in the lexicon, or no resume could ever satisfy it`
      );
    }
  }
  assert.deepEqual(extractSkills('Java and JavaScript'), ['Java', 'JavaScript']);
  assert.deepEqual(extractSkills('We use JavaScript only'), ['JavaScript'], 'Java is not found inside JavaScript');
  assert.deepEqual(extractSkills('Languages: C, C++, C# / R'), ['C', 'C++', 'C#', 'R']);
  assert.deepEqual(extractSkills('React Native apps'), ['React Native'], 'longest term wins');
  assert.deepEqual(extractSkills('python Python PYTHON python3'), ['Python'], 'repeats count once');
  assert.deepEqual(extractSkills('see github.com/acme and https://docker.example.com'), [], 'links are not skills');
  assert.deepEqual(extractSkills('I express interest and go swiftly'), [], 'ordinary words are not skills');
  console.log('  ✓ Lexicon: in sync with the AI service, covers every career requirement, exact-token matching');

  // === Evidence scoring =====================================================
  const threeRoles = {
    id: 'r',
    experience: [1, 2, 3].map(n => ({ role: v(`Engineer ${n}`), company: v(`Co ${n}`), responsibilities: [v('Wrote Python services. Python, Python, Python.')] })),
    projects: [],
    education: [],
    certifications: []
  } as unknown as IParsedResume;
  assert.equal(EvidenceCalculator.calculateForSkill('Python', [], threeRoles).score, 70, '40 + 15 + 5 + 10 listed');
  assert.equal(
    EvidenceCalculator.calculateForSkill('Python', [], { ...threeRoles, experience: threeRoles.experience.slice(0, 1) } as IParsedResume).score,
    50,
    'repeating a skill inside one role does not add points'
  );
  assert.equal(EvidenceCalculator.calculateForSkill('Java', [], LIVE_CHECK_RESUME).score, 10, 'Java gets no credit from JavaScript text');
  const reactEvidence = EvidenceCalculator.calculateForSkill('React', [], LIVE_CHECK_RESUME);
  assert.equal(reactEvidence.score, 75, 'React: 40 (role) + 25 (project) + 10 (listed)');
  assert.equal(EvidenceCalculator.estimateProficiency(reactEvidence.score), 'advanced');
  assert.equal(EvidenceCalculator.estimateProficiency(10), 'beginner', 'a bare listing is never more than beginner');
  console.log('  ✓ Evidence: diminishing returns, no credit for repeats or substrings');

  // === Job matching =========================================================
  const job: JobRequirement[] = [
    { skill: 'React', importance: 'required' },
    { skill: 'Node.js', importance: 'required' },
    { skill: 'Docker', importance: 'preferred' }
  ];

  // No matching skills -> 0, never a positive floor
  const none = matchOpportunity(job, buildUserSkillIndex(skills(['Figma', 80, APPLIED])));
  assert.equal(none.score, 0);
  assert.equal(none.status, 'SCORED');
  assert.deepEqual(none.matchedSkills, []);
  assert.deepEqual(none.missingSkills, ['React', 'Node.js', 'Docker']);
  assert.match(none.explanation, /0 of 2 required skills/);

  // Partial: React strongly evidenced, Node.js and Docker missing
  //   possible 2+2+1 = 5; earned 2 x (0.5 + 0.5 x 0.75) = 1.75; penalty 0.3 x 1/2 = 0.15
  //   score = round(1.75 / 5 x 0.85 x 100) = 30
  const partial = matchOpportunity(job, buildUserSkillIndex(skills(['React', 75, APPLIED])));
  assert.equal(partial.score, 30);
  assert.deepEqual(partial.matchedSkills, ['React']);
  assert.match(partial.explanation, /1 of 2 required skills \(React\)/);
  assert.match(partial.explanation, /Not found on your resume: Node\.js/);

  // Full match with the strongest evidence -> 100
  const full = matchOpportunity(
    job,
    buildUserSkillIndex(skills(['React', 100, APPLIED], ['Node.js', 100, APPLIED], ['Docker', 100, APPLIED]))
  );
  assert.equal(full.score, 100);
  assert.deepEqual(full.missingSkills, []);

  // Full coverage but only listed (evidence 10): 0.5 + 0.5 x 0.10 = 0.55 -> 55, and it says why
  const listedOnly = matchOpportunity(job, buildUserSkillIndex(skills(['React', 10], ['Node.js', 10], ['Docker', 10])));
  assert.equal(listedOnly.score, 55);
  assert.match(listedOnly.explanation, /Listed but not shown in a role or project/);

  // Aliases and variants resolve to the same skill
  const aliasJob = extractJobRequirements({ skills: ['Amazon Web Services', 'postgres', 'ReactJS', 'k8s'] });
  assert.deepEqual(aliasJob.map(r => r.skill), ['AWS', 'PostgreSQL', 'React', 'Kubernetes']);
  const aliasMatch = matchOpportunity(
    aliasJob,
    buildUserSkillIndex(skills(['Amazon Web Services (AWS)', 100, APPLIED], ['PostgreSQL', 100, APPLIED], ['React', 100, APPLIED], ['Kubernetes', 100, APPLIED]))
  );
  assert.equal(aliasMatch.score, 100);

  // A related skill counts indirectly and at a discount (SQL via PostgreSQL: 100 x 0.7 = 70)
  const inferred = matchOpportunity([{ skill: 'SQL', importance: 'required' }], buildUserSkillIndex(skills(['PostgreSQL', 100, APPLIED])));
  assert.equal(inferred.score, 85, '0.5 + 0.5 x 0.70');
  assert.equal(inferred.requirements[0].status, 'inferred');
  assert.match(inferred.explanation, /SQL \(from PostgreSQL\)/);

  // Missing description / nothing recognisable -> no score, stated explicitly
  for (const source of [{}, { description: '' }, { description: 'Join our friendly team. Great perks and snacks!' }]) {
    const requirements = extractJobRequirements(source);
    assert.deepEqual(requirements, []);
    const result = matchOpportunity(requirements, buildUserSkillIndex(skills(['React', 90, APPLIED])));
    assert.equal(result.score, null, 'no requirements must not produce a number');
    assert.equal(result.status, 'NO_REQUIREMENTS');
  }

  // Candidate with no evidence is distinguished from a posting with no requirements
  const noEvidence = matchOpportunity(job, buildUserSkillIndex([]));
  assert.equal(noEvidence.score, null);
  assert.equal(noEvidence.status, 'NO_CANDIDATE_EVIDENCE');
  assert.match(noEvidence.explanation, /upload a resume/i);

  // Repeated mentions create one requirement, and do not change the score
  const once = extractJobRequirements({ description: 'We need Python.' });
  const repeated = extractJobRequirements({ description: 'Python! We love Python. Python Python python.' });
  assert.deepEqual(repeated, once);

  // Substring traps
  const javaJob = extractJobRequirements({ description: 'Strong Java experience required.' });
  assert.deepEqual(javaJob.map(r => r.skill), ['Java']);
  assert.equal(matchOpportunity(javaJob, buildUserSkillIndex(skills(['JavaScript', 100, APPLIED]))).score, 0, 'JavaScript does not satisfy Java');
  const jsJob = extractJobRequirements({ description: 'JavaScript developer wanted.' });
  assert.equal(matchOpportunity(jsJob, buildUserSkillIndex(skills(['Java', 100, APPLIED]))).score, 0, 'Java does not satisfy JavaScript');
  assert.deepEqual(extractJobRequirements({ description: 'A scalable, reactive culture of excellence.' }), []);

  // Optional skills are weighted lower than mandatory ones
  const mixed = extractJobRequirements({
    qualifications: ['3+ years with Python and SQL'],
    description: 'You will build data pipelines. Experience with Kubernetes is a plus. Airflow preferred.'
  });
  assert.deepEqual(mixed, [
    { skill: 'Python', importance: 'required' },
    { skill: 'SQL', importance: 'required' },
    { skill: 'Kubernetes', importance: 'preferred' },
    { skill: 'Airflow', importance: 'preferred' }
  ]);
  const withRequired = matchOpportunity(mixed, buildUserSkillIndex(skills(['Python', 100, APPLIED], ['SQL', 100, APPLIED])));
  const withOptional = matchOpportunity(mixed, buildUserSkillIndex(skills(['Kubernetes', 100, APPLIED], ['Airflow', 100, APPLIED])));
  assert.equal(withRequired.score, 67, 'all required, no preferred: 4 of 6 points');
  assert.equal(withOptional.score, 23, 'only the optional skills: 2 of 6 points, minus the missing-required penalty');
  console.log('  ✓ Job matching: 0 / partial / 100, aliases, inference, unscoreable postings, repeats, substrings, optional skills');

  // === Career matching ======================================================
  const fullStack = requirementsFor('Full Stack Developer');

  const nothing = CareerScoringEngine.calculateScore(fullStack, skills(['Figma', 90, APPLIED]));
  assert.equal(nothing.totalScore, 0, 'no relevant skill -> 0');
  assert.ok(nothing.breakdown.every(b => b.status === 'missing'));

  const everything = CareerScoringEngine.calculateScore(
    fullStack,
    skills(...fullStack.map(r => [r.skillName, 100, APPLIED] as SkillSpec))
  );
  assert.equal(everything.totalScore, 100, 'every requirement with the strongest evidence -> 100');
  assert.equal(everything.confidence, 100);

  // The milestone-2 live-check resume. Previously scored 26% for this career because
  // "REST APIs" could not be extracted, PostgreSQL did not count towards SQL, and skills
  // used through React/Node.js gave JavaScript no credit.
  const candidate = liveCheckUserSkills();
  const result = CareerScoringEngine.calculateScore(fullStack, candidate);
  const status = Object.fromEntries(result.breakdown.map(b => [b.skillName, b.status]));
  assert.deepEqual(status, {
    JavaScript: 'inferred', // inferred evidence (React 75 x 0.7 = 53) beats the bare listing (10)
    React: 'applied',
    'Node.js': 'applied',
    SQL: 'inferred', // via PostgreSQL
    MongoDB: 'applied',
    'REST APIs': 'applied',
    HTML: 'missing', // genuinely absent from the resume
    CSS: 'missing',
    Git: 'listed',
    TypeScript: 'applied'
  });
  // 87 points possible. Earned: JavaScript 11.48 (inferred 53), React 10.5 (75), Node.js 10.5 (75),
  // REST APIs 9 (50), Git 4.95 (listed 10), MongoDB 4.5 (50), SQL 3.75 (inferred 25),
  // TypeScript 2.25 (50), HTML 0, CSS 0 = 56.93. No required skill missing, so no penalty.
  // 56.93 / 87 = 65%
  assert.equal(result.totalScore, 65);
  assert.equal(result.missingRequiredCount, 0);
  assert.deepEqual(result.missingSkills, ['HTML', 'CSS']);
  assert.equal(result.confidence, 63, '5 of 8 matched requirements rest on applied evidence');

  const explanation = ExplanationGenerator.generate(result.breakdown);
  assert.match(explanation.summary, /8 of 10 skills.*5 of 5 required/);
  assert.ok(explanation.weaknesses.some(w => w.startsWith('HTML: no evidence found')));
  assert.ok(explanation.weaknesses.some(w => w.startsWith('Git: listed on your resume but not shown')));
  assert.ok(explanation.strengths.some(s => s.includes('SQL: inferred from your PostgreSQL evidence')));

  // The same resume is a poor fit for an unrelated career, and the score says so
  const design = CareerScoringEngine.calculateScore(requirementsFor('UI/UX Designer'), candidate);
  assert.equal(design.totalScore, 0, 'no design skills on the resume (HTML and CSS are absent too)');

  // Missing required skills are penalised beyond their own weight
  const backend = requirementsFor('Backend Engineer');
  const strongButIncomplete = CareerScoringEngine.calculateScore(
    backend,
    skills(...backend.filter(r => r.importance !== 'required').map(r => [r.skillName, 100, APPLIED] as SkillSpec))
  );
  assert.equal(strongButIncomplete.missingRequiredCount, strongButIncomplete.requiredCount);
  assert.ok(strongButIncomplete.totalScore < 40, `all optional, no required skills scores low (${strongButIncomplete.totalScore})`);
  console.log(`  ✓ Career matching: 0 and 100 are reachable; live-check resume now scores ${result.totalScore}% for Full Stack (was 26%)`);

  // === Readiness ============================================================
  const readiness = ReadinessCalculator.calculate(fullStack, candidate);
  assert.ok(readiness.overallScore < result.totalScore, 'readiness (evidence depth) is stricter than match (coverage)');
  assert.equal(readiness.dimensions.length, 4);
  assert.match(readiness.interpretation, /5 of 5 required skills/);
  assert.match(readiness.interpretation, /not a prediction of interview or hiring outcomes/);
  assert.ok(!/senior|mid level|entry level/i.test(readiness.tier), 'tiers make no seniority claim');
  assert.equal(ReadinessCalculator.calculate(fullStack, skills(['Figma', 90, APPLIED])).overallScore, 0);
  console.log(`  ✓ Readiness: ${readiness.overallScore}% "${readiness.tier}" for the same resume, with a non-predictive interpretation`);

  console.log('✅ Scoring Accuracy Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runScoringAccuracyTests().catch(err => {
    console.error('❌ Scoring Accuracy Test Failed:', err);
    process.exitCode = 1;
  });
}
