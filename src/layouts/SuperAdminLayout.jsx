import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, LogOut, Menu, X, ChevronDown, Rocket } from 'lucide-react'

export default function SuperAdminLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-dark flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-100 border-r border-dark-300 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-300">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-sm">SaaS Master</h1>
                            <p className="text-[10px] text-dark-600">Plataforma SuperAdministrador</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-dark-600 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1">
                        <NavLink
                            to="/superadmin"
                            end
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>Editoriales SaaS</span>
                        </NavLink>
                    </nav>

                    <div className="px-3 py-4 border-t border-dark-300">
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-200 transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-xs font-bold">
                                    {(user?.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-[10px] text-dark-600">Fundador</p>
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

            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <main className="flex-1 lg:ml-64">
                <header className="sticky top-0 z-30 h-14 bg-dark/80 backdrop-blur-md border-b border-dark-300 flex items-center px-4 gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-dark-700 hover:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <span className="badge border border-purple-500/50 bg-purple-500/10 text-purple-400">SUPERADMIN</span>
                    </div>
                </header>
                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
