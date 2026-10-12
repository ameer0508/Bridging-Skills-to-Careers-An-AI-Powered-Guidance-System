import { Router } from 'express';
import InterviewController from '../controllers/InterviewController.js';
import TechnicalAssessmentController from '../controllers/TechnicalAssessmentController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/rubrics', InterviewController.listRubrics);

// D4 technical assessments (read and answer; nothing is executed). Before '/:id' so they are not read as session ids.
router.get('/assessments/catalog', TechnicalAssessmentController.catalog);
router.get('/assessments', TechnicalAssessmentController.list);
router.post('/assessments', TechnicalAssessmentController.start);
router.get('/assessments/:id', TechnicalAssessmentController.get);
router.post('/assessments/:id/answers', TechnicalAssessmentController.answer);
router.post('/assessments/:id/finish', TechnicalAssessmentController.finish);

router.get('/history', InterviewController.getHistory);
router.get('/progress', InterviewController.getProgress);
router.post('/', InterviewController.startSession);
router.get('/:id', InterviewController.getSession);
router.post('/:id/respond', InterviewController.respondToQuestion);
router.post('/:id/complete', InterviewController.completeSession);
router.get('/:id/report', InterviewController.getReport);

export default router;
