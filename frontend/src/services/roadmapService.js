/**
 * Roadmap Service — matches backend /api/roadmap endpoints exactly.
 * Backend: POST /api/roadmap, GET /api/roadmap/roles
 */
import apiClient from './api'

const roadmapService = {
  generateRoadmap: (currentSkills, targetRole) =>
    apiClient.post('/roadmap', { currentSkills, targetRole }),

  getAvailableRoles: () => apiClient.get('/roadmap/roles'),
}

export default roadmapService
