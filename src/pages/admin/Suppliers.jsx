import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Users, Plus, Search, Edit3, Trash2, Phone, Mail,
    MapPin, Building2, ShieldCheck, X, Save, AlertTriangle
} from 'lucide-react'

const TYPES = ['IMPRENTA', 'DISEÑO', 'MAQUETACIÓN', 'CORRECCIÓN', 'AGENCIA', 'OTROS']

export default function Suppliers() {
    const { data, addSupplier, updateSupplier, deleteSupplier, addAuditLog, t } = useAuth()
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('TODOS')
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const suppliers = data.suppliers || []

    const filtered = suppliers.filter(s => {
        if (!s) return false;
        const name = (s.name || '').toLowerCase()
        const contact = (s.contact_name || '').toLowerCase()
        const tax = (s.tax_id || '').toLowerCase()
        const query = search.toLowerCase()

        const matchesSearch = name.includes(query) || contact.includes(query) || tax.includes(query)
        const matchesType = filterType === 'TODOS' || s.type === filterType
        return matchesSearch && matchesType
    })

    const handleSave = async (formData) => {
        try {
            if (editing) {
                await updateSupplier(editing.id, formData)
                addAuditLog(`Editó proveedor: ${formData.name}`, 'general')
            } else {
                await addSupplier(formData)
                addAuditLog(`Agregó nuevo proveedor: ${formData.name}`, 'general')
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
            await deleteSupplier(deleting.id)
            addAuditLog(`Eliminó proveedor: ${deleting.name}`, 'general')
            setDeleting(null)
        } catch (err) {
            alert('Error al eliminar: ' + err.message)
        }
    }

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" /> Directorio de Proveedores
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Gestiona tus imprentas y colaboradores externos</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowForm(true) }}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
                </button>
            </div>

            {/* Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-semibold">Total Proveedores</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{suppliers.length}</p>
                </div>
                <div className="md:col-span-3 glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-600" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, contacto o RUT..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field pl-10 w-full"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="input-field md:w-48"
                    >
                        <option value="TODOS">Todos los tipos</option>
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(s => (
                    <div key={s.id} className="glass-card p-5 group hover:ring-1 hover:ring-primary/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-200 flex items-center justify-center border border-slate-200 dark:border-dark-300">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-semibold">{s.name}</h3>
                                    <span className="badge-blue text-[10px]">{s.type}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setEditing(s); setShowForm(true) }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-50 dark:bg-dark-200 rounded-lg text-slate-400 dark:text-dark-600 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white transition-all"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleting(s)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 dark:text-dark-600 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-500 dark:text-dark-600">
                            {s.contact_name && (
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{s.contact_name}</span>
                                </div>
                            )}
                            {s.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    <a href={`mailto:${s.email}`} className="hover:text-primary">{s.email}</a>
                                </div>
                            )}
                            {s.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    <a href={`tel:${s.phone}`} className="hover:text-primary">{s.phone}</a>
                                </div>
                            )}
                            {s.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate">
                                        {s.address}
                                        {(s.comuna || s.ciudad) && `, ${[s.comuna, s.ciudad].filter(Boolean).join(', ')}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {s.tax_id && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-dark-300/50 flex justify-between items-center text-[10px]">
                                <span className="text-slate-400 dark:text-dark-500 uppercase font-mono">ID Fiscal: {s.tax_id}</span>
                            </div>
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="lg:col-span-2 py-20 text-center glass-card">
                        <Building2 className="w-12 h-12 text-slate-200 dark:text-dark-300 mx-auto mb-4 opacity-50" />
                        <p className="text-slate-500 dark:text-dark-600">No se encontraron proveedores que coincidan con la búsqueda</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative glass-card w-full max-w-lg p-6 slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {editing ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-dark-600 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <SupplierForm supplier={editing} onSave={handleSave} onCancel={() => setShowForm(false)} />
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
                                <h3 className="text-slate-900 dark:text-white font-semibold">Eliminar Proveedor</h3>
                                <p className="text-xs text-slate-500 dark:text-dark-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-dark-800 mb-6">
                            ¿Estás seguro de que deseas eliminar a <strong>{deleting.name}</strong>?
                            Si tiene órdenes de compra asociadas, se mantendrán pero perderán el vínculo con este proveedor.
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

function SupplierForm({ supplier, onSave, onCancel }) {
    const [form, setForm] = useState({
        name: supplier?.name || '',
        type: supplier?.type || 'IMPRENTA',
        contact_name: supplier?.contact_name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        tax_id: supplier?.tax_id || '',
        address: supplier?.address || '',
        comuna: supplier?.comuna || '',
        ciudad: supplier?.ciudad || ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.name.trim()) return alert('El nombre es obligatorio')
        onSave(form)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Razón Social / Nombre *</label>
                    <input
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="Ej: Imprenta Los Andes SpA"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tipo de Servicio *</label>
                    <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="input-field w-full text-sm"
                    >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">RUT / ID Fiscal</label>
                    <input
                        value={form.tax_id}
                        onChange={e => setForm({ ...form, tax_id: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="76.123.456-7"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Nombre de Contacto</label>
                    <input
                        value={form.contact_name}
                        onChange={e => setForm({ ...form, contact_name: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="Ej: Juan Pérez"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Teléfono</label>
                    <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="+56 9 ..."
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Correo Electrónico</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="contacto@proveedor.cl"
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">{t('address') || 'Dirección Física'}</label>
                    <input
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="Calle # Num"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">{t('commune') || 'Comuna'}</label>
                    <input
                        value={form.comuna}
                        onChange={e => setForm({ ...form, comuna: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="Ej: Providencia"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">{t('city') || 'Ciudad'}</label>
                    <input
                        value={form.ciudad}
                        onChange={e => setForm({ ...form, ciudad: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="Ej: Santiago"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-dark-300 mt-6">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                    <Save className="w-4 h-4 mr-2" /> Guardar Proveedor
                </button>
            </div>
        </form>
    )
}
