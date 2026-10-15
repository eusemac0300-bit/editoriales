import { cn } from './utils.js'

export function Input({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-impositor-500 focus:border-impositor-500 transition-colors',
        className
      )}
      {...props}
    />
  )
}
