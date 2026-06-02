import apiClient from './api'
const projectService = {
  getRecommendations: (skills, targetRole, missingSkills = []) =>
    apiClient.post('/projects/recommend', { skills, targetRole, missingSkills }),
}
export default projectService
