/**
 * ResourceHub — Netflix-style resource cards with smooth hover effects
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Award, Code2, Star, Clock, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'

const RESOURCES = [
  { id:1, title:'TypeScript: Complete Guide',  platform:'Udemy',     type:'Course',        skill:'TypeScript',     rating:4.8, duration:'27h', color:'from-blue-500 to-indigo-500',   price:'Paid'     },
  { id:2, title:'System Design Interview',     platform:'Educative', type:'Course',        skill:'System Design',  rating:4.9, duration:'20h', color:'from-indigo-500 to-violet-500', price:'Paid'     },
  { id:3, title:'AWS Solutions Architect',     platform:'AWS',       type:'Certification', skill:'Cloud',          rating:4.8, duration:'40h', color:'from-amber-500 to-orange-500',  price:'Paid'     },
  { id:4, title:'LeetCode Premium',            platform:'LeetCode',  type:'Practice',      skill:'Algorithms',     rating:4.9, duration:'∞',   color:'from-amber-400 to-yellow-500',  price:'Freemium' },
  { id:5, title:'Machine Learning A-Z',        platform:'Udemy',     type:'Course',        skill:'ML',             rating:4.5, duration:'44h', color:'from-violet-500 to-purple-500', price:'Paid'     },
  { id:6, title:'CS50 AI with Python',         platform:'edX',       type:'Course',        skill:'AI',             rating:4.9, duration:'30h', color:'from-red-500 to-rose-500',      price:'Free'     },
]

const TYPE_ICON = { Course: Play, Certification: Award, Practice: Code2 }
const PRICE_COLOR = { Free: '#34d399', Freemium: '#fbbf24', Paid: '#64748b' }

export default function ResourceHub({ resources = [], loading = false }) {
  const [bookmarked, setBookmarked] = useState(new Set())
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Course', 'Certification', 'Practice']

  // Use real API data if available, else static fallback
  const sourceResources = resources.length > 0
    ? resources.map((r, i) => ({
        id: r.id || i + 100, title: r.title,
        platform: r.provider || r.platform || 'Online',
        type: r.type || 'Course', skill: r.skillId || r.skill || 'General',
        rating: r.rating || 4.5, duration: r.duration || 'Self-paced',
        price: r.free === true ? 'Free' : r.free === false ? 'Paid' : (r.price || 'Paid'),
        url: r.url || '#', color: 'from-brand-500 to-accent-500',
      }))
    : RESOURCES

  const visible = filter === 'All' ? sourceResources : sourceResources.filter(r => r.type === filter)

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all"
            style={filter === f
              ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#475569' }
            }
          >{f}</button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((r, i) => {
          const Icon = TYPE_ICON[r.type]
          const isBookmarked = bookmarked.has(r.id)
          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl overflow-hidden group cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Color bar */}
              <div className={`h-1 bg-gradient-to-r ${r.color}`} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); setBookmarked(b => { const n = new Set(b); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n }) }}
                    className="text-slate-700 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {isBookmarked ? <BookmarkCheck size={14} className="text-indigo-400" /> : <Bookmark size={14} />}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors mb-1 leading-snug">{r.title}</p>
                <p className="text-xs text-slate-600 mb-3">{r.platform} · <span style={{ color: PRICE_COLOR[r.price] }}>{r.price}</span></p>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-slate-400 font-medium">{r.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={10} />{r.duration}
                  </div>
                  <ExternalLink size={10} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
