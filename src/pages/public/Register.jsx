import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, AlertCircle, Building, User, Mail, Lock, CreditCard } from 'lucide-react'
import * as db from '../../lib/supabaseService'

export default function Register() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        editorialName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        plan: 'TRIAL'
    })

    const handleNext = (e) => {
        e.preventDefault()
        if (step === 1 && (!formData.editorialName || !formData.adminName || !formData.adminEmail || !formData.password)) {
            setError('Todos los campos de la cuenta son obligatorios')
            return
        }
        setError('')
        setStep(2)
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await db.createSaaSTenant(formData)
            if (result.success) {
                alert(`¡Felicidades! Se ha creado el Workspace para "${formData.editorialName}" con el plan ${formData.plan}.\nRedirigiendo al login...`)
                navigate('/login')
            } else {
                setError(result.error || 'Hubo un error al crear la cuenta.')
                setLoading(false)
            }
        } catch (err) {
            setError('Error de conexión. Intente nuevamente.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 selection:bg-primary/30 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 fade-in">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 mb-6 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                        <BookOpen className="w-8 h-8 text-white" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Potencia tu Editorial</h1>
                    <p className="text-dark-600 mt-2">Control total sobre tus escandallos, regalías y catálogo</p>
                </div>

                <div className="glass-card p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-dark-300 -z-10 -translate-y-1/2" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark-300 text-dark-600'}`}>1</div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark-300 text-dark-600'}`}>2</div>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleNext} className="space-y-5 slide-up">
                            <div>
                                <label className="text-xs text-dark-500 font-medium mb-1.5 block">Nombre de tu Editorial</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="input-field pl-10 h-11"
                                        placeholder="Ej: Ediciones El Faro"
                                        value={formData.editorialName}
                                        onChange={e => setFormData({ ...formData, editorialName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-dark-500 font-medium mb-1.5 block">Tu Nombre (Administrador)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="input-field pl-10 h-11"
                                            placeholder="Juan Pérez"
                                            value={formData.adminName}
                                            onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-dark-500 font-medium mb-1.5 block">Correo de Trabajo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="input-field pl-10 h-11"
                                        placeholder="admin@editorial.cl"
                                        value={formData.adminEmail}
                                        onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-dark-500 font-medium mb-1.5 block">Contraseña Maestra</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        className="input-field pl-10 h-11"
                                        placeholder="Mín. 6 caracteres"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full h-11 mt-6 text-sm">
                                Continuar
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6 slide-up">
                            <h3 className="text-lg font-bold text-white text-center">Confirmación</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-5 rounded-xl border border-primary bg-primary/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-bold text-white text-base">Plan PRO (14 días gratis)</p>
                                            <p className="text-sm text-dark-500 mt-1">
                                                Acceso total a todas las herramientas SaaS para tu equipo.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-primary text-xl">
                                            $50.000
                                        </span>
                                        <p className="text-xs text-dark-500">CLP / mes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dark-300">
                                <p className="text-xs text-emerald-400 mb-4 flex items-center justify-center gap-1 bg-emerald-400/10 py-2 rounded-lg font-medium">
                                    <CreditCard className="w-4 h-4" /> Tarjeta no requerida para 14 días gratis
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="h-11 px-6 rounded-xl border border-dark-300 text-dark-500 hover:text-white hover:bg-dark-200 font-medium text-sm transition-colors"
                                    >
                                        Volver
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary flex-1 h-11 text-sm">
                                        {loading ? 'Creando Workspace...' : 'Crear Workspace Libre'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center mt-8 text-sm text-dark-600">
                    ¿Ya tienes una cuenta SaaS?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-400 font-medium transition-colors">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
