import { Router } from 'express';
import ResumeController from '../controllers/ResumeController.js';
import authenticate from '../middlewares/auth.js';
import { validateResumeUpload } from '../middlewares/upload.js';

const router = Router();
const controller = new ResumeController();

// Apply authentication universally to all resume endpoints
router.use(authenticate);

// POST /api/v1/resumes/upload - Secure resume upload
router.post('/upload', validateResumeUpload, controller.upload);

// PUT /api/v1/resumes/replace - Secure resume replacement
router.put('/replace', validateResumeUpload, controller.replace);

// GET /api/v1/resumes/me - Fetch currently active resume metadata
router.get('/me', controller.getMe);

// GET /api/v1/resumes/download - Securely stream the active resume file download
router.get('/download', controller.download);

// DELETE /api/v1/resumes - Terminate the active resume
router.delete('/', controller.delete);

export default router;
