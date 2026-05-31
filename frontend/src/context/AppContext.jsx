import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    education: "Bachelor's in Computer Science",
    skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git', 'Node.js'],
    careerInterests: ['Full Stack Development', 'AI/ML Engineering'],
    targetJobRole: 'Senior Full Stack Engineer',
    avatar: null,
  })

  const [resumeFile, setResumeFile] = useState(null)
  const [isProfileComplete, setIsProfileComplete] = useState(true)

  const updateProfile = useCallback((updates) => {
    setProfile((prev) => ({ ...prev, ...updates }))
  }, [])

  const value = {
    profile,
    updateProfile,
    resumeFile,
    setResumeFile,
    isProfileComplete,
    setIsProfileComplete,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
