/**
 * AppContext — Auth + Profile + AI data, all real API-backed.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import authService     from '../services/authService'
import roadmapService  from '../services/roadmapService'
import skillGapService from '../services/skillGapService'
import apiClient       from '../services/api'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  // ── Auth state ─────────────────────────────────────────────
  const [user, setUser]           = useState(() => authService.getUser())
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())

  // ── Profile (derived from user + local overrides) ──────────
  const [profile, setProfile] = useState(() => {
    const u = authService.getUser()
    if (u) return {
      fullName: u.name || '',
      email: u.email || '',
      education: u.education || '',
      skills: u.skills || [],
      careerInterests: u.careerInterests || [],
      targetJobRole: u.targetRole || '',
    }
    return {
      fullName: '', email: '', education: '',
      skills: [], careerInterests: [], targetJobRole: '',
    }
  })

  // ── Resume state ───────────────────────────────────────────
  const [resumeFile, setResumeFile]     = useState(null)
  const [resumeData, setResumeData]     = useState(null)

  // ── AI data state ──────────────────────────────────────────
  const [roadmap, setRoadmap]           = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState(null)

  const [skillGap, setSkillGap]         = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [skillGapError, setSkillGapError] = useState(null)

  const [readiness, setReadiness]       = useState(null)
  const [careerMatches, setCareerMatches] = useState([])
  const [interviewQuestions, setInterviewQuestions] = useState([])

  const [backendOnline, setBackendOnline] = useState(null)

  // Sync token into axios on mount
  useEffect(() => {
    const token = authService.getToken()
    if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    fetch('http://localhost:5000/health')
      .then(r => setBackendOnline(r.ok))
      .catch(() => setBackendOnline(false))
  }, [])

  // ── Auth actions ───────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setAuthLoading(true); setAuthError(null)
    try {
      const res = await authService.register(name, email, password)
      const { token, user: u } = res.data
      authService.saveToken(token)
      authService.saveUser(u)
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(u)
      setIsAuthenticated(true)
      setProfile({ fullName: u.name, email: u.email, education: u.education || '', skills: u.skills || [], careerInterests: u.careerInterests || [], targetJobRole: u.targetRole || '' })
      return { success: true }
    } catch (err) {
      setAuthError(err.message)
      return { success: false, error: err.message }
    } finally { setAuthLoading(false) }
  }, [])

  const login = useCallback(async (email, password) => {
    setAuthLoading(true); setAuthError(null)
    try {
      const res = await authService.login(email, password)
      const { token, user: u } = res.data
      authService.saveToken(token)
      authService.saveUser(u)
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(u)
      setIsAuthenticated(true)
      setProfile({ fullName: u.name, email: u.email, education: u.education || '', skills: u.skills || [], careerInterests: u.careerInterests || [], targetJobRole: u.targetRole || '' })
      return { success: true }
    } catch (err) {
      setAuthError(err.message)
      return { success: false, error: err.message }
    } finally { setAuthLoading(false) }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    delete apiClient.defaults.headers.common['Authorization']
    setUser(null); setIsAuthenticated(false)
    setProfile({ fullName: '', email: '', education: '', skills: [], careerInterests: [], targetJobRole: '' })
    setRoadmap(null); setSkillGap(null); setReadiness(null)
  }, [])

  // ── Profile actions ────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const saveProfileToBackend = useCallback(async (profileData) => {
    try {
      const payload = {
        name: profileData.fullName,
        email: profileData.email,
        skills: profileData.skills || [],
        careerInterests: profileData.careerInterests || [],
        targetRole: profileData.targetJobRole,
        education: profileData.education,
      }
      const res = await authService.updateMe(payload)
      const updated = res.data?.user || res.user
      if (updated) {
        authService.saveUser(updated)
        setUser(updated)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  // ── AI actions ─────────────────────────────────────────────
  const generateRoadmap = useCallback(async (skills, targetRole) => {
    setRoadmapLoading(true); setRoadmapError(null)
    try {
      const res = await roadmapService.generateRoadmap(skills || profile.skills, targetRole || profile.targetJobRole)
      setRoadmap(res?.data || res)
      return res
    } catch (err) { setRoadmapError(err.message); throw err }
    finally { setRoadmapLoading(false) }
  }, [profile.skills, profile.targetJobRole])

  const analyzeSkillGap = useCallback(async (skills, targetRole) => {
    setSkillGapLoading(true); setSkillGapError(null)
    try {
      const res = await skillGapService.analyzeSkillGap(skills || profile.skills, targetRole || profile.targetJobRole)
      setSkillGap(res?.data || res)
      return res
    } catch (err) { setSkillGapError(err.message); throw err }
    finally { setSkillGapLoading(false) }
  }, [profile.skills, profile.targetJobRole])

  const fetchCareerMatches = useCallback(async (skills) => {
    try {
      const res = await skillGapService.matchCareers(skills || profile.skills)
      const matches = res?.data?.matches || res?.matches || []
      setCareerMatches(matches)
      return matches
    } catch { return [] }
  }, [profile.skills])

  const fetchReadiness = useCallback(async (skills, targetRole, hasResume, progress) => {
    try {
      const res = await skillGapService.getReadiness(skills || profile.skills, targetRole || profile.targetJobRole, hasResume, progress)
      setReadiness(res?.data || res)
      return res?.data || res
    } catch { return null }
  }, [profile.skills, profile.targetJobRole])

  const fetchInterviewQuestions = useCallback(async (role, count = 5) => {
    try {
      const res = await skillGapService.getInterviewQuestions(role || profile.targetJobRole, count)
      const qs = res?.data?.questions || res?.questions || []
      setInterviewQuestions(qs)
      return qs
    } catch { return [] }
  }, [profile.targetJobRole])

  const isProfileComplete = Boolean(profile.fullName && profile.email && profile.targetJobRole && profile.skills.length > 0)

  const value = {
    // Auth
    user, isAuthenticated, authLoading, authError,
    register, login, logout,
    // Profile
    profile, updateProfile, saveProfileToBackend, isProfileComplete,
    // Resume
    resumeFile, setResumeFile, resumeData, setResumeData,
    // AI
    roadmap, setRoadmap, roadmapLoading, roadmapError, generateRoadmap,
    skillGap, setSkillGap, skillGapLoading, skillGapError, analyzeSkillGap,
    readiness, fetchReadiness,
    careerMatches, fetchCareerMatches,
    interviewQuestions, fetchInterviewQuestions,
    // System
    backendOnline,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
