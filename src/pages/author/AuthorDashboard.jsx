import { useAuth } from '../../context/AuthContext'
import { BookOpen, TrendingUp, DollarSign, Clock, BarChart3 } from 'lucide-react'

export default function AuthorDashboard() {
    const { user, data, formatCLP } = useAuth()

    const myBooks = data.books.filter(b => b.authorId === user.id)
    const myBookIds = myBooks.map(b => b.id)

    // Ventas reales
    const mySales = (data.finances?.sales || []).filter(s => s.status !== 'Anulada' && myBookIds.includes(s.bookId))
    const totalSalesUnits = mySales.reduce((acc, sale) => acc + (sale.quantity || 0), 0)

    // Liquidaciones
    const myRoyalties = (data.finances?.royalties || []).filter(r => r.authorId === user.id)
    const totalRoyalties = myRoyalties.filter(r => r.status === 'pagada').reduce((s, r) => s + (r.netRoyalty || 0), 0)

    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green',
        'pendiente': 'badge-yellow', 'aprobada': 'text-primary-300 bg-primary/10 border border-primary/20', 'pagada': 'badge-green'
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Hola, {user.name.split(' ')[0]} 👋</h1>
                <p className="text-dark-600 text-sm mt-1">Bienvenida a tu portal de autora</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="stat-card text-center">
                    <BookOpen className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{myBooks.length}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Mis Obras</p>
                </div>
                <div className="stat-card text-center">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{totalSalesUnits}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Ejemplares Vendidos</p>
                </div>
                <div className="stat-card text-center">
                    <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-emerald-400">{formatCLP(totalRoyalties)}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Regalías Pagadas</p>
                </div>
                <div className="stat-card text-center">
                    <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{myBooks.filter(b => b.status !== 'Publicado').length}</p>
                    <p className="text-[10px] text-dark-600 uppercase">En Proceso</p>
                </div>
            </div>

            {/* My books */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Mis Obras</h2>
                <div className="space-y-3">
                    {myBooks.map(book => (
                        <div key={book.id} className="flex items-center gap-4 p-3 rounded-lg bg-dark-50/50 hover:bg-dark-200/30 transition-colors">
                            <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white">{book.title}</h4>
                                <p className="text-xs text-dark-600">{book.genre} · {book.isbn || 'Sin ISBN'}</p>
                                {/* Progress */}
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado'].map((stage, i, arr) => {
                                            const currentIdx = arr.indexOf(book.status)
                                            return (
                                                <div key={stage} className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? 'bg-primary' : 'bg-dark-300'}`} />
                                            )
                                        })}
                                    </div>
                                    <p className="text-[10px] text-dark-500 mt-1">Etapa actual: {book.status}</p>
                                </div>
                            </div>
                            <span className={statusColors[book.status]}>{book.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Liquidaciones */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Mis Liquidaciones</h2>
                {myRoyalties.length === 0 ? (
                    <div className="text-center py-6">
                        <BarChart3 className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                        <p className="text-sm text-dark-500">Aún no hay liquidaciones registradas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myRoyalties.map(r => {
                            const book = myBooks.find(b => b.id === r.bookId)
                            return (
                                <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 rounded-lg bg-dark-50/50 hover:bg-dark-200/30 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[r.status] || 'badge-blue'}`}>
                                                {r.status.toUpperCase()}
                                            </span>
                                            <p className="text-sm text-white font-medium">{book?.title || 'Libro desconocido'}</p>
                                        </div>
                                        <p className="text-xs text-dark-500">
                                            Período: {r.period} · {r.totalUnitsSold} uds. vendidas ({r.royaltyPercent}% regalía)
                                        </p>
                                        {r.notes && <p className="text-[10px] text-dark-600 mt-1 italic">{r.notes}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold font-mono ${(r.netRoyalty || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatCLP(r.netRoyalty || 0)}
                                        </p>
                                        <p className="text-[10px] text-dark-600 uppercase">Líquido a recibir</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
