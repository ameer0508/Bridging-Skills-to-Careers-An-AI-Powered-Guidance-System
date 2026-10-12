import { Router } from 'express';
import LearningActivityController from '../controllers/LearningActivityController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', LearningActivityController.overview);
router.get('/unread-count', LearningActivityController.unreadCount);
router.post('/notifications/read-all', LearningActivityController.markAllRead);
router.post('/notifications/:notificationId/read', LearningActivityController.markRead);
router.delete('/notifications', LearningActivityController.dismissAll);
router.delete('/notifications/:notificationId', LearningActivityController.dismiss);

export default router;
