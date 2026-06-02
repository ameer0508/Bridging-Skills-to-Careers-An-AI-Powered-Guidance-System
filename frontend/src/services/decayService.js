import apiClient from './api'
const decayService = {
  analyze: (skills, lastActivity, roadmapProgress = 0) =>
    apiClient.post('/decay/analyze', { skills, lastActivity, roadmapProgress }),
}
export default decayService
