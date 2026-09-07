import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserService from '../services/UserService.js';
import User from '../models/User.js';
import SnapshotService from '../services/SnapshotService.js';

export async function runOnboardingDomainTests(): Promise<void> {
  console.log('🧪 Running Career Domain Onboarding & Integration Pipeline Unit Tests...');

  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  try {
    const userService = new UserService();
    const testEmail = `domain.tester.${Date.now()}@example.com`;

    // 1. Create baseline user with onboardingCompleted = false
    const createdUser = await User.create({
      fullName: 'Domain Onboarding Tester',
      email: testEmail,
      passwordHash: 'hashedSecret123',
      onboardingCompleted: false,
      profileCompleted: false,
    });

    const userId = (createdUser._id as mongoose.Types.ObjectId).toString();

    // Verify initial profile
    const initialProfile = await userService.getUserProfile(userId);
    assert.strictEqual(initialProfile.onboardingCompleted, false, 'Initial user onboardingCompleted must be false');
    assert.strictEqual(initialProfile.primaryCareerDomain || '', '', 'Initial primaryCareerDomain must be empty');
    console.log('  ✓ Initial Un-onboarded User State Verified');

    // 2. Complete Onboarding with Career Domain and Target Role
    const updatedUser = await userService.updateUserProfile(userId, {
      primaryCareerDomain: 'Cybersecurity',
      secondaryCareerDomains: ['Cloud Security', 'Penetration Testing'],
      targetRole: 'Senior Security Engineer',
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
    });

    assert.strictEqual(updatedUser.onboardingCompleted, true, 'Updated user onboardingCompleted must be true');
    assert.strictEqual(updatedUser.primaryCareerDomain, 'Cybersecurity', 'primaryCareerDomain must be Cybersecurity');
    assert.strictEqual(updatedUser.targetRole, 'Senior Security Engineer', 'targetRole must be Senior Security Engineer');
    assert.ok(updatedUser.secondaryCareerDomains?.includes('Cloud Security'), 'secondaryCareerDomains must include Cloud Security');
    console.log('  ✓ Career Domain Onboarding Update & Persistence Verified');

    // 3. Verify Snapshot Service uses Target Role from User Profile
    const snapshot = await SnapshotService.getUnifiedCareerSnapshot(userId);
    assert.strictEqual(snapshot.targetCareer, 'Senior Security Engineer', 'Snapshot targetCareer must derive from updated targetRole');
    assert.strictEqual(typeof snapshot.matchScore, 'number', 'matchScore must be a number');
    assert.strictEqual(typeof snapshot.readinessScore, 'number', 'readinessScore must be a number');
    console.log('  ✓ Dynamic Career Snapshot Target Domain Integration Verified');

    console.log('✅ All Career Domain Onboarding Unit Tests Passed!');
  } finally {
    if (mongoServer) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoServer.stop();
    }
  }
}
