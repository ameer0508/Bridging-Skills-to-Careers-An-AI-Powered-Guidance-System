import { Router } from 'express';
import ApplicationOutcomeController from '../controllers/ApplicationOutcomeController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// Outcome analytics over the caller's own tracked applications only
router.get('/outcomes', ApplicationOutcomeController.outcomes);

export default router;
