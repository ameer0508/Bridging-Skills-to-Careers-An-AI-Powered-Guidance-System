import { Request, Response, NextFunction } from 'express';
import CareerDomainService, { catalogueView } from '../services/careers/CareerDomainService.js';
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

/** E1: the careers added from O*NET, their provenance, and the caller's stored matches for them. */
class CareerDomainController {
  catalogue = handle(async (req, res) => {
    userIdOf(req);
    noQuery(req);
    res.status(200).json({ success: true, data: catalogueView() });
  });

  matches = handle(async (req, res) => {
    const userId = userIdOf(req);
    noQuery(req);
    res.status(200).json({ success: true, data: await CareerDomainService.matchesForUser(userId) });
  });
}

export default new CareerDomainController();
