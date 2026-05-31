/**
 * Sidebar — Minimal floating navigation for inner app pages
 */
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, User, Upload, BarChart3, Map, BookOpen, Zap, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#818cf8', desc: 'Intelligence hub'   },
  { to: '/profile',   label: 'Profile',   icon: User,            color: '#60a5fa', desc: 'Career profile'     },
  { to: '/resume',    label: 'Resume',    icon: Upload,          color: '#34d399', desc: 'Upload & analyze'   },
  { to: '/skill-gap', label: 'Skill Gap', icon: BarChart3,       color: '#fbbf24', desc: 'Gap analysis'       },
  { to: '/roadmap',   label: 'Roadmap',   icon: Map,             color: '#a78bfa', desc: 'Learning path'      },
  { to: '/resources', label: 'Resources', icon: BookOpen,        color: '#f87171', desc: 'Courses & certs'    },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile } = useApp()

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 z-30"
      style={{ background: 'rgba(5,5,12,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
    >
      {/* Profile chip */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {profile.fullName?.charAt(0) || 'A'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: 'rgba(5,5,12,1)' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{profile.fullName}</p>
            <p className="text-xs text-slate-600 truncate">{profile.targetJobRole}</p>
          </div>
        </div>

        {/* Readiness bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-700">Career Readiness</span>
            <span className="text-indigo-400 font-bold">73%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
              initial={{ width: 0 }} animate={{ width: '73%' }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, color, desc }, i) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group"
                style={active
                  ? { background: color + '12', border: `1px solid ${color}25` }
                  : { border: '1px solid transparent' }
                }
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={active
                    ? { background: color + '20' }
                    : { background: 'rgba(255,255,255,0.04)' }
                  }
                >
                  <Icon size={14} style={{ color: active ? color : '#475569' }}
                    className="group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium transition-colors"
                    style={{ color: active ? color : '#64748b' }}
                  >{label}</p>
                  <p className="text-xs text-slate-700 truncate">{desc}</p>
                </div>
                {active && (
                  <motion.div layoutId="sidebarActive"
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Footer AI status */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="rounded-2xl p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
              <Zap size={12} className="text-indigo-400" />
            </motion.div>
            <span className="text-xs font-semibold text-indigo-300">AI System Active</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Monitoring your career progress in real time.
          </p>
        </div>
      </div>
    </aside>
  )
}
