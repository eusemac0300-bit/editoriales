import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const result = await login(email, password)
            if (result.success) {
                if (result.user.firstLogin) {
                    navigate('/activar-cuenta')
                    return
                }
                const routes = { SUPERADMIN: '/superadmin', ADMIN: '/admin', FREELANCE: '/freelance', AUTOR: '/autor' }
                navigate(routes[result.user.role] || '/admin')
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError('Error de conexión. Intente nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    const demoUsers = [
        { email: 'admin@editorial.cl', pass: 'admin123', role: 'Admin', color: 'bg-primary/15 text-primary-300 border-primary/20' },
        { email: 'freelance@editorial.cl', pass: 'free123', role: 'Freelance', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
        { email: 'autor@editorial.cl', pass: 'autor123', role: 'Autor', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Animated background - More vibrant */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse pointer-events-none" />
                <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 fade-in">
                <div className="text-center mb-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 border-2 border-white/20">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter">
                                    Editorial <span className="text-primary">Pro</span>
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">v3.1.4 (AutoBook Pro)</p>
                        </div>
                    </div>
                </div>
                {/* Login card */}
                <div className="glass-card bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10">
                    <h2 className="text-xl font-black text-white mb-8 tracking-tight">Iniciar Sesión</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-field h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                    placeholder="tu@email.cl"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Acceder <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <a href="#" className="text-sm text-primary hover:text-primary-300 transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </div>

                {/* Demo users */}
                <div className="mt-8 glass-card bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">Acceso Rápido (Demo)</p>
                    <div className="space-y-3">
                        {demoUsers.map(u => (
                            <button
                                key={u.email}
                                onClick={() => { setEmail(u.email); setPassword(u.pass) }}
                                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${u.color} border border-current/20`}>{u.role}</span>
                                    <span className="text-xs text-slate-300 font-medium">{u.email}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
