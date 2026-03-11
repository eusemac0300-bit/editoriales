import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Package, BookOpen, DollarSign, Users, TrendingUp, AlertTriangle, ArrowUpRight, Activity, Database, Trash2, Plus } from 'lucide-react'

export default function AdminDashboard() {
    const { data, formatCLP, t } = useAuth()
    const navigate = useNavigate()
    const { books, inventory, finances, alerts } = data

    const totalBooks = (books || []).length
    const published = (books || []).filter(b => b.status === 'Publicado' || b.status === 'Published').length
    const inProduction = (books || []).filter(b => !['Publicado', 'Original', 'Published'].includes(b.status)).length

    // Ventas
    const currentMonth = new Date().toISOString().slice(0, 7)
    const activeSales = (finances?.sales || []).filter(s => s.status !== 'Anulada')
    const salesThisMonth = activeSales.filter(s => s.saleDate?.startsWith(currentMonth))
    const incomeThisMonth = salesThisMonth.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    // Royalties
    const pendingRoyalties = (finances?.royalties || []).filter(r => r.status === 'pendiente' || r.status === 'pending')
    const royaltiesAmount = pendingRoyalties.reduce((sum, r) => sum + (r.netRoyalty || 0), 0)

    const totalStock = (inventory?.physical || []).reduce((s, p) => s + (p.stock || 0), 0)
    const lowStockCount = (inventory?.physical || []).filter(p => (p.minStock > 0 && p.stock <= p.minStock)).length
    const criticalAlerts = (alerts || []).filter(a => !a.read).length

    const stats = [
        { label: t('published_books'), value: published, icon: BookOpen, color: 'from-primary to-primary-700', change: `${totalBooks} ${t('titles').toLowerCase()}`, link: '/admin/libros' },
        { label: t('in_production'), value: inProduction, icon: TrendingUp, color: 'from-amber-500 to-amber-700', change: t('production_pipeline'), link: '/admin/kanban' },
        { label: t('sales_month'), value: formatCLP(incomeThisMonth), icon: DollarSign, color: 'from-emerald-500 to-emerald-700', change: `${salesThisMonth.length} ${t('sales').toLowerCase()}`, up: incomeThisMonth > 0, link: '/admin/ventas' },
        { label: t('pending_royalties'), value: formatCLP(royaltiesAmount), icon: Users, color: 'from-purple-500 to-purple-700', change: `${pendingRoyalties.length} ${t('pending').toLowerCase()}`, link: '/admin/liquidaciones' },
        { label: t('physical_stock'), value: `${totalStock} uds.`, icon: Package, color: 'from-blue-500 to-blue-700', change: lowStockCount > 0 ? `⚠ ${lowStockCount} ${t('alerts').toLowerCase()}` : t('active'), link: '/admin/inventario' },
        { label: t('active_alerts'), value: criticalAlerts, icon: AlertTriangle, color: 'from-orange-500 to-orange-700', change: criticalAlerts > 0 ? t('pending') : t('no_data'), link: '/admin/alertas' },
    ]

    const kanbanStages = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green',
        'Published': 'badge-green', 'Pending': 'badge-yellow'
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('dashboard')}</h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">{t('welcome')}, {useAuth().user?.name}</p>
                </div>
            </div>

            {/* Demo Data Banner (Visible when demo books exist) */}
            {(books || []).some(b => b.id.startsWith('demo_')) && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                            <Database className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Estás usando datos de ejemplo</h3>
                            <p className="text-xs text-slate-500 dark:text-dark-600">Explora las funcionalidades con estos libros y registros ficticios. Puedes eliminarlos en cualquier momento.</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (window.confirm('¿Borrar todos los libros de ejemplo? Esto no afectará a tus libros reales.')) {
                                await useAuth().clearDemo()
                            }
                        }}
                        className="btn-primary bg-rose-500 hover:bg-rose-600 border-rose-600 shadow-lg shadow-rose-500/20 text-xs py-2 px-4 whitespace-nowrap flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar Ejemplos
                    </button>
                </div>
            )}

            {/* Empty State CTA (Visible when no books exist) */}
            {totalBooks === 0 && (
                <div className="glass-card p-12 text-center space-y-6 flex flex-col items-center justify-center border-dashed border-2 fade-in">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary transition-transform hover:scale-110">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tu catálogo está vacío</h2>
                        <p className="text-slate-500 dark:text-dark-600 mt-2">Comienza agregando tus libros o utiliza datos de ejemplo para explorar todas las funcionalidades de la plataforma.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/admin/libros')}
                            className="btn-primary px-8 h-12 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Agregar mi primer libro
                        </button>
                        <button 
                            onClick={async () => {
                                await useAuth().loadDemo()
                            }}
                            className="px-8 h-12 border border-slate-200 dark:border-dark-300 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-all font-bold text-slate-700 dark:text-dark-900 flex items-center justify-center gap-2"
                        >
                            <Database className="w-5 h-5" /> Cargar Ejemplos
                        </button>
                    </div>
                </div>
            )}

            {/* Stats grid (Only if there's data) */}
            {totalBooks > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="glass-card p-5 slide-up cursor-pointer group"
                                style={{ animationDelay: `${i * 0.05}s` }}
                                onClick={() => navigate(stat.link)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-dark-600 uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
                                        <p className="text-xs text-slate-400 dark:text-dark-600 mt-1 flex items-center gap-1">
                                            {stat.up && <ArrowUpRight className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                                            {stat.change}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110`}>
                                        <stat.icon className="w-5 h-5 text-slate-900 dark:text-white" />
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-[10px] text-primary-600 dark:text-primary-300 font-bold uppercase">{stat.view_section || t('view_section')}</span>
                                    <ArrowUpRight className="w-3 h-3 text-primary-600 dark:text-primary-300" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 glass-card p-5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">{t('recent_books')}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-dark-300">
                                            <th className="table-header text-left py-3 px-2">{t('titles')}</th>
                                            <th className="table-header text-left py-3 px-2">{t('authors')}</th>
                                            <th className="table-header text-left py-3 px-2">{t('status')}</th>
                                            <th className="table-header text-right py-3 px-2">PVP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.slice(0, 5).map(book => (
                                            <tr key={book.id} className="table-row">
                                                <td className="py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">{book.title}</td>
                                                <td className="py-3 px-2 text-sm text-slate-600 dark:text-dark-700">{book.authorName}</td>
                                                <td className="py-3 px-2"><span className={statusColors[book.status] || 'badge-blue'}>{book.status}</span></td>
                                                <td className="py-3 px-2 text-sm text-right text-slate-700 dark:text-dark-800 font-medium">{book.pvp ? formatCLP(book.pvp) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="glass-card p-5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">{t('production_pipeline')}</h2>
                            <div className="space-y-4">
                                {kanbanStages.map(stage => {
                                    const count = books.filter(b => b.status === stage).length
                                    const pct = totalBooks > 0 ? (count / totalBooks) * 100 : 0
                                    return (count > 0 || ['Edición', 'Imprenta'].includes(stage)) && (
                                        <div key={stage}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-slate-600 dark:text-dark-700 font-medium">{stage}</span>
                                                <span className="text-slate-900 dark:text-white font-bold">{count}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Recent activity (Audit Log) */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">{t('recent_activity')}</h2>
                {(data.auditLog || []).length === 0 ? (
                    <div className="text-center py-8">
                        <Activity className="w-8 h-8 text-slate-300 dark:text-dark-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-dark-600 font-medium">{t('no_data')}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.auditLog.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-50 dark:bg-dark-200 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-200 dark:border-dark-300">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary dark:text-primary-300 shrink-0 border border-primary/20">
                                    {(log.userName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900 dark:text-white font-medium">{log.action}</p>
                                    <p className="text-xs text-slate-500 dark:text-dark-600 mt-1">{log.userName} · {new Date(log.date).toLocaleDateString()}</p>
                                </div>
                                <span className={log.type === 'kanban' ? 'badge-blue' : log.type === 'finanzas' ? 'badge-green' : 'badge-yellow'}>{log.type}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
