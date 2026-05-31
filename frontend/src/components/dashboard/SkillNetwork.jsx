/**
 * SkillNetwork — Living skill node visualization
 * Known skills glow and connect. Missing skills pulse red.
 * Hover shows recommendations. Click shows resources.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const KNOWN = [
  { id: 'js',    label: 'JavaScript', x: 50, y: 30, level: 90, connects: ['react','node'] },
  { id: 'react', label: 'React',      x: 25, y: 55, level: 85, connects: ['js','ts'] },
  { id: 'node',  label: 'Node.js',    x: 75, y: 55, level: 70, connects: ['js','sql'] },
  { id: 'ts',    label: 'TypeScript', x: 15, y: 30, level: 60, connects: ['react'] },
  { id: 'sql',   label: 'SQL',        x: 85, y: 30, level: 65, connects: ['node'] },
  { id: 'git',   label: 'Git',        x: 50, y: 75, level: 88, connects: ['js'] },
]

const MISSING = [
  { id: 'ml',     label: 'Machine Learning', x: 35, y: 15, priority: 'high',   boost: '+18%' },
  { id: 'docker', label: 'Docker',           x: 65, y: 15, priority: 'high',   boost: '+12%' },
  { id: 'aws',    label: 'AWS',              x: 88, y: 60, priority: 'medium', boost: '+9%'  },
  { id: 'gql',    label: 'GraphQL',          x: 12, y: 60, priority: 'medium', boost: '+7%'  },
]

export default function SkillNetwork() {
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const svgRef = useRef()

  const allNodes = [...KNOWN, ...MISSING]
  const hoveredNode = allNodes.find(n => n.id === (hovered || selected))

  return (
    <div className="relative w-full" style={{ paddingBottom: '70%' }}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines between known skills */}
        {KNOWN.map(node =>
          node.connects.map(targetId => {
            const target = KNOWN.find(n => n.id === targetId)
            if (!target) return null
            const isActive = hovered === node.id || hovered === targetId
            return (
              <motion.line key={`${node.id}-${targetId}`}
                x1={`${node.x}%`} y1={`${node.y}%`}
                x2={`${target.x}%`} y2={`${target.y}%`}
                stroke={isActive ? '#818cf8' : 'rgba(99,102,241,0.15)'}
                strokeWidth={isActive ? '0.5' : '0.3'}
                strokeDasharray={isActive ? 'none' : '1 1'}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            )
          })
        )}

        {/* Known skill nodes */}
        {KNOWN.map((node, i) => {
          const isHov = hovered === node.id
          const r = isHov ? 4.5 : 3.5
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected === node.id ? null : node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow */}
              <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r={r + 3}
                fill="#818cf8" opacity={isHov ? 0.15 : 0.05}
                animate={{ r: [r + 2, r + 4, r + 2] }}
                transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity }}
              />
              {/* Core */}
              <motion.circle cx={`${node.x}%`} cy={`${node.y}%`}
                r={r} fill="#818cf8"
                initial={{ r: 0 }} animate={{ r }}
                transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
                style={{ filter: 'drop-shadow(0 0 3px #818cf8)' }}
              />
              {/* Label */}
              <motion.text x={`${node.x}%`} y={`${node.y + 7}%`}
                textAnchor="middle" fontSize="3.5" fill={isHov ? '#e2e8f0' : '#64748b'}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.5 }}
              >{node.label}</motion.text>
            </g>
          )
        })}

        {/* Missing skill nodes */}
        {MISSING.map((node, i) => {
          const isHov = hovered === node.id
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r="4"
                fill="none" stroke={node.priority === 'high' ? '#f87171' : '#fbbf24'}
                strokeWidth="0.5" strokeDasharray="1.5 1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity }}
              />
              <motion.circle cx={`${node.x}%`} cy={`${node.y}%`} r="2.5"
                fill={node.priority === 'high' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)'}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 + 0.5, type: 'spring' }}
              />
              <motion.text x={`${node.x}%`} y={`${node.y + 6}%`}
                textAnchor="middle" fontSize="3.2"
                fill={node.priority === 'high' ? '#f87171' : '#fbbf24'}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.7 }}
              >{node.label}</motion.text>
              {/* Boost badge */}
              <motion.text x={`${node.x + 5}%`} y={`${node.y - 3}%`}
                textAnchor="middle" fontSize="2.8" fill="#34d399"
                initial={{ opacity: 0 }} animate={{ opacity: isHov ? 1 : 0 }}
              >{node.boost}</motion.text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-3 text-center pointer-events-none w-56"
            style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}
          >
            <p className="text-sm font-bold text-white mb-1">{hoveredNode.label}</p>
            {hoveredNode.level !== undefined
              ? <p className="text-xs text-slate-400">Proficiency: <span className="text-indigo-300 font-semibold">{hoveredNode.level}%</span></p>
              : <p className="text-xs text-emerald-400 font-medium">Learning this boosts match {hoveredNode.boost}</p>
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />Known
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full border border-red-400" />Missing
        </div>
      </div>
    </div>
  )
}
