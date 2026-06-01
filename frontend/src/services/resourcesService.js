/**
 * Resources Service — matches backend /api/resources endpoints.
 */
import apiClient from './api'

const resourcesService = {
  getResources: (params = {}) =>
    apiClient.get('/resources', { params }),

  getRecommendations: (skills, targetRole) =>
    apiClient.post('/resources/recommend', { skills, targetRole }),
}

export default resourcesService
