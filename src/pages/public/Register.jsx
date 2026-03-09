import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, AlertCircle, Building, User, Mail, Lock, CreditCard, Shield, ShieldCheck, ShieldAlert, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import * as db from '../../lib/supabaseService'

// ============ SECURITY UTILITIES ============

// Disposable email domains blacklist
const DISPOSABLE_DOMAINS = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'dispostable.com', 'maildrop.cc', 'temp-mail.org', '10minutemail.com',
    'trashmail.com', 'fakeinbox.com', 'mailnesia.com', 'tempail.com',
    'tempr.email', 'discard.email', 'burnermail.io', 'mohmal.com'
]

function isDisposableEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase()
    return DISPOSABLE_DOMAINS.some(d => domain === d || domain?.endsWith('.' + d))
}

function isValidEmailFormat(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
}

// Password strength checker
function getPasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: '', checks: {} }
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    }
    const score = Object.values(checks).filter(Boolean).length
    const labels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400']
    return { score, label: labels[score], color: colors[score], checks }
}

// Math CAPTCHA generator
function generateMathChallenge() {
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a, b, answer
    switch (op) {
        case '+': a = Math.floor(Math.random() * 30) + 5; b = Math.floor(Math.random() * 20) + 1; answer = a + b; break
        case '-': a = Math.floor(Math.random() * 30) + 15; b = Math.floor(Math.random() * 14) + 1; answer = a - b; break
        case '×': a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 9) + 2; answer = a * b; break
    }
    return { question: `${a} ${op} ${b}`, answer }
}

// Rate limiter
const RATE_LIMIT_KEY = 'reg_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 min

function getRateLimit() {
    try {
        const data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}')
        if (data.lockedUntil && Date.now() < data.lockedUntil) {
            return { locked: true, remaining: Math.ceil((data.lockedUntil - Date.now()) / 60000), attempts: data.count }
        }
        if (data.lockedUntil && Date.now() >= data.lockedUntil) {
            localStorage.removeItem(RATE_LIMIT_KEY)
            return { locked: false, remaining: 0, attempts: 0 }
        }
        return { locked: false, remaining: 0, attempts: data.count || 0 }
    } catch { return { locked: false, remaining: 0, attempts: 0 } }
}

function recordAttempt() {
    try {
        const data = JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '{}')
        const count = (data.count || 0) + 1
        if (count >= MAX_ATTEMPTS) {
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count, lockedUntil: Date.now() + LOCKOUT_MS }))
        } else {
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count }))
        }
    } catch { }
}

function clearAttempts() {
    localStorage.removeItem(RATE_LIMIT_KEY)
}

// ============ COMPONENT ============

export default function Register() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        editorialName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        plan: 'TRIAL'
    })

    // 🍯 Honeypot - invisible field that bots will fill
    const [honeypot, setHoneypot] = useState('')

    // ⏱️ Time gate - track when user started filling
    const formStartTime = useRef(Date.now())
    const MIN_FILL_TIME_MS = 3000 // 3 seconds minimum

    // 🧮 Math CAPTCHA
    const [challenge, setChallenge] = useState(() => generateMathChallenge())
    const [captchaAnswer, setCaptchaAnswer] = useState('')
    const [captchaVerified, setCaptchaVerified] = useState(false)

    // Password strength
    const passwordStrength = getPasswordStrength(formData.password)

    // Rate limit check
    const [rateLimit, setRateLimit] = useState(() => getRateLimit())

    useEffect(() => {
        if (rateLimit.locked) {
            const timer = setInterval(() => {
                const updated = getRateLimit()
                setRateLimit(updated)
                if (!updated.locked) clearInterval(timer)
            }, 30000)
            return () => clearInterval(timer)
        }
    }, [rateLimit.locked])

    const refreshCaptcha = useCallback(() => {
        setChallenge(generateMathChallenge())
        setCaptchaAnswer('')
        setCaptchaVerified(false)
    }, [])

    const verifyCaptcha = useCallback(() => {
        const userAnswer = parseInt(captchaAnswer, 10)
        if (userAnswer === challenge.answer) {
            setCaptchaVerified(true)
            return true
        }
        setCaptchaVerified(false)
        return false
    }, [captchaAnswer, challenge.answer])

    const handleNext = (e) => {
        e.preventDefault()

        // 🚦 Rate limit check
        const rl = getRateLimit()
        if (rl.locked) {
            setError(`Demasiados intentos. Espera ${rl.remaining} minuto(s) antes de intentar de nuevo.`)
            setRateLimit(rl)
            return
        }

        // 🍯 Honeypot check
        if (honeypot) {
            // Silently fail - don't tell bots
            console.warn('[Security] Honeypot triggered')
            setError('Error de validación. Intente nuevamente.')
            return
        }

        // ⏱️ Time gate
        const elapsed = Date.now() - formStartTime.current
        if (elapsed < MIN_FILL_TIME_MS) {
            console.warn('[Security] Form filled too fast:', elapsed, 'ms')
            setError('Por favor, complete el formulario con calma.')
            return
        }

        // Basic required fields
        if (!formData.editorialName || !formData.adminName || !formData.adminEmail || !formData.password) {
            setError('Todos los campos son obligatorios')
            return
        }

        // ✉️ Email validation
        if (!isValidEmailFormat(formData.adminEmail)) {
            setError('El formato del correo electrónico no es válido')
            return
        }

        if (isDisposableEmail(formData.adminEmail)) {
            setError('No se permiten correos temporales o desechables. Usa un correo real.')
            return
        }

        // 🔒 Password strength - minimum acceptable
        if (passwordStrength.score < 3) {
            setError('La contraseña es demasiado débil. Necesita al menos 8 caracteres con mayúsculas, minúsculas y números.')
            return
        }

        setError('')
        setStep(2)
    }

    const handleRegister = async (e) => {
        e.preventDefault()

        // Rate limit
        const rl = getRateLimit()
        if (rl.locked) {
            setError(`Demasiados intentos. Espera ${rl.remaining} minuto(s).`)
            return
        }

        // Verify CAPTCHA
        if (!captchaVerified) {
            const ok = verifyCaptcha()
            if (!ok) {
                setError('La respuesta al desafío de seguridad es incorrecta.')
                recordAttempt()
                setRateLimit(getRateLimit())
                refreshCaptcha()
                return
            }
        }

        setLoading(true)
        setError('')

        try {
            const result = await db.createSaaSTenant(formData)
            if (result.success) {
                clearAttempts()
                alert(`¡Felicidades! Se ha creado el Workspace para "${formData.editorialName}" con el plan ${formData.plan}.\nRedirigiendo al login...`)
                navigate('/login')
            } else {
                recordAttempt()
                setRateLimit(getRateLimit())
                setError(result.error || 'Hubo un error al crear la cuenta.')
                setLoading(false)
            }
        } catch (err) {
            recordAttempt()
            setRateLimit(getRateLimit())
            setError('Error de conexión. Intente nuevamente.')
            setLoading(false)
        }
    }

    // Password strength indicator component
    const PasswordStrengthBar = () => {
        if (!formData.password) return null
        return (
            <div className="mt-3 space-y-2 slide-up">
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.score ? passwordStrength.color : 'bg-dark-300'}`} />
                    ))}
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium ${passwordStrength.score >= 4 ? 'text-emerald-400' : passwordStrength.score >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {passwordStrength.label}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                    {[
                        ['length', '8+ caracteres'],
                        ['uppercase', 'Mayúscula (A-Z)'],
                        ['lowercase', 'Minúscula (a-z)'],
                        ['number', 'Número (0-9)'],
                        ['special', 'Especial (!@#$)'],
                    ].map(([key, label]) => (
                        <span key={key} className={`flex items-center gap-1 ${passwordStrength.checks[key] ? 'text-emerald-400' : 'text-dark-500'}`}>
                            {passwordStrength.checks[key] ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    // If rate limited, show lockout screen
    if (rateLimit.locked) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/15 rounded-full blur-[120px] pointer-events-none" />
                <div className="w-full max-w-md relative z-10 fade-in">
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-3">Acceso Temporalmente Bloqueado</h1>
                        <p className="text-dark-600 text-sm mb-6">
                            Se detectaron demasiados intentos de registro. Por seguridad, debes esperar antes de intentar nuevamente.
                        </p>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                            <p className="text-red-400 text-lg font-bold">{rateLimit.remaining} min restante(s)</p>
                            <p className="text-dark-500 text-xs mt-1">El bloqueo se levantará automáticamente</p>
                        </div>
                        <Link to="/login" className="text-primary hover:text-primary-400 text-sm font-medium transition-colors">
                            ← Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        )
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
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm slide-up">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-dark-300 -z-10 -translate-y-1/2" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark-300 text-dark-600'}`}>1</div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark-300 text-dark-600'}`}>2</div>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleNext} className="space-y-5 slide-up" autoComplete="off">
                            {/* 🍯 Honeypot - invisible to humans, attractive to bots */}
                            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                                <label htmlFor="website">Website</label>
                                <input
                                    type="text"
                                    id="website"
                                    name="website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honeypot}
                                    onChange={e => setHoneypot(e.target.value)}
                                />
                            </div>

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
                                {formData.adminEmail && !isValidEmailFormat(formData.adminEmail) && (
                                    <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                                        <XCircle className="w-3 h-3" /> Formato de email inválido
                                    </p>
                                )}
                                {formData.adminEmail && isValidEmailFormat(formData.adminEmail) && isDisposableEmail(formData.adminEmail) && (
                                    <p className="text-[11px] text-orange-400 mt-1.5 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3" /> No se permiten correos temporales
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-dark-500 font-medium mb-1.5 block">Contraseña Maestra</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-500">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength="8"
                                        className="input-field pl-10 pr-10 h-11"
                                        placeholder="Mín. 8 caracteres"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-500 hover:text-dark-700 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthBar />
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

                            {/* 🧮 Math CAPTCHA */}
                            <div className="p-4 rounded-xl bg-dark-200/50 border border-dark-300 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-4 h-4 text-primary-300" />
                                    <span className="text-xs font-semibold text-dark-700 uppercase tracking-wider">Verificación de Seguridad</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="text-sm text-dark-600 mb-2">Resuelve: <span className="text-white font-bold text-base">{challenge.question} = ?</span></p>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                required
                                                className="input-field h-10 w-28 text-center text-lg font-bold"
                                                placeholder="?"
                                                value={captchaAnswer}
                                                onChange={e => {
                                                    setCaptchaAnswer(e.target.value)
                                                    setCaptchaVerified(false)
                                                }}
                                                disabled={captchaVerified}
                                            />
                                            <button
                                                type="button"
                                                onClick={verifyCaptcha}
                                                disabled={captchaVerified || !captchaAnswer}
                                                className={`h-10 px-4 rounded-xl text-xs font-medium transition-all ${captchaVerified
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-primary/20 text-primary-300 border border-primary/30 hover:bg-primary/30'
                                                    }`}
                                            >
                                                {captchaVerified ? (
                                                    <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verificado</span>
                                                ) : 'Verificar'}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={refreshCaptcha}
                                        className="w-9 h-9 rounded-lg bg-dark-300 hover:bg-dark-400 flex items-center justify-center text-dark-600 hover:text-white transition-colors"
                                        title="Nuevo desafío"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                {captchaVerified && (
                                    <p className="text-[11px] text-emerald-400 flex items-center gap-1 slide-up">
                                        <CheckCircle2 className="w-3 h-3" /> Identidad humana verificada
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-dark-300">
                                <p className="text-xs text-emerald-400 mb-4 flex items-center justify-center gap-1 bg-emerald-400/10 py-2 rounded-lg font-medium">
                                    <CreditCard className="w-4 h-4" /> Tarjeta no requerida para 14 días gratis
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setStep(1); refreshCaptcha() }}
                                        className="h-11 px-6 rounded-xl border border-dark-300 text-dark-500 hover:text-white hover:bg-dark-200 font-medium text-sm transition-colors"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !captchaVerified}
                                        className={`flex-1 h-11 text-sm rounded-xl font-semibold transition-all ${captchaVerified
                                            ? 'btn-primary'
                                            : 'bg-dark-300 text-dark-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {loading ? 'Creando Workspace...' : !captchaVerified ? '🔒 Verifica el desafío' : 'Crear Workspace Libre'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <div className="flex items-center gap-1.5 text-dark-500 text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Protección Anti-Bot</span>
                    </div>
                    <div className="w-px h-3 bg-dark-400" />
                    <div className="flex items-center gap-1.5 text-dark-500 text-[10px]">
                        <Lock className="w-3.5 h-3.5 text-primary-300" />
                        <span>Contraseña Segura</span>
                    </div>
                    <div className="w-px h-3 bg-dark-400" />
                    <div className="flex items-center gap-1.5 text-dark-500 text-[10px]">
                        <Shield className="w-3.5 h-3.5 text-amber-500" />
                        <span>Rate Limiting</span>
                    </div>
                </div>

                <p className="text-center mt-4 text-sm text-dark-600">
                    ¿Ya tienes una cuenta SaaS?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-400 font-medium transition-colors">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
