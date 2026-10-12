import { Router } from 'express';
import LearningProjectController from '../controllers/LearningProjectController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/suggestions', LearningProjectController.suggestions);
router.get('/', LearningProjectController.list);
router.post('/', LearningProjectController.start);
router.patch('/:projectId', LearningProjectController.update);
router.delete('/:projectId', LearningProjectController.remove);

export default router;
