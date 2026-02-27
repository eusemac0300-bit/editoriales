import { useAuth } from '../../context/AuthContext'
import { BookOpen, TrendingUp, DollarSign, Clock, BarChart3 } from 'lucide-react'

export default function AuthorDashboard() {
    const { user, data, formatCLP } = useAuth()

    const myBooks = data.books.filter(b => b.authorId === user.id)
    const myRoyalties = data.finances.royalties.filter(r => r.authorId === user.id)
    const totalRoyalties = myRoyalties.reduce((s, r) => s + Math.max(0, r.netRoyalty), 0)

    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
    }

    // Simulate sales data
    const totalSales = myBooks.reduce((s, b) => {
        const physInv = data.inventory.physical.find(p => p.bookId === b.id)
        const digInv = data.inventory.digital.find(d => d.bookId === b.id)
        const physSales = physInv ? physInv.exits.filter(e => e.type === 'venta').reduce((acc, e) => acc + e.qty, 0) : 0
        const digSales = digInv ? digInv.sales.reduce((acc, e) => acc + e.qty, 0) : 0
        return s + physSales + digSales
    }, 0)

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
                    <p className="text-2xl font-bold text-white">{totalSales}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Ventas Totales</p>
                </div>
                <div className="stat-card text-center">
                    <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-emerald-400">{formatCLP(totalRoyalties)}</p>
                    <p className="text-[10px] text-dark-600 uppercase">Regalías</p>
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
        </div>
    )
}
