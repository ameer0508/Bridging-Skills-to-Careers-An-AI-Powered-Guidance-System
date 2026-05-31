import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import PageLayout from './components/layout/PageLayout'
import LandingPage from './pages/LandingPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import ResumeUploadPage from './pages/ResumeUploadPage'
import SkillGapPage from './pages/SkillGapPage'
import RoadmapPage from './pages/RoadmapPage'
import ResourcesPage from './pages/ResourcesPage'

/**
 * AppShell wraps inner pages with the full layout (Navbar + Sidebar).
 * Landing page bypasses this entirely for full cinematic control.
 */
function AppShell({ children }) {
  return <PageLayout>{children}</PageLayout>
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Landing — no layout, full cinematic control ── */}
          <Route path="/" element={<LandingPage />} />

          {/* ── Inner app pages — wrapped in PageLayout ── */}
          <Route path="/dashboard"  element={<AppShell><DashboardPage /></AppShell>} />
          <Route path="/profile"    element={<AppShell><ProfilePage /></AppShell>} />
          <Route path="/resume"     element={<AppShell><ResumeUploadPage /></AppShell>} />
          <Route path="/skill-gap"  element={<AppShell><SkillGapPage /></AppShell>} />
          <Route path="/roadmap"    element={<AppShell><RoadmapPage /></AppShell>} />
          <Route path="/resources"  element={<AppShell><ResourcesPage /></AppShell>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
