import { Request, Response, NextFunction } from 'express';
import orchestratorService from '../services/OrchestratorService.js';
import { AppError } from '../middlewares/errorHandler.js';

class OrchestratorController {
  /**
   * Retrieves all registered autonomous AI agents with live candidate context
   */
  getAgents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const agents = await orchestratorService.getRegisteredAgents(userId);

      res.status(200).json({
        success: true,
        data: {
          agents,
          totalCount: agents.length,
          activeCount: agents.filter(a => a.status === 'ACTIVE').length
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Executes a multi-agent DAG workflow
   */
  executeWorkflow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const { goal, targetCompany } = req.body || {};
      for (const [name, value, max] of [['goal', goal, 500], ['targetCompany', targetCompany, 200]] as const) {
        if (value !== undefined && (typeof value !== 'string' || value.length > max)) {
          throw new AppError(`${name} must be text of at most ${max} characters.`, 400, 'VALIDATION_ERROR');
        }
      }

      const execution = await orchestratorService.executeWorkflow(
        userId,
        goal,
        targetCompany
      );

      res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves historical workflow runs and living system event stream
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const history = await orchestratorService.getHistory(userId);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new OrchestratorController();
