import './setupEnv.js';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserService from '../services/UserService.js';
import AuthService from '../services/AuthService.js';
import SnapshotService from '../services/SnapshotService.js';

export async function runOnboardingDomainTests(): Promise<void> {
  console.log('🧪 Running Comprehensive Career Domain Onboarding & Multi-User Isolation Tests...');

  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  try {
    const userService = new UserService();
    const authService = new AuthService();

    const emailA = `user.a.${Date.now()}@example.com`;
    const passwordA = 'SecurePassword123!';

    const emailB = `user.b.${Date.now()}@example.com`;
    const passwordB = 'AnotherSecurePassword456!';

    // =========================================================================
    // 1. User A Registers — Initial state must have onboardingCompleted = false
    // =========================================================================
    const regResultA = await authService.register('User Alpha', emailA, passwordA);
    assert.strictEqual(
      regResultA.user.onboardingCompleted,
      false,
      'User A register response must return onboardingCompleted: false'
    );
    assert.strictEqual(
      regResultA.user.primaryCareerDomain,
      '',
      'User A register response must have empty primaryCareerDomain'
    );
    console.log('  ✓ User A Registered: onboardingCompleted is false in auth response');

    // =========================================================================
    // 2. User A Logs in before onboarding — must return onboardingCompleted = false
    // =========================================================================
    const loginResultA1 = await authService.login(emailA, passwordA);
    assert.strictEqual(
      loginResultA1.user.onboardingCompleted,
      false,
      'User A login response before onboarding must return onboardingCompleted: false'
    );
    assert.strictEqual(
      loginResultA1.user.primaryCareerDomain,
      '',
      'User A login response before onboarding must have empty primaryCareerDomain'
    );
    console.log('  ✓ User A Login (Pre-onboarding): onboardingCompleted is false');

    // =========================================================================
    // 3. User A Completes Career Domain Onboarding via Database Update
    // =========================================================================
    const userIdA = loginResultA1.user.id;
    const completedOnboardingDate = new Date();

    const updatedUserA = await userService.updateUserProfile(userIdA, {
      primaryCareerDomain: 'Artificial Intelligence & Machine Learning',
      secondaryCareerDomains: ['PyTorch / TensorFlow', 'Vector Databases', 'Prompt Engineering'],
      targetRole: 'Senior AI Engineer',
      onboardingCompleted: true,
      onboardingCompletedAt: completedOnboardingDate,
    });

    assert.strictEqual(
      updatedUserA.onboardingCompleted,
      true,
      'User A record in database must have onboardingCompleted: true'
    );
    assert.strictEqual(
      updatedUserA.primaryCareerDomain,
      'Artificial Intelligence & Machine Learning',
      'User A primaryCareerDomain must be AI & ML'
    );
    assert.strictEqual(
      updatedUserA.targetRole,
      'Senior AI Engineer',
      'User A targetRole must be Senior AI Engineer'
    );
    console.log('  ✓ User A Completed Onboarding: Database record updated with domain and role');

    // =========================================================================
    // 4. User A Logs in after onboarding — must return onboardingCompleted = true
    // =========================================================================
    const loginResultA2 = await authService.login(emailA, passwordA);
    assert.strictEqual(
      loginResultA2.user.onboardingCompleted,
      true,
      'User A login response after onboarding MUST return onboardingCompleted: true'
    );
    assert.strictEqual(
      loginResultA2.user.primaryCareerDomain,
      'Artificial Intelligence & Machine Learning',
      'User A login response must preserve primaryCareerDomain'
    );
    assert.strictEqual(
      loginResultA2.user.targetRole,
      'Senior AI Engineer',
      'User A login response must preserve targetRole'
    );
    console.log('  ✓ User A Login (Post-onboarding): onboardingCompleted is true and domain is persisted');

    // =========================================================================
    // 5. User B Registers — Multi-User Isolation Verification
    // =========================================================================
    const regResultB = await authService.register('User Beta', emailB, passwordB);
    assert.strictEqual(
      regResultB.user.onboardingCompleted,
      false,
      'User B register response must have onboardingCompleted: false'
    );

    const loginResultB = await authService.login(emailB, passwordB);
    assert.strictEqual(
      loginResultB.user.onboardingCompleted,
      false,
      'User B login response must have onboardingCompleted: false'
    );
    assert.strictEqual(
      loginResultB.user.primaryCareerDomain,
      '',
      'User B must have empty primaryCareerDomain'
    );
    console.log('  ✓ User B Multi-User Isolation: User B remains un-onboarded while User A is completed');

    // Verify User A has NOT been affected by User B's registration
    const profileA = await userService.getUserProfile(userIdA);
    assert.strictEqual(
      profileA.onboardingCompleted,
      true,
      'User A must still have onboardingCompleted: true after User B registers'
    );
    console.log('  ✓ User A Unaffected: Multi-user data isolation verified');

    // =========================================================================
    // 6. User A Edits Preferences Later — onboardingCompleted must NOT reset to false
    // =========================================================================
    const editedUserA = await userService.updateUserProfile(userIdA, {
      primaryCareerDomain: 'Cybersecurity',
      secondaryCareerDomains: ['Cloud Security (AWS/GCP)', 'Penetration Testing'],
      targetRole: 'Staff Security Architect',
      bio: 'Experienced architect specializing in distributed security and cloud resilience.',
      location: 'San Francisco, CA',
      experienceLevel: 'lead',
      // User is editing preferences without passing onboardingCompleted: false
    });

    assert.strictEqual(
      editedUserA.onboardingCompleted,
      true,
      'Editing career preferences must preserve onboardingCompleted: true'
    );
    assert.strictEqual(
      editedUserA.primaryCareerDomain,
      'Cybersecurity',
      'Edited primaryCareerDomain must update to Cybersecurity'
    );
    assert.strictEqual(
      editedUserA.targetRole,
      'Staff Security Architect',
      'Edited targetRole must update to Staff Security Architect'
    );
    assert.strictEqual(
      editedUserA.bio,
      'Experienced architect specializing in distributed security and cloud resilience.',
      'Edited bio must persist'
    );
    assert.strictEqual(
      editedUserA.location,
      'San Francisco, CA',
      'Edited location must persist'
    );
    assert.strictEqual(
      editedUserA.experienceLevel,
      'lead',
      'Edited experienceLevel must persist'
    );
    console.log('  ✓ User A Edited Preferences, Bio, Location & Seniority: all persisted successfully');

    // =========================================================================
    // 7. Downstream Intelligence: Career Snapshot derives from updated Target Role
    // =========================================================================
    const snapshot = await SnapshotService.getUnifiedCareerSnapshot(userIdA);
    assert.strictEqual(
      snapshot.targetCareer,
      'Staff Security Architect',
      'Snapshot targetCareer must derive from updated targetRole'
    );
    assert.ok(
      snapshot.matchScore === null || typeof snapshot.matchScore === 'number',
      'matchScore must be null when unevaluated or number when evaluated'
    );
    assert.strictEqual(snapshot.isMatchEvaluated, false, 'isMatchEvaluated must be false before skill profile created');
    assert.strictEqual(snapshot.isReadinessEvaluated, false, 'isReadinessEvaluated must be false before skill profile created');
    console.log('  ✓ Downstream Career Snapshot Integration Verified with Target Role');

    console.log('✅ ALL Career Domain Onboarding & Multi-User Isolation Tests Passed Successfully!');
  } finally {
    if (mongoServer) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoServer.stop();
    }
  }
}
