import { Router } from 'express';
import ConversationController from '../controllers/ConversationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ConversationController.getConversations);
router.post('/', ConversationController.createConversation);
router.get('/:id', ConversationController.getHistory);
router.post('/:id/messages', ConversationController.sendMessage);
router.patch('/:id/career', ConversationController.switchCareer);
router.post('/messages/:id/feedback', ConversationController.submitFeedback);

export default router;
