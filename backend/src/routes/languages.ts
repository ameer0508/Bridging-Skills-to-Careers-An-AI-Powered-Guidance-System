import { Router } from 'express';
import LanguageController, { languageFileUpload } from '../controllers/LanguageController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// E5/X1: declared languages, interface language and multilingual resume analyses
router.get('/supported', LanguageController.supported);
router.get('/settings', LanguageController.getSettings);
router.put('/settings', LanguageController.setSettings);
router.post('/resume-analyses', languageFileUpload, LanguageController.analyzeFile);
router.post('/resume-analyses/text', LanguageController.analyzeText);
router.get('/resume-analyses', LanguageController.list);
router.get('/resume-analyses/:id', LanguageController.get);
router.delete('/resume-analyses/:id', LanguageController.remove);

export default router;
