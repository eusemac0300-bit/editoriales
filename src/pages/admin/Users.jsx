import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Users as UsersIcon, Shield, Edit3, Plus, Trash2, X, Save, Eye, EyeOff, AlertTriangle, RotateCcw, Check } from 'lucide-react'
import { MODULES, DEFAULT_PERMISSIONS, loadPermissions } from '../../lib/permissions'

const ROLES = ['ADMIN', 'FREELANCE', 'VENDEDOR', 'EDITOR']
const ROLE_COLORS = { ADMIN: 'badge-blue', FREELANCE: 'badge-green', VENDEDOR: 'badge-yellow', EDITOR: 'badge-purple' }
const ROLE_LABELS = { ADMIN: 'Administrador', FREELANCE: 'Freelance', VENDEDOR: 'Vendedor', EDITOR: 'Editor' }

export default function UsersPage() {
    const { data, user, isAdmin, addNewUser, updateExistingUser, deleteExistingUser, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [filter, setFilter] = useState('TODOS')
    const [permissions, setPermissions] = useState(loadPermissions)
    const [saved, setSaved] = useState(false)

    const togglePermission = useCallback((role, module) => {
        setPermissions(prev => {
            const updated = {
                ...prev,
                [role]: { ...prev[role], [module]: !prev[role][module] }
            }
            localStorage.setItem('editorial_permissions', JSON.stringify(updated))
            return updated
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }, [])

    const resetPermissions = useCallback(() => {
        setPermissions(DEFAULT_PERMISSIONS)
        localStorage.setItem('editorial_permissions', JSON.stringify(DEFAULT_PERMISSIONS))
        addAuditLog('Restauró la matriz de permisos a valores por defecto', 'general')
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }, [addAuditLog])

    const filteredUsers = filter === 'TODOS'
        ? data.users.filter(u => u.role !== 'AUTOR')
        : data.users.filter(u => u.role === filter)

    const staffCount = data.users.filter(u => u.role !== 'AUTOR').length

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
                        <UsersIcon className="w-6 h-6 text-primary" />Personal y Administradores
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">{staffCount} cuentas de personal registradas</p>
                </div>
                <button onClick={() => { setShowAdd(!showAdd); setEditingUser(null) }} className="btn-primary text-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> Nuevo Personal
                </button>
            </div>

            {/* Role summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ROLES.map(role => (
                    <div
                        key={role}
                        className={`stat-card text-center cursor-pointer transition-all ${filter === role ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-dark-400'}`}
                        onClick={() => setFilter(filter === role ? 'TODOS' : role)}
                    >
                        <Shield className={`w-5 h-5 mx-auto mb-2 ${role === 'ADMIN' ? 'text-primary' : role === 'VENDEDOR' ? 'text-yellow-400' : role === 'EDITOR' ? 'text-purple-400' : 'text-emerald-400'}`} />
                        <p className="text-2xl font-bold text-white">{data.users.filter(u => u.role === role).length}</p>
                        <p className="text-[10px] text-dark-600 uppercase">{ROLE_LABELS[role]}s</p>
                    </div>
                ))}
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
                            const newUser = await addNewUser(formData)
                            addAuditLog(`Creó usuario: '${newUser.name}' (${newUser.role})`, 'general')
                        }
                        setShowAdd(false)
                        setEditingUser(null)
                    }}
                    onCancel={() => { setShowAdd(false); setEditingUser(null) }}
                />
            )}

            {/* Filter indicator */}
            {filter !== 'TODOS' && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-600">Filtrado por:</span>
                    <span className={ROLE_COLORS[filter]}>{ROLE_LABELS[filter]}</span>
                    <button onClick={() => setFilter('TODOS')} className="text-xs text-dark-500 hover:text-primary transition-colors">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Users list */}
            <div className="glass-card divide-y divide-dark-300/50">
                {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-dark-200/30 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${u.role === 'ADMIN' ? 'bg-gradient-to-br from-primary to-primary-700' : u.role === 'VENDEDOR' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : u.role === 'EDITOR' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
                            {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-dark-600">{u.email} · {u.title}</p>
                        </div>
                        <span className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role] || u.role}</span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditingUser(u); setShowAdd(false) }}
                                className="p-2 rounded-lg hover:bg-dark-200 text-dark-600 hover:text-primary transition-all"
                                title="Editar usuario"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            {u.id !== user?.id && (
                                <button
                                    onClick={() => setDeleteConfirm(u)}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-dark-600 hover:text-red-400 transition-all"
                                    title="Eliminar usuario"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
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
                                <h3 className="text-sm font-semibold text-white">Eliminar Usuario</h3>
                                <p className="text-xs text-dark-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-sm text-dark-800 mb-4">
                            ¿Estás seguro de eliminar a <strong className="text-white">{deleteConfirm.name}</strong> ({deleteConfirm.email})?
                            Se eliminarán también sus comentarios y registros de auditoría.
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

            {/* RBAC permissions matrix - EDITABLE */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-white">Matriz de Permisos</h2>
                        {saved && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 fade-in">
                                <Check className="w-3 h-3" /> Guardado
                            </span>
                        )}
                    </div>
                    <button
                        onClick={resetPermissions}
                        className="flex items-center gap-1 text-[10px] text-dark-500 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-dark-200"
                        title="Restaurar permisos por defecto"
                    >
                        <RotateCcw className="w-3 h-3" /> Restablecer
                    </button>
                </div>
                <p className="text-[10px] text-dark-500 mb-3">Haz clic en cualquier celda para cambiar el permiso</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-dark-300">
                                <th className="table-header text-left py-2 px-3">Módulo</th>
                                {ROLES.map(r => (
                                    <th key={r} className="table-header text-center py-2 px-3">{ROLE_LABELS[r]}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MODULES.map((mod, i) => (
                                <tr key={i} className="border-b border-dark-300/30 hover:bg-dark-200/20 transition-colors">
                                    <td className="py-2 px-3 text-dark-800">{mod}</td>
                                    {ROLES.map(role => {
                                        const allowed = permissions[role]?.[mod] ?? false
                                        return (
                                            <td key={role} className="py-2 px-3 text-center">
                                                <button
                                                    onClick={() => togglePermission(role, mod)}
                                                    className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all duration-200 ${allowed
                                                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20'
                                                        : 'bg-red-500/10 text-red-400/60 hover:bg-red-500/20 ring-1 ring-red-500/10'
                                                        }`}
                                                    title={`${allowed ? 'Revocar' : 'Permitir'} ${mod} para ${role}`}
                                                >
                                                    {allowed ? '✓' : '✕'}
                                                </button>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function UserForm({ existingUser, users, onSave, onCancel }) {
    const [form, setForm] = useState({
        name: existingUser?.name || '',
        email: existingUser?.email || '',
        password: existingUser?.password || '',
        role: existingUser?.role || 'ADMIN',
        title: existingUser?.title || ''
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
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Rol *</label>
                    <select
                        value={form.role}
                        onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                        className="input-field text-sm"
                    >
                        <option value="ADMIN">Administrador</option>
                        <option value="VENDEDOR">Vendedor</option>
                        <option value="EDITOR">Editor / Productor</option>
                        <option value="FREELANCE">Freelance</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Cargo / Título</label>
                    <input
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        className="input-field text-sm"
                        placeholder="Ej: Corrector de Estilo"
                    />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-dark-600 hover:text-white transition-colors rounded-lg hover:bg-dark-200">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : existingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                    </button>
                </div>
            </form>
        </div>
    )
}
