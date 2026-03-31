import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Users as UsersIcon, Edit3, Plus, Trash2, X, Save, Eye, EyeOff, AlertTriangle, FileText, Banknote, MapPin } from 'lucide-react'

export default function AuthorsPage() {
    const { data, user, isAdmin, addNewUser, updateExistingUser, deleteExistingUser, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const authors = data.users.filter(u => u.role === 'AUTOR')

    const isComplete = (u) => {
        if (u.email?.includes('@pendiente.editorial')) return false
        const bio = (() => {
            if (!u.bio) return {}
            if (typeof u.bio === 'object') return u.bio
            try { return JSON.parse(u.bio) } catch { return {} }
        })()
        return bio.rut && bio.address && bio.bankAccountNumber && bio.bankName
    }
    const handleDelete = async (userId) => {
        const targetUser = data.users.find(u => u.id === userId)
        await deleteExistingUser(userId)
        addAuditLog(`Eliminó usuario: '${targetUser?.name}' (${targetUser?.role})`, 'general')
        setDeleteConfirm(null)
    }

    if (!isAdmin()) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-dark-600">No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-primary" />Directorio de Autores
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">{authors.length} autores registrados en catálogo</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 dark:bg-dark-200 p-1 rounded-xl mr-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-300 shadow-sm text-primary' : 'text-slate-400'}`}
                            title="Vista Cuadrícula"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-300 shadow-sm text-primary' : 'text-slate-400'}`}
                            title="Vista Lista"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                    <button onClick={() => { setShowAdd(!showAdd); setEditingUser(null) }} className="btn-primary text-sm h-10">
                        <Plus className="w-4 h-4 inline mr-1" /> Nuevo Autor
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {/* Add/Edit Form Modal */}
            {(showAdd || editingUser) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowAdd(false); setEditingUser(null) }} />
                    <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 slide-up shadow-2xl border border-primary/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {editingUser ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editingUser ? 'Editar Autor' : 'Registrar Nuevo Autor'}
                            </h2>
                            <button onClick={() => { setShowAdd(false); setEditingUser(null) }} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <UserForm
                            existingUser={editingUser}
                            users={data.users}
                            onSave={async (formData) => {
                                if (editingUser) {
                                    await updateExistingUser(editingUser.id, formData)
                                    addAuditLog(`Editó usuario: '${formData.name || editingUser.name}'`, 'general')
                                } else {
                                    const newUser = await addNewUser({ ...formData, role: 'AUTOR', bio: formData.bio || {} })
                                    addAuditLog(`Registró autor: '${newUser.name}'`, 'general')
                                }
                                setShowAdd(false)
                                setEditingUser(null)
                            }}
                            onCancel={() => { setShowAdd(false); setEditingUser(null) }}
                        />
                    </div>
                </div>
            )}

            {/* Authors list */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {authors.map(u => {
                        const bio = (() => {
                            if (!u.bio) return {}
                            if (typeof u.bio === 'object') return u.bio
                            try { return JSON.parse(u.bio) } catch { return {} }
                        })()
                        const complete = isComplete(u)
                        return (
                            <div key={u.id} className="glass-card p-5 hover:bg-slate-50 dark:bg-dark-200/30 transition-colors group flex flex-col gap-4 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 transition-colors ${complete ? 'bg-blue-500/10' : 'bg-red-500/10'}`} />
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white shrink-0 bg-gradient-to-br from-purple-500 to-purple-700 relative">
                                        {u.avatar}
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-dark-200 shadow-sm ${complete ? 'bg-blue-500' : 'bg-red-500'}`} title={complete ? 'Datos Completos' : 'Datos Pendientes'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">{u.name}</h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${complete ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {complete ? 'Completo' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-dark-600 truncate">{u.email}</p>
                                        {bio.rut && <p className="text-xs text-slate-500 dark:text-dark-500 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" /> RUT: {bio.rut}</p>}
                                    </div>

                                    <div className="flex items-center gap-1 transition-opacity">
                                        <button
                                            onClick={() => { setEditingUser(u); setShowAdd(false) }}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-dark-200 text-slate-500 dark:text-dark-600 hover:text-primary-600 dark:hover:text-primary transition-all shadow-sm"
                                            title="Editar autor"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(u)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-dark-200 hover:bg-red-500/10 text-slate-500 dark:text-dark-600 hover:text-red-400 transition-all shadow-sm"
                                            title="Eliminar autor"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Additional Metadata Display */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-dark-600 mt-2 bg-slate-50 dark:bg-dark-50 p-3 rounded-lg border border-slate-100 dark:border-dark-300/30">
                                    <div><span className="block text-[10px] text-slate-500 dark:text-dark-500 uppercase">País</span>{bio.country || 'No registrado'}</div>
                                    <div><span className="block text-[10px] text-slate-500 dark:text-dark-500 uppercase">Banco</span>{bio.bankName || 'No registrado'}</div>
                                    <div><span className="block text-[10px] text-slate-500 dark:text-dark-500 uppercase">Tipo Cta.</span>{bio.bankAccountType || '—'}</div>
                                    <div><span className="block text-[10px] text-slate-500 dark:text-dark-500 uppercase">Nº Cta.</span>{bio.bankAccountNumber ? '••••' + String(bio.bankAccountNumber).slice(-4) : '—'}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="glass-card divide-y divide-slate-100 dark:divide-dark-300/50">
                    {authors.map(u => {
                        const complete = isComplete(u)
                        const bio = (() => {
                            if (!u.bio) return {}
                            if (typeof u.bio === 'object') return u.bio
                            try { return JSON.parse(u.bio) } catch { return {} }
                        })()
                        return (
                            <div key={u.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-dark-200/20 transition-colors group">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-br from-purple-500 to-purple-700 relative`}>
                                    {u.avatar}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-dark-200 ${complete ? 'bg-blue-500' : 'bg-red-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                                        <span className={`text-[9px] px-1 rounded font-bold uppercase ${complete ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {complete ? 'Completo' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-dark-600">
                                        <span className="truncate">{u.email}</span>
                                        {bio.rut && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {bio.rut}</span>}
                                        {bio.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {bio.country}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setEditingUser(u); setShowAdd(false) }}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-200 text-slate-400 dark:text-dark-600 hover:text-primary transition-all"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(u)}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 dark:text-dark-600 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="glass-card max-w-sm w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Eliminar Autor</h3>
                                <p className="text-xs text-slate-500 dark:text-dark-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-dark-800 mb-4">
                            ¿Estás seguro de eliminar a <strong className="text-slate-900 dark:text-white">{deleteConfirm.name}</strong> ({deleteConfirm.email})?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-500 dark:text-dark-600 hover:text-slate-900 dark:text-white transition-colors rounded-lg hover:bg-slate-50 dark:bg-dark-200">
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                className="px-4 py-2 text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg transition-all font-medium"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function UserForm({ existingUser, users, onSave, onCancel }) {
    const existingBio = (() => {
        if (!existingUser?.bio) return {}
        if (typeof existingUser.bio === 'object') return existingUser.bio
        try { return JSON.parse(existingUser.bio) } catch { return {} }
    })()
    const [form, setForm] = useState({
        name: existingUser?.name || '',
        email: existingUser?.email || '',
        password: existingUser?.password || '',
        role: 'AUTOR',
        title: existingUser?.title || 'Autor Registrado',
        bio: {
            rut: existingBio.rut || '',
            address: existingBio.address || '',
            country: existingBio.country || 'Chile',
            bankName: existingBio.bankName || '',
            bankAccountType: existingBio.bankAccountType || '',
            bankAccountNumber: existingBio.bankAccountNumber || '',
            taxRetentionInfo: existingBio.taxRetentionInfo || '13.75' // Default Chilean Boleta Honorarios
        }
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setError('Todos los campos obligatorios deben estar completos.')
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('El correo electrónico no es válido.')
            return
        }

        // Check duplicate email (only for new users or if email changed)
        const emailTaken = users.some(u => u.email === form.email && u.id !== existingUser?.id)
        if (emailTaken) {
            setError('Ya existe un usuario con este correo electrónico.')
            return
        }

        if (form.password.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres.')
            return
        }

        setSaving(true)
        try {
            await onSave(form)
        } catch (err) {
            setError('Error al guardar: ' + (err.message || 'Inténtalo de nuevo.'))
        }
        setSaving(false)
    }

    return (
            <div className="space-y-4">

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Nombre Completo *</label>
                    <input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="Ej: María López"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Correo Electrónico *</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="correo@editorial.cl"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Contraseña *</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            className="input-field text-sm pr-9"
                            placeholder="Mín. 4 caracteres"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Datos para Liquidaciones y Fiscalidad</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">RUT / Identificador Fiscal</label>
                            <input
                                value={form.bio.rut}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, rut: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: 12.345.678-9"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">País de Residencia</label>
                            <select
                                value={form.bio.country}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, country: e.target.value } }))}
                                className="input-field text-sm"
                            >
                                <option value="Chile">Chile</option>
                                <option value="Argentina">Argentina</option>
                                <option value="Perú">Perú</option>
                                <option value="Colombia">Colombia</option>
                                <option value="México">México</option>
                                <option value="España">España</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Retención de Impuestos (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.bio.taxRetentionInfo}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, taxRetentionInfo: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: 13.75"
                            />
                            <p className="text-[10px] text-slate-500 dark:text-dark-500 mt-1">Por defecto: 13.75% (Boleta Honorarios Chile 2024)</p>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Dirección Postal</label>
                            <input
                                value={form.bio.address}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, address: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: Av. Providencia 1234, Depto 56. Santiago."
                            />
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Datos Bancarios para Regalías</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Banco</label>
                            <input
                                value={form.bio.bankName}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, bankName: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: Banco de Chile, Santander..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tipo de Cuenta</label>
                            <select
                                value={form.bio.bankAccountType}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, bankAccountType: e.target.value } }))}
                                className="input-field text-sm"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Corriente">Cuenta Corriente</option>
                                <option value="Vista / RUT">Cuenta Vista / Cuenta RUT</option>
                                <option value="Ahorro">Cuenta de Ahorro</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Número de Cuenta</label>
                            <input
                                value={form.bio.bankAccountNumber}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, bankAccountNumber: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: 123456789"
                            />
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 dark:text-dark-600 hover:text-slate-900 dark:text-white transition-colors rounded-lg hover:bg-slate-50 dark:bg-dark-200">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : existingUser ? 'Guardar Autor' : 'Registrar Autor'}
                    </button>
                </div>
            </form>
        </div>
    )
}
