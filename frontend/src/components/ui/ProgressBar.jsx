import { motion } from 'framer-motion'

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = true,
  color = 'brand',
  size = 'md',
  animated = true,
  className = '',
}) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  const colors = {
    brand: 'from-brand-500 to-accent-500',
    success: 'from-emerald-500 to-teal-400',
    warning: 'from-amber-500 to-orange-400',
    danger: 'from-red-500 to-rose-400',
    info: 'from-sky-500 to-blue-400',
  }

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-slate-200">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percent}%` }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`${heights[size]} rounded-full bg-gradient-to-r ${colors[color]} relative`}
        >
          <div className="absolute inset-0 shimmer rounded-full" />
        </motion.div>
      </div>
    </div>
  )
}
