import { Router } from 'express';
import CareerController from '../controllers/CareerController.js';
import CareerLabController from '../controllers/CareerLabController.js';
import CareerExplanationController from '../controllers/CareerExplanationController.js';
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

// Optional local-AI explanation of a match (the score itself never changes); GET never runs the model
router.get('/:careerId/explanation', CareerExplanationController.get);
router.post('/:careerId/explanation', CareerExplanationController.generate);
router.get('/:careerId/explanations/:subject', CareerExplanationController.getSubject);
router.post('/:careerId/explanations/:subject', CareerExplanationController.generateSubject);

export default router;
