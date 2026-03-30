import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
    DollarSign, Download, CheckCircle, Clock, User, TrendingUp,
    BookOpen, BarChart3, Plus, RefreshCw, AlertCircle, Calendar,
    ShoppingCart, Percent, CreditCard, FileText, Banknote, Check
} from 'lucide-react'

const PERIODS = [
    { label: 'Enero 2026', value: '2026-01', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Febrero 2026', value: '2026-02', start: '2026-02-01', end: '2026-02-28' },
    { label: 'Marzo 2026', value: '2026-03', start: '2026-03-01', end: '2026-03-31' },
    { label: 'Q1 2026', value: '2026-Q1', start: '2026-01-01', end: '2026-03-31' },
    { label: 'Q2 2026', value: '2026-Q2', start: '2026-04-01', end: '2026-06-30' },
    { label: 'Año 2026', value: '2026', start: '2026-01-01', end: '2026-12-31' },
]

export default function Royalties() {
    const { data, formatCLP, addAuditLog, reloadData, t, user } = useAuth()

    const [selectedAuthor, setSelectedAuthor] = useState('all')
    const [selectedPeriod, setSelectedPeriod] = useState('2026-03')
    const [generating, setGenerating] = useState(false)
    const [approving, setApproving] = useState(null)
    const [paying, setPaying] = useState(null) // ✅ #4 Estado de pago

    const authors = useMemo(() => data.users.filter(u => u.role === 'AUTOR'), [data.users])
    const books = useMemo(() => data.books.filter(b => b.status === 'Publicado' && b.royaltyPercent > 0), [data.books])
    const sales = useMemo(() => (data.finances?.sales || []).filter(s => s.status !== 'Anulada'), [data.finances])
    const royalties = useMemo(() => data.finances?.royalties || [], [data.finances])

    // ── Calcular ventas reales por libro en el período ───────────────────────
    const period = PERIODS.find(p => p.value === selectedPeriod) || PERIODS[2]

    const salesByBook = useMemo(() => {
        const map = {}
        sales
            .filter(s => s.saleDate >= period.start && s.saleDate <= period.end)
            .forEach(s => {
                if (!map[s.bookId]) map[s.bookId] = { units: 0, amount: 0 }
                map[s.bookId].units += (s.quantity || 0)
                map[s.bookId].amount += (s.totalAmount || 0)
            })
        return map
    }, [sales, period])

    // ── Liquidaciones calculadas (en tiempo real, sin guardar) ───────────────
    const calculations = useMemo(() => books.map(book => {
        const salesData = salesByBook[book.id] || { units: 0, amount: 0 }
        // Según Ciclo Editorial: % del PVP NETO (PVP / 1.19) por unidades vendidas
        const pvpNeto = (book.pvp || 0) / 1.19
        const gross = Math.round(pvpNeto * (book.royaltyPercent / 100) * salesData.units)
        const advance = book.advance || 0
        const net = gross - advance
        // ¿Ya existe una liquidación guardada en este período?
        const existing = royalties.find(r => r.bookId === book.id && r.period === selectedPeriod)
        return { book, salesData, gross, advance, net, existing, pvpNeto }
    }), [books, salesByBook, royalties, selectedPeriod])

    // Filtrar por autor
    const filtered = useMemo(() => {
        if (selectedAuthor === 'all') return calculations
        return calculations.filter(c => {
            const book = c.book
            const author = data.users.find(u => u.id === book.authorId || u.name === book.authorName)
            return author?.id === selectedAuthor
        })
    }, [calculations, selectedAuthor, data.users])

    // KPIs totales del período
    const totalSalesAmount = useMemo(() => Object.values(salesByBook).reduce((s, b) => s + b.amount, 0), [salesByBook])
    const totalGross = useMemo(() => filtered.reduce((s, c) => s + c.gross, 0), [filtered])
    const totalNet = useMemo(() => filtered.reduce((s, c) => s + c.net, 0), [filtered])
    const totalUnits = useMemo(() => Object.values(salesByBook).reduce((s, b) => s + b.units, 0), [salesByBook])

    // ── Generar / guardar liquidación ────────────────────────────────────────
    const handleGenerate = useCallback(async ({ book, salesData, gross, advance, net }) => {
        setGenerating(book.id)
        try {
            const author = data.users.find(u => u.id === book.authorId || u.name === book.authorName)
            const id = `roy-${book.id}-${selectedPeriod}-${Date.now()}`
            
            // Get the actual tenant_id of the author to ensure database integrity
            const tenantId = author?.tenantId || user?.tenantId || data.users[0]?.tenantId || 't1'

            const entry = {
                id,
                tenant_id: tenantId,
                book_id: book.id,
                author_id: author?.id || '',
                author_name: author?.name || book.authorName || '',
                period: selectedPeriod,
                period_start: period.start,
                period_end: period.end,
                total_sales_amount: salesData.amount,
                total_units_sold: salesData.units,
                royalty_percent: book.royaltyPercent,
                gross_royalty: gross,
                advance_deducted: advance,
                net_royalty: net,
                status: 'pendiente',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
            const { error } = await supabase.from('royalties').insert(entry)
            if (error) throw error
            await addAuditLog(`Generó liquidación "${book.title}" (${period.label}): ${formatCLP(net)}`, 'finanzas')
            await reloadData()
        } catch (err) {
            alert(`Error al generar: ${err.message}`)
        } finally {
            setGenerating(null)
        }
    }, [data.users, selectedPeriod, period, addAuditLog, formatCLP, reloadData])

    // ── Aprobar liquidación ──────────────────────────────────────────────────
    const handleApprove = useCallback(async (royalty) => {
        setApproving(royalty.id)
        try {
            const { error } = await supabase
                .from('royalties')
                .update({ status: 'aprobada', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('id', royalty.id)
            if (error) throw error
            const book = data.books.find(b => b.id === royalty.bookId)
            await addAuditLog(`Aprobó liquidación "${book?.title}" (${royalty.period}): ${formatCLP(royalty.netRoyalty)}`, 'finanzas')
            await reloadData()
        } catch (err) {
            alert(`Error al aprobar: ${err.message}`)
        } finally {
            setApproving(null)
        }
    }, [data.books, addAuditLog, formatCLP, reloadData])

    // ── Marcar como Pagada ───────────────────────────────────────────────────
    const handleMarkAsPaid = useCallback(async (royalty) => {
        const ref = window.prompt(`Referencia de pago/transferencia para liquidación de ${royalty.authorName} (${formatCLP(royalty.netRoyalty)}):`)
        if (ref === null) return // Canceled

        setPaying(royalty.id)
        try {
            const { error } = await supabase
                .from('royalties')
                .update({
                    status: 'pagada',
                    paid_at: new Date().toISOString(),
                    notes: ref ? `Ref pago: ${ref}` : 'Pago confirmado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', royalty.id)
            if (error) throw error
            const book = data.books.find(b => b.id === royalty.bookId)
            await addAuditLog(`Marcó como pagada liquidación "${book?.title}" (${royalty.period}): ${formatCLP(royalty.netRoyalty)}`, 'finanzas')
            await reloadData()
        } catch (err) {
            alert(`Error al registrar pago: ${err.message}`)
        } finally {
            setPaying(null)
        }
    }, [data.books, addAuditLog, formatCLP, reloadData])
    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-primary" /> Liquidaciones de Regalías
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">
                        Calculado desde ventas reales · Fórmula: ({t('units')} × PVP Neto × % Regalía) − Anticipo
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        value={selectedPeriod}
                        onChange={e => setSelectedPeriod(e.target.value)}
                        className="input-field w-auto text-sm"
                    >
                        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <select
                        value={selectedAuthor}
                        onChange={e => setSelectedAuthor(e.target.value)}
                        className="input-field w-auto text-sm"
                    >
                        <option value="all">Todos los autores</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>

            {/* KPI Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase">Ventas del Período</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">{formatCLP(totalSalesAmount)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-1">{totalUnits} unidades vendidas</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Percent className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase">Regalía Bruta</p>
                    </div>
                    <p className="text-xl font-bold text-amber-600 dark:text-yellow-400 font-mono">{formatCLP(totalGross)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-1">suma de todos los autores</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase">Total a Pagar</p>
                    </div>
                    <p className={`text-xl font-bold font-mono ${totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCLP(totalNet)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-1">neto después de anticipos</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <p className="text-[11px] text-slate-500 dark:text-dark-500 uppercase">Liquidaciones</p>
                    </div>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                        {royalties.filter(r => r.period === selectedPeriod).length}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-1">
                        {royalties.filter(r => r.period === selectedPeriod && r.status === 'aprobada').length} aprobadas
                    </p>
                </div>
            </div>

            {/* Calculation Cards per book */}
            <div className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-dark-500 uppercase tracking-wide flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Cálculo por Título — {period.label}
                </h2>

                {filtered.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-dark-500 mx-auto mb-3" />
                        <p className="text-slate-900 dark:text-white font-medium">Sin títulos publicados con regalía configurada</p>
                        <p className="text-sm text-slate-500 dark:text-dark-500 mt-1">Configura el % de regalía en cada título desde la sección Títulos.</p>
                    </div>
                ) : (
                    filtered.map(({ book, salesData, gross, advance, net, existing, pvpNeto }) => (
                        <div key={book.id} className="glass-card p-5">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-slate-900 dark:text-white font-semibold">{book.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-dark-600 flex items-center gap-1 mt-0.5">
                                        <User className="w-3 h-3" />
                                        {book.authorName || '—'} · {book.royaltyPercent}% regalía
                                        {book.advance > 0 && <span className="ml-2 text-amber-600 dark:text-amber-500">· anticipo: {formatCLP(book.advance)}</span>}
                                    </p>
                                </div>

                                {/* Action button */}
                                {salesData.amount === 0 ? (
                                    <span className="text-xs text-slate-400 dark:text-dark-600 italic flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> Sin ventas en el período
                                    </span>
                                ) : existing ? (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${existing.status === 'aprobada' ? 'badge-green' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                            {existing.status === 'aprobada' ? <><CheckCircle className="w-3 h-3" /> Aprobada</> : <><Clock className="w-3 h-3" /> Pendiente</>}
                                        </span>
                                        {existing.status === 'pendiente' && (
                                            <button
                                                onClick={() => handleApprove(existing)}
                                                disabled={approving === existing.id}
                                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 disabled:opacity-60"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                {approving === existing.id ? 'Aprobando...' : 'Aprobar'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleGenerate({ book, salesData, gross, advance, net })}
                                        disabled={generating === book.id}
                                        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 border-primary/40 hover:border-primary disabled:opacity-60"
                                    >
                                        {generating === book.id
                                            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generando...</>
                                            : <><Plus className="w-3 h-3" /> Generar Liquidación</>}
                                    </button>
                                )}
                            </div>

                            {/* Metrics grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="bg-slate-50 dark:bg-dark-200/60 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-500 uppercase mb-1">Unidades</p>
                                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">{salesData.units}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-200/60 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-500 uppercase mb-1">PVP Neto (Base)</p>
                                    <p className="text-base font-bold text-slate-900 dark:text-white font-mono">{formatCLP(pvpNeto)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-200/60 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-500 uppercase mb-1">Regalía Bruta</p>
                                    <p className="text-base font-bold text-amber-600 dark:text-yellow-400 font-mono">{formatCLP(gross)}</p>
                                </div>
                                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase mb-1">− Anticipo</p>
                                    <p className="text-base font-bold text-amber-700 dark:text-amber-300 font-mono">−{formatCLP(advance)}</p>
                                </div>
                                <div className={`rounded-lg p-3 text-center ${net >= 0 ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-500/5 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'}`}>
                                    <p className={`text-[10px] uppercase mb-1 ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>= Regalía Neta</p>
                                    <p className={`text-base font-bold font-mono ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCLP(net)}</p>
                                </div>
                            </div>

                            {/* Formula bar */}
                            <div className="mt-3 px-3 py-2 bg-slate-100 dark:bg-dark-200/40 rounded-lg">
                                <p className="text-[10px] text-slate-500 dark:text-dark-500 font-mono text-center">
                                    ({salesData.units} u. × {formatCLP(pvpNeto)} × {book.royaltyPercent}%) − {formatCLP(advance)} = {' '}
                                    <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>{formatCLP(net)}</span>
                                </p>
                            </div>

                            {/* Sales breakdown per channel */}
                            {salesData.amount > 0 && (() => {
                                const bookSales = sales.filter(s => s.bookId === book.id && s.saleDate >= period.start && s.saleDate <= period.end)
                                const byChannel = {}
                                bookSales.forEach(s => { byChannel[s.channel] = (byChannel[s.channel] || 0) + s.totalAmount })
                                return Object.keys(byChannel).length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {Object.entries(byChannel).map(([ch, amt]) => (
                                            <span key={ch} className="text-[10px] bg-primary/10 border border-primary/20 text-primary-300 px-2 py-0.5 rounded-full">
                                                {ch}: {formatCLP(amt)}
                                            </span>
                                        ))}
                                    </div>
                                ) : null
                            })()}
                        </div>
                    ))
                )}
            </div>

            {/* Saved Royalties History */}
            {royalties.filter(r => r.period === selectedPeriod).length > 0 && (
                <div className="glass-card p-5">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 dark:text-dark-500" /> Liquidaciones Guardadas — {period.label}
                    </h2>
                    <div className="divide-y divide-dark-300">
                        {royalties
                            .filter(r => r.period === selectedPeriod)
                            .map(r => {
                                const book = data.books.find(b => b.id === r.bookId)
                                return (
                                    <div key={r.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm text-slate-900 dark:text-white font-medium">{r.authorName} — {book?.title || r.bookId}</p>
                                            <p className="text-xs text-slate-500 dark:text-dark-600">
                                                {r.totalUnitsSold || 0} u. · Ventas: {formatCLP(r.totalSalesAmount)} · {r.royaltyPercent}%
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-bold font-mono ${(r.netRoyalty || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCLP(r.netRoyalty || 0)}
                                            </span>
                                            {r.status === 'pendiente' && (
                                                <button
                                                    onClick={() => handleApprove(r)}
                                                    disabled={approving === r.id}
                                                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    {approving === r.id ? 'Aprobando...' : 'Aprobar'}
                                                </button>
                                            )}
                                            {r.status === 'aprobada' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(r)}
                                                    disabled={paying === r.id}
                                                    className="btn-secondary bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 text-xs px-3 py-1.5 flex items-center gap-1"
                                                >
                                                    <Banknote className="w-3 h-3" />
                                                    {paying === r.id ? 'Registrando...' : 'Marcar Pagada'}
                                                </button>
                                            )}
                                            {r.status === 'pagada' && (
                                                <div className="flex flex-col items-end">
                                                    <span className="badge-green flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300">
                                                        <Check className="w-3 h-3" /> Pagada
                                                    </span>
                                                    {r.notes && <span className="text-[9px] text-dark-500 mt-0.5">{r.notes}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                    </div>
                </div>
            )}
        </div>
    )
}
