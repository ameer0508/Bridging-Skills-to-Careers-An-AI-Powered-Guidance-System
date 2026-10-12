import { Request, Response, NextFunction } from 'express';
import LearningActivityService from '../services/LearningActivityService.js';
import { AppError } from '../middlewares/errorHandler.js';

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

/** Learning streak, recent activity and in-app notifications. */
class LearningActivityController {
  overview = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await LearningActivityService.overview(userIdOf(req)) });
  });

  unreadCount = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { unreadCount: await LearningActivityService.unreadCount(userIdOf(req)) } });
  });

  markRead = handle(async (req, res) => {
    await LearningActivityService.markRead(userIdOf(req), req.params.notificationId);
    res.status(200).json({ success: true, data: { read: true } });
  });

  markAllRead = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { marked: await LearningActivityService.markAllRead(userIdOf(req)) } });
  });

  dismiss = handle(async (req, res) => {
    await LearningActivityService.remove(userIdOf(req), req.params.notificationId);
    res.status(200).json({ success: true, data: { dismissed: true } });
  });

  dismissAll = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { dismissed: await LearningActivityService.removeAll(userIdOf(req)) } });
  });
}

export default new LearningActivityController();
