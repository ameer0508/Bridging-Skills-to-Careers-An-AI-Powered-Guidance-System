import { Router } from 'express';
import RoadmapController from '../controllers/RoadmapController.js';
import LearningPlanController from '../controllers/LearningPlanController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/:careerId/schedule', LearningPlanController.schedule);
router.get('/:careerId', RoadmapController.getRoadmap);
router.post('/:careerId/regenerate', RoadmapController.regenerateRoadmap);
router.patch('/:careerId/items/:itemId/status', RoadmapController.updateItemStatus);

export default router;
