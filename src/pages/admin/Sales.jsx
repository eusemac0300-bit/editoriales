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

            {/* KPI Cards with Gradients & Glassmorphism */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/5 to-transparent relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 -mr-4 -mt-4 transition-transform group-hover:scale-[2] duration-500">
                        <TrendingUp className="w-20 h-20 text-emerald-500" />
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-500 dark:text-dark-600 uppercase tracking-widest mb-3">Venta en Firme</p>
                        <p className="text-3xl font-black text-emerald-500 font-mono tracking-tighter">{formatCLP(revenueFirme)}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-medium">Directa, Librería, Web</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 -mr-4 -mt-4 transition-transform group-hover:scale-[2] duration-500">
                        <Activity className="w-20 h-20 text-amber-500" />
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-500 dark:text-dark-600 uppercase tracking-widest mb-3">Venta Flotante</p>
                        <p className="text-3xl font-black text-amber-500 font-mono tracking-tighter">{formatCLP(revenueFlotante)}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-medium">Consig., Eventos, Ferias</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-primary bg-gradient-to-br from-primary/5 to-transparent relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 -mr-4 -mt-4 transition-transform group-hover:scale-[2] duration-500">
                        <DollarSign className="w-20 h-20 text-primary" />
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-500 dark:text-dark-600 uppercase tracking-widest mb-3">Acumulado Rango</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">{formatCLP(cumulativeRevenue)}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-100 dark:bg-dark-300 inline-block px-1.5 py-0.5 rounded italic">
                            {rangeSales.length} transacciones
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent relative group overflow-hidden text-right md:text-left">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 -mr-4 -mt-4 transition-transform group-hover:scale-[2] duration-500">
                        <Package className="w-20 h-20 text-blue-500" />
                    </div>
                    <div className="relative">
                        <p className="text-[11px] font-black text-slate-500 dark:text-dark-600 uppercase tracking-widest mb-3">Unidades Totales</p>
                        <p className="text-3xl font-black text-blue-500 font-mono tracking-tighter">{cumulativeUnits.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Libros entregados</p>
                    </div>
                </div>
            </div>

            {/* Channel breakdown */}
            {revenueByChannel.length > 0 && (
                <div className="glass-card p-6 bg-slate-50/50 dark:bg-dark-950/20 border-dashed">
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-dark-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Analítica por Canal por Canales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {revenueByChannel.map(([channel, amount]) => {
                            const pct = cumulativeRevenue > 0 ? Math.round((amount / cumulativeRevenue) * 100) : 0
                            const isFirme = FIRME_CHANNELS.includes(channel)
                            return (
                                <div key={channel} className="space-y-2 group">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{channel}</span>
                                            <span className={`text-[8px] font-bold px-1 rounded-sm w-fit mt-0.5 ${isFirme ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {isFirme ? 'FIRME' : 'FLOTANTE'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{formatCLP(amount)}</span>
                                            <span className="text-[10px] text-slate-400 dark:text-dark-600 block">({pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full transition-all duration-1000 origin-left rounded-full ${isFirme ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Filters Bar - Clean & Modern */}
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-dark-400 p-4 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="relative flex-1 min-w-[280px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por libro, cliente, RUT o documento..."
                        className="w-full bg-slate-50/50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-300 rounded-2xl pl-11 pr-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <select
                        value={filterChannel}
                        onChange={e => setFilterChannel(e.target.value)}
                        className="bg-slate-50/50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-300 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase text-slate-500 outline-none focus:border-primary transition-all cursor-pointer"
                    >
                        <option value="">Canales</option>
                        {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {authors.length > 0 && (
                        <select
                            value={filterAuthor}
                            onChange={e => setFilterAuthor(e.target.value)}
                            className="bg-slate-50/50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-300 rounded-2xl px-4 py-2.5 text-xs font-bold uppercase text-slate-500 outline-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="">Todo Autores</option>
                            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    )}
                </div>
                {(searchTerm || filterChannel || filterAuthor) && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterChannel(''); setFilterAuthor('') }}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Limpiar Filtros"
                    >
                        <X className="w-5 h-5" />
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
                    onSave={async (items, commonData) => {
                        try {
                            const commonId = `invoice-${Date.now()}`
                            
                            for (const item of items) {
                                const saleId = `sale-${Date.now()}-${item.bookId}`
                                const book = books.find(b => b.id === item.bookId)
                                
                                const finalSale = {
                                    ...commonData,
                                    ...item,
                                    id: saleId,
                                    groupRef: commonId,
                                    bookTitle: book?.title || '',
                                    createdAt: new Date().toISOString()
                                }

                                // 1. Save the sale
                                await addNewSale(finalSale)

                                // 2. Deduct stock
                                if (item.bookId && item.quantity > 0) {
                                    const { data: invRows } = await supabase
                                        .from('inventory_physical')
                                        .select('id, stock, exits, min_stock')
                                        .eq('book_id', item.bookId)
                                        .order('id', { ascending: true })
                                        .limit(1)

                                    if (invRows && invRows.length > 0) {
                                        const invRow = invRows[0]
                                        const newStock = Math.max(0, (invRow.stock || 0) - item.quantity)
                                        const exits = [
                                            ...(invRow.exits || []),
                                            {
                                                date: new Date().toISOString().slice(0, 10),
                                                qty: item.quantity,
                                                ref: `Venta ${commonData.channel} – ${commonId}`
                                            }
                                        ]
                                        await supabase
                                            .from('inventory_physical')
                                            .update({ stock: newStock, exits })
                                            .eq('id', invRow.id)
                                        
                                        // Low stock alert
                                        const minStock = invRow.min_stock || 0
                                        if (minStock > 0 && newStock <= minStock) {
                                            await supabase.from('alerts').insert({
                                                id: `alert-stock-${item.bookId}-${Date.now()}`,
                                                tenant_id: data.tenantId || 't1',
                                                type: 'stock_bajo',
                                                book_id: item.bookId,
                                                message: `⚠️ Stock bajo: "${book?.title}" tiene solo ${newStock} u. (mínimo: ${minStock})`,
                                                date: new Date().toISOString(),
                                                read: false
                                            })
                                        }
                                    }
                                }
                            }

                            await addAuditLog(
                                `Registró venta múltiple (${items.length} títulos) | Canal: ${commonData.channel} | Cliente: ${commonData.clientName || 'Consumidor'}`,
                                'ventas'
                            )
                            await reloadData()
                            setShowAdd(false)
                        } catch (err) {
                            console.error(err)
                            alert('Error al registrar venta')
                        }
                    }}
                />
            )}
        </div>
    )
}

function SaleForm({ books, data, formatCLP, taxRate, t, onSave, onClose }) {
    const today = new Date().toISOString().slice(0, 10)
    const [common, setCommon] = useState({
        channel: 'Directa',
        type: 'B2C (Consumidor final)',
        saleDate: today,
        clientName: '',
        documentRef: '',
        notes: '',
        status: 'Completada',
        paymentStatus: 'Pendiente',
        dueDate: today
    })

    const [items, setItems] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [saving, setSaving] = useState(false)

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxVal = 1.19
    const totalNeto = Math.round(subtotal / taxVal)
    const totalIva = subtotal - totalNeto

    const handleSearch = (q) => {
        setSearchTerm(q)
        if (q.length < 2) {
            setSearchResults([])
            return
        }
        const lowerQ = q.toLowerCase()
        const results = books.filter(b => 
            b.title.toLowerCase().includes(lowerQ) || 
            b.isbn?.toLowerCase().includes(lowerQ)
        ).slice(0, 5)
        setSearchResults(results)
    }

    const addItem = (book) => {
        const inv = data?.inventory?.physical?.find(i => i.bookId === book.id)
        const stock = inv?.stock ?? 0
        if (stock <= 0) {
            alert('❌ Stock agotado para este título.');
            return;
        }
        setItems(p => [...p, {
            bookId: book.id,
            title: book.title,
            quantity: 1,
            unitPrice: book.pvp || 0,
            stock: stock,
            total: book.pvp || 0
        }])
        setSearchTerm('')
        setSearchResults([])
    }

    const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx))

    const updateItem = (idx, field, val) => {
        setItems(p => p.map((item, i) => {
            if (i !== idx) return item
            const newItem = { ...item, [field]: val }
            newItem.total = (newItem.quantity || 0) * (newItem.unitPrice || 0)
            return newItem
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (items.length === 0) return
        setSaving(true)
        try {
            const itemsToSave = items.map(it => ({
                bookId: it.bookId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalAmount: it.total,
                neto: Math.round(it.total / taxVal),
                iva: it.total - Math.round(it.total / taxVal)
            }))
            await onSave(itemsToSave, common)
        } finally {
            setSaving(false)
        }
    }

    const FORM_CHANNELS = ['Directa', 'Librería', 'Web', 'Evento / Feria']

    return (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-dark-200 w-full max-w-4xl p-0 shadow-2xl rounded-[1.5rem] border border-slate-200 dark:border-dark-300 flex flex-col max-h-[90vh] overflow-hidden slide-up">
                {/* Header - Sharp & Clear */}
                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Registro de Venta</h3>
                            <p className="text-[10px] text-primary-400 font-black uppercase tracking-widest mt-0.5">Gestión Profesional de Inventario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
                    {/* Customer & Date - Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Canal de Venta</label>
                            <select 
                                value={common.channel} 
                                onChange={e => setCommon(p => ({ ...p, channel: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-dark-300 border-2 border-slate-200 dark:border-dark-400 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                            >
                                {FORM_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Fecha Operación</label>
                            <input
                                type="date"
                                value={common.saleDate}
                                onChange={e => setCommon(p => ({ ...p, saleDate: e.target.value }))}
                                className="w-full bg-slate-50 dark:bg-dark-300 border-2 border-slate-200 dark:border-dark-400 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Cliente / Institución</label>
                            <div className="relative">
                                <input
                                    list="cli-list"
                                    value={common.clientName}
                                    onChange={e => setCommon(p => ({ ...p, clientName: e.target.value }))}
                                    placeholder="Nombre o RUT..."
                                    className="w-full bg-slate-50 dark:bg-dark-300 border-2 border-slate-200 dark:border-dark-400 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                                />
                                <datalist id="cli-list">
                                    {data?.clients?.map(c => <option key={c.id} value={c.name} />)}
                                </datalist>
                                <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Search & Items Section */}
                    <div className="flex-1 flex flex-col min-h-0 bg-slate-100/50 dark:bg-dark-900/50 rounded-2xl border-2 border-slate-200/50 dark:border-white/5 p-4 gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Escribe para buscar un libro..."
                                className="w-full bg-white dark:bg-dark-200 border-2 border-slate-200 dark:border-dark-300 rounded-xl pl-12 pr-4 py-4 text-sm font-bold shadow-lg shadow-slate-200/50 dark:shadow-none focus:border-primary transition-all outline-none"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-200 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-dark-400 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-dark-400">
                                    {searchResults.map(b => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => addItem(b)}
                                            className="w-full text-left px-5 py-4 hover:bg-primary/5 flex justify-between items-center group transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary">{b.title}</span>
                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{b.isbn || 'SIN ISBN'} | {formatCLP(b.pvp)}</span>
                                            </div>
                                            <Plus className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* List - Fixed Header Contrast */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead className="sticky top-0 bg-slate-100/50 backdrop-blur dark:bg-dark-900/50 z-20">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest text-left">Libro</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest text-center w-24">Cant.</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest text-right w-32">Unitario</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest text-right w-32">Total</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <BookOpen className="w-12 h-12 text-slate-300 dark:text-dark-500 mx-auto mb-4" />
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay libros en la lista</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((it, i) => (
                                            <tr key={i} className="bg-white dark:bg-dark-300 border-2 border-slate-200 dark:border-dark-400 rounded-xl overflow-hidden shadow-sm">
                                                <td className="px-4 py-4 rounded-l-xl">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{it.title}</p>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg mt-1 inline-block ${it.stock < 5 ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                                                        Stock: {it.stock} u.
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        value={it.quantity}
                                                        onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-16 bg-slate-50 dark:bg-dark-400 border-2 border-slate-200 dark:border-dark-500 rounded-lg py-2 text-center text-sm font-black text-primary outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 font-mono text-sm">
                                                        <span className="text-slate-400">$</span>
                                                        <input
                                                            type="text"
                                                            value={it.unitPrice.toLocaleString('es-CL')}
                                                            onChange={e => updateItem(i, 'unitPrice', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                                            className="w-24 bg-transparent border-b-2 border-slate-100 dark:border-dark-500 text-right font-black outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">{formatCLP(it.total)}</span>
                                                </td>
                                                <td className="px-4 py-4 rounded-r-xl text-center">
                                                    <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="shrink-0 flex flex-col md:flex-row justify-between items-center gap-8 border-t-2 border-slate-100 dark:border-white/5 pt-8 -mx-8 px-8 mb-[-32px] pb-10 bg-slate-50 dark:bg-dark-300/30">
                        <div className="flex flex-col gap-1">
                            <div className="flex gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Subtotal Neto: {formatCLP(totalNeto)}</span>
                                <span>IVA (19%): {formatCLP(totalIva)}</span>
                            </div>
                            <div className="flex items-baseline gap-4 mt-1">
                                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                    <span className="text-sm font-black text-primary uppercase mr-3 tracking-widest">Total:</span>
                                    {formatCLP(subtotal)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-4 text-sm font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all rounded-xl uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving || items.length === 0}
                                className="flex-1 md:flex-none px-12 py-4 bg-primary hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-black text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                {saving ? <Activity className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                                Registrar Venta
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
