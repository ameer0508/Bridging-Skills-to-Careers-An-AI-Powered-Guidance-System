/**
 * Navbar — inner app navigation bar
 * Only rendered on inner pages (dashboard, profile, etc.)
 * Landing page has its own navigation-free cinematic experience.
 */
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Upload, BarChart3,
  Map, BookOpen, Menu, X, Zap, LogOut
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#818cf8' },
  { to: '/profile',   label: 'Profile',   icon: User,            color: '#60a5fa' },
  { to: '/resume',    label: 'Resume',    icon: Upload,          color: '#34d399' },
  { to: '/skill-gap', label: 'Skill Gap', icon: BarChart3,       color: '#fbbf24' },
  { to: '/roadmap',   label: 'Roadmap',   icon: Map,             color: '#a78bfa' },
  { to: '/resources', label: 'Resources', icon: BookOpen,        color: '#f87171' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, user, logout } = useApp()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass border-b border-white/[0.06] shadow-2xl shadow-black/30' : 'glass border-b border-white/[0.04]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-900/50 group-hover:shadow-brand-500/40 transition-shadow">
                  <Zap size={15} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
              </div>
              <span className="font-display font-bold text-lg text-white tracking-tight">
                Skill<span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">Bridge</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ to, label, icon: Icon, color }) => {
                const active = location.pathname === to
                return (
                  <Link key={to} to={to}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.div layoutId="navPill"
                        className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={13} className="relative z-10" style={{ color: active ? color : undefined }} />
                    <span className="relative z-10">{label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Right — user chip + mobile toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 glass rounded-xl px-3 py-1.5 border border-white/8">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user?.name || profile.fullName)?.charAt(0) || 'A'}
                </div>
                <span className="text-sm text-slate-300 font-medium max-w-[100px] truncate">
                  {user?.name || profile.fullName || 'User'}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                title="Sign out"
              >
                <LogOut size={13} />
              </motion.button>

              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden glass p-2 rounded-xl border border-white/8 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen
                    ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={17} /></motion.div>
                    : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={17} /></motion.div>
                  }
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-3 right-3 z-40 glass-strong rounded-2xl border border-white/10 shadow-2xl shadow-black/40 md:hidden overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {navLinks.map(({ to, label, icon: Icon, color }) => {
                const active = location.pathname === to
                return (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-white/[0.07] text-white border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={15} style={{ color: active ? color : undefined }} />
                    {label}
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
