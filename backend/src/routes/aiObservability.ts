import { Router } from 'express';
import AiObservabilityController, { requireAdmin } from '../controllers/AiObservabilityController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// X11: AI gateway decisions, failure categories, latency and provider policy status (admins only)
router.use(requireAuth, requireAdmin);
router.get('/summary', AiObservabilityController.summary);
router.get('/events', AiObservabilityController.events);
router.get('/providers', AiObservabilityController.providers);

export default router;
