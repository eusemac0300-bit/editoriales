import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, Book } from 'lucide-react'

export default function Escandallo() {
    const [searchParams] = useSearchParams()
    const { formatCLP, data, updateBookDetails, addAuditLog } = useAuth()
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
        edicion: 0, correccion: 0, maquetacion: 0, diseno: 0,
        impresion: 0, marketing: 0, distribucion: 0, otros: 0
    }))
    const [pvp, setPvp] = useState(() => getInitialState('pvp', 0))
    const [tiraje, setTiraje] = useState(() => getInitialState('tiraje', 0))
    const [royalty, setRoyalty] = useState(() => getInitialState('royalty', 0))
    const [isSaving, setIsSaving] = useState(false)

    // Save to session storage whenever they change
    useEffect(() => {
        sessionStorage.setItem('escandallo_state_bookId', JSON.stringify(selectedBookId))
        sessionStorage.setItem('escandallo_state_costs', JSON.stringify(costs))
        sessionStorage.setItem('escandallo_state_pvp', JSON.stringify(pvp))
        sessionStorage.setItem('escandallo_state_tiraje', JSON.stringify(tiraje))
        sessionStorage.setItem('escandallo_state_royalty', JSON.stringify(royalty))
    }, [selectedBookId, costs, pvp, tiraje, royalty])

    const handleBookChange = (bookId) => {
        if (bookId === selectedBookId) return
        setSelectedBookId(bookId)
    }

    // Effect to load book data when selectedBookId changes
    useEffect(() => {
        if (selectedBookId && data?.books) {
            const book = data.books.find(b => b.id === selectedBookId)
            if (book) {
                // Use functional updates and spread to ensure all keys exist and avoid NaN
                if (book.escandalloCosts) {
                    setCosts(prev => ({
                        ...prev,
                        ...Object.fromEntries(
                            Object.entries(book.escandalloCosts).map(([k, v]) => [k, Number(v) || 0])
                        )
                    }))
                }
                if (book.pvp) setPvp(Number(book.pvp) || 0)
                if (book.tiraje) setTiraje(Number(book.tiraje) || 0)
                if (book.royaltyPercent) setRoyalty(Number(book.royaltyPercent) || 0)
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
        setCosts({ edicion: 0, correccion: 0, maquetacion: 0, diseno: 0, impresion: 0, marketing: 0, distribucion: 0, otros: 0 })
        setPvp(0)
        setTiraje(0)
        setRoyalty(0)
        sessionStorage.removeItem('escandallo_state_bookId')
        sessionStorage.removeItem('escandallo_state_costs')
        sessionStorage.removeItem('escandallo_state_pvp')
        sessionStorage.removeItem('escandallo_state_tiraje')
        sessionStorage.removeItem('escandallo_state_royalty')
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
            const success = await updateBookDetails(selectedBookId, {
                escandalloCosts: costs,
                pvp,
                tiraje,
                royaltyPercent: royalty
            })

            if (!success) {
                throw new Error('La base de datos rechazó la actualización. Verifique si las columnas necesarias existen.')
            }

            const book = data.books.find(b => b.id === selectedBookId)
            if (book) {
                addAuditLog(`Actualizó escandallo para título: ${book.title}`, 'general')
            }
            alert('Escandallo guardado correctamente en la base de datos.')
            resetCalculator()
        } catch (err) {
            console.error('Save failed', err)
            alert('Error al guardar datos: ' + (err.message || 'Error desconocido'))
        } finally {
            setIsSaving(false)
        }
    }

    const totalCosts = Object.values(costs).reduce((s, v) => s + v, 0)
    const costPerUnit = tiraje > 0 ? totalCosts / tiraje : 0
    const royaltyPerUnit = (pvp * royalty) / 100
    const netMarginPerUnit = pvp - costPerUnit - royaltyPerUnit
    const marginPercent = pvp > 0 ? (netMarginPerUnit / pvp) * 100 : 0
    const breakEven = netMarginPerUnit > 0 ? Math.ceil(totalCosts / (pvp - royaltyPerUnit)) : 0
    const totalRevenueAtBreakEven = breakEven * pvp
    const projectedRevenue = tiraje * pvp
    const projectedProfit = (tiraje * pvp) - totalCosts - (tiraje * royaltyPerUnit)

    const costItems = [
        { key: 'edicion', label: 'Edición', icon: '✍️' },
        { key: 'correccion', label: 'Corrección', icon: '📝' },
        { key: 'maquetacion', label: 'Maquetación', icon: '📐' },
        { key: 'diseno', label: 'Diseño Portada', icon: '🎨' },
        { key: 'impresion', label: 'Impresión', icon: '🖨️' },
        { key: 'marketing', label: 'Marketing', icon: '📢' },
        { key: 'distribucion', label: 'Distribución', icon: '🚚' },
        { key: 'otros', label: 'Otros', icon: '📦' },
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
                            Guardar en Título
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
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Costos de Producción</h2>
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
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Parámetros de Venta</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">PVP (CLP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-dark-500">$</span>
                                    <input
                                        type="text"
                                        value={formatInputValue(pvp)}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '')
                                            setPvp(val === '' ? 0 : parseInt(val, 10))
                                        }}
                                        className="input-field pl-7 text-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tiraje (unidades)</label>
                                <input
                                    type="text"
                                    value={formatInputValue(tiraje)}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '')
                                        setTiraje(val === '' ? 0 : parseInt(val, 10))
                                    }}
                                    className="input-field text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">% Regalía Autor</label>
                                <input
                                    type="number"
                                    value={royalty === 0 ? '' : royalty}
                                    onChange={e => {
                                        const val = e.target.value
                                        setRoyalty(val === '' ? 0 : parseFloat(val))
                                    }}
                                    className="input-field text-sm" min="0" max="100"
                                    placeholder="0"
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
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{breakEven}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Punto de Equilibrio</p>
                        </div>
                        <div className="stat-card text-center">
                            <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(costPerUnit)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Costo Unitario</p>
                        </div>
                        <div className="stat-card text-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(netMarginPerUnit)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Margen/Ud.</p>
                        </div>
                        <div className="stat-card text-center">
                            <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                            <p className={`text-2xl font-bold ${(!isNaN(marginPercent) && marginPercent >= 0) ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isNaN(marginPercent) ? '0.0' : marginPercent.toFixed(1)}%
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase">Margen %</p>
                        </div>
                    </div>

                    {/* Desglose visual */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Desglose de Costos</h2>
                        <div className="space-y-2">
                            {costItems.map(item => {
                                const pct = totalCosts > 0 ? (costs[item.key] / totalCosts) * 100 : 0
                                return (
                                    <div key={item.key} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-600 dark:text-dark-700 w-28 truncate">{item.label}</span>
                                        <div className="flex-1 h-3 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary to-primary-300 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-slate-700 dark:text-dark-800 w-20 text-right">{formatSafeCLP(costs[item.key])}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-dark-600 w-12 text-right">{pct.toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-dark-300">
                                <span className="text-xs text-slate-900 dark:text-white font-medium w-28">TOTAL</span>
                                <div className="flex-1" />
                                <span className="text-sm text-slate-900 dark:text-white font-bold w-20 text-right">{formatSafeCLP(totalCosts)}</span>
                                <span className="text-[10px] text-slate-900 dark:text-white w-12 text-right">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Proyección */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Proyección Financiera</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-dark-600 uppercase mb-1">Ingreso Proyectado</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatSafeCLP(projectedRevenue)}</p>
                                <p className="text-xs text-slate-500 dark:text-dark-500">{tiraje} uds. × {formatSafeCLP(pvp)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-dark-600 uppercase mb-1">Regalías Totales</p>
                                <p className="text-xl font-bold text-amber-400">{formatSafeCLP(tiraje * royaltyPerUnit)}</p>
                                <p className="text-xs text-slate-500 dark:text-dark-500">{royalty}% sobre ventas</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-dark-600 uppercase mb-1">Beneficio Neto</p>
                                <p className={`text-xl font-bold ${projectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatSafeCLP(projectedProfit)}</p>
                                <p className="text-xs text-slate-500 dark:text-dark-500">{projectedRevenue > 0 ? ((projectedProfit / projectedRevenue) * 100).toFixed(1) : 0}% del ingreso</p>
                            </div>
                        </div>

                        {/* Break-even bar */}
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-dark-50 rounded-lg">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-500 dark:text-dark-600">Progreso al punto de equilibrio</span>
                                <span className="text-slate-900 dark:text-white font-medium">{breakEven} / {tiraje} uds.</span>
                            </div>
                            <div className="h-4 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden relative">
                                <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, tiraje > 0 ? (breakEven / tiraje) * 100 : 0)}%` }} />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white dark:bg-dark-200/50" style={{ left: `${tiraje > 0 ? (breakEven / tiraje) * 100 : 0}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 dark:text-dark-500 mt-1">
                                <span>0</span>
                                <span className="text-amber-400">← P.E. ({breakEven})</span>
                                <span>{tiraje}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
