import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Users, Plus, Search, Edit3, Trash2, Phone, Mail,
    MapPin, Building2, ShieldCheck, X, Save, AlertTriangle,
    Contact, LayoutGrid, List as ListIcon
} from 'lucide-react'

const TYPES = ['IMPRENTA', 'DISEÑO', 'MAQUETACIÓN', 'CORRECCIÓN', 'AGENCIA', 'OTROS']

export default function Suppliers() {
    const { data, addSupplier, updateSupplier, deleteSupplier, addAuditLog, t } = useAuth()
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('TODOS')
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState(null)
    const [deleting, setDeleting] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

    const suppliers = data.suppliers || []

    const filtered = suppliers.filter(s => {
        if (!s) return false;
        const name = (s.name || '').toLowerCase()
        const contact = (s.contact_name || '').toLowerCase()
        const tax = (s.tax_id || '').toLowerCase()
        const query = search.toLowerCase()

        const matchesSearch = name.includes(query) || contact.includes(query) || tax.includes(query)
        const matchesType = filterType === 'TODOS' || (s.type || '').toUpperCase() === filterType.toUpperCase()
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
                    
                    <div className="flex bg-slate-100 dark:bg-dark-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-300 shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-300 shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map(s => {
                        if (!s || !s.id) return null;
                        return (
                            <div key={s.id} className="glass-card p-5 group hover:ring-1 hover:ring-primary/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-200 flex items-center justify-center border border-slate-200 dark:border-dark-300">
                                            <Building2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-slate-900 dark:text-white font-semibold truncate px-1">{s.name || 'Sin Nombre'}</h3>
                                            <span className="badge-blue text-[10px]">{s.type || 'IMPRENTA'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 transition-opacity">
                                        <button onClick={() => { setEditing(s); setShowForm(true) }} className="p-2 hover:bg-slate-100 dark:hover:bg-dark-200 rounded-lg text-slate-400 dark:text-dark-500 hover:text-primary-600 transition-all shadow-sm">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDeleting(s)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 dark:text-dark-500 hover:text-red-500 transition-all shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-900 dark:text-white font-medium flex items-center gap-2 text-sm">
                                            <Contact className="w-4 h-4 text-slate-400" />
                                            {s.contact_name || 'Sin Contacto'}
                                        </span>
                                        <span className="text-slate-400 dark:text-dark-500 uppercase font-mono text-[10px]">ID Fiscal: {s.tax_id || '-'}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 dark:border-dark-300 pt-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-700">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="truncate">{s.email || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-700">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>{s.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-dark-700">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="truncate">
                                                {s.address || 'Sin dirección'}
                                                {(s.comuna || s.ciudad) && `, ${[s.comuna, s.ciudad].filter(Boolean).join(', ')}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-dark-100/50 border-b border-slate-100 dark:border-dark-200">
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-dark-600 uppercase tracking-wider">Proveedor</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-dark-600 uppercase tracking-wider">Tipo</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-dark-600 uppercase tracking-wider">Contacto</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-dark-600 uppercase tracking-wider">Email/Tel</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-dark-600 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-dark-200">
                                {filtered.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-200/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900 dark:text-white uppercase text-xs">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono italic">{s.tax_id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="badge-blue text-[10px]">{s.type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-dark-800">
                                            {s.contact_name}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-dark-700">
                                            <div>{s.email}</div>
                                            <div>{s.phone}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => { setEditing(s); setShowForm(true) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-200 rounded text-slate-400">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeleting(s)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="py-20 text-center glass-card">
                    <Building2 className="w-12 h-12 text-slate-200 dark:text-dark-300 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-500 dark:text-dark-600">No se encontraron proveedores que coincidan con la búsqueda</p>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
                    <div className="relative glass-card w-full max-w-lg p-6 slide-up" onClick={e => e.stopPropagation()}>
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
    const { t } = useAuth()
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
