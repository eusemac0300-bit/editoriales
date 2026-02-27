import { useAuth } from '../../context/AuthContext'
import { History, DollarSign, Download, CheckCircle, Clock, BookOpen } from 'lucide-react'

export default function PaymentHistory() {
    const { user, data, formatCLP } = useAuth()
    const myRoyalties = data.finances.royalties.filter(r => r.authorId === user.id)
    const myBooks = data.books.filter(b => b.authorId === user.id)

    const totalPaid = myRoyalties.filter(r => r.status === 'aprobada').reduce((s, r) => s + Math.max(0, r.netRoyalty), 0)
    const totalPending = myRoyalties.filter(r => r.status === 'pendiente').reduce((s, r) => s + Math.max(0, r.netRoyalty), 0)

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <History className="w-6 h-6 text-purple-400" />Historial de Pagos
                </h1>
                <p className="text-dark-600 text-sm mt-1">Liquidaciones y regalías de tus obras</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="stat-card text-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <p className="text-lg font-bold text-emerald-400">{formatCLP(totalPaid)}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Pagado</p>
                </div>
                <div className="stat-card text-center">
                    <Clock className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                    <p className="text-lg font-bold text-amber-400">{formatCLP(totalPending)}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Pendiente</p>
                </div>
            </div>

            {/* Book-level breakdown */}
            {myBooks.filter(b => b.status === 'Publicado').map(book => {
                const bookRoyalties = myRoyalties.filter(r => r.bookId === book.id)
                const physInv = data.inventory.physical.find(p => p.bookId === book.id)
                const digInv = data.inventory.digital.find(d => d.bookId === book.id)
                const physRevenue = physInv ? physInv.exits.filter(e => e.type === 'venta').reduce((s, e) => s + (e.revenue || 0), 0) : 0
                const digRevenue = digInv ? digInv.sales.reduce((s, e) => s + e.revenue, 0) : 0
                const totalRevenue = physRevenue + digRevenue
                const grossRoyalty = Math.round(totalRevenue * (book.royaltyPercent / 100))
                const netRoyalty = grossRoyalty - book.advance

                return (
                    <div key={book.id} className="glass-card p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{book.title}</h3>
                                    <p className="text-xs text-dark-600">{book.royaltyPercent}% regalía</p>
                                </div>
                            </div>
                            <button className="btn-secondary text-xs px-3 py-1.5">
                                <Download className="w-3 h-3 inline mr-1" /> Borrador
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-dark-50 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-dark-600 uppercase">Ventas</p>
                                <p className="text-sm font-bold text-white">{formatCLP(totalRevenue)}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-dark-600 uppercase">Regalía Bruta</p>
                                <p className="text-sm font-bold text-primary-300">{formatCLP(grossRoyalty)}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-dark-600 uppercase">Anticipo</p>
                                <p className="text-sm font-bold text-amber-400">-{formatCLP(book.advance)}</p>
                            </div>
                            <div className={`rounded-lg p-2.5 text-center ${netRoyalty >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                <p className="text-[10px] text-dark-600 uppercase">Neto</p>
                                <p className={`text-sm font-bold ${netRoyalty >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(netRoyalty)}</p>
                            </div>
                        </div>

                        {/* Liquidation history */}
                        {bookRoyalties.length > 0 && (
                            <div className="mt-3 border-t border-dark-300/50 pt-3">
                                <p className="text-[10px] text-dark-600 uppercase mb-2">Liquidaciones</p>
                                {bookRoyalties.map(r => (
                                    <div key={r.id} className="flex items-center justify-between py-2 text-xs">
                                        <span className="text-dark-700">{r.period}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{formatCLP(r.netRoyalty)}</span>
                                            <span className={r.status === 'aprobada' ? 'badge-green' : 'badge-yellow'}>{r.status === 'aprobada' ? 'Pagada' : 'Pendiente'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}

            {myBooks.filter(b => b.status === 'Publicado').length === 0 && (
                <div className="glass-card p-8 text-center">
                    <DollarSign className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-600">Aún no tienes obras publicadas con liquidaciones disponibles</p>
                </div>
            )}
        </div>
    )
}
