import apiClient from './api'
const jobService = {
  getRecommendations: (skills, targetRole) =>
    apiClient.post('/jobs/recommend', { skills, targetRole }),
}
export default jobService
