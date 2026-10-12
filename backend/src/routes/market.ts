import { Router } from 'express';
import MarketController from '../controllers/MarketController.js';
import { requireAuth, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// Read side: registered sources and dated posting history
router.get('/sources', MarketController.listSources);
router.get('/history', MarketController.history);
router.get('/skill-trends', MarketController.skillTrends);
router.get('/salaries', MarketController.salaries);
router.get('/forecast', MarketController.forecast);
router.get('/careers/:careerId/summary', MarketController.careerSummary);
router.get('/careers/:careerId/signals', MarketController.careerSignals);

// Write side: importing postings from a registered source is an operator task
router.post('/imports', authorize(['admin']), MarketController.importPostings);
router.get('/imports', authorize(['admin']), MarketController.listImports);

export default router;
