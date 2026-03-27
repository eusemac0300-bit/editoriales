import React from 'react'
import { LogOut, ShieldAlert, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function BlockedAccount() {
    const { logout, user } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="w-full max-w-md glass-card bg-slate-900/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-red-500/20 shadow-2xl relative z-10 text-center">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Vencimiento de Cuenta</h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Lo sentimos, el acceso para <span className="text-white font-bold italic">Editorial Pro</span> ha sido suspendido temporalmente.
                </p>

                <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left border border-white/5">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Razones posibles:</p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Pago de suscripción pendiente.
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Periodo de prueba finalizado.
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Dada de baja por el administrador.
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <a 
                        href="mailto:soporte@editorialpro.cl"
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 h-auto text-base group"
                    >
                        <Mail className="w-5 h-5" />
                        Contactar a Soporte
                    </a>

                    <button
                        onClick={handleLogout}
                        className="w-full py-4 text-sm font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Cerrar Sesión
                    </button>
                </div>
                
                <p className="mt-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-tight">
                        Editorial Pro <span className="text-red-500/50 block">Acceso Restringido</span>
                </p>
            </div>
        </div>
    )
}
