import { Book, Video, FileText, ExternalLink, Sparkles, Map, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Documentation() {
    const { t } = useAuth()

    const sections = [
        {
            title: 'Tour Virtual e Inducción',
            icon: Video,
            description: 'Recorrido visual guiado por las funcionalidades principales de la plataforma.',
            action: () => window.open('/tour_plataforma.html', '_blank'),
            label: 'Abrir Tour Interactivo',
            color: 'bg-blue-500'
        },
        {
            title: 'Mapa de Navegación',
            icon: Map,
            description: 'Diagrama del flujo de trabajo: del catálogo a la liquidación de regalías.',
            action: () => document.getElementById('workflow-section')?.scrollIntoView({ behavior: 'smooth' }),
            label: 'Ver Mapa de Proceso',
            color: 'bg-emerald-500'
        }
    ]

    const handleDownload = (filename) => {
        const link = document.createElement('a');
        link.href = `/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

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
                    <p className="text-2xl font-black text-white">v3.1.5.80</p>
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
                        {section.action ? (
                            <button onClick={section.action} className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm">
                                {section.label} <ExternalLink className="w-4 h-4" />
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
                    <div className="glass-card p-6 border-l-4 border-l-purple-500">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Recursos Adicionales</h3>
                        <ul className="space-y-4">
                            <li 
                                onClick={() => handleDownload('ciclo_del_libro.pdf')}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-200 transition-colors cursor-pointer group"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-500">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-primary">Ciclo_del_Libro.pdf</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Diagrama de Proceso</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Ayuda Experta</h4>
                        <p className="text-xs text-slate-600 dark:text-dark-700 leading-relaxed mb-4">
                            ¿Necesitas una funcionalidad personalizada o soporte técnico avanzado?
                        </p>
                        <button className="w-full py-3 bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all">
                            Contactar Consultor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
