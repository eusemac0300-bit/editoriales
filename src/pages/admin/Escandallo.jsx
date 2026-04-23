import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, Book } from 'lucide-react'

import { APP_VERSION as VERSION } from '../../lib/version'

export default function Escandallo() {
    const [searchParams] = useSearchParams()
    const { user, data, updateBook, refreshData } = useAuth()
    const selectedBookId = searchParams.get('bookId') || ''
    const APP_VERSION = VERSION // Keep compatibility with existing variable name if used

    // Tax rate (standard in Chile for example, but here used for calculations)
    const taxRate = 19 

    // Initial states with persistency logic
    const getInitialState = (key, defaultValue) => {
        const saved = sessionStorage.getItem(`escandallo_${key}`)
        return saved ? JSON.parse(saved) : defaultValue
    }

    const [costs, setCosts] = useState(() => getInitialState('costs', {
        preprensa: 0,
        imprenta: 0,
        correccion: 0,
        diseno: 0,
        otros: 0
    }))

    const [pvpNeto, setPvpNeto] = useState(() => getInitialState('pvpNeto', 0))
    const [tiraje, setTiraje] = useState(() => getInitialState('tiraje', 0))
    const [marketingPercent, setMarketingPercent] = useState(() => getInitialState('marketingPercent', 10))
    const [royaltyLibreria, setRoyaltyLibreria] = useState(() => getInitialState('royaltyLibreria', 10))
    const [royaltyDirecta, setRoyaltyDirecta] = useState(() => getInitialState('royaltyDirecta', 30))
    const [ventasCanal, setVentasCanal] = useState(() => getInitialState('ventasCanal', { directaPercent: 60, libreriaPercent: 40 }))
    const [isSaving, setIsSaving] = useState(false)

    // Save to session storage whenever they change
    useEffect(() => {
        sessionStorage.setItem('escandallo_costs', JSON.stringify(costs))
        sessionStorage.setItem('escandallo_pvpNeto', JSON.stringify(pvpNeto))
        sessionStorage.setItem('escandallo_tiraje', JSON.stringify(tiraje))
        sessionStorage.setItem('escandallo_marketingPercent', JSON.stringify(marketingPercent))
        sessionStorage.setItem('escandallo_royaltyLibreria', JSON.stringify(royaltyLibreria))
        sessionStorage.setItem('escandallo_royaltyDirecta', JSON.stringify(royaltyDirecta))
        sessionStorage.setItem('escandallo_ventasCanal', JSON.stringify(ventasCanal))
    }, [costs, pvpNeto, tiraje, marketingPercent, royaltyLibreria, royaltyDirecta, ventasCanal])

    // Load book data if selected
    useEffect(() => {
        if (selectedBookId && data?.books) {
            const book = data.books.find(b => b.id === selectedBookId)
            if (book && book.escandallo) {
                const esc = book.escandallo
                setCosts(esc.costs || costs)
                setPvpNeto(esc.pvpNeto || 0)
                setTiraje(esc.tiraje || 0)
                setMarketingPercent(esc.marketingPercent || 10)
                setRoyaltyLibreria(esc.royaltyLibreria || 10)
                setRoyaltyDirecta(esc.royaltyDirecta || 30)
                setVentasCanal(esc.ventasCanal || { directaPercent: 60, libreriaPercent: 40 })
            }
        }
    }, [selectedBookId, data?.books])

    const handleClear = () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar todos los datos del simulador?')) {
            setCosts({ preprensa: 0, imprenta: 0, correccion: 0, diseno: 0, otros: 0 })
            setPvpNeto(0)
            setTiraje(0)
            setMarketingPercent(10)
            setRoyaltyLibreria(10)
            setRoyaltyDirecta(30)
            setVentasCanal({ directaPercent: 60, libreriaPercent: 40 })
        }
    }

    const handleSave = async () => {
        if (!selectedBookId) return
        setIsSaving(true)
        try {
            const escandalloData = {
                costs,
                pvpNeto,
                tiraje,
                marketingPercent,
                royaltyLibreria,
                royaltyDirecta,
                ventasCanal,
                updatedAt: new Date().toISOString()
            }
            await updateBook(selectedBookId, { escandallo: escandalloData })
            alert('Escandallo guardado correctamente en el título.')
            refreshData()
        } catch (error) {
            console.error('Error saving escandallo:', error)
            alert('Error al guardar los datos.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleBookChange = (id) => {
        const url = id ? `/admin/escandallo?bookId=${id}` : '/admin/escandallo'
        window.location.href = url
    }

    // Calculations
    const inversionProduccion = Object.values(costs).reduce((a, b) => a + b, 0)
    const marketingCost = (inversionProduccion * marketingPercent) / 100
    const inversionTotal = inversionProduccion + marketingCost
    
    const costoUnitarioProd = tiraje > 0 ? inversionProduccion / tiraje : 0
    const costoUnitarioTotal = tiraje > 0 ? inversionTotal / tiraje : 0

    // Channels Revenue
    const udsDirecta = Math.round((tiraje * ventasCanal.directaPercent) / 100)
    const udsLibreria = Math.round((tiraje * ventasCanal.libreriaPercent) / 100)

    const revenueDirecta = udsDirecta * pvpNeto
    const revenueLibreria = udsLibreria * (pvpNeto * 0.6) // 40% discount for bookstores (estimate)
    const revenueTotal = revenueDirecta + revenueLibreria

    // Royalties
    const royaltiesDirecta = (revenueDirecta * royaltyDirecta) / 100
    const royaltiesLibreria = (revenueLibreria * royaltyLibreria) / 100
    
    // Transbank / Commissions (estimate 3% on direct sales)
    const costTransbank = (revenueDirecta * 0.03)

    const profitDirecta = revenueDirecta - (udsDirecta * costoUnitarioProd) - royaltiesDirecta - costTransbank
    const profitLibreria = revenueLibreria - (udsLibreria * costoUnitarioProd) - royaltiesLibreria
    
    const utilidadFinal = profitDirecta + profitLibreria - marketingCost
    const marginPercent = revenueTotal > 0 ? (utilidadFinal / revenueTotal) * 100 : 0

    // Break-even
    const margenUnitarioPromedio = tiraje > 0 ? (revenueTotal - royaltiesDirecta - royaltiesLibreria - costTransbank) / tiraje - costoUnitarioProd : 0
    const breakEvenReal = margenUnitarioPromedio > 0 ? Math.ceil(inversionTotal / (margenUnitarioPromedio + costoUnitarioProd)) : '∞'

    const formatSafeCLP = (val) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0)
    }

    const formatInputValue = (val) => {
        if (val === 0) return ''
        return val.toString()
    }

    const costItems = [
        { key: 'preprensa', label: 'Preprensa / Edición', icon: '✍️' },
        { key: 'imprenta', label: 'Imprenta / Papel', icon: '🖨️' },
        { key: 'correccion', label: 'Corrección Estilo', icon: '📝' },
        { key: 'diseno', label: 'Diseño / Maqueta', icon: '🎨' },
        { key: 'otros', label: 'Otros Gastos', icon: '➕' },
    ]

    return (
        <div className="space-y-4 fade-in pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary" />Calculadora de Escandallo
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-[10px] mt-0.5">Gestión de rentabilidad y costos por obra literaria.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClear} className="btn-secondary text-[10px] px-3 py-1">Limpiar</button>
                    {selectedBookId && (
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1">
                            {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Guardar Título
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card p-3 border-l-4 border-l-primary mb-2">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <div className="flex-1 w-full max-w-lg">
                        <label className="text-[10px] font-bold text-dark-600 uppercase mb-1 block">Título Seleccionado</label>
                        <select
                            value={selectedBookId}
                            onChange={(e) => handleBookChange(e.target.value)}
                            className="input-field text-xs h-8 w-full"
                        >
                            <option value="">-- Elige un Título --</option>
                            {data?.books?.map(b => (
                                <option key={b.id} value={b.id}>{b.title} ({b.authorName})</option>
                            ))}
                        </select>
                    </div>
                    {selectedBookId ? (
                        <span className="badge-blue border px-2 py-1 text-[10px]">Editando: {data.books?.find(b => b.id === selectedBookId)?.title.slice(0,30)}...</span>
                    ) : (
                        <span className="badge-yellow border px-2 py-1 text-[10px]">Simulador Libre</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Inputs Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-4">
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Costos Producción (Neto)</h2>
                        <div className="space-y-2">
                            {costItems.map(item => (
                                <div key={item.key}>
                                    <label className="text-[10px] text-slate-500 mb-0.5 flex items-center gap-1">
                                        <span>{item.icon}</span> {item.label}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(costs[item.key])}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '')
                                                setCosts(prev => ({ ...prev, [item.key]: val === '' ? 0 : parseInt(val, 10) }))
                                            }}
                                            className="input-field h-8 pl-6 text-xs font-mono"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Venta y Canales</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-0.5">PVP Neto</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(pvpNeto)}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '')
                                                setPvpNeto(val === '' ? 0 : parseInt(val, 10))
                                            }}
                                            className="input-field h-8 pl-5 text-xs font-bold text-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-0.5">Tiraje</label>
                                    <input
                                        type="text"
                                        value={formatInputValue(tiraje)}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '')
                                            setTiraje(val === '' ? 0 : parseInt(val, 10))
                                        }}
                                        className="input-field h-8 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="p-2.5 bg-dark-800/20 rounded border border-dark-300">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-dark-500 uppercase">Mix de Ventas (%)</span>
                                    <span className="text-[10px] font-mono">{ventasCanal.directaPercent}% Dir / {ventasCanal.libreriaPercent}% Lib</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" step="5"
                                    value={ventasCanal.directaPercent}
                                    onChange={(e) => setVentasCanal({ 
                                        directaPercent: parseInt(e.target.value), 
                                        libreriaPercent: 100 - parseInt(e.target.value) 
                                    })}
                                    className="w-full h-1 bg-dark-400 rounded-lg appearance-none cursor-pointer accent-primary mb-2"
                                />
                                <div className="flex justify-between text-[9px] text-dark-600 uppercase font-black">
                                    <span>Librería: {udsLibreria} u.</span>
                                    <span>Directa: {udsDirecta} u.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-0.5">Royalty Lib (%)</label>
                                    <input
                                        type="number"
                                        value={royaltyLibreria}
                                        onChange={e => setRoyaltyLibreria(parseFloat(e.target.value) || 0)}
                                        className="input-field h-8 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase mb-0.5">Royalty Dir (%)</label>
                                    <input
                                        type="number"
                                        value={royaltyDirecta}
                                        onChange={e => setRoyaltyDirecta(parseFloat(e.target.value) || 0)}
                                        className="input-field h-8 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-dark-300">
                                <label className="text-[10px] text-slate-500 uppercase mb-0.5">Marketing (% s/Prod)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={marketingPercent}
                                        onChange={e => setMarketingPercent(parseFloat(e.target.value) || 0)}
                                        className="input-field h-8 w-16 text-xs text-center"
                                    />
                                    <span className="text-[10px] font-bold text-amber-500">{formatSafeCLP(marketingCost)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="glass-card p-3 text-center border-b-2 border-b-amber-500">
                            <Target className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{breakEvenReal}</p>
                            <p className="text-[8px] text-dark-500 uppercase mt-1">Pto. Equilibrio</p>
                        </div>
                        <div className="glass-card p-3 text-center border-b-2 border-b-primary">
                            <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatSafeCLP(costoUnitarioTotal)}</p>
                            <p className="text-[8px] text-dark-500 uppercase mt-1">Costo Unitario</p>
                        </div>
                        <div className="glass-card p-3 text-center border-b-2 border-b-emerald-500">
                            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{formatSafeCLP(margenUnitarioPromedio)}</p>
                            <p className="text-[8px] text-dark-500 uppercase mt-1">Margen Prom/Ud</p>
                        </div>
                        <div className="glass-card p-3 text-center border-b-2 border-b-purple-500">
                            <BarChart3 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                            <p className={`text-xl font-black leading-none ${marginPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isNaN(marginPercent) ? '0.0' : marginPercent.toFixed(1)}%
                            </p>
                            <p className="text-[8px] text-dark-500 uppercase mt-1">Margen Final</p>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-tight">
                            <Calculator className="w-4 h-4 text-primary" /> Desglose de Inversión
                        </h2>
                        <div className="space-y-1.5">
                            {costItems.map(item => {
                                const val = costs[item.key] || 0
                                const pct = inversionTotal > 0 ? (val / inversionTotal) * 100 : 0
                                if (val === 0) return null
                                return (
                                    <div key={item.key} className="flex items-center gap-2">
                                        <span className="text-[9px] text-dark-600 font-bold w-28 truncate uppercase">{item.label}</span>
                                        <div className="flex-1 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/80 transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] font-mono text-dark-800 w-20 text-right">{formatSafeCLP(val)}</span>
                                        <span className="text-[9px] text-dark-500 w-6 text-right">{pct.toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                            <div className="flex items-center gap-2 pt-2 border-t border-dark-300 mt-1">
                                <span className="text-[10px] font-black text-white w-28 uppercase">Inversión Total</span>
                                <div className="flex-1" />
                                <span className="text-xs font-black text-primary w-32 text-right">{formatSafeCLP(inversionTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Proyección Pro-Canal</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div className="bg-emerald-950/20 rounded p-2.5 border border-emerald-900/30">
                                <p className="text-[9px] text-emerald-500 font-black uppercase mb-1.5">Venta Directa</p>
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between text-dark-600">Ingresos: <span className="font-bold text-white">{formatSafeCLP(revenueDirecta)}</span></div>
                                    <div className="flex justify-between text-dark-600">Regalías ({royaltyDirecta}%): <span className="text-red-400">-{formatSafeCLP(royaltiesDirecta)}</span></div>
                                    <div className="flex justify-between font-black pt-1 border-t border-emerald-900/30 text-emerald-400 italic">Neto Canal: <span>{formatSafeCLP(profitDirecta)}</span></div>
                                </div>
                            </div>
                            <div className="bg-blue-950/20 rounded p-2.5 border border-blue-900/30">
                                <p className="text-[9px] text-blue-500 font-black uppercase mb-1.5">Venta Librería</p>
                                <div className="space-y-1 text-[10px]">
                                    <div className="flex justify-between text-dark-600">Ingresos (Neto): <span className="font-bold text-white">{formatSafeCLP(revenueLibreria)}</span></div>
                                    <div className="flex justify-between text-dark-600">Regalías ({royaltyLibreria}%): <span className="text-red-400">-{formatSafeCLP(royaltiesLibreria)}</span></div>
                                    <div className="flex justify-between font-black pt-1 border-t border-blue-900/30 text-blue-400 italic">Neto Canal: <span>{formatSafeCLP(profitLibreria)}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-50 rounded-xl p-4 border border-dark-300 shadow-lg">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-center md:text-left">
                                    <p className="text-[9px] text-dark-600 uppercase font-black tracking-widest mb-0.5">Utilidad Neta Total</p>
                                    <p className={`text-3xl font-black ${utilidadFinal >= 0 ? 'text-emerald-400 shadow-emerald-400/20' : 'text-red-400'} drop-shadow-sm`}>
                                        {formatSafeCLP(utilidadFinal)}
                                    </p>
                                </div>
                                
                                <div className="flex-1 w-full max-w-xs px-2">
                                    <div className="flex justify-between text-[9px] text-dark-500 font-black uppercase mb-1">
                                        <span>Progreso Pto. Equilibrio ({breakEvenReal} u.)</span>
                                        <span>{(tiraje > 0 ? Math.min(100, (tiraje / breakEvenReal) * 100) : 0).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-dark-400 rounded-full overflow-hidden border border-dark-300">
                                        <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-1000" 
                                             style={{ width: `${Math.min(100, tiraje > 0 ? (tiraje / breakEvenReal) * 100 : 0)}%` }} />
                                    </div>
                                </div>

                                <div className="text-center md:text-right">
                                    <p className="text-[9px] text-dark-600 uppercase font-black tracking-widest mb-0.5">Inversión Riesgo</p>
                                    <p className="text-xl font-black text-white">{formatSafeCLP(inversionTotal)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
