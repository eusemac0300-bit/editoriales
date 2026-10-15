export default function Sidebar({ nav, active, onSelect }) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <svg
            className="w-7 h-7 text-impositor-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Impositor</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">App de imposición</p>
      </div>

      <nav className="p-4 space-y-1">
        {nav.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-impositor-50 text-impositor-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 mt-auto">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
