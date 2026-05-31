/**
 * Profile Routes
 * Defines all REST endpoints for user profile management.
 * Applies express-validator rules before each controller.
 */

const express = require('express');
const { body, param } = require('express-validator');
const profileController = require('../controllers/profileController');
const validate = require('../middleware/validate');

const router = express.Router();

// ── Validation Rule Sets ───────────────────────────────────────────────────────

/** Validates the request body for creating a profile */
const createProfileRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array.')
    .custom((arr) => arr.length <= 100).withMessage('Skills cannot exceed 100 items.'),

  body('skills.*')
    .optional()
    .isString().withMessage('Each skill must be a string.')
    .trim()
    .notEmpty().withMessage('Skill entries cannot be empty strings.'),

  body('careerInterests')
    .optional()
    .isArray().withMessage('Career interests must be an array.')
    .custom((arr) => arr.length <= 20).withMessage('Career interests cannot exceed 20 items.'),

  body('careerInterests.*')
    .optional()
    .isString().withMessage('Each career interest must be a string.')
    .trim()
    .notEmpty().withMessage('Career interest entries cannot be empty strings.'),

  body('targetRole')
    .optional()
    .isString().withMessage('Target role must be a string.')
    .trim(),

  body('education')
    .optional()
    .isArray().withMessage('Education must be an array.'),

  body('education.*.institution')
    .optional()
    .isString().withMessage('Institution must be a string.'),

  body('education.*.degree')
    .optional()
    .isString().withMessage('Degree must be a string.'),

  body('education.*.fieldOfStudy')
    .optional()
    .isString().withMessage('Field of study must be a string.'),

  body('education.*.startYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Start year must be a valid year.'),

  body('education.*.endYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 10 })
    .withMessage('End year must be a valid year.'),
];

/** Validates the :id param as a valid MongoDB ObjectId */
const idParamRules = [
  param('id')
    .isMongoId().withMessage('Invalid profile ID format.'),
];

/** Validates the request body for updating a profile (all fields optional) */
const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array.')
    .custom((arr) => arr.length <= 100).withMessage('Skills cannot exceed 100 items.'),

  body('careerInterests')
    .optional()
    .isArray().withMessage('Career interests must be an array.'),

  body('targetRole')
    .optional()
    .isString().withMessage('Target role must be a string.')
    .trim(),

  body('education')
    .optional()
    .isArray().withMessage('Education must be an array.'),
];

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/profile
 * @desc    Create a new user profile
 * @access  Public
 */
router.post('/', createProfileRules, validate, profileController.createProfile);

/**
 * @route   GET /api/profile/:id
 * @desc    Get a user profile by ID
 * @access  Public
 */
router.get('/:id', idParamRules, validate, profileController.getProfile);

/**
 * @route   PUT /api/profile/:id
 * @desc    Update a user profile
 * @access  Public
 */
router.put('/:id', [...idParamRules, ...updateProfileRules], validate, profileController.updateProfile);

/**
 * @route   DELETE /api/profile/:id
 * @desc    Delete a user profile
 * @access  Public
 */
router.delete('/:id', idParamRules, validate, profileController.deleteProfile);

module.exports = router;
