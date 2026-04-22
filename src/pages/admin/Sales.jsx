import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
    ShoppingCart, Plus, X, Search, TrendingUp, Activity,
    BookOpen, DollarSign, Calendar, Users, Package, BarChart3,
    CheckCircle, XCircle, Download, FileSpreadsheet, AlertCircle, AlertTriangle,
    UserPlus
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
    const { user, data, formatCurrency, addNewSale, updateInventory, addNewClient, updateSaleDetails, addAuditLog, reloadData, taxRate, t } = useAuth()
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
                <div className="glass-card p-6 border-l-4 border-emerald-500 bg-emerald-500/5 transition-all hover:bg-emerald-500/10 group cursor-default">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-emerald-400 transition-colors">Venta Firme</p>
                    <p className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">{formatCLP(revenueFirme)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-amber-500 bg-amber-500/5 transition-all hover:bg-amber-500/10 group cursor-default">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-amber-400 transition-colors">Venta Flotante</p>
                    <p className="text-2xl font-black text-amber-500 font-mono tracking-tighter">{formatCLP(revenueFlotante)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-500/5 transition-all hover:bg-blue-500/10 group cursor-default">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-blue-400 transition-colors">Total Rango</p>
                    <p className="text-2xl font-black text-white font-mono tracking-tighter">{formatCLP(cumulativeRevenue)}</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-blue-400 bg-blue-400/5 transition-all hover:bg-blue-400/10 group cursor-default">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest group-hover:text-blue-300 transition-colors">Unidades</p>
                    <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter">{cumulativeUnits.toLocaleString()}</p>
                </div>
            </div>

            {/* Filters Bar Estilo Despacho */}
            <div className="flex flex-wrap items-center gap-4 bg-[#1e293b]/50 dark:bg-[#1e293b]/50 p-4 rounded-3xl border border-white/5 shadow-xl backdrop-blur-xl">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por libro, cliente, RUT o documento..."
                        className="w-full bg-[#0f172a] border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterChannel}
                        onChange={e => setFilterChannel(e.target.value)}
                        className="bg-[#0f172a] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-bold uppercase text-slate-400 outline-none cursor-pointer hover:border-blue-500/50 transition-all appearance-none min-w-[140px]"
                    >
                        <option value="">Canales: Todos</option>
                        {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    {authors.length > 0 && (
                        <select
                            value={filterAuthor}
                            onChange={e => setFilterAuthor(e.target.value)}
                            className="bg-[#0f172a] border border-white/5 rounded-2xl px-5 py-3 text-[10px] font-bold uppercase text-slate-400 outline-none cursor-pointer hover:border-blue-500/50 transition-all appearance-none min-w-[140px]"
                        >
                            <option value="">Autores: Todos</option>
                            {authors.map(a => (
                                <option key={a.id} value={a.id} className={isAuthorComplete(a) ? 'text-blue-400' : 'text-rose-500'}>
                                    {isAuthorComplete(a) ? '✓' : '!'} {a.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                {(searchTerm || filterChannel || filterAuthor) && (
                    <button onClick={() => { setSearchTerm(''); setFilterChannel(''); setFilterAuthor('') }} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20">
                        <X className="w-4 h-4" />
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
                    onClose={() => setShowAdd(false)}

                    onSave={async (items, commonData) => {
                        try {
                            const commonId = `invoice-${Date.now()}`
                            for (const item of items) {
                                const book = books.find(b => b.id === item.bookId)
                                
                                await addNewSale({
                                    ...commonData,
                                    ...item,
                                    groupRef: commonId,
                                    bookTitle: book?.title || '',
                                    createdAt: new Date().toISOString()
                                })

                                    // Update Stock - Using robust AuthContext helper
                                    if (item.bookId && item.quantity > 0) {
                                        const nowStr = new Date().toISOString()
                                        await updateInventory(item.bookId, (current) => {
                                            const existing = current || { stock: 0, entries: [], exits: [] }
                                            return {
                                                ...existing,
                                                stock: (existing.stock || 0) - item.quantity,
                                                exits: [
                                                    ...(existing.exits || []),
                                                    { date: nowStr.slice(0, 10), qty: item.quantity, ref: `Venta ${commonData.channel} – ${commonId}` }
                                                ]
                                            }
                                        })
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

function SaleForm({ onClose, onSave, books, data }) {
    const { taxRate, formatCurrency, data: authData, addNewClient, user } = useAuth()
    const formatCLP = formatCurrency
    const today = new Date().toISOString().slice(0, 10)
    const [common, setCommon] = useState({
        channel: 'Directa',
        type: 'B2C (Consumidor final)',
        saleDate: today,
        clientName: '',
        clientId: '',
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

    // Client Selector State
    const [clientSearch, setClientSearch] = useState('')
    const [showClientList, setShowClientList] = useState(false)
    const [isCreatingClient, setIsCreatingClient] = useState(false)
    const [newClientName, setNewClientName] = useState('')

    const clients = useMemo(() => authData?.clients || [], [authData])
    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients.slice(0, 5)
        return clients.filter(c => 
            (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.tax_id || '').toLowerCase().includes(clientSearch.toLowerCase())
        ).slice(0, 10)
    }, [clients, clientSearch])

    const handleSelectClient = (client) => {
        setCommon(p => ({ ...p, clientName: client.name, clientId: client.id }))
        setClientSearch(client.name)
        setShowClientList(false)
    }

    const handleQuickCreateClient = async () => {
        if (!clientSearch.trim()) return
        setIsCreatingClient(true)
        try {
            const newClient = await addNewClient({
                name: clientSearch,
                type: common.type === 'B2B (Empresa / Librería)' ? 'libreria' : 'otro',
                contact_name: '',
                email: '',
                phone: '',
                address: '',
                tax_id: '',
                notes: 'Creado desde mesa de ventas',
                credit_limit: 0,
                default_discount: 0
            })
            
            if (newClient) {
                handleSelectClient(newClient)
            }
        } catch (err) {
            console.error('Error in handleQuickCreateClient:', err)
            alert(`Error al crear cliente rápido: ${err.message || 'Error desconocido'}`)
        } finally {
            setIsCreatingClient(false)
        }
    }

    const taxVal = 1 + ((taxRate || 19) / 100)
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    const handleSearch = (q) => {
        setSearchTerm(q)
        if (q.trim() === '') {
            // Si está vacío, mostrar los primeros 15 títulos (Modo Exploración)
            setSearchResults(books.slice(0, 15))
            return
        }
        const lowerQ = q.toLowerCase()
        const results = books.filter(b => 
            (b.title || '').toLowerCase().includes(lowerQ) || 
            (b.isbn || '').toLowerCase().includes(lowerQ)
        ).slice(0, 15)
        setSearchResults(results)
    }

    const addItem = (book) => {
        const inv = data?.inventory?.physical?.find(i => i.book_id === book.id)
        const stock = inv?.stock ?? 0
        // No bloqueamos, solo permitimos con advertencia si el stock es bajo
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-[#1e293b] w-full max-w-4xl shadow-2xl rounded-3xl flex flex-col max-h-[95vh] overflow-hidden border border-white/5">
                {/* Header Estilo Despacho */}
                <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                        <div>
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Registro de Venta</h3>
                            <p className="text-sm text-slate-400">Control de múltiples títulos y canales.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-all bg-white/5 p-2 rounded-full border border-white/10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-8 flex flex-col gap-6 overflow-y-auto">
                        
                        {/* Datos Cliente / Referencia */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">CLIENTE / LIBRERÍA</label>
                                <div className="relative">
                                    <input 
                                        placeholder="Buscar o escribir nombre de cliente..." 
                                        value={clientSearch || common.clientName} 
                                        onFocus={() => setShowClientList(true)}
                                        onChange={e => {
                                            setClientSearch(e.target.value)
                                            setCommon(p => ({ ...p, clientName: e.target.value, clientId: '' }))
                                            setShowClientList(true)
                                        }}
                                        className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none"
                                    />
                                    {showClientList && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-[60] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {filteredClients.length > 0 ? (
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredClients.map(c => (
                                                        <button
                                                            key={c.id}
                                                            type="button"
                                                            onClick={() => handleSelectClient(c)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-500/10 text-sm flex flex-col transition-colors border-b border-white/5 last:border-none"
                                                        >
                                                            <span className="font-bold text-white">{c.name}</span>
                                                            {c.rut && <span className="text-[10px] text-slate-400 font-mono">{c.rut}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-slate-400 italic">No se encontraron clientes</div>
                                            )}
                                            
                                            <button
                                                type="button"
                                                disabled={isCreatingClient || !clientSearch}
                                                onClick={handleQuickCreateClient}
                                                className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2 transition-all border-t border-slate-700/50 mt-1"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                {isCreatingClient ? 'Creando...' : `Registrar "${clientSearch}" como nuevo cliente`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {showClientList && <div className="fixed inset-0 z-[55]" onClick={() => setShowClientList(false)}></div>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">CONTACTO / REFERENCIA</label>
                                <input 
                                    placeholder="Email o Teléfono" 
                                    value={common.documentRef} 
                                    onChange={e => setCommon(p => ({ ...p, documentRef: e.target.value }))}
                                    className="w-full bg-[#0f172a] border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Títulos a Vender */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TÍTULOS A VENDER</label>
                                <div className="flex items-center gap-4">
                                    <select 
                                        value={common.channel} 
                                        onChange={e => setCommon(p => ({ ...p, channel: e.target.value }))}
                                        className="bg-[#0f172a] text-blue-400 text-xs font-bold border-none outline-none cursor-pointer"
                                    >
                                        {FORM_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input type="date" value={common.saleDate} onChange={e => setCommon(p => ({ ...p, saleDate: e.target.value }))} className="bg-transparent text-slate-400 text-xs border-none outline-none" />
                                </div>
                            </div>

                            <div className="relative group">
                                <div 
                                    className="flex items-center bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 group focus-within:border-blue-500 transition-all cursor-text shadow-inner"
                                    onClick={() => handleSearch('')}
                                >
                                    <button type="button" className="p-1 hover:bg-blue-500/20 rounded-lg transition-colors mr-2">
                                        <Search className="w-5 h-5 text-blue-400" />
                                    </button>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => handleSearch(e.target.value)}
                                        onFocus={() => handleSearch('')}
                                        placeholder="Click en la lupa para ver catálogo o escribe para buscar..."
                                        className="bg-transparent text-white w-full text-base outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden backdrop-blur-3xl">
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            {searchResults.map(b => (
                                                <button key={b.id} type="button" onClick={() => addItem(b)} className="w-full text-left p-4 hover:bg-blue-600 group transition-all flex justify-between items-center border-b border-white/5 last:border-0">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white group-hover:text-white">{(b.title || '').substring(0, 55)}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 group-hover:text-blue-100 font-mono tracking-tighter">ISBN: {b.isbn || 'N/A'}</span>
                                                            <span className="text-[10px] text-blue-400 group-hover:text-white font-bold bg-blue-400/10 px-2 rounded-full">{formatCLP(b.pvp)}</span>
                                                        </div>
                                                    </div>
                                                    <Plus className="w-5 h-5 text-blue-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Items */}
                            <div className="bg-[#151f2e] rounded-2xl border border-white/5 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Libro</th>
                                            <th className="px-6 py-4 text-center w-28">Cantidad</th>
                                            <th className="px-6 py-4 text-right w-32">P. Unitario</th>
                                            <th className="px-6 py-4 text-right w-32">Subtotal</th>
                                            <th className="px-6 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {items.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center opacity-30 italic text-slate-500 text-xs">Añade títulos para comenzar la venta.</td>
                                            </tr>
                                        ) : (
                                            items.map((it, idx) => (
                                                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-white font-bold text-sm">{it.title}</p>
                                                        {it.stock <= 0 && (
                                                            <p className="text-[9px] text-rose-500 font-black uppercase flex items-center gap-1 animate-pulse">
                                                                <AlertTriangle className="w-3 h-3" /> Sin stock en sistema (quedará negativo)
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase">Stock: {it.stock} u.</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input type="number" min="1" value={it.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="w-20 mx-auto block bg-[#0f172a] border border-slate-700 rounded-lg py-1.5 text-center text-white text-sm" />
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                                        {formatCLP(it.unitPrice)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-white font-mono">
                                                        {formatCLP(it.total)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer Estilo Despacho */}
                    <div className="p-8 bg-slate-900/50 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center md:text-left">TOTAL A PAGAR</p>
                                <p className="text-3xl font-bold text-white font-mono tracking-tighter">{formatCLP(subtotal)}</p>
                            </div>
                            <div className="hidden md:block">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">CANT. TÍTULOS</p>
                                <p className="text-2xl font-bold text-slate-400">{items.length}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button type="button" onClick={onClose} className="flex-1 md:flex-none px-12 py-4 rounded-2xl border border-slate-700 text-sm font-bold text-slate-400 hover:bg-white/5 transition-all uppercase">Cancelar</button>
                            <button type="submit" disabled={items.length === 0 || saving} className="flex-1 md:flex-none px-12 py-4 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 text-white rounded-2xl text-sm font-bold uppercase transition-all">
                                {saving ? 'Procesando...' : 'Efectuar Venta y Registrar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
