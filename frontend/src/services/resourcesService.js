import apiClient from './api'

/**
 * Resources Service
 * Handles all /api/resources endpoints
 */
const resourcesService = {
  /**
   * Get personalized learning resource recommendations
   * @param {Object} params - Filter params { type, skill, page, limit }
   * @returns {Promise<Object>} Paginated resources list
   */
  getResources: (params = {}) => apiClient.get('/resources', { params }),

  /**
   * Get a single resource by ID
   * @param {string} resourceId - Resource identifier
   * @returns {Promise<Object>} Resource details
   */
  getResourceById: (resourceId) => apiClient.get(`/resources/${resourceId}`),

  /**
   * Search resources by query
   * @param {string} query - Search query
   * @param {Object} filters - Optional filters { type, difficulty, free }
   * @returns {Promise<Object>} Search results
   */
  searchResources: (query, filters = {}) =>
    apiClient.get('/resources/search', { params: { q: query, ...filters } }),

  /**
   * Get resource categories
   * @returns {Promise<Array>} List of categories
   */
  getCategories: () => apiClient.get('/resources/categories'),

  /**
   * Bookmark a resource
   * @param {string} resourceId - Resource identifier
   * @returns {Promise<Object>} Bookmark result
   */
  bookmarkResource: (resourceId) => apiClient.post(`/resources/${resourceId}/bookmark`),
}

export default resourcesService
