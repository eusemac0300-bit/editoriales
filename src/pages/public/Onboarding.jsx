import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2, User, Mail, FileText, Upload, CheckCircle2,
    AlertCircle, ArrowRight, ShieldCheck, Globe, MapPin, Camera, RefreshCw, Sparkles
} from 'lucide-react'
import { submitOnboardingRequest } from '../../lib/supabaseService'
import { sendAdminNotification } from '../../lib/notificationService'
import { supabase } from '../../lib/supabase'

export default function Onboarding() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        editorial_name: '',
        admin_name: '',
        admin_email: '',
        tax_id: '',
        address: '',
        validation_screenshot_url: ''
    })

    const fileInputRef = useRef(null)

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen es demasiado grande. Máximo 5MB.')
            return
        }

        setUploading(true)
        setError('')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `validations/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('onboarding')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('onboarding')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, validation_screenshot_url: publicUrl }))
        } catch (err) {
            console.error('Error uploading file:', err)
            setError('Error al subir la imagen. Intenta nuevamente.')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()


        setLoading(true)
        setError('')

        try {
            await submitOnboardingRequest(formData)
            
            // Notificamos a Euse (automático)
            try {
                const message = `Se ha recibido una nueva solicitud de demo:\nEditorial: ${formData.editorial_name}\nNombre: ${formData.admin_name}\nEmail: ${formData.admin_email}\nPaís: ${formData.country}\n\nRevisar en el Panel de SuperAdmin: https://editoriales.vercel.app/superadmin`;
                await sendAdminNotification({
                    subject: `Nueva Demo Solicitada: ${formData.editorial_name}`,
                    message: message,
                    type: 'Onboarding'
                });
            } catch (notifyError) {
                console.warn('Silent notification error:', notifyError);
            }

            setSuccess(true)
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err) {
            console.error('Error submitting onboarding:', err)
            setError('Hubo un error al enviar tu solicitud. Intenta nuevamente.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <div className="max-w-md w-full glass-card p-10 text-center space-y-6 slide-up">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">¡Solicitud Enviada!</h1>
                    <p className="text-dark-600 leading-relaxed">
                        Hemos recibido los datos de de <strong>{formData.editorial_name}</strong>.
                        Nuestro equipo de SuperAdmins revisará la información y la captura de validación.
                    </p>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 text-sm text-left space-y-3">
                        <p className="text-emerald-400 font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Tip de acceso rápido:
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                            Hemos cargado <strong>10 libros de ejemplo</strong> y registros de venta ficticios para que puedas practicar con todas las herramientas desde el primer minuto.
                        </p>
                        <p className="text-slate-500 text-xs italic">
                            💡 Podrás eliminar estos ejemplos con un solo clic en tu Dashboard cuando estés listo para cargar tus datos reales.
                        </p>
                    </div>
                    <div className="bg-dark-200/50 border border-dark-300 rounded-xl p-4 text-xs text-dark-500">
                        Te enviaremos un correo a <strong>{formData.admin_email}</strong> con el enlace de acceso y tus credenciales una vez aprobada tu cuenta.
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary w-full h-12 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        Volver al inicio <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects - More vibrant for better contrast */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl w-full grid md:grid-cols-5 gap-12 items-center relative z-10">
                {/* Information Column */}
                <div className="md:col-span-2 space-y-10 py-6">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-primary/10">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black text-white leading-tight tracking-tighter">
                                Valida tu <span className="text-primary text-glow block sm:inline">Editorial</span>
                            </h1>
                            <div className="h-1.5 w-24 bg-primary rounded-full shadow-lg shadow-primary/50" />
                        </div>
                        <p className="text-slate-300 text-lg leading-relaxed font-medium">
                            Para garantizar la seguridad de nuestra comunidad SaaS, requerimos validar la existencia legal de cada editorial antes de activar el workspace.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base">Validación Segura</h4>
                                <p className="text-sm text-slate-400 mt-0.5">Tus datos están encriptados y solo son vistos por los SuperAdmins.</p>
                            </div>
                        </div>
                        <div className="flex gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base">Activación Global</h4>
                                <p className="text-sm text-slate-400 mt-0.5">Una vez aprobado, tu editorial tendrá acceso a todas las herramientas cloud.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex gap-4 backdrop-blur-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                            <strong className="text-emerald-400">Próximo paso:</strong> Una vez enviada la solicitud, nuestro equipo la revisará de inmediato para activar su Workspace personalizado.
                        </p>
                    </div>
                </div>

                {/* Form Column */}
                <div className="md:col-span-3 glass-card bg-slate-900/40 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                    
                    {error && (
                        <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-300 text-sm slide-up font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Editorial</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                        placeholder="Ej: Gato Azul"
                                        value={formData.editorial_name}
                                        onChange={e => setFormData({ ...formData, editorial_name: e.target.value })}
                                    />
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">RUT / Tax ID</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                        placeholder="77.XXX.XXX-X"
                                        value={formData.tax_id}
                                        onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                                    />
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre Administrador</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                        placeholder="Juan Pérez"
                                        value={formData.admin_name}
                                        onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email de Contacto</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="email"
                                        className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                        placeholder="admin@editorial.com"
                                        value={formData.admin_email}
                                        onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dirección Comercial</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="input-field h-14 w-full pl-12 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10"
                                    placeholder="Av. Providencia 1234, Santiago"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className={`
                                w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-300
                                ${loading || uploading
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary to-blue-600 hover:to-primary text-white shadow-[0_10px_30px_rgba(19,127,236,0.3)] hover:shadow-[0_15px_40px_rgba(19,127,236,0.4)] hover:scale-[1.02] active:scale-[0.98]'}
                            `}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" /> Procesando...
                                </span>
                            ) : 'Enviar para Validación Master'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
