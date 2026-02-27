import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ClipboardList, Search, Filter } from 'lucide-react'

export default function AuditLog() {
    const { data } = useAuth()
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')

    const logs = data.auditLog
        .filter(l => typeFilter === 'all' || l.type === typeFilter)
        .filter(l => !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.userName.toLowerCase().includes(search.toLowerCase()))

    const types = ['all', ...new Set(data.auditLog.map(l => l.type))]
    const typeColors = { kanban: 'badge-blue', finanzas: 'badge-yellow', inventario: 'badge-purple', general: 'badge-green' }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-primary" />Log de Auditoría
                </h1>
                <p className="text-dark-600 text-sm mt-1">Registro histórico de todas las acciones del sistema</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar en registro..." />
                </div>
                <div className="flex gap-2">
                    {types.map(t => (
                        <button key={t} onClick={() => setTypeFilter(t)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? 'bg-primary text-white' : 'bg-dark-200 text-dark-700 hover:bg-dark-300'}`}>
                            <Filter className="w-3 h-3 inline mr-1" />{t === 'all' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-card divide-y divide-dark-300/50">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-dark-600">No hay registros que coincidan</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-dark-200/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0">
                                {log.userName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">{log.action}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-dark-600">{log.userName}</span>
                                    <span className="text-dark-500">·</span>
                                    <span className="text-xs text-dark-500">{new Date(log.date).toLocaleString('es-CL')}</span>
                                </div>
                            </div>
                            <span className={typeColors[log.type] || 'badge-blue'}>{log.type}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
