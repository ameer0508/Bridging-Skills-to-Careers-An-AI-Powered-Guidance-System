import apiClient from './api'

/**
 * Resume Service
 * Handles all /api/resume endpoints
 */
const resumeService = {
  /**
   * Upload a resume file (PDF or DOCX)
   * @param {File} file - The resume file
   * @param {Function} onUploadProgress - Progress callback (percent: number) => void
   * @returns {Promise<Object>} Upload result with parsed data
   */
  uploadResume: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('resume', file)
    return apiClient.post('/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      },
    })
  },

  /**
   * Get the currently uploaded resume metadata
   * @returns {Promise<Object>} Resume metadata
   */
  getResume: () => apiClient.get('/resume'),

  /**
   * Delete the uploaded resume
   * @returns {Promise<void>}
   */
  deleteResume: () => apiClient.delete('/resume'),

  /**
   * Re-parse an already uploaded resume
   * @returns {Promise<Object>} Parsed resume data
   */
  parseResume: () => apiClient.post('/resume/parse'),
}

export default resumeService
