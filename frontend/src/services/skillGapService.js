import apiClient from './api'

/**
 * Skill Gap Service
 * Handles all /api/skill-gap endpoints
 */
const skillGapService = {
  /**
   * Analyze skill gaps for the authenticated user
   * @param {Object} params - Optional params { targetRole, forceRefresh }
   * @returns {Promise<Object>} Skill gap analysis result
   */
  analyzeSkillGap: (params = {}) => apiClient.post('/skill-gap/analyze', params),

  /**
   * Get the latest skill gap analysis result
   * @returns {Promise<Object>} Skill gap data
   */
  getSkillGap: () => apiClient.get('/skill-gap'),

  /**
   * Get required skills for a specific job role
   * @param {string} jobRole - Target job role title
   * @returns {Promise<Object>} Required skills list
   */
  getRequiredSkills: (jobRole) => apiClient.get('/skill-gap/required', { params: { jobRole } }),

  /**
   * Get skill match percentage
   * @returns {Promise<Object>} { matchPercentage, currentSkills, missingSkills }
   */
  getMatchScore: () => apiClient.get('/skill-gap/score'),
}

export default skillGapService
