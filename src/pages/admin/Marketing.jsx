import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Instagram, Smartphone, Sparkles, Download,
    Image as ImageIcon, CheckCircle2, RefreshCw, Facebook, PlayCircle,
    Type, Palette, BookOpen, Layers
} from 'lucide-react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function Marketing() {
    const { data } = useAuth()
    const [selectedBookId, setSelectedBookId] = useState('')
    const [platform, setPlatform] = useState('instagram_post')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState(null)
    const [currentStyle, setCurrentStyle] = useState('Moderno')
    const [tone, setTone] = useState('Elogioso')
    const [isDownloading, setIsDownloading] = useState(false)
    
    // Helper para Refs estables
    const idxToKey = (idx) => `slide-${idx}`
    
    // Refs para captura de imagen
    const singlePreviewRef = useRef(null)
    const carouselRefs = useRef([])

    const selectedBook = data?.books?.find(b => b.id === selectedBookId)

    const platforms = [
        { id: 'instagram_post', icon: Instagram, label: 'Post (Feed)', aspect: '1:1' },
        { id: 'instagram_story', icon: Smartphone, label: 'Story / Reel', aspect: '9:16' },
        { id: 'campaign_pack', icon: Layers, label: 'Pack Campaña', aspect: '1:1' },
        { id: 'video_script', icon: PlayCircle, label: 'Guion Viral', aspect: '9:16' },
    ]

    const stylesAvailable = ['Moderno', 'Elegante', 'Futurista', 'Cine']
    const tones = [
        { id: 'Elogioso', label: 'Elogioso', color: 'text-primary' },
        { id: 'Misterioso', label: 'Misterio', color: 'text-purple-500' },
        { id: 'Agresivo', label: 'Venta Directa', color: 'text-rose-500' },
        { id: 'Emocional', label: 'Emocional', color: 'text-emerald-500' }
    ]

    const [carouselSlides, setCarouselSlides] = useState([])
    const [aiAnalysis, setAiAnalysis] = useState(null)

    const handleGenerate = async () => {
        if (!selectedBookId || !selectedBook) return
        
        setIsGenerating(true)

        // Simulación de generación de contenido (Estándar)
        setTimeout(() => {
            const cover = selectedBook.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
            
            const analysis = {
                dna: `Tono ${tone} detectado. Enfoque prioritario: ${selectedBook.genre}.`,
                target: {
                    age: '25 - 55 años',
                    interests: `#${selectedBook.genre}, #LibrosRecomendados`,
                },
                strategy: 'Marketing Digital: Enfoque en legibilidad y visual atractivo.'
            }
            setAiAnalysis(analysis)

            const copyTemplates = {
                'Elogioso': `✨ DESCUBRIMIENTO ✨\n\n"${selectedBook.title}" de ${selectedBook.authorName} ya está disponible. Una obra que redefine el género.\n\n#${selectedBook.title.replace(/\s+/g,'')} #Libros #Lectura`,
                'Misterioso': `🤫 Hay secretos que pesan...\n\n¿Estás listo para "${selectedBook.title}"?\n\n#Misterio #LecturaRecomendada`,
                'Agresivo': `🛒 ¡CÓMPRALO YA!\n\n"${selectedBook.title}" está rompiendo récords. No te quedes sin tu copia.\n\n#BestSeller #Imperdible`,
                'Emocional': `❤️ Una historia que llegará a tu alma.\n\nSiente "${selectedBook.title}" hoy mismo.\n\n#LecturaEmocional #AmorPorLosLibros`
            }

            const slides = [
                { image: cover, title: selectedBook.title, badge: 'PORTADA', copy: 'Una historia que cautivará tus sentidos.' },
                { image: cover, title: 'SOBRE EL AUTOR', badge: 'CONTEXTO', copy: `${selectedBook.authorName} nos entrega su obra más personal.` },
                { image: cover, title: 'DISPONIBLE YA', badge: 'CTA', copy: 'Busca tu ejemplar en las mejores librerías.' }
            ]
            setCarouselSlides(slides)

            setGeneratedContent({
                copy: copyTemplates[tone] || copyTemplates['Elogioso'],
                hashtags: `#${selectedBook.genre?.replace(/\s+/g, '') || 'Libros'} #MarketingEditorial #Novedad`,
                visualUrl: cover
            })

            setIsGenerating(false)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
        }, 1500)
    }

    useEffect(() => {
        if (selectedBookId) {
            handleGenerate()
        }
    }, [selectedBookId, platform, tone])

    const downloadImage = async (ref, filename) => {
        if (!ref.current) return
        setIsDownloading(true)
        try {
            const dataUrl = await toPng(ref.current, { 
                quality: 1, 
                pixelRatio: 2.5,
                cacheBust: true,
            })
            const link = document.createElement('a')
            link.download = filename
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error('Error descargando imagen:', err)
        } finally {
            setIsDownloading(false)
        }
    }

    const downloadZip = async () => {
        const zip = new JSZip()
        const mediaFolder = zip.folder("marketing_pack")
        setIsDownloading(true)
        try {
            for (let i = 0; i < carouselSlides.length; i++) {
                const el = carouselRefs.current[idxToKey(i)]
                if (el) {
                    const dataUrl = await toPng(el, { quality: 1, pixelRatio: 2 })
                    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "")
                    mediaFolder.file(`slide_${i+1}.png`, base64Data, {base64: true})
                }
            }
            const content = await zip.generateAsync({type:"blob"})
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = `Campaña_${selectedBook.title.replace(/\s+/g,'_')}.zip`
            link.click()
        } catch (err) {
            console.error('Error generando ZIP:', err)
        } finally {
            setIsDownloading(false)
        }
    }

    const getStyleClasses = () => {
        switch(currentStyle) {
            case 'Moderno': return 'bg-white text-slate-900 border-slate-100 shadow-xl'
            case 'Elegante': return 'bg-slate-50 text-slate-800 border-primary/20 shadow-primary/10'
            case 'Futurista': return 'bg-slate-900 text-white border-primary/30 shadow-primary/20'
            case 'Cine': return 'bg-black text-white border-white/5 shadow-2xl'
            default: return 'bg-white'
        }
    }

    return (
        <div className="space-y-8 fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-dark-100 p-8 rounded-[3rem] border border-slate-200 dark:border-dark-300 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sparkles className="w-24 h-24 text-primary rotate-12" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        Marketing <span className="text-primary italic">Maker AI</span>
                    </h1>
                    <p className="text-slate-500 dark:text-dark-700 font-medium mt-1">Generación automática de activos publicitarios para tus títulos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Lateral Controls */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card p-6 border border-slate-200 dark:border-dark-300">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block">1. Libro Objetivo</label>
                                <select
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className="input-field w-full rounded-2xl py-3 px-4 text-xs font-bold appearance-none cursor-pointer"
                                >
                                    <option value="">Seleccionar libro...</option>
                                    {data?.books?.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block">2. Formato Redes</label>
                                <div className="grid grid-cols-4 gap-2">
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
                                <label className="text-xs font-black uppercase text-slate-400 mb-3 block leading-tight">3. Tono del Contenido</label>
                                <div className="flex flex-wrap gap-2">
                                    {tones.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTone(t.id)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${tone === t.id 
                                                ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                                                : 'bg-white dark:bg-dark-100 border-slate-200 dark:border-dark-300 text-slate-500 hover:border-primary/30'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-primary" /> 4. Estilo de Diseño
                                </label>
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
                                {isGenerating ? 'IA Generando...' : 'Regenerar Contenido'}
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
                        <div className="h-full min-h-[500px] bg-white dark:bg-dark-100 rounded-[3rem] flex flex-col items-center justify-center p-12 overflow-hidden relative border border-slate-200 dark:border-dark-300">
                             <div className="relative z-10 space-y-6 flex flex-col items-center">
                                <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                                <div className="text-center">
                                    <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter italic">Creando material de impacto...</h4>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">{selectedBook?.title}</p>
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
                                    </div>

                                    {platform === 'campaign_pack' ? (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
                                                {carouselSlides.map((slide, idx) => (
                                                    <div key={idx} className="min-w-[320px] snap-center">
                                                        <div 
                                                            ref={el => carouselRefs.current[idxToKey(idx)] = el}
                                                            className={`aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-500 ${getStyleClasses()} border-[8px] group/slide`}
                                                        >
                                                            <img 
                                                                src={slide.image} 
                                                                crossOrigin="anonymous"
                                                                className="w-full h-full object-cover opacity-90 group-hover/slide:scale-110 transition-transform duration-700" 
                                                                alt="Slide" 
                                                            />
                                                            <div className="absolute inset-x-0 bottom-0 top-[30%] bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-10 text-left">
                                                                <span className="text-primary text-[10px] font-black tracking-widest uppercase mb-2">{slide.badge}</span>
                                                                <p className="text-white font-black text-3xl uppercase tracking-tighter mb-4 leading-none">{slide.title}</p>
                                                                <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-[95%] italic line-clamp-2">{slide.copy}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => downloadImage({ current: carouselRefs.current[idxToKey(idx)] }, `Campaign_${slide.badge}_${selectedBook.title.replace(/\s+/g,'_')}.png`)}
                                                            className="w-full mt-4 py-3 text-[10px] font-black uppercase border border-slate-200 dark:border-dark-300 rounded-2xl text-slate-500 hover:text-primary transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3 h-3" /> Descargar {slide.badge}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={downloadZip}
                                                disabled={isDownloading}
                                                className="btn-primary w-full py-5 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                            >
                                                {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
                                                Descargar Pack Completo (ZIP)
                                            </button>
                                        </div>
                                    ) : platform === 'video_script' ? (
                                        <div className="bg-slate-950 border-[10px] border-slate-900 rounded-[3.5rem] p-10 aspect-[9/16] max-w-[360px] mx-auto shadow-2xl relative overflow-hidden group">
                                            <div className="space-y-8 relative z-10 text-white">
                                                <h4 className="text-primary font-black uppercase text-xs tracking-widest">Guion de Video Viral</h4>
                                                <p className="text-sm italic opacity-70">"Garantiza el primer impacto en los primeros 3 segundos..."</p>
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <p className="text-[10px] text-primary uppercase font-black mb-1">0:00 - 0:03 Hook</p>
                                                        <p className="text-xs font-bold leading-relaxed">{generatedContent.copy.split('\n')[0]}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <motion.div 
                                                ref={singlePreviewRef}
                                                className={`relative rounded-[3.5rem] overflow-hidden transition-all duration-700 ${getStyleClasses()} border-[12px] group/preview flex flex-col items-center justify-center p-12`}
                                                style={{ aspectRatio: platform === 'instagram_story' ? '9/16' : '1/1' }}
                                            >
                                                <div className="relative z-10 flex flex-col items-center text-center">
                                                     <div className="w-48 h-72 rounded-lg shadow-2xl overflow-hidden border-2 border-white/20 mb-8">
                                                        <img src={generatedContent.visualUrl} className="w-full h-full object-cover" alt="Book" />
                                                     </div>
                                                     <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic leading-tight">
                                                        {selectedBook.title}
                                                     </h3>
                                                     <p className="text-sm font-bold uppercase opacity-60 tracking-[0.3em]">{selectedBook.authorName}</p>
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                                            </motion.div>

                                            <button 
                                                onClick={() => downloadImage(singlePreviewRef, `Marketing_${selectedBook.title.replace(/\s+/g,'_')}.png`)} 
                                                disabled={isDownloading}
                                                className="btn-primary w-full py-5 text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl"
                                            >
                                                {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                {isDownloading ? 'Procesando...' : 'Descargar Imagen'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side - Copy */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Type className="w-4 h-4" /> Copy Social Media
                                        </h3>
                                        <button onClick={() => { navigator.clipboard.writeText(generatedContent.copy); alert('Copiado!') }} className="text-primary text-[10px] font-black uppercase hover:underline">Copiar</button>
                                    </div>
                                    <div className="glass-card p-6 bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-[2rem] shadow-sm">
                                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-bold italic">
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
