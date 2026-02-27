import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Kanban, LogOut, Menu, X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function FreelanceLayout() {
    const { user, logout, markFreelanceOnboarded } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [step, setStep] = useState(0)

    useEffect(() => {
        if (user?.firstLogin) setShowWelcome(true)
    }, [user])

    const handleCloseWelcome = () => {
        setShowWelcome(false)
        markFreelanceOnboarded()
    }

    const welcomeSteps = [
        { title: '¡Bienvenido al equipo!', desc: 'Como colaborador freelance, tendrás acceso al Tablero Kanban donde podrás gestionar las tareas asignadas a ti.' },
        { title: 'Tu Tablero Kanban', desc: 'Verás solo los libros que te han sido asignados. Puedes mover las tarjetas entre columnas según avances en tu trabajo.' },
        { title: 'Comentarios', desc: 'En cada libro podrás dejar comentarios para comunicarte con el editor. Usa las categorías para organizar el feedback.' },
        { title: '¡Listo para empezar!', desc: 'Si tienes dudas, contacta al Editor Jefe. ¡Éxito en tu trabajo!' },
    ]

    return (
        <>
            {/* Welcome modal */}
            {showWelcome && (
                <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
                    <div className="glass-card max-w-md w-full p-8 slide-up">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">{welcomeSteps[step].title}</h2>
                                <p className="text-xs text-dark-600">Paso {step + 1} de {welcomeSteps.length}</p>
                            </div>
                        </div>

                        <p className="text-dark-800 mb-6 leading-relaxed">{welcomeSteps[step].desc}</p>

                        {/* Progress */}
                        <div className="flex gap-2 mb-6">
                            {welcomeSteps.map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-dark-300'}`} />
                            ))}
                        </div>

                        <div className="flex justify-between">
                            {step > 0 && (
                                <button onClick={() => setStep(s => s - 1)} className="btn-secondary text-sm">
                                    Anterior
                                </button>
                            )}
                            <div className="flex-1" />
                            {step < welcomeSteps.length - 1 ? (
                                <button onClick={() => setStep(s => s + 1)} className="btn-primary text-sm flex items-center gap-2">
                                    Siguiente <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={handleCloseWelcome} className="btn-primary text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
                                    <CheckCircle2 className="w-4 h-4" /> Comenzar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-dark flex">
                <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-100 border-r border-dark-300 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-300">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-sm">Editorial Pro</h1>
                                <p className="text-[10px] text-emerald-400">Freelance</p>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-dark-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex-1 px-3 py-4 space-y-1">
                            <NavLink to="/freelance" end onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                                <Kanban className="w-4 h-4" /> Tablero Kanban
                            </NavLink>
                        </nav>

                        <div className="px-3 py-4 border-t border-dark-300">
                            <div className="flex items-center gap-3 p-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                                    {user?.avatar}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-[10px] text-dark-600">{user?.title}</p>
                                </div>
                            </div>
                            <button onClick={() => { logout(); navigate('/login') }} className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm">
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </aside>

                {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

                <main className="flex-1 lg:ml-64">
                    <header className="sticky top-0 z-30 h-14 bg-dark/80 backdrop-blur-md border-b border-dark-300 flex items-center px-4 gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-dark-700">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex-1" />
                        <span className="badge-green border">FREELANCE</span>
                    </header>
                    <div className="p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    )
}
