import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
    BookOpen, Maximize2, Columns, Download, 
    RefreshCw, Type, AlignLeft, Info, 
    AlertCircle, Sparkles, ChevronLeft, ChevronRight,
    Settings, Save, FileText
} from 'lucide-react'
import { jsPDF } from 'jspdf'

export default function Maquetacion() {
    const { data } = useAuth()
    const [selectedBookId, setSelectedBookId] = useState('')
    const [text, setText] = useState('')
    const [fontSize, setFontSize] = useState(12)
    const [lineHeight, setLineHeight] = useState(1.5)
    const [margins, setMargins] = useState({ top: 20, bottom: 20, left: 15, right: 15 })
    const [pages, setPages] = useState([])
    const [isLayouting, setIsLayouting] = useState(false)
    const [stats, setStats] = useState({ victims: 0, orphans: 0 })
    const [currentPagePair, setCurrentPagePair] = useState(0)

    const selectedBook = data?.books?.find(b => b.id === selectedBookId)

    // Simulación de carga de texto si el libro tiene un manuscrito (o texto demo)
    useEffect(() => {
        if (selectedBookId) {
            setText(generateDemoText())
        }
    }, [selectedBookId])

    const generateDemoText = () => {
        return `Capítulo 1: El Comienzo del Viaje\n\n` + 
        Array(20).fill(`Este es un párrafo de ejemplo para probar la maquetación automática de nuestra aplicación Editorial Pro. Estamos implementando una lógica avanzada para detectar y corregir problemas tipográficos comunes en la industria del libro, como son las viudas y las huérfanas. Una huérfana es la primera línea de un párrafo que queda sola al final de una página. Una viuda es la última línea de un párrafo que queda sola al principio de una página. Ambos casos deben evitarse para mantener una estética profesional y una lectura fluida.\n\nEl equilibrio de las cajas es otro factor crítico. Queremos que la página izquierda (par) y la página derecha (impar) tengan exactamente la misma altura visual, lo que significa que el número de líneas debe coincidir o al menos estar balanceado ópticamente para que el lector no perciba saltos extraños entre páginas enfrentadas.`).join('\n\n')
    }

    const runLayoutEngine = () => {
        setIsLayouting(true)
        
        // Simulación de delay de "procesamiento IA"
        setTimeout(() => {
            const paragraphs = text.split('\n\n')
            const linesPerPage = 32 // Simplificación para el MVP
            let currentPages = []
            let currentPageLines = []
            let victimsCount = 0
            let orphansCount = 0

            // Algoritmo básico de distribución de líneas
            paragraphs.forEach(para => {
                const lines = para.split('. ') // Simplificamos "líneas" como oraciones para este demo visual
                
                lines.forEach((line, idx) => {
                    const isFirst = idx === 0
                    const isLast = idx === lines.length - 1

                    // Lógica de Huérfanas (Orphans): 
                    // Si estamos al final de la página y es la primera línea del párrafo
                    if (currentPageLines.length === linesPerPage - 1 && isFirst && lines.length > 1) {
                        // Movemos esta línea a la siguiente página para evitar huérfana
                        currentPages.push(currentPageLines)
                        currentPageLines = [{ content: line, type: 'orphan-fix' }]
                        orphansCount++
                    } 
                    // Lógica de Viudas (Widows):
                    // Si estamos al principio de una página y es la última línea del párrafo
                    else if (currentPageLines.length === 0 && isLast && idx > 0) {
                        // Robamos una línea de la página anterior para acompañar a la viuda
                        const lastPage = currentPages[currentPages.length - 1]
                        if (lastPage) {
                            const stolenLine = lastPage.pop()
                            // Si robamos una línea que ya era un objeto, mantenemos su contenido, si no, lo envolvemos
                            const stolenContent = typeof stolenLine === 'string' ? stolenLine : stolenLine.content
                            currentPageLines.push({ content: stolenContent, type: 'widow-fix' })
                            currentPageLines.push({ content: line, type: 'widow-fix' })
                            victimsCount++
                        } else {
                            currentPageLines.push(line)
                        }
                    }
                    else if (currentPageLines.length >= linesPerPage) {
                        currentPages.push(currentPageLines)
                        currentPageLines = [line]
                    } else {
                        currentPageLines.push(line)
                    }
                })
            })

            if (currentPageLines.length > 0) currentPages.push(currentPageLines)
            
            setPages(currentPages)
            setStats({ victims: victimsCount, orphans: orphansCount })
            setIsLayouting(false)
        }, 1000)
    }

    const exportPDF = () => {
        const doc = new jsPDF({
            unit: 'mm',
            format: [140, 210] // A5 aproximado o tamaño de libro estándar
        })

        pages.forEach((pageLines, i) => {
            if (i > 0) doc.addPage()
            doc.setFontSize(fontSize)
            let y = margins.top
            pageLines.forEach(lineObj => {
                const content = typeof lineObj === 'object' ? lineObj.content : lineObj
                doc.text(content, margins.left, y, { maxWidth: 140 - margins.left - margins.right })
                y += fontSize * lineHeight * 0.35 // pts to mm approx
            })
            // Page Number
            doc.setFontSize(8)
            doc.text(`${i + 1}`, 70, 200, { align: 'center' })
        })

        doc.save(`${selectedBook?.title || 'Maqueta'}_Interior.pdf`)
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-dark-100 p-6 rounded-[2rem] border border-slate-200 dark:border-dark-300 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Maximize2 className="w-24 h-24 text-primary" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        Maquetación <span className="text-primary italic">Pro AI</span>
                    </h1>
                    <p className="text-slate-500 dark:text-dark-700 font-medium">Motor de composición tipográfica, justificación y control de blancos.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={runLayoutEngine} 
                        disabled={!selectedBookId || isLayouting}
                        className="btn-primary px-6 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isLayouting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Maquetar Texto
                    </button>
                    {pages.length > 0 && (
                        <button onClick={exportPDF} className="btn-secondary px-6 py-2.5 text-sm font-bold flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar PDF
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Control Panel */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass-card p-6 border border-slate-200 dark:border-dark-300">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block">Título a Maquetar</label>
                                <select 
                                    value={selectedBookId}
                                    onChange={(e) => setSelectedBookId(e.target.value)}
                                    className="input-field w-full text-xs font-bold py-2.5"
                                >
                                    <option value="">Seleccionar libro...</option>
                                    {data?.books?.filter(b => b.status === 'Maquetación' || b.status === 'Edición' || b.status === 'Corrección').map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block flex items-center gap-2">
                                    <Settings className="w-3 h-3" /> Configuración de Caja
                                </label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-slate-600 dark:text-dark-700">Cuerpo Fuente</span>
                                        <input type="number" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-16 input-field py-1 text-center" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-slate-600 dark:text-dark-700">Interlineado</span>
                                        <input type="number" step="0.1" value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))} className="w-16 input-field py-1 text-center" />
                                    </div>
                                </div>
                            </div>

                            {pages.length > 0 && (
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Reporte de Maqueta
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                                        <div className="p-2 bg-white dark:bg-dark-100 rounded-lg">
                                            <p className="text-slate-400 mb-1">PÁGINAS</p>
                                            <p className="text-emerald-500 text-lg">{pages.length}</p>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-dark-100 rounded-lg">
                                            <p className="text-slate-400 mb-1">RESUELTOS</p>
                                            <p className="text-primary text-lg">{stats.victims + stats.orphans}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <div className="flex justify-between text-[9px] text-slate-500">
                                            <span>Viudas evitadas</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{stats.victims}</span>
                                        </div>
                                        <div className="flex justify-between text-[9px] text-slate-500">
                                            <span>Huérfanas evitadas</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{stats.orphans}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!selectedBookId && (
                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 items-start">
                                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed font-medium">
                                        Selecciona un libro en etapa de Maquetación para cargar su manuscrito y procesar la salida final.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Preview Area */}
                <div className="lg:col-span-9">
                    {pages.length === 0 ? (
                        <div className="glass-card min-h-[600px] flex flex-col items-center justify-center p-12 text-center border-4 border-dashed border-slate-100 dark:border-dark-400 bg-slate-50/20">
                            <BookOpen className="w-20 h-20 text-slate-200 dark:text-dark-500 mb-6" />
                            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Estación de Composición</h3>
                            <p className="text-slate-500 font-medium max-w-sm">
                                Carga el texto de tu obra para iniciar el proceso de maquetación inteligente. El sistema equilibrará las cajas automáticamente.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-3xl shadow-lg border border-white/10">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setCurrentPagePair(p => Math.max(0, p - 1))}
                                        disabled={currentPagePair === 0}
                                        className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        Páginas {currentPagePair * 2 + 1} - {Math.min(currentPagePair * 2 + 2, pages.length)}
                                    </span>
                                    <button 
                                        onClick={() => setCurrentPagePair(p => Math.min(Math.floor((pages.length - 1) / 2), p + 1))}
                                        disabled={currentPagePair * 2 + 2 >= pages.length}
                                        className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Type className="w-4 h-4 text-primary" />
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modo Preview Real</span>
                                </div>
                            </div>

                            {/* Spread View (Páginas Enfrentadas) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-dark-300 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-dark-300">
                                {[0, 1].map(offset => {
                                    const pageIdx = currentPagePair * 2 + offset
                                    const pageLines = pages[pageIdx]
                                    if (!pageLines) return <div key={offset} className="bg-slate-100/30 rounded-lg" />

                                    return (
                                        <div 
                                            key={pageIdx} 
                                            className="bg-white dark:bg-slate-50 shadow-2xl rounded-sm aspect-[14/21] p-10 flex flex-col relative border border-slate-200"
                                        >
                                            <div className="flex-1 space-y-2 overflow-hidden">
                                                {pageLines.map((lineObj, lIdx) => {
                                                    const isObject = typeof lineObj === 'object'
                                                    const content = isObject ? lineObj.content : lineObj
                                                    const type = isObject ? lineObj.type : 'normal'
                                                    
                                                    return (
                                                        <p 
                                                            key={lIdx} 
                                                            className={`text-slate-900 leading-[1.5] text-justify transition-all duration-500 ${
                                                                type === 'widow-fix' ? 'bg-amber-100/50 dark:bg-amber-900/10 border-l-2 border-amber-400 pl-1' : 
                                                                type === 'orphan-fix' ? 'bg-blue-100/50 dark:bg-blue-900/10 border-l-2 border-blue-400 pl-1' : ''
                                                            }`}
                                                            title={type !== 'normal' ? 'Línea ajustada para evitar viuda/huérfana' : ''}
                                                            style={{ 
                                                                fontSize: `${fontSize}px`,
                                                                lineHeight: lineHeight,
                                                                hyphens: 'auto'
                                                            }}
                                                        >
                                                            {content}
                                                        </p>
                                                    )
                                                })}
                                            </div>
                                            <div className="mt-auto pt-6 text-center border-t border-slate-100 italic font-serif text-slate-400 text-xs">
                                                {pageIdx + 1}
                                            </div>
                                            
                                            {/* Indicador de Equilibrio (Gutter/Margins) */}
                                            <div className={`absolute inset-y-0 w-8 bg-slate-50 shadow-inner ${offset === 0 ? 'right-0' : 'left-0'}`}></div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Raw Editor (hidden by default in Preview) */}
                            <div className="glass-card p-6">
                                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                                    <AlignLeft className="w-4 h-4" /> Editor de Texto Fuente
                                </h3>
                                <textarea 
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    className="w-full h-80 input-field text-sm font-serif leading-relaxed dark:bg-dark-300"
                                    placeholder="Pega aquí el texto del capítulo..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
