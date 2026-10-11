import { Router } from 'express';
import RecommendationController from '../controllers/RecommendationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', RecommendationController.getRecommendations);
router.post('/generate', RecommendationController.regenerateRecommendations);
router.patch('/:id/status', RecommendationController.updateStatus);

export default router;
