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
                const routes = { ADMIN: '/admin', FREELANCE: '/freelance', AUTOR: '/autor' }
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
        <div className="min-h-screen flex items-center justify-center bg-dark p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md relative z-10 fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-700 shadow-lg shadow-primary/30 mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Editorial Pro</h1>
                    <p className="text-dark-600 mt-1 text-sm">Gestión editorial profesional</p>
                </div>

                {/* Login card */}
                <div className="glass-card p-8">
                    <h2 className="text-lg font-semibold text-white mb-6">Iniciar Sesión</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm slide-up">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="tu@email.cl"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field pl-10"
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
                <div className="mt-6 glass-card p-4">
                    <p className="text-xs font-medium text-dark-600 uppercase tracking-wider mb-3">Usuarios de prueba</p>
                    <div className="space-y-2">
                        {demoUsers.map(u => (
                            <button
                                key={u.email}
                                onClick={() => { setEmail(u.email); setPassword(u.pass) }}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-dark-50 hover:bg-dark-200 transition-all duration-200 group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${u.color} border`}>{u.role}</span>
                                    <span className="text-sm text-dark-800">{u.email}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-dark-500 group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
