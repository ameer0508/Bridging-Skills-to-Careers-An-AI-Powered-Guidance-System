import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, GraduationCap, Briefcase, Target,
  Plus, X, CheckCircle2, Save, ArrowRight, Sparkles
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'

const educationOptions = [
  { value: '', label: 'Select education level' },
  { value: "High School Diploma", label: 'High School Diploma' },
  { value: "Associate's Degree", label: "Associate's Degree" },
  { value: "Bachelor's in Computer Science", label: "Bachelor's in Computer Science" },
  { value: "Bachelor's in Engineering", label: "Bachelor's in Engineering" },
  { value: "Bachelor's in Business", label: "Bachelor's in Business" },
  { value: "Master's in Computer Science", label: "Master's in Computer Science" },
  { value: "Master's in Data Science", label: "Master's in Data Science" },
  { value: "MBA", label: 'MBA' },
  { value: "PhD", label: 'PhD' },
  { value: "Bootcamp Graduate", label: 'Bootcamp Graduate' },
  { value: "Self-Taught", label: 'Self-Taught' },
]

const jobRoleOptions = [
  { value: '', label: 'Select target role' },
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Developer', label: 'Backend Developer' },
  { value: 'Full Stack Engineer', label: 'Full Stack Engineer' },
  { value: 'Senior Full Stack Engineer', label: 'Senior Full Stack Engineer' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'ML Engineer', label: 'ML Engineer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'Cloud Architect', label: 'Cloud Architect' },
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'UX Designer', label: 'UX Designer' },
  { value: 'Cybersecurity Engineer', label: 'Cybersecurity Engineer' },
]

const suggestedSkills = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Java', 'Go', 'Rust', 'SQL', 'PostgreSQL', 'MongoDB',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'CI/CD',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
  'GraphQL', 'REST APIs', 'Microservices', 'System Design',
]

const interestOptions = [
  'Full Stack Development', 'Frontend Engineering', 'Backend Engineering',
  'AI/ML Engineering', 'Data Science', 'DevOps & Cloud', 'Mobile Development',
  'Cybersecurity', 'Product Management', 'UX/UI Design', 'Blockchain',
]

export default function ProfilePage() {
  const { profile, updateProfile } = useApp()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  const [form, setForm] = useState({ ...profile })

  const validate = () => {
    const e = {}
    if (!form.fullName?.trim()) e.fullName = 'Full name is required'
    if (!form.email?.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.education) e.education = 'Please select your education level'
    if (!form.targetJobRole) e.targetJobRole = 'Please select a target role'
    if (!form.skills?.length) e.skills = 'Add at least one skill'
    return e
  }

  const handleSave = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addSkill = (skill) => {
    const s = skill.trim()
    if (s && !form.skills.includes(s)) {
      setForm((p) => ({ ...p, skills: [...p.skills, s] }))
      setErrors((p) => ({ ...p, skills: undefined }))
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))
  }

  const toggleInterest = (interest) => {
    setForm((p) => ({
      ...p,
      careerInterests: p.careerInterests.includes(interest)
        ? p.careerInterests.filter((i) => i !== interest)
        : [...p.careerInterests, interest],
    }))
  }

  const completionFields = [
    form.fullName, form.email, form.education,
    form.targetJobRole, form.skills?.length, form.careerInterests?.length,
  ]
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  )

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-white mb-1">Career Profile</h1>
              <p className="text-slate-400 text-sm">
                Build your profile to unlock personalized AI career guidance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"
                  >
                    <CheckCircle2 size={16} />
                    Saved
                  </motion.div>
                )}
              </AnimatePresence>
              <Button onClick={handleSave} icon={Save}>
                Save Profile
              </Button>
            </div>
          </div>

          {/* Completion bar */}
          <div className="mt-5 glass rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-medium">Profile Completion</span>
              <span className="text-sm font-bold text-brand-300">{completionPct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              />
            </div>
            {completionPct < 100 && (
              <p className="text-xs text-slate-600 mt-2">
                Complete your profile to get the most accurate AI recommendations.
              </p>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — basic info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <User size={15} className="text-brand-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Alex Johnson"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, fullName: e.target.value }))
                      setErrors((p) => ({ ...p, fullName: undefined }))
                    }}
                    error={errors.fullName}
                    icon={User}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="alex@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, email: e.target.value }))
                      setErrors((p) => ({ ...p, email: undefined }))
                    }}
                    error={errors.email}
                    icon={Mail}
                  />
                  <Select
                    label="Education Level"
                    options={educationOptions}
                    value={form.education}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, education: e.target.value }))
                      setErrors((p) => ({ ...p, education: undefined }))
                    }}
                    error={errors.education}
                    containerClassName="sm:col-span-2"
                  />
                </div>
              </Card>
            </motion.div>

            {/* Career Goals */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-accent-500/15 flex items-center justify-center">
                    <Target size={15} className="text-accent-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Career Goals</h2>
                </div>
                <Select
                  label="Target Job Role"
                  options={jobRoleOptions}
                  value={form.targetJobRole}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, targetJobRole: e.target.value }))
                    setErrors((p) => ({ ...p, targetJobRole: undefined }))
                  }}
                  error={errors.targetJobRole}
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Career Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => {
                      const selected = form.careerInterests.includes(interest)
                      return (
                        <motion.button
                          key={interest}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            selected
                              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                              : 'glass border border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/15'
                          }`}
                        >
                          {selected && <span className="mr-1">✓</span>}
                          {interest}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Briefcase size={15} className="text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Current Skills</h2>
                  <span className="ml-auto text-xs text-slate-500">{form.skills.length} skills added</span>
                </div>

                {/* Skill input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) }
                    }}
                    className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 border border-white/8 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                  <Button
                    onClick={() => addSkill(skillInput)}
                    icon={Plus}
                    size="md"
                    disabled={!skillInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {/* Current skills */}
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <AnimatePresence>
                      {form.skills.map((skill) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Badge
                            variant="default"
                            onRemove={() => removeSkill(skill)}
                          >
                            {skill}
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
                {errors.skills && (
                  <p className="text-xs text-red-400 mb-3">{errors.skills}</p>
                )}

                {/* Suggested skills */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">Suggested skills — click to add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedSkills
                      .filter((s) => !form.skills.includes(s))
                      .slice(0, 16)
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="px-2.5 py-1 rounded-lg text-xs text-slate-500 border border-white/5 hover:border-brand-500/30 hover:text-brand-300 hover:bg-brand-500/8 transition-all cursor-pointer"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right column — summary */}
          <div className="space-y-6">
            {/* Profile preview */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg shadow-brand-900/40">
                    {form.fullName?.charAt(0) || 'A'}
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">
                    {form.fullName || 'Your Name'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {form.targetJobRole || 'Target Role'}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  {[
                    { icon: Mail, label: form.email || 'Email not set', color: 'text-blue-400' },
                    { icon: GraduationCap, label: form.education || 'Education not set', color: 'text-emerald-400' },
                    { icon: Target, label: form.targetJobRole || 'Role not set', color: 'text-accent-400' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2.5 text-slate-400">
                      <Icon size={13} className={color} />
                      <span className="text-xs truncate">{label}</span>
                    </div>
                  ))}
                </div>

                {form.careerInterests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-500 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.careerInterests.slice(0, 3).map((i) => (
                        <Badge key={i} variant="purple" size="sm">{i}</Badge>
                      ))}
                      {form.careerInterests.length > 3 && (
                        <Badge variant="ghost" size="sm">+{form.careerInterests.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* AI tip */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border border-brand-500/15 bg-brand-950/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-brand-400" />
                  <span className="text-xs font-semibold text-brand-300">AI Tip</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The more complete your profile, the more accurate your skill gap analysis and
                  learning roadmap will be. Add at least 5 skills for best results.
                </p>
              </Card>
            </motion.div>

            {/* Next step */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => { handleSave(); navigate('/resume') }}
                iconRight={<ArrowRight size={16} />}
              >
                Continue to Resume
              </Button>
              <p className="text-xs text-slate-600 text-center mt-2">
                Next: Upload your resume for AI analysis
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
