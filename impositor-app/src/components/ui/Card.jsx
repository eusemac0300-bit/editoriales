export function Card({ className = '', children }) {
  return (
    <div
      className={cn('rounded-2xl bg-white border border-slate-200 shadow-sm p-6', className)}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>
}

export function CardContent({ className = '', children }) {
  return <div className={cn('text-slate-600', className)}>{children}</div>
}
