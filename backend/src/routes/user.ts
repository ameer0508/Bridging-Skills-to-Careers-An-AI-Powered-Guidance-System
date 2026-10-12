import { Router } from 'express';
import CareerLabController from '../controllers/CareerLabController.js';
import LearningPlanController from '../controllers/LearningPlanController.js';
import UserController from '../controllers/UserController.js';
import validate from '../middlewares/validate.js';
import { updateProfileSchema } from '../validators/user.js';
import authenticate from '../middlewares/auth.js';

const router = Router();
const controller = new UserController();

// Fetch current user details - Requires JWT Auth
router.get('/me', authenticate, controller.getMe);
router.get('/me/career-snapshot', authenticate, controller.getCareerSnapshot);
router.get('/me/intelligence-history', authenticate, CareerLabController.intelligenceHistory);
router.get('/me/learning-preferences', authenticate, LearningPlanController.getPreferences);
router.put('/me/learning-preferences', authenticate, LearningPlanController.updatePreferences);

// Update profile details - Requires JWT Auth and validates the schema fields
router.put('/me', authenticate, validate(updateProfileSchema), controller.updateMe);

export default router;
