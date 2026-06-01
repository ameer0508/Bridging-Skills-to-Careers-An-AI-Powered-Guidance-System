/**
 * Profile Service — matches backend /api/profile endpoints exactly.
 * Backend: POST /api/profile, GET /api/profile/:id, PUT /api/profile/:id, DELETE /api/profile/:id
 */
import apiClient from './api'

const profileService = {
  createProfile: (data) => apiClient.post('/profile', data),
  getProfile:    (id)   => apiClient.get(`/profile/${id}`),
  updateProfile: (id, data) => apiClient.put(`/profile/${id}`, data),
  deleteProfile: (id)   => apiClient.delete(`/profile/${id}`),
}

export default profileService
