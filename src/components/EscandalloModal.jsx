import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, X, Book, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function EscandalloModal({ book, onClose }) {
    const { formatCLP, updateBookDetails, addAuditLog } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    
    const [costs, setCosts] = useState({
        edicion: 0, correccion: 0, maquetacion: 0, diseno: 0,
        impresion: 0, marketing: 0, distribucion: 0, otros: 0
    })
    const [pvp, setPvp] = useState(0)
    const [tiraje, setTiraje] = useState(0)
    const [royalty, setRoyalty] = useState(0)

    useEffect(() => {
        if (book) {
            const dbCosts = book.escandalloCosts || {}
            setCosts({
                edicion: Number(dbCosts.edicion) || 0,
                correccion: Number(dbCosts.correccion) || 0,
                maquetacion: Number(dbCosts.maquetacion) || 0,
                diseno: Number(dbCosts.diseno) || 0,
                impresion: Number(dbCosts.impresion) || 0,
                marketing: Number(dbCosts.marketing) || 0,
                distribucion: Number(dbCosts.distribucion) || 0,
                otros: Number(dbCosts.otros) || 0
            })
            setPvp(Number(book.pvp) || 0)
            setTiraje(Number(book.tiraje) || 0)
            setRoyalty(Number(book.royaltyPercent) || 0)
        }
    }, [book])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const success = await updateBookDetails(book.id, {
                escandalloCosts: costs,
                pvp,
                tiraje,
                royaltyPercent: royalty
            })

            if (success) {
                addAuditLog(`Actualizó escandallo para título: ${book.title}`, 'general')
                alert('Costos de escandallo guardados correctamente.')
                onClose()
            }
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
    const projectedRevenue = tiraje * pvp
    const projectedProfit = (tiraje * pvp) - totalCosts - (tiraje * royaltyPerUnit)

    const formatInputValue = (val) => {
        if (val === 0 || !val || isNaN(val)) return ''
        return new Intl.NumberFormat('es-CL').format(val)
    }

    const formatSafeCLP = (val) => {
        if (isNaN(val) || val === Infinity || val === -Infinity) return formatCLP(0)
        return formatCLP(val)
    }

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
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-primary/20 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-dark-300 flex justify-between items-center bg-slate-50/50 dark:bg-dark-200/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" /> Escandallo (Costos): {book.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-dark-600">Calcula y guarda los costos asociados a este título</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cost Inputs */}
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-xl p-4 border border-slate-100 dark:border-dark-300">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-primary" /> Costos de Producción
                                </h3>
                                <div className="space-y-3">
                                    {costItems.map(item => (
                                        <div key={item.key}>
                                            <label className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold mb-1 flex items-center gap-1">
                                                <span>{item.icon}</span> {item.label}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                <input
                                                    type="text"
                                                    value={formatInputValue(costs[item.key])}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '')
                                                        setCosts(prev => ({ ...prev, [item.key]: val === '' ? 0 : parseInt(val, 10) }))
                                                    }}
                                                    className="input-field pl-7 py-1.5 text-sm h-9"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-dark-50 rounded-xl p-4 border border-slate-100 dark:border-dark-300">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Parámetros
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold mb-1 block">Tiraje (unidades)</label>
                                        <input
                                            type="text"
                                            value={formatInputValue(tiraje)}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '')
                                                setTiraje(val === '' ? 0 : parseInt(val, 10))
                                            }}
                                            className="input-field py-1.5 text-sm h-9"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold mb-1 block">PVP Proyectado</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                            <input
                                                type="text"
                                                value={formatInputValue(pvp)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    setPvp(val === '' ? 0 : parseInt(val, 10))
                                                }}
                                                className="input-field pl-7 py-1.5 text-sm h-9"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold mb-1 block">% Regalía Autor</label>
                                        <input
                                            type="number"
                                            value={royalty === 0 ? '' : royalty}
                                            onChange={e => setRoyalty(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="input-field py-1.5 text-sm h-9"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Columns */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-slate-50 dark:bg-dark-50 p-4 rounded-xl border border-slate-100 dark:border-dark-300 text-center">
                                    <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{breakEven}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Punto Eq.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 p-4 rounded-xl border border-slate-100 dark:border-dark-300 text-center">
                                    <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(costPerUnit)}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Costo/Ud</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 p-4 rounded-xl border border-slate-100 dark:border-dark-300 text-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatSafeCLP(netMarginPerUnit)}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Margen Ud</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 p-4 rounded-xl border border-slate-100 dark:border-dark-300 text-center">
                                    <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                                    <p className={`text-xl font-bold ${marginPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {marginPercent.toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase">Rentab.</p>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="bg-slate-50 dark:bg-dark-50 p-5 rounded-xl border border-slate-100 dark:border-dark-300 flex-1">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Desglose Visual de Inversión</h3>
                                <div className="space-y-3">
                                    {costItems.map(item => {
                                        const pct = totalCosts > 0 ? (costs[item.key] / totalCosts) * 100 : 0
                                        if (costs[item.key] === 0) return null
                                        return (
                                            <div key={item.key} className="flex items-center gap-4">
                                                <div className="w-24 text-xs text-slate-600 dark:text-dark-700">{item.label}</div>
                                                <div className="flex-1 h-2 bg-slate-200 dark:bg-dark-300 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                                                </div>
                                                <div className="w-20 text-right text-xs font-mono font-bold text-slate-900 dark:text-white">{formatSafeCLP(costs[item.key])}</div>
                                                <div className="w-8 text-right text-[10px] text-slate-400">{pct.toFixed(0)}%</div>
                                            </div>
                                        )
                                    })}
                                    <div className="pt-3 border-t border-slate-200 dark:border-dark-300 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">COSTO TOTAL INICIAL</span>
                                        <span className="text-lg font-black text-primary font-mono">{formatSafeCLP(totalCosts)}</span>
                                    </div>
                                </div>

                                {/* Financial Projection */}
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-dark-200 p-4 rounded-xl border border-slate-100 dark:border-dark-300 shadow-sm">
                                        <p className="text-[10px] text-slate-500 uppercase mb-1">Retorno de Venta Total</p>
                                        <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatSafeCLP(projectedRevenue)}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">({tiraje} unidades al 100% de venta)</p>
                                    </div>
                                    <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm">
                                        <p className="text-[10px] text-primary uppercase mb-1">Resultado Final Obra</p>
                                        <p className={`text-xl font-bold font-mono ${projectedProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {formatSafeCLP(projectedProfit)}
                                        </p>
                                        <p className="text-[10px] text-primary/70 font-medium">Neto después de regalías y costos</p>
                                    </div>
                                </div>

                                {/* Break-even progress */}
                                <div className="mt-6 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-slate-600 dark:text-dark-700 font-medium">Necesitas vender para recuperar inversión:</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-bold">{breakEven} / {tiraje} unidades</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 dark:bg-dark-300 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, tiraje > 0 ? (breakEven / tiraje) * 100 : 0)}%` }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-dark-200 border-t border-slate-100 dark:border-dark-300 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary px-6">Cerrar</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="btn-primary px-8 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Guardar Escandallo (Costos) en Título
                    </button>
                </div>
            </div>
        </div>
    )
}
