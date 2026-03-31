import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    ShoppingCart, Plus, X, Search, TrendingUp, Activity,
    BookOpen, DollarSign, Calendar, Users, Package, BarChart3,
    CheckCircle, XCircle, Download, FileSpreadsheet, AlertCircle
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

    // Helper para verificar completitud del autor
    const isAuthorComplete = (author) => {
        return !!(author.rut && author.bank_name && author.account_type && author.account_number)
    }

    // ── Date Range for Cumulative View ──────────────────────────────────────────
    const currentYear = new Date().getFullYear()
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
    const [monthlyGoal, setMonthlyGoal] = useState(1000000) 

    const activeSales = useMemo(() => sales.filter(s => s.status !== 'Anulada'), [sales])

    const rangeSales = useMemo(() => {
        return activeSales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate)
    }, [activeSales, startDate, endDate])

    const currentMonthStr = new Date().toISOString().slice(0, 7)
    const monthSales = useMemo(() => {
        return activeSales.filter(s => s.saleDate?.startsWith(currentMonthStr))
    }, [activeSales, currentMonthStr])

    const monthRevenue = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const goalProgress = (monthRevenue / monthlyGoal) * 100

    const cumulativeRevenue = rangeSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const cumulativeUnits = rangeSales.reduce((sum, s) => sum + (s.quantity || 0), 0)

    const FIRME_CHANNELS = ['Directa', 'Librería', 'Web']
    const FLOTANTE_CHANNELS = ['Evento / Feria', 'Consignación']

    const revenueFirme = rangeSales.filter(s => FIRME_CHANNELS.includes(s.channel)).reduce((sum, s) => sum + (s.totalAmount || 0), 0)
    const revenueFlotante = rangeSales.filter(s => FLOTANTE_CHANNELS.includes(s.channel)).reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    const revenueByChannel = useMemo(() => {
        const map = {}
        for (const s of rangeSales) {
            map[s.channel] = (map[s.channel] || 0) + (s.totalAmount || 0)
        }
        return Object.entries(map).sort((a, b) => b[1] - a[1])
    }, [rangeSales])

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
        list = list.filter(s => s.saleDate >= startDate && s.saleDate <= endDate)

        if (filterAuthor) {
            const authorData = authors.find(a => a.id === filterAuthor)
            const authorBooks = books.filter(b => b.authorId === filterAuthor || b.authorName === authorData?.name).map(b => b.id)
            list = list.filter(s => authorBooks.includes(s.bookId))
        }
        return list.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
    }, [sales, searchTerm, filterChannel, startDate, endDate, filterAuthor, books, authors])

    const handleDelete = async (sale) => {
        if (!window.confirm(`¿Anular venta de "${sale.bookTitle}"?\nSe repondrán ${sale.quantity} u. al inventario.`)) return
        await updateSaleDetails(sale.id, { status: 'Anulada' })

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

    const handleDownloadPDF = (sale) => {
        const doc = new jsPDF()
        const primaryColor = [20, 184, 166] 
        const secondaryColor = [31, 41, 55] 
        const lightGray = [156, 163, 175] 

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

        doc.save(`Venta_${sale.id.slice(-8)}.pdf`)
    }

    const handleExportExcel = () => {
        if (filtered.length === 0) return alert('No hay datos para exportar')
        const headers = ['Fecha', 'Libro', 'Canal', 'Tipo', 'Cliente', 'Documento', 'Cantidad', 'P. Unitario', 'Neto', 'IVA', 'Total', 'Estado']
        const rows = filtered.map(s => [
            s.saleDate || '', s.bookTitle || '', s.channel || '', s.type || '',
            s.clientName || '', s.documentRef || '', s.quantity || 0,
            s.unitPrice || 0, s.neto || 0, s.iva || 0, s.totalAmount || 0, s.status || ''
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" /> Registro de Ventas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Control de ingresos por canal, títulos y períodos</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5">
                        <FileSpreadsheet className="w-4 h-4" /> Exportar
                    </button>
                    <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 shadow-lg">
                        <Plus className="w-4 h-4" /> Nueva Venta
                    </button>
                </div>
            </div>

            {/* Reporting Filters & Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 glass-card p-4 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Desde</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field text-sm py-1.5" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hasta</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field text-sm py-1.5" />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Meta Mensual</label>
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
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Progreso Meta</p>
                        <span className={`text-sm font-black ${goalProgress >= 100 ? 'text-emerald-500' : 'text-primary'}`}>{goalProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-dark-300 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${goalProgress >= 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(goalProgress, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-l-4 border-emerald-500 bg-emerald-50/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Venta Firme</p>
                    <p className="text-2xl font-black text-emerald-600 font-mono">{formatCLP(revenueFirme)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-amber-500 bg-amber-50/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Venta Flotante</p>
                    <p className="text-2xl font-black text-amber-600 font-mono">{formatCLP(revenueFlotante)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-primary bg-primary/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total Rango</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatCLP(cumulativeRevenue)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-50/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Unidades</p>
                    <p className="text-2xl font-black text-blue-600 font-mono">{cumulativeUnits.toLocaleString()}</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-dark-400 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por libro, cliente, RUT o documento..."
                        className="w-full bg-slate-50 dark:bg-dark-900/50 border border-slate-200 dark:border-dark-300 rounded-xl pl-11 pr-4 py-2.5 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterChannel}
                        onChange={e => setFilterChannel(e.target.value)}
                        className="bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-300 rounded-xl px-4 py-2 text-xs font-bold uppercase text-slate-500"
                    >
                        <option value="">Todos Canales</option>
                        {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    {/* Author Filter with Visual Indicators */}
                    {authors.length > 0 && (
                        <select
                            value={filterAuthor}
                            onChange={e => setFilterAuthor(e.target.value)}
                            className="bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-300 rounded-xl px-4 py-2 text-xs font-bold uppercase text-slate-500"
                        >
                            <option value="">Todos Autores</option>
                            {authors.map(a => (
                                <option key={a.id} value={a.id} className={isAuthorComplete(a) ? 'text-primary' : 'text-rose-500'}>
                                    {isAuthorComplete(a) ? '✅' : '⚠️'} {a.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                {(searchTerm || filterChannel || filterAuthor) && (
                    <button onClick={() => { setSearchTerm(''); setFilterChannel(''); setFilterAuthor('') }} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Sales Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-dark-500 border-b border-slate-200 dark:border-dark-300 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                <th className="text-left px-4 py-4">Fecha</th>
                                <th className="text-left px-4 py-4">Libro</th>
                                <th className="text-left px-4 py-4">Canal</th>
                                <th className="text-left px-4 py-4">Cliente</th>
                                <th className="text-right px-4 py-4">Cant.</th>
                                <th className="text-right px-4 py-4">Total</th>
                                <th className="text-left px-4 py-4">Estado</th>
                                <th className="px-4 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-300">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400 italic">No se encontraron ventas con los filtros actuales</td>
                                </tr>
                            ) : (
                                filtered.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-200/50 transition-colors">
                                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                                            {sale.saleDate ? new Date(sale.saleDate + 'T12:00:00').toLocaleDateString('es-CL') : '—'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{sale.bookTitle || '—'}</p>
                                            <p className="text-[10px] text-slate-400">{sale.documentRef || 'Sin documento'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{sale.channel}</span>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">{sale.clientName || '—'}</td>
                                        <td className="px-4 py-4 text-right font-black font-mono">{sale.quantity}</td>
                                        <td className="px-4 py-4 text-right font-black font-mono text-emerald-600">{formatCLP(sale.totalAmount)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[sale.status] || 'badge-blue'}`}>{sale.status}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                {sale.status !== 'Anulada' && (
                                                    <>
                                                        <button onClick={() => handleDownloadPDF(sale)} className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded" title="Descargar PDF"><Download className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDelete(sale)} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded" title="Anular"><XCircle className="w-3.5 h-3.5" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sale Form Modal */}
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
                                
                                await addNewSale({
                                    ...commonData,
                                    ...item,
                                    id: saleId,
                                    groupRef: commonId,
                                    bookTitle: book?.title || '',
                                    createdAt: new Date().toISOString()
                                })

                                // Update Stock
                                if (item.bookId && item.quantity > 0) {
                                    const { data: invRows } = await supabase
                                        .from('inventory_physical')
                                        .select('id, stock, exits')
                                        .eq('book_id', item.bookId)
                                        .order('id', { ascending: true })
                                        .limit(1)

                                    if (invRows && invRows.length > 0) {
                                        const invRow = invRows[0]
                                        const newStock = Math.max(0, (invRow.stock || 0) - item.quantity)
                                        const exits = [...(invRow.exits || []), { date: new Date().toISOString().slice(0, 10), qty: item.quantity, ref: `Venta ${commonData.channel} – ${commonId}` }]
                                        await supabase.from('inventory_physical').update({ stock: newStock, exits }).eq('id', invRow.id)
                                    }
                                }
                            }
                            await addAuditLog(`Registró venta múltiple (${items.length} títulos)`, 'ventas')
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

function SaleForm({ onClose, onSave, books, data, formatCLP }) {
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

    const taxVal = 1.19
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

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
        const inv = data?.inventory?.physical?.find(i => i.book_id === book.id)
        const stock = inv?.stock ?? 0
        if (stock <= 0) {
            alert('❌ Stock agotado para este título.')
            return
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

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-dark-100 w-full max-w-5xl shadow-2xl rounded-[1.5rem] border border-white/20 flex flex-col max-h-[95vh] overflow-hidden">
                {/* Technical Header */}
                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">TERMINAL PUNTO DE VENTA</h3>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Sistema Premium v3.1.5</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-all bg-white/5 p-2 rounded-xl">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-8 flex flex-col gap-8 overflow-y-auto">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Total Venta</label>
                                <p className="text-xl font-bold text-emerald-600 font-mono">{formatCLP(subtotal)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Fecha</label>
                                <input type="date" value={common.saleDate} onChange={e => setCommon(p => ({ ...p, saleDate: e.target.value }))} className="bg-transparent border-none p-0 text-sm font-bold w-full focus:ring-0" />
                            </div>
                            <div className="md:col-span-2 bg-slate-50 dark:bg-dark-200 p-4 rounded-2xl border-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Cliente / Canal</label>
                                <div className="flex gap-2">
                                    <input placeholder="Nombre cliente..." value={common.clientName} onChange={e => setCommon(p => ({ ...p, clientName: e.target.value }))} className="bg-transparent border-b border-slate-300 text-sm font-bold w-full focus:ring-0" />
                                    <select value={common.channel} onChange={e => setCommon(p => ({ ...p, channel: e.target.value }))} className="bg-slate-900 text-white text-[10px] font-bold rounded-lg px-2 py-1">
                                        {FORM_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="flex items-center bg-slate-900 rounded-2xl p-4 shadow-xl">
                                <Search className="w-6 h-6 text-primary mr-4" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Presione para buscar libros por título o código..."
                                    className="bg-transparent text-white w-full text-lg font-bold outline-none placeholder:text-slate-600"
                                />
                            </div>
                            
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-200 rounded-2xl shadow-2xl border-2 border-slate-200 z-[100] max-h-60 overflow-y-auto">
                                    {searchResults.map(b => (
                                        <button key={b.id} type="button" onClick={() => addItem(b)} className="w-full text-left p-4 hover:bg-slate-50 flex justify-between items-center group transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{b.title}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{b.isbn || 'SIN ISBN'} | Stock: {data?.inventory?.physical?.find(i => i.book_id === b.id)?.stock || 0}</span>
                                            </div>
                                            <Plus className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 min-h-[300px] border-2 border-slate-100 rounded-3xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-black">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Descripción del Producto</th>
                                        <th className="px-6 py-4 text-center w-24">Cantidad</th>
                                        <th className="px-6 py-4 text-right w-36">Precio Unitario</th>
                                        <th className="px-6 py-4 text-right w-40">Subtotal</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center opacity-20">
                                                <ShoppingCart className="w-16 h-16 mx-auto mb-2" />
                                                <p className="text-xs font-black uppercase tracking-widest">Ingrese productos para facturar</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((it, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-900">{it.title}</p>
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 rounded-full uppercase">Disponible: {it.stock} u.</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-slate-100 border-none rounded-xl p-2 text-center text-sm font-bold" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end font-mono text-sm">
                                                        <span className="text-slate-400 mr-1">$</span>
                                                        <input type="text" value={it.unitPrice.toLocaleString('es-CL')} onChange={e => updateItem(i, 'unitPrice', parseInt(e.target.value.replace(/\D/g, '')) || 0)} className="w-24 bg-transparent border-b border-slate-200 text-right font-bold outline-none" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-black text-slate-900">{formatCLP(it.total)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resumen Final</p>
                            <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{formatCLP(subtotal)}</p>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest">Cancelar</button>
                            <button type="submit" disabled={items.length === 0 || saving} className="px-12 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50">
                                {saving ? 'Cargando...' : 'Finalizar Venta'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
