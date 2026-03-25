import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { publishAppVersion } from '../../lib/supabaseService'
import { useState } from 'react'
import { Package, BookOpen, DollarSign, Users, TrendingUp, AlertTriangle, ArrowUpRight, Activity, Database, Trash2, Plus, CheckCircle2, Sparkles, FileText, Truck } from 'lucide-react'

export default function AdminDashboard() {
    const { data, formatCLP, t, user, loadDemo, clearDemo } = useAuth()
    const navigate = useNavigate()
    const [isPublishing, setIsPublishing] = useState(false)
    const { books, inventory, finances, alerts } = data

    const totalBooks = (books || []).length
    const hasDemoData = (books || []).some(b => b.id?.startsWith('ffffffff-'))
    const published = (books || []).filter(b => b.status === 'Publicado' || b.status === 'Published').length
    const inProduction = (books || []).filter(b => !['Publicado', 'Original', 'Published'].includes(b.status)).length

    // Ventas
    const currentMonth = new Date().toISOString().slice(0, 7)
    const activeSales = (finances?.sales || []).filter(s => s.status !== 'Anulada')
    const salesThisMonth = activeSales.filter(s => s.saleDate?.startsWith(currentMonth))
    const incomeThisMonth = salesThisMonth.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    // Best Seller Identification (Top of all time)
    const salesByBook = activeSales.reduce((acc, s) => {
        acc[s.bookId] = (acc[s.bookId] || 0) + (s.quantity || 0)
        return acc
    }, {})
    const sortedSales = Object.entries(salesByBook).sort((a, b) => b[1] - a[1])
    const bestSellerId = sortedSales[0]?.[0]
    const bestSellerBook = books.find(b => b.id === bestSellerId)
    const bestSellerCount = sortedSales[0]?.[1] || 0

    // Critical Stock Identification
    const physicalInv = inventory?.physical || []
    const criticalStockItem = [...physicalInv]
        .filter(i => i.stock >= 0)
        .sort((a, b) => a.stock - b.stock)[0]
    const criticalBook = books.find(b => b.id === criticalStockItem?.bookId)

    // Royalties
    const pendingRoyalties = (finances?.royalties || []).filter(r => r.status === 'pendiente' || r.status === 'pending')
    const royaltiesAmount = pendingRoyalties.reduce((sum, r) => sum + (r.netRoyalty || 0), 0)

    const totalStock = physicalInv.reduce((s, p) => s + (p.stock || 0), 0)
    const lowStockCount = physicalInv.filter(p => (p.minStock > 0 && p.stock <= p.minStock)).length
    const criticalAlerts = (alerts || []).filter(a => !a.read).length

    const stats = [
        { label: 'TOP VENTAS (Histórico)', value: bestSellerBook ? bestSellerBook.title : '—', icon: TrendingUp, color: 'from-yellow-400 to-yellow-600', change: `${bestSellerCount} unidades vendidas`, link: '/admin/libros', bestseller: true },
        { label: 'URGENTE: REIMPRESIÓN', value: criticalBook ? criticalBook.title : '—', icon: AlertTriangle, color: 'from-rose-500 to-rose-700', change: criticalBook ? `Quedan solo ${criticalStockItem.stock} uds.` : 'Sin quiebres', link: '/admin/inventario' },
        { label: t('sales_month'), value: formatCLP(incomeThisMonth), icon: DollarSign, color: 'from-emerald-500 to-emerald-700', change: `${salesThisMonth.length} ${t('sales').toLowerCase()}`, up: incomeThisMonth > 0, link: '/admin/ventas' },
        { label: t('published_books'), value: published, icon: BookOpen, color: 'from-primary to-primary-700', change: `${totalBooks} ${t('titles').toLowerCase()}`, link: '/admin/libros' },
        { label: t('physical_stock'), value: `${totalStock} uds.`, icon: Package, color: 'from-blue-500 to-blue-700', change: lowStockCount > 0 ? `⚠ ${lowStockCount} alertas de stock` : 'Todo ok', link: '/admin/inventario' },
        { label: 'REGALÍAS PENDIENTES', value: formatCLP(royaltiesAmount), icon: Users, color: 'from-purple-500 to-purple-700', change: `${pendingRoyalties.length} autores por liquidar`, link: '/admin/liquidaciones' },
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

                {/* Master Control Hub (Exclusive for master@editorial.cl, maestro, eusemac) */}
                {(user?.email?.toLowerCase().includes('master') || user?.email?.toLowerCase().includes('maestro') || user?.email?.toLowerCase().includes('eusemac')) && (
                    <div className="flex items-center gap-3 p-1 bg-primary/20 rounded-2xl border-2 border-primary shadow-xl shadow-primary/20 backdrop-blur-xl animate-in zoom-in-95 duration-500 scale-105 mr-4 mr-2">
                        <div className="px-4 py-2 border-r border-primary/20">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Centro de Control Maestro</p>
                            <p className="text-xs font-black text-slate-800 dark:text-white-100 flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                v3.1.5.12 LISTA PARA LIBERAR
                            </p>
                        </div>
                        <button
                            disabled={isPublishing}
                            onClick={async () => {
                                if (window.confirm('¿Publicar la v3.1.5.12 para todas las editoriales ahora? Esto notificará a todos tus clientes.')) {
                                    setIsPublishing(true)
                                    try {
                                        await publishAppVersion('v3.1.5.12', ['Universal Cache Breaker', 'Fuerza v12', 'Universal Hub'])
                                        alert('¡ÉXITO! Versión v3.1.5.12 liberada globalmente. Se ha notificado a todas las editoriales.')
                                    } catch (err) {
                                        console.error('Master Publish Error:', err);
                                        alert('Error al publicar. Intenta de nuevo.')
                                    } finally {
                                        setIsPublishing(false)
                                    }
                                }
                            }}
                            className={`bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-90 flex items-center gap-3 ${isPublishing ? 'opacity-50' : 'animate-pulse-slow'}`}
                        >
                            {isPublishing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {isPublishing ? 'PUBLICANDO...' : 'PUBLICAR CAMBIOS A RED'}
                        </button>
                    </div>
                )}
            </div>

            {/* Ciclo Editorial Control Hub - Added 'Empujón' */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-5 glass-card p-6 border-t-4 border-t-primary shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-dark-100 dark:to-dark-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Progreso del Ciclo Editorial
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Checklist de Salud Operativa</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-dark-700 uppercase tracking-widest">Sincronización Total</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Títulos y Depósito', done: totalBooks > 0, icon: BookOpen, desc: 'Catálogo base creado' },
                            { label: 'Contratos OK', done: (data.docs || []).some(d => d.category === 'Contrato'), icon: FileText, desc: 'Gestión documental activa' },
                            { label: 'Producción', done: published > 0, icon: Package, desc: 'Libros en mercado' },
                            { label: 'Distribución', done: (finances?.consignments || []).length > 0, icon: Truck, desc: 'Consignaciones activas' },
                            { label: 'Regalías', done: (finances?.royalties || []).length > 0, icon: DollarSign, desc: 'Cálculos automatizados' }
                        ].map((step, idx) => (
                            <div key={idx} className={`p-4 rounded-3xl border transition-all duration-500 ${step.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-100/50 dark:bg-dark-300/30 border-slate-200 dark:border-dark-400 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-dark-400 text-slate-400'}`}>
                                        <step.icon className="w-4 h-4" />
                                    </div>
                                    {step.done ? (
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-dark-500" />
                                    )}
                                </div>
                                <h3 className={`text-xs font-black uppercase tracking-tight ${step.done ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>{step.label}</h3>
                                <p className="text-[10px] text-slate-400 mt-1 font-bold">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Demo Data Banner (Visible when demo books exist) */}
            {(books || []).some(b => b.id?.startsWith('ffffffff-')) && (
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
                                await clearDemo()
                            }
                        }}
                        className="btn-primary bg-rose-500 hover:bg-rose-600 border-rose-600 shadow-lg shadow-rose-500/20 text-xs py-2 px-4 whitespace-nowrap flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar Ejemplos
                    </button>
                </div>
            )}

            {/* Empty State or No Demo Data CTA */}
            {!hasDemoData && (
                <div className={`glass-card p-12 text-center space-y-6 flex flex-col items-center justify-center border-dashed border-2 animate-in fade-in duration-1000 ${totalBooks === 0 ? 'bg-primary/5' : ''}`}>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary transition-transform hover:scale-110">
                        <Database className="w-10 h-10" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {totalBooks === 0 ? 'Tu catálogo está vacío' : '¿Quieres probar con datos de ejemplo?'}
                        </h2>
                        <p className="text-slate-500 dark:text-dark-600 mt-2">
                            {totalBooks === 0 
                                ? 'Comienza agregando tus libros o utiliza datos de ejemplo para explorar todas las funcionalidades de la plataforma.'
                                : 'Puedes cargar 10 libros y autores de prueba para ver cómo funcionan los reportes y las ventas sin afectar tu catálogo real.'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/admin/libros')}
                            className="btn-primary px-8 h-12 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> {totalBooks === 0 ? 'Agregar mi primer libro' : 'Ir a mis libros'}
                        </button>
                        <button 
                            onClick={async () => {
                                try {
                                    await loadDemo()
                                    alert('¡ÉXITO! Datos de ejemplo cargados correctamente.')
                                } catch (err) {
                                    alert(`ERROR DE CARGA: ${err.message || err.toString()}`)
                                }
                            }}
                            className="px-8 h-12 border border-slate-200 dark:border-dark-300 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-all font-bold text-slate-700 dark:text-dark-900 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Database className="w-5 h-5" /> {t('load_demo')}
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
                                            <th className="table-header text-left py-3 px-2">Stock</th>
                                            <th className="table-header text-left py-3 px-2">{t('status')}</th>
                                            <th className="table-header text-right py-3 px-2">PVP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {books.slice(0, 5).map(book => {
                                            const stock = inventory?.physical?.find(i => i.bookId === book.id)?.stock ?? 0
                                            const isBest = book.id === bestSellerId
                                            return (
                                                <tr key={book.id} className="table-row">
                                                    <td className="py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white-200">
                                                        <div className="flex items-center gap-2">
                                                            {book.title}
                                                            {isBest && <TrendingUp className="w-3 h-3 text-yellow-500" title="Best Seller" />}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-sm">
                                                        <span className={`font-mono font-bold ${stock === 0 ? 'text-rose-500 animate-pulse' : stock <= 5 ? 'text-amber-500' : 'text-slate-600 dark:text-dark-700'}`}>
                                                            {stock} uds.
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2"><span className={statusColors[book.status] || 'badge-blue'}>{book.status}</span></td>
                                                    <td className="py-3 px-2 text-sm text-right text-slate-700 dark:text-dark-800 font-medium">{book.pvp ? formatCLP(book.pvp) : '—'}</td>
                                                </tr>
                                            )
                                        })}
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
                                    <p className="text-xs text-slate-500 dark:text-dark-600 mt-1">
                                        {log.userName || 'Usuario'} · {log.date ? new Date(log.date).toLocaleDateString() : '-'}
                                    </p>
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
