import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Zap, Sparkles, Download, RefreshCw, Layers, 
    Brain, Target, TrendingUp, Wand2, BookOpen,
    Type, Palette, Star, ShieldCheck, ChevronRight
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function Marketing3D() {
    const { data } = useAuth()
    const [selectedBookId, setSelectedBookId] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedContent, setGeneratedContent] = useState(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const [aiAnalysis, setAiAnalysis] = useState(null)
    
    // AI Intelligent Marketing State
    const [marketing3dData, setMarketing3dData] = useState({
        emotionalTone: '',
        keyHooks: [],
        suggestedProps: '',
        credits: 9, // Demo credits
        status: 'idle' // idle | analyzing | rendering | completed
    })

    const singlePreviewRef = useRef(null)
    const selectedBook = data?.books?.find(b => b.id === selectedBookId)

    const handleGenerate = async () => {
        if (!selectedBookId || !selectedBook) return
        
        if (marketing3dData.credits <= 0) {
            alert('Saldo insuficiente. Por favor, adquiere un nuevo pack de créditos Premium.')
            return
        }

        setIsGenerating(true)
        setMarketing3dData(prev => ({ ...prev, status: 'analyzing' }))

        // Paso A: Pre-procesamiento Contextual (Simulación de Gemini 3.1 Flash)
        setTimeout(() => {
            const emotionalTones = [
                ['Moody', 'Introspective', 'Melancholic'],
                ['Vibrant', 'Energetic', 'Bold'],
                ['Classic', 'Timeless', 'Elegant'],
                ['Dark', 'Gritty', 'Thriller']
            ]
            const hooksTemplates = [
                ["No podrás soltarlo", "El misterio del año", "Descubre la verdad"],
                ["Una pieza maestra", "Revolucionario", "El futuro es hoy"],
                ["La voz de una generación", "Íntimo y personal", "Emoción pura"]
            ]
            
            const randomTone = emotionalTones[Math.floor(Math.random() * emotionalTones.length)]
            const randomHooks = hooksTemplates[Math.floor(Math.random() * hooksTemplates.length)]
            const randomProps = ['Natural element (branch/leaf)', 'Dark basalt stone', 'Glass sculpture', 'Ancient key']

            setMarketing3dData(prev => ({
                ...prev,
                emotionalTone: randomTone.join(', '),
                keyHooks: randomHooks,
                suggestedProps: randomProps[Math.floor(Math.random() * randomProps.length)],
                status: 'rendering'
            }))

            // Paso B: Renderizado y Estrategia (Simulación Paso B+C)
            setTimeout(() => {
                const cover = selectedBook.cover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
                
                const analysis = {
                    dna: `Tono ${randomTone[0]} detectado. Enfoque: ${selectedBook.genre}.`,
                    target: {
                        age: '25 - 60 años',
                        interests: `#${selectedBook.genre}, #PremiumDesign, #HighLevelReading`,
                        personality: 'Lectores exigentes que aprecian el diseño y la calidad técnica.'
                    },
                    strategy: 'Marketing 3D Inteligente: Inmersión visual y gancho psicológico.'
                }
                setAiAnalysis(analysis)

                setGeneratedContent({
                    copy: `✨ EXCLUSIVIDAD 3D ✨\n\nContempla "${selectedBook.title}". Una obra que no solo se lee, se vive. De la mano de ${selectedBook.authorName}.\n\n#${selectedBook.title.replace(/\\s+/g,'')} #Premium3D #LujoLiterario`,
                    hashtags: `#${selectedBook.genre?.replace(/\\s+/g, '') || 'Libros'} #3DMarketing #PremiumBooks #AIArt`,
                    visualUrl: cover
                })

                setMarketing3dData(prev => ({ 
                    ...prev, 
                    status: 'completed',
                    credits: prev.credits - 1 
                }))
                
                setIsGenerating(false)
                confetti({
                    particleCount: 200,
                    spread: 90,
                    origin: { y: 0.5 },
                    colors: ['#00d4ff', '#1E90FF', '#ffffff']
                })
            }, 3000)
        }, 1500)
    }

    const downloadImage = async (ref, filename) => {
        if (!ref.current) return
        setIsDownloading(true)
        try {
            const dataUrl = await toPng(ref.current, { 
                quality: 1, 
                pixelRatio: 3,
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

    return (
        <div className="space-y-8 fade-in max-w-7xl mx-auto pb-20">
            {/* Premium Header */}
            <div className="relative p-10 rounded-[4rem] overflow-hidden border border-white/10 bg-black shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-emerald-900/40 opacity-50"></div>
                <div className="absolute top-0 right-0 p-12 opacity-30">
                    <Star className="w-32 h-32 text-indigo-400 rotate-12 animate-pulse" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">Premium AI Module</span>
                        </div>
                        <h1 className="text-5xl font-black text-white flex items-center gap-4 italic tracking-tighter">
                            Marketing 3D <span className="text-indigo-500 not-italic">Inteligente</span>
                        </h1>
                        <p className="text-slate-400 mt-4 max-w-xl font-medium text-lg">
                            Renderizado de producto hiperrealista y ganchos psicológicos. Diseñado para campañas de alto impacto.
                        </p>
                    </div>
                    <div className="flex flex-col items-center p-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Créditos Disponibles</span>
                        <div className="text-5xl font-black text-indigo-400 tracking-tighter">{marketing3dData.credits}</div>
                        <button className="mt-4 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-full text-[10px] font-black uppercase text-white transition-all shadow-lg shadow-indigo-500/20">Recargar Pack</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Control Panel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 border border-white/5 bg-slate-900/40 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <div className="space-y-8 relative z-10">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 mb-4 block tracking-[0.2em]">1. Seleccionar Obra</label>
                                <select
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1.2rem' }}
                                >
                                    <option value="">-- Buscar en catálogo --</option>
                                    {data?.books?.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                                <div className="flex items-center gap-3 text-indigo-400">
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Garantía de Fidelidad</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                    El Paso B usará datos técnicos reales: {selectedBook?.coverType || 'Binding no definido'}, {selectedBook?.pages || 'Sustancial'} páginas. Renderizado sin alucinaciones de texto.
                                </p>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={!selectedBookId || isGenerating}
                                className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-[2rem] shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 group disabled:opacity-50 disabled:grayscale"
                            >
                                {isGenerating ? <RefreshCw className="w-6 h-6 text-white animate-spin" /> : <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />}
                                <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Ejecutar Orquestación</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-8">
                    {!generatedContent && !isGenerating ? (
                        <div className="h-[600px] border-4 border-dashed border-slate-800 rounded-[4rem] flex flex-col items-center justify-center p-12 text-center bg-slate-900/20 group">
                            <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-700">
                                <Wand2 className="w-12 h-12 text-slate-600" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Estudio de Renderizado AI</h3>
                            <p className="text-slate-500 font-bold max-w-sm text-lg italic">"La magia comienza con un click. Analizamos la sinopsis para crear la atmósfera perfecta."</p>
                        </div>
                    ) : isGenerating ? (
                        <div className="h-[600px] bg-black rounded-[4rem] flex flex-col items-center justify-center p-12 overflow-hidden relative border border-white/5 shadow-[0_0_80px_rgba(79,70,229,0.15)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-pulse" />
                            <div className="relative z-10 flex flex-col items-center text-center gap-10">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                                    <RefreshCw className="w-24 h-24 text-indigo-500 animate-[spin_3s_linear_infinite]" />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                        {marketing3dData.status === 'analyzing' ? 'Extrayendo ADN del Título...' : 'Renderizando Geometría 3D...'}
                                    </h4>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.2s]"></div>
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.4s]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2 opacity-50">
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Gemini 3.1 Flash Orchestra</p>
                                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-indigo-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 4.5 }}
                                        ></motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            {/* Orchestration Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
                                    <Brain className="absolute -right-4 -top-4 w-20 h-20 opacity-5 text-indigo-400 group-hover:scale-125 transition-transform" />
                                    <label className="text-[10px] font-black uppercase text-indigo-400 mb-3 block tracking-widest">Emotional Tone</label>
                                    <p className="text-sm font-black text-white uppercase italic leading-tight">{marketing3dData.emotionalTone}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
                                    <Target className="absolute -right-4 -top-4 w-20 h-20 opacity-5 text-emerald-400 group-hover:scale-125 transition-transform" />
                                    <label className="text-[10px] font-black uppercase text-emerald-400 mb-3 block tracking-widest">Suggested Prop</label>
                                    <p className="text-sm font-black text-white uppercase italic leading-tight">{marketing3dData.suggestedProps}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
                                    <TrendingUp className="absolute -right-4 -top-4 w-20 h-20 opacity-5 text-purple-400 group-hover:scale-125 transition-transform" />
                                    <label className="text-[10px] font-black uppercase text-purple-400 mb-3 block tracking-widest">Strategic Hooks</label>
                                    <div className="space-y-1">
                                        {marketing3dData.keyHooks.map((h, i) => (
                                            <p key={i} className="text-[9px] font-black text-white/50 uppercase italic leading-none">{h}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Preview */}
                            <motion.div 
                                ref={singlePreviewRef}
                                className="relative rounded-[5rem] overflow-hidden bg-black p-16 border-[16px] border-slate-900 shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] flex flex-col items-center justify-center transition-all duration-1000 group/preview"
                                style={{ minHeight: '800px' }}
                            >
                                {/* High-End Render Composition (Simulation of Nano Banana 2) */}
                                <div className="absolute inset-0 bg-cover bg-center grayscale shadow-inner scale-[1.02]" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=80&w=2560)' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/40 to-transparent"></div>
                                
                                <motion.div 
                                    className="relative z-10"
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    {/* 3D Mockup Simulation */}
                                    <div className="relative w-72 h-[460px] md:w-80 md:h-[520px] rounded-r-xl shadow-[30px_50px_100px_-25px_rgba(0,0,0,1)] border-l-8 border-black/60 overflow-hidden transform group-hover/preview:scale-[1.03] transition-transform duration-1000">
                                        <img 
                                            src={generatedContent.visualUrl} 
                                            crossOrigin="anonymous"
                                            className="w-full h-full object-cover brightness-[0.8] contrast-[1.2]" 
                                            alt="Render" 
                                        />
                                        <div className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-black/60 via-transparent to-white/10 mix-blend-overlay"></div>
                                        <div className="absolute inset-0 shadow-[inset_-3px_0_30px_rgba(0,0,0,0.6)]"></div>
                                        {/* Electric Rim Light */}
                                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-indigo-500 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-indigo-500 opacity-70"></div>
                                        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-indigo-500 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-indigo-500 opacity-70"></div>
                                    </div>
                                    
                                    {/* Shadow Base */}
                                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[160%] h-32 pointer-events-none">
                                        <div className="w-full h-full bg-black rounded-[50%] blur-3xl opacity-90 scale-x-125"></div>
                                    </div>
                                </motion.div>

                                {/* Cinematic Overlay Text */}
                                <div className="text-center relative z-20 mt-24">
                                     <div className="flex items-center justify-center gap-4 mb-6">
                                        <div className="h-[1px] w-20 bg-indigo-500/40"></div>
                                        <span className="px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.4em] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                            {selectedBook.genre} • PREVENTA EXCLUSIVA
                                        </span>
                                        <div className="h-[1px] w-20 bg-indigo-500/40"></div>
                                     </div>
                                     <h3 className="text-white font-black text-6xl md:text-7xl leading-none uppercase tracking-tighter italic drop-shadow-[0_20px_40px_rgba(0,0,0,1)] mb-6">
                                        {selectedBook.title}
                                    </h3>
                                    <p className="text-indigo-400 font-black text-[18px] uppercase tracking-[0.6em] italic opacity-80">
                                        {selectedBook.authorName}
                                    </p>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>
                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none"></div>
                            </motion.div>

                            <button 
                                onClick={() => downloadImage(singlePreviewRef, `Premium_3D_Masterpiece_${selectedBook.title.replace(/\\s+/g,'_')}.png`)} 
                                disabled={isDownloading}
                                className="w-full py-8 bg-white text-black hover:bg-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 rounded-[2.5rem] transition-all group active:scale-[0.98]"
                            >
                                {isDownloading ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" /> : <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />}
                                {isDownloading ? 'Renderizando Master (4K)...' : 'Descargar Pieza Maestría (4K)'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Master Copy Preview */}
            {generatedContent && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-3">
                                <Type className="w-4 h-4" /> Copy Persuasivo IA
                            </h4>
                            <button onClick={() => { navigator.clipboard.writeText(generatedContent.copy); alert('Copiado!') }} className="text-indigo-400 text-[10px] font-black uppercase hover:underline">Copiar al portapapeles</button>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[3rem] shadow-xl">
                            <p className="text-lg text-slate-300 whitespace-pre-wrap leading-relaxed font-bold italic">
                                {generatedContent.copy}
                            </p>
                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-3">
                                {generatedContent.hashtags.split(' ').map((h, i) => (
                                    <span key={i} className="px-5 py-2 rounded-2xl bg-indigo-500/10 text-[10px] font-black text-indigo-400 border border-indigo-500/10 uppercase tracking-widest">
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group self-start">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <Star className="absolute -right-6 -top-6 w-32 h-32 opacity-10 rotate-12" />
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                <Palette className="w-4 h-4" /> AI Creator Tip
                            </h4>
                            <p className="text-xl font-black italic leading-tight mb-8">
                                "Para maximizar el impacto de este render 3D, utilízalo como imagen principal de pre-venta. La luz azul eléctrica está diseñada para captar la atención en feeds oscuros."
                            </p>
                            <div className="flex items-center gap-4 text-white/60">
                                <Star className="w-4 h-4 fill-white text-white" />
                                <Star className="w-4 h-4 fill-white text-white" />
                                <Star className="w-4 h-4 fill-white text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Estrategia Validada</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
