import { Router } from 'express';
import ApplicationOutcomeController from '../controllers/ApplicationOutcomeController.js';
import ApplicationHistoryController from '../controllers/ApplicationHistoryController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// Outcome analytics over the caller's own tracked applications only
router.get('/outcomes', ApplicationOutcomeController.outcomes);

// Per-application history (X8); every operation is scoped to the caller
router.get('/', ApplicationHistoryController.list);
router.post('/manual', ApplicationHistoryController.createManual);
router.get('/:id/history', ApplicationHistoryController.history);
router.post('/:id/events', ApplicationHistoryController.addEvent);
router.patch('/:id/events/:eventId', ApplicationHistoryController.correctEvent);
router.delete('/:id/events/:eventId', ApplicationHistoryController.removeEvent);
router.put('/:id/reminder', ApplicationHistoryController.setReminder);

export default router;
