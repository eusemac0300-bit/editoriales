import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    BookOpen, LayoutDashboard, Package, Kanban, Calculator,
    DollarSign, FileText, Users, Bell, ClipboardList,
    FolderOpen, LogOut, Menu, X, ChevronDown
} from 'lucide-react'

const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/inventario', icon: Package, label: 'Inventario' },
    { to: '/admin/kanban', icon: Kanban, label: 'Producción' },
    { to: '/admin/escandallo', icon: Calculator, label: 'Escandallo' },
    { to: '/admin/liquidaciones', icon: DollarSign, label: 'Liquidaciones' },
    { to: '/admin/libros', icon: FileText, label: 'Libros' },
    { to: '/admin/documentos', icon: FolderOpen, label: 'Documentos' },
    { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/admin/auditoria', icon: ClipboardList, label: 'Auditoría' },
    { to: '/admin/alertas', icon: Bell, label: 'Alertas' },
]

export default function AdminLayout() {
    const { user, logout, data } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const unreadAlerts = data.alerts.filter(a => !a.read).length

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-dark flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-100 border-r border-dark-300 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-300">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg shadow-primary/20">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm">Editorial Pro</h1>
                            <p className="text-[10px] text-dark-600">Panel de Administración</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-dark-600 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                                {item.label === 'Alertas' && unreadAlerts > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadAlerts}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User section */}
                    <div className="px-3 py-4 border-t border-dark-300">
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-200 transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center text-white text-xs font-bold">
                                    {user?.avatar}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-[10px] text-dark-600">{user?.title}</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-dark-600 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {profileOpen && (
                                <div className="absolute bottom-full left-0 w-full mb-2 glass-card p-2 slide-up">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main */}
            <main className="flex-1 lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-14 bg-dark/80 backdrop-blur-md border-b border-dark-300 flex items-center px-4 gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-dark-700 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        {unreadAlerts > 0 && (
                            <button onClick={() => navigate('/admin/alertas')} className="relative p-2 rounded-lg hover:bg-dark-200 transition-all">
                                <Bell className="w-4.5 h-4.5 text-dark-700" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-glow" />
                            </button>
                        )}
                        <span className="badge-blue border">ADMIN</span>
                    </div>
                </header>

                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
