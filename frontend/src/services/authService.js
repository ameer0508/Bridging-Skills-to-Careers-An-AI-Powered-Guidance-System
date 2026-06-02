/**
 * Auth Service — register, login, logout, token management
 */
import apiClient from './api'

const TOKEN_KEY = 'sb_token'
const USER_KEY  = 'sb_user'

const authService = {
  register: (name, email, password) =>
    apiClient.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  logout: async () => {
    try { await apiClient.post('/auth/logout') } catch {}
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getMe: () => apiClient.get('/auth/me'),

  updateMe: (data) => apiClient.put('/auth/me', data),

  // Token helpers
  saveToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken:  ()      => localStorage.getItem(TOKEN_KEY),
  removeToken: ()    => localStorage.removeItem(TOKEN_KEY),

  saveUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser:  ()     => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
}

export default authService
