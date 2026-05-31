/**
 * Profile Controller
 * Handles HTTP request/response for user profile endpoints.
 * Delegates all business logic to profileService.
 */

const profileService = require('../services/profileService');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * POST /api/profile
 * Creates a new user profile.
 */
const createProfile = async (req, res, next) => {
  try {
    const user = await profileService.createProfile(req.body);
    return sendSuccess(res, 201, 'Profile created successfully.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/profile/:id
 * Retrieves a user profile by ID.
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfileById(req.params.id);
    return sendSuccess(res, 200, 'Profile retrieved successfully.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile/:id
 * Updates an existing user profile.
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await profileService.updateProfile(req.params.id, req.body);
    return sendSuccess(res, 200, 'Profile updated successfully.', user);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/profile/:id
 * Deletes a user profile.
 */
const deleteProfile = async (req, res, next) => {
  try {
    await profileService.deleteProfile(req.params.id);
    return sendSuccess(res, 200, 'Profile deleted successfully.', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
};
