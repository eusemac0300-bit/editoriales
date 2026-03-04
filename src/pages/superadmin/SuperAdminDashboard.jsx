import { useState, useEffect } from 'react'
import { loadSuperAdminData } from '../../lib/supabaseService'
import { Building2, Users, CreditCard, Activity, Search } from 'lucide-react'

export default function SuperAdminDashboard() {
    const [tenants, setTenants] = useState([])
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetch() {
            setLoading(true)
            const res = await loadSuperAdminData()
            if (res) {
                setTenants(res.tenants || [])
                setAdmins(res.adminUsers || [])
            }
            setLoading(false)
        }
        fetch()
    }, [])

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex-center h-64">
                <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 slide-up">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Panel de Control SaaS</h1>
                <p className="text-dark-600 text-sm mt-1">Supervisión Master de todas las editoriales suscritas.</p>
            </div>

            {/* Table Section */}
            <div className="glass-card rounded-2xl overflow-hidden border border-dark-300">
                <div className="p-5 border-b border-dark-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-white">Directorio de Editoriales</h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                        <input
                            type="text"
                            placeholder="Buscar editorial o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-9 h-10 py-0 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-dark-200/50 text-dark-800 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold text-dark-600">ID Workspace</th>
                                <th className="p-4 font-semibold text-dark-600">Nombre de Editorial</th>
                                <th className="p-4 font-semibold text-dark-600">Administrador / Email</th>
                                <th className="p-4 font-semibold text-dark-600">Plan de Pago</th>
                                <th className="p-4 font-semibold text-dark-600">Fecha Registro</th>
                                <th className="p-4 font-semibold text-dark-600">Días en Uso</th>
                                <th className="p-4 font-semibold text-dark-600">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-300/50">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-dark-600">
                                        No se encontraron editoriales.
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map(tenant => {
                                    const admin = admins.find(a => a.tenant_id === tenant.id)
                                    const dateObj = new Date(tenant.created_at)
                                    const date = dateObj.toLocaleDateString('es-CL', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })
                                    const diffTime = Math.abs(new Date() - dateObj);
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
                                                {admin ? (
                                                    <div>
                                                        <p className="text-sm text-white font-medium">{admin.name}</p>
                                                        <p className="text-xs text-dark-600">{admin.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-dark-600 italic">No admin found</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge border ${tenant.plan === 'TRIAL' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'}`}>
                                                    {tenant.plan === 'TRIAL' ? 'Prueba (14 días)' : 'PRO (Pagado)'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-dark-700">{date}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-bold text-white">{diffDays} días</span>
                                            </td>
                                            <td className="p-4">
                                                {tenant.active ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full w-max">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        Activa
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full w-max">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        Suspendida
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
