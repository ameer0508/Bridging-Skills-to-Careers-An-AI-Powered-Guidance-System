import { Request, Response, NextFunction } from 'express';
import AnalyticsService from '../services/AnalyticsService.js';
import { AppError } from '../middlewares/errorHandler.js';

class AnalyticsController {
  /**
   * Retrieves dashboard analytics data for the authenticated user.
   */
  getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const period = (req.query.period as 'weekly' | 'monthly' | 'quarterly' | 'yearly') || 'monthly';

      if (!userId) throw new AppError('Authentication is required.', 401);

      const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validPeriods.includes(period)) {
         throw new AppError('Invalid period specified.', 400);
      }

      const data = await AnalyticsService.getDashboardData(userId, period);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AnalyticsController();
