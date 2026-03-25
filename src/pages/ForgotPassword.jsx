import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowLeft, KeyRound, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { sendAdminNotification } from '../lib/notificationService'

export default function ForgotPassword() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            // Check if user exists in our custom table first to give better feedback
            const { data, error: userError } = await supabase
                .from('users')
                .select('id, name')
                .eq('email', email)
                .single()

            if (userError || !data) {
                // To avoid email enumeration, we still show a generic success message
                // but technically we could send a notification to Euse about this attempt
                await new Promise(resolve => setTimeout(resolve, 1000))
                setMessage('Si el correo está registrado, recibirás instrucciones en unos minutos.')
                return
            }

            // In a real production app, we would use supabase.auth.resetPasswordForEmail(email)
            // But since this app uses a custom 'users' table for credentials, 
            // we will simulate the request and notify the SuperAdmin (Euse) via a log/table.
            
            // Notificamos a Euse
            try {
                await sendAdminNotification({
                    subject: 'Solicitud de Recuperación de Clave',
                    message: `El usuario ${data.name} (${email}) ha solicitado recuperar su acceso.\n\nPor favor, genera una nueva clave desde el panel de SuperAdmin si es necesario.`,
                    type: 'Password Recovery'
                });
            } catch (notifyError) {
                console.warn('Silent notify fail:', notifyError);
            }

            setMessage(`Hola ${data.name}, hemos recibido tu solicitud. Un administrador revisará tu cuenta y te contactará en ${email} para restablecer tu clave.`)
            
        } catch (err) {
            setError('Hubo un problema al procesar tu solicitud. Por favor intenta más tarde.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <KeyRound className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Recuperar Clave</h1>
                        <p className="text-slate-400 mt-2 text-sm">
                            Ingresa tu correo electrónico y te ayudaremos a recuperar el acceso a tu suite editorial.
                        </p>
                    </div>

                    {message ? (
                        <div className="space-y-6 slide-up">
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                                <p className="text-emerald-100 text-sm leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary w-full h-12 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Volver al Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tu Correo</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="email"
                                        className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-700"
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-300
                                    ${loading 
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                        : 'bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20'}
                                `}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" /> Procesando...
                                    </span>
                                ) : 'Solicitar Acceso'}
                            </button>

                            <Link 
                                to="/login" 
                                className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" /> Cancelar y volver
                            </Link>
                        </form>
                    )}
                </div>
                
                <p className="text-center mt-10 text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
                    © {new Date().getFullYear()} Editorial Pro Suite • Soporte Global
                </p>
            </div>
        </div>
    )
}
