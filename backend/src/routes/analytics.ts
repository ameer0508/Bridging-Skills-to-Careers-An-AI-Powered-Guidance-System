import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', AnalyticsController.getDashboardData);

export default router;
