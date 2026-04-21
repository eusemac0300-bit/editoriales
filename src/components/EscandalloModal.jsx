import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, Target, DollarSign, BarChart3, Save, X, Book, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function EscandalloModal({ book, onClose }) {
    const { formatCLP, updateBookDetails, addAuditLog, taxRate } = useAuth()
    const [isSaving, setIsSaving] = useState(false)
    
    const [costs, setCosts] = useState({
        // Edición
        preprensa: 0, traduccion: 0, prologo: 0, referato: 0, anticipo: 0, fotos: 0, ilustraciones: 0,
        // Impresión
        imprenta: 0, impresos: 0, traslados: 0,
        // Otros
        distribucion: 0, otros: 0
    })
    const [marketingPercent, setMarketingPercent] = useState(15) // % sobre costos duros
    const [pvpNeto, setPvpNeto] = useState(0)
    const [tiraje, setTiraje] = useState(0)
    const [royaltyLibreria, setRoyaltyLibreria] = useState(10)
    const [royaltyDirecta, setRoyaltyDirecta] = useState(30)
    
    // Proyección de ventas
    const [ventasCanal, setVentasCanal] = useState({
        directaPercent: 60,
        libreriaPercent: 40
    })

    useEffect(() => {
        if (book) {
            const dbEsc = book.escandalloCosts || {}
            
            // Si ya tiene el formato nuevo (anidado)
            if (dbEsc.costs) {
                setCosts({
                    preprensa: 0, traduccion: 0, prologo: 0, referato: 0, anticipo: 0, fotos: 0, ilustraciones: 0,
                    imprenta: 0, impresos: 0, traslados: 0, distribucion: 0, otros: 0,
                    ...dbEsc.costs
                })
                setMarketingPercent(dbEsc.marketingPercent || 15)
                setPvpNeto(dbEsc.pvpNeto || 0)
                setRoyaltyLibreria(dbEsc.royaltyLibreria || 10)
                setRoyaltyDirecta(dbEsc.royaltyDirecta || 30)
                setVentasCanal(dbEsc.ventasCanal || { directaPercent: 60, libreriaPercent: 40 })
            } else {
                // Formato antiguo o migración inicial
                setCosts({
                    preprensa: Number(dbEsc.preprensa || dbEsc.edicion) || 0,
                    traduccion: Number(dbEsc.traduccion) || 0,
                    prologo: Number(dbEsc.prologo) || 0,
                    referato: Number(dbEsc.referato) || 0,
                    anticipo: Number(dbEsc.anticipo) || 0,
                    fotos: Number(dbEsc.fotos) || 0,
                    ilustraciones: Number(dbEsc.ilustraciones) || 0,
                    imprenta: Number(dbEsc.imprenta || dbEsc.impresion) || 0,
                    impresos: Number(dbEsc.impresos) || 0,
                    traslados: Number(dbEsc.traslados) || 0,
                    distribucion: Number(dbEsc.distribucion) || 0,
                    otros: Number(dbEsc.otros) || 0
                })
                setPvpNeto(Math.round(Number(book.pvp) / (1 + taxRate / 100)) || 0)
            }
            setTiraje(Number(book.tiraje) || 0)
        }
    }, [book])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Empaquetamos todo en un solo objeto para el JSONB de Supabase
            const advancedEscandallo = {
                costs,
                marketingPercent,
                pvpNeto,
                royaltyLibreria,
                royaltyDirecta,
                ventasCanal,
                // Guardamos los totales para reportes rápidos si fuera necesario
                summary: {
                    inversionTotal,
                    utilidadFinal,
                    breakEvenReal,
                    costoUnitarioTotal
                }
            }

            await updateBookDetails(book.id, {
                escandalloCosts: advancedEscandallo,
                pvp: Math.round(pvpNeto * (1 + taxRate / 100)), // El pvp principal sigue siendo con IVA para el catálogo
                tiraje
            })
            
            addAuditLog(`Actualizó análisis de proyecto (Escandallo) para: ${book.title}`, 'general')
            alert('Análisis de proyecto guardado correctamente.')
            onClose()
        } catch (err) {
            alert('Error al guardar: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    // --- CÁLCULOS LÓGICA ALFONSO ---
    const IVA = 1 + (taxRate / 100)
    const pvpConIva = Math.round(pvpNeto * IVA)
    
    const totalEdicion = costs.preprensa + costs.traduccion + costs.prologo + costs.referato + costs.anticipo + costs.fotos + costs.ilustraciones
    const totalImpresion = costs.imprenta + costs.impresos + costs.traslados
    const costosDuros = totalEdicion + totalImpresion
    const montoMarketing = Math.round(costosDuros * (marketingPercent / 100))
    const inversionTotal = costosDuros + montoMarketing + costs.distribucion + costs.otros
    
    const costoUnitarioTotal = tiraje > 0 ? inversionTotal / tiraje : 0
    
    // Proyección Canales
    const unidDirecta = Math.round(tiraje * (ventasCanal.directaPercent / 100))
    const unidLibreria = Math.round(tiraje * (ventasCanal.libreriaPercent / 100))
    
    // Retorno Venta Librería (Neto)
    const porcLibreria = 40 // Margen librería estándar
    const fletesLibreria = 2 // Costo envío
    const retornoUnitLibreria = pvpNeto - (pvpNeto * (royaltyLibreria / 100)) - (pvpNeto * (porcLibreria / 100)) - (pvpNeto * (fletesLibreria / 100))
    const ingresoTotalLibreria = unidLibreria * retornoUnitLibreria
    
    // Retorno Venta Directa (Neto)
    const porcPlataforma = 0
    const porcTransbank = 2
    const retornoUnitDirecta = pvpNeto - (pvpNeto * (royaltyDirecta / 100)) - (pvpNeto * (porcPlataforma / 100)) - (pvpNeto * (porcTransbank / 100))
    const ingresoTotalDirecta = unidDirecta * retornoUnitDirecta
    
    const retornoTotalNeto = ingresoTotalLibreria + ingresoTotalDirecta
    const utilidadFinal = retornoTotalNeto - inversionTotal
    
    // Ejemplares para cubrir costos (Punto de Equilibrio Real)
    // Usamos el retorno promedio ponderado
    const retornoPromedio = (unidDirecta + unidLibreria) > 0 
        ? ((unidDirecta * retornoUnitDirecta) + (unidLibreria * retornoUnitLibreria)) / (unidDirecta + unidLibreria)
        : 0
        
    const breakEvenReal = retornoPromedio > 0 ? Math.ceil(inversionTotal / retornoPromedio) : 0
    const marginPercent = inversionTotal > 0 ? (utilidadFinal / inversionTotal) * 100 : 0

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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* INPUTS COLUMN */}
                        <div className="space-y-6">
                            {/* Costos de Edición */}
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-xl p-5 border border-slate-100 dark:border-dark-300">
                                <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center justify-between">
                                    <span>Costos de Edición (Netos)</span>
                                    <span className="text-[10px] font-medium text-slate-400">PAGO ÚNICO</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    {[
                                        { k: 'preprensa', l: 'Preprensa' },
                                        { k: 'traduccion', l: 'Traducción' },
                                        { k: 'prologo', l: 'Prólogo' },
                                        { k: 'referato', l: 'Referato' },
                                        { k: 'anticipo', l: 'Derechos (Antic.)' },
                                        { k: 'fotos', l: 'Fotografías' },
                                        { k: 'ilustraciones', l: 'Ilustraciones' },
                                    ].map(f => (
                                        <div key={f.k}>
                                            <label className="text-[9px] text-slate-500 font-bold uppercase mb-1 block">{f.l}</label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                                <input
                                                    type="text"
                                                    value={formatInputValue(costs[f.k])}
                                                    onChange={e => {
                                                        const v = e.target.value.replace(/\D/g, '')
                                                        setCosts(prev => ({ ...prev, [f.k]: v === '' ? 0 : parseInt(v, 10) }))
                                                    }}
                                                    className="input-field pl-6 py-1 h-8 text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="col-span-2 pt-2 border-t border-slate-200 mt-1 flex justify-between">
                                        <span className="text-[10px] font-bold text-slate-400">SUBTOTAL EDICIÓN</span>
                                        <span className="text-xs font-bold text-slate-900">{formatSafeCLP(totalEdicion)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Costos de Impresión y Cantidad */}
                            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Inversión Imprenta</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tiraje:</span>
                                        <input
                                            type="text"
                                            value={formatInputValue(tiraje)}
                                            onChange={e => setTiraje(parseInt(e.target.value.replace(/\D/g, '') || '0'))}
                                            className="w-16 bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-xs font-bold text-emerald-700 text-center"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { k: 'imprenta', l: 'Costo Imprenta' },
                                        { k: 'impresos', l: 'Promocionales' },
                                        { k: 'traslados', l: 'Logística/Fletes' },
                                    ].map(f => (
                                        <div key={f.k}>
                                            <label className="text-[9px] text-emerald-600/70 font-bold uppercase mb-1 block">{f.l}</label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-300">$</span>
                                                <input
                                                    type="text"
                                                    value={formatInputValue(costs[f.k])}
                                                    onChange={e => {
                                                        const v = e.target.value.replace(/\D/g, '')
                                                        setCosts(prev => ({ ...prev, [f.k]: v === '' ? 0 : parseInt(v, 10) }))
                                                    }}
                                                    className="input-field pl-6 py-1 h-8 text-xs font-mono border-emerald-100"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex flex-col justify-end p-2 bg-emerald-500/10 rounded-lg">
                                        <p className="text-[8px] font-bold text-emerald-600 uppercase">Unitario Impresión</p>
                                        <p className="text-sm font-black text-emerald-700">{formatSafeCLP(tiraje > 0 ? (totalImpresion / tiraje) : 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Marketing y Parámetros Comerciales */}
                            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xl">
                                <h3 className="text-xs font-black text-primary uppercase mb-4 tracking-widest">COMERCIALIZACIÓN Y PROYECTO</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">PVP NETO (SIN IVA)</label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-primary">$</span>
                                            <input
                                                type="text"
                                                value={formatInputValue(pvpNeto)}
                                                onChange={e => setPvpNeto(parseInt(e.target.value.replace(/\D/g, '') || '0'))}
                                                className="w-full bg-slate-800 border-none rounded-lg pl-7 py-2 text-sm font-black text-white focus:ring-2 ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">PVP FINAL ({taxRate}% IVA)</label>
                                        <div className="bg-slate-800 rounded-lg py-2 px-3 text-sm font-black text-emerald-400 border border-slate-700">
                                            {formatSafeCLP(pvpConIva)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3 border-t border-slate-700 pt-4">
                                    <div>
                                        <label className="text-[8px] text-slate-400 font-bold uppercase mb-1 block">% MKT (S/Duros)</label>
                                        <input
                                            type="number"
                                            value={marketingPercent}
                                            onChange={e => setMarketingPercent(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-800 border-none rounded p-1.5 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] text-slate-400 font-bold uppercase mb-1 block">% Reg. Librería</label>
                                        <input
                                            type="number"
                                            value={royaltyLibreria}
                                            onChange={e => setRoyaltyLibreria(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-800 border-none rounded p-1.5 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] text-slate-400 font-bold uppercase mb-1 block">% Reg. Directa</label>
                                        <input
                                            type="number"
                                            value={royaltyDirecta}
                                            onChange={e => setRoyaltyDirecta(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-800 border-none rounded p-1.5 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS & ANALYTICS COLUMN */}
                        <div className="space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-dark-100 p-5 rounded-2xl border-2 border-slate-100 dark:border-dark-300 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Target className="w-12 h-12" /></div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Inversión Total Proyecto</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatSafeCLP(inversionTotal)}</p>
                                    <p className="text-[9px] text-slate-500 mt-1">Costo Unit. Real: <span className="font-bold text-primary">{formatSafeCLP(costoUnitarioTotal)}</span></p>
                                </div>
                                <div className="bg-white dark:bg-dark-100 p-5 rounded-2xl border-2 border-slate-100 dark:border-dark-300 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><BarChart3 className="w-12 h-12" /></div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Punto de Equilibrio</p>
                                    <p className="text-2xl font-black text-amber-500 font-mono">{breakEvenReal} <span className="text-xs text-slate-400">/ {tiraje}</span></p>
                                    <p className="text-[9px] text-slate-500 mt-1">Representa el <span className="font-bold">{(tiraje > 0 ? (breakEvenReal/tiraje)*100 : 0).toFixed(0)}%</span> del tiraje</p>
                                </div>
                            </div>

                            {/* Análisis de Retornos Canal por Canal */}
                            <div className="bg-slate-50 dark:bg-dark-50 rounded-2xl border border-slate-200 dark:border-dark-300 overflow-hidden">
                                <div className="bg-slate-100 dark:bg-dark-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-slate-600 dark:text-dark-700 uppercase">ANÁLISIS DE RETORNO POR CANAL</h3>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-blue-500 mb-1">DISTRIBUCIÓN DE VENTAS (Tiraje: {tiraje})</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-bold text-slate-400">Librería</span>
                                                <input type="range" min="0" max="100" value={ventasCanal.directaPercent} onChange={e => {
                                                    const d = parseInt(e.target.value)
                                                    setVentasCanal({ directaPercent: d, libreriaPercent: 100 - d })
                                                }} className="w-24 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                                                <span className="text-[8px] font-bold text-blue-500">Directa</span>
                                            </div>
                                            <p className="text-[8px] text-slate-400 mt-1 italic">Arrastra para definir cuántas unidades vendes por canal</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 grid grid-cols-2 gap-6 bg-slate-50/50 dark:bg-dark-50/20">
                                    {/* Venta Directa */}
                                    <div className="space-y-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-full uppercase shadow-sm">Canal Directo</span>
                                            <div className="flex items-center gap-1.5">
                                                <input 
                                                    type="number"
                                                    value={unidDirecta}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0
                                                        const p = tiraje > 0 ? (val / tiraje) * 100 : 60
                                                        setVentasCanal({ directaPercent: Math.min(100, Math.round(p)), libreriaPercent: 100 - Math.min(100, Math.round(p)) })
                                                    }}
                                                    className="w-16 bg-white dark:bg-dark-300 border border-blue-200 dark:border-blue-500/30 rounded text-center text-[10px] font-bold py-0.5"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500">u.</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 bg-white/40 dark:bg-dark-200/40 p-2 rounded-lg">
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>Retorno Unit. (Neto)</span>
                                                <span className="font-black text-white bg-blue-500/20 px-1 rounded">{formatSafeCLP(retornoUnitDirecta)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>Mkt/Plataf./TBK (4%)</span>
                                                <span className="text-red-500 font-medium">-{formatSafeCLP(pvpNeto * 0.04)}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 flex flex-col items-center">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Utilidad Proyectada</p>
                                            <p className="text-lg font-black text-blue-600 font-mono tracking-tight">{formatSafeCLP(ingresoTotalDirecta)}</p>
                                        </div>
                                    </div>

                                    {/* Venta Librería */}
                                    <div className="space-y-3 p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
                                        <div className="flex justify-between items-center">
                                            <span className="px-2 py-0.5 bg-purple-500 text-white text-[8px] font-black rounded-full uppercase shadow-sm">Canal Librería</span>
                                            <div className="flex items-center gap-1.5">
                                                <input 
                                                    type="number"
                                                    value={unidLibreria}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value) || 0
                                                        const p = tiraje > 0 ? (val / tiraje) * 100 : 40
                                                        setVentasCanal({ libreriaPercent: Math.min(100, Math.round(p)), directaPercent: 100 - Math.min(100, Math.round(p)) })
                                                    }}
                                                    className="w-16 bg-white dark:bg-dark-300 border border-purple-200 dark:border-purple-500/30 rounded text-center text-[10px] font-bold py-0.5"
                                                />
                                                <span className="text-[10px] font-bold text-slate-500">u.</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 bg-white/40 dark:bg-dark-200/40 p-2 rounded-lg">
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>Retorno Unit. (Neto)</span>
                                                <span className="font-black text-white bg-purple-500/20 px-1 rounded">{formatSafeCLP(retornoUnitLibreria)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500">
                                                <span>Dto Librería (40%)</span>
                                                <span className="text-red-500 font-medium">-{formatSafeCLP(pvpNeto * 0.40)}</span>
                                            </div>
                                        </div>
                                        <div className="pt-2 flex flex-col items-center">
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Utilidad Proyectada</p>
                                            <p className="text-lg font-black text-purple-600 font-mono tracking-tight">{formatSafeCLP(ingresoTotalLibreria)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BALANCE FINAL */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                                <div className="relative">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Resultado Neto Proyectado</p>
                                            <h4 className="text-3xl font-black text-white font-mono">{formatSafeCLP(utilidadFinal)}</h4>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${marginPercent >= 15 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {marginPercent.toFixed(1)}% {marginPercent >= 15 ? <TrendingUp className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Ingresos de Venta Totales</p>
                                            <p className="text-sm font-bold text-slate-300 font-mono">{formatSafeCLP(retornoTotalNeto)}</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Inversión Recuperada</p>
                                            <p className="text-sm font-bold text-emerald-400 font-mono">{formatSafeCLP(inversionTotal)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">DERECHOS DE AUTOR A PAGAR (ESTIMADOS):</span>
                                            <span className="text-amber-400 font-bold font-mono">
                                                {formatSafeCLP((unidDirecta * (pvpNeto * royaltyDirecta / 100)) + (unidLibreria * (pvpNeto * royaltyLibreria / 100)))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">COSTO POR EJEMPLAR VENDIDO:</span>
                                            <span className="text-white font-bold font-mono">{formatSafeCLP(costoUnitarioTotal)}</span>
                                        </div>
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
