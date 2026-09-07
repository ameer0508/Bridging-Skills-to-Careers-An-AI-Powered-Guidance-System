import { Router } from 'express';
import OpportunityController from '../controllers/OpportunityController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', OpportunityController.getOpportunities);
router.get('/saved', OpportunityController.getSavedOpportunities);
router.get('/telemetry', OpportunityController.getTelemetry);
router.post('/save', OpportunityController.saveOpportunity);
router.post('/:id/save', OpportunityController.saveOpportunity);
router.delete('/:id/save', OpportunityController.deleteSavedOpportunity);
router.patch('/saved/:id/status', OpportunityController.updateSavedStatus);
router.get('/:id', OpportunityController.getOpportunityById);

export default router;
