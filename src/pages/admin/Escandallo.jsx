import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, Book } from 'lucide-react'

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
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />Calculadora de Escandallo (Costos) por Título
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Simulador de rentabilidad y punto de equilibrio por obra literaria.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleClear}
                        className="btn-secondary text-xs px-4"
                    >
                        Limpiar Datos
                    </button>
                    {selectedBookId && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar Escandallo (Costos) en Título
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-primary">
                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block flex items-center gap-2">
                    <Book className="w-4 h-4 text-primary" /> Seleccionar Título
                </label>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <select
                        value={selectedBookId}
                        onChange={(e) => handleBookChange(e.target.value)}
                        className="input-field text-sm font-medium w-full md:w-1/2"
                    >
                        <option value="">-- Elige un Título --</option>
                        {data?.books?.map(b => (
                            <option key={b.id} value={b.id}>{b.title} ({b.authorName})</option>
                        ))}
                    </select>
                    {selectedBookId ? (
                        <span className="badge-blue border h-fit">Modo Edición: {data.books?.find(b => b.id === selectedBookId)?.title}</span>
                    ) : (
                        <span className="badge-yellow border h-fit">Modo: Simulador Libre</span>
                    )}
                </div>
                {!selectedBookId && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Estás en el simulador libre. Los datos no se guardarán a menos que selecciones un título.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Costs input */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Costos de Producción (Netos)</h2>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">Sin IVA</span>
                        </div>
                        <div className="space-y-3">
                            {costItems.map(item => (
                                <div key={item.key}>
                                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 flex items-center gap-1">
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
                                            className="input-field pl-7 text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex justify-between items-center">
                            Parámetros de Venta y Canales
                            <span className="text-[10px] font-normal text-slate-400">PVP Neto: {formatSafeCLP(pvpNeto)}</span>
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">PVP Neto (Sin IVA)</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(pvpNeto)}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '')
                                                setPvpNeto(val === '' ? 0 : parseInt(val, 10))
                                            }}
                                            className="input-field pl-5 text-sm py-1.5"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Tiraje</label>
                                    <input
                                        type="text"
                                        value={formatInputValue(tiraje)}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '')
                                            setTiraje(val === '' ? 0 : parseInt(val, 10))
                                        }}
                                        className="input-field text-sm py-1.5"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-dark-50 rounded-lg border border-slate-100 dark:border-dark-100">
                                <div className="flex flex-col gap-3 mb-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-700">Canal Directo</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                value={udsDirecta}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0
                                                    const p = tiraje > 0 ? (val / tiraje) * 100 : 60
                                                    setVentasCanal({ directaPercent: Math.round(p), libreriaPercent: 100 - Math.round(p) })
                                                }}
                                                className="w-16 bg-white dark:bg-dark-300 border border-slate-200 dark:border-dark-400 rounded text-center text-xs font-bold py-1"
                                            />
                                            <span className="text-[10px] text-slate-400">u.</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-700">Canal Librería</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                value={udsLibreria}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0
                                                    const p = tiraje > 0 ? (val / tiraje) * 100 : 40
                                                    setVentasCanal({ libreriaPercent: Math.round(p), directaPercent: 100 - Math.round(p) })
                                                }}
                                                className="w-16 bg-white dark:bg-dark-300 border border-slate-200 dark:border-dark-400 rounded text-center text-xs font-bold py-1"
                                            />
                                            <span className="text-[10px] text-slate-400">u.</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="range" min="0" max="100" step="5"
                                    value={ventasCanal.directaPercent}
                                    onChange={(e) => setVentasCanal({ 
                                        directaPercent: parseInt(e.target.value), 
                                        libreriaPercent: 100 - parseInt(e.target.value) 
                                    })}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[9px] text-slate-400 mt-2">
                                    <span>Más Librería ({ventasCanal.libreriaPercent}%)</span>
                                    <span>Más Directa ({ventasCanal.directaPercent}%)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Regalía Librería (%)</label>
                                    <input
                                        type="number"
                                        value={royaltyLibreria}
                                        onChange={e => setRoyaltyLibreria(parseFloat(e.target.value) || 0)}
                                        className="input-field text-sm py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Regalía Directa (%)</label>
                                    <input
                                        type="number"
                                        value={royaltyDirecta}
                                        onChange={e => setRoyaltyDirecta(parseFloat(e.target.value) || 0)}
                                        className="input-field text-sm py-1.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Inversión Marketing (% s/producción)</label>
                                <input
                                    type="number"
                                    value={marketingPercent}
                                    onChange={e => setMarketingPercent(parseFloat(e.target.value) || 0)}
                                    className="input-field text-sm py-1.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="stat-card text-center">
                            <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{breakEvenReal}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Punto de Equilibrio</p>
                        </div>
                        <div className="stat-card text-center">
                            <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(costoUnitarioTotal)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Costo Total Unit.</p>
                        </div>
                        <div className="stat-card text-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(margenUnitarioPromedio)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Margen Prom/Ud.</p>
                        </div>
                        <div className="stat-card text-center">
                            <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                            <p className={`text-2xl font-bold ${(!isNaN(marginPercent) && marginPercent >= 0) ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isNaN(marginPercent) ? '0.0' : marginPercent.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Margen Final %</p>
                        </div>
                    </div>

                    {/* Desglose visual */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Desglose de Inversión</h2>
                        <div className="space-y-2">
                            {costItems.map(item => {
                                const val = costs[item.key] || 0
                                const pct = inversionTotal > 0 ? (val / inversionTotal) * 100 : 0
                                return (
                                    <div key={item.key} className="flex items-center gap-3">
                                        <span className="text-[10px] text-slate-600 dark:text-dark-700 w-32 truncate uppercase">{item.label}</span>
                                        <div className="flex-1 h-3 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-slate-700 dark:text-dark-800 w-24 text-right font-medium">{formatSafeCLP(val)}</span>
                                        <span className="text-[10px] text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-600 dark:text-dark-700 w-32 truncate uppercase">Marketing ({marketingPercent}%)</span>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(marketingCost / inversionTotal) * 100 || 0}%` }} />
                                </div>
                                <span className="text-xs text-slate-700 dark:text-dark-800 w-24 text-right font-medium">{formatSafeCLP(marketingCost)}</span>
                                <span className="text-[10px] text-slate-400 w-8 text-right">{((marketingCost / inversionTotal) * 100 || 0).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-3 pt-2 mt-2 border-t border-slate-200 dark:border-dark-300">
                                <span className="text-xs text-slate-900 dark:text-white font-bold w-32 uppercase">Inversión Total</span>
                                <div className="flex-1" />
                                <span className="text-sm text-slate-900 dark:text-white font-black w-24 text-right">{formatSafeCLP(inversionTotal)}</span>
                                <span className="text-[10px] text-slate-900 dark:text-white w-8 text-right">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Proyección */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 font-display">Proyección Financiera Detallada</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Venta Directa ({ventasCanal.directaPercent}%)</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Ingresos:</span> <span className="font-semibold text-slate-900 dark:text-white">{formatSafeCLP(revenueDirecta)}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-400">Costo Producción:</span> <span className="text-amber-600">-{formatSafeCLP(udsDirecta * costoUnitarioProd)}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-400">Royalties ({royaltyDirecta}%):</span> <span className="text-red-400">-{formatSafeCLP(royaltiesDirecta)}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-400">Transbank (3%):</span> <span className="text-red-400">-{formatSafeCLP(costTransbank)}</span></div>
                                    <div className="flex justify-between text-xs pt-1 border-t border-emerald-100 dark:border-emerald-900/30"><span className="font-medium text-emerald-700">Utilidad Canal:</span> <span className="font-bold text-emerald-600">{formatSafeCLP(profitDirecta)}</span></div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/30">
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Venta Librerías ({ventasCanal.libreriaPercent}%)</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Ingresos (Neto -40%):</span> <span className="font-semibold text-slate-900 dark:text-white">{formatSafeCLP(revenueLibreria)}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-400">Costo Producción:</span> <span className="text-amber-600">-{formatSafeCLP(udsLibreria * costoUnitarioProd)}</span></div>
                                    <div className="flex justify-between text-[10px]"><span className="text-slate-400">Royalties ({royaltyLibreria}%):</span> <span className="text-red-400">-{formatSafeCLP(royaltiesLibreria)}</span></div>
                                    <div className="flex justify-between text-xs pt-1 border-t border-blue-100 dark:border-blue-900/30"><span className="font-medium text-blue-700">Utilidad Canal:</span> <span className="font-bold text-blue-600">{formatSafeCLP(profitLibreria)}</span></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center px-4 mb-4">
                            * La Utilidad Canal considera el retorno neto tras descontar costos de fabricación, derechos de autor y comisiones transaccionales.
                        </p>

                        <div className="bg-slate-900 dark:bg-dark-50 rounded-xl p-5 text-white">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Utilidad Neta Estimada</p>
                                    <p className={`text-3xl font-bold ${utilidadFinal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSafeCLP(utilidadFinal)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Inversión Total</p>
                                    <p className="text-xl font-semibold">{formatSafeCLP(inversionTotal)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-300">
                                    <span>Progreso al punto de equilibrio ({breakEvenReal} uds.)</span>
                                    <span>{((tiraje > 0) ? (Math.min(100, (tiraje / breakEvenReal) * 100)) : 0).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-1000" 
                                         style={{ width: `${Math.min(100, tiraje > 0 ? (tiraje / breakEvenReal) * 100 : 0)}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400 italic text-center">
                                    * El punto de equilibrio considera costos de producción, marketing y distribución.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
