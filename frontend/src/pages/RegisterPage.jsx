/**
 * RegisterPage — Production-grade sign up
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function RegisterPage() {
  const { register, authLoading } = useApp()
  const navigate = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
  const strength = passwordStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    const result = await register(form.name.trim(), form.email.trim(), form.password)
    if (result.success) navigate('/dashboard', { replace: true })
    else setError(result.error || 'Registration failed. Please try again.')
  }

  const field = (key, label, type, icon, placeholder) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">{icon}</div>
        <input type={key === 'password' || key === 'confirm' ? (showPass ? 'text' : 'password') : type}
          value={form[key]}
          onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setFieldErrors(p => ({ ...p, [key]: '' })) }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-700 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${fieldErrors[key] ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
        />
        {(key === 'password') && (
          <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 cursor-pointer"
          >
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {fieldErrors[key] && <p className="text-xs text-red-400 mt-1">{fieldErrors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030305] px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }} className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">
              Skill<span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">Bridge</span> AI
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mt-6 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm">Start your AI-powered career journey today</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400 text-sm mb-5 p-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name',    'Full Name',        'text',     <User size={14} />,  'Alex Johnson')}
            {field('email',   'Email Address',    'email',    <Mail size={14} />,  'you@example.com')}
            {field('password','Password',         'password', <Lock size={14} />,  '••••••••')}

            {/* Password strength */}
            {form.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.08)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
              </div>
            )}

            {field('confirm', 'Confirm Password', 'password', <Lock size={14} />,  '••••••••')}

            <motion.button type="submit" disabled={authLoading}
              whileHover={{ scale: authLoading ? 1 : 1.02 }} whileTap={{ scale: authLoading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm cursor-pointer disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {authLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                : <><CheckCircle2 size={15} />Create Account</>
              }
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
