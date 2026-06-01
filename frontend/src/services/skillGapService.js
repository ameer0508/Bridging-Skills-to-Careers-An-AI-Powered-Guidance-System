/**
 * Skill Gap Service — matches backend /api/skill-gap endpoints.
 */
import apiClient from './api'

const skillGapService = {
  analyzeSkillGap: (skills, targetRole) =>
    apiClient.post('/skill-gap/analyze', { skills, targetRole }),

  matchCareers: (skills) =>
    apiClient.post('/skill-gap/match', { skills }),

  getCareers: () => apiClient.get('/skill-gap/careers'),
}

export default skillGapService
