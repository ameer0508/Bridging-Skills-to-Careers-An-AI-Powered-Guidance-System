import { Router } from 'express';
import EmployerController from '../controllers/EmployerController.js';
import { requireAuth, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

// First-party job postings with stored permissions (docs/EMPLOYER_POSTINGS.md)
router.get('/terms', EmployerController.terms);
router.get('/organization', EmployerController.getOrganization);
router.put('/organization', EmployerController.saveOrganization);

router.get('/postings', EmployerController.listOpen);
router.get('/postings/mine', EmployerController.listMine);
router.post('/postings', EmployerController.create);
router.patch('/postings/:id', EmployerController.update);
router.delete('/postings/:id', EmployerController.remove);
router.post('/postings/:id/publish', EmployerController.publish);
router.post('/postings/:id/close', EmployerController.close);
router.post('/postings/:id/withdraw', EmployerController.withdraw);
router.post('/postings/:id/reports', EmployerController.report);

// Moderation; the role is read from the database on each request
router.get('/admin/reports', authorize(['admin']), EmployerController.listReported);
router.post('/admin/postings/:id/hide', authorize(['admin']), EmployerController.hide);
router.post('/admin/postings/:id/restore', authorize(['admin']), EmployerController.restore);

export default router;
