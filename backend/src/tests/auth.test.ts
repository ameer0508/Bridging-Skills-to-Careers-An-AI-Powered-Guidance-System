import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AuthService from '../services/AuthService.js';
import UserRepository from '../repositories/UserRepository.js';
import { User } from '../models/User.js';

export async function runAuthTests(): Promise<void> {
  console.log('🧪 Running Core Authentication & Security Infrastructure Unit Tests...');

  let mongoServer: MongoMemoryServer | null = null;
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }

  try {
    const authService = new AuthService();
    const userRepository = new UserRepository();

    const testEmail = `test.user.${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    const testName = 'Test Authentication User';

    // Test 1: Register New User via Email & Password
    const regResult = await authService.register(testName, testEmail, testPassword);
    assert.ok(regResult.user, 'Registered user object must exist');
    assert.strictEqual(regResult.user.email, testEmail.toLowerCase(), 'Email must be normalized to lowercase');
    assert.ok(regResult.accessToken, 'JWT Access Token must be issued upon registration');
    assert.ok(regResult.refreshToken, 'JWT Refresh Token must be issued upon registration');
    console.log('  ✓ User Registration via Email/Password Verified');

    // Test 2: Verify Password Hashing Security
    const createdUserDoc = await User.findById(regResult.user.id).select('+passwordHash');
    assert.ok(createdUserDoc, 'User document must exist in database');
    assert.ok(createdUserDoc.passwordHash, 'Password hash must be generated');
    assert.notStrictEqual(createdUserDoc.passwordHash, testPassword, 'Raw password must never be stored');
    console.log('  ✓ Bcrypt Password Hashing Verified');

    // Test 3: Authenticate User via Email & Password
    const loginResult = await authService.login(testEmail, testPassword);
    assert.ok(loginResult.accessToken, 'Access token must be returned upon successful login');
    assert.ok(loginResult.refreshToken, 'Refresh token must be returned upon successful login');
    assert.strictEqual(loginResult.user.email, testEmail.toLowerCase());
    console.log('  ✓ User Authentication & Token Issuance Verified');

    // Test 4: Invalid Password Rejection
    await assert.rejects(
      async () => authService.login(testEmail, 'WrongPassword123!'),
      /Invalid email or password/
    );
    console.log('  ✓ Invalid Password Rejection Verified');

    // Test 5: Refresh Token Rotation
    const refreshedTokens = await authService.refresh(loginResult.refreshToken);
    assert.ok(refreshedTokens.accessToken, 'New access token issued');
    assert.ok(refreshedTokens.refreshToken, 'Rotated refresh token issued');
    console.log('  ✓ Refresh Token Rotation Verified');

    // Test 6: Session Revocation (Logout)
    await authService.logout(refreshedTokens.refreshToken);
    await assert.rejects(
      async () => authService.refresh(refreshedTokens.refreshToken),
      /Session compromised|Invalid or revoked/
    );
    console.log('  ✓ Session Revocation (Logout) Verified');

    // Test 7: Verify Social Authentication Provider Methods are Absent
    assert.strictEqual(
      typeof (userRepository as unknown as Record<string, unknown>).findByGoogleId,
      'undefined',
      'findByGoogleId must be removed from UserRepository'
    );
    assert.strictEqual(
      typeof (userRepository as unknown as Record<string, unknown>).findByGithubId,
      'undefined',
      'findByGithubId must be removed from UserRepository'
    );
    console.log('  ✓ Verification: Social OAuth provider functions completely removed from backend');

    console.log('✅ All Core Authentication & Token Security Tests Passed Cleanly!\n');
  } finally {
    if (mongoServer) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoServer.stop();
    }
  }
}

if (process.argv[1] && (process.argv[1].endsWith('auth.test.ts') || process.argv[1].endsWith('oauth.test.ts'))) {
  runAuthTests().catch((err) => {
    console.error('❌ Auth Test Failed:', err);
    process.exit(1);
  });
}
