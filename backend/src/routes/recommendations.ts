import { Router } from 'express';
import mongoose from 'mongoose';
import NextBestActionService from '../services/NextBestActionService.js';
import { AppError } from '../middlewares/errorHandler.js';
import RecommendationController from '../controllers/RecommendationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// Ranked next actions for a career (`careerId` query; default the target role or best match)
router.get('/next-actions', async (req, res, next) => {
  try {
    const raw = req.query.careerId;
    if (raw !== undefined && (typeof raw !== 'string' || !mongoose.Types.ObjectId.isValid(raw))) {
      throw new AppError('Invalid request: careerId is not a valid id', 400, 'VALIDATION_ERROR');
    }
    res.status(200).json({ success: true, data: await NextBestActionService.forUser(req.user!.userId, raw as string | undefined) });
  } catch (error) {
    next(error);
  }
});
router.get('/', RecommendationController.getRecommendations);
router.post('/generate', RecommendationController.regenerateRecommendations);
router.patch('/:id/status', RecommendationController.updateStatus);

export default router;
