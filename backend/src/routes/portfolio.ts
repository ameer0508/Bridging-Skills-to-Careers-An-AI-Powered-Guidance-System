import { Router } from 'express';
import PortfolioController from '../controllers/PortfolioController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// The shared part of a portfolio is public by design: the token in the link is the access control
router.get('/shared/:token', PortfolioController.publicView);

router.use(requireAuth);

router.get('/', PortfolioController.list);
router.post('/', PortfolioController.create);
router.put('/share', PortfolioController.updateShare);
router.put('/:entryId', PortfolioController.update);
router.delete('/:entryId', PortfolioController.remove);

export default router;
