import { useState } from 'react'
import { FileText, Layout, LayoutGrid, Zap, Settings } from 'lucide-react'
import Sidebar from './components/layout/Sidebar.jsx'
import Home from './pages/Home.jsx'
import Editor from './pages/Editor.jsx'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'editor'

  const nav = [
    { id: 'home', label: 'Inicio', icon: <FileText className="w-5 h-5" /> },
    { id: 'editor', label: 'Editor de imposición', icon: <LayoutGrid className="w-5 h-5" /> },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar nav={nav} active={view} onSelect={setView} />

      <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {nav.find((n) => n.id === view)?.label || 'Impositor'}
            </h1>
            <p className="text-slate-500 text-sm">
              Genera pliegos impuestos listos para imprenta a partir de un PDF fuente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Zap className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </header>

        {view === 'home' ? <Home onStartImposition={() => setView('editor')} /> : <Editor onBack={() => setView('home')} />}
      </main>
    </div>
  )
}
