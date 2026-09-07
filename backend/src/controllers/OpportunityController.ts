import { Request, Response, NextFunction } from 'express';
import OpportunityService from '../services/OpportunityService.js';
import { AppError } from '../middlewares/errorHandler.js';

class OpportunityController {
  /**
   * Searches live external opportunities with candidate SkillBridge match telemetry.
   */
  getOpportunities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const { search, location, remote, employmentType, datePosted, sortBy, minScore, page, limit } = req.query;

      const query = {
        keywords: typeof search === 'string' ? search : undefined,
        location: typeof location === 'string' ? location : undefined,
        remoteOnly: remote === 'true',
        employmentType: typeof employmentType === 'string' ? employmentType : undefined,
        datePosted: typeof datePosted === 'string' ? datePosted : undefined,
        sortBy: typeof sortBy === 'string' && ['match', 'date', 'salary', 'relevance'].includes(sortBy)
          ? (sortBy as 'match' | 'date' | 'salary' | 'relevance')
          : undefined,
        page: typeof page === 'string' ? parseInt(page, 10) : 1,
        limit: typeof limit === 'string' ? parseInt(limit, 10) : 10,
      };

      const result = await OpportunityService.searchOpportunities(userId, query);

      let opportunities = result.opportunities;
      if (minScore) {
        const threshold = parseInt(String(minScore), 10);
        if (!isNaN(threshold)) {
          opportunities = opportunities.filter((o) => o.skillbridgeMatchScore >= threshold);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          opportunities,
          total: opportunities.length,
          page: query.page,
          providerHealth: result.providerHealth,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves single live external opportunity by ID.
   */
  getOpportunityById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!id) throw new AppError('Opportunity ID is required.', 400);

      const opportunity = await OpportunityService.getOpportunityById(userId, id);
      if (!opportunity) throw new AppError('Opportunity not found.', 404);

      res.status(200).json({
        success: true,
        data: { opportunity },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Saves an opportunity for persistent user application tracking.
   */
  saveOpportunity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const oppData = req.body;
      const saved = await OpportunityService.saveOpportunity(userId, oppData);

      res.status(201).json({
        success: true,
        data: { savedOpportunity: saved },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Removes a saved opportunity.
   */
  deleteSavedOpportunity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!id) throw new AppError('Opportunity ID is required.', 400);

      const deleted = await OpportunityService.unsaveOpportunity(userId, id);

      res.status(200).json({
        success: true,
        data: { deleted },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves all saved opportunities for an authenticated user.
   */
  getSavedOpportunities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const saved = await OpportunityService.getSavedOpportunities(userId);

      res.status(200).json({
        success: true,
        data: { savedOpportunities: saved, total: saved.length },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates application pipeline status for a saved opportunity.
   */
  updateSavedStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!id) throw new AppError('Opportunity ID is required.', 400);
      if (!status) throw new AppError('Status is required.', 400);

      const updated = await OpportunityService.updateSavedStatus(userId, id, status, notes);

      res.status(200).json({
        success: true,
        data: { savedOpportunity: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves persistent application pipeline telemetry metrics.
   */
  getTelemetry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const telemetry = await OpportunityService.getSavedTelemetry(userId);

      res.status(200).json({
        success: true,
        data: telemetry,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new OpportunityController();
