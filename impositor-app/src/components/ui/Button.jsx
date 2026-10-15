import { cn } from './utils.js'

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) {
  const variants = {
    primary:
      'bg-impositor-600 text-white hover:bg-impositor-700 focus:ring-2 focus:ring-impositor-500',
    secondary:
      'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-2 focus:ring-slate-400',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-slate-300',
    outline:
      'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-impositor-500',
    danger:
      'bg-rose-500 text-white hover:bg-rose-600 focus:ring-2 focus:ring-rose-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
