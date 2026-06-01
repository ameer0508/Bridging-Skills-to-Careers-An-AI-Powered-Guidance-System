/**
 * Axios API Client — base instance for all backend calls.
 * Base URL: VITE_API_BASE_URL env var, defaults to port 5000.
 */
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — unwrap .data, normalize errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'))
    }
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to server. Is the backend running?'))
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred'
    const err = new Error(message)
    err.status = error.response?.status
    err.errors = error.response?.data?.errors
    return Promise.reject(err)
  }
)

export default apiClient
