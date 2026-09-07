import { Router } from 'express';
import ReadinessController from '../controllers/ReadinessController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all readiness routes
router.use(requireAuth);

router.get('/', ReadinessController.getReadiness);

export default router;
