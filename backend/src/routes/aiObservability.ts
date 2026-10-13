import { Router } from 'express';
import AiObservabilityController from '../controllers/AiObservabilityController.js';
import { requireAuth, authorize } from '../middlewares/auth.js';

const router = Router();

// X11: AI gateway decisions, failure categories, latency and provider policy status (admins only)
router.use(requireAuth, authorize(['admin']));
router.get('/summary', AiObservabilityController.summary);
router.get('/events', AiObservabilityController.events);
router.get('/providers', AiObservabilityController.providers);

export default router;
