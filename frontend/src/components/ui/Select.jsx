import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { label, error, hint, options = [], className = '', containerClassName = '', ...props },
  ref
) {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full glass rounded-xl px-4 py-3 text-sm text-slate-100
            border border-white/8 focus:border-brand-500/60
            focus:outline-none focus:ring-2 focus:ring-brand-500/20
            transition-all duration-200 appearance-none cursor-pointer
            bg-transparent
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-surface-700 text-slate-100"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

export default Select
