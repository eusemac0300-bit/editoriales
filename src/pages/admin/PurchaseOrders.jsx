import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    FileSpreadsheet, Plus, Search, Edit3, Trash2,
    Calendar, BookOpen, Building2, Package, CheckCircle,
    X, Save, AlertTriangle, Filter, Truck, ArrowRight, DollarSign
} from 'lucide-react'

const STATUS_OPTIONS = ['BORRADOR', 'ENVIADA', 'EN_PROCESO', 'RECIBIDA', 'CANCELADA']

const STATUS_COLORS = {
    'BORRADOR': 'badge-dark',
    'ENVIADA': 'badge-blue',
    'EN_PROCESO': 'badge-yellow',
    'RECIBIDA': 'badge-green',
    'CANCELADA': 'badge-red'
}

export default function PurchaseOrders() {
    const { data, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder, addAuditLog } = useAuth()
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('TODOS')
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [receiving, setReceiving] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const pos = data.purchaseOrders || []

    const filtered = pos.filter(p => {
        if (!p) return false
        const orderNum = (p.order_number || '').toLowerCase()
        const bookT = (p.bookTitle || '').toLowerCase()
        const suppN = (p.supplierName || '').toLowerCase()
        const s = search.toLowerCase()

        const matchesSearch = orderNum.includes(s) || bookT.includes(s) || suppN.includes(s)
        const matchesStatus = filterStatus === 'TODOS' || p.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const handleSave = async (formData) => {
        try {
            if (editing) {
                await updatePurchaseOrder(editing.id, formData)
                addAuditLog(`Editó orden de compra: ${formData.order_number}`, 'general')
            } else {
                await addPurchaseOrder(formData)
                addAuditLog(`Creó nueva orden de compra: ${formData.order_number}`, 'general')
            }
            setShowForm(false)
            setEditing(null)
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        }
    }

    const handleDelete = async () => {
        if (!deleting) return
        try {
            await deletePurchaseOrder(deleting.id)
            addAuditLog(`Eliminó orden de compra: ${deleting.order_number}`, 'general')
            setDeleting(null)
        } catch (err) {
            alert('Error al eliminar: ' + err.message)
        }
    }

    const handleReceive = async (quantity) => {
        if (!receiving) return
        try {
            await receivePurchaseOrder(receiving.id, quantity, receiving.book_id)
            addAuditLog(`Recibió ${quantity} unidades de la orden ${receiving.order_number}`, 'general')
            setReceiving(null)
        } catch (err) {
            alert('Error al recibir: ' + err.message)
        }
    }

    const formatCLP = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-primary" /> Órdenes de Compra
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Órdenes de compra y recepción de libros en bodega</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowForm(true) }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nueva Orden
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="stat-card">
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-semibold">Órdenes Activas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{pos.filter(p => p.status !== 'RECIBIDA' && p.status !== 'CANCELADA').length}</p>
                </div>
                <div className="stat-card">
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-semibold">Total Inversión</p>
                    <p className="text-xl font-bold text-primary truncate">{formatCLP(filtered.reduce((acc, curr) => acc + (curr.total_cost || 0), 0))}</p>
                </div>
                <div className="md:col-span-3 glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-dark-600" />
                        <input
                            type="text"
                            placeholder="Buscar por Nro. Orden, Libro o Proveedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="TODOS">Todos los estados</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-dark-200/50 border-b border-slate-200 dark:border-dark-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Nro. Orden</th>
                                <th className="px-4 py-3 text-left">Libro / Título</th>
                                <th className="px-4 py-3 text-left">Proveedor</th>
                                <th className="px-4 py-3 text-left">Fecha Pedido</th>
                                <th className="px-4 py-3 text-right">Cantidad</th>
                                <th className="px-4 py-3 text-right">Costo Total</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-300/50">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:bg-dark-200/30 transition-colors">
                                    <td className="px-4 py-4 font-mono font-bold text-primary">{p.order_number}</td>
                                    <td className="px-4 py-4 min-w-[200px]">
                                        <div className="flex items-center gap-3 text-slate-900 dark:text-white font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-dark-300 flex items-center justify-center shrink-0">
                                                <BookOpen className="w-4 h-4 text-slate-500 dark:text-dark-500" />
                                            </div>
                                            <span className="truncate">{p.bookTitle}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-dark-600">
                                        <div className="flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5 opacity-50" />
                                            <span>{p.supplierName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-dark-600">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 dark:text-white text-xs">{p.date_ordered}</span>
                                            {p.expected_date && <span className="text-[10px] text-slate-500 dark:text-dark-500 italic">Exp. {p.expected_date}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-900 dark:text-white font-mono">{p.expected_quantity}</span>
                                            {p.status === 'RECIBIDA' && (
                                                <span className="text-[10px] text-emerald-400 font-mono">Rec. {p.received_quantity}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono text-slate-900 dark:text-white">
                                        {formatCLP(p.total_cost)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[p.status]}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end items-center gap-1">
                                            {p.status !== 'RECIBIDA' && p.status !== 'CANCELADA' && (
                                                <button
                                                    onClick={() => setReceiving(p)}
                                                    className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-500 dark:text-dark-600 hover:text-emerald-400 transition-all"
                                                    title="Recibir en bodega"
                                                >
                                                    <Truck className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setEditing(p); setShowForm(true) }}
                                                className="p-2 hover:bg-slate-50 dark:bg-dark-200 rounded-lg text-slate-500 dark:text-dark-600 hover:text-slate-900 dark:text-white transition-all"
                                                title="Editar orden"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleting(p)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 dark:text-dark-600 hover:text-red-400 transition-all"
                                                title="Eliminar orden"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="py-20 text-center">
                        <FileSpreadsheet className="w-12 h-12 text-dark-300 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 dark:text-dark-600">No se encontraron órdenes de compra que coincidan</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative glass-card w-full max-w-2xl p-6 slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {editing ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 dark:text-dark-600 hover:text-slate-900 dark:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <POForm
                            po={editing}
                            books={data.books}
                            suppliers={data.suppliers}
                            quotes={data.quotes}
                            onSave={handleSave}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                </div>
            )}

            {/* Receive Modal */}
            {receiving && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReceiving(null)} />
                    <div className="relative glass-card max-w-sm w-full p-6 slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Truck className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Recepción de Bodega</h3>
                                <p className="text-xs text-slate-500 dark:text-dark-600">Orden: {receiving.order_number}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-dark-300 rounded-lg p-3 mb-6">
                            <p className="text-xs text-slate-500 dark:text-dark-500 mb-1">Confirmar ingreso de stock para:</p>
                            <p className="text-sm text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-primary" /> {receiving.bookTitle}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-dark-600 mt-2">Cantidad esperada: <span className="text-slate-900 dark:text-white font-mono">{receiving.expected_quantity}</span></p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const qty = parseInt(e.target.qty.value)
                            if (qty > 0) handleReceive(qty)
                        }}>
                            <div className="mb-6">
                                <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Cantidad Efectivamente Recibida *</label>
                                <input
                                    name="qty"
                                    type="number"
                                    required
                                    min="1"
                                    defaultValue={receiving.expected_quantity}
                                    className="input-field w-full text-center text-xl font-bold font-mono text-emerald-400"
                                />
                                <p className="text-[10px] text-slate-500 dark:text-dark-500 mt-2 leading-relaxed">
                                    Al procesar, los libros se sumarán automáticamente al stock físico actual en el módulo de Inventario.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setReceiving(null)} className="btn-secondary flex-1 py-2 text-sm text-slate-500 dark:text-dark-600">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 border-emerald-600">Procesar Recepción</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleting && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleting(null)} />
                    <div className="relative glass-card max-w-sm w-full p-6 slide-up border border-red-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 dark:text-white font-semibold">Eliminar Orden</h3>
                                <p className="text-xs text-slate-500 dark:text-dark-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-dark-800 mb-6">
                            ¿Estás seguro de que deseas eliminar la orden <strong>{deleting.order_number}</strong>?
                            Si la desapareces, el historial de costos de esta producción también se perderá.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 py-2 text-sm text-slate-500 dark:text-dark-600">Cancelar</button>
                            <button onClick={handleDelete} className="btn-primary flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 border-red-600">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function POForm({ po, books, suppliers, quotes = [], onSave, onCancel }) {
    const [form, setForm] = useState({
        order_number: po?.order_number || `OC-${Date.now().toString().slice(-4)}`,
        supplier_id: po?.supplier_id || '',
        book_id: po?.book_id || '',
        date_ordered: po?.date_ordered || new Date().toISOString().split('T')[0],
        expected_date: po?.expected_date || '',
        status: po?.status || 'BORRADOR',
        total_cost: po?.total_cost || 0,
        expected_quantity: po?.expected_quantity || 0,
        notes: po?.notes || '',
        quote_id: po?.quote_id || ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.supplier_id || !form.book_id || !form.expected_quantity) {
            return alert('Completa los campos obligatorios: Proveedor, Libro y Cantidad')
        }

        // Clean optional fields to be null if empty for Postgres compatibility
        const cleanForm = {
            ...form,
            quote_id: form.quote_id || null,
            expected_date: form.expected_date || null
        }

        onSave(cleanForm)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Nro. Orden / OC *</label>
                    <input
                        required
                        value={form.order_number}
                        onChange={e => setForm({ ...form, order_number: e.target.value })}
                        className="input-field w-full text-sm font-mono font-bold"
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Estado</label>
                    <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Fecha Pedido *
                    </label>
                    <input
                        type="date"
                        required
                        value={form.date_ordered}
                        onChange={e => setForm({ ...form, date_ordered: e.target.value })}
                        className="input-field w-full text-sm dark:bg-dark-300"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Proveedor / Imprenta *</label>
                    <select
                        required
                        value={form.supplier_id}
                        onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        <option value="">Selecciona un proveedor...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block">Fecha Estimada Recepción</label>
                    <input
                        type="date"
                        value={form.expected_date}
                        onChange={e => setForm({ ...form, expected_date: e.target.value })}
                        className="input-field w-full text-sm dark:bg-dark-300"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
                <div className="col-span-3">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Título del Libro a Producir *</label>
                    <select
                        required
                        value={form.book_id}
                        onChange={e => setForm({ ...form, book_id: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        <option value="">Selecciona el libro...</option>
                        {books.map(b => (
                            <option key={b.id} value={b.id}>{b.title} ({b.isbn || 'Sin ISBN'})</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-3">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Cotización Asignada (Opcional)</label>
                    <select
                        value={form.quote_id}
                        onChange={e => {
                            const qId = e.target.value
                            const q = quotes.find(quote => quote.id === qId)
                            setForm({ 
                                ...form, 
                                quote_id: qId,
                                total_cost: q ? q.total : form.total_cost,
                                expected_quantity: q ? (q.quantity || form.expected_quantity) : form.expected_quantity
                            })
                        }}
                        className="input-field w-full text-sm"
                    >
                        <option value="">Ninguna cotización seleccionada</option>
                        {quotes.filter(q => q.status === 'Aprobada').map(q => (
                            <option key={q.id} value={q.id}>
                                {q.provider} - {q.bookTitle} ({new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(q.total)})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Cantidad Solicitada *</label>
                    <input
                        type="number"
                        required
                        min="1"
                        value={form.expected_quantity}
                        onChange={e => setForm({ ...form, expected_quantity: parseInt(e.target.value) })}
                        className="input-field w-full text-sm font-mono"
                        placeholder="Ej: 500"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Costo Total Producción (CLP)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-dark-600" />
                        <input
                            type="number"
                            value={form.total_cost}
                            onChange={e => setForm({ ...form, total_cost: parseFloat(e.target.value) })}
                            className="input-field w-full text-sm pl-9 font-mono bg-slate-50 dark:bg-dark-200/50"
                            placeholder="Monto total de la factura de imprenta"
                        />
                    </div>
                </div>
                <div className="col-span-3">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Observaciones de la Producción</label>
                    <textarea
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        className="input-field w-full text-sm"
                        rows={2}
                        placeholder="Ej: Impresión tapa mate, interiores papel ahuesado..."
                    />
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-primary/70 uppercase font-bold tracking-wider">Costo Unitario Proyectado</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            {form.expected_quantity > 0 ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(form.total_cost / form.expected_quantity) : '$ 0'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-primary/70 uppercase font-bold tracking-wider">Total Orden</p>
                        <p className="text-lg font-bold text-primary font-mono">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(form.total_cost)}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-dark-300 mt-6">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                    <Save className="w-4 h-4 mr-2" /> Guardar Orden
                </button>
            </div>
        </form>
    )
}
