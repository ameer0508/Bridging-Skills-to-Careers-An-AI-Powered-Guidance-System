/**
 * Resume Service — matches backend /api/resume endpoints.
 */
import apiClient from './api'

const resumeService = {
  uploadResume: (file, onProgress) => {
    return new Promise((resolve, reject) => {
      // Simulate upload progress then send metadata to backend
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 8
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          onProgress && onProgress(100)
          // Send file metadata to backend for parsing simulation
          apiClient.post('/resume/upload', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: 'current_user',
          }).then(resolve).catch(reject)
        } else {
          onProgress && onProgress(Math.round(progress))
        }
      }, 150)
    })
  },

  getResume: (userId = 'current_user') =>
    apiClient.get(`/resume/${userId}`),

  deleteResume: (userId = 'current_user') =>
    apiClient.delete(`/resume/${userId}`),
}

export default resumeService
