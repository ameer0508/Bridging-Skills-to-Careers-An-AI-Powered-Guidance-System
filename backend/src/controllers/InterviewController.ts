import { Request, Response, NextFunction } from 'express';
import interviewService from '../services/InterviewService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { z } from 'zod';
import { resolveRubric, RUBRIC_IDS, RUBRICS, rubricById, type RubricId } from '../services/interview/InterviewRubrics.js';
import InterviewProgressService from '../services/interview/InterviewProgressService.js';
import VoiceSettingsService from '../services/interview/VoiceSettingsService.js';

/** Longest interview answer accepted, in characters. */
const MAX_ANSWER_LENGTH = 10000;

const startSessionSchema = z
  .object({
    targetCareerId: z.string().max(40).optional(),
    targetCareerTitle: z.string().trim().max(160).optional(),
    mode: z.enum(['technical', 'behavioral', 'project', 'resume', 'career', 'mixed']).optional(),
    questionCount: z.number().int().min(1).max(10).optional(),
    rubricId: z.enum(RUBRIC_IDS as [RubricId, ...RubricId[]]).optional(),
    adaptiveFollowUps: z.boolean().optional(),
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
   * GET /api/v1/interviews/rubrics
   * The role rubrics and their weights, so the client can show how answers are scored
   */
  listRubrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) throw new AppError('Authentication required', 401);
      const parsed = z.object({ role: z.string().trim().max(160).optional() }).strict().safeParse(req.query ?? {});
      if (!parsed.success) throw new AppError('Invalid request: only an optional role (up to 160 characters) is accepted', 400, 'VALIDATION_ERROR');
      res.status(200).json({
        success: true,
        // `resolved` is the rubric a session for `role` would use when none is chosen
        data: { rubrics: RUBRIC_IDS.map(id => RUBRICS[id]), resolved: resolveRubric(parsed.data.role).id },
      });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/v1/interviews/voice-settings: dictation and recording consent (D1, D2) */
  getVoiceSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);
      res.status(200).json({ success: true, data: await VoiceSettingsService.get(userId) });
    } catch (err) {
      next(err);
    }
  };

  /** PUT /api/v1/interviews/voice-settings: every change is recorded in the settings history */
  updateVoiceSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);
      const parsed = z
        .object({
          dictationConsent: z.enum(['none', 'on_device_only', 'browser_service']).optional(),
          recordingConsent: z.boolean().optional(),
          retentionDays: z.union([z.literal(0), z.literal(7), z.literal(30)]).optional(),
        })
        .strict()
        .refine((b) => Object.keys(b).length > 0, { message: 'nothing to change' })
        .safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new AppError(`Invalid request: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'body'} ${i.message}`).join('; ')}`, 400, 'VALIDATION_ERROR');
      }
      res.status(200).json({ success: true, data: await VoiceSettingsService.update(userId, parsed.data) });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/interviews/progress
   * D6: per-dimension comparison across the caller's completed sessions
   */
  getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication required', 401);
      const parsed = z
        .object({ mode: z.enum(['technical', 'behavioral', 'project', 'resume', 'career', 'mixed']).optional() })
        .strict()
        .safeParse(req.query ?? {});
      if (!parsed.success) throw new AppError('Invalid request: only an optional interview mode is accepted', 400, 'VALIDATION_ERROR');
      res.status(200).json({ success: true, data: await InterviewProgressService.forUser(userId, parsed.data) });
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
      const { questionIndex, candidateResponse, inputMethod } = req.body;
      if (inputMethod !== undefined && !['typed', 'dictated', 'mixed'].includes(inputMethod)) {
        throw new AppError('inputMethod must be typed, dictated or mixed', 400, 'VALIDATION_ERROR');
      }

      if (!Number.isInteger(questionIndex) || questionIndex < 0 || typeof candidateResponse !== 'string') {
        throw new AppError('questionIndex (a whole number) and candidateResponse (text) are required', 400, 'VALIDATION_ERROR');
      }
      if (!candidateResponse.trim()) {
        throw new AppError('An answer is required.', 400, 'VALIDATION_ERROR');
      }
      if (candidateResponse.length > MAX_ANSWER_LENGTH) {
        throw new AppError(`An answer can be at most ${MAX_ANSWER_LENGTH} characters.`, 400, 'VALIDATION_ERROR');
      }

      const session = await interviewService.respondToQuestion(userId, id, { questionIndex, candidateResponse, inputMethod });

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
          adaptiveFollowUps: Boolean(session.adaptiveFollowUps),
          followUpSummary: session.followUpSummary ?? null,
          evaluationSource: session.evaluationSource ?? null,
          // The role rubric the answers were weighted with (older sessions: general)
          rubric: rubricById(session.rubricId),
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
