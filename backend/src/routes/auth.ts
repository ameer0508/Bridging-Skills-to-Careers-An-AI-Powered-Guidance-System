import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import validate from '../middlewares/validate.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.js';
import authRateLimiter from '../middlewares/rateLimiter.js';

const router = Router();
const controller = new AuthController();

// Registration route - Rate-limited and validated
router.post('/register', authRateLimiter, validate(registerSchema), controller.register);

// Login route - Rate-limited and validated
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);

// Logout route - Validates refresh token parameter
router.post('/logout', validate(refreshSchema), controller.logout);

// Refresh Token rotation route - Validates old refresh token
router.post('/refresh', validate(refreshSchema), controller.refresh);

export default router;
