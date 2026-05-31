const variants = {
  default: 'bg-brand-500/15 text-brand-300 border border-brand-500/25',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/25',
  info: 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
  purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  ghost: 'bg-white/5 text-slate-300 border border-white/10',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  onRemove,
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${variants[variant]} ${className}
      `}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  )
}
