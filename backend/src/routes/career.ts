import { Router } from 'express';
import CareerController from '../controllers/CareerController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all career routes
router.use(requireAuth);

router.get('/matches', CareerController.getMatches);

export default router;
