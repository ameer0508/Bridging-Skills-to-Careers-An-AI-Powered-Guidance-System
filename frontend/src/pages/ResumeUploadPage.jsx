import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle2, X, AlertCircle,
  ArrowRight, RefreshCw, Eye, Trash2, Sparkles,
  File, CloudUpload
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import resumeService from '../services/resumeService'

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ACCEPTED_EXT = ['.pdf', '.docx']
const MAX_SIZE_MB = 10

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeUploadPage() {
  const { resumeFile, setResumeFile, resumeData, setResumeData, updateProfile } = useApp()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [dragOver, setDragOver] = useState(false)
  const [uploadState, setUploadState] = useState(resumeFile ? 'done' : 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [file, setFile] = useState(resumeFile)
  const [parsedData, setParsedData] = useState(resumeData)

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.some((e) => f.name.endsWith(e))) {
      return 'Only PDF and DOCX files are supported.'
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const simulateUpload = useCallback(async (f) => {
    setFile(f)
    setUploadState('uploading')
    setProgress(0)
    setError('')

    try {
      const result = await resumeService.uploadResume(f, (pct) => setProgress(pct))
      setProgress(100)
      const parsed = result?.data?.parsed || result?.parsed || null
      setParsedData(parsed)
      setResumeData(parsed)
      setResumeFile(f)
      // Auto-update profile skills from parsed resume
      if (parsed?.extractedSkills?.length) {
        updateProfile({ skills: parsed.extractedSkills })
      }
      setTimeout(() => setUploadState('done'), 300)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
      setUploadState('error')
    }
  }, [setResumeFile, setResumeData, updateProfile])

  const handleFile = (f) => {
    const err = validateFile(f)
    if (err) { setError(err); setUploadState('error'); return }
    simulateUpload(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleInputChange = (e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }

  const handleRemove = () => {
    setFile(null)
    setResumeFile(null)
    setUploadState('idle')
    setProgress(0)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const getFileIcon = (name) => {
    if (name?.endsWith('.pdf')) return '📄'
    if (name?.endsWith('.docx')) return '📝'
    return '📎'
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-white mb-1">Resume Upload</h1>
          <p className="text-slate-400 text-sm">
            Upload your resume and let AI extract your skills and experience automatically.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {uploadState === 'idle' || uploadState === 'error' ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
                      relative rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer
                      transition-all duration-300 overflow-hidden
                      ${dragOver
                        ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                        : 'border-white/10 hover:border-brand-500/40 hover:bg-white/[0.02]'
                      }
                    `}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 dot-pattern opacity-20" />

                    {/* Animated ring on drag */}
                    {dragOver && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 rounded-3xl border-2 border-brand-400/50 animate-pulse"
                      />
                    )}

                    <div className="relative z-10">
                      <motion.div
                        animate={dragOver ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20 flex items-center justify-center mx-auto mb-5"
                      >
                        <CloudUpload size={32} className={dragOver ? 'text-brand-300' : 'text-brand-400'} />
                      </motion.div>

                      <h3 className="text-lg font-semibold text-slate-200 mb-2">
                        {dragOver ? 'Drop your resume here' : 'Drag & drop your resume'}
                      </h3>
                      <p className="text-sm text-slate-500 mb-5">
                        or click to browse from your computer
                      </p>

                      <div className="inline-flex items-center gap-2 glass rounded-xl px-5 py-2.5 border border-white/10 hover:border-brand-500/30 transition-colors">
                        <Upload size={15} className="text-brand-400" />
                        <span className="text-sm font-medium text-slate-300">Browse Files</span>
                      </div>

                      <div className="flex items-center justify-center gap-4 mt-6">
                        {['PDF', 'DOCX'].map((fmt) => (
                          <div key={fmt} className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            <span className="text-xs text-slate-500">{fmt}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          <span className="text-xs text-slate-500">Up to {MAX_SIZE_MB}MB</span>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </div>

                  {/* Error message */}
                  {uploadState === 'error' && error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-red-400 text-sm glass rounded-xl px-4 py-3 border border-red-500/20"
                    >
                      <AlertCircle size={15} />
                      {error}
                    </motion.div>
                  )}
                </motion.div>
              ) : uploadState === 'uploading' ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="text-center py-10">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <RefreshCw size={24} className="text-brand-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-base font-semibold text-slate-200 mb-1">
                      Uploading {file?.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      AI is analyzing your resume...
                    </p>

                    {/* Progress bar */}
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Uploading</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 relative"
                        >
                          <div className="absolute inset-0 shimmer rounded-full" />
                        </motion.div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-2">
                        <span>{formatBytes(file?.size * (progress / 100) || 0)}</span>
                        <span>{formatBytes(file?.size || 0)}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-xl">
                        {getFileIcon(file?.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={15} className="text-emerald-400" />
                          <span className="text-sm font-semibold text-emerald-300">Upload Successful</span>
                        </div>
                        <p className="text-sm font-medium text-slate-200 truncate">{file?.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file?.size || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => inputRef.current?.click()}
                          className="glass p-2 rounded-lg border border-white/8 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Replace file"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={handleRemove}
                          className="glass p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* AI Extraction Preview */}
          <AnimatePresence>
            {uploadState === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-brand-400" />
                    <h2 className="text-sm font-semibold text-slate-200">AI Extraction Results</h2>
                    <Badge variant="success" size="sm">Parsed</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Extracted Skills',
                        items: parsedData?.extractedSkills || ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Docker'],
                        color: 'brand',
                      },
                      {
                        label: 'Experience Detected',
                        items: parsedData?.jobTitles || ['3 years Frontend Dev', '1 year Backend', 'Team Lead (6 months)'],
                        color: 'accent',
                      },
                    ].map(({ label, items, color }) => (
                      <div key={label} className="glass rounded-xl p-4 border border-white/5">
                        <p className="text-xs font-medium text-slate-400 mb-3">{label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map((item) => (
                            <Badge key={item} variant={color === 'brand' ? 'default' : 'purple'} size="sm">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 glass rounded-xl p-4 border border-brand-500/15">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="text-brand-300 font-medium">AI Note:</span> Your resume has been
                      successfully parsed. 6 skills were extracted and matched against your profile.
                      Proceed to Skill Gap Analysis to see how you compare to your target role.
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Tips for Best Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: FileText, title: 'Use ATS Format', desc: 'Clean, single-column resumes parse most accurately.' },
                  { icon: CheckCircle2, title: 'Include Skills Section', desc: 'A dedicated skills section improves extraction accuracy.' },
                  { icon: File, title: 'PDF Preferred', desc: 'PDF format preserves formatting and parses most reliably.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={14} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300 mb-0.5">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* CTA */}
          {uploadState === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end"
            >
              <Button
                size="lg"
                onClick={() => navigate('/skill-gap')}
                iconRight={<ArrowRight size={16} />}
              >
                Analyze Skill Gap
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
