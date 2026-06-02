/**
 * SkillNetwork — uses real skillGap API data
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SkillNetwork({ skillGap, userSkills = [] }) {
  const [hovered, setHovered] = useState(null)

  // Extract from real API data
  const known   = (skillGap ? (skillGap.existingSkills?.required || []).concat(skillGap.existingSkills?.preferred || []) : userSkills).slice(0, 8)
  const missing = skillGap ? (skillGap.missingSkills?.required || skillGap.skillGap?.missingRequired || []).slice(0, 6) : []

  // Generate node positions
  const knownNodes = known.map((s, i) => {
    const angle = (i / Math.max(known.length, 1)) * 2 * Math.PI - Math.PI / 2
    const r = 28
    return { id: s, label: s, x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle), type: 'known' }
  })
  const missingNodes = missing.map((s, i) => {
    const angle = (i / Math.max(missing.length, 1)) * 2 * Math.PI - Math.PI / 2
    const r = 42
    return { id: s, label: s, x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle), type: 'missing' }
  })
  const allNodes = [...knownNodes, ...missingNodes]
  const hoveredNode = allNodes.find(n => n.id === hovered)

  if (!allNodes.length) return (
    <div className="text-center py-8 text-slate-600 text-sm">Add skills to your profile to see your skill network.</div>
  )

  return (
    <div className="relative w-full" style={{ paddingBottom: '70%' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid meet">
        {/* Center node */}
        <circle cx="50%" cy="50%" r="4" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 4px #6366f1)' }} />
        <text x="50%" y="53%" textAnchor="middle" fontSize="2.5" fill="#94a3b8" dy="3">YOU</text>

        {/* Lines to known skills */}
        {knownNodes.map((n, i) => (
          <motion.line key={n.id}
            x1="50%" y1="50%"
            x2={`${n.x}%`} y2={`${n.y}%`}
            stroke={hovered === n.id ? '#818cf8' : 'rgba(99,102,241,0.2)'}
            strokeWidth={hovered === n.id ? '0.6' : '0.3'}
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: i * 0.1 }}
          />
        ))}

        {/* Known skill nodes */}
        {knownNodes.map((node, i) => (
          <g key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r={hovered === node.id ? '4.5' : '3.5'}
              fill="#818cf8"
              initial={{ r: 0 }} animate={{ r: hovered === node.id ? 4.5 : 3.5 }}
              transition={{ duration: 0.3 }}
              style={{ filter: 'drop-shadow(0 0 3px #818cf8)' }}
            />
            <motion.text x={`${node.x}%`} y={`${node.y + 7}%`}
              textAnchor="middle" fontSize="3.2"
              fill={hovered === node.id ? '#e2e8f0' : '#64748b'}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 + 0.5 }}
            >{node.label}</motion.text>
          </g>
        ))}

        {/* Missing skill nodes */}
        {missingNodes.map((node, i) => (
          <g key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r="4"
              fill="none" stroke="#f87171" strokeWidth="0.5" strokeDasharray="1.5 1"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity }}
            />
            <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r="2"
              fill="rgba(248,113,113,0.2)"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.15 + 0.5, type: 'spring' }}
            />
            <motion.text x={`${node.x}%`} y={`${node.y + 6.5}%`}
              textAnchor="middle" fontSize="3"
              fill="#f87171"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.15 + 0.7 }}
            >{node.label}</motion.text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-2.5 text-center pointer-events-none w-52"
            style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}
          >
            <p className="text-sm font-bold text-white mb-0.5">{hoveredNode.label}</p>
            <p className="text-xs" style={{ color: hoveredNode.type === 'known' ? '#34d399' : '#f87171' }}>
              {hoveredNode.type === 'known' ? '✓ Skill acquired' : '⚡ Learning recommended'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-400" />Known ({known.length})</div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2 h-2 rounded-full border border-red-400" />Missing ({missing.length})</div>
      </div>
    </div>
  )
}
