import { 
    Book, Video, FileText, ExternalLink, Sparkles, Map, MessageSquare, Send, X,
    Code, Terminal, Download, Copy, Check, GitBranch, Key, Database, Layers,
    BookOpen, ShieldCheck, CheckCircle2, ChevronRight, Laptop, HelpCircle
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { sendAdminNotification } from '../../lib/notificationService'
import { APP_VERSION } from '../../lib/version'

export default function Documentation() {
    const { t, user } = useAuth()
    const [activeTab, setActiveTab] = useState('general') // 'general' | 'developer'
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [isDevManualModalOpen, setIsDevManualModalOpen] = useState(false)
    const [contactMessage, setContactMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [copiedKey, setCopiedKey] = useState('')

    const handleCopy = (text, key) => {
        if (!navigator.clipboard) return
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(''), 2500)
    }

    const handleSendConsultation = async () => {
        if (!contactMessage.trim()) return

        setIsSending(true)
        const success = await sendAdminNotification({
            subject: `Consulta de Soporte: ${user?.name || 'Usuario'} [${user?.tenantId || 'SaaS'}]`,
            message: `El usuario ${user?.name} (${user?.email}) del Workspace [${user?.workspaceName || user?.tenantId}] ha enviado la siguiente consulta:\n\n---\n${contactMessage}\n---`,
            type: 'Soporte Técnico / Funcionalidad Personalizada'
        })

        if (success) {
            alert('¡Consulta enviada! El consultor técnico se pondrá en contacto contigo pronto.')
            setIsContactModalOpen(false)
            setContactMessage('')
        } else {
            alert('Error al enviar la consulta. Por favor, inténtalo de nuevo más tarde.')
        }
        setIsSending(false)
    }

    const sections = [
        {
            title: 'Tour Virtual e Inducción',
            icon: Video,
            description: 'Recorrido visual guiado por las funcionalidades principales de la plataforma.',
            href: '/tour_plataforma.html',
            label: 'Abrir Tour Interactivo',
            color: 'bg-blue-500',
            isExternal: true
        },
        {
            title: 'Mapa de Navegación',
            icon: Map,
            description: 'Diagrama del flujo de trabajo: del catálogo a la liquidación de regalías.',
            href: '/ciclo_del_libro.pdf',
            label: 'Abrir Mapa de Proceso',
            color: 'bg-emerald-500',
            isExternal: true
        }
    ]

    const workflows = [
        { step: '1. Catálogo', desc: 'Crea tus Autores y Títulos. Define el PVP y los metadatos.' },
        { step: '2. Costos', desc: 'Usa el Escandallo para analizar la viabilidad de cada proyecto.' },
        { step: '3. Operación', desc: 'Gestiona el stock en Inventario y el progreso en Kanban.' },
        { step: '4. Comercial', desc: 'Registra Ventas y gestiona Consignaciones en librerías.' },
        { step: '5. Cierre', desc: 'Monitorea el Cashflow y genera Liquidaciones para autores.' }
    ]

    const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co'
    const currentSupabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui'
    const envSnippet = `# Configuración de Supabase para desarrollo local\nVITE_SUPABASE_URL=${currentSupabaseUrl}\nVITE_SUPABASE_ANON_KEY=${currentSupabaseAnon}`
    const cloneSnippet = `git clone https://github.com/eusemac0300-bit/editoriales.git\ncd editoriales\nnpm install\nnpm run dev`

    return (
        <div className="space-y-8 fade-in p-4 max-w-6xl mx-auto">
            {/* Header Principal */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/20 rounded-2xl backdrop-blur-md border border-primary/30 shadow-lg shadow-primary/20">
                            <Book className="w-6 h-6 text-primary-400" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-primary-400">Knowledge & Developer Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Centro de Guía y Ayuda</h1>
                    <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
                        Documentación editorial, procesos de negocio y kit completo de código fuente y arquitectura técnica para programadores.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-3xl text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versión Activa</p>
                        <p className="text-2xl font-black text-white flex items-center justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {APP_VERSION}
                        </p>
                    </div>
                </div>
            </header>

            {/* Selector de Pestañas (Editorial vs Desarrollador) */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-dark-100/60 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-sm max-w-md">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                        activeTab === 'general'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <BookOpen className="w-4 h-4 text-primary" /> Guía y Procesos
                </button>
                <button
                    onClick={() => setActiveTab('developer')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 relative ${
                        activeTab === 'developer'
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <Code className="w-4 h-4" /> Zona Programador
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white uppercase tracking-tighter">
                        Dev Kit
                    </span>
                </button>
            </div>

            {/* ===================== TAB 1: GUÍA GENERAL ===================== */}
            {activeTab === 'general' && (
                <div className="space-y-8 fade-in">
                    {/* Tarjeta Destacada de Acceso al Código */}
                    <div className="p-6 rounded-[2rem] bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-2 border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
                                <Code className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">¿Vas a compartir el proyecto con un programador?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Preparamos el código fuente completo (.ZIP), manual técnico, repositorio GitHub y variables de conexión listos para entregar.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('developer')}
                            className="btn-primary py-3 px-6 text-xs whitespace-nowrap flex items-center gap-2 shrink-0 shadow-lg shadow-primary/20"
                        >
                            Ver Kit del Desarrollador <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="glass-card p-6 flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-300">
                                <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:rotate-6 transition-transform`}>
                                    <section.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{section.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-dark-600 mb-6 flex-1">{section.description}</p>
                                <a 
                                    href={section.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm no-underline"
                                >
                                    {section.label} <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6" id="workflow-section">
                            <div className="glass-card p-8 bg-gradient-to-br from-white to-slate-50 dark:from-dark-100 dark:to-dark-200">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                                    <Sparkles className="w-6 h-6 text-primary" /> El Ciclo de Vida Editorial
                                </h2>
                                <div className="relative space-y-8 pl-4 border-l-2 border-slate-200 dark:border-dark-300">
                                    {workflows.map((flow, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[2.25rem] top-0 w-8 h-8 rounded-full bg-white dark:bg-dark-100 border-2 border-primary flex items-center justify-center text-primary text-xs font-black shadow-sm">
                                                {i + 1}
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{flow.step}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{flow.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 font-mono">Ayuda Experta</h4>
                                <p className="text-xs text-slate-600 dark:text-dark-700 leading-relaxed mb-4">
                                    ¿Necesitas una funcionalidad personalizada o soporte técnico avanzado para tu editorial?
                                </p>
                                <button 
                                    onClick={() => setIsContactModalOpen(true)}
                                    className="w-full py-3 bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all hover:border-primary/30 shadow-sm hover:shadow-primary/10"
                                >
                                    Contactar Consultor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== TAB 2: ZONA PROGRAMADOR ===================== */}
            {activeTab === 'developer' && (
                <div className="space-y-8 fade-in">
                    {/* Tarjetas Principales de Descarga y Accesos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Descarga Código ZIP */}
                        <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between border-2 border-primary/20 relative overflow-hidden group hover:border-primary transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary/30 mb-4 group-hover:scale-110 transition-transform">
                                    <Download className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Archivo Limpio</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">Código Fuente (.ZIP)</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Descarga el paquete completo del proyecto (1.3 MB) listo para descomprimir, instalar dependencias y ejecutar.
                                </p>
                            </div>
                            <a
                                href="https://github.com/eusemac0300-bit/editoriales/archive/refs/heads/main.zip"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-xs font-bold no-underline shadow-lg shadow-primary/25"
                            >
                                <Download className="w-4 h-4" /> Descargar Código (.ZIP)
                            </a>
                        </div>

                        {/* 2. Repositorio GitHub */}
                        <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-slate-400 transition-all">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                                    <GitBranch className="w-6 h-6 text-primary-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Control de Versiones</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">Repositorio GitHub</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Código fuente versionado con historial de commits, ramas y despliegue automático conectado con Vercel.
                                </p>
                            </div>
                            <a
                                href="https://github.com/eusemac0300-bit/editoriales"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 no-underline transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" /> Abrir en GitHub
                            </a>
                        </div>

                        {/* 3. Manual del Desarrollador */}
                        <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between border border-slate-200 dark:border-white/10 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 group-hover:scale-110 transition-transform">
                                    <Terminal className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Arquitectura & Guía</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">Manual Técnico</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Documento completo sobre Multi-tenancy, The Big Load, React Query v5, cálculos de IVA y estructura de Supabase.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsDevManualModalOpen(true)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4" /> Leer Manual
                                </button>
                                <a
                                    href="/manual_desarrollador.md"
                                    download="DEVELOPER_MANUAL.md"
                                    title="Descargar archivo Markdown"
                                    className="px-3 py-3 bg-slate-100 dark:bg-dark-200 hover:bg-slate-200 dark:hover:bg-dark-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center no-underline transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Paso a Paso para el Programador (Terminal) */}
                    <div className="glass-card p-8 rounded-[2.5rem] bg-slate-950 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                            <div>
                                <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mb-1">
                                    <Laptop className="w-4 h-4" /> Inicio Rápido Local
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Comandos para Clonar y Levantar</h2>
                            </div>
                            <button
                                onClick={() => handleCopy(cloneSnippet, 'clone')}
                                className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-white/10 active:scale-95"
                            >
                                {copiedKey === 'clone' ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-400" /> ¡Comandos Copiados!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" /> Copiar Comandos
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 space-y-4 font-mono text-xs">
                            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-slate-300 space-y-2 overflow-x-auto">
                                <p className="text-slate-500 font-sans text-[11px]"># 1. Clonar el repositorio oficial desde GitHub</p>
                                <p className="text-emerald-400 font-bold select-all">git clone https://github.com/eusemac0300-bit/editoriales.git</p>
                                <p className="text-slate-500 font-sans text-[11px] pt-2"># 2. Entrar en la carpeta e instalar las dependencias con Node 18+</p>
                                <p className="text-emerald-400 font-bold select-all">cd editoriales && npm install</p>
                                <p className="text-slate-500 font-sans text-[11px] pt-2"># 3. Iniciar el entorno de desarrollo local con Vite (puerto 5173)</p>
                                <p className="text-emerald-400 font-bold select-all">npm run dev</p>
                            </div>
                        </div>
                    </div>

                    {/* Variables de Entorno & Configuración Supabase */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Variables .env */}
                        <div className="glass-card p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Key className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Variables de Entorno (.env)</h3>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(envSnippet, 'env')}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                        {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedKey === 'env' ? 'Copiado' : 'Copiar .env'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    Crea un archivo <code className="bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> en la raíz del proyecto con estas variables:
                                </p>
                                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1">
                                    <p className="text-slate-400">VITE_SUPABASE_URL={currentSupabaseUrl}</p>
                                    <p className="text-slate-400">VITE_SUPABASE_ANON_KEY={currentSupabaseAnon.slice(0, 25)}...</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                La ANON KEY es pública por diseño en Supabase; las tablas están protegidas por Row Level Security (RLS).
                            </p>
                        </div>

                        {/* Base de Datos & Migraciones */}
                        <div className="glass-card p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Database className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Base de Datos PostgreSQL (Supabase)</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                    Todos los scripts SQL y migraciones están incluidos en la carpeta <code className="bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded text-[11px] font-mono">/supabase</code> del proyecto:
                                </p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-2">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span><strong>init_database_full.sql</strong>: Esquema completo inicial con tablas, relaciones y datos base.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <span><strong>add_tenant_logo_url.sql</strong>: Soporte de personalización de logo para marcas blancas.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] text-blue-400 font-medium">
                                💡 Cada consulta debe incluir <code className="font-mono">.eq('tenant_id', tenantId)</code> para garantizar el aislamiento multi-inquilino.
                            </div>
                        </div>
                    </div>

                    {/* Cuentas de Acceso para Pruebas Locales */}
                    <div className="glass-card p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-purple-500" />
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Credenciales para Pruebas en Entorno Local</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-dark-200 px-2.5 py-1 rounded-lg">
                                Roles & Testing
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                            El programador puede ingresar con estas cuentas para probar los diferentes niveles de permisos:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-dark-300 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        <th className="pb-3 px-2">Rol</th>
                                        <th className="pb-3 px-2">Correo</th>
                                        <th className="pb-3 px-2">Contraseña</th>
                                        <th className="pb-3 px-2">Acceso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-dark-300 font-mono text-[11px]">
                                    <tr>
                                        <td className="py-3 px-2 font-sans font-bold text-primary">ADMIN (Editorial)</td>
                                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">admin@editorial.cl</td>
                                        <td className="py-3 px-2 font-bold text-emerald-500">admin123</td>
                                        <td className="py-3 px-2 font-sans text-slate-500">Gestión total del catálogo, inventario y finanzas</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 font-sans font-bold text-purple-500">SUPERADMIN (Dueño)</td>
                                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">eusemac@editorial.cl</td>
                                        <td className="py-3 px-2 font-bold text-emerald-500">Marca2022#1</td>
                                        <td className="py-3 px-2 font-sans text-slate-500">Panel global, gestión de tenants y altas</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 font-sans font-bold text-amber-500">TRIAL (Prueba)</td>
                                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">trial@editorial.cl</td>
                                        <td className="py-3 px-2 font-bold text-emerald-500">demo</td>
                                        <td className="py-3 px-2 font-sans text-slate-500">Acceso sandbox de evaluación inmediata</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 font-sans font-bold text-emerald-500">FREELANCE</td>
                                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">freelance@editorial.cl</td>
                                        <td className="py-3 px-2 font-bold text-emerald-500">free123</td>
                                        <td className="py-3 px-2 font-sans text-slate-500">Tablero Kanban y corrección asignada</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-2 font-sans font-bold text-indigo-500">AUTOR</td>
                                        <td className="py-3 px-2 text-slate-700 dark:text-slate-300">autor@editorial.cl</td>
                                        <td className="py-3 px-2 font-bold text-emerald-500">autor123</td>
                                        <td className="py-3 px-2 font-sans text-slate-500">Portal de autor: regalías y liquidaciones</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Visor Completo del Manual del Desarrollador */}
            {isDevManualModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsDevManualModalOpen(false)} />
                    <div className="relative bg-white dark:bg-dark-100 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-dark-300 flex flex-col overflow-hidden slide-up">
                        {/* Cabecera del Modal */}
                        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Manual del Desarrollador - Editorial Pro (SaaS)</h3>
                                    <p className="text-xs text-slate-400">Arquitectura de datos, flujo de estado y estándares de código</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="/manual_desarrollador.md"
                                    download="DEVELOPER_MANUAL.md"
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors no-underline"
                                >
                                    <Download className="w-3.5 h-3.5" /> Descargar .MD
                                </a>
                                <button
                                    onClick={() => setIsDevManualModalOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Contenido con Scroll */}
                        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            <section>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" /> 1. Stack Tecnológico (Front-end)
                                </h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>Framework Core:</strong> React 18 cargado con <strong>Vite</strong>.</li>
                                    <li><strong>Enrutamiento:</strong> <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">react-router-dom</code> (v6).</li>
                                    <li><strong>Estilos:</strong> Tailwind CSS con variables personalizadas para tema oscuro/claro y colores primarios.</li>
                                    <li><strong>Gestor de Estado del Servidor:</strong> <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">@tanstack/react-query</code> (React Query v5).</li>
                                    <li><strong>Backend as a Service:</strong> Supabase (PostgreSQL + Auth + Storage).</li>
                                    <li><strong>Iconografía:</strong> <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">lucide-react</code>.</li>
                                </ul>
                            </section>

                            <section className="pt-4 border-t border-slate-100 dark:border-dark-300">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-blue-500" /> 2. Arquitectura de Datos y Estado Global
                                </h4>
                                <div className="space-y-3">
                                    <p>
                                        <strong>2.1 Multi-tenancy:</strong> La plataforma opera como SaaS puro. Cada cuenta principal de editorial tiene un <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">tenant_id</code> único. <em>Casi todas las tablas de la base de datos incluyen la columna tenant_id</em>. Nunca se debe omitir este filtro para evitar filtraciones cruzadas entre clientes.
                                    </p>
                                    <p>
                                        <strong>2.2 Carga de Datos Instantánea (The "Big Load"):</strong> Todo se carga de un solo golpe al iniciar sesión con <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">loadAllData()</code> en <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">src/lib/supabaseService.js</code>. Al ejecutar mutaciones, se invalida la query key <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">['editorialData', tenantId]</code> en <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">src/hooks/useEditorialData.js</code>.
                                    </p>
                                    <p>
                                        <strong>2.3 Proveedor de Contexto:</strong> <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">src/context/AuthContext.jsx</code> actúa como el Single Source of Truth, inyectando login, logout y metadatos completos.
                                    </p>
                                    <p>
                                        <strong>2.4 Gestión Dinámica de Impuestos (IVA):</strong> La tasa actual (<code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">taxRate</code>) se consume desde <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">useAuth()</code>. Para convertir de Bruto a Neto: <code className="font-mono bg-slate-100 dark:bg-dark-200 px-1 py-0.5 rounded">valorBruto / (1 + taxRate / 100)</code>.
                                    </p>
                                </div>
                            </section>

                            <section className="pt-4 border-t border-slate-100 dark:border-dark-300">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-purple-500" /> 3. Roles y Permisos
                                </h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li><strong>SUPERADMIN:</strong> Dueño original del software; gestiona usuarios, tenants y altas (<code className="font-mono">pages/superadmin</code>).</li>
                                    <li><strong>ADMIN:</strong> Dueño/Gerente de la editorial; acceso completo al workspace (<code className="font-mono">layouts/AdminLayout.jsx</code>).</li>
                                    <li><strong>AUTOR:</strong> Portal restringido para ver liquidación de regalías y libros propios.</li>
                                    <li><strong>FREELANCE:</strong> Acceso a Kanban para avanzar libros en producción.</li>
                                </ul>
                            </section>

                            <section className="pt-4 border-t border-slate-100 dark:border-dark-300">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-emerald-500" /> 4. Comandos de Producción
                                </h4>
                                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                                    <p><span className="text-slate-500"># Entorno local:</span> npm run dev</p>
                                    <p><span className="text-slate-500"># Compilación de producción:</span> npm run build</p>
                                    <p><span className="text-slate-500"># Despliegue en Vercel:</span> npx vercel --prod --yes</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Contacto Editorial */}
            {isContactModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
                    <div className="relative bg-white dark:bg-dark-100 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-dark-300 overflow-hidden slide-up">
                        <div className="bg-primary p-8 text-white relative">
                            <div className="absolute top-4 right-4">
                                <button onClick={() => setIsContactModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <MessageSquare className="w-10 h-10 mb-4 opacity-50" />
                            <h3 className="text-2xl font-black tracking-tight">Nueva Consulta</h3>
                            <p className="text-primary-100 text-sm mt-1">Escribe tu solicitud y el consultor técnico se contactará contigo.</p>
                        </div>
                        <div className="p-8">
                            <textarea
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                placeholder="Ej: Me gustaría integrar mi tienda Shopify con el inventario..."
                                className="w-full h-40 bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-dark-300 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                            />
                            <button
                                onClick={handleSendConsultation}
                                disabled={isSending || !contactMessage.trim()}
                                className="w-full mt-6 btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                            >
                                {isSending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Enviar Consulta <Send className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
