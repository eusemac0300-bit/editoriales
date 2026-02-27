import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Package, BookOpen, DollarSign, Users, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function AdminDashboard() {
    const { data, formatCLP } = useAuth()
    const navigate = useNavigate()
    const { books, inventory, finances, alerts } = data

    const totalBooks = books.length
    const published = books.filter(b => b.status === 'Publicado').length
    const inProduction = books.filter(b => !['Publicado', 'Original'].includes(b.status)).length
    const totalIncome = finances.invoices.filter(i => i.type === 'ingreso').reduce((s, i) => s + i.amount, 0)
    const totalExpenses = finances.invoices.filter(i => i.type === 'egreso').reduce((s, i) => s + i.amount, 0)
    const totalStock = inventory.physical.reduce((s, p) => s + p.stock, 0)
    const criticalAlerts = alerts.filter(a => !a.read).length

    const stats = [
        { label: 'Libros Totales', value: totalBooks, icon: BookOpen, color: 'from-primary to-primary-700', change: `${published} publicados`, link: '/admin/libros' },
        { label: 'En Producción', value: inProduction, icon: TrendingUp, color: 'from-amber-500 to-amber-700', change: `${books.filter(b => b.status === 'Original').length} manuscritos`, link: '/admin/kanban' },
        { label: 'Ingresos', value: formatCLP(totalIncome), icon: DollarSign, color: 'from-emerald-500 to-emerald-700', change: '+12% vs período ant.', up: true, link: '/admin/liquidaciones' },
        { label: 'Egresos', value: formatCLP(totalExpenses), icon: ArrowDownRight, color: 'from-red-500 to-red-700', change: 'Costos acumulados', link: '/admin/escandallo' },
        { label: 'Stock Físico', value: `${totalStock} uds.`, icon: Package, color: 'from-purple-500 to-purple-700', change: `${inventory.physical.filter(p => p.stock < p.minStock).length} bajo mín.`, link: '/admin/inventario' },
        { label: 'Alertas Activas', value: criticalAlerts, icon: AlertTriangle, color: 'from-orange-500 to-orange-700', change: 'Requieren atención', link: '/admin/alertas' },
    ]

    const kanbanStages = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-dark-600 text-sm mt-1">Resumen general de la editorial</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="stat-card slide-up cursor-pointer group"
                        style={{ animationDelay: `${i * 0.05}s` }}
                        onClick={() => navigate(stat.link)}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-dark-600 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                                <p className="text-xs text-dark-600 mt-1 flex items-center gap-1">
                                    {stat.up && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
                                    {stat.change}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-${stat.color.split(' ')[0].replace('from-', '')}/20`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-[10px] text-primary-300 font-medium">Ver sección</span>
                            <ArrowUpRight className="w-3 h-3 text-primary-300" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Books table + Pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent books */}
                <div className="lg:col-span-2 glass-card p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Libros Recientes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-dark-300">
                                    <th className="table-header text-left py-3 px-2">Título</th>
                                    <th className="table-header text-left py-3 px-2">Autor</th>
                                    <th className="table-header text-left py-3 px-2">Estado</th>
                                    <th className="table-header text-right py-3 px-2">PVP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map(book => (
                                    <tr key={book.id} className="table-row">
                                        <td className="py-3 px-2 text-sm font-medium text-white">{book.title}</td>
                                        <td className="py-3 px-2 text-sm text-dark-700">{book.authorName}</td>
                                        <td className="py-3 px-2"><span className={statusColors[book.status]}>{book.status}</span></td>
                                        <td className="py-3 px-2 text-sm text-right text-dark-800">{book.pvp ? formatCLP(book.pvp) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pipeline */}
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Pipeline de Producción</h2>
                    <div className="space-y-3">
                        {kanbanStages.map(stage => {
                            const count = books.filter(b => b.status === stage).length
                            const pct = totalBooks > 0 ? (count / totalBooks) * 100 : 0
                            return (
                                <div key={stage}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-dark-700">{stage}</span>
                                        <span className="text-white font-medium">{count}</span>
                                    </div>
                                    <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-primary-300 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent audit log */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Actividad Reciente</h2>
                <div className="space-y-3">
                    {data.auditLog.slice(0, 5).map(log => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-dark-50/50">
                            <div className="w-8 h-8 rounded-lg bg-dark-200 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0">
                                {log.userName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white">{log.action}</p>
                                <p className="text-xs text-dark-600 mt-0.5">{log.userName} · {new Date(log.date).toLocaleDateString('es-CL')}</p>
                            </div>
                            <span className={log.type === 'kanban' ? 'badge-blue' : 'badge-yellow'}>{log.type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
