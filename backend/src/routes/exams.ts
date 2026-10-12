import { Router } from 'express';
import ExamController from '../controllers/ExamController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ExamController.catalog);

// Attempts by id first, so 'attempts' is never read as an exam id
router.get('/attempts/:attemptId', ExamController.getAttempt);
router.put('/attempts/:attemptId/answers', ExamController.answer);
router.post('/attempts/:attemptId/sections/:sectionId/start', ExamController.startSection);
router.post('/attempts/:attemptId/submit', ExamController.submit);

router.get('/:examId', ExamController.exam);
router.post('/:examId/attempts', ExamController.startAttempt);
router.get('/:examId/attempts', ExamController.listAttempts);
router.get('/:examId/performance', ExamController.performance);
router.get('/:examId/plan', ExamController.getPlan);
router.put('/:examId/plan', ExamController.generatePlan);
router.patch('/:examId/plan/items/:itemId', ExamController.setPlanItem);

export default router;
