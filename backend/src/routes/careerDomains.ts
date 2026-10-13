import { Router } from 'express';
import CareerDomainController from '../controllers/CareerDomainController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// E1: proposed career domains (preview until the shared taxonomy patch is applied)
router.get('/', CareerDomainController.catalogue);
router.get('/preview', CareerDomainController.preview);

export default router;
