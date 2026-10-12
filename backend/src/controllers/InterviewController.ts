import { Request, Response, NextFunction } from 'express';
import interviewService from '../services/InterviewService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { z } from 'zod';

const startSessionSchema = z
  .object({
    targetCareerId: z.string().max(40).optional(),
    targetCareerTitle: z.string().trim().max(160).optional(),
    mode: z.enum(['technical', 'behavioral', 'project', 'resume', 'career', 'mixed']).optional(),
    questionCount: z.number().int().min(1).max(10).optional(),
    opportunityContext: z
      .object({
        title: z.string().trim().max(200).optional(),
        company: z.string().trim().max(200).optional(),
        description: z.string().max(20000).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export class InterviewController {
  /**
   * POST /api/v1/interviews
   * Start a new grounded AI interview session
   */
  startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const parsed = startSessionSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError(
          `Invalid interview request: ${parsed.error.issues.map(i => `${i.path.join('.') || 'body'} ${i.message}`).join('; ')}`,
          400,
          'VALIDATION_ERROR'
        );
      }

      const session = await interviewService.startSession(userId, parsed.data);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Interview session started',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/interviews/history
   * Retrieve session history for authenticated user
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const history = await interviewService.getHistory(userId);

      res.status(200).json({
        success: true,
        data: { history },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/interviews/:id
   * Retrieve specific interview session by ID
   */
  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const session = await interviewService.getSession(userId, id);

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/interviews/:id/respond
   * Submit candidate response to a question index
   */
  respondToQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const { questionIndex, candidateResponse } = req.body;

      if (typeof questionIndex !== 'number' || typeof candidateResponse !== 'string') {
        throw new AppError('questionIndex (number) and candidateResponse (string) are required', 400);
      }

      const session = await interviewService.respondToQuestion(userId, id, { questionIndex, candidateResponse });

      res.status(200).json({
        success: true,
        data: session,
        message: 'Question response evaluated successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/interviews/:id/complete
   * Finalize and complete interview session
   */
  completeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const session = await interviewService.completeSession(userId, id);

      res.status(200).json({
        success: true,
        data: session,
        message: 'Interview session completed successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/interviews/:id/report
   * Get post-interview report for completed session
   */
  getReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const { id } = req.params;
      const session = await interviewService.getSession(userId, id);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session._id,
          targetCareerTitle: session.targetCareerTitle,
          mode: session.mode,
          status: session.status,
          // Who wrote the questions and who scored the answers, so the client can label both honestly
          questionSource: session.questionSource ?? null,
          evaluationSource: session.evaluationSource ?? null,
          opportunityContext: session.opportunityContext ?? null,
          answeredCount: session.answeredCount ?? 0,
          questionCount: session.questions.length,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          overallScore: session.overallScore || 0,
          dimensionScores: session.dimensionScores || {},
          strengths: session.strengths || [],
          weaknesses: session.weaknesses || [],
          preparationRecommendations: session.preparationRecommendations || [],
          questions: session.questions,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

export default new InterviewController();
