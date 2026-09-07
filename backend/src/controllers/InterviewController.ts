import { Request, Response, NextFunction } from 'express';
import interviewService from '../services/InterviewService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class InterviewController {
  /**
   * POST /api/v1/interviews
   * Start a new grounded AI interview session
   */
  startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);

      const session = await interviewService.startSession(userId, req.body);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Grounded AI interview session initialized successfully',
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
