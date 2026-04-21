import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Users, Plus, Search, Edit3, Trash2,
    Building2, Mail, Phone, MapPin, 
    CreditCard, ExternalLink, Filter, X, Save, Percent
} from 'lucide-react'

const CLIENT_TYPES = [
    { id: 'libreria', label: 'Librería', color: 'bg-emerald-500' },
    { id: 'distribuidor', label: 'Distribuidor', color: 'bg-blue-500' },
    { id: 'punto_venta', label: 'Punto de Venta', color: 'bg-purple-500' },
    { id: 'otro', label: 'Otro', color: 'bg-slate-500' }
]

export default function Clients() {
    const { data, addNewClient, updateExistingClient, deleteExistingClient, formatCLP, currency } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [isDeleting, setIsDeleting] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        type: 'libreria',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        credit_limit: 0,
        notes: '',
        default_discount: 0
    })

    const clients = data?.clients || []

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 c.tax_id?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesType = selectedType === 'all' || c.type === selectedType
            return matchesSearch && matchesType
        })
    }, [clients, searchTerm, selectedType])

    const handleOpenModal = (client = null) => {
        if (client) {
            setEditingClient(client)
            setFormData({
                name: client.name || '',
                type: client.type || 'libreria',
                contact_name: client.contact_name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                tax_id: client.tax_id || '',
                credit_limit: client.credit_limit || 0,
                notes: client.notes || '',
                default_discount: client.default_discount || 0
            })
        } else {
            setEditingClient(null)
            setFormData({
                name: '',
                type: 'libreria',
                contact_name: '',
                email: '',
                phone: '',
                address: '',
                tax_id: '',
                credit_limit: 0,
                notes: '',
                default_discount: 0
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingClient) {
                await updateExistingClient(editingClient.id, formData)
            } else {
                await addNewClient(formData)
            }
            setIsModalOpen(false)
        } catch (err) {
            console.error('[Clients] Submit Error:', err);
            alert(`Error al guardar cliente: ${err.message || 'Error desconocido'}`)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            await deleteExistingClient(id)
        }
    }

    return (
        <div className="space-y-8 fade-in pb-20">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-100 p-8 rounded-[2.5rem] shadow-xl border border-slate-200/50 dark:border-dark-300">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Clientes</h1>
                        <p className="text-slate-500 dark:text-dark-600 font-medium">Librerías, distribuidoras y puntos de venta</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal()} 
                    className="btn-primary py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span className="font-bold uppercase tracking-widest text-sm text-white">Nuevo Cliente</span>
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 bg-emerald-500 text-white shadow-xl shadow-emerald-500/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Clientes</p>
                    <p className="text-4xl font-black mt-2 tracking-tighter">{clients.length}</p>
                </div>
                <div className="glass-card p-6 border border-slate-200 dark:border-dark-300">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Librerías</p>
                    <p className="text-4xl font-black mt-2 text-slate-900 dark:text-white tracking-tighter">
                        {clients.filter(c => c.type === 'libreria').length}
                    </p>
                </div>
                <div className="glass-card p-6 border border-slate-200 dark:border-dark-300">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Distribuidores</p>
                    <p className="text-4xl font-black mt-2 text-slate-900 dark:text-white tracking-tighter">
                        {clients.filter(c => c.type === 'distribuidor').length}
                    </p>
                </div>
                <div className="glass-card p-6 border border-primary/20 bg-primary/5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Promedio Ventas</p>
                    <p className="text-4xl font-black mt-2 text-primary tracking-tighter">Alta</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o RUT..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-dark-200 border-none rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-bold shadow-lg shadow-black/5 focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex gap-2 p-2 bg-slate-100 dark:bg-dark-200 rounded-[1.5rem] overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setSelectedType('all')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedType === 'all' ? 'bg-white dark:bg-dark-50 shadow-md text-primary' : 'text-slate-500 dark:text-dark-600 hover:text-slate-700 dark:hover:text-dark-800'}`}
                    >
                        Todos
                    </button>
                    {CLIENT_TYPES.map(type => (
                        <button 
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedType === type.id ? 'bg-white dark:bg-dark-50 shadow-md text-primary' : 'text-slate-500 dark:text-dark-600 hover:text-slate-700 dark:hover:text-dark-800'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients List/Table */}
            <div className="bg-white dark:bg-dark-100 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-dark-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-dark-50/10 border-b border-slate-100 dark:border-dark-300">
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-500">Cliente</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-500">Contacto</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-500">Ubicación</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-500 text-right">Crédito</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-dark-500 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-300">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-dark-50/5 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-10 rounded-full ${CLIENT_TYPES.find(t => t.id === client.type)?.color || 'bg-slate-500'}`} />
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{client.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RUT: {client.tax_id || 'N/A'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-dark-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{CLIENT_TYPES.find(t => t.id === client.type)?.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-sm font-bold text-slate-700 dark:text-dark-800">{client.contact_name || '-'}</p>
                                        <div className="flex items-center gap-3 mt-1 text-slate-400 dark:text-dark-600">
                                            <span className="text-xs truncate max-w-[150px]" title={client.email}>{client.email || '-'}</span>
                                            {client.phone && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-dark-500" />
                                                    <span className="text-xs">{client.phone}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-dark-700">
                                            <MapPin className="w-4 h-4 opacity-50" />
                                            <span className="text-xs font-medium truncate max-w-[200px]" title={client.address}>{client.address || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right font-black text-sm text-slate-900 dark:text-white">
                                        {formatCLP(client.credit_limit || 0)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(client)} 
                                                className="p-2 hover:bg-white dark:hover:bg-dark-200 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-dark-400 rounded-xl text-slate-400 hover:text-primary transition-all"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(client.id)} 
                                                className="p-2 hover:bg-white dark:hover:bg-dark-200 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-dark-400 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredClients.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 dark:text-dark-600 font-medium">
                                        No se encontraron clientes que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-dark-100 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-dark-300 overflow-hidden slide-up">
                        <div className="p-8 border-b border-slate-100 dark:border-dark-300 flex justify-between items-center bg-slate-50 dark:bg-dark-50/10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                                <p className="text-sm text-slate-500 font-medium tracking-tight">Completa los datos del establecimiento</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-dark-200 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre o Razón Social</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="Ej: Librería Central"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Cliente</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            setFormData({
                                                ...formData, 
                                                type: newType,
                                                default_discount: newType === 'distribuidor' ? 60 : (newType === 'libreria' ? 40 : formData.default_discount)
                                            })
                                        }}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-primary/10"
                                    >
                                        {CLIENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">% Descuento Predeterminado</label>
                                    <div className="relative">
                                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" 
                                            value={formData.default_discount}
                                            onChange={(e) => setFormData({...formData, default_discount: parseFloat(e.target.value)})}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                            placeholder="Ej: 60"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">RUT / Tax ID</label>
                                    <input 
                                        type="text" 
                                        value={formData.tax_id}
                                        onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        placeholder="Ej: 77.123.456-K"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Contacto</label>
                                    <input 
                                        type="text" 
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        placeholder="admin@libreria.cl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <input 
                                        type="text" 
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        placeholder="+56 9 ..."
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                                    <input 
                                        type="text" 
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        placeholder="Av. Providencia 1234, Santiago"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Límite de Crédito ({currency})</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="number" 
                                            value={formData.credit_limit}
                                            onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value)})}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-sm font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-[1.5rem] bg-slate-100 dark:bg-dark-300 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                                <button type="submit" className="flex-2 flex-[2] py-5 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    <Save className="w-5 h-5" />
                                    {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
