import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Package, Plus, Minus, Gift, TrendingDown, TrendingUp,
    FileText, Search, BookOpen, AlertTriangle, X, Save,
    ChevronDown, ChevronRight, Clock, Truck, Store
} from 'lucide-react'
import React from 'react'

export default function Inventory() {
    const { data, updateInventory, formatCLP, addAuditLog } = useAuth()
    const [tab, setTab] = useState('fisico')
    const [addModal, setAddModal] = useState(null)
    const [addTitleModal, setAddTitleModal] = useState(false)
    const [search, setSearch] = useState('')
    const [expandedBookId, setExpandedBookId] = useState(null)

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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Inventario</h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'fisico' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-dark-200 text-slate-600 dark:text-dark-700'}`}
                    >
                        <Package className="w-4 h-4 inline mr-1.5" />Físico
                    </button>
                    <button
                        onClick={() => setTab('digital')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'digital' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-dark-200 text-slate-600 dark:text-dark-700'}`}
                    >
                        <FileText className="w-4 h-4 inline mr-1.5" />Digital
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-600" />
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
                            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-dark-300 opacity-50" />
                            <p className="text-sm text-slate-500 dark:text-dark-600">No hay títulos publicados en inventario aún.</p>
                        </div>
                    )}
                    {filteredEntries.map(p => {
                        const book = getBook(p.bookId)
                        const isCritical = p.stock < p.minStock
                        const isVirtual = p._virtual || p.stock === 0
                        const isExpanded = expandedBookId === p.bookId

                        // Get related data for history
                        const relatedConsignments = (data.finances?.consignments || []).filter(c => c.bookId === p.bookId)
                        const relatedSales = (data.finances?.sales || []).filter(s => s.bookId === p.bookId)
                        const relatedEvents = (data.events || []).filter(e => e.items?.some(it => it.bookId === p.bookId))

                        return (
                            <React.Fragment key={p.bookId}>
                                <div
                                    className={`glass-card p-5 transition-all hover:shadow-md cursor-pointer ${isVirtual ? 'border border-amber-500/20 bg-amber-500/5' : ''} ${isExpanded ? 'ring-2 ring-primary/20 bg-slate-50/50 dark:bg-dark-100/30' : ''}`}
                                    onClick={() => setExpandedBookId(isExpanded ? null : p.bookId)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-200 flex items-center justify-center text-slate-400">
                                                {isExpanded ? <ChevronDown className="w-5 h-5 text-primary" /> : <ChevronRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-slate-900 dark:text-white font-bold text-lg uppercase tracking-tight">{book?.title || p.bookId}</h3>
                                                    {isVirtual && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium uppercase tracking-wide">
                                                            Sin stock
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-dark-600 mt-0.5">{book?.authorName} · {book?.isbn}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className={`text-2xl font-black font-mono transition-colors ${isCritical ? 'text-red-500 animate-pulse' : isVirtual ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {p.stock}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-black tracking-widest">En Bodega</p>
                                            </div>
                                            
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setAddModal({ bookId: p.bookId, type: 'entrada' })}
                                                    className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                                                    title="Registrar Entrada"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                {!isVirtual && (
                                                    <button
                                                        onClick={() => setAddModal({ bookId: p.bookId, type: 'salida' })}
                                                        className="p-3 rounded-xl bg-slate-200 dark:bg-dark-200 text-slate-600 dark:text-dark-700 hover:bg-slate-300 dark:hover:bg-dark-300 transition-all"
                                                        title="Registrar Salida"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded History Sheet */}
                                {isExpanded && (
                                    <div className="mx-4 -mt-2 mb-4 p-6 bg-white dark:bg-dark-100/50 rounded-b-[2rem] border-x border-b border-slate-200 dark:border-dark-300 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            
                                            {/* Column 1: Core Lifecycle */}
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                                                    <Clock className="w-3 h-3 text-primary" /> Lifecycle Contable
                                                </h4>
                                                
                                                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-dark-300">
                                                    {/* Entries */}
                                                    {p.entries.map((e, i) => (
                                                        <div key={`en-${i}`} className="relative">
                                                            <div className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-100" />
                                                            <p className="text-[11px] text-slate-500 font-mono mb-0.5">{new Date(e.date).toLocaleDateString('es-CL')}</p>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-white">Entrada: <span className="text-emerald-500">+{e.qty} u.</span></p>
                                                            <p className="text-[10px] text-slate-400 italic mt-0.5">{e.note || 'Ingreso de imprenta'}</p>
                                                        </div>
                                                    ))}

                                                    {/* Sales (Direct & Others) */}
                                                    {relatedSales.filter(s => s.channel === 'Venta Directa').map(s => (
                                                        <div key={s.id} className="relative">
                                                            <div className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-primary border-2 border-white dark:border-dark-100" />
                                                            <p className="text-[11px] text-slate-500 font-mono mb-0.5">{new Date(s.saleDate).toLocaleDateString('es-CL')}</p>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-white">Venta Directa: <span className="text-primary">-{s.quantity} u.</span></p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">Monto: {formatCLP(s.total_amount)}</p>
                                                        </div>
                                                    ))}

                                                    {/* Manual Exits */}
                                                    {p.exits.map((e, i) => (
                                                        <div key={`ex-${i}`} className="relative">
                                                            <div className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-red-400 border-2 border-white dark:border-dark-100" />
                                                            <p className="text-[11px] text-slate-500 font-mono mb-0.5">{new Date(e.date).toLocaleDateString('es-CL')}</p>
                                                            <p className="text-xs font-bold text-slate-800 dark:text-white">{e.type.toUpperCase()}: <span className="text-red-500">-{e.qty} u.</span></p>
                                                            <p className="text-[10px] text-slate-400 italic mt-0.5">{e.note}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 2: Distribution & Bookstore Tracking */}
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                                                    <Store className="w-3 h-3 text-amber-500" /> Estado en Librerías
                                                </h4>
                                                
                                                {relatedConsignments.length === 0 ? (
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-200/50 text-center">
                                                        <p className="text-[10px] text-slate-400">Sin despachos a librerías registrados.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {relatedConsignments.map(c => {
                                                            const cSales = relatedSales.filter(s => s.notes?.includes(`consignación ${c.id}`))
                                                            const mermas = cSales.filter(s => s.channel.includes('Merma'))
                                                            const salesOnly = cSales.filter(s => !s.channel.includes('Merma'))
                                                            const pending = c.sentQuantity - c.soldQuantity - c.returnedQuantity

                                                            return (
                                                                <div key={c.id} className="p-3 rounded-xl border border-slate-100 dark:border-dark-300 bg-slate-50/50 dark:bg-dark-200/20">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <p className="text-xs font-bold text-slate-700 dark:text-white">{c.clientName}</p>
                                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${pending > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                                                            {pending > 0 ? `${pending} Pend.` : 'Cerrado'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-4 text-[10px] font-mono mb-3">
                                                                        <span className="text-slate-500">Env: {c.sentQuantity}</span>
                                                                        <span className="text-emerald-500">Ven: {c.soldQuantity}</span>
                                                                        <span className="text-orange-500">Dev: {c.returnedQuantity}</span>
                                                                    </div>

                                                                    {mermas.length > 0 && (
                                                                        <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-dark-400">
                                                                            <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Mermas / Justificaciones:</p>
                                                                            {mermas.map(m => (
                                                                                <div key={m.id} className="flex flex-col gap-0.5">
                                                                                    <div className="flex justify-between text-[10px] text-red-400">
                                                                                        <span>-{m.quantity} u.</span>
                                                                                        <span>{new Date(m.saleDate).toLocaleDateString('es-CL')}</span>
                                                                                    </div>
                                                                                    <p className="text-[9px] text-slate-500 leading-tight italic">"{m.notes.replace('MERMA: ','').split('(')[0]}"</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 3: Event Tracking */}
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-4">
                                                    <Truck className="w-3 h-3 text-indigo-500" /> Presencia en Ferias
                                                </h4>
                                                
                                                {relatedEvents.length === 0 ? (
                                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-200/50 text-center">
                                                        <p className="text-[10px] text-slate-400">Sin participación en ventas de ferias aún.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {relatedEvents.map(e => {
                                                            const item = e.items.find(it => it.bookId === p.bookId)
                                                            const eSales = relatedSales.filter(s => s.channel === 'Feria' && s.client_name === e.name)
                                                            const totalSold = eSales.reduce((sum, s) => sum + s.quantity, 0)

                                                            return (
                                                                <div key={e.id} className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/20">
                                                                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{e.name}</p>
                                                                    <p className="text-[10px] text-indigo-400 mb-2">{new Date(e.startDate).toLocaleDateString('es-CL')}</p>
                                                                    
                                                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                                                        <span className="text-slate-500">Despachado: {item?.initialQty || 0}</span>
                                                                        <span className="text-indigo-600 font-black">Vendido: {totalSold}</span>
                                                                    </div>
                                                                    <div className="mt-1 w-full h-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-indigo-500" 
                                                                            style={{ width: `${Math.min(100, (totalSold / (item?.initialQty || 1)) * 100)}%` }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
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
                                        <h3 className="text-slate-900 dark:text-white font-medium">{book?.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-dark-600">{book?.authorName}</p>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCLP(totalDigitalSales)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {d.versions.map((v, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-dark-50 rounded-lg p-3">
                                            <span className="badge-blue mb-1">{v.format}</span>
                                            <p className="text-xs text-slate-400 dark:text-dark-600 mt-1">v{v.version} · {v.uploadDate}</p>
                                        </div>
                                    ))}
                                </div>
                                <h4 className="text-xs font-medium text-slate-500 dark:text-dark-600 uppercase mb-2">Ventas Digitales</h4>
                                <div className="space-y-1">
                                    {d.sales.map((s, i) => (
                                        <div key={i} className="flex justify-between py-1.5 text-xs border-b border-slate-100 dark:border-dark-300/30">
                                            <span className="text-slate-600 dark:text-dark-700">{s.platform} · {s.period}</span>
                                            <div className="flex gap-4">
                                                <span className="text-slate-500 dark:text-dark-600">{s.qty} uds.</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCLP(s.revenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    {data.inventory.digital.length === 0 && (
                        <div className="glass-card p-8 text-center">
                            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-dark-300 opacity-50" />
                            <p className="text-sm text-slate-500 dark:text-dark-600">No hay inventario digital registrado.</p>
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {type === 'entrada' ? 'Nueva Entrada de Stock' : 'Registrar Salida'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 dark:text-dark-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {bookId ? (
                    <p className="text-xs text-slate-600 dark:text-dark-600 mb-4 bg-slate-50 dark:bg-dark-100 px-3 py-2 rounded-lg">{book?.title}</p>
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Agregar Título al Inventario
                    </h3>
                    <button onClick={onClose} className="p-1 text-dark-600 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-dark-600 mb-5">
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
