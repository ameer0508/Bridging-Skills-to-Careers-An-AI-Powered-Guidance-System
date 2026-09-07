import { Request, Response, NextFunction } from 'express';
import RecommendationService from '../services/RecommendationService.js';
import RecommendationEngine from '../services/RecommendationEngine.js';
import { AppError } from '../middlewares/errorHandler.js';
import { RecommendationStatus } from '../models/Recommendation.js';

class RecommendationController {
  /**
   * Retrieves all recommendations for the authenticated user.
   */
  getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const recommendations = await RecommendationService.getUserRecommendations(userId);

      // Trigger first-time compute if none exist (normally async)
      if (recommendations.length === 0) {
        await RecommendationEngine.generateForUser(userId);
        const fresh = await RecommendationService.getUserRecommendations(userId);
        res.status(200).json({ success: true, data: { recommendations: fresh } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the status of a specific recommendation (e.g. accepted, dismissed)
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { status } = req.body;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!status) throw new AppError('Status is required.', 400);

      const validStatuses: RecommendationStatus[] = [
        'active',
        'accepted',
        'dismissed',
        'completed',
        'saved_for_later'
      ];
      if (!validStatuses.includes(status as RecommendationStatus)) {
        throw new AppError('Invalid status value.', 400);
      }

      const updated = await RecommendationService.updateRecommendationStatus(
        userId,
        id,
        status as RecommendationStatus
      );

      res.status(200).json({
        success: true,
        data: { recommendation: updated }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new RecommendationController();
