import { useAuth } from '../../context/AuthContext'
import { Users as UsersIcon, Shield, Edit3 } from 'lucide-react'

export default function UsersPage() {
    const { data } = useAuth()

    const roleColors = { ADMIN: 'badge-blue', FREELANCE: 'badge-green', AUTOR: 'badge-purple' }
    const roleLabels = { ADMIN: 'Administrador', FREELANCE: 'Freelance', AUTOR: 'Autor' }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-primary" />Gestión de Usuarios
                </h1>
                <p className="text-dark-600 text-sm mt-1">Control de acceso basado en roles (RBAC)</p>
            </div>

            {/* Role summary */}
            <div className="grid grid-cols-3 gap-3">
                {['ADMIN', 'FREELANCE', 'AUTOR'].map(role => (
                    <div key={role} className="stat-card text-center">
                        <Shield className={`w-5 h-5 mx-auto mb-2 ${role === 'ADMIN' ? 'text-primary' : role === 'FREELANCE' ? 'text-emerald-400' : 'text-purple-400'}`} />
                        <p className="text-2xl font-bold text-white">{data.users.filter(u => u.role === role).length}</p>
                        <p className="text-[10px] text-dark-600 uppercase">{roleLabels[role]}s</p>
                    </div>
                ))}
            </div>

            {/* Users list */}
            <div className="glass-card divide-y divide-dark-300/50">
                {data.users.map(u => (
                    <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-dark-200/30 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${u.role === 'ADMIN' ? 'bg-gradient-to-br from-primary to-primary-700' : u.role === 'FREELANCE' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                            {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-dark-600">{u.email} · {u.title}</p>
                        </div>
                        <span className={roleColors[u.role]}>{roleLabels[u.role]}</span>
                        <button className="p-2 rounded-lg hover:bg-dark-200 text-dark-600 hover:text-primary transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* RBAC permissions matrix */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Matriz de Permisos</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-dark-300">
                                <th className="table-header text-left py-2 px-3">Módulo</th>
                                <th className="table-header text-center py-2 px-3">Admin</th>
                                <th className="table-header text-center py-2 px-3">Freelance</th>
                                <th className="table-header text-center py-2 px-3">Autor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Dashboard', true, false, true],
                                ['Inventario', true, false, false],
                                ['Kanban', true, true, false],
                                ['Escandallo', true, false, false],
                                ['Liquidaciones', true, false, false],
                                ['Libros / Contratos', true, false, false],
                                ['Documentos', true, false, false],
                                ['Usuarios', true, false, false],
                                ['Auditoría', true, false, false],
                                ['Alertas', true, false, false],
                                ['Perfil Propio', true, false, true],
                                ['Comentarios', true, true, false],
                                ['Historial Pagos', false, false, true],
                            ].map(([mod, admin, free, autor], i) => (
                                <tr key={i} className="border-b border-dark-300/30">
                                    <td className="py-2 px-3 text-dark-800">{mod}</td>
                                    <td className="py-2 px-3 text-center">{admin ? '✅' : '🚫'}</td>
                                    <td className="py-2 px-3 text-center">{free ? '✅' : '🚫'}</td>
                                    <td className="py-2 px-3 text-center">{autor ? '✅' : '🚫'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
