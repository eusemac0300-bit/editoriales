import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
    Wallet, TrendingUp, TrendingDown,
    ArrowRight, Calendar, Info,
    AlertCircle, CheckCircle2, DollarSign,
    Truck, Users, Briefcase, FileText, Download, Printer
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Cashflow() {
    const { data, formatCLP } = useAuth()
    const [viewMode, setViewMode] = useState('30_DAYS') // 30_DAYS, 90_DAYS

    const sales = data.finances?.sales || []
    const expenses = data.finances?.expenses || []
    const royaltiesList = data.finances?.royalties || []
    const consignments = data.finances?.consignments || []
    const pos = data.purchaseOrders || []

    const calculations = useMemo(() => {
        // 1. Cuentas por Cobrar (Consignaciones Pendientes y Vendidas no liquidadas)
        const pendingReceivables = consignments
            .filter(c => c.status !== 'FINALIZADO')
            .reduce((acc, c) => {
                // Estimamos el valor neto de lo que está en librerías
                const unitPrice = 10000 // Precio promedio estimado por ahora
                return acc + ((c.sentQuantity - c.returnedQuantity - c.soldQuantity) * unitPrice * 0.6) // 60% es para editorial
            }, 0)

        // 2. Cuentas por Pagar (Regalías aprobadas no pagadas + OC en proceso)
        const pendingRoyalties = royaltiesList
            .filter(r => r.status === 'APROBADO')
            .reduce((acc, r) => acc + (r.totalAmount || 0), 0)

        const pendingPOs = pos
            .filter(p => p.status === 'EN_PROCESO' || p.status === 'ENVIADA')
            .reduce((acc, p) => acc + (p.total_cost || 0), 0)

        const totalPayables = pendingRoyalties + pendingPOs

        return {
            receivables: pendingReceivables,
            payables: totalPayables,
            netBalance: pendingReceivables - totalPayables,
            details: {
                royalties: pendingRoyalties,
                pos: pendingPOs
            }
        }
    }, [consignments, royaltiesList, pos])

    const handleExportPDF = () => {
        const doc = new jsPDF()
        const primaryColor = [79, 70, 229] // Indigo-600

        // Header
        doc.setFontSize(22)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("PROYECCIÓN DE FLUJO DE CAJA", 14, 25)

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CL')}`, 14, 32)
        doc.text(`Moneda: CLP`, 14, 37)

        // Snapshot Card Table
        autoTable(doc, {
            startY: 45,
            head: [['Concepto', 'Monto Proyectado']],
            body: [
                ['Cuentas por Cobrar (Estimado)', formatCLP(calculations.receivables)],
                ['Compromisos de Pago (Regalías + OC)', formatCLP(calculations.payables)],
                ['Balance Neto Proyectado', formatCLP(calculations.netBalance)]
            ],
            theme: 'striped',
            headStyles: { fillColor: primaryColor }
        })

        // Detailed Outgoings
        const finalY = doc.lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text("Detalle de Próximas Salidas", 14, finalY)

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Concepto', 'Descripción', 'Monto']],
            body: [
                ['Regalías', 'Autores por liquidar (Aprobados)', formatCLP(calculations.details.royalties)],
                ['Producción', 'Órdenes de Compra pendientes', formatCLP(calculations.details.pos)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] } // Orange-500
        })

        // Detailed Receivables (Top 10)
        const receiveY = doc.lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text("Cobros Pendientes (Consignaciones Activas)", 14, receiveY)

        autoTable(doc, {
            startY: receiveY + 5,
            head: [['Cliente', 'Libro', 'Unid.', 'Valor Est.']],
            body: consignments.filter(c => c.status !== 'FINALIZADO').slice(0, 15).map(c => [
                c.clientName,
                c.bookTitle,
                c.sentQuantity - c.returnedQuantity - c.soldQuantity,
                formatCLP((c.sentQuantity - c.returnedQuantity - c.soldQuantity) * 6000)
            ]),
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] } // Emerald-500
        })

        doc.save(`Proyeccion_Caja_${new Date().toISOString().slice(0, 10)}.pdf`)
    }

    return (
        <div className="space-y-6 fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" /> Flujo de Caja (Cashflow)
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Proyección de liquidez basada en compromisos pendientes</p>
                </div>
                <button 
                    onClick={handleExportPDF}
                    className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm shadow-sm"
                >
                    <Download className="w-4 h-4" /> Exportar Proyección
                </button>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card border-primary/20 bg-primary/5">
                    <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">Cuentas por Cobrar</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCLP(calculations.receivables)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Basado en inventario en consignación
                    </p>
                </div>

                <div className="stat-card border-orange-500/20 bg-orange-500/5">
                    <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest mb-1">Compromisos de Pago</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{formatCLP(calculations.payables)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-2">Regalías aprobadas + OC pendientes</p>
                </div>

                <div className={`stat-card ${calculations.netBalance >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <p className="text-[10px] text-slate-500 dark:text-dark-500 uppercase font-black tracking-widest mb-1">Balance Proyectado</p>
                    <p className={`text-2xl font-bold font-mono ${calculations.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCLP(calculations.netBalance)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-2">Diferencia neta de liquidez</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payables Breakdown */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-orange-400" /> Próximas Salidas de Dinero
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex justify-between items-center group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Regalías de Autores</p>
                                    <p className="text-xs text-slate-500 dark:text-dark-600">Aprobadas para liquidación</p>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatCLP(calculations.details.royalties)}</p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex justify-between items-center group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Producción en Curso</p>
                                    <p className="text-xs text-slate-500 dark:text-dark-600">Órdenes de compra abiertas</p>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatCLP(calculations.details.pos)}</p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-dark-300/50 flex items-center gap-3 text-slate-500 dark:text-dark-600 italic text-sm">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <p>Recuerda que este flujo solo considera gastos registrados en el sistema de órdenes y regalías.</p>
                        </div>
                    </div>
                </div>

                {/* Receivables Projection */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" /> Cobros Pendientes (Librerías)
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-dark-600 mb-2">
                            <span>Estado de las Consignaciones</span>
                            <span>Valor Proyectado</span>
                        </div>

                        {consignments.filter(c => c.status !== 'FINALIZADO').slice(0, 5).map(c => (
                            <div key={c.id} className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-dark-300/30">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{c.clientName}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold tracking-tighter">{c.bookTitle}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400 font-mono">
                                        {formatCLP((c.sentQuantity - c.returnedQuantity - c.soldQuantity) * 6000)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-dark-500">{c.sentQuantity - c.returnedQuantity - c.soldQuantity} unid.</p>
                                </div>
                            </div>
                        ))}

                        {consignments.length === 0 && (
                            <div className="py-10 text-center text-slate-500 dark:text-dark-600 italic text-sm">
                                No hay consignaciones activas para proyectar cobros.
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <p className="text-xs text-emerald-600">
                                El valor se estima sobre el 60% del PVP registrado para la editorial.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
