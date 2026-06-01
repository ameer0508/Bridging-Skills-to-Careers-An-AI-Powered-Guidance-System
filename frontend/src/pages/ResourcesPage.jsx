import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, Filter, Star, Clock, ExternalLink,
  Bookmark, BookmarkCheck, Sparkles, Award, Code2,
  Play, ChevronDown, X, Globe, RefreshCw
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import resourcesService from '../services/resourcesService'

const allResources = [
  // Courses
  { id: 1, title: 'TypeScript: The Complete Developer\'s Guide', platform: 'Udemy', type: 'Course', skill: 'TypeScript', level: 'Intermediate', rating: 4.8, reviews: 12400, duration: '27h', price: 'Paid', url: '#', color: 'from-blue-500 to-brand-500', featured: true },
  { id: 2, title: 'System Design Interview – An Insider\'s Guide', platform: 'Educative', type: 'Course', skill: 'System Design', level: 'Advanced', rating: 4.9, reviews: 8900, duration: '20h', price: 'Paid', url: '#', color: 'from-brand-500 to-accent-500', featured: true },
  { id: 3, title: 'Machine Learning A-Z: AI, Python & R', platform: 'Udemy', type: 'Course', skill: 'Machine Learning', level: 'Beginner', rating: 4.5, reviews: 180000, duration: '44h', price: 'Paid', url: '#', color: 'from-accent-500 to-purple-500', featured: false },
  { id: 4, title: 'React — The Complete Guide 2025', platform: 'Udemy', type: 'Course', skill: 'React', level: 'Beginner', rating: 4.7, reviews: 220000, duration: '68h', price: 'Paid', url: '#', color: 'from-cyan-500 to-blue-500', featured: false },
  { id: 5, title: 'Node.js, Express, MongoDB & More', platform: 'Udemy', type: 'Course', skill: 'Node.js', level: 'Intermediate', rating: 4.8, reviews: 95000, duration: '42h', price: 'Paid', url: '#', color: 'from-emerald-500 to-teal-500', featured: false },
  { id: 6, title: 'Docker & Kubernetes: The Practical Guide', platform: 'Udemy', type: 'Course', skill: 'Docker', level: 'Intermediate', rating: 4.7, reviews: 45000, duration: '23h', price: 'Paid', url: '#', color: 'from-sky-500 to-blue-500', featured: false },
  { id: 7, title: 'CS50\'s Introduction to AI with Python', platform: 'edX', type: 'Course', skill: 'Machine Learning', level: 'Beginner', rating: 4.9, reviews: 67000, duration: '30h', price: 'Free', url: '#', color: 'from-red-500 to-rose-500', featured: false },
  { id: 8, title: 'GraphQL with React: The Complete Developers Guide', platform: 'Udemy', type: 'Course', skill: 'GraphQL', level: 'Intermediate', rating: 4.6, reviews: 28000, duration: '13h', price: 'Paid', url: '#', color: 'from-pink-500 to-rose-500', featured: false },

  // Certifications
  { id: 9, title: 'AWS Certified Solutions Architect – Associate', platform: 'AWS', type: 'Certification', skill: 'AWS/Cloud', level: 'Intermediate', rating: 4.8, reviews: 34000, duration: '40h prep', price: 'Paid', url: '#', color: 'from-amber-500 to-orange-500', featured: true },
  { id: 10, title: 'Google Professional Cloud Architect', platform: 'Google Cloud', type: 'Certification', skill: 'AWS/Cloud', level: 'Advanced', rating: 4.7, reviews: 12000, duration: '60h prep', price: 'Paid', url: '#', color: 'from-blue-500 to-sky-500', featured: false },
  { id: 11, title: 'Microsoft Azure Fundamentals (AZ-900)', platform: 'Microsoft', type: 'Certification', skill: 'AWS/Cloud', level: 'Beginner', rating: 4.6, reviews: 45000, duration: '20h prep', price: 'Paid', url: '#', color: 'from-blue-600 to-brand-600', featured: false },
  { id: 12, title: 'Certified Kubernetes Administrator (CKA)', platform: 'CNCF', type: 'Certification', skill: 'Kubernetes', level: 'Advanced', rating: 4.8, reviews: 8900, duration: '50h prep', price: 'Paid', url: '#', color: 'from-brand-500 to-blue-500', featured: false },

  // Practice Platforms
  { id: 13, title: 'LeetCode Premium', platform: 'LeetCode', type: 'Practice', skill: 'System Design', level: 'All Levels', rating: 4.9, reviews: 500000, duration: 'Ongoing', price: 'Freemium', url: '#', color: 'from-amber-500 to-yellow-500', featured: true },
  { id: 14, title: 'HackerRank Developer Skills', platform: 'HackerRank', type: 'Practice', skill: 'TypeScript', level: 'All Levels', rating: 4.6, reviews: 200000, duration: 'Ongoing', price: 'Free', url: '#', color: 'from-emerald-500 to-green-500', featured: false },
  { id: 15, title: 'Kaggle Learn & Competitions', platform: 'Kaggle', type: 'Practice', skill: 'Machine Learning', level: 'All Levels', rating: 4.8, reviews: 300000, duration: 'Ongoing', price: 'Free', url: '#', color: 'from-sky-500 to-cyan-500', featured: false },
  { id: 16, title: 'Exercism — Code Practice', platform: 'Exercism', type: 'Practice', skill: 'TypeScript', level: 'All Levels', rating: 4.7, reviews: 80000, duration: 'Ongoing', price: 'Free', url: '#', color: 'from-purple-500 to-violet-500', featured: false },
]

const typeIcons = {
  Course: Play,
  Certification: Award,
  Practice: Code2,
}

const levelColors = {
  Beginner: 'success',
  Intermediate: 'default',
  Advanced: 'warning',
  'All Levels': 'ghost',
}

const priceColors = {
  Free: 'success',
  Freemium: 'info',
  Paid: 'ghost',
}

export default function ResourcesPage() {
  const { profile } = useApp()
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [activeSkill, setActiveSkill] = useState('All')
  const [activeLevel, setActiveLevel] = useState('All')
  const [bookmarked, setBookmarked] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [apiResources, setApiResources] = useState([])
  const [loadingApi, setLoadingApi] = useState(false)

  // Try to load from backend on mount
  useEffect(() => {
    setLoadingApi(true)
    resourcesService.getResources({ limit: 50 })
      .then(res => {
        const items = res?.data?.resources || res?.resources || []
        if (items.length > 0) {
          const mapped = items.map((r, i) => ({
            id: r.id || i + 100,
            title: r.title,
            platform: r.platform,
            type: r.type || 'Course',
            skill: r.skill || 'General',
            level: r.level || 'All Levels',
            rating: r.rating || 4.5,
            reviews: r.reviews || 1000,
            duration: r.duration || 'Self-paced',
            price: r.price || 'Paid',
            url: r.url || '#',
            color: 'from-brand-500 to-accent-500',
            featured: i < 3,
          }))
          setApiResources(mapped)
        }
      })
      .catch(() => {}) // silently fall back to static
      .finally(() => setLoadingApi(false))
  }, [])

  const sourceResources = apiResources.length > 0 ? apiResources : allResources

  const types = ['All', 'Course', 'Certification', 'Practice']
  const skills = ['All', 'TypeScript', 'System Design', 'Machine Learning', 'AWS/Cloud', 'React', 'Node.js', 'Docker', 'GraphQL', 'Kubernetes']
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']

  const filtered = useMemo(() => {
    return sourceResources.filter((r) => {
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.platform.toLowerCase().includes(search.toLowerCase()) || r.skill.toLowerCase().includes(search.toLowerCase())
      const matchType = activeType === 'All' || r.type === activeType
      const matchSkill = activeSkill === 'All' || r.skill === activeSkill
      const matchLevel = activeLevel === 'All' || r.level === activeLevel
      return matchSearch && matchType && matchSkill && matchLevel
    })
  }, [search, activeType, activeSkill, activeLevel, sourceResources])

  const featured = filtered.filter((r) => r.featured)
  const rest = filtered.filter((r) => !r.featured)

  const toggleBookmark = (id) => {
    setBookmarked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSearch('')
    setActiveType('All')
    setActiveSkill('All')
    setActiveLevel('All')
  }

  const hasFilters = search || activeType !== 'All' || activeSkill !== 'All' || activeLevel !== 'All'

  const ResourceCard = ({ resource, index }) => {
    const TypeIcon = typeIcons[resource.type]
    const isBookmarked = bookmarked.has(resource.id)

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        whileHover={{ y: -3 }}
        className="glass rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden group"
      >
        {/* Top gradient bar */}
        <div className={`h-1 bg-gradient-to-r ${resource.color}`} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <TypeIcon size={16} className="text-white" />
            </div>
            <button
              onClick={() => toggleBookmark(resource.id)}
              className="text-slate-600 hover:text-brand-400 transition-colors cursor-pointer mt-0.5"
            >
              {isBookmarked ? (
                <BookmarkCheck size={16} className="text-brand-400" />
              ) : (
                <Bookmark size={16} />
              )}
            </button>
          </div>

          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors mb-1 leading-snug">
            {resource.title}
          </h3>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <Globe size={10} />
            {resource.platform}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge variant={levelColors[resource.level]} size="sm">{resource.level}</Badge>
            <Badge variant={priceColors[resource.price]} size="sm">{resource.price}</Badge>
            <Badge variant="ghost" size="sm">{resource.skill}</Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <div className="flex items-center gap-1">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="font-medium text-slate-300">{resource.rating}</span>
              <span>({(resource.reviews / 1000).toFixed(0)}k)</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} />
              {resource.duration}
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl glass border border-white/8 hover:border-brand-500/30 hover:bg-brand-500/8 text-xs font-medium text-slate-400 hover:text-brand-300 transition-all cursor-pointer">
            <ExternalLink size={12} />
            View Resource
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-white mb-1">Learning Resources</h1>
          <p className="text-slate-400 text-sm">
            Curated courses, certifications, and practice platforms for your skill gaps.
          </p>
        </motion.div>

        {/* Search & Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-3"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses, platforms, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 border border-white/8 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl glass border text-sm font-medium transition-all cursor-pointer ${
                showFilters || hasFilters
                  ? 'border-brand-500/40 text-brand-300 bg-brand-500/10'
                  : 'border-white/8 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter size={14} />
              Filters
              {hasFilters && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
                  {[activeType !== 'All', activeSkill !== 'All', activeLevel !== 'All'].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Filter panels */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-xl p-4 border border-white/8 space-y-4">
                  {[
                    { label: 'Type', options: types, active: activeType, set: setActiveType },
                    { label: 'Skill', options: skills, active: activeSkill, set: setActiveSkill },
                    { label: 'Level', options: levels, active: activeLevel, set: setActiveLevel },
                  ].map(({ label, options, active, set }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => set(opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              active === opt
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                                : 'glass border border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/15'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type quick filter */}
          {!showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeType === type
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                      : 'glass border border-white/8 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">
            <span className="text-slate-300 font-medium">{filtered.length}</span> resources found
          </p>
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-brand-400" />
            <span className="text-xs text-brand-300">AI-curated for your skill gaps</span>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <h2 className="text-sm font-semibold text-slate-200">Featured Recommendations</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((r, i) => (
                <ResourceCard key={r.id} resource={r} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* All resources */}
        {rest.length > 0 && (
          <div>
            {featured.length > 0 && (
              <h2 className="text-sm font-semibold text-slate-400 mb-4">All Resources</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rest.map((r, i) => (
                <ResourceCard key={r.id} resource={r} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-400 mb-2">No resources found</h3>
            <p className="text-sm text-slate-600 mb-4">Try adjusting your search or filters.</p>
            <Button variant="secondary" onClick={clearFilters}>Clear Filters</Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
