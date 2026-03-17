import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Receipt, Plus, Search, Edit3, Trash2,
    Calendar, Building2, Tag, CreditCard,
    X, Save, AlertTriangle, Filter, ArrowDownCircle, DollarSign
} from 'lucide-react'

const CATEGORIES = ['SUELDOS', 'ARRIENDO', 'SERVICIOS', 'PUBLICIDAD', 'LOGÍSTICA', 'SOFTWARE', 'IMPUESTOS', 'PRODUCCIÓN', 'OTROS']
const METHODS = ['TRANSFERENCIA', 'TARJETA', 'EFECTIVO', 'CHEQUE', 'OTRO']

export default function Expenses() {
    const { data, addExpense, updateExpense, deleteExpense, addAuditLog, formatCLP } = useAuth()
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('TODAS')
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const expenses = data.finances?.expenses || []

    const filtered = expenses.filter(e => {
        if (!e) return false
        const desc = (e.description || '').toLowerCase()
        const supp = (e.supplierName || '').toLowerCase()
        const s = search.toLowerCase()

        const matchesSearch = desc.includes(s) || supp.includes(s)
        const matchesCategory = filterCategory === 'TODAS' || e.category === filterCategory
        return matchesSearch && matchesCategory
    })

    const totalInMonth = filtered.reduce((acc, e) => acc + (e.amount || 0), 0)

    const handleSave = async (formData) => {
        try {
            if (editing) {
                await updateExpense(editing.id, formData)
                addAuditLog(`Editó gasto: ${formData.description}`, 'general')
            } else {
                await addExpense(formData)
                addAuditLog(`Registró nuevo gasto: ${formData.description}`, 'general')
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
            await deleteExpense(deleting.id)
            addAuditLog(`Eliminó gasto: ${deleting.description}`, 'general')
            setDeleting(null)
        } catch (err) {
            alert('Error al eliminar: ' + err.message)
        }
    }

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowDownCircle className="w-6 h-6 text-red-500 dark:text-red-400" /> Gastos Operativos
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Registra y controla los egresos de la editorial</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowForm(true) }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Gasto
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card border-red-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-semibold">Total Seleccionado</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{formatCLP(totalInMonth)}</p>
                </div>
                <div className="md:col-span-3 glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-600" />
                        <input
                            type="text"
                            placeholder="Buscar por descripción o proveedor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="TODAS">Categorías</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-dark-200/50 border-b border-slate-200 dark:border-dark-300">
                            <tr>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Fecha</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Descripción / Detalle</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Categoría</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Proveedor</th>
                                <th className="px-4 py-3 text-left text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Método Pago</th>
                                <th className="px-4 py-3 text-right text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Monto</th>
                                <th className="px-4 py-3 text-right text-slate-500 dark:text-dark-600 font-semibold uppercase text-[10px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-300/50 text-dark-800">
                            {filtered.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-dark-200/30 transition-colors group">
                                    <td className="px-4 py-4 text-slate-500 dark:text-dark-600 font-mono text-xs">{e.date}</td>
                                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{e.description}</td>
                                    <td className="px-4 py-4">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-300 text-[10px] font-bold text-slate-600 dark:text-dark-600">
                                            {e.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-dark-600 flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 opacity-40" />
                                        {e.supplierName}
                                    </td>
                                    <td className="px-4 py-4 text-slate-500 dark:text-dark-600">
                                        <div className="flex items-center gap-1.5 capitalize">
                                            <CreditCard className="w-3.5 h-3.5 opacity-40" />
                                            {e.payment_method?.toLowerCase() || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                                        {formatCLP(e.amount)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditing(e); setShowForm(true) }}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-dark-200 rounded-lg text-slate-400 dark:text-dark-600 hover:text-slate-900 dark:hover:text-white transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleting(e)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 dark:text-dark-600 hover:text-red-500 dark:hover:text-red-400 transition-all"
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
                        <Receipt className="w-12 h-12 text-slate-200 dark:text-dark-300 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 dark:text-dark-600 italic">No se encontraron gastos registrados</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative glass-card w-full max-w-lg p-6 slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {editing ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editing ? 'Editar Gasto' : 'Nuevo Gasto'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-dark-600 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <ExpenseForm
                            expense={editing}
                            suppliers={data.suppliers}
                            onSave={handleSave}
                            onCancel={() => setShowForm(false)}
                        />
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
                                <h3 className="text-white font-semibold">Eliminar Gasto</h3>
                                <p className="text-xs text-dark-600">Se ajustarán los reportes financieros</p>
                            </div>
                        </div>
                        <p className="text-sm text-dark-800 mb-6">
                            ¿Estás seguro de que deseas borrar este gasto de <strong>{formatCLP(deleting.amount)}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 py-2 text-sm">Cancelar</button>
                            <button onClick={handleDelete} className="btn-primary flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 border-red-600">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ExpenseForm({ expense, suppliers, onSave, onCancel }) {
    const [form, setForm] = useState({
        description: expense?.description || '',
        amount: expense?.amount || 0,
        category: expense?.category || 'OTROS',
        date: expense?.date || new Date().toISOString().split('T')[0],
        supplier_id: expense?.supplier_id || '',
        payment_method: expense?.payment_method || 'TRANSFERENCIA',
        status: expense?.status || 'PAGADO'
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.description || !form.amount) return alert('Descripción y Monto son obligatorios')
        
        // Clean optional fields to be null if empty for Postgres compatibility
        const cleanForm = {
            ...form,
            supplier_id: form.supplier_id || null
        }
        
        onSave(cleanForm)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs text-dark-600 mb-1 block">Descripción del Gasto *</label>
                <input
                    required
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field w-full text-sm"
                    placeholder="Ej: Pago arriendo oficina Marzo"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Monto Total *</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                        <input
                            type="number"
                            required
                            min="1"
                            value={form.amount}
                            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                            className="input-field w-full text-sm pl-9 font-mono"
                            placeholder="Monto"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Fecha *
                    </label>
                    <input
                        type="date"
                        required
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className="input-field w-full text-sm dark:bg-dark-300"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Categoría</label>
                    <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Método de Pago</label>
                    <select
                        value={form.payment_method}
                        onChange={e => setForm({ ...form, payment_method: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-xs text-dark-600 mb-1 block">Proveedor Relacionado (Opcional)</label>
                <select
                    value={form.supplier_id}
                    onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                    className="input-field w-full text-sm"
                >
                    <option value="">Ninguno / Proveedor Directo</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-300 mt-6">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                    <Save className="w-4 h-4 mr-2" /> Guardar Gasto
                </button>
            </div>
        </form>
    )
}
