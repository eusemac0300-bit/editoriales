import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { changeUserPassword } from '../../lib/supabaseService'
import { ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function FirstLoginPassword() {
    const { user, logout } = useAuth()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    if (!user) {
        navigate('/login')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }

        setLoading(true)
        try {
            const ok = await changeUserPassword(user.id, password)
            if (ok) {
                setSuccess(true)
                setTimeout(() => {
                    // We need to re-login or at least update the context. 
                    // To keep it simple, we ask them to login again with the new password
                    // or just redirect them to their home since changeUserPassword sets first_login to false.
                    // But our context is still stale. Let's logout and redirect to login.
                    logout()
                    navigate('/login?active=true')
                }, 3000)
            } else {
                setError('No se pudo actualizar la contraseña. Reintente.')
            }
        } catch (err) {
            setError('Error de servidor.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark p-4">
                <div className="w-full max-w-md glass-card p-10 text-center space-y-6 slide-up">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white italic">¡CUENTA ACTIVADA!</h2>
                        <p className="text-dark-600 text-sm">Tu contraseña ha sido actualizada con éxito. Serás redirigido para iniciar sesión con tus nuevas credenciales.</p>
                    </div>
                    <div className="h-1 w-full bg-dark-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-progress" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10 fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg mb-4">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white italic truncate px-2 uppercase tracking-tight">Activa tu Cuenta</h1>
                    <p className="text-dark-500 mt-2 text-sm max-w-[280px] mx-auto">Hola <span className="text-white font-bold">{user.name}</span>, por seguridad debes establecer tu contraseña personal.</p>
                </div>

                <div className="glass-card p-8 md:p-10 border-emerald-500/10">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold slide-up flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                                <input
                                    required
                                    type="password"
                                    className="input-field h-12 w-full pl-11 bg-dark-900/50 border-white/5 focus:border-emerald-500/50"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-dark-500 uppercase tracking-widest ml-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                                <input
                                    required
                                    type="password"
                                    className="input-field h-12 w-full pl-11 bg-dark-900/50 border-white/5 focus:border-emerald-500/50"
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <ul className="space-y-2 py-2">
                            <li className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${password.length >= 6 ? 'text-emerald-400' : 'text-dark-600'}`}>
                                <CheckCircle2 className="w-3 h-3" /> AL MENOS 6 CARACTERES
                            </li>
                            <li className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${password && password === confirmPassword ? 'text-emerald-400' : 'text-dark-600'}`}>
                                <CheckCircle2 className="w-3 h-3" /> LAS CONTRASEÑAS COINCIDEN
                            </li>
                        </ul>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Activar mi Acceso <ArrowRight className="w-4 h-4 text-white/50" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-[11px] text-dark-500 font-medium">
                    © 2026 Editorial Pro Cloud. Todos los derechos reservados.
                </p>
            </div>
        </div>
    )
}
