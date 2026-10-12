import { Request, Response, NextFunction } from 'express';
import OpportunityService from '../services/OpportunityService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { z } from 'zod';
import { APPLICATION_STATUSES, type ISavedOpportunity } from '../models/SavedOpportunity.js';

const searchQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  remote: z.enum(['true', 'false']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'INTERNSHIP', 'all']).optional(),
  datePosted: z.enum(['all', 'today', '3days', 'week', 'month']).optional(),
  sortBy: z.enum(['match', 'date', 'salary', 'relevance']).optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  salaryMin: z.coerce.number().min(0).max(1_000_000_000).optional(),
  page: z.coerce.number().int().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const statusBodySchema = z.object({
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]]),
  notes: z.string().max(2000).optional(),
}).strict();

const detailsBodySchema = z.object({
  notes: z.string().max(2000).optional(),
  reminderAt: z.string().max(40).nullable().optional(),
  reminderNote: z.string().max(300).optional(),
}).strict().refine(body => Object.keys(body).length > 0, { message: 'Nothing to update.' });

/** A posting to save. Field types are checked so a value can never be a query operator object. */
const saveBodySchema = z.object({
  externalId: z.string().min(1).max(300),
  provider: z.string().max(120).optional(),
  title: z.string().min(1).max(300),
  company: z.string().min(1).max(300),
  location: z.string().max(300).optional(),
  description: z.string().max(60000).optional(),
  applicationUrl: z.string().max(2000),
  postedAt: z.string().max(60).nullable().optional(),
  employmentType: z.string().max(60).optional(),
  remote: z.boolean().optional(),
  isSample: z.boolean().optional(),
  salary: z.union([
    z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().max(10).optional(),
      period: z.string().max(20).optional(),
    }),
    z.string().max(120),
    z.null(),
  ]).optional(),
  skillbridgeMatchScore: z.number().min(0).max(100).nullable().optional(),
  matchedSkills: z.array(z.string().max(120)).max(200).optional(),
  missingSkills: z.array(z.string().max(120)).max(200).optional(),
  matchExplanation: z.string().max(2000).optional(),
}).passthrough();

function validationError(error: z.ZodError): AppError {
  const detail = error.issues.map(i => `${i.path.join('.') || 'request'}: ${i.message}`).join('; ');
  return new AppError(`Invalid request: ${detail}`, 400, 'VALIDATION_ERROR');
}

/** Adds the computed "reminder is due" flag the client shows next to a saved opportunity. */
function presentSaved(doc: ISavedOpportunity) {
  const plain = doc.toObject();
  return { ...plain, reminderDue: Boolean(doc.reminderAt && doc.reminderAt.getTime() <= Date.now()) };
}

class OpportunityController {
  /**
   * Searches live external opportunities with candidate SkillBridge match telemetry.
   */
  getOpportunities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);

      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) throw validationError(parsed.error);
      const q = parsed.data;

      const query = {
        keywords: q.search || undefined,
        location: q.location || undefined,
        remoteOnly: q.remote === 'true',
        employmentType: q.employmentType && q.employmentType !== 'all'
          ? (q.employmentType === 'INTERNSHIP' ? 'INTERN' : q.employmentType)
          : undefined,
        datePosted: q.datePosted && q.datePosted !== 'all' ? q.datePosted : undefined,
        salaryMin: q.salaryMin,
        sortBy: q.sortBy,
        page: q.page ?? 1,
        limit: q.limit ?? 10,
      };

      const result = await OpportunityService.searchOpportunities(userId, query);

      let opportunities = result.opportunities;
      if (typeof q.minScore === 'number') {
        // Unscored postings cannot satisfy a minimum-score filter
        opportunities = opportunities.filter(
          (o) => o.skillbridgeMatchScore !== null && o.skillbridgeMatchScore >= (q.minScore as number)
        );
      }

      res.status(200).json({
        success: true,
        data: {
          opportunities,
          total: opportunities.length,
          page: query.page,
          providerHealth: result.providerHealth,
          meta: result.meta,
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

      const parsed = saveBodySchema.safeParse(req.body);
      if (!parsed.success) throw validationError(parsed.error);
      // A salary given as text carries no amounts to store
      const oppData = { ...parsed.data, salary: typeof parsed.data.salary === 'object' ? parsed.data.salary : null };
      const saved = await OpportunityService.saveOpportunity(userId, oppData);

      res.status(201).json({
        success: true,
        data: { savedOpportunity: presentSaved(saved) },
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

      await OpportunityService.unsaveOpportunity(userId, id);

      res.status(200).json({
        success: true,
        data: { deleted: true },
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
        data: { savedOpportunities: saved.map(presentSaved), total: saved.length },
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
      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!id) throw new AppError('Opportunity ID is required.', 400);
      const parsed = statusBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) throw validationError(parsed.error);

      const updated = await OpportunityService.updateSavedStatus(
        userId,
        id,
        parsed.data.status as ISavedOpportunity['status'],
        parsed.data.notes
      );

      res.status(200).json({
        success: true,
        data: { savedOpportunity: presentSaved(updated) },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the notes and follow-up reminder of a saved opportunity.
   */
  updateSavedDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) throw new AppError('Authentication is required.', 401);
      if (!id) throw new AppError('Opportunity ID is required.', 400);
      const parsed = detailsBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) throw validationError(parsed.error);

      const updated = await OpportunityService.updateSavedDetails(userId, id, parsed.data);

      res.status(200).json({
        success: true,
        data: { savedOpportunity: presentSaved(updated) },
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
