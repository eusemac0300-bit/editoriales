import { Book, Video, FileText, ExternalLink, Sparkles, Map, MessageSquare, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { sendAdminNotification } from '../../lib/notificationService'

export default function Documentation() {
    const { t, user } = useAuth()
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [contactMessage, setContactMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

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

    return (
        <div className="space-y-8 fade-in p-4 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-xl backdrop-blur-md border border-primary/30">
                            <Book className="w-6 h-6 text-primary-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400">Knowledge Center</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Centro de Documentación</h1>
                    <p className="text-slate-400 font-medium max-w-md">Guías, flujos de trabajo y recursos expertos para potenciar tu gestión editorial.</p>
                </div>
                <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center hidden md:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Versión Actual</p>
                    <p className="text-2xl font-black text-white">v3.2.1.2</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="glass-card p-6 flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-300">
                        <div className={`w-14 h-14 ${section.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:rotate-6 transition-transform`}>
                            <section.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{section.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-dark-600 mb-6 flex-1">{section.description}</p>
                        {section.href ? (
                            <a 
                                href={section.href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm no-underline"
                            >
                                {section.label} <ExternalLink className="w-4 h-4" />
                            </a>
                        ) : section.action ? (
                            <button 
                                onClick={section.action} 
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm"
                            >
                                {section.label} <Map className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-slate-100 dark:bg-dark-300 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {section.label}
                            </div>
                        )}
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
                            ¿Necesitas una funcionalidad personalizada o soporte técnico avanzado?
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

            {/* Modal de Contacto */}
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
