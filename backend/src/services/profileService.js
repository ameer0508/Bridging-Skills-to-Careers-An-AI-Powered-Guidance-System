/**
 * Profile Service
 * Contains all business logic for user profile operations.
 * Controllers call these methods — keeping controllers thin.
 */

const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a new user profile.
 * @param {object} profileData - Validated profile data from the request body
 * @returns {Promise<User>} The newly created user document
 */
const createProfile = async (profileData) => {
  // Check for duplicate email before attempting to save
  const existingUser = await User.findByEmail(profileData.email);
  if (existingUser) {
    throw new AppError('A profile with this email already exists.', 409);
  }

  const user = new User(profileData);
  await user.save();
  return user;
};

/**
 * Retrieves a user profile by MongoDB ObjectId.
 * @param {string} id - User document ID
 * @returns {Promise<User>} The found user document
 */
const getProfileById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('Profile not found.', 404);
  }
  return user;
};

/**
 * Updates an existing user profile.
 * Only updates fields that are provided in the request body.
 * @param {string} id - User document ID
 * @param {object} updateData - Fields to update
 * @returns {Promise<User>} The updated user document
 */
const updateProfile = async (id, updateData) => {
  // Prevent email from being changed to one that already exists
  if (updateData.email) {
    const existingUser = await User.findByEmail(updateData.email);
    if (existingUser && existingUser._id.toString() !== id) {
      throw new AppError('This email is already in use by another profile.', 409);
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,          // Return the updated document
      runValidators: true, // Run schema validators on update
    }
  );

  if (!user) {
    throw new AppError('Profile not found.', 404);
  }

  return user;
};

/**
 * Deletes a user profile by ID.
 * @param {string} id - User document ID
 * @returns {Promise<void>}
 */
const deleteProfile = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new AppError('Profile not found.', 404);
  }
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
};
