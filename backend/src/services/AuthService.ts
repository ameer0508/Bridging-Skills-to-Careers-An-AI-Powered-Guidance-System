import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import UserRepository from '../repositories/UserRepository.js';
import RefreshTokenRepository from '../repositories/RefreshTokenRepository.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();
  }

  private static getBackupFilePath(): string {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'users_backup.json');
  }

  public static async backupUserToFile(user: {
    id: string;
    fullName?: string;
    email: string;
    passwordHash?: string;
    role?: string;
    primaryCareerDomain?: string;
    secondaryCareerDomains?: string[];
    targetRole?: string;
    targetCareerId?: string;
    onboardingCompleted?: boolean;
    onboardingCompletedAt?: Date | string;
    profileCompleted?: boolean;
  }) {
    try {
      const filePath = AuthService.getBackupFilePath();
      let users: Array<{
        id: string;
        fullName?: string;
        email: string;
        passwordHash?: string;
        role?: string;
        primaryCareerDomain?: string;
        secondaryCareerDomains?: string[];
        targetRole?: string;
        targetCareerId?: string;
        onboardingCompleted?: boolean;
        onboardingCompletedAt?: Date | string;
        profileCompleted?: boolean;
      }> = [];
      if (fs.existsSync(filePath)) {
        try {
          users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
          users = [];
        }
      }
      const existingIdx = users.findIndex(
        (u) => (u.email || '').toLowerCase() === user.email.toLowerCase()
      );
      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...user };
      } else {
        users.push(user);
      }
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Could not write user backup to file:', err);
    }
  }

  public static async restoreUserBackups(): Promise<void> {
    try {
      const filePath = AuthService.getBackupFilePath();
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      const users = JSON.parse(content);
      if (!Array.isArray(users) || users.length === 0) return;

      const { User } = await import('../models/User.js');
      for (const u of users) {
        const email = (u.email || '').toLowerCase().trim();
        if (!email) continue;
        const exists = await User.findOne({ email });
        if (!exists) {
          await User.create({
            fullName: u.fullName || 'User',
            email,
            passwordHash: u.passwordHash,
            role: u.role || 'user',
            accountStatus: 'active',
            status: 'active',
            primaryCareerDomain: u.primaryCareerDomain || '',
            secondaryCareerDomains: u.secondaryCareerDomains || [],
            targetRole: u.targetRole || '',
            targetCareerId: u.targetCareerId || null,
            onboardingCompleted: Boolean(u.onboardingCompleted),
            onboardingCompletedAt: u.onboardingCompletedAt ? new Date(u.onboardingCompletedAt) : undefined,
            profileCompleted: Boolean(u.profileCompleted),
          });
          logger.info(`🟢 Restored user account from persistent storage: ${email}`);
        }
      }
    } catch (err) {
      logger.warn('Failed to restore user backups:', err);
    }
  }

  /**
   * Registers a new user, hashes their password, and issues initial access and refresh tokens.
   */
  async register(fullName: string, email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('Email address is already registered.') as AppError;
      error.statusCode = 400;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.userRepository.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
    });

    // Write to persistent redundancy mirror
    await AuthService.backupUserToFile({
      id: user.id,
      fullName: user.fullName,
      email: normalizedEmail,
      passwordHash,
      role: user.role,
      primaryCareerDomain: user.primaryCareerDomain || '',
      secondaryCareerDomains: user.secondaryCareerDomains || [],
      targetRole: user.targetRole || '',
      targetCareerId: user.targetCareerId || null,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      onboardingCompletedAt: user.onboardingCompletedAt,
      profileCompleted: Boolean(user.profileCompleted),
    });

    const accessToken = signAccessToken(user.id, user.role || 'user');
    const refreshTokenString = signRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await this.refreshTokenRepository.create({
      userId: user._id ? user._id.toString() : user.id,
      token: refreshTokenString,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        primaryCareerDomain: user.primaryCareerDomain || '',
        secondaryCareerDomains: user.secondaryCareerDomains || [],
        targetRole: user.targetRole || '',
        targetCareerId: user.targetCareerId || null,
        onboardingCompleted: Boolean(user.onboardingCompleted),
        onboardingCompletedAt: user.onboardingCompletedAt || null,
        profileCompleted: Boolean(user.profileCompleted),
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Log in user credentials, hashes password, and issues access/refresh tokens.
   */
  async login(email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();
    let user = await this.userRepository.findByEmail(normalizedEmail);

    // If user not found in active collection, attempt restore from persistent mirror
    if (!user) {
      await AuthService.restoreUserBackups();
      user = await this.userRepository.findByEmail(normalizedEmail);
    }

    if (!user) {
      const error = new Error('Invalid email or password.') as AppError;
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (user.accountStatus !== 'active') {
      const error = new Error('Your account is currently inactive or suspended.') as AppError;
      error.statusCode = 403;
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    if (!user.passwordHash) {
      const error = new Error('Password is not set for this account. Please contact support or reset your password.') as AppError;
      error.statusCode = 400;
      error.code = 'PASSWORD_NOT_SET';
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.') as AppError;
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Sync last login
    user.lastLogin = new Date();
    await user.save();

    const accessToken = signAccessToken(user.id, user.role || 'user');
    const refreshTokenString = signRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepository.create({
      userId: user._id ? user._id.toString() : user.id,
      token: refreshTokenString,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        primaryCareerDomain: user.primaryCareerDomain || '',
        secondaryCareerDomains: user.secondaryCareerDomains || [],
        targetRole: user.targetRole || '',
        targetCareerId: user.targetCareerId || null,
        onboardingCompleted: Boolean(user.onboardingCompleted),
        onboardingCompletedAt: user.onboardingCompletedAt || null,
        profileCompleted: Boolean(user.profileCompleted),
      },
      accessToken,
      refreshToken: refreshTokenString
    };
  }

  /**
   * Revokes a session's refresh token.
   */
  async logout(refreshTokenString: string): Promise<void> {
    await this.refreshTokenRepository.revoke(refreshTokenString);
  }

  /**
   * Validates a refresh token, revokes it, and issues a brand new access and refresh token pair (Rotation).
   * Implements automated threat containment: if a token is reused, all active sessions for that user are terminated.
   */
  async refresh(refreshTokenString: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenString);
    } catch {
      const error = new Error('Invalid or expired refresh token.') as AppError;
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    const tokenDoc = await this.refreshTokenRepository.findByToken(refreshTokenString);

    // Breach Detection: Reuse of a previously revoked token
    if (!tokenDoc || tokenDoc.isRevoked) {
      if (tokenDoc) {
        // Revoke all tokens for this compromised account immediately
        await this.refreshTokenRepository.revokeAllForUser(tokenDoc.userId.toString());
      }
      const error = new Error(
        'Session compromised or token reused. Please sign in again.'
      ) as AppError;
      error.statusCode = 401;
      error.code = 'REVOKED_REFRESH_TOKEN';
      throw error;
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.accountStatus !== 'active') {
      const error = new Error('User account is invalid or suspended.') as AppError;
      error.statusCode = 401;
      error.code = 'USER_INVALID';
      throw error;
    }

    const newAccessToken = signAccessToken(user.id, user.role || 'user');
    const newRefreshTokenString = signRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Revoke old token and link to replacement token
    await this.refreshTokenRepository.revoke(refreshTokenString, newRefreshTokenString);

    // Save new token
    await this.refreshTokenRepository.create({
      userId: user._id ? user._id.toString() : user.id,
      token: newRefreshTokenString,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString
    };
  }
}

export default AuthService;
