import apiClient from './api'

const skillGapService = {
  analyzeSkillGap:      (skills, targetRole) => apiClient.post('/skill-gap/analyze', { skills, targetRole }),
  matchCareers:         (skills)             => apiClient.post('/skill-gap/match', { skills }),
  getCareers:           ()                   => apiClient.get('/skill-gap/careers'),
  getReadiness:         (skills, targetRole, hasResume, roadmapProgress) =>
                          apiClient.post('/skill-gap/readiness', { skills, targetRole, hasResume, roadmapProgress }),
  getInterviewQuestions:(targetRole, count)  => apiClient.post('/skill-gap/interview-questions', { targetRole, count }),
}

export default skillGapService
