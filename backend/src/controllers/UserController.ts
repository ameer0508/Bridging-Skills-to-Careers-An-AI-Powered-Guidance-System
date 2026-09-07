import { Request, Response, NextFunction } from 'express';
import UserService from '../services/UserService.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Retrieves the current user's profile information.
   */
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const user = await this.userService.getUserProfile(userId);
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          accountStatus: user.accountStatus,
          primaryCareerDomain: user.primaryCareerDomain || '',
          secondaryCareerDomains: user.secondaryCareerDomains || [],
          targetCareerId: user.targetCareerId || null,
          targetRole: user.targetRole || '',
          onboardingCompleted: user.onboardingCompleted,
          onboardingCompletedAt: user.onboardingCompletedAt || null,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the current user's profile information.
   */
  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updateData = req.body;
      if (updateData.onboardingCompleted && !updateData.onboardingCompletedAt) {
        updateData.onboardingCompletedAt = new Date();
      }
      const user = await this.userService.updateUserProfile(userId, updateData);

      // Trigger downstream intelligence recalculations if domain/target role changed or onboarding completed
      if (updateData.primaryCareerDomain || updateData.targetRole || updateData.onboardingCompleted) {
        Promise.all([
          import('../services/CareerMatchingEngine.js').then(m => m.default.evaluateUser(userId)),
          import('../services/CareerReadinessService.js').then(m => m.default.evaluateUser(userId)),
          import('../services/SnapshotService.js').then(m => m.default.createSnapshot(userId)),
        ]).catch(err => {
          console.error('Downstream evaluation failure after domain update:', err);
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          accountStatus: user.accountStatus,
          primaryCareerDomain: user.primaryCareerDomain || '',
          secondaryCareerDomains: user.secondaryCareerDomains || [],
          targetCareerId: user.targetCareerId || null,
          targetRole: user.targetRole || '',
          onboardingCompleted: user.onboardingCompleted,
          onboardingCompletedAt: user.onboardingCompletedAt || null,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * Retrieves the unified server-side career snapshot for the current authenticated user.
   */
  getCareerSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { default: snapshotService } = await import('../services/SnapshotService.js');
      const snapshot = await snapshotService.getUnifiedCareerSnapshot(userId);
      res.status(200).json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
