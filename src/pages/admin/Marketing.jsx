import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Instagram, Smartphone, Share2, Sparkles, Download,
    ArrowRight, Image as ImageIcon, MessageSquare,
    CheckCircle2, RefreshCw, Facebook, PlayCircle,
    Layout, Type, Palette, BookOpen, Layers, 
    Target, Brain, TrendingUp, Zap, Wand2, Eye,
    ChevronRight, Star
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

    const handleGenerate = () => {
        if (!selectedBookId || !selectedBook) return
        setIsGenerating(true)

        // Simular pensamiento profundo de la IA
        setTimeout(() => {
            const cover = selectedBook.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
            
            // Generar análisis estratégico
            const analysis = {
                dna: `Tono ${tone} detectado. Enfoque prioritario: ${selectedBook.genre}.`,
                target: {
                    age: '18 - 45 años',
                    interests: `#${selectedBook.genre}, #LecturaArtística, #${selectedBook.authorName?.split(' ')[0]}Readers`,
                    personality: 'Personas que buscan experiencias inolvidables y autores con voz propia.'
                },
                strategy: 'Ciclo de 3 impactos: Curiosidad, Deseo y Validación.'
            }
            setAiAnalysis(analysis)

            // Generar contenido según plataforma
            if (platform === 'campaign_pack') {
                setCarouselSlides([
                    { 
                        title: '¿ESTÁS LISTO?', 
                        copy: `Algo grande está por llegar. La nueva voz de la editorial tiene nombre: ${selectedBook.title}.`, 
                        image: cover,
                        badge: 'TEASER'
                    },
                    { 
                        title: 'YA DISPONIBLE', 
                        copy: `${selectedBook.authorName} presenta su obra más ambiciosa. Una historia que no podrás soltar.`, 
                        image: cover,
                        badge: 'LANZAMIENTO'
                    },
                    { 
                        title: 'LOS LECTORES DICEN', 
                        copy: `"La mejor lectura del año. No puedo esperar a la siguiente entrega." - Crítica Literaria`, 
                        image: cover,
                        badge: 'PRUEBA SOCIAL'
                    }
                ])
            }

            const copyTemplates = {
                'Elogioso': `✨ ESPECTACULAR ✨\n\nNo todos los días nace una obra como "${selectedBook.title}". De la mano de ${selectedBook.authorName}, llega una historia que redefine el género de ${selectedBook.genre}.\n\nUna lectura obligatoria para este mes. 📖\n\n#${selectedBook.title.replace(/\s+/g,'')} #LibrosTop #Editorial`,
                'Misterioso': `🤫 El secreto mejor guardado de ${selectedBook.authorName}...\n\n¿Qué pasaría si todo lo que crees saber sobre "${selectedBook.title}" fuera solo el principio?\n\nSolo para los que se atreven a leer entre líneas. 👁️\n\n#MisterioEditorial #ProximaLectura`,
                'Agresivo': `🛒 ¡CÓMPRALO AHORA O TE ARREPENTIRÁS!\n\n"${selectedBook.title}" está rompiendo stocks. La última obra de ${selectedBook.authorName} es el fenómeno de ventas de la temporada.\n\nNo te quedes sin tu ejemplar. Unidades limitadas. 🔥\n\n#VentaDirecta #BestSeller`,
                'Emocional': `❤️ Un trozo del alma de ${selectedBook.authorName} en cada página.\n\n"${selectedBook.title}" no es solo un libro, es un viaje emocional. Prepárate para reír y llorar con el relato más íntimo de este año.\n\nDisponible para sanar corazones. ✨\n\n#LecturaConAlma #Emociones`
            }

            setGeneratedContent({
                copy: copyTemplates[tone] || copyTemplates['Elogioso'],
                hashtags: `#${selectedBook.genre?.replace(/\s+/g, '') || 'Libros'} #bookstagram #${selectedBook.authorName?.replace(/\s+/g, '') || 'Autor'} #ReadingAI`,
                visualUrl: cover,
                videoScript: [
                    { time: '0:00', text: 'Gancho visual: Muestra la portada con un zoom rápido.' },
                    { time: '0:03', text: 'Texto en pantalla: "El libro del que todos hablan en #BookTok"' },
                    { time: '0:07', text: 'Corte rápido a la sinopsis: ' + selectedBook.synopsis?.substring(0, 50) + '...' },
                    { time: '0:12', text: 'CTA: Apunta al link en la biografía con una flecha animada.' }
                ]
            })
            setIsGenerating(false)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
                zIndex: 1000
            })
        }, 2000)
    }

    useEffect(() => {
        if (selectedBookId) {
            handleGenerate()
        }
    }, [selectedBookId, platform, tone])

    // Acción de descarga individual
    const downloadImage = async (ref, filename) => {
        if (!ref.current) return
        setIsDownloading(true)
        try {
            // Un pequeño retraso para asegurar que los estilos base se aplican
            await new Promise(r => setTimeout(r, 400))
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

    // Acción de descarga masiva (ZIP)
    const downloadZip = async () => {
        const zip = new JSZip()
        const mediaFolder = zip.folder("marketing_pack")
        setIsDownloading(true)
        
        try {
            if (platform === 'campaign_pack') {
                for (let i = 0; i < carouselSlides.length; i++) {
                    const el = carouselRefs.current[idxToKey(i)]
                    if (el) {
                        const dataUrl = await toPng(el, { 
                            quality: 1, 
                            pixelRatio: 2,
                            cacheBust: true,
                        })
                        const base64Data = dataUrl.split(',')[1]
                        mediaFolder.file(`slide_${i + 1}.png`, base64Data, { base64: true })
                    }
                }
            } else if (singlePreviewRef.current) {
                const dataUrl = await toPng(singlePreviewRef.current, { 
                    quality: 1, 
                    pixelRatio: 2,
                    cacheBust: true,
                })
                const base64Data = dataUrl.split(',')[1]
                mediaFolder.file(`post_${selectedBook.title.replace(/\s+/g,'_')}.png`, base64Data, { base64: true })
            }

            const content = await zip.generateAsync({ type: "blob" })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = `Media_Pack_${selectedBook.title.replace(/\s+/g, '_')}.zip`
            link.click()
        } catch (err) {
            console.error('Error creando ZIP:', err)
        } finally {
            setIsDownloading(false)
        }
    }

    const getStyleClasses = () => {
        switch (currentStyle) {
            case 'Elegante': return 'font-serif bg-slate-50 text-slate-900 border-amber-200'
            case 'Futurista': return 'font-mono bg-black text-primary border-primary/50'
            case 'Cine': return 'font-black bg-dark-900 text-white border-white/20'
            default: return 'font-sans bg-white text-slate-900 border-slate-200'
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
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3 text-primary" /> 3. Tono del Copy
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {tones.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTone(t.id)}
                                            className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${tone === t.id 
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
                                <Wand2 className="w-16 h-16 text-primary animate-bounce" />
                                <div className="text-center">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">AI Analizando ADN del Título...</h4>
                                    <p className="text-primary-300 font-bold text-xs uppercase tracking-widest mt-2">{selectedBook?.title}</p>
                                </div>
                                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    ) : aiAnalysis && generatedContent ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            {/* Strategic Insight Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase text-primary">Análisis IA</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{aiAnalysis?.dna}</p>
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase text-emerald-500">Audiencia Target</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{aiAnalysis?.target.age} • {aiAnalysis?.target.age}</p>
                                    <p className="text-[9px] text-slate-500 mt-1">{aiAnalysis?.target.interests}</p>
                                </div>
                                <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-3xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                        <span className="text-[10px] font-black uppercase text-purple-500">Estrategia</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{aiAnalysis?.strategy}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* Visual Mockup */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" /> Preview Final
                                        </h3>
                                        <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full uppercase">Material de Alta</span>
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
                                                                <div className="flex justify-between items-end mb-4">
                                                                    <span className="text-primary text-[10px] font-black tracking-widest uppercase bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">{slide.badge}</span>
                                                                    <div className="flex gap-3 opacity-40">
                                                                        <Instagram className="w-4 h-4 text-white" />
                                                                        <Facebook className="w-4 h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-white font-black text-3xl uppercase tracking-tighter mb-4 leading-none drop-shadow-2xl">{slide.title}</p>
                                                                <p className="text-white/80 text-xs font-semibold leading-relaxed max-w-[95%] italic line-clamp-2">{slide.copy}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => downloadImage({ current: carouselRefs.current[idxToKey(idx)] }, `Campaign_${slide.badge}_${selectedBook.title.replace(/\s+/g,'_')}.png`)}
                                                            className="w-full mt-4 py-3 text-[10px] font-black uppercase border border-slate-200 dark:border-dark-300 rounded-2xl text-slate-500 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 bg-slate-50 dark:bg-dark-200"
                                                        >
                                                            <Download className="w-3 h-3" /> Descargar {slide.badge}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={downloadZip}
                                                disabled={isDownloading || !generatedContent}
                                                className="btn-primary w-full py-5 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/20 text-xs font-black uppercase tracking-[0.2em] group flex items-center justify-center gap-3 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                                {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                                {isDownloading ? 'Generando Pack ZIP...' : 'Descargar Pack Campaña Completo'}
                                            </button>
                                        </div>
                                    ) : platform === 'video_script' ? (
                                        <div className="bg-slate-950 border-[10px] border-slate-900 rounded-[3.5rem] p-10 aspect-[9/16] max-w-[360px] mx-auto shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-[6px] bg-primary animate-[scan_4s_infinite] shadow-[0_0_20px_var(--primary)] text-primary"></div>
                                            <div className="space-y-8 relative z-10">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <PlayCircle className="w-6 h-6 animate-pulse" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-black uppercase tracking-widest leading-none">Script AI</span>
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase mt-1">Video Marketing</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-5">
                                                    {generatedContent.videoScript.map((step, i) => (
                                                        <div key={i} className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl hover:border-primary/50 transition-all group/step relative overflow-hidden">
                                                            <p className="text-[10px] font-black text-primary mb-2 flex items-center gap-2">
                                                                <span className="w-5 h-[1px] bg-primary/30"></span>
                                                                {step.time}
                                                            </p>
                                                            <p className="text-[13px] text-white/90 font-medium leading-relaxed italic">"{step.text}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-10 left-0 w-full px-10">
                                                 <div className="p-4 bg-primary/10 backdrop-blur-xl rounded-[2rem] border border-primary/20 text-center shadow-2xl">
                                                    <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Viral Boost Tip</p>
                                                    <p className="text-[11px] text-primary-200 mt-1 font-bold">"Sube este video entre las 19:00 y las 21:00 para máximo alcance."</p>
                                                 </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <motion.div 
                                                ref={singlePreviewRef}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`relative overflow-hidden group rounded-[4rem] bg-slate-950 p-12 border-[12px] border-slate-900 shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] flex flex-col items-center justify-center transition-colors duration-700 hover:border-primary/40`}
                                                style={{ aspectRatio: platform === 'instagram_story' ? '9/16' : '1:1', minHeight: '520px' }}
                                            >
                                                {/* Ambient Premium Lighting */}
                                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,40%),_rgba(var(--primary-rgb),0.25),_transparent_60%)] pointer-events-none opacity-80 mix-blend-screen"></div>
                                                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
                                                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                                                {/* Float and Tilt Controller */}
                                                <motion.div 
                                                    className="relative z-10 py-12"
                                                    whileHover={{ rotateY: 28, rotateX: 12, rotateZ: -2, scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                                >
                                                    <div className="perspective-[3000px]">
                                                        <div 
                                                            className="relative w-56 h-84 md:w-64 md:h-96 preserve-3d animate-float"
                                                            style={{ 
                                                                transformStyle: 'preserve-3d', 
                                                                transform: 'rotateY(-25deg) rotateX(10deg)' 
                                                            }}
                                                        >
                                                            {/* Luxury Hardcover Front */}
                                                            <div className="absolute inset-0 z-30 backface-hidden rounded-r-[5px] overflow-hidden border-l border-white/20 shadow-[-10px_0_30px_rgba(0,0,0,0.6)]" style={{ transform: 'translateZ(20px)' }}>
                                                                <img 
                                                                    src={generatedContent.visualUrl} 
                                                                    crossOrigin="anonymous"
                                                                    className="w-full h-full object-cover" 
                                                                    alt="Cover" 
                                                                />
                                                                {/* Moving Glint Overlay */}
                                                                <motion.div 
                                                                    className="absolute inset-x-0 top-0 h-[200%] bg-gradient-to-b from-white/20 via-transparent to-black/20 mix-blend-overlay"
                                                                    animate={{ y: ["-50%", "0%"] }}
                                                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                                ></motion.div>
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/30"></div>
                                                            </div>

                                                            {/* Premium Embossed Spine */}
                                                            <div 
                                                                className="absolute top-0 bottom-0 left-0 w-12 bg-slate-900 z-20 origin-left border-r border-white/5 flex flex-col items-center py-8 gap-4 shadow-[inset_2px_0_20px_rgba(0,0,0,0.9)]"
                                                                style={{ 
                                                                    transform: 'rotateY(-90deg)',
                                                                    backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2)), url(${generatedContent.visualUrl})`,
                                                                    backgroundSize: '1500% 100%',
                                                                    backgroundPosition: 'left center',
                                                                }}
                                                            >
                                                                <div className="w-full px-2 overflow-hidden">
                                                                    <p className="text-white/80 font-black text-[10px] uppercase tracking-[0.3em] whitespace-nowrap rotate-90 origin-center translate-y-24 scale-90 text-center drop-shadow-lg [text-shadow:0_0_10px_rgba(255,255,255,0.4)]">
                                                                        {selectedBook.title}
                                                                    </p>
                                                                </div>
                                                                <div className="mt-auto mb-4 opacity-40">
                                                                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center p-1.5 rotate-90">
                                                                        <Sparkles className="w-full h-full text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Gold Page-Edge Side */}
                                                            <div 
                                                                className="absolute top-[3px] bottom-[3px] right-0 w-12 z-10 origin-right rounded-r-[4px]"
                                                                style={{ 
                                                                    transform: 'rotateY(90deg) translateZ(0px)',
                                                                    background: currentStyle === 'Elegante' 
                                                                        ? 'repeating-linear-gradient(to right, #d4af37, #d4af37 1px, #f1f5f9 2px, #f1f5f9 3px)' 
                                                                        : 'repeating-linear-gradient(to right, #ffffff, #ffffff 1px, #f1f5f9 2px, #f1f5f9 3px)',
                                                                    boxShadow: 'inset 10px 0 30px rgba(0,0,0,0.3)'
                                                                }}
                                                            ></div>

                                                            {/* Top Side Block */}
                                                            <div className="absolute top-0 left-0 right-0 h-12 z-10 origin-top bg-gradient-to-b from-white to-slate-300" style={{ transform: 'rotateX(90deg) translateZ(0px)' }}></div>
                                                            
                                                            {/* Interactive Shadow on Floor */}
                                                            <div className="absolute bottom-0 left-0 right-0 h-10 z-10 origin-bottom bg-gradient-to-t from-white to-slate-400 shadow-[0_60px_100px_rgba(0,0,0,1)]" style={{ transform: 'rotateX(-90deg) translateZ(0px)' }}></div>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Cinematic Branding Overlays */}
                                                <div className="absolute top-14 left-14 opacity-60 flex items-center gap-3">
                                                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center p-3 border border-white/20 shadow-2xl backdrop-blur-md rotate-3">
                                                        <Sparkles className="w-full h-full text-white" />
                                                     </div>
                                                     <div className="flex flex-col">
                                                         <span className="text-[12px] font-black tracking-[0.4em] uppercase text-white leading-none">AI-DESIGN STUDIO</span>
                                                         <span className="text-[8px] font-bold text-primary mt-1 uppercase tracking-widest">Premium Assets</span>
                                                     </div>
                                                </div>

                                                <div className="text-center relative z-20 mt-8 max-w-[85%]">
                                                    <motion.div 
                                                        initial={{ y: 20, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-3xl mb-6"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                                                        <span className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">Official Release</span>
                                                    </motion.div>
                                                    <h3 className="text-white font-black text-4xl leading-tight uppercase tracking-tighter drop-shadow-2xl [text-shadow:0_10px_40px_rgba(0,0,0,0.8)] mb-2 italic">
                                                        {selectedBook.title}
                                                    </h3>
                                                    <div className="flex items-center justify-center gap-6 mt-6 opacity-60">
                                                        <div className="flex items-center gap-2">
                                                            <Star className="w-4 h-4 text-white fill-white" />
                                                            <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Gold Selection</span>
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                                                        <span className="text-white text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{selectedBook.genre || 'Epic Edition'}</span>
                                                    </div>
                                                </div>

                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none opacity-80"></div>
                                            </motion.div>

                                            <button 
                                                onClick={() => downloadImage(singlePreviewRef, `Marketing_Mockup_${selectedBook.title.replace(/\s+/g,'_')}.png`)} 
                                                disabled={isDownloading}
                                                className="btn-primary w-full py-6 bg-primary border-primary hover:brightness-110 shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 relative overflow-hidden group active:scale-[0.97] transition-all"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms]"></div>
                                                {isDownloading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />}
                                                {isDownloading ? 'PULIENDO ARTE...' : 'DESCARGAR MOCKUP DE LUJO'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side - Copy and Mastertip */}
                                <div className="space-y-8">
                                    <div className="space-y-6">
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

                                    <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden group">
                                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                        <Sparkles className="absolute -right-6 -top-6 w-32 h-32 opacity-10 rotate-12 group-hover:rotate-0 transition-all duration-1000" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                                     <Palette className="w-5 h-5" />
                                                </div>
                                                <h4 className="text-xs font-black uppercase tracking-[0.3em]">Marketing Mastertip</h4>
                                            </div>
                                            <p className="text-sm font-bold leading-relaxed opacity-90 italic">
                                                {platform === 'campaign_pack' 
                                                    ? 'Un pack de campaña completo aumenta la tasa de conversión en un 40%. Sube estas piezas con 24h de separación para maximizar el algoritmo.'
                                                    : 'Usa este contenido en "Historias" con el sticker de enlace a tu preventa. Los mockups 3D generan un 65% más de clics que las portadas planas.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
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
