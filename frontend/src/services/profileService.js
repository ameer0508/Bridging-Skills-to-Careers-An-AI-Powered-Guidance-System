import apiClient from './api'

/**
 * Profile Service
 * Handles all /api/profile endpoints
 */
const profileService = {
  /**
   * Fetch the authenticated user's profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: () => apiClient.get('/profile'),

  /**
   * Create or update user profile
   * @param {Object} profileData - { fullName, email, education, skills, careerInterests, targetJobRole }
   * @returns {Promise<Object>} Updated profile
   */
  saveProfile: (profileData) => apiClient.post('/profile', profileData),

  /**
   * Update specific profile fields
   * @param {Object} updates - Partial profile fields to update
   * @returns {Promise<Object>} Updated profile
   */
  updateProfile: (updates) => apiClient.patch('/profile', updates),

  /**
   * Delete user profile
   * @returns {Promise<void>}
   */
  deleteProfile: () => apiClient.delete('/profile'),
}

export default profileService
