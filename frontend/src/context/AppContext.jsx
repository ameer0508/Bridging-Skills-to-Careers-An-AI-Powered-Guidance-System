/**
 * AppContext — Global state with real API integration.
 *
 * Responsibilities:
 * - Profile: persisted to localStorage + synced to backend
 * - Resume: upload state + parsed data
 * - Roadmap: generated from backend
 * - SkillGap: analyzed from backend
 * - Backend status: live health check
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import profileService  from '../services/profileService'
import roadmapService  from '../services/roadmapService'
import skillGapService from '../services/skillGapService'

const AppContext = createContext(null)

const STORAGE_KEY = 'sb_profile_v2'
const PROFILE_ID_KEY = 'sb_profile_id'

const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  education: '',
  skills: [],
  careerInterests: [],
  targetJobRole: '',
  avatar: null,
}

export const AppProvider = ({ children }) => {
  // ── Profile state ──────────────────────────────────────────
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : {
        ...DEFAULT_PROFILE,
        fullName: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        education: "Bachelor's in Computer Science",
        skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Node.js'],
        careerInterests: ['Full Stack Development', 'AI/ML Engineering'],
        targetJobRole: 'Senior Full Stack Engineer',
      }
    } catch { return { ...DEFAULT_PROFILE } }
  })

  const [profileId, setProfileId] = useState(() => localStorage.getItem(PROFILE_ID_KEY))
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // ── Resume state ───────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeProgress, setResumeProgress] = useState(0)
  const [resumeError, setResumeError] = useState(null)

  // ── Roadmap state ──────────────────────────────────────────
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapError, setRoadmapError] = useState(null)

  // ── Skill gap state ────────────────────────────────────────
  const [skillGap, setSkillGap] = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [skillGapError, setSkillGapError] = useState(null)

  // ── Backend status ─────────────────────────────────────────
  const [backendOnline, setBackendOnline] = useState(null) // null=checking, true, false

  // Persist profile to localStorage whenever it changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
  }, [profile])

  // Check backend health on mount
  useEffect(() => {
    fetch('http://localhost:5000/health')
      .then(r => r.ok ? setBackendOnline(true) : setBackendOnline(false))
      .catch(() => setBackendOnline(false))
  }, [])

  // ── Profile actions ────────────────────────────────────────
  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }, [])

  const saveProfileToBackend = useCallback(async (profileData) => {
    setProfileSaving(true)
    setProfileError(null)
    try {
      const payload = {
        name: profileData.fullName,
        email: profileData.email,
        skills: profileData.skills || [],
        careerInterests: profileData.careerInterests || [],
        targetRole: profileData.targetJobRole,
        education: profileData.education ? [{ degree: profileData.education }] : [],
      }

      let result
      if (profileId) {
        result = await profileService.updateProfile(profileId, payload)
      } else {
        result = await profileService.createProfile(payload)
        if (result?.data?._id) {
          setProfileId(result.data._id)
          localStorage.setItem(PROFILE_ID_KEY, result.data._id)
        }
      }
      return { success: true, data: result?.data }
    } catch (err) {
      setProfileError(err.message)
      // Still save locally even if backend fails
      return { success: false, error: err.message, savedLocally: true }
    } finally {
      setProfileSaving(false)
    }
  }, [profileId])

  // ── Roadmap actions ────────────────────────────────────────
  const generateRoadmap = useCallback(async (skills, targetRole) => {
    setRoadmapLoading(true)
    setRoadmapError(null)
    try {
      const result = await roadmapService.generateRoadmap(
        skills || profile.skills,
        targetRole || profile.targetJobRole
      )
      setRoadmap(result?.data || result)
      return result
    } catch (err) {
      setRoadmapError(err.message)
      throw err
    } finally {
      setRoadmapLoading(false)
    }
  }, [profile.skills, profile.targetJobRole])

  // ── Skill gap actions ──────────────────────────────────────
  const analyzeSkillGap = useCallback(async (skills, targetRole) => {
    setSkillGapLoading(true)
    setSkillGapError(null)
    try {
      const result = await skillGapService.analyzeSkillGap(
        skills || profile.skills,
        targetRole || profile.targetJobRole
      )
      setSkillGap(result?.data || result)
      return result
    } catch (err) {
      setSkillGapError(err.message)
      throw err
    } finally {
      setSkillGapLoading(false)
    }
  }, [profile.skills, profile.targetJobRole])

  const isProfileComplete = Boolean(
    profile.fullName && profile.email && profile.targetJobRole && profile.skills.length > 0
  )

  const value = {
    // Profile
    profile, updateProfile, saveProfileToBackend,
    profileId, profileSaving, profileError,
    isProfileComplete,

    // Resume
    resumeFile, setResumeFile,
    resumeData, setResumeData,
    resumeUploading, setResumeUploading,
    resumeProgress, setResumeProgress,
    resumeError, setResumeError,

    // Roadmap
    roadmap, setRoadmap,
    roadmapLoading, roadmapError,
    generateRoadmap,

    // Skill Gap
    skillGap, setSkillGap,
    skillGapLoading, skillGapError,
    analyzeSkillGap,

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
