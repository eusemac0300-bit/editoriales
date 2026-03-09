import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Package, Plus, Minus, Gift, TrendingDown, TrendingUp,
    FileText, Search, BookOpen, AlertTriangle, X, Save
} from 'lucide-react'

export default function Inventory() {
    const { data, updateInventory, formatCLP, addAuditLog } = useAuth()
    const [tab, setTab] = useState('fisico')
    const [addModal, setAddModal] = useState(null)
    const [addTitleModal, setAddTitleModal] = useState(false)
    const [search, setSearch] = useState('')

    const getBook = (id) => data.books.find(b => b.id === id)

    // Libros publicados que aún NO están en inventario físico
    const publishedBooks = data.books.filter(b => b.status === 'Publicado')

    // Construir la vista combinada: inventario existente + publicados sin entrada
    const inventoryEntries = (() => {
        const inInventory = new Set(data.inventory.physical.map(p => p.bookId))
        // Libros publicados pero sin registro en inventario → aparecen con stock 0
        const missing = publishedBooks
            .filter(b => !inInventory.has(b.id))
            .map(b => ({
                bookId: b.id,
                stock: 0,
                minStock: 100,
                entries: [],
                exits: [],
                _virtual: true // flag para saber que aún no existe en DB
            }))
        return [...data.inventory.physical, ...missing]
    })()

    const addEntry = async (bookId, qty, type, note, revenue = 0) => {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            qty: parseInt(qty),
            type,
            note,
            ...(revenue ? { revenue: parseInt(revenue) } : {})
        }
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

    // Registrar un título ya impreso manualmente con stock inicial
    const handleAddExistingTitle = async ({ bookId, stock, note }) => {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            qty: parseInt(stock),
            type: 'ingreso_manual',
            note: note || 'Stock inicial — libro ya impreso'
        }
        await updateInventory(bookId, (existing, bId) => {
            if (existing) {
                return { ...existing, stock: existing.stock + parseInt(stock), entries: [...existing.entries, entry] }
            }
            return {
                bookId: bId || bookId,
                stock: parseInt(stock),
                minStock: 100,
                entries: [entry],
                exits: []
            }
        })
        const book = getBook(bookId)
        addAuditLog(`Inventario: Añadidos ${stock} ejemplares de libro publicado (${note || 'Ingreso manual'}) — '${book?.title}'`, 'inventario')
        setAddTitleModal(false)
    }

    const filteredEntries = inventoryEntries.filter(p => {
        const book = getBook(p.bookId)
        return !search || book?.title.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventario</h1>
                    <p className="text-dark-600 text-sm mt-1">
                        Gestión de stock físico y digital ·{' '}
                        <span className="text-primary font-medium">{publishedBooks.length} títulos publicados</span>
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Botón: agregar título ya impreso */}
                    <button
                        onClick={() => setAddTitleModal(true)}
                        className="btn-secondary flex items-center gap-2 h-10 px-4 text-sm border border-primary/30 text-primary hover:bg-primary/10"
                    >
                        <BookOpen className="w-4 h-4" />
                        Agregar Título
                    </button>
                    {/* Botón: registrar entrada/salida de stock */}
                    <button
                        onClick={() => setAddModal({ type: 'entrada' })}
                        className="btn-primary flex items-center gap-2 h-10 px-4 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Registrar Stock
                    </button>
                    <button
                        onClick={() => setTab('fisico')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'fisico' ? 'bg-primary text-white' : 'bg-dark-200 text-dark-700'}`}
                    >
                        <Package className="w-4 h-4 inline mr-1.5" />Físico
                    </button>
                    <button
                        onClick={() => setTab('digital')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'digital' ? 'bg-primary text-white' : 'bg-dark-200 text-dark-700'}`}
                    >
                        <FileText className="w-4 h-4 inline mr-1.5" />Digital
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Buscar título..."
                />
            </div>

            {/* Banner informativo si hay libros sin stock */}
            {tab === 'fisico' && (() => {
                const sinStock = inventoryEntries.filter(p => p.stock === 0 && getBook(p.bookId)?.status === 'Publicado')
                if (sinStock.length === 0) return null
                return (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-300">
                            <strong>{sinStock.length} título(s) publicado(s)</strong> aún no tienen stock registrado.
                            Usa <strong>"Registrar Stock"</strong> para añadir ejemplares impresos,
                            o <strong>"Agregar Título"</strong> si el libro ya estaba impreso antes de ser ingresado al sistema.
                        </p>
                    </div>
                )
            })()}

            {/* TAB: Físico */}
            {tab === 'fisico' ? (
                <div className="space-y-4">
                    {filteredEntries.length === 0 && (
                        <div className="glass-card p-8 text-center text-dark-600">
                            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No hay títulos publicados en inventario aún.</p>
                        </div>
                    )}
                    {filteredEntries.map(p => {
                        const book = getBook(p.bookId)
                        const isCritical = p.stock < p.minStock
                        const isVirtual = p._virtual || p.stock === 0

                        return (
                            <div
                                key={p.bookId}
                                className={`glass-card p-5 transition-all ${isVirtual ? 'border border-amber-500/20 bg-amber-500/5' : ''}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-white font-medium">{book?.title || p.bookId}</h3>
                                            {isVirtual && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium uppercase tracking-wide">
                                                    Sin stock
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-dark-600 mt-0.5">{book?.authorName} · {book?.isbn}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`text-center px-4 py-2 rounded-lg ${isCritical ? 'bg-red-500/10 border border-red-500/20' : isVirtual ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-dark-50'}`}>
                                            <p className={`text-2xl font-bold ${isCritical ? 'text-red-400' : isVirtual ? 'text-amber-400' : 'text-white'}`}>
                                                {p.stock}
                                            </p>
                                            <p className="text-[10px] text-dark-600 uppercase">Stock</p>
                                        </div>
                                        {isCritical && !isVirtual && (
                                            <span className="badge-red">⚠️ Crítico</span>
                                        )}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setAddModal({ bookId: p.bookId, type: 'entrada' })}
                                                className="btn-primary text-xs px-3 py-2"
                                            >
                                                <Plus className="w-3 h-3 inline mr-1" />Entrada
                                            </button>
                                            {!isVirtual && (
                                                <button
                                                    onClick={() => setAddModal({ bookId: p.bookId, type: 'salida' })}
                                                    className="btn-secondary text-xs px-3 py-2"
                                                >
                                                    <Minus className="w-3 h-3 inline mr-1" />Salida
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Historial de movimientos */}
                                {!isVirtual && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-medium text-dark-600 uppercase mb-2 flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-emerald-400" /> Entradas
                                            </h4>
                                            {p.entries.length === 0 ? (
                                                <p className="text-xs text-dark-500 italic">Sin entradas registradas</p>
                                            ) : (
                                                p.entries.slice(-3).map((e, i) => (
                                                    <div key={i} className="flex justify-between py-1.5 text-xs border-b border-dark-300/30">
                                                        <span className="text-dark-700">{e.note || e.type}</span>
                                                        <span className="text-emerald-400 font-medium">+{e.qty}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-medium text-dark-600 uppercase mb-2 flex items-center gap-1">
                                                <TrendingDown className="w-3 h-3 text-red-400" /> Salidas
                                            </h4>
                                            {p.exits.length === 0 ? (
                                                <p className="text-xs text-dark-500 italic">Sin salidas registradas</p>
                                            ) : (
                                                p.exits.slice(-3).map((e, i) => (
                                                    <div key={i} className="flex justify-between py-1.5 text-xs border-b border-dark-300/30">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-dark-700">{e.note || e.type}</span>
                                                            {e.type === 'cortesia' && <Gift className="w-3 h-3 text-amber-400" />}
                                                        </div>
                                                        <span className="text-red-400 font-medium">-{e.qty}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Mensaje cuando tiene stock 0 */}
                                {isVirtual && (
                                    <p className="text-xs text-dark-500 mt-3">
                                        Este título está publicado pero aún no tiene ejemplares registrados.
                                        Haz clic en <strong className="text-amber-400">Entrada</strong> para registrar el primer tiraje.
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* TAB: Digital */
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
                    {data.inventory.digital.length === 0 && (
                        <div className="glass-card p-8 text-center text-dark-600">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No hay inventario digital registrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Entrada / Salida de stock estándar */}
            {addModal && (
                <AddMovementModal
                    {...addModal}
                    onClose={() => setAddModal(null)}
                    onSubmit={addEntry}
                    books={data.books}
                    formatCLP={formatCLP}
                />
            )}

            {/* Modal: Agregar título ya impreso manualmente */}
            {addTitleModal && (
                <AddExistingTitleModal
                    books={data.books}
                    inventoryPhysical={data.inventory.physical}
                    onClose={() => setAddTitleModal(false)}
                    onSubmit={handleAddExistingTitle}
                />
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────
   Modal: Registrar entrada / salida de stock
───────────────────────────────────────────── */
function AddMovementModal({ bookId, type, onClose, onSubmit, books, formatCLP }) {
    const [selectedBook, setSelectedBook] = useState(bookId || '')
    const [qty, setQty] = useState('')
    const [moveType, setMoveType] = useState(type === 'entrada' ? 'imprenta' : 'venta')
    const [note, setNote] = useState('')
    const [revenue, setRevenue] = useState('')
    const book = books.find(b => b.id === selectedBook)

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card max-w-md w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        {type === 'entrada' ? 'Nueva Entrada de Stock' : 'Registrar Salida'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-dark-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {bookId ? (
                    <p className="text-xs text-dark-600 mb-4 bg-dark-100 px-3 py-2 rounded-lg">{book?.title}</p>
                ) : (
                    <div className="mb-4">
                        <label className="text-xs text-dark-600 mb-1 block">Título</label>
                        <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} className="input-field">
                            <option value="">Seleccione un título...</option>
                            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Cantidad de ejemplares</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            className="input-field"
                            placeholder="0"
                            min="1"
                        />
                    </div>
                    {type === 'salida' && (
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Tipo de salida</label>
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
                            <input
                                type="number"
                                value={revenue}
                                onChange={e => setRevenue(e.target.value)}
                                className="input-field"
                                placeholder="0"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Nota / Referencia</label>
                        <input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="input-field"
                            placeholder="Ej: Tiraje N°2 — Imprenta XYZ"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                    <button
                        onClick={() => onSubmit(selectedBook, qty, type === 'entrada' ? 'imprenta' : moveType, note, revenue)}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        disabled={!qty || !selectedBook}
                    >
                        <Save className="w-4 h-4" />
                        {type === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Modal: Agregar título ya impreso al inventario
───────────────────────────────────────────── */
function AddExistingTitleModal({ books, inventoryPhysical, onClose, onSubmit }) {
    // Mostrar todos los libros publicados y también todos (para libros externos/antes del sistema)
    const [selectedBook, setSelectedBook] = useState('')
    const [stock, setStock] = useState('')
    const [note, setNote] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = () => {
        if (!selectedBook) { setError('Debes seleccionar un título.'); return }
        if (!stock || parseInt(stock) <= 0) { setError('Ingresa una cantidad válida.'); return }
        onSubmit({ bookId: selectedBook, stock, note })
    }

    const existingBookIds = new Set(inventoryPhysical.map(p => p.bookId))

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card max-w-md w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Agregar Título al Inventario
                    </h3>
                    <button onClick={onClose} className="p-1 text-dark-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-dark-600 mb-5">
                    Usa esto para títulos ya impresos que solo necesitan mantención y distribución,
                    o libros que aún no tienen stock registrado en el sistema.
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Título del Libro *</label>
                        <select
                            value={selectedBook}
                            onChange={e => { setSelectedBook(e.target.value); setError('') }}
                            className="input-field"
                        >
                            <option value="">Seleccione un título...</option>
                            <optgroup label="📗 Publicados">
                                {books.filter(b => b.status === 'Publicado').map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.title}{existingBookIds.has(b.id) ? ' (ya en inventario)' : ''}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="📘 Otros títulos">
                                {books.filter(b => b.status !== 'Publicado').map(b => (
                                    <option key={b.id} value={b.id}>{b.title} [{b.status}]</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Stock Inicial (ejemplares físicos) *</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={e => { setStock(e.target.value); setError('') }}
                            className="input-field"
                            placeholder="Ej: 500"
                            min="1"
                        />
                        <p className="text-[10px] text-dark-500 mt-1">
                            Cantidad de ejemplares impresos disponibles actualmente para distribución.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Nota de Referencia</label>
                        <input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="input-field"
                            placeholder="Ej: 1ª edición 2023 — Imprenta Los Andes"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Agregar al Inventario
                    </button>
                </div>
            </div>
        </div>
    )
}
