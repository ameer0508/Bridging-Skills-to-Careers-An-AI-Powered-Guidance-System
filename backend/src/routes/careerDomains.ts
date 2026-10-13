import { Router } from 'express';
import CareerDomainController from '../controllers/CareerDomainController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// E1: careers added from O*NET with their provenance, and the caller's matches for them
router.get('/', CareerDomainController.catalogue);
router.get('/matches', CareerDomainController.matches);

export default router;
