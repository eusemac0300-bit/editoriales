import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    ShoppingCart, Plus, X, Search, TrendingUp, Activity,
    BookOpen, DollarSign, Calendar, Users, Package, BarChart3,
    CheckCircle, XCircle, Download, FileSpreadsheet
} from 'lucide-react'

const CHANNELS = ['Directa', 'Librería', 'Web', 'Evento / Feria', 'Consignación']
const FORM_CHANNELS = ['Directa', 'Librería', 'Web', 'Evento / Feria']
const TYPES = ['B2C (Consumidor final)', 'B2B (Empresa / Librería)']
const STATUS_COLORS = {
    Completada: 'badge-green',
    Anulada: 'badge-red'
}

const PAYMENT_STATUS_COLORS = {
    Pendiente: 'bg-amber-500/20 text-amber-500',
    Pagado: 'bg-emerald-500/20 text-emerald-500',
    Atrasado: 'bg-rose-500/20 text-rose-500 animate-pulse'
}

export default function Sales() {
    const { data, formatCurrency, addNewSale, updateSaleDetails, addAuditLog, reloadData, taxRate, t } = useAuth()
    const formatCLP = formatCurrency

    const sales = useMemo(() => data?.finances?.sales || [], [data])
    const books = useMemo(() => data?.books || [], [data])
    const authors = useMemo(() => data?.users?.filter(u => u.role === 'AUTOR') || [], [data])

    const [showAdd, setShowAdd] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterChannel, setFilterChannel] = useState('')
    const [filterAuthor, setFilterAuthor] = useState('')

    // ── Date Range for Cumulative View ──────────────────────────────────────────
    const currentYear = new Date().getFullYear()
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
    const [monthlyGoal, setMonthlyGoal] = useState(1000000) // Default goal: 1M (can be made editable)

    // ── Stats Categorization ────────────────────────────────────────────────────
    const FIRME_CHANNELS = ['Directa', 'Librería', 'Web']
    const FLOTANTE_CHANNELS = ['Evento / Feria', 'Consignación']

    const activeSales = useMemo(() => sales.filter(s => s.status !== 'Anulada'), [sales])

    // Filter by date range for cumulative stats
    const rangeSales = useMemo(() => {
        return activeSales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate)
    }, [activeSales, startDate, endDate])

    // Monthly stats (current selected month from range or just current month)
    const currentMonthStr = new Date().toISOString().slice(0, 7)
    const monthSales = useMemo(() => {
        return activeSales.filter(s => s.saleDate?.startsWith(currentMonthStr))
    }, [activeSales, currentMonthStr])

    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const goalProgress = (monthRevenue / monthlyGoal) * 100

    const cumulativeRevenue = rangeSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const cumulativeUnits = rangeSales.reduce((sum, s) => sum + (s.quantity || 0), 0)

    const revenueFirme = rangeSales.filter(s => FIRME_CHANNELS.includes(s.channel)).reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const revenueFlotante = rangeSales.filter(s => FLOTANTE_CHANNELS.includes(s.channel)).reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    const revenueByChannel = useMemo(() => {
        const map = {}
        for (const s of rangeSales) {
            map[s.channel] = (map[s.channel] || 0) + (s.totalAmount || 0)
        }
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [rangeSales])

    // ── Filter ─────────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...sales]
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter(s =>
                (s.bookTitle || '').toLowerCase().includes(q) ||
                (s.clientName || '').toLowerCase().includes(q) ||
                (s.documentRef || '').toLowerCase().includes(q)
            )
        }
        if (filterChannel) list = list.filter(s => s.channel === filterChannel)
        
        // Filter by date range in the main list
        list = list.filter(s => s.saleDate >= startDate && s.saleDate <= endDate)

        if (filterAuthor) {
            const authorBooks = books.filter(b => b.authorId === filterAuthor || b.authorName === authors.find(a => a.id === filterAuthor)?.name).map(b => b.id)
            list = list.filter(s => authorBooks.includes(s.bookId))
        }
        return list.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
    }, [sales, searchTerm, filterChannel, startDate, endDate, filterAuthor, books, authors])

    // ✅ #8: Anular venta → reponer stock automáticamente
    const handleDelete = async (sale) => {
        if (!window.confirm(`¿Anular venta de "${sale.bookTitle}"?\nSe repondrán ${sale.quantity} u. al inventario.`)) return
        await updateSaleDetails(sale.id, { status: 'Anulada' })

        // Reponer stock
        if (sale.bookId && sale.quantity > 0) {
            const { data: invRows } = await supabase
                .from('inventory_physical')
                .select('id, stock, exits')
                .eq('book_id', sale.bookId)
                .order('id', { ascending: true })
                .limit(1)
            if (invRows && invRows.length > 0) {
                const inv = invRows[0]
                const newStock = (inv.stock || 0) + sale.quantity
                const exits = (inv.exits || []).filter(e => e.ref !== `Venta ${sale.channel} – ${sale.id}`)
                await supabase.from('inventory_physical').update({ stock: newStock, exits }).eq('id', inv.id)
            }
        }

        await addAuditLog(`Anuló venta: "${sale.bookTitle}" (${sale.quantity} u. × ${sale.channel}) — stock repuesto`, 'ventas')
        await reloadData()
    }

    // ✅ #2: Exportar venta a PDF
    const handleDownloadPDF = (sale) => {
        const doc = new jsPDF()

        const primaryColor = [20, 184, 166] // teal-500
        const secondaryColor = [31, 41, 55] // dark-800
        const lightGray = [156, 163, 175] // gray-400

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('COMPROBANTE DE VENTA', 20, 20)

        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(20, 25, 190, 25)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        const dateStr = sale.saleDate ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
        doc.text(`Fecha: ${dateStr}`, 190, 32, { align: 'right' })
        doc.text(`Comprobante N°: ${sale.id.slice(-8).toUpperCase()}`, 190, 38, { align: 'right' })

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text('Datos de la Venta', 20, 50)

        doc.setFont('helvetica', 'normal')
        doc.text(`Cliente:`, 20, 60)
        doc.setFont('helvetica', 'bold')
        doc.text(`${sale.clientName || 'Consumidor Final'}`, 45, 60)

        doc.setFont('helvetica', 'normal')
        doc.text(`Documento:`, 20, 68)
        doc.setFont('helvetica', 'bold')
        doc.text(`${sale.documentRef || 'No indica'}`, 45, 68)

        doc.setFont('helvetica', 'normal')
        doc.text(`Canal:`, 20, 76)
        doc.setFont('helvetica', 'bold')
        doc.text(`${sale.channel} / ${sale.type}`, 45, 76)

        autoTable(doc, {
            startY: 90,
            head: [['Detalle del Libro', 'Cant.', 'P. Unitario', 'Total']],
            body: [
                [
                    { content: `${sale.bookTitle}\nISBN/ID: ${sale.bookId}` },
                    sale.quantity,
                    formatCLP(sale.unitPrice),
                    formatCLP(sale.totalAmount)
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        })

        const finalY = doc.lastAutoTable.finalY || 120
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(`Total Pagado: ${formatCLP(sale.totalAmount)}`, 190, finalY + 12, { align: 'right' })

        if (sale.notes) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text(`Notas: ${sale.notes}`, 20, finalY + 25, { maxWidth: 170 })
        }

        doc.setFont('helvetica', 'italic')
        doc.setFontSize(8)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        doc.text('Documento generado automáticamente por el sistema editorial.', 105, 280, { align: 'center' })

        doc.save(`Venta_${sale.id.slice(-8)}.pdf`)
    }

    // ✅ #5: Exportar a Excel (.xls)
    const handleExportExcel = () => {
        if (filtered.length === 0) return alert('No hay datos para exportar')

        const headers = ['Fecha', 'Libro', 'Canal', 'Tipo', 'Cliente', 'Documento', 'Cantidad', 'P. Unitario', 'Neto', 'IVA', 'Total', 'Estado']

        const rows = filtered.map(s => [
            s.saleDate || '',
            s.bookTitle || '',
            s.channel || '',
            s.type || '',
            s.clientName || '',
            s.documentRef || '',
            s.quantity || 0,
            s.unitPrice || 0,
            s.neto || 0,
            s.iva || 0,
            s.totalAmount || 0,
            s.status || ''
        ])

        const tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="utf-8"></head>
            <body>
                <table border="1">
                    <thead>
                        <tr>${headers.map(h => `<th style="background-color:#1FB8A6; color:white;">${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Ventas_Export_${new Date().toISOString().slice(0, 10)}.xls`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" /> Registro de Ventas
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-dark-500 mt-1">Control de ingresos por canal, títulos y períodos</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Exportar Planilla
                    </button>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* Reporting Filters & Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 glass-card p-4 flex flex-wrap items-end gap-4 overflow-visible">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Desde (Acumulado)</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="input-field text-sm py-1.5"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hasta</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="input-field text-sm py-1.5"
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Meta Mensual ({new Date().toLocaleDateString('es-CL', { month: 'long' })})</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="text"
                                value={monthlyGoal.toLocaleString('es-CL')}
                                onChange={e => setMonthlyGoal(Number(e.target.value.replace(/\D/g, '')))}
                                className="input-field text-sm py-1.5 pl-7 w-full font-bold text-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Cumplimiento Meta</p>
                        <span className={`text-sm font-black ${goalProgress >= 100 ? 'text-emerald-500' : 'text-primary'}`}>
                            {goalProgress.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden relative">
                        <div
                            className={`h-full transition-all duration-1000 rounded-full ${goalProgress >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}
                            style={{ width: `${Math.min(goalProgress, 100)}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        {formatCLP(monthRevenue)} de {formatCLP(monthlyGoal)} este mes
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 border-l-4 border-emerald-500">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase tracking-wide">Venta en Firme</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-500 font-mono">{formatCLP(revenueFirme)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Directa, Librería, Web</p>
                </div>
                <div className="glass-card p-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-amber-500" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase tracking-wide">Venta Flotante</p>
                    </div>
                    <p className="text-xl font-bold text-amber-500 font-mono">{formatCLP(revenueFlotante)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Consig., Eventos, Ferias</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase tracking-wide">Acumulado Rango</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{formatCLP(cumulativeRevenue)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{rangeSales.length} transacciones</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase tracking-wide">Unidades Totales</p>
                    </div>
                    <p className="text-xl font-bold text-blue-500 font-mono">{cumulativeUnits.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 mt-1">En el rango seleccionado</p>
                </div>
            </div>

            {/* Channel breakdown */}
            {revenueByChannel.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-dark-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Ingresos por Canal (Rango Seleccionado)
                    </h3>
                    <div className="space-y-2">
                        {revenueByChannel.map(([channel, amount]) => {
                            const pct = cumulativeRevenue > 0 ? Math.round((amount / cumulativeRevenue) * 100) : 0
                            const isFirme = FIRME_CHANNELS.includes(channel)
                            return (
                                <div key={channel}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 dark:text-dark-400 flex items-center gap-2">
                                            {channel}
                                            <span className={`text-[8px] px-1 rounded ${isFirme ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {isFirme ? 'FIRME' : 'FLOTANTE'}
                                            </span>
                                        </span>
                                        <span className="text-slate-900 dark:text-white font-mono">{formatCLP(amount)} <span className="text-slate-400 dark:text-dark-600">({pct}%)</span></span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-700 rounded-full ${isFirme ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-600" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por libro, cliente o documento..."
                        className="input-field pl-9 text-sm w-full"
                    />
                </div>
                <select
                    value={filterChannel}
                    onChange={e => setFilterChannel(e.target.value)}
                    className="input-field text-sm"
                >
                    <option value="">Todos los canales</option>
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* ✅ #9 Filtro por autor */}
                {authors.length > 0 && (
                    <select
                        value={filterAuthor}
                        onChange={e => setFilterAuthor(e.target.value)}
                        className="input-field text-sm"
                    >
                        <option value="">Todos los autores</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                )}
                {(searchTerm || filterChannel || filterAuthor) && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterChannel(''); setFilterAuthor('') }}
                        className="text-xs text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2 transition-colors"
                    >
                        <X className="w-3 h-3" /> Limpiar Filtros Extra
                    </button>
                )}
            </div>

            {/* Sales table */}
            {filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-slate-200 dark:text-dark-500 mx-auto mb-4" />
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1">Sin ventas registradas</h3>
                    <p className="text-sm text-slate-500 dark:text-dark-500">Haz clic en "Nueva Venta" para comenzar a registrar ingresos.</p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-dark-300">
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Fecha</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Libro</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Canal</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Cliente</th>
                                    <th className="text-right text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Qty</th>
                                    <th className="text-right text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Neto</th>
                                    <th className="text-right text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">IVA</th>
                                    <th className="text-right text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Total</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Pago</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Vence</th>
                                    <th className="text-left text-[10px] uppercase text-slate-500 dark:text-dark-500 px-4 py-3">Estado</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-300">
                                {filtered.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-dark-200/50 transition-colors border-b border-slate-100 dark:border-dark-300/50">
                                        <td className="px-4 py-3 text-slate-500 dark:text-dark-400 text-xs whitespace-nowrap">
                                            {sale.saleDate ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('es-CL') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-900 dark:text-white font-medium truncate max-w-40">{sale.bookTitle || '—'}</p>
                                            {sale.documentRef && <p className="text-[10px] text-slate-400 dark:text-dark-600">{sale.documentRef}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-primary-600 dark:text-primary-300 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                {sale.channel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-dark-400 text-xs">{sale.clientName || '—'}</td>
                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-mono text-right">{sale.quantity}</td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-dark-500 font-mono text-right text-xs">{(sale.neto > 0) ? formatCLP(sale.neto) : '-'}</td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-dark-400 font-mono text-right text-xs">{(sale.iva > 0) ? formatCLP(sale.iva) : '-'}</td>
                                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-right">{formatCLP(sale.totalAmount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                sale.paymentStatus === 'Pagado' ? PAYMENT_STATUS_COLORS.Pagado : 
                                                (new Date(sale.dueDate) < new Date() && sale.paymentStatus !== 'Pagado' ? PAYMENT_STATUS_COLORS.Atrasado : PAYMENT_STATUS_COLORS.Pendiente)
                                            }`}>
                                                {sale.paymentStatus === 'Pagado' ? 'PAGADO' : (new Date(sale.dueDate) < new Date() ? 'ATRASADO' : 'PENDIENTE')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[10px] font-mono whitespace-nowrap">
                                            {sale.dueDate ? new Date(sale.dueDate + 'T12:00:00').toLocaleDateString('es-CL') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[sale.status] || 'badge-blue'}`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex justify-end gap-1">
                                            {sale.status !== 'Anulada' && (
                                                <>
                                                    {sale.paymentStatus !== 'Pagado' && (
                                                        <button
                                                            onClick={async () => {
                                                                if(window.confirm('¿Marcar esta venta como pagada?')) {
                                                                    await updateSaleDetails(sale.id, { paymentStatus: 'Pagado' })
                                                                    await addAuditLog(`Marcó como pagada la venta: "${sale.bookTitle}" (${sale.id})`, 'ventas')
                                                                    await reloadData()
                                                                }
                                                            }}
                                                            className="p-1.5 bg-dark-200 hover:bg-emerald-500/20 rounded text-emerald-500 hover:text-emerald-400 transition-colors"
                                                            title="Marcar como Pagado"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDownloadPDF(sale)}
                                                        className="p-1.5 bg-dark-200 hover:bg-emerald-500/20 rounded text-emerald-500 hover:text-emerald-400 transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sale)}
                                                        className="p-1.5 bg-dark-200 hover:bg-red-500/20 rounded text-red-500/70 hover:text-red-400 transition-colors"
                                                        title="Anular Venta"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-dark-300 flex justify-between items-center">
                        <p className="text-xs text-slate-500 dark:text-dark-500">{filtered.length} registros</p>
                        <p className="text-xs text-slate-900 dark:text-white font-mono">
                            Total filtro: <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                                {formatCLP(filtered.filter(s => s.status !== 'Anulada').reduce((s, r) => s + (r.totalAmount || 0), 0))}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* Add Sale Modal */}
            {showAdd && (
                <SaleForm
                    books={books}
                    data={data}
                    formatCLP={formatCurrency}
                    taxRate={taxRate}
                    t={t}
                    onClose={() => setShowAdd(false)}
                    onSave={async (saleData) => {
                        try {
                            const id = `sale-${Date.now()}`
                            const book = books.find(b => b.id === saleData.bookId)
                            const finalSale = {
                                ...saleData,
                                id,
                                bookTitle: book?.title || '',
                                createdAt: new Date().toISOString()
                            }

                            // 1. Save the sale
                            await addNewSale(finalSale)

                            // 2. Deduct stock — always query Supabase for the row (local state may lack `id`)
                            if (saleData.bookId && saleData.quantity > 0) {
                                const { data: invRows, error: invErr } = await supabase
                                    .from('inventory_physical')
                                    .select('id, stock, exits')
                                    .eq('book_id', saleData.bookId)
                                    .order('id', { ascending: true })
                                    .limit(1)

                                if (invErr) {
                                    console.error('Error fetching inv:', invErr)
                                } else if (invRows && invRows.length > 0) {
                                    const invRow = invRows[0]
                                    const newStock = Math.max(0, (invRow.stock || 0) - saleData.quantity)
                                    const exits = [
                                        ...(invRow.exits || []),
                                        {
                                            date: new Date().toISOString().slice(0, 10),
                                            qty: saleData.quantity,
                                            ref: `Venta ${saleData.channel} – ${id}`
                                        }
                                    ]
                                    const { error: updErr } = await supabase
                                        .from('inventory_physical')
                                        .update({ stock: newStock, exits })
                                        .eq('id', invRow.id)
                                    if (updErr) console.error('Stock update error:', updErr)
                                    else {
                                        console.log(`✅ Stock ${saleData.bookId}: ${invRow.stock} → ${newStock}`)
                                        // ✅ #7: Alerta automática si stock bajo
                                        const minStock = invRow.min_stock || 0
                                        if (minStock > 0 && newStock <= minStock) {
                                            await supabase.from('alerts').insert({
                                                id: `alert-stock-${saleData.bookId}-${Date.now()}`,
                                                tenant_id: finalSale.tenantId || 't1',
                                                type: 'stock_bajo',
                                                book_id: saleData.bookId,
                                                message: `⚠️ Stock bajo: "${finalSale.bookTitle}" tiene solo ${newStock} u. (mínimo: ${minStock})`,
                                                date: new Date().toISOString(),
                                                read: false
                                            })
                                        }
                                    }
                                } else {
                                    console.warn('No inventory row found for book:', saleData.bookId)
                                }
                            }

                            // 3. Audit log
                            await addAuditLog(
                                `Registró venta: "${finalSale.bookTitle}" | ${saleData.quantity} u. × ${formatCLP(saleData.unitPrice)} | Canal: ${saleData.channel}`,
                                'ventas'
                            )

                            // 4. Force full reload so Inventario reflects updated stock
                            await reloadData()

                            setShowAdd(false)
                        } catch (err) {
                            console.error('Error al registrar venta:', err)
                            alert(`Error al guardar: ${err.message || 'Error desconocido'}. Revisa la consola.`)
                        }
                    }}
                />
            )}
        </div>
    )
}

function SaleForm({ books, data, formatCLP, taxRate, t, onSave, onClose }) {
    const today = new Date().toISOString().slice(0, 10)
    const [form, setForm] = useState({
        bookId: '',
        channel: 'Directa',
        type: 'B2C (Consumidor final)',
        quantity: 1,
        unitPrice: '',
        saleDate: today,
        clientName: '',
        documentRef: '',
        notes: '',
        status: 'Completada',
        paymentStatus: 'Pendiente',
        dueDate: today
    })
    const [saving, setSaving] = useState(false)

    const quantity = parseInt(form.quantity) || 0
    const unitPrice = parseInt(form.unitPrice?.toString().replace(/\D/g, '')) || 0
    const total = quantity * unitPrice
    // Neto / IVA breakdown
    const taxVal = 1 + (taxRate / 100)
    const neto = Math.round(total / taxVal)
    const iva = total - neto

    const selectedBook = books.find(b => b.id === form.bookId)

    // Inventory availability - use bookId (camelCase) after supabaseService transform
    const inv = data?.inventory?.physical?.find(i => i.bookId === form.bookId)
    const stock = inv?.stock ?? null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.bookId) { alert('Debes seleccionar un libro.'); return }
        if (quantity < 1) { alert('La cantidad debe ser mayor a 0.'); return }
        if (unitPrice < 1) { alert('El precio unitario debe ser mayor a 0.'); return }
        // Hard block: no inventory record → cannot sell
        if (stock === null) {
            alert('❌ Este libro no tiene registro de inventario físico. Registra el stock primero en la sección Inventario.')
            return
        }
        // Hard block: quantity exceeds stock
        if (quantity > stock) {
            alert(`❌ Stock insuficiente. Disponible: ${stock} u. Intentas vender: ${quantity} u.`)
            return
        }
        setSaving(true)
        await onSave({ ...form, quantity, unitPrice, totalAmount: total, neto, iva, saleDate: form.saleDate })
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 bg-dark-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
            <div className="glass-card w-full max-w-xl p-6 slide-up border border-primary/30 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-dark-300 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Registrar Nueva Venta
                    </h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Book */}
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Título *</label>
                        <select
                            value={form.bookId}
                            onChange={e => {
                                const b = books.find(bk => bk.id === e.target.value)
                                const client = data?.clients?.find(c => c.name === form.clientName)
                                const discount = client?.default_discount || 0
                                const finalPrice = b?.pvp ? Math.round(b.pvp * (1 - discount/100)) : p.unitPrice
                                setForm(p => ({ ...p, bookId: e.target.value, unitPrice: String(finalPrice) }))
                            }}
                            className="input-field text-sm w-full"
                            required
                        >
                            <option value="">Selecciona un título...</option>
                            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                        </select>
                        {selectedBook && (
                            <div className="flex flex-wrap gap-3 mt-1.5">
                                {selectedBook.pvp > 0 && <span className="text-[10px] text-primary-400">PVP: {formatCLP(selectedBook.pvp)}</span>}
                                {stock !== null && (
                                    <span className={`text-[10px] font-medium ${stock < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        Stock: {stock} u.
                                    </span>
                                )}
                                {selectedBook.royaltyPercent > 0 && <span className="text-[10px] text-yellow-400">Royalty autor: {selectedBook.royaltyPercent}%</span>}
                            </div>
                        )}
                    </div>

                    {/* Channel + Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Canal de Venta *</label>
                            <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))} className="input-field text-sm w-full">
                                {FORM_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <p className="text-[10px] text-slate-500 mt-1">
                                Las **consignaciones** deben registrarse en su sección propia para permitir liquidaciones posteriores.
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Tipo</label>
                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field text-sm w-full">
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Qty + Price + Date */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Cantidad *</label>
                            <input
                                type="number" min="1"
                                value={form.quantity}
                                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                                className="input-field text-sm w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Precio Unitario (CLP) *</label>
                            <input
                                type="text"
                                value={form.unitPrice}
                                onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value.replace(/\D/g, '') }))}
                                className="input-field text-sm w-full"
                                required
                            />
                        </div>
                    </div>

                    {/* Breakdown Neto/IVA/Total */}
                    <div className="bg-dark-100/50 p-4 rounded-xl border border-dark-300">
                        <div className="flex items-center justify-between text-xs text-dark-500">
                            <span>{t('neto')}: {formatCLP(neto)}</span>
                            <span>{t('iva')} ({taxRate}%): {formatCLP(iva)}</span>
                            <span className="text-sm text-emerald-400 font-bold ml-4">{t('total')}: {formatCLP(total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Fecha de Venta *
                            </label>
                            <input
                                type="date"
                                value={form.saleDate}
                                onChange={e => {
                                    const newDate = e.target.value
                                    const d = new Date(newDate)
                                    d.setDate(d.getDate() + 30) // Default 30 days
                                    setForm(p => ({ ...p, saleDate: newDate, dueDate: d.toISOString().slice(0, 10) }))
                                }}
                                className="input-field text-sm w-full dark:bg-dark-300"
                                style={{ colorScheme: 'dark' }}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-amber-500" /> Vencimiento de Pago
                            </label>
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                                className="input-field text-sm w-full dark:bg-dark-300"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    {/* Royalty preview */}
                    {
                        selectedBook?.royaltyPercent > 0 && total > 0 && (
                            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                <p className="text-[10px] text-yellow-300">
                                    Royalty acumulado para el autor: <span className="font-mono font-bold">
                                        {formatCLP(Math.round(total * (selectedBook.royaltyPercent / 100)))}
                                    </span>
                                    {' '}({selectedBook.royaltyPercent}% sobre total)
                                </p>
                            </div>
                        )
                    }

                    {/* Client + Doc */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Cliente / Librería</label>
                            <input
                                type="text"
                                list="clientsList"
                                value={form.clientName}
                                onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                                className="input-field text-sm w-full"
                                placeholder="Escribe o selecciona de la lista..."
                            />
                            <datalist id="clientsList">
                                {data?.clients?.map(client => (
                                    <option key={client.id} value={client.name}>
                                        {client.type ? `[${client.type}] ` : ''}{client.name}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Ref. Documento</label>
                            <input
                                type="text"
                                value={form.documentRef}
                                onChange={e => setForm(p => ({ ...p, documentRef: e.target.value }))}
                                className="input-field text-sm w-full"
                                placeholder="Boleta / Factura nro."
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Observaciones</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="input-field text-sm w-full"
                            rows={2}
                            placeholder="Notas internas..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-dark-300">
                        <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary text-sm px-5 py-2 flex items-center gap-2 disabled:opacity-60"
                        >
                            {saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Registrar Venta</>}
                        </button>
                    </div>
                </form >
            </div >
        </div >
    )
}
