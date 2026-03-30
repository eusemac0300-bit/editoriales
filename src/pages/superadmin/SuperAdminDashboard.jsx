import { useState, useEffect } from 'react'
import { loadSuperAdminData, superAdminDeleteUser, addUser as addSuperAdminUser, superAdminDeleteWorkspace, getGlobalEmail, setGlobalEmail, superAdminCreateTenant, loadOnboardingRequests, updateOnboardingStatus, superAdminApproveOnboarding, deleteAllOnboardingRequests } from '../../lib/supabaseService'
import { Building2, Users, CreditCard, Activity, Search, ShieldAlert, CheckCircle2, XCircle, UserPlus, Database, Lock, User, AlertTriangle, MapPin, Copy } from 'lucide-react'
import { APP_VERSION } from '../../lib/version'

export default function SuperAdminDashboard() {
    const [tenants, setTenants] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('editoriales')
    const [onboardingRequests, setOnboardingRequests] = useState([])

    // Create User Modal State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newUserData, setNewUserData] = useState({
        name: '', email: '', password: '', role: 'FREELANCE', tenant_id: ''
    })

    // Create Tenant Modal State
    const [showTenantModal, setShowTenantModal] = useState(false)
    const [newTenantData, setNewTenantData] = useState({ name: '', plan: 'TRIAL' })

    // Global Settings State
    const [globalSettings, setGlobalSettings] = useState({ contactEmail: 'hola@editorialpro.com' })
    const [actionLoading, setActionLoading] = useState(false)
    const [showWelcomeModal, setShowWelcomeModal] = useState(false)
    const [approvedRequest, setApprovedRequest] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')
    const [copied, setCopied] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const res = await loadSuperAdminData()
        if (res) {
            setTenants(res.tenants || [])
            setAllUsers(res.adminUsers || [])
        }

        const requests = await loadOnboardingRequests()
        setOnboardingRequests(requests || [])

        const email = await getGlobalEmail()
        setGlobalSettings({ contactEmail: email })

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDeleteUser = async (userId, userEmail) => {
        // Safe check for the user's specific exclusion rule
        if (userEmail.includes('admin@editorial') || userEmail.includes('eusemac@me')) {
            alert('¡No puedes eliminar a los usuarios maestros del sistema!')
            return
        }

        if (window.confirm(`¿Estás seguro que deseas ELIMINAR PERMANENTEMENTE al usuario ${userEmail}?`)) {
            setActionLoading(true)
            const success = await superAdminDeleteUser(userId)
            if (success) {
                setAllUsers(prev => prev.filter(u => u.id !== userId))
                alert('Usuario eliminado correctamente de la base de datos pública.')
            } else {
                alert('Error al eliminar usuario. Puede que tenga dependencias que deben borrarse antes.')
            }
            setActionLoading(false)
        }
    }

    const handleDeleteTenant = async (tenantId, tenantName) => {
        if (tenantId === 't_master' || tenantId === 't1') {
            alert('¡Este workspace es un pilar central del sistema. NO SE PUEDE BORRAR!')
            return
        }

        const tenant = tenants.find(t => t.id === tenantId)
        if (tenant && tenant.plan === 'PRO') {
            alert('¡DENEGADO! No puedes borrar suscripciones PRO por motivos de facturación y compliance legal. Solo puedes pausarles o retirarles el acceso si dejan de pagar.')
            return
        }

        if (window.confirm(`⚠️ PELIGRO ⚠️\n\n¿Estás SEGURO de que deseas BORRAR PERMANENTEMENTE el workspace "${tenantName}" (${tenantId})?\n\n¡Esto borrará todos sus libros, usuarios, ventas y datos! Esta acción es irreversible.`)) {
            setActionLoading(true)
            const success = await superAdminDeleteWorkspace(tenantId)
            if (success) {
                setTenants(prev => prev.filter(t => t.id !== tenantId))
                // Also remove all users that belong to this tenant from UI
                setAllUsers(prev => prev.filter(u => u.tenant_id !== tenantId))
                alert('Workspace y toda su data dependiente borrada exitosamente.')
            } else {
                alert('Hubo un error al borrar el Workspace completo. Verifica la consola para dependencias.')
            }
            setActionLoading(false)
        }
    }

    const handleApproveOnboarding = async (request) => {
        if (!window.confirm(`¿Aprobar editorial "${request.editorial_name}"?\nSe creará el Workspace y el usuario admin.`)) return
        setActionLoading(true)
        
        let res = await superAdminApproveOnboarding(request)
        
        // Check for specific email exists error to show warning
        if (!res.success && res.error === 'EMAIL_ALREADY_EXISTS') {
            if (window.confirm(`⚠️ ADVERTENCIA: El correo "${request.admin_email}" ya existe en el sistema.\n\n¿Deseas VINCULAR a este usuario a la nueva editorial "${request.editorial_name}" y continuar con el alta?`)) {
                // Retry with force flag
                res = await superAdminApproveOnboarding(request, true)
            } else {
                setActionLoading(false)
                return
            }
        }

        if (res.success) {
            setApprovedRequest({ ...request, tenant_id: res.tenantId })
            setShowWelcomeModal(true)
            await fetchData()
        } else {
            alert('Error al aprobar: ' + (res.message || res.error))
        }
        setActionLoading(false)
    }

    const handleRejectOnboarding = async (requestId) => {
        const reason = window.prompt('Motivo del rechazo:')
        if (reason === null) return
        setActionLoading(true)
        try {
            await updateOnboardingStatus(requestId, 'rejected', reason)
            alert('Solicitud rechazada.')
            await fetchData()
        } catch (err) {
            alert('Error.')
        }
        setActionLoading(false)
    }

    const handleDeleteAllOnboarding = async () => {
        if (!window.confirm('⚠️ ¿Estás SEGURO de que deseas BORRAR TODAS las solicitudes de onboarding? Esta acción no se puede deshacer.')) return
        setActionLoading(true)
        const success = await deleteAllOnboardingRequests()
        if (success) {
            alert('Todas las solicitudes han sido eliminadas.')
            await fetchData()
        } else {
            alert('Error al eliminar las solicitudes.')
        }
        setActionLoading(false)
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setActionLoading(true)
        setErrorMsg('')

        // Use basic custom logic for direct user provision on selected tenant
        const userObj = {
            id: db.iUUID(),
            tenantId: newUserData.tenant_id,
            email: newUserData.email,
            password: newUserData.password,
            name: newUserData.name,
            role: newUserData.role,
            avatar: newUserData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            title: newUserData.role,
            firstLogin: newUserData.role !== 'ADMIN',
            socialLinks: {},
            bio: null
        }

        const success = await addSuperAdminUser(userObj)
        if (success) {
            alert('Usuario creado correctamente.')
            setShowCreateModal(false)
            setNewUserData({ name: '', email: '', password: '', role: 'FREELANCE', tenant_id: '' })
            await fetchData()
        } else {
            setErrorMsg('Hubo un error al crear el usuario. Verifica los datos y roles.')
        }
        setActionLoading(false)
    }
    const handleCreateTenant = async (e) => {
        e.preventDefault()
        if (!newTenantData.name) return
        setActionLoading(true)
        const tenant = await superAdminCreateTenant(newTenantData.name, newTenantData.plan)
        if (tenant) {
            alert(`Editorial "${tenant.name}" creada con éxito.`)
            setShowTenantModal(false)
            setNewTenantData({ name: '', plan: 'TRIAL' })
            await fetchData()
        } else {
            alert('Error al crear la editorial.')
        }
        setActionLoading(false)
    }

    const handleSaveGlobalSettings = async (e) => {
        e.preventDefault()
        setActionLoading(true)
        const success = await setGlobalEmail(globalSettings.contactEmail)
        if (success) {
            alert('Configuración maestra guardada con éxito en la Base de Datos.')
        } else {
            alert('Error guardando la configuración.')
        }
        setActionLoading(false)
    }

    if (loading) {
        return (
            <div className="flex-center h-64">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 slide-up pb-20">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Database className="w-6 h-6 text-primary" />
                    Panel de Control Master SaaS <span className="text-[10px] bg-primary/20 text-primary-400 px-2 py-0.5 rounded-full font-mono">{APP_VERSION}</span>
                </h1>
                <p className="text-dark-600 text-sm mt-1">Supervisión Master de todas las editoriales suscritas y gestión global de usuarios de DB.</p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-dark-300">
                    <p className="text-dark-500 text-xs uppercase font-bold mb-1">Total Workspaces</p>
                    <p className="text-2xl font-bold text-white">{tenants.length}</p>
                </div>
                <div className="glass-card p-4 rounded-xl border border-dark-300">
                    <p className="text-dark-500 text-xs uppercase font-bold mb-1">Usuarios Globales</p>
                    <p className="text-2xl font-bold text-emerald-400">{allUsers.length}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-dark-200/50 rounded-lg w-max border border-dark-300">
                <button
                    onClick={() => setActiveTab('editoriales')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'editoriales' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dark-500 hover:text-white hover:bg-dark-300/50'}`}
                >
                    <Building2 className="w-4 h-4" /> Workspaces / Editoriales
                </button>
                <button
                    onClick={() => setActiveTab('usuarios')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-dark-500 hover:text-white hover:bg-dark-300/50'}`}
                >
                    <Users className="w-4 h-4" /> Usuarios Finales (BD)
                </button>
                <button
                    onClick={() => setActiveTab('solicitudes')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'solicitudes' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-dark-500 hover:text-white hover:bg-dark-300/50'}`}
                >
                    <Activity className="w-4 h-4" /> Solicitudes Onboarding
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-dark-500 hover:text-white hover:bg-dark-300/50'}`}
                >
                    <AlertTriangle className="w-4 h-4" /> Configuración App
                </button>
            </div>

            {/* Main Content Area */}
            <div className="glass-card rounded-2xl overflow-hidden border border-dark-300 relative">
                <div className="p-5 border-b border-dark-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">
                        {activeTab === 'editoriales' ? 'Directorio de Editoriales' : 
                         activeTab === 'usuarios' ? 'Gestión Global de Usuarios' :
                         activeTab === 'solicitudes' ? 'Solicitudes de Onboarding' :
                         'Configuración Global'}
                    </h2>

                    {activeTab !== 'settings' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                                <input
                                    type="text"
                                    placeholder={`Buscar ${activeTab === 'editoriales' ? 'editorial' : 'usuario'}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field pl-9 h-10 py-0 text-sm w-full"
                                />
                            </div>

                            {activeTab === 'editoriales' && (
                                <button onClick={() => setShowTenantModal(true)} className="btn-primary h-10 px-4 flex items-center justify-center gap-2 shrink-0">
                                    <Building2 className="w-4 h-4" /> Registrar Editorial
                                </button>
                            )}

                            {activeTab === 'usuarios' && (
                                <button onClick={() => setShowCreateModal(true)} className="btn-primary h-10 px-4 flex items-center justify-center gap-2 shrink-0 bg-emerald-500 hover:bg-emerald-400">
                                    <UserPlus className="w-4 h-4" /> Registrar Usuario
                                </button>
                            )}

                            {activeTab === 'solicitudes' && (
                                <button 
                                    onClick={handleDeleteAllOnboarding} 
                                    className="btn-primary h-10 px-4 flex items-center justify-center gap-2 shrink-0 bg-rose-600 hover:bg-rose-500 border-rose-700"
                                >
                                    <ShieldAlert className="w-4 h-4" /> Borrar Todas
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {activeTab === 'settings' ? (
                        <div className="p-8 max-w-2xl">
                            <form onSubmit={handleSaveGlobalSettings} className="space-y-6">
                                <div className="p-5 bg-dark-200 border border-dark-300 rounded-xl">
                                    <h3 className="text-sm font-bold text-white mb-2">Email de Contacto Cuentas / App</h3>
                                    <p className="text-xs text-dark-500 mb-4">Este es el correo donde llegarán las peticiones "Solicitar Demo" y otras peticiones públicas hechas a un SuperAdministrador.</p>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            required
                                            value={globalSettings.contactEmail}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, contactEmail: e.target.value })}
                                            className="input-field w-full pl-4"
                                            placeholder="demo@editorialpro.cl"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary h-10 px-6 font-bold shadow-lg shadow-primary/20">
                                    Guardar Configuración
                                </button>
                            </form>
                        </div>
                    ) : activeTab === 'editoriales' ? (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-dark-200/50 text-dark-800 text-[11px] uppercase tracking-wider">
                                    <th className="p-4 font-semibold text-dark-600">ID Workspace</th>
                                    <th className="p-4 font-semibold text-dark-600">Nombre de Editorial</th>
                                    <th className="p-4 font-semibold text-dark-600">Plan de Pago</th>
                                    <th className="p-4 font-semibold text-dark-600">Fecha Registro</th>
                                    <th className="p-4 font-semibold text-dark-600 text-right">Acciones Peligrosas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-300/50">
                                {filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-dark-600">
                                            No se encontraron editoriales.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map(tenant => {
                                        const dateObj = new Date(tenant.created_at)
                                        const date = dateObj.toLocaleDateString('es-CL', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })
                                        return (
                                            <tr key={tenant.id} className="hover:bg-dark-200/20 transition-colors">
                                                <td className="p-4">
                                                    <span className="font-mono text-xs text-dark-600 bg-dark-200 px-2 py-1 rounded">
                                                        {tenant.id}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <p className="text-sm font-semibold text-white">{tenant.name}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`badge border ${tenant.plan === 'TRIAL' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'}`}>
                                                        {tenant.plan === 'TRIAL' ? 'Prueba (14 días)' : 'PRO'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-dark-700">{date}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        disabled={actionLoading}
                                                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                                        className="text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 border border-red-500/20 rounded-lg transition-all"
                                                    >
                                                        {actionLoading ? 'Borrando...' : 'Delete Workspace'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === 'usuarios' ? (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-dark-200/50 text-dark-800 text-[11px] uppercase tracking-wider">
                                    <th className="p-4 font-semibold text-dark-600">Usuario</th>
                                    <th className="p-4 font-semibold text-dark-600">Correo Electrónico</th>
                                    <th className="p-4 font-semibold text-dark-600">Rol</th>
                                    <th className="p-4 font-semibold text-dark-600">Pertenece a (Tenant)</th>
                                    <th className="p-4 font-semibold text-dark-600 text-right">Acciones Peligrosas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-300/50">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-dark-600">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(u => {
                                        const tenantName = tenants.find(t => t.id === u.tenant_id)?.name || 'Tenant Desconocido'
                                        const isProtected = u.email?.includes('admin@editorial') || u.email?.includes('eusemac@me')

                                        return (
                                            <tr key={u.id} className="hover:bg-dark-200/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center font-bold text-[10px] text-dark-600 shrink-0">
                                                            {u.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <p className="text-sm font-semibold text-white">{u.name}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-dark-400"><a href={`mailto:${u.email}`} className="hover:text-primary transition-colors">{u.email}</a></span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="badge bg-dark-300 text-white font-mono text-[10px]">{u.role}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-dark-500 flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {tenantName}
                                                        <span className="font-mono bg-dark-200 px-1 py-0.5 rounded ml-1 text-[9px]">{u.tenant_id}</span>
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {isProtected ? (
                                                        <span className="flex items-center justify-end gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                                            <ShieldAlert className="w-3 h-3" /> Intocable
                                                        </span>
                                                    ) : (
                                                        <button
                                                            disabled={actionLoading}
                                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                                            className="text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 border border-red-500/20 rounded-lg transition-all"
                                                        >
                                                            {actionLoading ? 'Borrando...' : 'Force Delete'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    ) : null}

                    {activeTab === 'solicitudes' && (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-dark-200/50 text-dark-800 text-[11px] uppercase tracking-wider">
                                    <th className="p-4 font-semibold text-dark-600">Editorial / Datos</th>
                                    <th className="p-4 font-semibold text-dark-600">Admin Propuesto</th>
                                    <th className="p-4 font-semibold text-dark-600">Estado</th>
                                    <th className="p-4 font-semibold text-dark-600 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-300/50">
                                {onboardingRequests.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-dark-600">No hay solicitudes pendientes.</td></tr>
                                ) : (
                                    onboardingRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-dark-200/20 transition-colors">
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-white">{req.editorial_name}</p>
                                                <p className="text-[10px] text-dark-500">{req.tax_id || 'Sin RUT'}</p>
                                                <p className="text-[10px] text-dark-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.address || 'Sin dirección'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-semibold text-white">{req.admin_name}</p>
                                                <p className="text-xs text-dark-400">{req.admin_email}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge border text-[10px] ${req.status === 'pending' ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' :
                                                    req.status === 'approved' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                                                        'border-red-500/50 bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {req.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {req.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRejectOnboarding(req.id)}
                                                            className="px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        >
                                                            Rechazar
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveOnboarding(req)}
                                                            className="px-3 py-1.5 text-[10px] font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                                                        >
                                                            Aprobar Master
                                                        </button>
                                                    </div>
                                                )}
                                                {req.status !== 'pending' && (
                                                    <span className="text-[10px] text-dark-500 font-mono italic">{req.notes || 'Sin notas'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create User Modal Form */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm slide-in-bottom">
                    <div className="bg-dark-200 border border-dark-300 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-emerald-500" /> Registrar en Base de Datos
                        </h3>
                        <p className="text-xs text-dark-500 mb-6">
                            Permite forzar la creación de un usuario vinculándolo directamente a un Tenant ID, útil para demos o sin requerir pasar por el flujo de autenticación seguro de la Landing Page.
                        </p>

                        {errorMsg && (
                            <div className="mb-4 p-3 rounded-lg bg-red-400/10 border border-red-400/20 flex gap-2 items-center text-xs text-red-400">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-dark-500 font-bold mb-1 block">Nombre Completo</label>
                                    <input required type="text" className="input-field h-10 w-full" value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} placeholder="Ej. Juan Admin" />
                                </div>
                                <div>
                                    <label className="text-xs text-dark-500 font-bold mb-1 block">Correo de Acceso</label>
                                    <input required type="email" className="input-field h-10 w-full" value={newUserData.email} onChange={e => setNewUserData({ ...newUserData, email: e.target.value })} placeholder="mail@ejemplo.com" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-dark-500 font-bold mb-1 block">Contraseña Forzada</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                                    <input required type="text" className="input-field h-10 w-full pl-9 font-mono" value={newUserData.password} onChange={e => setNewUserData({ ...newUserData, password: e.target.value })} placeholder="******" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs text-dark-500 font-bold mb-1 block">Perfil / Rol a Ocupar</label>
                                    <select required className="input-field h-10 w-full bg-dark-800" value={newUserData.role} onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}>
                                        <option value="ADMIN">Administrador (Master)</option>
                                        <option value="FREELANCE">Trabajador Independiente</option>
                                        <option value="AUTOR">Autor (Solo Vista)</option>
                                        <option value="SUPERADMIN">Super Admin Root</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-dark-500 font-bold mb-1 block">Tenant ID (Editorial)</label>
                                    <select required className="input-field h-10 w-full font-mono text-[10px]" value={newUserData.tenant_id} onChange={e => setNewUserData({ ...newUserData, tenant_id: e.target.value })}>
                                        <option value="">-- Seleccionar --</option>
                                        {tenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ( {t.id} )</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-dark-300">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="h-10 px-4 rounded-xl border border-dark-400 text-dark-400 hover:text-white hover:bg-dark-300 font-bold text-sm transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={actionLoading} className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-dark-900 font-black text-sm transition-all shadow-lg shadow-emerald-500/20">
                                    {actionLoading ? 'Registrando...' : 'Forzar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Create Tenant Modal */}
            {showTenantModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm slide-in-bottom">
                    <div className="bg-dark-200 border border-dark-300 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" /> Nueva Editorial / Cliente
                        </h3>
                        <p className="text-xs text-dark-500 mb-6">
                            Registra una nueva entidad en el sistema. Una vez creada, podrás asignarle usuarios administradores.
                        </p>

                        <form onSubmit={handleCreateTenant} className="space-y-4">
                            <div>
                                <label className="text-xs text-dark-500 font-bold mb-1 block">Nombre de la Editorial</label>
                                <input required type="text" className="input-field h-11 w-full" value={newTenantData.name} onChange={e => setNewTenantData({ ...newTenantData, name: e.target.value })} placeholder="Ej. Editorial Siglo XXI" />
                            </div>

                            <div>
                                <label className="text-xs text-dark-500 font-bold mb-1 block">Plan Inicial</label>
                                <select className="input-field h-11 w-full bg-dark-800" value={newTenantData.plan} onChange={e => setNewTenantData({ ...newTenantData, plan: e.target.value })}>
                                    <option value="TRIAL">Prueba (14 días)</option>
                                    <option value="PRO">Plan PRO (Suscrito)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-dark-300">
                                <button type="button" onClick={() => setShowTenantModal(false)} className="h-11 px-4 rounded-xl border border-dark-400 text-dark-400 hover:text-white hover:bg-dark-300 font-bold text-sm transition-all">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={actionLoading} className="h-11 px-6 rounded-xl bg-primary hover:bg-primary-400 text-white font-black text-sm transition-all shadow-lg shadow-primary/20">
                                    {actionLoading ? 'Creando...' : 'Crear Editorial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Welcome Modal for Newly Approved Editorial */}
            {showWelcomeModal && approvedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setShowWelcomeModal(false)}></div>
                    <div className="relative w-full max-w-xl glass-card rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl">
                        <div className="bg-primary/90 backdrop-blur-md p-8 text-white text-center border-b border-white/10">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-black italic tracking-tight uppercase">¡Bienvenido a Bordo!</h3>
                            <p className="text-sm opacity-90 mt-2 font-medium">El workspace para <strong>{approvedRequest.editorial_name}</strong> ha sido activado.</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest block">Mensaje Sugerido para el Cliente</label>
                                    <button 
                                        onClick={() => {
                                            const text = `Hola ${approvedRequest.admin_name || 'Admin'},\n\n¡Bienvenido a la suite de Gestión Editorial! Tu espacio para "${approvedRequest.editorial_name}" ya está activo.\n\nPuedes ingresar aquí:\nhttps://editoriales.vercel.app/login\n\nCredenciales Temporales de Activación:\nEmail: ${approvedRequest.admin_email}\nPass: bienvenido123\n\n🔒 Seguridad: Al ingresar por primera vez, el sistema te solicitará crear tu propia contraseña personal.\n\n🚀 Tips de inicio:\n1. Tu workspace ya incluye datos de ejemplo (libros, autores, ventas y gastos) para que pruebes todas las funciones de inmediato.\n2. Puedes borrar estos datos una vez que te hayas familiarizado con la suite.\n\n¡Mucho éxito con tu nueva plataforma tecnológica!`;
                                            navigator.clipboard.writeText(text);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:text-primary-400 transition-colors uppercase tracking-widest"
                                    >
                                        {copied ? <><CheckCircle2 className="w-3 h-3" /> ¡Copiado!</> : <><Copy className="w-3 h-3" /> Copiar Texto</>}
                                    </button>
                                </div>
                                <div className="p-6 bg-dark-200/40 rounded-[1.5rem] text-[12px] leading-relaxed text-dark-800 border border-white/5 font-mono whitespace-pre-wrap shadow-inner min-h-[180px]">
                                    {`Hola ${approvedRequest.admin_name || 'Admin'},\n\n¡Bienvenido a la suite de Gestión Editorial! Tu espacio para "${approvedRequest.editorial_name}" ya está activo.\n\nPuedes ingresar aquí:\nhttps://editoriales.vercel.app/login\n\nCredenciales Temporales de Activación:\nEmail: ${approvedRequest.admin_email}\nPass: bienvenido123\n\n🔒 Seguridad: Al ingresar por primera vez, el sistema te solicitará crear tu propia contraseña personal.\n\n🚀 Tips de inicio:\n1. Tu workspace ya incluye datos de ejemplo (libros, autores, ventas y gastos) para que pruebes todas las funciones de inmediato.\n2. Puedes borrar estos datos una vez que te hayas familiarizado con la suite.\n\n¡Mucho éxito con tu nueva plataforma tecnológica!`}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <a
                                    href={`mailto:${approvedRequest.admin_email}?subject=Bienvenido a tu Workspace Editorial - ${approvedRequest.editorial_name}&body=${encodeURIComponent(`Hola ${approvedRequest.admin_name || 'Admin'},\n\n¡Bienvenido a la suite de Gestión Editorial! Tu espacio para "${approvedRequest.editorial_name}" ya está activo.\n\nPuedes ingresar aquí:\nhttps://editoriales.vercel.app/login\n\nCredenciales Temporales de Activación:\nEmail: ${approvedRequest.admin_email}\nPass: bienvenido123\n\n🔒 Seguridad: Al ingresar por primera vez, el sistema te solicitará crear tu propia contraseña personal. Esto garantiza que solo tú tengas acceso a tu información final.\n\n🚀 Tips de inicio:\n1. Tu workspace ya incluye datos de ejemplo (libros, autores, ventas y gastos) para que puedas probar todas las funciones de inmediato sin usar tus datos reales.\n2. Puedes borrar estos datos una vez que te hayas familiarizado con la suite.\n\n¡Mucho éxito con tu nueva plataforma tecnológica!`)}`}
                                    className="h-14 w-full flex items-center justify-center gap-3 rounded-2xl bg-primary hover:bg-primary-400 text-white font-black text-sm transition-all shadow-2xl shadow-primary/30 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Activity className="w-5 h-5" />
                                    ENVIAR ACCESO AHORA
                                </a>
                                <button
                                    onClick={() => setShowWelcomeModal(false)}
                                    className="h-10 w-full text-dark-500 hover:text-white text-xs font-bold transition-all uppercase tracking-widest"
                                >
                                    Cerrar y continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

