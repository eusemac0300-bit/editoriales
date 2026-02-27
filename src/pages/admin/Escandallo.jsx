import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3 } from 'lucide-react'

export default function Escandallo() {
    const { formatCLP } = useAuth()
    const [costs, setCosts] = useState({
        edicion: 850000, correccion: 350000, maquetacion: 450000, diseno: 350000,
        impresion: 2750000, marketing: 500000, distribucion: 300000, otros: 100000
    })
    const [pvp, setPvp] = useState(18990)
    const [tiraje, setTiraje] = useState(500)
    const [royalty, setRoyalty] = useState(10)

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
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />Calculadora de Escandallo
                </h1>
                <p className="text-dark-600 text-sm mt-1">Simulador de rentabilidad y punto de equilibrio</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Costs input */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Costos de Producción</h2>
                        <div className="space-y-3">
                            {costItems.map(item => (
                                <div key={item.key}>
                                    <label className="text-xs text-dark-600 mb-1 flex items-center gap-1">
                                        <span>{item.icon}</span> {item.label}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">$</span>
                                        <input
                                            type="number"
                                            value={costs[item.key]}
                                            onChange={e => setCosts(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                            className="input-field pl-7 text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Parámetros de Venta</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block">PVP (CLP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">$</span>
                                    <input type="number" value={pvp} onChange={e => setPvp(parseInt(e.target.value) || 0)} className="input-field pl-7 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block">Tiraje (unidades)</label>
                                <input type="number" value={tiraje} onChange={e => setTiraje(parseInt(e.target.value) || 0)} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block">% Regalía Autor</label>
                                <input type="number" value={royalty} onChange={e => setRoyalty(parseFloat(e.target.value) || 0)} className="input-field text-sm" min="0" max="100" />
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
                            <p className="text-2xl font-bold text-white">{breakEven}</p>
                            <p className="text-[10px] text-dark-600 uppercase">Punto de Equilibrio</p>
                        </div>
                        <div className="stat-card text-center">
                            <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
                            <p className="text-lg font-bold text-white">{formatCLP(costPerUnit)}</p>
                            <p className="text-[10px] text-dark-600 uppercase">Costo Unitario</p>
                        </div>
                        <div className="stat-card text-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                            <p className="text-lg font-bold text-white">{formatCLP(netMarginPerUnit)}</p>
                            <p className="text-[10px] text-dark-600 uppercase">Margen/Ud.</p>
                        </div>
                        <div className="stat-card text-center">
                            <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                            <p className={`text-2xl font-bold ${marginPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{marginPercent.toFixed(1)}%</p>
                            <p className="text-[10px] text-dark-600 uppercase">Margen %</p>
                        </div>
                    </div>

                    {/* Desglose visual */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Desglose de Costos</h2>
                        <div className="space-y-2">
                            {costItems.map(item => {
                                const pct = totalCosts > 0 ? (costs[item.key] / totalCosts) * 100 : 0
                                return (
                                    <div key={item.key} className="flex items-center gap-3">
                                        <span className="text-xs text-dark-700 w-28 truncate">{item.label}</span>
                                        <div className="flex-1 h-3 bg-dark-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary to-primary-300 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-dark-800 w-20 text-right">{formatCLP(costs[item.key])}</span>
                                        <span className="text-[10px] text-dark-600 w-12 text-right">{pct.toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                            <div className="flex items-center gap-3 pt-2 border-t border-dark-300">
                                <span className="text-xs text-white font-medium w-28">TOTAL</span>
                                <div className="flex-1" />
                                <span className="text-sm text-white font-bold w-20 text-right">{formatCLP(totalCosts)}</span>
                                <span className="text-[10px] text-white w-12 text-right">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Proyección */}
                    <div className="glass-card p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Proyección Financiera</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-dark-600 uppercase mb-1">Ingreso Proyectado</p>
                                <p className="text-xl font-bold text-white">{formatCLP(projectedRevenue)}</p>
                                <p className="text-xs text-dark-500">{tiraje} uds. × {formatCLP(pvp)}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-dark-600 uppercase mb-1">Regalías Totales</p>
                                <p className="text-xl font-bold text-amber-400">{formatCLP(tiraje * royaltyPerUnit)}</p>
                                <p className="text-xs text-dark-500">{royalty}% sobre ventas</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-4">
                                <p className="text-xs text-dark-600 uppercase mb-1">Beneficio Neto</p>
                                <p className={`text-xl font-bold ${projectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCLP(projectedProfit)}</p>
                                <p className="text-xs text-dark-500">{projectedRevenue > 0 ? ((projectedProfit / projectedRevenue) * 100).toFixed(1) : 0}% del ingreso</p>
                            </div>
                        </div>

                        {/* Break-even bar */}
                        <div className="mt-4 p-3 bg-dark-50 rounded-lg">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-dark-600">Progreso al punto de equilibrio</span>
                                <span className="text-white font-medium">{breakEven} / {tiraje} uds.</span>
                            </div>
                            <div className="h-4 bg-dark-300 rounded-full overflow-hidden relative">
                                <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, tiraje > 0 ? (breakEven / tiraje) * 100 : 0)}%` }} />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: `${tiraje > 0 ? (breakEven / tiraje) * 100 : 0}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-dark-500 mt-1">
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
