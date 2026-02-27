import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { DollarSign, Download, CheckCircle, Clock, User } from 'lucide-react'

export default function Royalties() {
    const { data, setData, formatCLP, addAuditLog } = useAuth()
    const [selectedAuthor, setSelectedAuthor] = useState('all')

    const authors = data.users.filter(u => u.role === 'AUTOR')
    const royalties = selectedAuthor === 'all' ? data.finances.royalties : data.finances.royalties.filter(r => r.authorId === selectedAuthor)

    const approveRoyalty = (id) => {
        setData(prev => ({
            ...prev,
            finances: { ...prev.finances, royalties: prev.finances.royalties.map(r => r.id === id ? { ...r, status: 'aprobada' } : r) }
        }))
        const r = data.finances.royalties.find(r2 => r2.id === id)
        const author = data.users.find(u => u.id === r?.authorId)
        addAuditLog(`Aprobó liquidación ${formatCLP(r?.netRoyalty || 0)} para ${author?.name}`, 'finanzas')
    }

    const approveAll = () => {
        const pending = royalties.filter(r => r.status === 'pendiente')
        pending.forEach(r => approveRoyalty(r.id))
    }

    // Calculate simulated royalties for books with sales
    const getBookRoyalties = () => {
        const result = []
        data.books.filter(b => b.status === 'Publicado').forEach(book => {
            const physicalInv = data.inventory.physical.find(p => p.bookId === book.id)
            const digitalInv = data.inventory.digital.find(d => d.bookId === book.id)
            const physicalSales = physicalInv ? physicalInv.exits.filter(e => e.type === 'venta').reduce((s, e) => s + (e.revenue || 0), 0) : 0
            const digitalSales = digitalInv ? digitalInv.sales.reduce((s, e) => s + e.revenue, 0) : 0
            const totalSales = physicalSales + digitalSales
            const gross = Math.round(totalSales * (book.royaltyPercent / 100))
            const net = gross - book.advance
            result.push({ book, totalSales, gross, net, advance: book.advance })
        })
        return result
    }

    const bookRoyalties = getBookRoyalties()

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-primary" />Liquidaciones
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">Cálculo: (Ventas × % Regalía) − Anticipo</p>
                </div>
                <div className="flex gap-2">
                    <select value={selectedAuthor} onChange={e => setSelectedAuthor(e.target.value)} className="input-field w-auto text-sm">
                        <option value="all">Todos los autores</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button onClick={approveAll} className="btn-primary text-sm" disabled={royalties.filter(r => r.status === 'pendiente').length === 0}>
                        <CheckCircle className="w-4 h-4 inline mr-1" /> Aprobar Todas
                    </button>
                </div>
            </div>

            {/* Royalty formula cards */}
            <div className="space-y-4">
                {bookRoyalties.map(({ book, totalSales, gross, net, advance }) => (
                    <div key={book.id} className="glass-card p-5">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div>
                                <h3 className="text-white font-medium">{book.title}</h3>
                                <p className="text-xs text-dark-600 flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3" /> {book.authorName} · {book.royaltyPercent}% regalía
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn-secondary text-xs px-3 py-1.5"><Download className="w-3 h-3 inline mr-1" /> Borrador</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                            <div className="bg-dark-50 rounded-lg p-3">
                                <p className="text-[10px] text-dark-600 uppercase">Total Ventas</p>
                                <p className="text-lg font-bold text-white">{formatCLP(totalSales)}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-3">
                                <p className="text-[10px] text-dark-600 uppercase">Regalía Bruta ({book.royaltyPercent}%)</p>
                                <p className="text-lg font-bold text-primary-300">{formatCLP(gross)}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-3">
                                <p className="text-[10px] text-dark-600 uppercase">Anticipo Descontado</p>
                                <p className="text-lg font-bold text-amber-400">-{formatCLP(advance)}</p>
                            </div>
                            <div className={`rounded-lg p-3 ${net >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                <p className="text-[10px] text-dark-600 uppercase">Regalía Neta</p>
                                <p className={`text-lg font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(net)}</p>
                            </div>
                        </div>

                        {/* Formula */}
                        <div className="mt-3 p-2 bg-dark-50 rounded-lg">
                            <p className="text-[10px] text-dark-500 font-mono text-center">
                                ({formatCLP(totalSales)} × {book.royaltyPercent}%) − {formatCLP(advance)} = <span className={net >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatCLP(net)}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Approvals */}
            {royalties.length > 0 && (
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Liquidaciones Registradas</h2>
                    {royalties.map(r => {
                        const author = data.users.find(u => u.id === r.authorId)
                        const book = data.books.find(b => b.id === r.bookId)
                        return (
                            <div key={r.id} className="flex items-center justify-between py-3 border-b border-dark-300/50 last:border-0">
                                <div>
                                    <p className="text-sm text-white font-medium">{author?.name} — {book?.title}</p>
                                    <p className="text-xs text-dark-600">{r.period} · {r.totalSales} uds. vendidas</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-bold ${r.netRoyalty >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(r.netRoyalty)}</span>
                                    {r.status === 'pendiente' ? (
                                        <button onClick={() => approveRoyalty(r.id)} className="btn-primary text-xs px-3 py-1.5"><CheckCircle className="w-3 h-3 inline mr-1" /> Aprobar</button>
                                    ) : (
                                        <span className="badge-green"><CheckCircle className="w-3 h-3 inline mr-1" /> Aprobada</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
