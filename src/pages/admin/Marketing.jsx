import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Instagram, Smartphone, Share2, Sparkles, Download,
    ArrowRight, Image as ImageIcon, MessageSquare,
    CheckCircle2, RefreshCw, Facebook, PlayCircle,
    Layout, Type, Palette
} from 'lucide-react'

export default function Marketing() {
    const { data, t } = useAuth()
    const [selectedBookId, setSelectedBookId] = useState('')
    const [platform, setPlatform] = useState('instagram_post')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState(null)
    const [step, setStep] = useState(1) // 1: Select, 2: Config, 3: Result

    const selectedBook = data?.books?.find(b => b.id === selectedBookId)

    const platforms = [
        { id: 'instagram_post', icon: Instagram, label: 'Instagram Post', aspect: '1:1' },
        { id: 'instagram_carousel', icon: Layout, label: 'Instagram Carousel', aspect: '1:1' },
        { id: 'instagram_story', icon: Smartphone, label: 'Story / Reel', aspect: '9:16' },
        { id: 'facebook_post', icon: Facebook, label: 'Facebook Post', aspect: '1.91:1' },
    ]

    const [carouselSlides, setCarouselSlides] = useState([
        { title: '', copy: '', image: '' },
        { title: '', copy: '', image: '' },
        { title: '', copy: '', image: '' }
    ])

    const handleGenerate = () => {
        if (!selectedBookId || !selectedBook) return
        setIsGenerating(true)

        // Simular generación por IA basada en datos reales
        setTimeout(() => {
            // Re-chequeo por seguridad dentro del timeout
            if (!selectedBook) {
                setIsGenerating(false)
                return
            }

            const cover = selectedBook.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
            
            if (platform === 'instagram_carousel') {
                setCarouselSlides([
                    { 
                        title: selectedBook.title || 'Título', 
                        copy: `¿Ya conoces la nueva obra de ${selectedBook.authorName || 'nuestro autor'}? ✨`, 
                        image: cover 
                    },
                    { 
                        title: 'Una historia única', 
                        copy: selectedBook.synopsis?.substring(0, 100) + '...' || 'Descubre esta increíble historia...', 
                        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800' 
                    },
                    { 
                        title: 'Disponible ahora', 
                        copy: `Consigue "${selectedBook.title || 'el libro'}" en nuestra web o librerías favoritas. 🛒`, 
                        image: cover 
                    }
                ])
            }

            setGeneratedContent({
                copy: `📚 ¡GRAN LANZAMIENTO! \n\nEstamos muy emocionados de presentar "${selectedBook.title || 'novedad'}" de ${selectedBook.authorName || 'la editorial'}. \n\n${selectedBook.synopsis?.substring(0, 150) || 'Una obra que redefine el género y nos invita a sumergirnos en una historia inolvidable.'}... \n\nYa disponible en todas las librerías. \n\n#EditorialPro #LibrosRecomendados #NovedadEditorial #LecturaRecomendada`,
                hashtags: `#${selectedBook.genre?.replace(/\s+/g, '') || 'Libros'} #bookstagram #${selectedBook.authorName?.replace(/\s+/g, '') || 'Autor'} #lectura`,
                visualUrl: cover,
                mockupType: platform
            })
            setIsGenerating(false)
            setStep(3)
        }, 1500)
    }

    // Auto-generación al seleccionar libro (Click 1: Select -> Click 2: Auto Generate)
    useEffect(() => {
        if (selectedBookId && selectedBook) {
            handleGenerate()
        }
    }, [selectedBookId, platform, !!selectedBook])

    return (
        <div className="space-y-6 fade-in max-w-6xl mx-auto">
            {/* Header con estilo IA */}
            <div className="relative p-8 rounded-3xl overflow-hidden glass-card border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <Sparkles className="w-32 h-32 text-primary animate-pulse" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Generador de Marketing AI
                    </h1>
                    <p className="text-slate-600 dark:text-dark-600 mt-2 max-w-2xl font-medium">
                        Transforma los datos de tus libros en contenido profesional de redes sociales en segundos.
                        Nuestra IA diseña el post perfecto para cada plataforma.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Panel de Control Izquierdo */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 shadow-sm border border-slate-200 dark:border-dark-300">
                        <div className="space-y-6">
                            {/* PASO 1: Selección de Libro */}
                            <div>
                                <label className="text-sm font-bold text-slate-800 dark:text-white mb-3 block flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black">1</span>
                                    Selecciona el Libro
                                </label>
                                <select
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className="input-field text-sm font-semibold"
                                >
                                    <option value="">-- Elige un Título --</option>
                                    {data?.books?.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* PASO 2: Plataforma */}
                            <div>
                                <label className="text-sm font-bold text-slate-800 dark:text-white mb-3 block flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black">2</span>
                                    Elige Formato
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlatform(p.id)}
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${platform === p.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'border-slate-200 dark:border-dark-300 hover:border-primary/50 text-slate-500 dark:text-dark-500'}`}
                                        >
                                            <p.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!selectedBookId || isGenerating}
                                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/30 relative overflow-hidden group"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Generando Magia AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        <span>Crear Publicación</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Área de Previsualización */}
                <div className="lg:col-span-8">
                    {!generatedContent && !isGenerating ? (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-slate-300 dark:border-dark-400 rounded-3xl flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-dark-50/10">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-dark-200 flex items-center justify-center text-slate-400 dark:text-dark-500 mb-6">
                                <ImageIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white mb-2">Previsualización de Contenido</h3>
                            <p className="text-slate-500 dark:text-dark-600 max-w-sm">
                                Selecciona un libro y haz clic en generar para ver cómo lucirá tu próxima publicación.
                            </p>
                        </div>
                    ) : isGenerating ? (
                        <div className="h-full min-h-[500px] glass-card rounded-3xl flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent animate-pulse" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex gap-4 items-center justify-center">
                                    <div className="w-4 h-4 rounded-full bg-primary animate-bounce delay-75" />
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 animate-bounce delay-150" />
                                    <div className="w-4 h-4 rounded-full bg-primary animate-bounce delay-300" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">Analizando catálogo...</h4>
                                    <p className="text-slate-500 font-medium">Diseñando mockups profesionales para {selectedBook?.title}</p>
                                </div>
                                <div className="max-w-xs mx-auto space-y-2">
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-progress-fast" />
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-primary tracking-widest">IA Engine Active</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Visual Preview */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <Layout className="w-4 h-4" /> 
                                            {platform === 'instagram_carousel' ? 'Carrusel de 3 Slides' : 'Mockup Generado'}
                                        </h3>
                                        <span className="badge-emerald px-2 py-0.5 text-[10px] font-black uppercase">Optimizado para {platform.split('_')[0]}</span>
                                    </div>

                                    {platform === 'instagram_carousel' ? (
                                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                            {carouselSlides.map((slide, idx) => (
                                                <div key={idx} className="min-w-[280px] snap-center space-y-3">
                                                    <div className="aspect-square relative rounded-2xl bg-dark-500 shadow-xl overflow-hidden border-2 border-white dark:border-dark-300">
                                                        <img src={slide.image} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                                                            <p className="text-white font-black text-sm uppercase tracking-wider mb-1">{slide.title}</p>
                                                            <p className="text-white/80 text-[10px] font-medium leading-relaxed">{slide.copy}</p>
                                                        </div>
                                                        <div className="absolute top-3 right-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">{idx + 1}/3</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`relative rounded-3xl bg-dark-500 shadow-2xl overflow-hidden border-4 border-white dark:border-dark-300 transition-all duration-500 ${platform.includes('story') ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-square'}`}>
                                            <img
                                                src={generatedContent.visualUrl}
                                                className="w-full h-full object-cover"
                                                alt="Preview"
                                            />
                                            {/* Overlays dinámicos según plataforma */}
                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                                <p className="text-white font-black text-lg drop-shadow-md leading-tight mb-1">{selectedBook.title}</p>
                                                <p className="text-primary-300 font-black text-[10px] uppercase tracking-[0.2em]">Novedad por {selectedBook.authorName}</p>
                                            </div>
                                            
                                            {/* Marca de agua sutil */}
                                            <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-40">
                                                <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
                                                    <BookOpen className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-[8px] font-bold text-white uppercase tracking-widest">EditorialPro</span>
                                            </div>
                                        </div>
                                    )}

                                    <button className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold group bg-emerald-600 border-emerald-500 hover:bg-emerald-700">
                                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                        Descargar Pack de Medios (ZIP)
                                    </button>
                                </div>

                                {/* Texts and Actions */}
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <Type className="w-4 h-4" /> Copy y Estrategia
                                            </h3>
                                            <button 
                                                onClick={handleGenerate}
                                                className="text-primary hover:text-primary-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                                            >
                                                <RefreshCw className="w-3 h-3" /> Regenerar
                                            </button>
                                        </div>
                                        <div className="glass-card p-5 bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-2xl">
                                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                                {generatedContent.copy}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-700 flex flex-wrap gap-2">
                                                {generatedContent.hashtags.split(' ').map((h, i) => (
                                                    <span key={i} className="px-2 py-1 rounded-lg bg-primary/5 text-[10px] font-bold text-primary border border-primary/10">{h}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 opacity-10">
                                            <Sparkles className="w-20 h-20 text-primary" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2 text-primary font-black text-xs uppercase tracking-widest">
                                                <Sparkles className="w-4 h-4" /> Tip de Marketing
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-dark-600 leading-relaxed font-medium">
                                                {platform === 'instagram_carousel' 
                                                    ? "Los carruseles tienen 3 veces más interacción que los posts estáticos. Asegúrate de que la primera imagen sea impactante."
                                                    : "Los posts con fotos de personas leyendo o bibliotecas reales suelen convertir mejor que los mockups simples."
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="btn-secondary py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200">
                                            <Share2 className="w-4 h-4" /> Compartir Directo
                                        </button>
                                        <button className="btn-secondary py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200">
                                            <Palette className="w-4 h-4" /> Estilo: Elegante
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historia de Generaciones */}
            <div className="pt-10">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-slate-400" /> Historial de Campañas
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="group relative aspect-square rounded-2xl bg-dark-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all">
                            <img src={`https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200&sig=${i}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Historial" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    ))}
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-dark-400 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all cursor-pointer">
                        <PlusIcon className="w-6 h-6 mb-2" />
                        <span className="text-[10px] font-black uppercase">Nueva Capaña</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PlusIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}
