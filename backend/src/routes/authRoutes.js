/**
 * Auth Routes — register, login, me, logout
 */
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, generateToken } = require('../middleware/auth');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/responseHelper');

const router = express.Router();

// ── POST /api/auth/register ────────────────────────────────────────────────────
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findByEmail(email);
      if (existing) throw new AppError('An account with this email already exists.', 409);

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);

      return sendSuccess(res, 201, 'Account created successfully', {
        token,
        user: { id: user._id, name: user.name, email: user.email, skills: user.skills, targetRole: user.targetRole },
      });
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login',
  [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Invalid email or password.', 401);
      }

      const token = generateToken(user._id);

      return sendSuccess(res, 200, 'Login successful', {
        token,
        user: { id: user._id, name: user.name, email: user.email, skills: user.skills, targetRole: user.targetRole, education: user.education, careerInterests: user.careerInterests },
      });
    } catch (err) { next(err); }
  }
);

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return sendSuccess(res, 200, 'User profile retrieved', { user });
  } catch (err) { next(err); }
});

// ── PUT /api/auth/me ───────────────────────────────────────────────────────────
router.put('/me', protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, skills, targetRole, education, careerInterests } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (skills !== undefined) updates.skills = skills;
      if (targetRole !== undefined) updates.targetRole = targetRole;
      if (education !== undefined) updates.education = education;
      if (careerInterests !== undefined) updates.careerInterests = careerInterests;

      const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
      return sendSuccess(res, 200, 'Profile updated', { user });
    } catch (err) { next(err); }
  }
);

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
router.post('/logout', protect, (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully', null);
});

module.exports = router;
