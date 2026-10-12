import { Router } from 'express';
import CareerController from '../controllers/CareerController.js';
import CareerLabController from '../controllers/CareerLabController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Protect all career routes
router.use(requireAuth);

router.get('/matches', CareerController.getMatches);

// Career Lab: comparison, what-if, counterfactuals and transition plans (nothing here changes scores)
router.get('/catalog', CareerLabController.listCareers);
router.post('/compare', CareerLabController.compare);
router.post('/what-if', CareerLabController.whatIf);
router.get('/transition-plans', CareerLabController.listPlans);
router.post('/transition-plans', CareerLabController.createPlan);
router.delete('/transition-plans/:planId', CareerLabController.deletePlan);
router.get('/:careerId/counterfactuals', CareerLabController.counterfactuals);
router.get('/:careerId/market-evidence', CareerLabController.marketEvidence);

export default router;
