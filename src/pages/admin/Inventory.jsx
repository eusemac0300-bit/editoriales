import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Package, Plus, Minus, Gift, TrendingDown, TrendingUp, FileText, Search } from 'lucide-react'

export default function Inventory() {
    const { data, updateInventory, formatCLP, addAuditLog } = useAuth()
    const [tab, setTab] = useState('fisico')
    const [addModal, setAddModal] = useState(null)
    const [search, setSearch] = useState('')

    const getBook = (id) => data.books.find(b => b.id === id)

    const addEntry = async (bookId, qty, type, note, revenue = 0) => {
        const entry = { date: new Date().toISOString().split('T')[0], qty: parseInt(qty), type, note, ...(revenue ? { revenue: parseInt(revenue) } : {}) }
        await updateInventory(bookId, (existing, bId) => {
            if (existing) {
                if (type === 'imprenta') {
                    return { ...existing, stock: existing.stock + parseInt(qty), entries: [...existing.entries, entry] }
                } else {
                    return { ...existing, stock: Math.max(0, existing.stock - parseInt(qty)), exits: [...existing.exits, entry] }
                }
            } else {
                return {
                    bookId: bId || bookId,
                    stock: parseInt(qty),
                    minStock: 100,
                    entries: type === 'imprenta' ? [entry] : [],
                    exits: type !== 'imprenta' ? [entry] : []
                }
            }
        })
        const book = getBook(bookId)
        addAuditLog(`Inventario: ${type === 'imprenta' ? 'Entrada' : 'Salida'} de ${qty} uds. de '${book?.title}' (${type})`, 'inventario')
        setAddModal(null)
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventario</h1>
                    <p className="text-dark-600 text-sm mt-1">Gestión de stock físico y digital</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTab('fisico')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'fisico' ? 'bg-primary text-white' : 'bg-dark-200 text-dark-700'}`}>
                        <Package className="w-4 h-4 inline mr-1.5" />Físico
                    </button>
                    <button onClick={() => setTab('digital')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'digital' ? 'bg-primary text-white' : 'bg-dark-200 text-dark-700'}`}>
                        <FileText className="w-4 h-4 inline mr-1.5" />Digital
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" placeholder="Buscar libro..." />
            </div>

            {tab === 'fisico' ? (
                <div className="space-y-4">
                    {data.inventory.physical.filter(p => {
                        const book = getBook(p.bookId)
                        return !search || book?.title.toLowerCase().includes(search.toLowerCase())
                    }).map(p => {
                        const book = getBook(p.bookId)
                        const isCritical = p.stock < p.minStock
                        return (
                            <div key={p.bookId} className="glass-card p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-white font-medium">{book?.title || p.bookId}</h3>
                                        <p className="text-xs text-dark-600">{book?.authorName} · {book?.isbn}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-center px-4 py-2 rounded-lg ${isCritical ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-50'}`}>
                                            <p className={`text-2xl font-bold ${isCritical ? 'text-red-400' : 'text-white'}`}>{p.stock}</p>
                                            <p className="text-[10px] text-dark-600 uppercase">Stock</p>
                                        </div>
                                        {isCritical && <span className="badge-red">⚠️ Crítico</span>}
                                        <div className="flex gap-1">
                                            <button onClick={() => setAddModal({ bookId: p.bookId, type: 'entrada' })} className="btn-primary text-xs px-3 py-2">
                                                <Plus className="w-3 h-3 inline mr-1" />Entrada
                                            </button>
                                            <button onClick={() => setAddModal({ bookId: p.bookId, type: 'salida' })} className="btn-secondary text-xs px-3 py-2">
                                                <Minus className="w-3 h-3 inline mr-1" />Salida
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Movement history */}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-medium text-dark-600 uppercase mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> Entradas</h4>
                                        {p.entries.slice(-3).map((e, i) => (
                                            <div key={i} className="flex justify-between py-1.5 text-xs border-b border-dark-300/30">
                                                <span className="text-dark-700">{e.note}</span>
                                                <span className="text-emerald-400 font-medium">+{e.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-medium text-dark-600 uppercase mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400" /> Salidas</h4>
                                        {p.exits.slice(-3).map((e, i) => (
                                            <div key={i} className="flex justify-between py-1.5 text-xs border-b border-dark-300/30">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-dark-700">{e.note}</span>
                                                    {e.type === 'cortesia' && <Gift className="w-3 h-3 text-amber-400" />}
                                                </div>
                                                <span className="text-red-400 font-medium">-{e.qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    {data.inventory.digital.map(d => {
                        const book = getBook(d.bookId)
                        const totalDigitalSales = d.sales.reduce((s, v) => s + v.revenue, 0)
                        return (
                            <div key={d.bookId} className="glass-card p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-white font-medium">{book?.title}</h3>
                                        <p className="text-xs text-dark-600">{book?.authorName}</p>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-400">{formatCLP(totalDigitalSales)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {d.versions.map((v, i) => (
                                        <div key={i} className="bg-dark-50 rounded-lg p-3">
                                            <span className="badge-blue mb-1">{v.format}</span>
                                            <p className="text-xs text-dark-600 mt-1">v{v.version} · {v.uploadDate}</p>
                                        </div>
                                    ))}
                                </div>
                                <h4 className="text-xs font-medium text-dark-600 uppercase mb-2">Ventas Digitales</h4>
                                <div className="space-y-1">
                                    {d.sales.map((s, i) => (
                                        <div key={i} className="flex justify-between py-1.5 text-xs border-b border-dark-300/30">
                                            <span className="text-dark-700">{s.platform} · {s.period}</span>
                                            <div className="flex gap-4">
                                                <span className="text-dark-600">{s.qty} uds.</span>
                                                <span className="text-emerald-400 font-medium">{formatCLP(s.revenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Modal */}
            {addModal && <AddMovementModal {...addModal} onClose={() => setAddModal(null)} onSubmit={addEntry} books={data.books} formatCLP={formatCLP} />}
        </div>
    )
}

function AddMovementModal({ bookId, type, onClose, onSubmit, books, formatCLP }) {
    const [qty, setQty] = useState('')
    const [moveType, setMoveType] = useState(type === 'entrada' ? 'imprenta' : 'venta')
    const [note, setNote] = useState('')
    const [revenue, setRevenue] = useState('')
    const book = books.find(b => b.id === bookId)

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card max-w-md w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-1">{type === 'entrada' ? 'Nueva Entrada' : 'Nueva Salida'}</h3>
                <p className="text-xs text-dark-600 mb-4">{book?.title}</p>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Cantidad</label>
                        <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="input-field" placeholder="0" min="1" />
                    </div>
                    {type === 'salida' && (
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Tipo</label>
                            <select value={moveType} onChange={e => setMoveType(e.target.value)} className="input-field">
                                <option value="venta">Venta</option>
                                <option value="cortesia">Cortesía / Prensa</option>
                                <option value="distribucion">Distribución</option>
                            </select>
                        </div>
                    )}
                    {moveType === 'venta' && type === 'salida' && (
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Ingreso (CLP)</label>
                            <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} className="input-field" placeholder="0" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Nota</label>
                        <input value={note} onChange={e => setNote(e.target.value)} className="input-field" placeholder="Descripción..." />
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                    <button onClick={() => onSubmit(bookId, qty, type === 'entrada' ? 'imprenta' : moveType, note, revenue)} className="btn-primary flex-1" disabled={!qty}>
                        {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                    </button>
                </div>
            </div>
        </div>
    )
}
