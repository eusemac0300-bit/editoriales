import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Users as UsersIcon, Edit3, Plus, Trash2, X, Save, Eye, EyeOff, AlertTriangle, FileText, Banknote, MapPin } from 'lucide-react'

export default function AuthorsPage() {
    const { data, user, isAdmin, addNewUser, updateExistingUser, deleteExistingUser, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    const authors = data.users.filter(u => u.role === 'AUTOR')

    const handleDelete = async (userId) => {
        const targetUser = data.users.find(u => u.id === userId)
        await deleteExistingUser(userId)
        addAuditLog(`Eliminó usuario: '${targetUser?.name}' (${targetUser?.role})`, 'general')
        setDeleteConfirm(null)
    }

    if (!isAdmin()) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-dark-600">No tienes permisos para ver esta sección.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UsersIcon className="w-6 h-6 text-primary" />Directorio de Autores
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">{authors.length} autores registrados en catálogo</p>
                </div>
                <button onClick={() => { setShowAdd(!showAdd); setEditingUser(null) }} className="btn-primary text-sm h-10">
                    <Plus className="w-4 h-4 inline mr-1" /> Nuevo Autor
                </button>
            </div>

            {/* Add/Edit Form */}
            {(showAdd || editingUser) && (
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
            )}

            {/* Authors list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {authors.map(u => {
                    const bio = (() => {
                        if (!u.bio) return {}
                        if (typeof u.bio === 'object') return u.bio
                        try { return JSON.parse(u.bio) } catch { return {} }
                    })()
                    return (
                        <div key={u.id} className="glass-card p-5 hover:bg-dark-200/30 transition-colors group flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 bg-gradient-to-br from-purple-500 to-purple-700">
                                    {u.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-medium text-white">{u.name}</h3>
                                    <p className="text-sm text-dark-600 truncate">{u.email}</p>
                                    {bio.rut && <p className="text-xs text-dark-500 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" /> RUT: {bio.rut}</p>}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingUser(u); setShowAdd(false) }}
                                        className="p-2 rounded-lg hover:bg-dark-200 text-dark-600 hover:text-primary transition-all"
                                        title="Editar autor"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(u)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-dark-600 hover:text-red-400 transition-all"
                                        title="Eliminar autor"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Additional Metadata Display */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-dark-600 mt-2 bg-dark-50 p-3 rounded-lg">
                                <div><span className="block text-[10px] text-dark-500 uppercase">País</span>{bio.country || 'No registrado'}</div>
                                <div><span className="block text-[10px] text-dark-500 uppercase">Banco</span>{bio.bankName || 'No registrado'}</div>
                                <div><span className="block text-[10px] text-dark-500 uppercase">Tipo Cta.</span>{bio.bankAccountType || '—'}</div>
                                <div><span className="block text-[10px] text-dark-500 uppercase">Nº Cta.</span>{bio.bankAccountNumber ? '••••' + String(bio.bankAccountNumber).slice(-4) : '—'}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="glass-card max-w-sm w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Eliminar Autor</h3>
                                <p className="text-xs text-dark-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-dark-800 mb-4">
                            ¿Estás seguro de eliminar a <strong className="text-white">{deleteConfirm.name}</strong> ({deleteConfirm.email})?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-dark-600 hover:text-white transition-colors rounded-lg hover:bg-dark-200">
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
        } catch {
            setError('Error al guardar. Inténtalo de nuevo.')
        }
        setSaving(false)
    }

    return (
        <div className="glass-card p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                    {existingUser ? `Editar: ${existingUser.name}` : 'Registrar Nuevo Usuario'}
                </h3>
                <button onClick={onCancel} className="p-1 text-dark-600 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <label className="text-xs text-dark-600 mb-1 block">Nombre Completo *</label>
                    <input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="Ej: María López"
                        required
                    />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Correo Electrónico *</label>
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
                    <label className="text-xs text-dark-600 mb-1 block">Contraseña *</label>
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="sm:col-span-2 mt-4 pt-4 border-t border-dark-300">
                    <h4 className="text-sm font-medium text-white mb-3">Datos para Liquidaciones y Fiscalidad</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">RUT / Identificador Fiscal</label>
                            <input
                                value={form.bio.rut}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, rut: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: 12.345.678-9"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">País de Residencia</label>
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
                            <label className="text-xs text-dark-600 mb-1 block">Retención de Impuestos (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.bio.taxRetentionInfo}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, taxRetentionInfo: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: 13.75"
                            />
                            <p className="text-[10px] text-dark-500 mt-1">Por defecto: 13.75% (Boleta Honorarios Chile 2024)</p>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-dark-600 mb-1 block">Dirección Postal</label>
                            <input
                                value={form.bio.address}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, address: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: Av. Providencia 1234, Depto 56. Santiago."
                            />
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-dark-300">
                    <h4 className="text-sm font-medium text-white mb-3">Datos Bancarios para Regalías</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Banco</label>
                            <input
                                value={form.bio.bankName}
                                onChange={e => setForm(p => ({ ...p, bio: { ...p.bio, bankName: e.target.value } }))}
                                className="input-field text-sm"
                                placeholder="Ej: Banco de Chile, Santander..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Tipo de Cuenta</label>
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
                            <label className="text-xs text-dark-600 mb-1 block">Número de Cuenta</label>
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
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-dark-600 hover:text-white transition-colors rounded-lg hover:bg-dark-200">
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
