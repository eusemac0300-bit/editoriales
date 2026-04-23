import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, Book, ChevronDown, ChevronUp, Layers, Settings2, Users2 } from 'lucide-react'

export default function Escandallo() {
    const [searchParams] = useSearchParams()
    const { formatCLP, data, updateBookDetails, addAuditLog, taxRate } = useAuth()
    const getInitialState = (key, defaultVal) => {
        if (key === 'bookId') {
            const urlBookId = searchParams.get('bookId')
            if (urlBookId) return urlBookId
        }
        try {
            const saved = sessionStorage.getItem('escandallo_state_' + key)
            if (saved !== null) return JSON.parse(saved)
        } catch (e) { }
        return defaultVal
    }

    const [selectedBookId, setSelectedBookId] = useState(() => getInitialState('bookId', ''))
    const [costs, setCosts] = useState(() => getInitialState('costs', {
        preprensa: 0, traduccion: 0, prologo: 0, referato: 0, anticipo: 0, fotos: 0, ilustraciones: 0,
        imprenta: 0, impresos: 0, traslados: 0, distribucion: 0, otros: 0
    }))
    const [pvpNeto, setPvpNeto] = useState(() => getInitialState('pvpNeto', 0))
    const [tiraje, setTiraje] = useState(() => getInitialState('tiraje', 0))
    const [marketingPercent, setMarketingPercent] = useState(() => getInitialState('marketingPercent', 15))
    const [royaltyLibreria, setRoyaltyLibreria] = useState(() => getInitialState('royaltyLibreria', 10))
    const [royaltyDirecta, setRoyaltyDirecta] = useState(() => getInitialState('royaltyDirecta', 30))
    const [ventasCanal, setVentasCanal] = useState(() => getInitialState('ventasCanal', { directaPercent: 60, libreriaPercent: 40 }))
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('production') // 'production', 'sales', 'channels'
    const [sectionsOpen, setSectionsOpen] = useState({ breakdown: true, projection: false })

    // Save to session storage whenever they change
    useEffect(() => {
        sessionStorage.setItem('escandallo_state_bookId', JSON.stringify(selectedBookId))
        sessionStorage.setItem('escandallo_state_costs', JSON.stringify(costs))
        sessionStorage.setItem('escandallo_state_pvpNeto', JSON.stringify(pvpNeto))
        sessionStorage.setItem('escandallo_state_tiraje', JSON.stringify(tiraje))
        sessionStorage.setItem('escandallo_state_marketingPercent', JSON.stringify(marketingPercent))
        sessionStorage.setItem('escandallo_state_royaltyLibreria', JSON.stringify(royaltyLibreria))
        sessionStorage.setItem('escandallo_state_royaltyDirecta', JSON.stringify(royaltyDirecta))
        sessionStorage.setItem('escandallo_state_ventasCanal', JSON.stringify(ventasCanal))
    }, [selectedBookId, costs, pvpNeto, tiraje, marketingPercent, royaltyLibreria, royaltyDirecta, ventasCanal])

    const handleBookChange = (bookId) => {
        if (bookId === selectedBookId) return
        setSelectedBookId(bookId)
    }

    // Effect to load book data when selectedBookId changes
    useEffect(() => {
        if (selectedBookId && data?.books) {
            const book = data.books.find(b => b.id === selectedBookId)
            if (book) {
                // Explicitly set EVERY value. If it doesn't exist in the book, reset to default (0).
                // This prevents values from previous books from "sticking".
                const dbEsc = book.escandalloCosts || {}
                if (dbEsc.costs) {
                    setCosts({
                        preprensa: 0, traduccion: 0, prologo: 0, referato: 0, anticipo: 0, fotos: 0, ilustraciones: 0,
                        imprenta: 0, impresos: 0, traslados: 0, distribucion: 0, otros: 0,
                        ...dbEsc.costs
                    })
                    setMarketingPercent(dbEsc.marketingPercent || 15)
                    setPvpNeto(dbEsc.pvpNeto || 0)
                    // If the book has a general royaltyPercent, use it as fallback for both channels
                    setRoyaltyLibreria(dbEsc.royaltyLibreria || book.royaltyPercent || 10)
                    setRoyaltyDirecta(dbEsc.royaltyDirecta || book.royaltyPercent || 30)
                    setVentasCanal(dbEsc.ventasCanal || { directaPercent: 60, libreriaPercent: 40 })
                } else {
                    // Mapeo exhaustivo para migración
                    setCosts({
                        preprensa: Number(dbEsc.preprensa || dbEsc.edicion || 0),
                        traduccion: Number(dbEsc.traduccion || 0),
                        prologo: Number(dbEsc.prologo || 0),
                        referato: Number(dbEsc.referato || 0),
                        anticipo: Number(dbEsc.anticipo || 0),
                        fotos: Number(dbEsc.fotos || 0),
                        ilustraciones: Number(dbEsc.ilustraciones || 0),
                        imprenta: Number(dbEsc.imprenta || dbEsc.impresion || 0),
                        impresos: Number(dbEsc.impresos || 0),
                        traslados: Number(dbEsc.traslados || 0),
                        distribucion: Number(dbEsc.distribucion || 0),
                        otros: Number(dbEsc.otros || 0)
                    })
                    setPvpNeto(Math.round(Number(book.pvp) / (1 + taxRate / 100)) || 0)
                    setMarketingPercent(15)
                    setRoyaltyLibreria(book.royaltyPercent || 10)
                    setRoyaltyDirecta(book.royaltyPercent || 30)
                    setVentasCanal({ directaPercent: 60, libreriaPercent: 40 })
                }
                setTiraje(Number(book.tiraje) || 0)
            } else {
                // If the user selects "-- Elige un Título --" or similar
                resetCalculator()
            }
        }
    }, [selectedBookId, data?.books])

    // Formatting helper to avoid NaN in inputs
    const formatInputValue = (val) => {
        if (val === 0 || !val || isNaN(val)) return ''
        return new Intl.NumberFormat('es-CL').format(val)
    }

    // Formatting helper for result cards
    const formatSafeCLP = (val) => {
        if (isNaN(val) || val === Infinity || val === -Infinity) return formatCLP(0)
        return formatCLP(val)
    }

    const resetCalculator = () => {
        setSelectedBookId('')
        setCosts({
            preprensa: 0, traduccion: 0, prologo: 0, referato: 0, anticipo: 0, fotos: 0, ilustraciones: 0,
            imprenta: 0, impresos: 0, traslados: 0, distribucion: 0, otros: 0
        })
        setPvpNeto(0)
        setTiraje(0)
        setMarketingPercent(15)
        setRoyaltyLibreria(10)
        setRoyaltyDirecta(30)
        setVentasCanal({ directaPercent: 60, libreriaPercent: 40 })
        
        // Limpiar session storage
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('escandallo_state_')) sessionStorage.removeItem(key)
        })
    }

    const handleClear = () => {
        if (window.confirm('¿Deseas limpiar todos los valores de la calculadora?')) {
            resetCalculator()
        }
    }

    const handleSave = async () => {
        if (!selectedBookId) return
        setIsSaving(true)
        try {
            const advancedEscandallo = {
                costs,
                marketingPercent,
                pvpNeto,
                royaltyLibreria,
                royaltyDirecta,
                ventasCanal,
                summary: {
                    inversionTotal,
                    utilidadFinal,
                    breakEvenReal,
                    costoUnitarioTotal
                }
            }

            const success = await updateBookDetails(selectedBookId, {
                escandalloCosts: advancedEscandallo,
                pvp: Math.round(pvpNeto * (1 + taxRate / 100)),
                tiraje
            })

            if (!success) {
                throw new Error('La base de datos rechazó la actualización. Verifique si las columnas necesarias existen.')
            }

            const book = data.books.find(b => b.id === selectedBookId)
            if (book) {
                addAuditLog(`Actualizó escandallo para título: ${book.title}`, 'general')
            }
            alert('Escandallo (Costos) guardado correctamente en la base de datos.')
            resetCalculator()
        } catch (err) {
            console.error('Save failed', err)
            alert('Error al guardar datos: ' + (err.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    // Cálculos Financieros Avanzados
    const totalEdicion = costs.preprensa + costs.traduccion + costs.prologo + costs.referato + costs.anticipo + costs.fotos + costs.ilustraciones
    const totalImpresion = costs.imprenta + costs.impresos + costs.traslados
    const totalProduccion = totalEdicion + totalImpresion
    const marketingCost = (totalProduccion * marketingPercent) / 100
    const inversionTotal = totalProduccion + marketingCost + (costs.distribucion || 0) + (costs.otros || 0)

    const costoUnitarioProd = tiraje > 0 ? totalProduccion / tiraje : 0
    const costoUnitarioTotal = tiraje > 0 ? inversionTotal / tiraje : 0

    // Cálculos de Venta (Promedio Ponderado por Canal)
    const udsDirecta = (tiraje * ventasCanal.directaPercent) / 100
    const udsLibreria = (tiraje * ventasCanal.libreriaPercent) / 100

    const revenueDirecta = udsDirecta * pvpNeto
    const costTransbank = revenueDirecta * 0.03 // Estimado Transbank
    const royaltiesDirecta = (revenueDirecta * royaltyDirecta) / 100
    const profitDirecta = revenueDirecta - (udsDirecta * costoUnitarioProd) - costTransbank - royaltiesDirecta

    const revenueLibreria = udsLibreria * (pvpNeto * 0.6) // 40% descuento comercial
    const royaltiesLibreria = (udsLibreria * pvpNeto * royaltyLibreria) / 100
    const profitLibreria = revenueLibreria - (udsLibreria * costoUnitarioProd) - royaltiesLibreria

    const utilidadFinal = profitDirecta + profitLibreria - marketingCost - (costs.distribucion || 0) - (costs.otros || 0)
    
    // Margen real promedio por unidad (después de descuentos y royalties)
    const revenueTotalReal = revenueDirecta + revenueLibreria
    const totalRoyalties = royaltiesDirecta + royaltiesLibreria
    const margenBrutoTotal = revenueTotalReal - totalRoyalties - costTransbank
    const margenUnitarioPromedio = tiraje > 0 ? (margenBrutoTotal / tiraje) - costoUnitarioProd : 0

    const breakEvenReal = margenUnitarioPromedio > 0 ? Math.ceil(inversionTotal / margenUnitarioPromedio) : 0
    const marginPercent = revenueTotalReal > 0 ? (utilidadFinal / revenueTotalReal) * 100 : 0

    const costItems = [
        { key: 'preprensa', label: 'Preprensa/Edición', icon: '✍️', category: 'edicion' },
        { key: 'traduccion', label: 'Traducción', icon: '🌐', category: 'edicion' },
        { key: 'prologo', label: 'Prólogo', icon: '📄', category: 'edicion' },
        { key: 'referato', label: 'Referato', icon: '👁️', category: 'edicion' },
        { key: 'anticipo', label: 'Derechos (Antic.)', icon: '💰', category: 'edicion' },
        { key: 'imprenta', label: 'Imprenta (Neto)', icon: '🖨️', category: 'impresion' },
        { key: 'distribucion', label: 'Distribución/Flete', icon: '🚚', category: 'otros' },
        { key: 'otros', label: 'Otros Gastos', icon: '📦', category: 'otros' },
    ]

    return (
        <div className="space-y-6 fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />Calculadora de Escandallo
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Simulador de rentabilidad por obra literaria.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleClear}
                        className="btn-secondary text-xs px-4"
                    >
                        Limpiar
                    </button>
                    {selectedBookId && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2 text-sm px-4"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar Cambios
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card p-4 border-l-4 border-l-primary">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 w-full max-w-xl">
                        <label className="text-[10px] font-bold text-dark-600 uppercase mb-1 block flex items-center gap-2">
                            <Book className="w-3 h-3 text-primary" /> Título Seleccionado
                        </label>
                        <select
                            value={selectedBookId}
                            onChange={(e) => handleBookChange(e.target.value)}
                            className="input-field text-sm font-medium w-full"
                        >
                            <option value="">-- Elige un Título --</option>
                            {data?.books?.map(b => (
                                <option key={b.id} value={b.id}>{b.title} ({b.authorName})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedBookId ? (
                            <span className="badge-blue border px-3 py-1.5">Editando: {data.books?.find(b => b.id === selectedBookId)?.title.slice(0,25)}...</span>
                        ) : (
                            <span className="badge-yellow border px-3 py-1.5 text-xs">Simulador Libre</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Inputs con Pestañas */}
                <div className="lg:col-span-4 space-y-4 sticky top-6">
                    <div className="glass-card p-0 overflow-hidden">
                        <div className="flex border-b border-dark-300">
                            <button 
                                onClick={() => setActiveTab('production')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeTab === 'production' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-dark-500 hover:bg-dark-300'}`}
                            >
                                <Layers className="w-4 h-4" /> Costos
                            </button>
                            <button 
                                onClick={() => setActiveTab('sales')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeTab === 'sales' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-dark-500 hover:bg-dark-300'}`}
                            >
                                <Settings2 className="w-4 h-4" /> Parámetros
                            </button>
                            <button 
                                onClick={() => setActiveTab('channels')}
                                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${activeTab === 'channels' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-dark-500 hover:bg-dark-300'}`}
                            >
                                <Users2 className="w-4 h-4" /> Regalías
                            </button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto thin-scrollbar">
                            {activeTab === 'production' && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-dark-500 uppercase border-b border-dark-300 pb-1 mb-3">Producción y Editorial</h3>
                                    {costItems.map(item => (
                                        <div key={item.key}>
                                            <label className="text-[11px] text-slate-500 dark:text-dark-600 mb-1 flex items-center gap-1">
                                                <span>{item.icon}</span> {item.label}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-dark-500">$</span>
                                                <input
                                                    type="text"
                                                    value={formatInputValue(costs[item.key])}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '')
                                                        setCosts(prev => ({ ...prev, [item.key]: val === '' ? 0 : parseInt(val, 10) }))
                                                    }}
                                                    className="input-field h-9 pl-7 text-xs font-mono"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'sales' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-dark-500 uppercase border-b border-dark-300 pb-1 mb-3">Ventas y Tiraje</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-[11px] text-slate-500 uppercase mb-1 block">PVP Neto Sugerido</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                <input
                                                    type="text"
                                                    value={formatInputValue(pvpNeto)}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '')
                                                        setPvpNeto(val === '' ? 0 : parseInt(val, 10))
                                                    }}
                                                    className="input-field h-10 pl-7 text-sm font-bold text-primary"
                                                />
                                            </div>
                                            <p className="text-[10px] text-dark-600 mt-1">S/IVA. Con IVA: {formatSafeCLP(Math.round(pvpNeto * (1 + taxRate/100)))}</p>
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-slate-500 uppercase mb-1 block">Tiraje (Unidades)</label>
                                            <input
                                                type="text"
                                                value={formatInputValue(tiraje)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    setTiraje(val === '' ? 0 : parseInt(val, 10))
                                                }}
                                                className="input-field h-10 text-sm font-bold"
                                            />
                                        </div>
                                        <div className="pt-2 border-t border-dark-300">
                                            <label className="text-[11px] text-slate-500 uppercase mb-1 block">Inversión Marketing (% s/Prod)</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    value={marketingPercent}
                                                    onChange={e => setMarketingPercent(parseFloat(e.target.value) || 0)}
                                                    className="input-field h-9 w-20 text-sm text-center"
                                                />
                                                <span className="text-xs font-bold font-mono text-amber-500">{formatSafeCLP(marketingCost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'channels' && (
                                <div className="space-y-5">
                                    <h3 className="text-xs font-bold text-dark-500 uppercase border-b border-dark-300 pb-1 mb-3">Distribución y Regalías</h3>
                                    
                                    <div className="p-3 bg-dark-800/30 rounded-lg border border-dark-300">
                                        <p className="text-[10px] text-dark-500 font-bold uppercase mb-3 flex justify-between">
                                            Mix de Ventas <span>{ventasCanal.directaPercent}% Dir / {ventasCanal.libreriaPercent}% Lib</span>
                                        </p>
                                        <input 
                                            type="range" min="0" max="100" step="5"
                                            value={ventasCanal.directaPercent}
                                            onChange={(e) => setVentasCanal({ 
                                                directaPercent: parseInt(e.target.value), 
                                                libreriaPercent: 100 - parseInt(e.target.value) 
                                            })}
                                            className="w-full h-1.5 bg-dark-400 rounded-lg appearance-none cursor-pointer accent-primary mb-4"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-2 bg-dark-300/50 rounded border border-dark-400">
                                                <p className="text-[9px] text-dark-600 uppercase">Directa</p>
                                                <p className="text-xs font-bold">{udsDirecta} ud.</p>
                                            </div>
                                            <div className="text-center p-2 bg-dark-300/50 rounded border border-dark-400">
                                                <p className="text-[9px] text-dark-600 uppercase">Librería</p>
                                                <p className="text-xs font-bold">{udsLibreria} ud.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[11px] text-slate-500 uppercase mb-1 block">Regalía Librería (%)</label>
                                            <input
                                                type="number"
                                                value={royaltyLibreria}
                                                onChange={e => setRoyaltyLibreria(parseFloat(e.target.value) || 0)}
                                                className="input-field h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-slate-500 uppercase mb-1 block">Regalía Directa (%)</label>
                                            <input
                                                type="number"
                                                value={royaltyDirecta}
                                                onChange={e => setRoyaltyDirecta(parseFloat(e.target.value) || 0)}
                                                className="input-field h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resultados Consolidados */}
                <div className="lg:col-span-8 space-y-4">
                    {/* KPIs Miniaturizados */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="glass-card p-3 border-b-2 border-b-amber-500">
                            <p className="text-[9px] text-dark-600 font-black uppercase text-center mb-1">Punto Equilibrio</p>
                            <div className="flex items-center justify-center gap-1">
                                <Target className="w-3 h-3 text-amber-500" />
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{breakEvenReal}</p>
                            </div>
                            <p className="text-[8px] text-dark-500 text-center mt-1 uppercase">unidades</p>
                        </div>
                        <div className="glass-card p-3 border-b-2 border-b-primary">
                            <p className="text-[9px] text-dark-600 font-black uppercase text-center mb-1">Costo Unit. Total</p>
                            <div className="flex items-center justify-center gap-1">
                                <DollarSign className="w-3 h-3 text-primary" />
                                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatSafeCLP(costoUnitarioTotal)}</p>
                            </div>
                            <p className="text-[8px] text-dark-500 text-center mt-1 uppercase">por ejemplar</p>
                        </div>
                        <div className="glass-card p-3 border-b-2 border-b-emerald-500">
                            <p className="text-[9px] text-dark-600 font-black uppercase text-center mb-1">Margen por Ud.</p>
                            <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatSafeCLP(margenUnitarioPromedio)}</p>
                            </div>
                            <p className="text-[8px] text-dark-500 text-center mt-1 uppercase">promedio</p>
                        </div>
                        <div className="glass-card p-3 border-b-2 border-b-purple-500">
                            <p className="text-[9px] text-dark-600 font-black uppercase text-center mb-1">Margen Final %</p>
                            <div className="flex items-center justify-center gap-1">
                                <BarChart3 className="w-3 h-3 text-purple-500" />
                                <p className={`text-xl font-black leading-none ${marginPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isNaN(marginPercent) ? '0.0' : marginPercent.toFixed(1)}%
                                </p>
                            </div>
                            <p className="text-[8px] text-dark-500 text-center mt-1 uppercase">sobre venta</p>
                        </div>
                    </div>

                    {/* Desglose Colapsable */}
                    <div className="glass-card overflow-hidden">
                        <button 
                            onClick={() => setSectionsOpen({...sectionsOpen, breakdown: !sectionsOpen.breakdown})}
                            className="w-full flex items-center justify-between p-4 hover:bg-dark-300 transition-colors"
                        >
                            <h2 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-primary" /> Desglose Detallado de Inversión
                            </h2>
                            {sectionsOpen.breakdown ? <ChevronUp className="w-4 h-4 text-dark-600" /> : <ChevronDown className="w-4 h-4 text-dark-600" />}
                        </button>
                        {sectionsOpen.breakdown && (
                            <div className="p-4 pt-0 space-y-2 border-t border-dark-300 mt-2 slide-down">
                                {costItems.map(item => {
                                    const val = costs[item.key] || 0
                                    const pct = inversionTotal > 0 ? (val / inversionTotal) * 100 : 0
                                    if (val === 0) return null
                                    return (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <span className="text-[9px] text-dark-600 font-bold w-24 truncate uppercase">{item.label}</span>
                                            <div className="flex-1 h-2 bg-dark-300 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono text-dark-800 w-20 text-right">{formatSafeCLP(val)}</span>
                                            <span className="text-[9px] text-dark-500 w-6 text-right">{pct.toFixed(0)}%</span>
                                        </div>
                                    )
                                })}
                                <div className="flex items-center gap-2 pt-2 border-t border-dark-300 mt-2">
                                    <span className="text-xs font-black text-white w-24 uppercase">Inversión Total</span>
                                    <div className="flex-1" />
                                    <span className="text-sm font-black text-primary w-32 text-right">{formatSafeCLP(inversionTotal)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Proyección Colapsable */}
                    <div className="glass-card overflow-hidden">
                        <button 
                            onClick={() => setSectionsOpen({...sectionsOpen, projection: !sectionsOpen.projection})}
                            className="w-full flex items-center justify-between p-4 hover:bg-dark-300 transition-colors"
                        >
                            <h2 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Proyección por Canales
                            </h2>
                            {sectionsOpen.projection ? <ChevronUp className="w-4 h-4 text-dark-600" /> : <ChevronDown className="w-4 h-4 text-dark-600" />}
                        </button>
                        {sectionsOpen.projection && (
                            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dark-300 mt-2 slide-down">
                                <div className="bg-emerald-950/20 rounded-lg p-3 border border-emerald-900/30">
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase mb-2">Canal Directo</p>
                                    <div className="space-y-1 text-[11px]">
                                        <div className="flex justify-between"><span className="text-dark-600">Ingresos:</span> <span className="font-bold text-white">{formatSafeCLP(revenueDirecta)}</span></div>
                                        <div className="flex justify-between"><span className="text-dark-600">Regalías ({royaltyDirecta}%):</span> <span className="text-red-400">-{formatSafeCLP(royaltiesDirecta)}</span></div>
                                        <div className="flex justify-between font-bold pt-1 border-t border-emerald-900/30 text-emerald-400"><span>Utilidad:</span> <span>{formatSafeCLP(profitDirecta)}</span></div>
                                    </div>
                                </div>
                                <div className="bg-blue-950/20 rounded-lg p-3 border border-blue-900/30">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-2">Canal Librería</p>
                                    <div className="space-y-1 text-[11px]">
                                        <div className="flex justify-between"><span className="text-dark-600">Ingresos (40% desc):</span> <span className="font-bold text-white">{formatSafeCLP(revenueLibreria)}</span></div>
                                        <div className="flex justify-between"><span className="text-dark-600">Regalías ({royaltyLibreria}%):</span> <span className="text-red-400">-{formatSafeCLP(royaltiesLibreria)}</span></div>
                                        <div className="flex justify-between font-bold pt-1 border-t border-blue-900/30 text-blue-400"><span>Utilidad:</span> <span>{formatSafeCLP(profitLibreria)}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resumen Final de Impacto - SIEMPRE VISIBLE */}
                    <div className="bg-dark-50 rounded-xl p-5 border border-dark-300 shadow-xl shadow-black/20">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] text-dark-600 uppercase font-bold tracking-widest mb-1">Utilidad Neta Estimada</p>
                                <p className={`text-4xl font-black ${utilidadFinal >= 0 ? 'text-emerald-400 shadow-emerald-400/20' : 'text-red-400'} drop-shadow-sm`}>
                                    {formatSafeCLP(utilidadFinal)}
                                </p>
                            </div>
                            
                            <div className="flex-1 w-full max-w-xs">
                                <div className="flex justify-between text-[10px] text-dark-500 font-bold uppercase mb-1">
                                    <span>Punto Equilibrio: {breakEvenReal} uds.</span>
                                    <span>{(tiraje > 0 ? Math.min(100, (tiraje / breakEvenReal) * 100) : 0).toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 bg-dark-400 rounded-full overflow-hidden border border-dark-300">
                                    <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-1000" 
                                         style={{ width: `${Math.min(100, tiraje > 0 ? (tiraje / breakEvenReal) * 100 : 0)}%` }} />
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-[10px] text-dark-600 uppercase font-bold tracking-widest mb-1">Inversión Riesgo</p>
                                <p className="text-2xl font-black text-white">{formatSafeCLP(inversionTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
