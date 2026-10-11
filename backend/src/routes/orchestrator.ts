import { Router } from 'express';
import orchestratorController from '../controllers/OrchestratorController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/agents', orchestratorController.getAgents);
router.post('/execute', orchestratorController.executeWorkflow);
router.get('/history', orchestratorController.getHistory);

export default router;
