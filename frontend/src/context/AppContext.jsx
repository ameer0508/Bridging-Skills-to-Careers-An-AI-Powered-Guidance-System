/**
 * AppContext — Complete state management with real API integration.
 * Auto-fetches all AI data on login and profile update.
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import authService     from '../services/authService'
import roadmapService  from '../services/roadmapService'
import skillGapService from '../services/skillGapService'
import resourcesService from '../services/resourcesService'
import jobService      from '../services/jobService'
import projectService  from '../services/projectService'
import decayService    from '../services/decayService'
import apiClient       from '../services/api'

const AppContext = createContext(null)

const DEFAULT_PROFILE = { fullName:'', email:'', education:'', skills:[], careerInterests:[], targetJobRole:'' }

// ── helper: map backend user → profile shape ──────────────────
function userToProfile(u) {
  return {
    fullName:       u.name        || '',
    email:          u.email       || '',
    education:      u.education   || '',
    skills:         u.skills      || [],
    careerInterests:u.careerInterests || [],
    targetJobRole:  u.targetRole  || '',
  }
}

export const AppProvider = ({ children }) => {
  // ── Auth ───────────────────────────────────────────────────
  const [user, setUser]               = useState(() => authService.getUser())
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError]     = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())

  // ── Profile ────────────────────────────────────────────────
  const [profile, setProfile] = useState(() => {
    const u = authService.getUser()
    return u ? userToProfile(u) : { ...DEFAULT_PROFILE }
  })
  const [profileSaving, setProfileSaving]   = useState(false)
  const [profileError,  setProfileError]    = useState(null)

  // ── Resume ─────────────────────────────────────────────────
  const [resumeFile, setResumeFile]   = useState(null)
  const [resumeData, setResumeData]   = useState(null)

  // ── Roadmap ────────────────────────────────────────────────
  const [roadmap, setRoadmap]               = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError,   setRoadmapError]   = useState(null)

  // ── Skill Gap ──────────────────────────────────────────────
  const [skillGap, setSkillGap]               = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [skillGapError,   setSkillGapError]   = useState(null)

  // ── AI data ────────────────────────────────────────────────
  const [readiness,          setReadiness]          = useState(null)
  const [careerMatches,      setCareerMatches]      = useState([])
  const [interviewQuestions, setInterviewQuestions] = useState([])
  const [resources,          setResources]          = useState([])
  const [jobRecs,            setJobRecs]            = useState([])
  const [projectRecs,        setProjectRecs]        = useState([])
  const [decayData,          setDecayData]          = useState(null)
  const [dashboardLoading,   setDashboardLoading]   = useState(false)

  // ── System ─────────────────────────────────────────────────
  const [backendOnline, setBackendOnline] = useState(null)
  const fetchedRef = useRef(false) // prevent double-fetch in StrictMode

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
      authService.saveToken(token); authService.saveUser(u)
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(u); setIsAuthenticated(true)
      setProfile(userToProfile(u))
      return { success: true }
    } catch (err) { setAuthError(err.message); return { success: false, error: err.message } }
    finally { setAuthLoading(false) }
  }, [])

  const login = useCallback(async (email, password) => {
    setAuthLoading(true); setAuthError(null)
    try {
      const res = await authService.login(email, password)
      const { token, user: u } = res.data
      authService.saveToken(token); authService.saveUser(u)
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(u); setIsAuthenticated(true)
      setProfile(userToProfile(u))
      fetchedRef.current = false // allow fresh fetch after login
      return { success: true }
    } catch (err) { setAuthError(err.message); return { success: false, error: err.message } }
    finally { setAuthLoading(false) }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    delete apiClient.defaults.headers.common['Authorization']
    setUser(null); setIsAuthenticated(false)
    setProfile({ ...DEFAULT_PROFILE })
    setRoadmap(null); setSkillGap(null); setReadiness(null)
    setCareerMatches([]); setInterviewQuestions([]); setResources([])
    setJobRecs([]); setProjectRecs([]); setDecayData(null)
    fetchedRef.current = false
  }, [])

  // ── Profile actions ────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const saveProfileToBackend = useCallback(async (profileData) => {
    setProfileSaving(true); setProfileError(null)
    try {
      const payload = {
        name: profileData.fullName, email: profileData.email,
        skills: profileData.skills || [], careerInterests: profileData.careerInterests || [],
        targetRole: profileData.targetJobRole, education: profileData.education,
      }
      const res = await authService.updateMe(payload)
      const updated = res.data?.user || res.user
      if (updated) { authService.saveUser(updated); setUser(updated) }
      fetchedRef.current = false // re-fetch AI data after profile update
      return { success: true }
    } catch (err) { setProfileError(err.message); return { success: false, error: err.message } }
    finally { setProfileSaving(false) }
  }, [])

  // ── Core AI fetch ──────────────────────────────────────────
  const fetchAllDashboardData = useCallback(async (skills, targetRole) => {
    if (!skills?.length || !targetRole) return
    setDashboardLoading(true)
    try {
      const [sgRes, cmRes, rdRes, iqRes, rmRes, rsRes, jbRes, prRes, dcRes] = await Promise.allSettled([
        skillGapService.analyzeSkillGap(skills, targetRole),
        skillGapService.matchCareers(skills),
        skillGapService.getReadiness(skills, targetRole, !!resumeData, 0),
        skillGapService.getInterviewQuestions(targetRole, 5),
        roadmapService.generateRoadmap(skills, targetRole),
        resourcesService.getRecommendations(skills, targetRole),
        jobService.getRecommendations(skills, targetRole),
        projectService.getRecommendations(skills, targetRole),
        decayService.analyze(skills, null, 0),
      ])

      if (sgRes.status === 'fulfilled') setSkillGap(sgRes.value?.data || sgRes.value)
      if (cmRes.status === 'fulfilled') setCareerMatches(cmRes.value?.data?.matches || cmRes.value?.matches || [])
      if (rdRes.status === 'fulfilled') setReadiness(rdRes.value?.data || rdRes.value)
      if (iqRes.status === 'fulfilled') setInterviewQuestions(iqRes.value?.data?.questions || [])
      if (rmRes.status === 'fulfilled') setRoadmap(rmRes.value?.data || rmRes.value)
      if (rsRes.status === 'fulfilled') {
        const rsData = rsRes.value?.data
        setResources(rsData?.recommendations?.courses || rsData?.resources || [])
      }
      if (jbRes.status === 'fulfilled') setJobRecs(jbRes.value?.data?.jobs || [])
      if (prRes.status === 'fulfilled') setProjectRecs(prRes.value?.data?.projects || [])
      if (dcRes.status === 'fulfilled') setDecayData(dcRes.value?.data || dcRes.value)
    } finally {
      setDashboardLoading(false)
      fetchedRef.current = true
    }
  }, [resumeData])

  // Auto-fetch when authenticated + profile ready
  useEffect(() => {
    if (isAuthenticated && profile.skills.length > 0 && profile.targetJobRole && !fetchedRef.current) {
      fetchAllDashboardData(profile.skills, profile.targetJobRole)
    }
  }, [isAuthenticated, profile.skills, profile.targetJobRole, fetchAllDashboardData])

  // ── Individual AI actions (for manual triggers) ────────────
  const generateRoadmap = useCallback(async (skills, targetRole) => {
    setRoadmapLoading(true); setRoadmapError(null)
    try {
      const res = await roadmapService.generateRoadmap(skills || profile.skills, targetRole || profile.targetJobRole)
      setRoadmap(res?.data || res); return res
    } catch (err) { setRoadmapError(err.message); throw err }
    finally { setRoadmapLoading(false) }
  }, [profile.skills, profile.targetJobRole])

  const analyzeSkillGap = useCallback(async (skills, targetRole) => {
    setSkillGapLoading(true); setSkillGapError(null)
    try {
      const res = await skillGapService.analyzeSkillGap(skills || profile.skills, targetRole || profile.targetJobRole)
      setSkillGap(res?.data || res); return res
    } catch (err) { setSkillGapError(err.message); throw err }
    finally { setSkillGapLoading(false) }
  }, [profile.skills, profile.targetJobRole])

  const fetchCareerMatches = useCallback(async (skills) => {
    try {
      const res = await skillGapService.matchCareers(skills || profile.skills)
      const m = res?.data?.matches || res?.matches || []
      setCareerMatches(m); return m
    } catch { return [] }
  }, [profile.skills])

  const fetchReadiness = useCallback(async (skills, targetRole, hasResume, progress) => {
    try {
      const res = await skillGapService.getReadiness(skills || profile.skills, targetRole || profile.targetJobRole, hasResume, progress)
      setReadiness(res?.data || res); return res?.data || res
    } catch { return null }
  }, [profile.skills, profile.targetJobRole])

  const fetchInterviewQuestions = useCallback(async (role, count = 5) => {
    try {
      const res = await skillGapService.getInterviewQuestions(role || profile.targetJobRole, count)
      const qs = res?.data?.questions || []
      setInterviewQuestions(qs); return qs
    } catch { return [] }
  }, [profile.targetJobRole])

  const isProfileComplete = Boolean(profile.fullName && profile.email && profile.targetJobRole && profile.skills.length > 0)

  const value = {
    // Auth
    user, isAuthenticated, authLoading, authError, register, login, logout,
    // Profile
    profile, updateProfile, saveProfileToBackend, isProfileComplete, profileSaving, profileError,
    // Resume
    resumeFile, setResumeFile, resumeData, setResumeData,
    // Roadmap
    roadmap, setRoadmap, roadmapLoading, roadmapError, generateRoadmap,
    // Skill Gap
    skillGap, setSkillGap, skillGapLoading, skillGapError, analyzeSkillGap,
    // AI data
    readiness, fetchReadiness,
    careerMatches, fetchCareerMatches,
    interviewQuestions, fetchInterviewQuestions,
    resources, setResources,
    jobRecs, setJobRecs,
    projectRecs, setProjectRecs,
    decayData, setDecayData,
    // Dashboard
    dashboardLoading, fetchAllDashboardData,
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
