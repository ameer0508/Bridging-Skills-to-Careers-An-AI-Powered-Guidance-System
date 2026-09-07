import { Request, Response, NextFunction } from 'express';
import RoadmapService from '../services/RoadmapService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { RoadmapItemStatus } from '../models/LearningRoadmap.js';

class RoadmapController {
  /**
   * Retrieves the roadmap for a specific career for the authenticated user.
   */
  getRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { careerId } = req.params;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!careerId) throw new AppError('Career ID is required.', 400);

      let roadmap = await RoadmapService.getRoadmap(userId, careerId);

      // If no roadmap exists, optionally trigger a generation now (or rely on async triggers)
      if (!roadmap) {
        roadmap = await RoadmapService.generateRoadmap(userId, careerId);
      }

      res.status(200).json({
        success: true,
        data: { roadmap }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Triggers a manual regeneration of the roadmap for a specific career.
   */
  regenerateRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { careerId } = req.params;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!careerId) throw new AppError('Career ID is required.', 400);

      const roadmap = await RoadmapService.generateRoadmap(userId, careerId);

      res.status(200).json({
        success: true,
        data: { roadmap }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the status of a specific item in the roadmap.
   */
  updateItemStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { careerId, itemId } = req.params;
      const { status } = req.body;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!careerId || !itemId) throw new AppError('Career ID and Item ID are required.', 400);
      if (!status) throw new AppError('Status is required.', 400);

      const validStatuses: RoadmapItemStatus[] = [
        'not_started',
        'in_progress',
        'completed',
        'skipped'
      ];
      if (!validStatuses.includes(status as RoadmapItemStatus)) {
        throw new AppError('Invalid status value.', 400);
      }

      const roadmap = await RoadmapService.updateItemStatus(
        userId,
        careerId,
        itemId,
        status as RoadmapItemStatus
      );

      res.status(200).json({
        success: true,
        data: { roadmap }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new RoadmapController();
