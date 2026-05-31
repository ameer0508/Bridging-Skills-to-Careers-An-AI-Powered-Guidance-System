import apiClient from './api'

/**
 * Roadmap Service
 * Handles all /api/roadmap endpoints
 */
const roadmapService = {
  /**
   * Generate a personalized learning roadmap
   * @param {Object} params - Optional params { targetRole, timelineWeeks }
   * @returns {Promise<Object>} Generated roadmap
   */
  generateRoadmap: (params = {}) => apiClient.post('/roadmap/generate', params),

  /**
   * Get the current learning roadmap
   * @returns {Promise<Object>} Roadmap with weeks and milestones
   */
  getRoadmap: () => apiClient.get('/roadmap'),

  /**
   * Update milestone completion status
   * @param {string} milestoneId - Milestone identifier
   * @param {boolean} completed - Completion status
   * @returns {Promise<Object>} Updated milestone
   */
  updateMilestone: (milestoneId, completed) =>
    apiClient.patch(`/roadmap/milestone/${milestoneId}`, { completed }),

  /**
   * Get roadmap progress summary
   * @returns {Promise<Object>} { completedMilestones, totalMilestones, progressPercent }
   */
  getProgress: () => apiClient.get('/roadmap/progress'),
}

export default roadmapService
