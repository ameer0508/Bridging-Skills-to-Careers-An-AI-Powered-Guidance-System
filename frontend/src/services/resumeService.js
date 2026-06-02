/**
 * Resume Service — reads file as base64 and sends to backend for real AI parsing
 */
import apiClient from './api'

/** Convert a File object to base64 string */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1]) // strip data:...;base64,
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const resumeService = {
  uploadResume: async (file, onProgress) => {
    // Report initial progress while reading file
    onProgress && onProgress(10)

    // Read actual file bytes as base64 for real AI parsing
    let fileContent = null
    try {
      fileContent = await fileToBase64(file)
      onProgress && onProgress(40)
    } catch {
      // If FileReader fails, fall back to metadata-only
      fileContent = null
    }

    onProgress && onProgress(70)

    const result = await apiClient.post('/resume/upload', {
      fileName:    file.name,
      fileSize:    file.size,
      fileType:    file.type,
      fileContent,                    // real base64 file content
      userId:      'current_user',
    })

    onProgress && onProgress(100)
    return result
  },

  getResume:    (userId = 'current_user') => apiClient.get(`/resume/${userId}`),
  deleteResume: (userId = 'current_user') => apiClient.delete(`/resume/${userId}`),
}

export default resumeService
