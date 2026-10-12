import { Request, Response, NextFunction } from 'express';
import CareerDomainPreviewService, { catalogueView } from '../services/careers/CareerDomainPreviewService.js';
import { AppError } from '../middlewares/errorHandler.js';

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};
const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};
const noQuery = (req: Request) => {
  if (Object.keys(req.query ?? {}).length) throw new AppError('Invalid request: this endpoint takes no parameters', 400, 'VALIDATION_ERROR');
};

/** E1 preview: proposed career domains and a read-only match preview for the caller. */
class CareerDomainController {
  catalogue = handle(async (req, res) => {
    userIdOf(req);
    noQuery(req);
    res.status(200).json({ success: true, data: catalogueView() });
  });

  preview = handle(async (req, res) => {
    const userId = userIdOf(req);
    noQuery(req);
    res.status(200).json({ success: true, data: await CareerDomainPreviewService.previewForUser(userId) });
  });
}

export default new CareerDomainController();
