import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Instagram, Smartphone, Share2, Sparkles, Download,
    ArrowRight, Image as ImageIcon, MessageSquare,
    CheckCircle2, RefreshCw, Facebook, PlayCircle,
    Layout, Type, Palette, BookOpen, Layers
} from 'lucide-react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'

export default function Marketing() {
    const { data } = useAuth()
    const [selectedBookId, setSelectedBookId] = useState('')
    const [platform, setPlatform] = useState('instagram_post')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState(null)
    const [currentStyle, setCurrentStyle] = useState('Moderno')
    
    // Refs para captura de imagen
    const singlePreviewRef = useRef(null)
    const carouselRefs = useRef([])

    const selectedBook = data?.books?.find(b => b.id === selectedBookId)

    const platforms = [
        { id: 'instagram_post', icon: Instagram, label: 'Instagram Post', aspect: '1:1' },
        { id: 'instagram_carousel', icon: Layout, label: 'Instagram Carousel', aspect: '1:1' },
        { id: 'instagram_story', icon: Smartphone, label: 'Story / Reel', aspect: '9:16' },
        { id: 'facebook_post', icon: Facebook, label: 'Facebook Post', aspect: '1.91:1' },
    ]

    const stylesAvailable = ['Moderno', 'Clásico', 'Elegante', 'Negrita']

    const [carouselSlides, setCarouselSlides] = useState([
        { title: '', copy: '', image: '' },
        { title: '', copy: '', image: '' },
        { title: '', copy: '', image: '' }
    ])

    const handleGenerate = () => {
        if (!selectedBookId || !selectedBook) return
        setIsGenerating(true)

        setTimeout(() => {
            if (!selectedBook) {
                setIsGenerating(false)
                return
            }

            const cover = selectedBook.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
            
            if (platform === 'instagram_carousel') {
                setCarouselSlides([
                    { 
                        title: selectedBook.title || 'Título', 
                        copy: `Descubre la nueva obra de ${selectedBook.authorName || 'nuestro autor'} ✨`, 
                        image: cover 
                    },
                    { 
                        title: 'Una historia única', 
                        copy: selectedBook.synopsis?.substring(0, 100) + '...' || 'Sumérgete en una narrativa inolvidable...', 
                        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800' 
                    },
                    { 
                        title: 'Ya disponible', 
                        copy: `Consigue tu ejemplar en nuestra web o librerías favoritas. 🛒`, 
                        image: cover 
                    }
                ])
            }

            setGeneratedContent({
                copy: `📚 ¡NUEVO LANZAMIENTO! \n\nEstamos muy emocionados de presentar "${selectedBook.title || 'novedad'}" de ${selectedBook.authorName || 'la editorial'}. \n\n${selectedBook.synopsis?.substring(0, 150) || 'Una obra que redefine el género lector.'}... \n\nDisponible ya en todos los puntos de venta. \n\n#EditorialPro #LibrosRecomendados #NovedadEditorial #LecturaRecomendada`,
                hashtags: `#${selectedBook.genre?.replace(/\s+/g, '') || 'Libros'} #bookstagram #${selectedBook.authorName?.replace(/\s+/g, '') || 'Autor'} #lectura`,
                visualUrl: cover,
                mockupType: platform
            })
            setIsGenerating(false)
        }, 1500)
    }

    useEffect(() => {
        if (selectedBookId && selectedBook) {
            handleGenerate()
        }
    }, [selectedBookId, platform])

    // Acción de descarga individual
    const downloadImage = async (ref, filename) => {
        if (!ref.current) return
        try {
            const dataUrl = await toPng(ref.current, { quality: 0.95, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = filename
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error('Error descargando imagen:', err)
        }
    }

    // Acción de descarga masiva (ZIP)
    const downloadZip = async () => {
        const zip = new JSZip()
        const mediaFolder = zip.folder("marketing_pack")
        
        try {
            if (platform === 'instagram_carousel') {
                for (let i = 0; i < carouselSlides.length; i++) {
                    const el = carouselRefs.current[i]
                    if (el) {
                        const dataUrl = await toPng(el, { quality: 0.95, pixelRatio: 2 })
                        const base64Data = dataUrl.split(',')[1]
                        mediaFolder.file(`slide_${i + 1}.png`, base64Data, { base64: true })
                    }
                }
            } else if (singlePreviewRef.current) {
                const dataUrl = await toPng(singlePreviewRef.current, { quality: 0.95, pixelRatio: 2 })
                const base64Data = dataUrl.split(',')[1]
                mediaFolder.file(`post_${selectedBook.title}.png`, base64Data, { base64: true })
            }

            const content = await zip.generateAsync({ type: "blob" })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = `Media_Pack_${selectedBook.title.replace(/\s+/g, '_')}.zip`
            link.click()
        } catch (err) {
            console.error('Error creando ZIP:', err)
        }
    }

    const getStyleClasses = () => {
        switch (currentStyle) {
            case 'Elegante': return 'font-serif bg-slate-50 text-slate-900 border-gold'
            case 'Negrita': return 'font-black bg-black text-white'
            case 'Clásico': return 'font-mono bg-white text-dark-900 border-dark-300'
            default: return 'font-sans bg-dark-500 text-white border-white'
        }
    }

    return (
        <div className="space-y-6 fade-in max-w-6xl mx-auto pb-20">
            <div className="relative p-8 rounded-3xl overflow-hidden glass-card border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <Sparkles className="w-32 h-32 text-primary animate-pulse" />
                </div>
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-3">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Marketing Maker AI
                    </h1>
                    <p className="text-slate-600 dark:text-dark-600 mt-2 max-w-2xl font-medium">
                        Crea campañas completas en 2 clics. Genera carruseles, posts y copys profesionales listos para publicar.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 border border-slate-200 dark:border-dark-300">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block">1. Libro Objetivo</label>
                                <select
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className="input-field text-sm font-bold bg-slate-50 dark:bg-dark-200"
                                >
                                    <option value="">-- Seleccionar Título --</option>
                                    {data?.books?.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block">2. Formato Redes</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlatform(p.id)}
                                            className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-300 ${platform === p.id 
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                                                : 'bg-white dark:bg-dark-100 border-slate-200 dark:border-dark-300 text-slate-400 hover:border-primary/50'}`}
                                        >
                                            <p.icon className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block">3. Estilo Visual</label>
                                <div className="flex flex-wrap gap-2">
                                    {stylesAvailable.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setCurrentStyle(s)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${currentStyle === s 
                                                ? 'bg-dark-900 dark:bg-white text-white dark:text-dark-900 border-transparent shadow-md' 
                                                : 'bg-transparent border-slate-200 dark:border-dark-300 text-slate-500 hover:border-primary'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!selectedBookId || isGenerating}
                                className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl relative overflow-hidden group active:scale-95 transition-all"
                            >
                                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                {isGenerating ? 'IA Pensando...' : 'Regenerar Contenido'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-8">
                    {!generatedContent && !isGenerating ? (
                        <div className="h-full min-h-[500px] border-4 border-dashed border-slate-100 dark:border-dark-400 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                            <Layers className="w-20 h-20 text-slate-200 dark:text-dark-500 mb-6" />
                            <h3 className="text-2xl font-black dark:text-white mb-2 uppercase tracking-tighter">Sala de Diseño</h3>
                            <p className="text-slate-500 font-medium max-w-xs">Selecciona un libro y mira la magia publicitaria en tiempo real.</p>
                        </div>
                    ) : isGenerating ? (
                        <div className="h-full min-h-[500px] bg-slate-900 rounded-[3rem] flex flex-col items-center justify-center p-12 overflow-hidden relative border-8 border-slate-800">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse" />
                            <div className="relative z-10 space-y-8 flex flex-col items-center">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <div className="text-center">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Diseñando para ti...</h4>
                                    <p className="text-primary-300 font-bold text-xs uppercase tracking-widest mt-2">{selectedBook?.title}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* Visual Mockup */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Preview Final
                                        </h3>
                                        <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full uppercase">Listo para Redes</span>
                                    </div>

                                    {platform === 'instagram_carousel' ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
                                                {carouselSlides.map((slide, idx) => (
                                                    <div key={idx} className="min-w-[300px] snap-center">
                                                        <div 
                                                            ref={el => carouselRefs.current[idx] = el}
                                                            className={`aspect-square relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${getStyleClasses()} border-4`}
                                                        >
                                                            <img src={slide.image} className="w-full h-full object-cover opacity-90" alt="Slide" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                                                                <p className="text-white font-black text-lg uppercase tracking-tight mb-2 leading-tight">{slide.title}</p>
                                                                <p className="text-white/80 text-xs font-medium leading-relaxed max-w-[90%]">{slide.copy}</p>
                                                            </div>
                                                            <div className="absolute top-4 right-4 bg-primary/90 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">LÁMINA {idx + 1}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => downloadImage({ current: carouselRefs.current[idx] }, `Slide_${idx+1}_${selectedBook.title}.png`)}
                                                            className="w-full mt-3 py-2 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3 h-3" /> Descargar esta lámina
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={downloadZip} className="btn-primary w-full py-4 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 text-xs font-black uppercase tracking-widest">
                                                <Layers className="w-4 h-4" /> Descargar Carrusel Completo (ZIP)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div 
                                                ref={singlePreviewRef}
                                                className={`relative rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500 border-8 ${getStyleClasses()} ${platform.includes('story') ? 'aspect-[9/16] max-w-[340px] mx-auto' : 'aspect-square'}`}
                                            >
                                                <img src={generatedContent.visualUrl} className="w-full h-full object-cover" alt="Post" />
                                                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                                                    <p className="text-white font-black text-2xl drop-shadow-2xl leading-tight mb-2">{selectedBook.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-0.5 w-6 bg-primary" />
                                                        <p className="text-primary-300 font-black text-[10px] uppercase tracking-[0.3em]">Nueva Obra Maestro</p>
                                                    </div>
                                                </div>
                                                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                                                    <BookOpen className="w-4 h-4 text-primary" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">EditorialPro</span>
                                                </div>
                                            </div>
                                            <button onClick={() => downloadImage(singlePreviewRef, `Marketing_${selectedBook.title}.png`)} className="btn-primary w-full py-4 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-xl text-xs font-black uppercase tracking-widest">
                                                <Download className="w-4 h-4" /> Bajar en Alta Resolución (PNG)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Copy and Stats */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Type className="w-4 h-4" /> Copy Social Media
                                            </h3>
                                            <button onClick={() => { navigator.clipboard.writeText(generatedContent.copy); alert('Copiado!') }} className="text-primary text-[10px] font-black uppercase hover:underline">Copiar Todo</button>
                                        </div>
                                        <div className="glass-card p-6 bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-[2rem] shadow-sm">
                                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">
                                                {generatedContent.copy}
                                            </p>
                                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-700 flex flex-wrap gap-2">
                                                {generatedContent.hashtags.split(' ').map((h, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-xl bg-primary/5 text-[10px] font-black text-primary border border-primary/10">
                                                        {h}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-[2rem] bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                                        <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 opacity-20 rotate-12 group-hover:scale-110 transition-transform" />
                                        <div className="relative z-10">
                                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                                <Palette className="w-4 h-4" /> Tip Pro de Marketing
                                            </h4>
                                            <p className="text-xs font-bold leading-relaxed opacity-95">
                                                {platform === 'instagram_carousel' 
                                                    ? 'Los carruseles generan curiosidad. Prueba el estilo "Negrita" para mayor contraste y sube el CTR de tus anuncios.'
                                                    : 'Usa este contenido en "Historias" con el sticker de enlace a tu preventa para maximizar las conversiones inmediatas.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Global History - Visual Strip */}
            <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 text-center">Tus últimas creaciones</h2>
                 <div className="flex gap-4 justify-center overflow-hidden grayscale hover:grayscale-0 transition-all">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="w-20 h-20 rounded-2xl bg-dark-500 border-2 border-slate-800 flex-shrink-0" />
                    ))}
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
