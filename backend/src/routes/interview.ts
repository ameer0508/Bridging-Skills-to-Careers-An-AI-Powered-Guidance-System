import { Router } from 'express';
import InterviewController from '../controllers/InterviewController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/history', InterviewController.getHistory);
router.post('/', InterviewController.startSession);
router.get('/:id', InterviewController.getSession);
router.post('/:id/respond', InterviewController.respondToQuestion);
router.post('/:id/complete', InterviewController.completeSession);
router.get('/:id/report', InterviewController.getReport);

export default router;
