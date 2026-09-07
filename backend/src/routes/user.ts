import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import validate from '../middlewares/validate.js';
import { updateProfileSchema } from '../validators/user.js';
import authenticate from '../middlewares/auth.js';

const router = Router();
const controller = new UserController();

// Fetch current user details - Requires JWT Auth
router.get('/me', authenticate, controller.getMe);
router.get('/me/career-snapshot', authenticate, controller.getCareerSnapshot);

// Update profile details - Requires JWT Auth and validates the schema fields
router.put('/me', authenticate, validate(updateProfileSchema), controller.updateMe);

export default router;
