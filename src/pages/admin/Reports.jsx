import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    TrendingUp, TrendingDown, DollarSign, PieChart,
    Calendar, Download, ArrowUpRight, ArrowDownRight,
    Receipt, ShoppingBag, Truck, Users, Briefcase
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Reports() {
    const { data, formatCurrency, t } = useAuth()
    const formatCLP = formatCurrency
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

    const sales = data.finances?.sales || []
    const expenses = data.finances?.expenses || []
    const royalties = data.finances?.royalties || []
    const pos = data.purchaseOrders || []

    const metrics = useMemo(() => {
        const FIRME_CHANNELS = ['Directa', 'Librería', 'Web']
        const FLOTANTE_CHANNELS = ['Evento / Feria', 'Consignación']

        const filteredSales = sales.filter(s => s.saleDate?.startsWith(month) && s.status !== 'Anulada')
        const filteredExpenses = expenses.filter(e => e.date?.startsWith(month))
        const filteredRoyalties = royalties.filter(r => r.approvedDate?.startsWith(month))
        const filteredPos = pos.filter(p => p.date_ordered?.startsWith(month))

        const totalIncome = filteredSales.reduce((acc, s) => acc + (s.neto || 0), 0)
        const incomeFirme = filteredSales.filter(s => FIRME_CHANNELS.includes(s.channel)).reduce((acc, s) => acc + (s.neto || 0), 0)
        const incomeFlotante = filteredSales.filter(s => FLOTANTE_CHANNELS.includes(s.channel)).reduce((acc, s) => acc + (s.neto || 0), 0)

        const productionCosts = filteredPos.reduce((acc, p) => acc + (p.total_cost || 0), 0)
        const operationalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
        const royaltiesCosts = filteredRoyalties.reduce((acc, r) => acc + (r.totalAmount || 0), 0)

        const totalOutgoings = productionCosts + operationalExpenses + royaltiesCosts
        const netProfit = incomeFirme - totalOutgoings // Profit based on firm sales only for conservative reporting

        return {
            income: totalIncome,
            incomeFirme,
            incomeFlotante,
            production: productionCosts,
            opEx: operationalExpenses,
            royalties: royaltiesCosts,
            totalOutgoings,
            netProfit,
            margin: incomeFirme > 0 ? (netProfit / incomeFirme) * 100 : 0,
            filteredSales,
            filteredExpenses
        }
    }, [sales, expenses, royalties, pos, month])

    const handleExportPDF = () => {
        const doc = new jsPDF()
        const primaryColor = [31, 184, 166] // info-400 equivalent

        // Header
        doc.setFontSize(22)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("INFORME DE FLUJO DE CAJA (P&L)", 14, 25)

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Período: ${month}`, 14, 32)
        doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CL')}`, 14, 37)

        // Summary Table
        autoTable(doc, {
            startY: 45,
            head: [['Indicador', 'Valor']],
            body: [
                ['Venta en Firme (Cobrado)', formatCLP(metrics.incomeFirme)],
                ['Ingresos Totales (Neto)', formatCLP(metrics.income)],
                ['Producción (Pagos Imprenta)', formatCLP(metrics.production)],
                ['Gastos Operativos', formatCLP(metrics.opEx)],
                ['Regalías de Autores', formatCLP(metrics.royalties)],
                ['Egresos Totales', formatCLP(metrics.totalOutgoings)],
                ['Resultado del Ejercicio (P&L)', formatCLP(metrics.netProfit)]
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        })

        // Expenses Detail
        const finalY = doc.lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text("Detalle de Gastos del Mes", 14, finalY)

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Fecha', 'Descripción', 'Categoría', 'Monto']],
            body: metrics.filteredExpenses.map(e => [
                e.date,
                e.description,
                e.category,
                formatCLP(e.amount)
            ]),
            theme: 'grid',
            headStyles: { fillColor: [244, 63, 94] } // Rose-500
        })

        doc.save(`Flujo_Caja_${month}.pdf`)
    }

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-primary" /> {t('cashflow')} (P&L)
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">{t('documents')}</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="input-field py-1"
                    />
                    <button 
                        onClick={handleExportPDF}
                        className="btn-secondary py-1 px-3 flex items-center gap-2 text-sm"
                    >
                        <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card border-emerald-500/20">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Ingresos Netos Totales</p>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCLP(metrics.income)}</p>
                    <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-dark-300 pt-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-dark-600 uppercase">Venta en Firme:</span>
                            <span className="text-emerald-500 font-bold">{formatCLP(metrics.incomeFirme)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 dark:text-dark-600 uppercase">Venta Flotante:</span>
                            <span className="text-amber-500 font-bold">{formatCLP(metrics.incomeFlotante)}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card border-red-500/20">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Egresos Totales</p>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCLP(metrics.totalOutgoings)}</p>
                    <div className="mt-2 text-[10px] text-slate-500 dark:text-dark-600">Producción + Gastos + Regalías</div>
                </div>

                <div className={`stat-card ${metrics.netProfit >= 0 ? 'border-primary/20' : 'border-orange-500/20'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] text-primary uppercase font-bold tracking-wider text-primary-400">P&L (Sobre Venta Firme)</p>
                        <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <p className={`text-2xl font-bold font-mono ${metrics.netProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-orange-400'}`}>
                        {formatCLP(metrics.netProfit)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${metrics.margin > 30 ? 'bg-emerald-500' : metrics.margin > 10 ? 'bg-primary' : 'bg-orange-500'}`}
                                style={{ width: `${Math.min(Math.max(metrics.margin, 0), 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white whitespace-nowrap">{metrics.margin.toFixed(1)}% Margen</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Breakdown of Outgoings */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" /> Detalle de Egresos
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-dark-600 mb-1">
                                <span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Producción (Imprentas)</span>
                                <span className="text-slate-900 dark:text-white font-mono">{formatCLP(metrics.production)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 dark:bg-dark-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metrics.totalOutgoings > 0 ? (metrics.production / metrics.totalOutgoings) * 100 : 0}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-dark-600 mb-1">
                                <span className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Gastos Operativos</span>
                                <span className="text-slate-900 dark:text-white font-mono">{formatCLP(metrics.opEx)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 dark:bg-dark-200 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${metrics.totalOutgoings > 0 ? (metrics.opEx / metrics.totalOutgoings) * 100 : 0}%` }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-dark-600 mb-1">
                                <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Regalías y Autores</span>
                                <span className="text-slate-900 dark:text-white font-mono">{formatCLP(metrics.royalties)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 dark:bg-dark-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.totalOutgoings > 0 ? (metrics.royalties / metrics.totalOutgoings) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-dark-200 border border-slate-200 dark:border-dark-300 rounded-xl">
                        <p className="text-[10px] text-slate-500 dark:text-dark-500 uppercase font-black tracking-widest mb-3 text-center">Resumen Financiero</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 border-r border-slate-200 dark:border-dark-300/50">
                                <p className="text-[10px] text-slate-500 dark:text-dark-600">CAC de Producción</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{metrics.income > 0 ? ((metrics.production / metrics.income) * 100).toFixed(1) : 0}%</p>
                            </div>
                            <div className="text-center p-3">
                                <p className="text-[10px] text-slate-500 dark:text-dark-600">Eficiencia Operativa</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{metrics.income > 0 ? ((metrics.opEx / metrics.income) * 100).toFixed(1) : 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Expenses Ledger */}
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-dark-300">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" /> Gastos del Mes
                        </h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-dark-200/50 text-slate-500 dark:text-dark-600 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left">{t('date')}</th>
                                    <th className="px-4 py-3 text-left">{t('description')}</th>
                                    <th className="px-4 py-3 text-right">{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-300/30">
                                {expenses.filter(e => e.date?.startsWith(month)).map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50 dark:bg-dark-200/30">
                                        <td className="px-4 py-3 text-slate-500 dark:text-dark-500">{e.date}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-900 dark:text-white font-medium">{e.description}</p>
                                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-dark-300 text-slate-500 dark:text-dark-600 rounded uppercase font-bold">{e.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-red-400 font-bold">{formatCLP(e.amount)}</td>
                                    </tr>
                                ))}
                                {expenses.filter(e => e.date?.startsWith(month)).length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-10 text-center text-slate-500 dark:text-dark-600 italic">No hay gastos operativos registrados este mes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
