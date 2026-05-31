import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, User, Upload, BarChart3,
  Map, BookOpen, Zap, ChevronRight
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & analytics' },
  { to: '/profile', label: 'Profile', icon: User, description: 'Career information' },
  { to: '/resume', label: 'Resume', icon: Upload, description: 'Upload & manage' },
  { to: '/skill-gap', label: 'Skill Gap', icon: BarChart3, description: 'Gap analysis' },
  { to: '/roadmap', label: 'Roadmap', icon: Map, description: 'Learning path' },
  { to: '/resources', label: 'Resources', icon: BookOpen, description: 'Courses & certs' },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile } = useApp()

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 glass border-r border-white/5 z-30">
      {/* Profile mini */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-brand-900/40">
            {profile.fullName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{profile.targetJobRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, description }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-brand-500/15 border border-brand-500/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    active
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'bg-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-white/8'
                  }`}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      active ? 'text-brand-300' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-slate-600 truncate">{description}</p>
                </div>
                {active && (
                  <ChevronRight size={12} className="text-brand-400 flex-shrink-0" />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="glass rounded-xl p-3 border border-brand-500/15">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-300">AI Analysis Ready</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your profile is complete. Run a full skill gap analysis.
          </p>
        </div>
      </div>
    </aside>
  )
}
