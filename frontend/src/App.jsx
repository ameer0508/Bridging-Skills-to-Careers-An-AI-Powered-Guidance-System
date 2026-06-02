import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import PageLayout from './components/layout/PageLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import ProfilePage    from './pages/ProfilePage'
import DashboardPage  from './pages/DashboardPage'
import ResumeUploadPage from './pages/ResumeUploadPage'
import SkillGapPage   from './pages/SkillGapPage'
import RoadmapPage    from './pages/RoadmapPage'
import ResourcesPage  from './pages/ResourcesPage'

function AppShell({ children }) {
  return <PageLayout>{children}</PageLayout>
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
          <Route path="/resume"    element={<ProtectedRoute><AppShell><ResumeUploadPage /></AppShell></ProtectedRoute>} />
          <Route path="/skill-gap" element={<ProtectedRoute><AppShell><SkillGapPage /></AppShell></ProtectedRoute>} />
          <Route path="/roadmap"   element={<ProtectedRoute><AppShell><RoadmapPage /></AppShell></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><AppShell><ResourcesPage /></AppShell></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
