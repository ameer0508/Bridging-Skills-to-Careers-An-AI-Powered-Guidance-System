import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import UserSkillService from '../services/UserSkillService.js';
import CareerMatchingEngine from '../services/CareerMatchingEngine.js';
import CareerReadinessService from '../services/CareerReadinessService.js';
import RecommendationEngine from '../services/RecommendationEngine.js';
import RoadmapService from '../services/RoadmapService.js';
import interviewService from '../services/InterviewService.js';
import OpportunityService from '../services/OpportunityService.js';
import SnapshotService from '../services/SnapshotService.js';
import ConversationService from '../services/ConversationService.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { skillKeys } from '../utils/skillMatching.js';
import { User } from '../models/User.js';
import { Career } from '../models/Career.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { Skill } from '../models/Skill.js';
import { Resume } from '../models/Resume.js';
import { ParsedResume } from '../models/ParsedResume.js';
import { ExtractedSkill } from '../models/ExtractedSkill.js';
import { UserSkill } from '../models/UserSkill.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { SavedOpportunity } from '../models/SavedOpportunity.js';
import { ConversationMessage } from '../models/ConversationMessage.js';

const entity = (value: string) => ({ value, confidence: 0.9 });

/**
 * End-to-end check of the core intelligence pipeline against a clean database:
 * taxonomy seed -> resume evidence -> skills -> matches -> readiness/gaps ->
 * recommendations -> roadmap progress -> interview persistence -> saved jobs -> snapshot.
 * The AI service is not required: every resume skill is pre-registered as a canonical Skill.
 */
export async function runCorePipelineTests() {
  console.log('🧪 Running Core Pipeline Integration Tests (clean database)...');

  // --- Pure helpers -------------------------------------------------------
  assert.deepEqual(skillKeys('Amazon Web Services (AWS)').sort(), [
    'amazon web services',
    'amazon web services (aws)',
    'aws'
  ]);
  assert.ok(skillKeys('React.js').includes('react'));
  assert.ok(skillKeys('C++').includes('c++'));
  console.log('  ✓ Skill key normalisation');

  // --- 1. Taxonomy seed is complete and idempotent ------------------------
  await CareerService.seedInitialTaxonomy();
  await CareerService.seedInitialTaxonomy();
  const expectedRequirements = CAREER_TAXONOMY.reduce((n, c) => n + c.requirements.length, 0);
  assert.equal(await Career.countDocuments(), CAREER_TAXONOMY.length);
  assert.equal(await CareerRequirement.countDocuments(), expectedRequirements);
  console.log(`  ✓ Taxonomy seeded once: ${CAREER_TAXONOMY.length} careers, ${expectedRequirements} requirements`);

  // --- 2. A user with a parsed resume ------------------------------------
  const user = await User.create({
    fullName: 'Pipeline Tester',
    email: `pipeline_${Date.now()}@example.com`,
    passwordHash: 'not-a-real-hash'
  });
  const userId = user._id.toString();

  const resume = await Resume.create({
    userId: user._id,
    originalFileName: 'resume.pdf',
    storedFileName: 'stored.pdf',
    fileExtension: '.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    storagePath: `${userId}/stored.pdf`,
    parsingStatus: 'completed'
  });

  await ParsedResume.create({
    userId: user._id,
    resumeId: resume._id,
    personalInfo: { fullName: entity('Pipeline Tester') },
    experience: [
      {
        company: entity('Acme'),
        role: entity('Frontend Developer'),
        responsibilities: [
          entity('Built dashboards with React and JavaScript'),
          entity('Styled components using CSS and HTML')
        ]
      }
    ],
    projects: [
      {
        name: entity('Shop API'),
        description: entity('REST service written in Node.js'),
        technologies: [entity('Node.js'), entity('Git')]
      }
    ],
    education: [{ degree: entity('B.Tech'), institution: entity('State University') }],
    certifications: [],
    achievements: [entity('Hackathon winner')],
    languages: [entity('English')],
    interests: []
  });

  const resumeSkills = ['JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'Git', 'C++', 'Java'];
  await Skill.insertMany(
    resumeSkills.map(name => ({ canonicalName: name, category: 'Programming', aliases: [] }))
  );
  await ExtractedSkill.insertMany(
    resumeSkills.map(name => ({
      userId: user._id,
      resumeId: resume._id,
      name,
      category: 'Programming',
      confidence: 0.9
    }))
  );

  // --- 3. Skills are built from evidence ---------------------------------
  await UserSkillService.buildUserSkillsFromResume(userId, resume._id.toString());
  const userSkills = await UserSkill.find({ userId: user._id }).populate<{
    skillId: { canonicalName: string };
  }>('skillId');
  assert.equal(userSkills.length, resumeSkills.length, 'every resume skill becomes a UserSkill');

  const byName = new Map(userSkills.map(s => [s.skillId.canonicalName, s]));
  const react = byName.get('React')!;
  const java = byName.get('Java')!;
  assert.ok(react.evidenceScore > java.evidenceScore, 'experience evidence outranks a bare listing');
  assert.ok(
    react.evidences.some(e => e.sourceType === 'resume_experience'),
    'React carries experience evidence'
  );
  assert.equal(
    java.evidences.some(e => e.sourceType === 'resume_experience'),
    false,
    '"Java" must not be credited from the word "JavaScript"'
  );
  assert.equal(java.proficiency, 'beginner');
  assert.ok(byName.has('C++'), 'special characters in skill names do not break the pipeline');
  console.log(`  ✓ ${userSkills.length} evidence-scored skills (React ${react.evidenceScore}, Java ${java.evidenceScore})`);

  // --- 4. Matching, readiness and gaps -----------------------------------
  await CareerMatchingEngine.evaluateUser(userId);
  const matches = await CareerMatch.find({ userId: user._id })
    .sort({ matchScore: -1 })
    .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } }>('careerId');
  assert.ok(matches.length > 0, 'career matches are produced on a fresh database');
  assert.equal(
    new Set(matches.map(m => m.careerId._id.toString())).size,
    matches.length,
    'overlapping recalculations must not leave duplicate matches'
  );
  assert.ok(
    ['Frontend Engineer', 'Full Stack Developer'].includes(matches[0].careerId.title),
    `top match should be a web role, got ${matches[0].careerId.title}`
  );
  assert.ok(matches[0].matchScore > 0 && matches[0].matchScore <= 100);
  assert.ok(matches[0].matchingSkills.includes('React'));
  console.log(`  ✓ ${matches.length} matches; top: ${matches[0].careerId.title} (${matches[0].matchScore}%)`);

  await CareerReadinessService.evaluateUser(userId);
  const readiness = await CareerReadiness.find({ userId: user._id });
  const gaps = await GapAnalysis.find({ userId: user._id });
  assert.ok(readiness.length > 0, 'readiness records are saved');
  assert.equal(gaps.length, readiness.length, 'a gap analysis is saved for every readiness record');
  assert.equal(readiness[0].dimensions.length, 4);
  assert.equal(
    new Set(readiness.map(r => r.careerId.toString())).size,
    readiness.length,
    'one readiness record per career'
  );
  console.log(`  ✓ ${readiness.length} readiness records with gap analyses`);

  // --- 5. Recommendations come from the user's own gaps -------------------
  await RecommendationEngine.generateForUser(userId);
  const topCareerId = matches[0].careerId._id;
  const topGap = await GapAnalysis.findOne({ userId: user._id, careerId: topCareerId });
  const recs = await Recommendation.find({ userId: user._id, careerId: topCareerId });
  assert.ok(topGap, 'top career has a gap analysis');
  const gapSkills = [...topGap!.criticalGaps, ...topGap!.weakAreas].map(g => g.skillName);
  assert.ok(gapSkills.length > 0, 'the test resume leaves gaps for the top career');
  for (const skill of gapSkills) {
    assert.ok(
      recs.some(r => r.targetSkill === skill),
      `gap "${skill}" has at least one recommendation`
    );
  }
  assert.equal(
    new Set(recs.map(r => r.title)).size,
    recs.length,
    'no duplicate recommendations for a career'
  );
  console.log(`  ✓ ${recs.length} recommendations covering gaps: ${gapSkills.join(', ')}`);

  // --- 6. Roadmap: creation, persistent progress, safe regeneration -------
  const careerIdStr = topCareerId.toString();
  const roadmap = await RoadmapService.generateRoadmap(userId, careerIdStr);
  assert.ok(roadmap, 'roadmap is created');
  const firstItem = roadmap!.phases[0].items[0];
  assert.ok(firstItem._id, 'roadmap items have stable ids');

  const updated = await RoadmapService.updateItemStatus(
    userId,
    careerIdStr,
    firstItem._id!.toString(),
    'completed'
  );
  assert.ok(updated.progressPercentage > 0, 'update returns the roadmap with recalculated progress');

  const reloaded = await LearningRoadmap.findById(roadmap!._id);
  assert.equal(reloaded!.phases[0].items[0].status, 'completed', 'item status is persisted');
  assert.ok(reloaded!.phases[0].items[0].completedAt);

  await RecommendationEngine.generateForUser(userId); // regenerates recommendations + roadmap
  const regenerated = await LearningRoadmap.findById(roadmap!._id);
  const stillDone = regenerated!.phases
    .flatMap(p => p.items)
    .find(i => i.title === firstItem.title);
  assert.equal(stillDone?.status, 'completed', 'completed items survive regeneration');
  assert.ok(regenerated!.progressPercentage > 0);
  console.log(`  ✓ Roadmap progress persisted and preserved (${regenerated!.progressPercentage}%)`);

  // --- 7. Interview answers and scores are persisted ----------------------
  const session = await interviewService.startSession(userId, { mode: 'technical', questionCount: 3 });
  const sessionId = session._id.toString();
  await interviewService.respondToQuestion(userId, sessionId, {
    questionIndex: 0,
    candidateResponse:
      'I designed a cached, rate limited API for scalability and fault tolerance, which reduced latency by 40%.'
  });
  await interviewService.completeSession(userId, sessionId);
  const storedSession = await InterviewSession.findById(sessionId);
  assert.ok(storedSession!.questions[0].candidateResponse, 'answer is stored');
  assert.ok(storedSession!.questions[0].evaluation, 'evaluation is stored');
  assert.equal(storedSession!.status, 'completed');
  assert.ok((storedSession!.overallScore ?? 0) > 0, 'completed session has a real score');
  console.log(`  ✓ Interview persisted with score ${storedSession!.overallScore}`);

  // --- 8. Saved opportunities keep their data and reach the snapshot ------
  await OpportunityService.saveOpportunity(userId, {
    externalId: 'job-123',
    provider: 'JSearch API',
    title: 'Frontend Engineer',
    company: 'Example Co',
    applicationUrl: 'https://example.com/apply/123',
    matchedSkills: ['React'],
    missingSkills: ['TypeScript'],
    skillbridgeMatchScore: 50
  });
  await OpportunityService.updateSavedStatus(userId, 'job-123', 'applied', 'Applied via portal');
  const saved = await SavedOpportunity.findOne({ userId: user._id, externalId: 'job-123' });
  assert.equal(saved!.applicationUrl, 'https://example.com/apply/123');
  assert.equal(saved!.notes, 'Applied via portal');
  assert.equal(saved!.status, 'applied');
  assert.deepEqual(saved!.missingSkills, ['TypeScript']);

  const snapshot = await SnapshotService.getUnifiedCareerSnapshot(userId);
  assert.equal(snapshot.opportunities.total, 1, 'Command Center sees the saved opportunity');
  assert.equal(snapshot.opportunities.applied, 1);
  assert.equal(snapshot.totalSkills, resumeSkills.length);
  assert.equal(snapshot.isMatchEvaluated, true);
  assert.equal(snapshot.isReadinessEvaluated, true);
  assert.equal(snapshot.interviews.completed, 1);
  assert.ok(snapshot.roadmapProgress > 0);
  console.log('  ✓ Command Center snapshot reflects skills, matches, roadmap, interview and applications');

  // --- 9. Conversations and messages can be stored ------------------------
  const conversation = await ConversationService.createConversation(userId, careerIdStr);
  await ConversationMessage.create({
    conversationId: conversation._id,
    role: 'user',
    content: 'Why is my readiness low?'
  });
  const history = await ConversationService.getConversationHistory(
    conversation._id.toString(),
    userId
  );
  assert.equal(history.messages.length, 1);
  assert.equal(history.messages[0].content, 'Why is my readiness low?');
  console.log('  ✓ Conversation messages persisted');

  console.log('✅ Core Pipeline Integration Tests Passed\n');
}

// Allow running this file on its own: `tsx src/tests/core_pipeline.test.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runCorePipelineTests();
    } catch (err) {
      console.error('❌ Core Pipeline Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
