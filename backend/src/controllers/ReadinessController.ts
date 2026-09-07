import { Request, Response, NextFunction } from 'express';
import CareerReadinessService from '../services/CareerReadinessService.js';
import { AppError } from '../middlewares/errorHandler.js';

class ReadinessController {
  /**
   * Retrieves readiness and gap analysis for the authenticated user.
   */
  getReadiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication is required.', 401);
      }

      const readiness = await CareerReadinessService.getUserReadiness(userId);

      // If no readiness is found, force compute once (typically handled async after skills extraction)
      if (readiness.length === 0) {
        await CareerReadinessService.evaluateUser(userId);
        const freshReadiness = await CareerReadinessService.getUserReadiness(userId);
        res.status(200).json({ success: true, data: { readiness: freshReadiness } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { readiness }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ReadinessController();
