import { Request, Response, NextFunction } from 'express';
import CareerMatchExplanationService from '../services/explanations/CareerMatchExplanationService.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET  /careers/:careerId/explanation  the saved local-AI explanation, if any (never runs the model)
 * POST /careers/:careerId/explanation  the saved one if still current, otherwise a new one
 * Both act only on the signed-in user's own match. The request body is ignored: the facts are
 * built on the server from the stored match.
 */
class CareerExplanationController {
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);
      res.status(200).json({ success: true, data: await CareerMatchExplanationService.get(userId, req.params.careerId) });
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);
      res.status(200).json({ success: true, data: await CareerMatchExplanationService.generate(userId, req.params.careerId) });
    } catch (error) {
      next(error);
    }
  };
}

export default new CareerExplanationController();
