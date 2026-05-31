import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'p-6',
  onClick,
  ...props
}) {
  const base = `
    glass rounded-2xl ${padding}
    ${hover ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300' : ''}
    ${glow ? 'hover:shadow-lg hover:shadow-brand-900/30' : ''}
    ${className}
  `

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={base}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} {...props}>
      {children}
    </div>
  )
}
