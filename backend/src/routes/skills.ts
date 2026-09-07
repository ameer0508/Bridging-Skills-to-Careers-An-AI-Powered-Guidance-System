import { Router } from 'express';
import SkillController from '../controllers/SkillController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all skill routes
router.use(requireAuth);

router.get('/me', SkillController.getMine);
router.get('/graph', SkillController.getGraph);

export default router;
