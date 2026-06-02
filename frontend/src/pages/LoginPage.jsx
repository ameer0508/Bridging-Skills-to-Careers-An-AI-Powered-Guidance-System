/**
 * LoginPage — Production-grade sign in with JWT auth
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap, AlertCircle, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const { login, authLoading } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    const result = await login(form.email.trim(), form.password)
    if (result.success) navigate(from, { replace: true })
    else setError(result.error || 'Login failed. Please try again.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030305] px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/6 rounded-full blur-[80px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Skill<span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Bridge</span> AI
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mt-6 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm">Sign in to your career intelligence platform</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          {/* Global error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm mb-5 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input type="email" value={form.email}
                  onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setFieldErrors(p => ({ ...p, email: '' })) }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-700 focus:outline-none transition-all ${fieldErrors.email ? 'border-red-500/50' : 'focus:border-indigo-500/50'}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${fieldErrors.email ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setFieldErrors(p => ({ ...p, password: '' })) }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-700 focus:outline-none transition-all ${fieldErrors.password ? 'border-red-500/50' : 'focus:border-indigo-500/50'}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${fieldErrors.password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={authLoading}
              whileHover={{ scale: authLoading ? 1 : 1.02 }} whileTap={{ scale: authLoading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {authLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-slate-700 mt-4">
          Demo: register with any email to get started instantly
        </p>
      </motion.div>
    </div>
  )
}
