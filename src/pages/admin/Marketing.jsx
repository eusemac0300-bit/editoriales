import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Instagram, Smartphone, Share2, Sparkles, Download,
    ArrowRight, Image as ImageIcon, MessageSquare,
    CheckCircle2, RefreshCw, Facebook, PlayCircle,
    Layout, Type, Palette, BookOpen, Layers, 
    Target, Brain, TrendingUp, Zap, Wand2, Eye
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
    const [tone, setTone] = useState('Elogioso')
    const [campaignStep, setCampaignStep] = useState('launch') // 'teaser', 'launch', 'proof'
    
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
                                                    <div key={idx} className="min-w-[300px] snap-center">
                                                        <div 
                                                            ref={el => carouselRefs.current[idx] = el}
                                                            className={`aspect-square relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${getStyleClasses()} border-4`}
                                                        >
                                                            <img src={slide.image} className="w-full h-full object-cover opacity-80" alt="Slide" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                                                                <span className="text-primary text-[9px] font-black tracking-widest uppercase mb-1">{slide.badge}</span>
                                                                <p className="text-white font-black text-2xl uppercase tracking-tight mb-2 leading-tight">{slide.title}</p>
                                                                <p className="text-white/80 text-xs font-medium leading-relaxed max-w-[95%]">{slide.copy}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => downloadImage({ current: carouselRefs.current[idx] }, `Campaign_${slide.badge}_${selectedBook.title}.png`)}
                                                            className="w-full mt-3 py-2 text-[10px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-3 h-3" /> Descargar {slide.badge}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={downloadZip} className="btn-primary w-full py-4 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 text-xs font-black uppercase tracking-widest group">
                                                <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" /> Descargar Campaña Completa (ZIP)
                                            </button>
                                        </div>
                                    ) : platform === 'video_script' ? (
                                        <div className="bg-slate-900 border-8 border-slate-800 rounded-[3rem] p-8 aspect-[9/16] max-w-[340px] mx-auto shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-[scan_3s_infinite]"></div>
                                            <div className="space-y-6 relative z-10">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <PlayCircle className="w-5 h-5" />
                                                    <span className="text-xs font-black uppercase tracking-widest italic">Viral Script AI</span>
                                                </div>
                                                <div className="space-y-4">
                                                    {generatedContent.videoScript.map((step, i) => (
                                                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-primary/50 transition-colors group">
                                                            <p className="text-[10px] font-black text-primary mb-1">{step.time}</p>
                                                            <p className="text-xs text-white/90 font-medium leading-relaxed">{step.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute bottom-8 left-0 w-full px-8">
                                                 <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
                                                    <p className="text-[8px] text-white/50 uppercase font-black tracking-widest mb-1 shadow-sm">Tip Audiencia</p>
                                                    <p className="text-[10px] text-white font-bold">"Sube esto entre 18:00 y 21:00 para máximo alcance."</p>
                                                 </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* 3D BOOK PREVIEW EFFECT */}
                                            <div className="flex justify-center py-10 perspective-1000">
                                                <div 
                                                    ref={singlePreviewRef}
                                                    className={`relative w-64 h-80 transition-all duration-700 preserve-3d group-hover:rotate-y-20 shadow-[20px_20px_50px_rgba(0,0,0,0.5)] ${getStyleClasses()} border-0 rounded-r-lg`}
                                                    style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-15deg) rotateX(5deg)' }}
                                                >
                                                    <div className="absolute inset-0 bg-slate-200" style={{ transform: 'translateZ(-20px)' }}></div>
                                                    <div className="absolute inset-y-0 left-0 w-5 bg-slate-300" style={{ transform: 'rotateY(-90deg) translateZ(-2.5px)' }}></div>
                                                    <img src={generatedContent.visualUrl} className="w-full h-full object-cover rounded-r-sm shadow-inner" alt="Post" />
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                                                </div>
                                            </div>

                                            <button onClick={() => downloadImage(singlePreviewRef, `Marketing_${selectedBook.title}.png`)} className="btn-primary w-full py-4 bg-emerald-600 border-emerald-500 hover:bg-emerald-700 shadow-xl text-xs font-black uppercase tracking-widest">
                                                <Download className="w-4 h-4" /> Bajar Mockup 3D (PNG)
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
