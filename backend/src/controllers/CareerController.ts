import { Request, Response, NextFunction } from 'express';
import CareerService from '../services/CareerService.js';
import CareerMatchingEngine from '../services/CareerMatchingEngine.js';
import { AppError } from '../middlewares/errorHandler.js';

class CareerController {
  /**
   * Retrieves top matched careers for the authenticated user.
   */
  getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication is required.', 401);
      }

      // Optionally, we could force a re-evaluation here if skills changed recently,
      // but typically that happens asynchronously when skills update.
      // For safety/testing, we can run it on demand if no matches exist,
      // but usually the pipeline handles it.

      const matches = await CareerService.getUserMatches(userId);

      // If no matches, try evaluating once
      if (matches.length === 0) {
        await CareerMatchingEngine.evaluateUser(userId);
        const newMatches = await CareerService.getUserMatches(userId);
        res.status(200).json({ success: true, data: { matches: newMatches } });
        return;
      }

      res.status(200).json({
        success: true,
        data: { matches }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new CareerController();
