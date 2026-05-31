import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Zap, ArrowRight, BarChart3, Map, BookOpen, Upload,
  User, Star, CheckCircle2, ChevronDown, Sparkles,
  TrendingUp, Target, Brain, Shield, Globe, Users
} from 'lucide-react'

// ── Floating Particles ──────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ── Stats ────────────────────────────────────────────────────────────────────
const stats = [
  { value: '50K+', label: 'Professionals Guided', icon: Users },
  { value: '94%', label: 'Career Goal Achievement', icon: Target },
  { value: '3.2x', label: 'Faster Skill Acquisition', icon: TrendingUp },
  { value: '200+', label: 'Learning Resources', icon: BookOpen },
]

// ── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: User,
    title: 'Smart Profile Analysis',
    description:
      'Build a comprehensive career profile. Our AI maps your skills, education, and goals to create a personalized career blueprint.',
    color: 'from-blue-500 to-brand-500',
    badge: 'Profile',
  },
  {
    icon: Upload,
    title: 'Resume Intelligence',
    description:
      'Upload your resume and let our AI extract, analyze, and enrich your skill profile automatically with precision parsing.',
    color: 'from-brand-500 to-accent-500',
    badge: 'Resume',
  },
  {
    icon: BarChart3,
    title: 'Skill Gap Analysis',
    description:
      'Identify exactly what skills you need for your target role. Get a precise gap analysis with match scores and priority rankings.',
    color: 'from-accent-500 to-purple-500',
    badge: 'Analysis',
  },
  {
    icon: Map,
    title: 'Personalized Roadmap',
    description:
      'Receive a week-by-week learning roadmap tailored to your goals, current skills, and available time commitment.',
    color: 'from-purple-500 to-pink-500',
    badge: 'Roadmap',
  },
  {
    icon: BookOpen,
    title: 'Curated Resources',
    description:
      'Access hand-picked courses, certifications, and practice platforms recommended specifically for your skill gaps.',
    color: 'from-pink-500 to-rose-500',
    badge: 'Resources',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description:
      'Leverage cutting-edge AI to get actionable career insights, trend analysis, and personalized guidance at every step.',
    color: 'from-emerald-500 to-teal-500',
    badge: 'AI',
  },
]

// ── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer at Google',
    avatar: 'SC',
    content:
      'SkillBridge identified exactly what I was missing for my dream role. The roadmap was incredibly precise — I landed my Google offer in 4 months.',
    rating: 5,
    gradient: 'from-blue-500 to-brand-500',
  },
  {
    name: 'Marcus Williams',
    role: 'Data Scientist at Stripe',
    avatar: 'MW',
    content:
      'The skill gap analysis was eye-opening. I had no idea I was 73% of the way to my target role. The AI guidance made the remaining 27% feel achievable.',
    rating: 5,
    gradient: 'from-brand-500 to-accent-500',
  },
  {
    name: 'Priya Patel',
    role: 'Product Manager at Notion',
    avatar: 'PP',
    content:
      'This platform feels like having a personal career coach available 24/7. The learning roadmap saved me months of figuring out what to study next.',
    rating: 5,
    gradient: 'from-accent-500 to-purple-500',
  },
]

// ── How It Works ─────────────────────────────────────────────────────────────
const steps = [
  { step: '01', title: 'Build Your Profile', desc: 'Enter your skills, education, and target career goals.' },
  { step: '02', title: 'Upload Your Resume', desc: 'Let AI extract and enrich your skill profile automatically.' },
  { step: '03', title: 'Analyze Skill Gaps', desc: 'Get a precise analysis of what you need to reach your goal.' },
  { step: '04', title: 'Follow Your Roadmap', desc: 'Execute a personalized week-by-week learning plan.' },
]

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  }

  return (
    <div className="relative overflow-hidden">
      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden"
      >
        {/* Background layers */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <Particles />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent-600/8 rounded-full blur-3xl pointer-events-none pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass border border-brand-500/25 rounded-full px-4 py-2 mb-8"
          >
            <Sparkles size={14} className="text-brand-400" />
            <span className="text-sm text-brand-300 font-medium">
              AI-Powered Career Intelligence Platform
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-tight mb-6"
          >
            Bridge Skills to Careers
            <br />
            <span className="gradient-text">with Artificial Intelligence</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Analyze your skills, identify gaps, build personalized roadmaps, and accelerate
            your career growth through intelligent guidance.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/profile')}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold text-base shadow-2xl shadow-brand-900/50 hover:shadow-brand-500/30 transition-shadow cursor-pointer"
            >
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl glass border border-white/10 text-slate-200 font-semibold text-base hover:bg-white/8 transition-all cursor-pointer"
            >
              Explore Features
              <ChevronDown size={18} />
            </motion.button>
          </motion.div>

          {/* Hero visual — AI dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="glass-strong rounded-3xl border border-white/10 p-1 shadow-2xl shadow-black/50">
              <div className="rounded-2xl overflow-hidden bg-surface-800">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-surface-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="glass rounded-lg px-3 py-1 text-xs text-slate-500 text-center border border-white/5">
                      skillbridge.ai/dashboard
                    </div>
                  </div>
                </div>
                {/* Mock dashboard content */}
                <div className="p-6 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Skill Match', value: '73%', color: 'text-brand-400', bg: 'bg-brand-500/10' },
                    { label: 'Roadmap Progress', value: '45%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Resources Done', value: '12/28', color: 'text-accent-400', bg: 'bg-accent-500/10' },
                  ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-white/5`}>
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                  <div className="col-span-3 glass rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-slate-500 mb-3">Skill Gap Analysis</p>
                    <div className="space-y-2">
                      {[
                        { skill: 'Machine Learning', pct: 82 },
                        { skill: 'System Design', pct: 61 },
                        { skill: 'TypeScript', pct: 90 },
                      ].map((s) => (
                        <div key={s.skill} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-32">{s.skill}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${s.pct}%` }}
                              transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-brand-600/20 blur-2xl rounded-full" />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-slate-600">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={16} className="text-slate-600" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative py-20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map(({ value, label, icon: Icon }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-brand-500/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-500/20 transition-colors">
                  <Icon size={18} className="text-brand-400" />
                </div>
                <p className="text-3xl font-display font-bold gradient-text mb-1">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 glass border border-brand-500/20 rounded-full px-4 py-1.5 mb-4">
              <Zap size={12} className="text-brand-400" />
              <span className="text-xs text-brand-300 font-medium uppercase tracking-wider">Platform Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Everything you need to
              <br />
              <span className="gradient-text">accelerate your career</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A complete AI-powered toolkit that takes you from where you are to where you want to be.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map(({ icon: Icon, title, description, color, badge }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 group cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} p-0.5 shadow-lg`}
                  >
                    <div className="w-full h-full rounded-[10px] bg-surface-800 flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500 glass px-2 py-1 rounded-lg border border-white/5">
                    {badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-28 border-t border-white/5">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-slate-400 text-lg">Four simple steps to transform your career trajectory.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-500/30 to-transparent z-10" />
                )}
                <div className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/20 transition-colors">
                  <div className="text-4xl font-display font-bold gradient-text mb-3 opacity-60">
                    {step}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Trusted by <span className="gradient-text">professionals</span>
            </h2>
            <p className="text-slate-400 text-lg">Real results from real career transformations.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, avatar, content, rating, gradient }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">"{content}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/15 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 glass border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Free to get started</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Ready to bridge the gap?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join thousands of professionals who've accelerated their careers with AI-powered guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/profile')}
                className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 text-white font-semibold text-base shadow-2xl shadow-brand-900/50 hover:shadow-brand-500/30 transition-shadow cursor-pointer"
              >
                Start Your Journey
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
            <p className="mt-4 text-xs text-slate-600">No credit card required · Free forever plan available</p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">
              Skill<span className="gradient-text">Bridge</span> AI
            </span>
          </div>
          <p className="text-xs text-slate-600">
            © 2025 SkillBridge AI. Bridging Skills to Careers.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
