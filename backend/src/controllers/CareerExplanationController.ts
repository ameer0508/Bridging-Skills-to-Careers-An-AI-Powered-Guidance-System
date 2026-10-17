import { Request, Response, NextFunction } from 'express';
import CareerMatchExplanationService from '../services/explanations/CareerMatchExplanationService.js';
import ExplanationService from '../services/explanations/ExplanationService.js';
import '../services/explanations/GuidanceExplanationSubjects.js';
import type { ExplanationSubject } from '../models/AIExplanation.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * GET  /careers/:careerId/explanation  the saved local-AI explanation, if any (never runs the model)
 * POST /careers/:careerId/explanation  the saved one if still current, otherwise a new one
 * Both act only on the signed-in user's own match. The request body is ignored: the facts are
 * built on the server from the stored match.
 *
 * GET/POST /careers/:careerId/explanations/:subject  the same for readiness, skill-gap and
 * next-action (Phase 2), each built from the user's own stored record for that career.
 */
const SUBJECTS: Record<string, ExplanationSubject> = {
  readiness: 'readiness',
  'skill-gap': 'skill_gap',
  'next-action': 'next_action',
};

function subjectOf(req: Request): ExplanationSubject {
  const subject = SUBJECTS[req.params.subject];
  if (!subject) throw new AppError('Unknown explanation subject.', 404, 'NOT_FOUND');
  return subject;
}

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

  getSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);
      res.status(200).json({ success: true, data: await ExplanationService.get(subjectOf(req), userId, req.params.careerId) });
    } catch (error) {
      next(error);
    }
  };

  generateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError('Authentication is required.', 401);
      res.status(200).json({ success: true, data: await ExplanationService.generate(subjectOf(req), userId, req.params.careerId) });
    } catch (error) {
      next(error);
    }
  };
}

export default new CareerExplanationController();
