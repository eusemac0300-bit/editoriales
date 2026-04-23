import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Building, Image as ImageIcon, Upload, CheckCircle2, AlertCircle, 
    Zap, Globe, Smartphone, ShieldCheck, Mail
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as db from '../../lib/supabaseService'
import { APP_VERSION } from '../../lib/version'

export default function Settings() {
    const { user, updateLogo } = useAuth()
    const [loading, setLoading] = useState(false)
    const [logoPreview, setLogoPreview] = useState(user?.tenantLogo || null)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const validateFile = (file) => {
        // 1. Tipo
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Formato no permitido. Usa PNG, JPG, SVG o WEBP.')
        }

        // 2. Peso (2MB)
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('El archivo es demasiado pesado (Máx 2MB).')
        }

        return true
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setError(null)
            setSuccess(null)
            validateFile(file)

            // Preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result)
            }
            reader.readAsDataURL(file)

            // Validar dimensiones
            const img = new Image()
            const objectUrl = URL.createObjectURL(file)
            img.src = objectUrl
            
            img.onload = async () => {
                URL.revokeObjectURL(objectUrl)
                if (img.width < 500 && img.height < 500) {
                    setError('La imagen es algo pequeña. Se recomienda al menos 500px para una mejor calidad en reportes.')
                }
                
                // Proceder con la carga
                setLoading(true)
                try {
                    const publicUrl = await db.uploadEditorialLogo(user.tenantId, file)
                    if (publicUrl) {
                        const updated = await db.updateTenantLogoInDb(user.tenantId, publicUrl)
                        if (updated) {
                            setSuccess('Logo actualizado correctamente.')
                            updateLogo(publicUrl) // Update global state
                        } else {
                            // Si falló el update en DB pero tenemos la URL pública, al menos actualizamos el estado local
                            // para que el usuario vea el cambio en esta sesión, avisando del error de persistencia.
                            updateLogo(publicUrl)
                            setError('El logo se subió pero no pudimos persistirlo en tu perfil global. Se verá en esta sesión, pero contacta a soporte para sincronizarlo permanentemente.')
                        }
                    }
                } catch (err) {
                    setError('Error al subir el archivo: ' + err.message)
                } finally {
                    setLoading(false)
                }
            }

        } catch (err) {
            setError(err.message)
        }
    }

    return (
       <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
           {/* Header */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                            <Zap className="w-8 h-8" />
                        </div>
                        Configuración Editorial
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 pl-1">
                        Personaliza tu branding y ajustes globales de la plataforma.
                    </p>
                </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Branding Card */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-dark-100 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-dark-300 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative group"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Identidad Visual (Logo)</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Este logo aparecerá en todas tus cotizaciones y comunicaciones oficiales.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* Dropzone */}
                            <div className="relative">
                                <label className="block">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                        disabled={loading}
                                    />
                                    <div className={`
                                        border-2 border-dashed rounded-3xl p-10 transition-all duration-300 cursor-pointer
                                        flex flex-col items-center justify-center gap-4 text-center
                                        ${loading ? 'bg-slate-50 dark:bg-dark-200 opacity-50' : 'hover:bg-slate-100 dark:hover:bg-dark-200 border-primary/20'}
                                        ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-dark-300'}
                                    `}>
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${error ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                            {loading ? <Zap className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Cargar nuevo logo</p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold opacity-60">SVG, PNG, JPG (Máx 2MB)</p>
                                        </div>
                                    </div>
                                </label>
                                
                                <AnimatePresence>
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <span className="font-medium">{error}</span>
                                        </motion.div>
                                    )}
                                    {success && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            <span className="font-bold">{success}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Preview Area */}
                            <div className="space-y-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Vistas de Contraste</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-white border border-slate-200 dark:border-none flex items-center justify-center p-6 overflow-hidden relative shadow-inner">
                                        <p className="absolute top-3 left-3 text-[9px] text-slate-400 font-black uppercase tracking-widest">Logo Light Mode</p>
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview Light" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="aspect-square rounded-[2rem] bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative shadow-2xl shadow-black/20 border border-white/5">
                                        <p className="absolute top-3 left-3 text-[9px] text-white/30 font-black uppercase tracking-widest">Logo Dark Mode</p>
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Preview Dark" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-slate-800" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Editorial Profile */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-dark-100 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-dark-300 shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-blue-400">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Perfil de la Editorial</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Información básica del negocio.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-black text-slate-400 group-focus-within:text-primary transition-colors uppercase tracking-widest">Nombre Legal / Comercial</label>
                                <input 
                                    type="text" 
                                    disabled
                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-slate-900 dark:text-white font-bold outline-none transition-all cursor-not-allowed opacity-70"
                                    defaultValue={user?.name || ''}
                                />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-black text-slate-400 group-focus-within:text-primary transition-colors uppercase tracking-widest">Email Corporativo</label>
                                <input 
                                    type="email" 
                                    disabled
                                    className="w-full h-14 px-5 rounded-2xl border border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-200 text-slate-900 dark:text-white font-bold outline-none transition-all cursor-not-allowed opacity-70"
                                    defaultValue={user?.email || ''}
                                />
                            </div>
                        </div>
                        <p className="mt-6 text-[10px] text-slate-400 font-medium">Los datos legales solo pueden ser modificados por un Super Administrador por razones de seguridad.</p>
                    </motion.div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-6 text-white shadow-xl shadow-primary/30 overflow-hidden relative group"
                    >
                        <Zap className="absolute -top-4 -right-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            Plan {user?.tenantPlan || 'Editorial Pro'}
                        </h3>
                        <p className="text-white/80 text-sm mb-4 leading-relaxed font-medium">Tienes acceso ilimitado a todas las herramientas de gestión y escandallos.</p>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            />
                        </div>
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Estado: Vitalicio / Activo</p>
                    </motion.div>

                    <div className="bg-white dark:bg-dark-100 rounded-3xl p-8 border border-slate-200 dark:border-dark-300 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ajustes Rápidos</h3>
                        
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-dark-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Idioma y Región</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-dark-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Alertas Móviles</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-dark-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Notificaciones Email</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-balance">
                            Editorial Pro CMS — {APP_VERSION} — {user?.tenantName || 'Standard'} Edition
                        </p>
                    </div>
                </div>
           </div>
       </div>
    )
}
