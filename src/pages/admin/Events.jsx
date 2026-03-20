import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
    Tent, Plus, Search, Calendar, MapPin, 
    BookOpen, CheckCircle2, ChevronRight, 
    AlertTriangle, ArrowDownRight, Package, 
    TrendingUp, Calculator, Clock, MoreVertical,
    X, Save, Trash2, Filter, FileText
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Events() {
    const { 
        data, addNewEvent, updateEvent, settleEvent, deleteEvent, 
        formatCLP, t 
    } = useAuth()

    const generateDispatchPDF = (eventData, items) => {
        const doc = new jsPDF()
        const primaryColor = [79, 70, 229] // indigo-600
        const secondaryColor = [31, 41, 55] // dark-800
        const lightGray = [156, 163, 175] // gray-400

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('GUÍA DE DESPACHO INTERNA (FERIA)', 20, 20)

        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(20, 25, 190, 25)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-CL')}`, 190, 32, { align: 'right' })

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text('Datos del Evento / Feria', 20, 45)

        doc.setFont('helvetica', 'normal')
        doc.text(`Nombre: ${eventData.name}`, 20, 55)
        doc.text(`Ubicación: ${eventData.location || 'No especificada'}`, 20, 62)
        doc.text(`Fecha Inicio: ${eventData.startDate}`, 20, 69)

        const tableBody = items.map(item => {
            const book = data.books?.find(b => b.id === item.bookId)
            return [
                book?.title || 'Libro Desconocido',
                book?.isbn || 'N/A',
                item.initialQty,
                '________________' // Signature or manual check column
            ]
        })

        autoTable(doc, {
            startY: 85,
            head: [['Título del Libro', 'ISBN', 'Cant. Despachada', 'Verificación Física']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        })

        const finalY = doc.lastAutoTable.finalY + 30
        doc.line(20, finalY, 80, finalY)
        doc.text('Firma Despacho', 20, finalY + 5)
        
        doc.line(130, finalY, 190, finalY)
        doc.text('Firma Recepción Feria', 130, finalY + 5)

        doc.save(`Guia_Feria_${eventData.name.replace(/\s+/g, '_')}.pdf`)
    }

    
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        location: '',
        notes: '',
        items: [] // { bookId: string, initialQty: number }
    })

    // Settle states
    const [settleData, setSettleData] = useState([]) // { id: string, soldQty: number, returnedQty: number, lostQty: number }

    const events = data?.events || []
    
    const filteredEvents = useMemo(() => {
        return events.filter(e => 
            e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [events, searchTerm])

    const stats = useMemo(() => {
        const active = events.filter(e => e.status === 'open').length
        const totalSales = events.reduce((acc, e) => {
            return acc + (e.items?.reduce((iAcc, item) => iAcc + item.soldQty, 0) || 0)
        }, 0)
        return { active, totalSales }
    }, [events])

    const handleAddItem = () => {
        setFormData(p => ({
            ...p,
            items: [...p.items, { id: Math.random().toString(36).substr(2, 9), bookId: '', initialQty: 0 }]
        }))
    }

    const handleRemoveItem = (idx) => {
        setFormData(p => ({
            ...p,
            items: p.items.filter((_, i) => i !== idx)
        }))
    }

    // Asegurar que siempre haya al menos una fila al abrir el modal
    useEffect(() => {
        if (isCreateModalOpen && formData.items.length === 0) {
            handleAddItem()
        }
    }, [isCreateModalOpen])

    const handleCreateEvent = async (e) => {
        e.preventDefault()
        if (formData.items.length === 0) return alert('Debes agregar al menos un libro')
        
        setIsSubmitting(true)
        try {
            await addNewEvent(formData, formData.items)
            generateDispatchPDF(formData, formData.items) // Generar Guía PDF automáticamente
            setIsCreateModalOpen(false)
            setFormData({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: '', location: '', notes: '', items: [] })
        } catch (err) {
            alert('Error al crear evento: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenSettle = (event) => {
        setSelectedEvent(event)
        setSettleData(event.items.map(item => ({
            id: item.id,
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            initialQty: item.initialQty,
            soldQty: 0,
            returnedQty: 0,
            lostQty: 0
        })))
        setIsSettleModalOpen(true)
    }

    const handlePerformSettle = async () => {
        // Validation: initial = sold + returned + lost
        const invalid = settleData.find(d => (d.soldQty + d.returnedQty + d.lostQty) !== d.initialQty)
        if (invalid) {
            return alert(`La cuadratura de "${invalid.bookTitle}" no coincide. Cantidad inicial: ${invalid.initialQty}, Suma: ${invalid.soldQty + invalid.returnedQty + invalid.lostQty}`)
        }

        setIsSubmitting(true)
        try {
            await settleEvent(selectedEvent.id, settleData)
            setIsSettleModalOpen(false)
        } catch (err) {
            alert('Error al cerrar evento: ' + err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Tent className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ferias y Eventos</h1>
                            <p className="text-slate-500 dark:text-dark-600 font-medium tracking-wide flex items-center gap-2">
                                <Package className="w-4 h-4" /> Gestión de consignaciones externas y cuadraturas
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white dark:bg-dark-100 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-300 flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest">Activas</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{stats.active}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-tighter hover:bg-primary-600 transition-all shadow-lg shadow-primary/25 hover:-translate-y-1 active:translate-y-0 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Iniciar Feria
                    </button>
                </div>
            </div>

            {/* Content Tabs / Filter */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main List */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-dark-700 transition-colors group-focus-within:text-primary" />
                        <input 
                            type="text"
                            placeholder="Buscar ferias o ubicaciones..."
                            className="input-field pl-12 h-14 text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredEvents.map(event => (
                            <div 
                                key={event.id}
                                className={`group bg-white dark:bg-dark-100 rounded-3xl p-6 border transition-all duration-300 ${
                                    event.status === 'open' 
                                    ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-xl shadow-emerald-500/5' 
                                    : 'border-slate-200 dark:border-dark-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${event.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-dark-200 text-slate-400'}`}>
                                            <Tent className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white">{event.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    event.status === 'open' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-dark-300 text-slate-500'
                                                }`}>
                                                    {event.status === 'open' ? 'En Curso' : 'Finalizada'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-dark-700">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" /> 
                                                    {event.startDate}{event.endDate ? ` — ${event.endDate}` : ''}
                                                </div>
                                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        {event.status === 'open' && (
                                            <button 
                                                onClick={() => handleOpenSettle(event)}
                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                            >
                                                <Calculator className="w-4 h-4" /> Cuadratura
                                            </button>
                                        )}
                                        <button onClick={() => deleteEvent(event.id)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-rose-500/10">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Items Summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-dark-50/10 rounded-2xl border border-slate-100 dark:border-dark-300/30">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest">Títulos Enviados</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{event.items?.length || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest text-emerald-500">Vendidos</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white text-emerald-500">{event.items?.reduce((a,c) => a+c.soldQty, 0) || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest text-primary">Retornados</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white text-primary">{event.items?.reduce((a,c) => a+c.returnedQty, 0) || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest text-rose-500">Mermas/Perdidas</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white text-rose-500">{event.items?.reduce((a,c) => a+c.lostQty, 0) || 0}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Card */}
                <div className="lg:col-span-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-2xl font-black tracking-tight leading-tight">Módulo de Cuadraturas <span className="opacity-50 font-normal italic">BETA</span></h2>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                Este módulo maneja la "consignación interna". Los libros que lleves a ferias se descuentan temporalmente de tu bodega central y se oficializan tras el cierre.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                    <TrendingUp className="w-5 h-5 text-indigo-300" />
                                    <p className="text-xs font-bold uppercase tracking-wide">Optimiza tu logística de eventos</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-indigo-100">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    <p className="text-xs font-bold uppercase tracking-wide">Detecta mermas y robos hormiga</p>
                                </div>
                            </div>
                        </div>
                        <Tent className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 bg-transparent rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-dark-100 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 dark:border-dark-300 flex justify-between items-center bg-slate-50/50 dark:bg-dark-50/10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Iniciar Nueva Feria</h2>
                                <p className="text-xs font-bold text-slate-400 dark:text-dark-600 uppercase tracking-widest mt-1">Crea el evento y selecciona el inventario inicial</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-dark-200 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="overflow-y-auto flex-1 p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nombre de la Feria / Evento</label>
                                    <input 
                                        type="text" required
                                        className="input-field"
                                        placeholder="Ej: Feria del Libro Usach 2024"
                                        value={formData.name}
                                        onChange={e => setFormData(p=>({...p, name: e.target.value}))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Fecha Inicio</label>
                                    <input 
                                        type="date" required
                                        className="input-field"
                                        value={formData.startDate}
                                        onChange={e => setFormData(p=>({...p, startDate: e.target.value}))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Fecha Término (Opcional)</label>
                                    <input 
                                        type="date"
                                        className="input-field"
                                        value={formData.endDate}
                                        onChange={e => setFormData(p=>({...p, endDate: e.target.value}))}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ubicación</label>
                                    <input 
                                        type="text"
                                        className="input-field"
                                        placeholder="Ej: Estación Mapocho, Santiago"
                                        value={formData.location}
                                        onChange={e => setFormData(p=>({...p, location: e.target.value}))}
                                    />
                                </div>
                            </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-dark-50/10 p-4 rounded-2xl border border-slate-100 dark:border-dark-300/30">
                                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                            <Package className="w-4 h-4 text-primary" /> Inventario a Despachar
                                        </h3>
                                        <button 
                                            type="button"
                                            onClick={handleAddItem}
                                            className="text-[10px] font-black text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all uppercase flex items-center gap-1.5 border border-primary/20"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Agregar Título
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.items.map((item, idx) => (
                                            <div key={item.id || idx} className="flex gap-4 p-4 bg-white dark:bg-dark-100 rounded-2xl border border-slate-200 dark:border-dark-300 shadow-sm animate-in slide-in-from-right-2 duration-200">
                                                <div className="flex-1 space-y-2">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Título {idx + 1}</p>
                                                    <select 
                                                        required
                                                        className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 p-0 text-slate-900 dark:text-white appearance-none"
                                                        value={item.bookId}
                                                        onChange={e => {
                                                            const nItems = [...formData.items]
                                                            nItems[idx] = { ...nItems[idx], bookId: e.target.value }
                                                            setFormData(p => ({ ...p, items: nItems }))
                                                        }}
                                                    >
                                                        <option value="" className="dark:bg-dark-100 text-slate-400">Selecciona un libro...</option>
                                                        {data?.books?.filter(b => b.status !== 'archived').sort((a,b) => a.title.localeCompare(b.title)).map(b => (
                                                            <option key={b.id} value={b.id} className="dark:bg-dark-100">{b.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-24 space-y-2 border-l border-slate-100 dark:border-dark-300 pl-4">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Cant.</p>
                                                    <input 
                                                        type="number" required min="1"
                                                        className="w-full bg-transparent border-none text-sm font-black focus:ring-0 p-0 text-center text-primary"
                                                        placeholder="0"
                                                        value={item.initialQty || ''}
                                                        onChange={e => {
                                                            const nItems = [...formData.items]
                                                            nItems[idx] = { ...nItems[idx], initialQty: parseInt(e.target.value) || 0 }
                                                            setFormData(p => ({ ...p, items: nItems }))
                                                        }}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <div className="text-center py-12 text-slate-400 text-xs italic border-2 border-dashed border-slate-100 dark:border-dark-300 rounded-3xl">
                                                No has agregado libros para llevar a la feria
                                            </div>
                                        )}
                                    </div>
                                </div>
                        </form>

                        <div className="p-8 border-t border-slate-100 dark:border-dark-300 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-50/5 transition-all transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                disabled={isSubmitting}
                                onClick={handleCreateEvent}
                                className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : 'Iniciar Feria y Generar Guía'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settle Modal (Cuadratura) */}
            {isSettleModalOpen && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-dark-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-dark-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-emerald-500/10 dark:border-emerald-500/20 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-500/5">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <Calculator className="w-6 h-6 text-emerald-500" /> Cuadratura de Cierre
                                </h2>
                                <p className="text-xs font-bold text-slate-500 dark:text-dark-600 uppercase tracking-widest mt-1">Evento: {selectedEvent.name}</p>
                            </div>
                            <button onClick={() => setIsSettleModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-dark-200 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-8">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-4 py-2">Título</th>
                                        <th className="px-4 py-2 text-center">Inicial (Llevaste)</th>
                                        <th className="px-4 py-2 text-center bg-emerald-500/10 text-emerald-600 rounded-t-xl">Vendidos</th>
                                        <th className="px-4 py-2 text-center bg-primary/10 text-primary">Volvieron</th>
                                        <th className="px-4 py-2 text-center bg-rose-500/10 text-rose-500 rounded-t-xl text-center">Mermas/Pérdidas</th>
                                        <th className="px-4 py-2 text-center">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {settleData.map((item, idx) => {
                                        const sum = item.soldQty + item.returnedQty + item.lostQty
                                        const isValid = sum === item.initialQty
                                        const diff = item.initialQty - sum

                                        return (
                                            <tr key={item.id} className="bg-slate-50 dark:bg-dark-50/10 rounded-2xl group">
                                                <td className="px-4 py-4 rounded-l-2xl">
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{item.bookTitle}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center font-black text-slate-400">{item.initialQty}</td>
                                                <td className="px-4 py-4 bg-emerald-500/5">
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent border-none text-center font-black text-emerald-600 focus:ring-0 p-0"
                                                        value={item.soldQty}
                                                        onChange={e => {
                                                            const nd = [...settleData]
                                                            nd[idx].soldQty = parseInt(e.target.value) || 0
                                                            setSettleData(nd)
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 bg-primary/5">
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent border-none text-center font-black text-primary focus:ring-0 p-0"
                                                        value={item.returnedQty}
                                                        onChange={e => {
                                                            const nd = [...settleData]
                                                            nd[idx].returnedQty = parseInt(e.target.value) || 0
                                                            setSettleData(nd)
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 bg-rose-500/5">
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent border-none text-center font-black text-rose-500 focus:ring-0 p-0"
                                                        value={item.lostQty}
                                                        onChange={e => {
                                                            const nd = [...settleData]
                                                            nd[idx].lostQty = parseInt(e.target.value) || 0
                                                            setSettleData(nd)
                                                        }}
                                                    />
                                                </td>
                                                <td className={`px-4 py-4 text-center rounded-r-2xl font-black text-xs ${isValid ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`}>
                                                    {isValid ? <CheckCircle2 className="w-5 h-5 mx-auto" /> : `Falta ${diff}`}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            <div className="mt-8 p-6 bg-slate-100 dark:bg-dark-200 rounded-3xl border border-slate-200 dark:border-dark-300 flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">Aviso de Cuadratura</p>
                                    <p className="text-xs text-slate-500 dark:text-dark-700 leading-relaxed">
                                        Al cerrar la feria, se registrarán oficialmente las ventas en el canal "Feria / Evento". El stock que "Volvió" se sumará a bodega central y las "Mermas" se registrarán como pérdidas definitivas. Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-dark-300 flex gap-4">
                            <button 
                                onClick={() => setIsSettleModalOpen(false)}
                                className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-50/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                disabled={isSubmitting}
                                onClick={handlePerformSettle}
                                className="flex-[2] px-6 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Cerrando...' : 'Cerrar Feria y Liquidar Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
