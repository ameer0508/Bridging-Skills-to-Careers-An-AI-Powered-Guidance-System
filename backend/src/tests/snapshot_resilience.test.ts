import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SnapshotService from '../services/SnapshotService.js';
import User from '../models/User.js';

export async function runSnapshotResilienceTests() {
  console.log('🧪 Running Career Snapshot & Command Center Resilience Unit Tests...');
  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  try {
    // 1. Create a brand new user with no resume, skills, matches, opportunities, or interviews
    const newUserId = new mongoose.Types.ObjectId().toString();
    await User.create({
      _id: newUserId,
      fullName: 'Resilience Test Candidate',
      email: 'resilience.test@example.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuuu',
      role: 'user',
      primaryCareerDomain: 'Cybersecurity',
      targetRole: 'Senior Security Engineer',
      onboardingCompleted: true,
      profileCompleted: true,
    });

    // 2. Fetch career snapshot for uninitialized candidate
    console.log('  ➜ Assembling snapshot for candidate with zero subsystem data...');
    const snapshot = await SnapshotService.getUnifiedCareerSnapshot(newUserId);

    assert.ok(snapshot, 'Snapshot must be generated successfully');
    assert.strictEqual(snapshot.targetCareer, 'Senior Security Engineer');
    assert.strictEqual(snapshot.matchScore, 0);
    assert.strictEqual(snapshot.readinessScore, 0);
    assert.strictEqual(snapshot.totalSkills, 0);
    assert.deepStrictEqual(snapshot.criticalGaps, []);
    assert.strictEqual(snapshot.roadmapProgress, 0);
    assert.strictEqual(snapshot.activeRecommendationsCount, 0);

    // Verify opportunity telemetry schema
    assert.ok(snapshot.opportunities, 'Opportunities telemetry object must exist');
    assert.strictEqual(snapshot.opportunities.saved, 0);
    assert.strictEqual(snapshot.opportunities.applied, 0);
    assert.strictEqual(snapshot.opportunities.interviewing, 0);
    assert.strictEqual(snapshot.opportunities.offer, 0);

    // Verify interview telemetry schema
    assert.ok(snapshot.interviews, 'Interviews telemetry object must exist');
    assert.strictEqual(snapshot.interviews.total, 0);
    assert.strictEqual(snapshot.interviews.completed, 0);
    assert.strictEqual(snapshot.interviews.averageScore, 0);

    // Verify resume telemetry schema
    assert.ok(snapshot.resumeInfo, 'ResumeInfo object must exist');
    assert.strictEqual(snapshot.resumeInfo.hasResume, false);
    assert.strictEqual(snapshot.resumeInfo.updatedAt, null);

    console.log('  ✓ Verified Snapshot resilience for candidate with 0 skills/resume/opportunities/interviews');
    console.log('✅ All Career Snapshot Resilience Tests Passed Successfully!\n');
  } finally {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  }
}
