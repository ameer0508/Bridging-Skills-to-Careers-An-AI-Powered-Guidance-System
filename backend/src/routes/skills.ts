import { Router } from 'express';
import SkillController from '../controllers/SkillController.js';
import CareerLabController from '../controllers/CareerLabController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all skill routes
router.use(requireAuth);

router.get('/me', SkillController.getMine);
router.get('/graph', SkillController.getGraph);
router.get('/freshness', CareerLabController.freshness);
router.get('/assessments', CareerLabController.assessments);
router.post('/assessments', CareerLabController.startAssessment);
router.post('/assessments/:attemptId/submit', CareerLabController.submitAssessment);
router.post('/:userSkillId/revalidate', CareerLabController.revalidate);

export default router;
