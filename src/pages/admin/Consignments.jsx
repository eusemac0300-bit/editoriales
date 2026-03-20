import React, { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
    Truck, Search, Plus, XCircle, Printer, Building2, BookOpen, DollarSign, ArrowRightLeft, Clock,
    ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Consignments() {
    const { user, data, formatCLP, addAuditLog, reloadData } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAction, setSelectedAction] = useState(null) // { type: 'liquidate' | 'return' | 'shrinkage', item }
    const [expandedItem, setExpandedItem] = useState(null) // ID of the consignment item
    const [newItem, setNewItem] = useState({ clientName: '', contactInfo: '', notes: '', items: [{ bookId: '', quantity: 1 }] })

    const consignments = useMemo(() => data.finances?.consignments || [], [data.finances])
    const books = useMemo(() => data.books.filter(b => b.status === 'Publicado'), [data.books])
    const inventory = useMemo(() => data.inventory.physical || [], [data.inventory])

    const filtered = useMemo(() => {
        let list = [...consignments]
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter(c =>
                c.bookTitle?.toLowerCase().includes(q) ||
                c.clientName?.toLowerCase().includes(q)
            )
        }
        return list
    }, [consignments, searchTerm])

    const consignmentsGroups = useMemo(() => {
        const groups = {}
        filtered.forEach(c => {
            const key = `${c.clientName}-${c.sentDate}`
            if (!groups[key]) {
                groups[key] = {
                    key,
                    clientName: c.clientName,
                    sentDate: c.sentDate,
                    items: []
                }
            }
            groups[key].items.push(c)
        })
        return Object.values(groups).sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate))
    }, [filtered])

    const handleGenerate = async (e) => {
        e.preventDefault()
        const { clientName, contactInfo, notes, items } = newItem

        if (!clientName || items.some(it => !it.bookId || !it.quantity)) {
            return alert('Completa todos los campos y añade al menos un libro.')
        }

        // Validate stock for all
        for (const it of items) {
            const inv = inventory.find(i => i.bookId === it.bookId)
            if (!inv || inv.stock < it.quantity) {
                const book = books.find(b => b.id === it.bookId)
                return alert(`Stock insuficiente para "${book?.title}". Disponible: ${inv?.stock || 0}`)
            }
        }

        try {
            const dispatchId = `disp-${Date.now()}`
            const dateStr = new Date().toISOString().slice(0, 10)

            for (const it of items) {
                const book = books.find(b => b.id === it.bookId)
                const inv = inventory.find(i => i.bookId === it.bookId)
                const consId = `cons-${Date.now()}-${Math.floor(Math.random()*1000)}`

                const newConsignment = {
                    id: consId,
                    tenant_id: user?.tenantId || 't1',
                    book_id: it.bookId,
                    client_name: clientName,
                    contact_info: contactInfo,
                    sent_date: dateStr,
                    sent_quantity: it.quantity,
                    sold_quantity: 0,
                    returned_quantity: 0,
                    status: 'activa',
                    notes: `${notes}${items.length > 1 ? ` (Guía #${dispatchId})` : ''}`
                }

                const { error: cErr } = await supabase.from('consignments').insert(newConsignment)
                if (cErr) throw cErr

                // Deduct stock
                const newStock = inv.stock - it.quantity
                const newExits = [...(inv.exits || []), {
                    date: dateStr,
                    qty: it.quantity,
                    ref: `Consignación a ${clientName} (${dispatchId})`
                }]
                await supabase.from('inventory_physical')
                    .update({ stock: newStock, exits: newExits })
                    .eq('id', inv.id)
            }

            await addAuditLog(`Registró despacho de ${items.length} títulos a ${clientName}. ID: ${dispatchId}`, 'ventas')
            await reloadData()
            setShowAdd(false)
            setNewItem({ clientName: '', contactInfo: '', notes: '', items: [{ bookId: '', quantity: 1 }] })
        } catch (err) {
            alert('Error al registrar: ' + err.message)
        }
    }

    const processAction = async (e) => {
        e.preventDefault()
        const fd = new FormData(e.target)
        let qty = parseInt(fd.get('quantity'), 10)
        if (!qty || qty <= 0) return alert('Cantidad inválida')

        const { type, item } = selectedAction
        const pending = item.sentQuantity - item.soldQuantity - item.returnedQuantity
        if (qty > pending) return alert(`La cantidad máxima permitida es ${pending}`)

        try {
            if (type === 'return') {
                // Update consignment
                const newRet = item.returnedQuantity + qty
                const isClosed = (item.soldQuantity + newRet) >= item.sentQuantity
                const { error: cErr } = await supabase.from('consignments')
                    .update({
                        returned_quantity: newRet,
                        status: isClosed ? 'cerrada' : 'activa'
                    }).eq('id', item.id)
                if (cErr) throw cErr

                // Return stock
                const inv = inventory.find(i => i.bookId === item.bookId)
                if (inv) {
                    const { error: iErr } = await supabase.from('inventory_physical')
                        .update({
                            stock: inv.stock + qty,
                            entries: [...(inv.entries || []), { date: new Date().toISOString().slice(0, 10), qty, cost: 0, ref: `Devolución Consignación (${item.id})` }]
                        }).eq('id', inv.id)
                    if (iErr) throw iErr
                }
                await addAuditLog(`Devolución consignación: ${qty} u. de "${item.bookTitle}" desde ${item.clientName}`, 'ventas')
            } else if (type === 'liquidate') {
                const price = parseFloat(fd.get('price')) || 0
                const docRef = fd.get('documentRef') || ''

                const isShrinkage = selectedAction.type === 'shrinkage'
                
                // 1. Generate Sale Entry (Merma is a $0 sale that removes stock from bookstore but not from warehouse as it was already deducted)
                const saleId = `sale-${Date.now()}`
                const { error: sErr } = await supabase.from('sales').insert({
                    id: saleId,
                    tenant_id: user?.tenantId || 't1',
                    book_id: item.bookId,
                    channel: isShrinkage ? 'Consignación (Merma)' : 'Consignación',
                    type: 'B2B (Empresa / Librería)',
                    client_name: item.clientName,
                    document_ref: isShrinkage ? 'Merma/Baja' : docRef,
                    sale_date: new Date().toISOString().slice(0, 10),
                    quantity: qty,
                    unit_price: isShrinkage ? 0 : price,
                    total_amount: isShrinkage ? 0 : (qty * price),
                    notes: isShrinkage ? `MERMA: ${fd.get('shrinkageNotes')} (Consigne ID: ${item.id})` : `Liquidación de consignación ${item.id}`,
                    status: 'Completada'
                })
                if (sErr) throw sErr

                // 2. Update consignment (We add to sold_quantity to effectively remove from bookstore balance)
                const newSold = item.soldQuantity + qty
                const isClosed = (newSold + item.returnedQuantity) >= item.sentQuantity
                const { error: cErr } = await supabase.from('consignments')
                    .update({
                        sold_quantity: newSold,
                        status: isClosed ? 'cerrada' : 'activa'
                    }).eq('id', item.id)
                if (cErr) throw cErr

                await addAuditLog(
                    isShrinkage 
                    ? `Registró MERMA en consignación: ${qty} u. de "${item.bookTitle}" (${item.clientName}). Motivo: ${fd.get('shrinkageNotes')}`
                    : `Liquidó venta por consignación: ${qty} u. de "${item.bookTitle}" (${item.clientName}) por ${formatCLP(qty * price)}`, 
                    'ventas'
                )
            }

            await reloadData()
            setSelectedAction(null)
        } catch (err) {
            alert('Error en el proceso: ' + err.message)
        }
    }

    const printDispatchGuide = (mainItem) => {
        // Encontrar otros items del mismo despacho (mismo cliente y fecha)
        const sameDispatch = consignments.filter(c => 
            c.clientName === mainItem.clientName && 
            c.sentDate === mainItem.sentDate
        )

        const doc = new jsPDF()

        // Header
        doc.setFontSize(22)
        doc.setTextColor(16, 185, 129) // Emerald-500
        doc.text("GUÍA DE DESPACHO / ALBARÁN", 14, 25)

        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 32)
        doc.text(`Cliente: ${mainItem.clientName}`, 14, 37)

        // Details
        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.text("Datos de Entrega:", 14, 52)
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Destinatario: ${mainItem.clientName}`, 14, 58)
        doc.text(`Contacto: ${mainItem.contactInfo || 'No registrado'}`, 14, 63)
        doc.text(`Fecha de Despacho: ${new Date(mainItem.sentDate).toLocaleDateString('es-CL')}`, 14, 68)

        // Table
        const head = [['Pos.', 'Título del Libro', 'Cant.', 'Estado']]
        const body = sameDispatch.map((it, idx) => [
            (idx + 1).toString(),
            it.bookTitle,
            it.sentQuantity.toString(),
            'En Consignación'
        ])

        autoTable(doc, {
            startY: 75,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 15 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 40 }
            }
        })

        const finalY = doc.lastAutoTable?.finalY || 100
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("Notas y Condiciones:", 14, finalY + 15)
        doc.setFontSize(9)
        doc.text(mainItem.notes || "Mercadería entregada en calidad de consignación. Se requiere liquidación mensual de lo vendido y devolución de lo no comercializado en excelente estado.", 14, finalY + 22, { maxWidth: 180 })

        // Signatures
        const signY = finalY + 60
        doc.line(30, signY, 80, signY)
        doc.text("Firma Entregador", 35, signY + 5)

        doc.line(130, signY, 180, signY)
        doc.text("Firma Receptor - Timbre", 137, signY + 5)

        const fileName = (mainItem.clientName || 'Cliente').replace(/\s+/g,'_')
        doc.save(`Guia_Despacho_${fileName}_${mainItem.sentDate || 'Hoy'}.pdf`)
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Truck className="w-6 h-6 text-primary" /> Gestión de Consignaciones
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-dark-500 mt-1">
                        Despacho de stock, tracking de pendientes, liquidaciones y devoluciones.
                    </p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
                    <Plus className="w-4 h-4" /> Despachar Libros
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-600" />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por libro o cliente..."
                    className="input-field pl-9 text-sm w-full"
                />
            </div>

            {consignmentsGroups.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400 dark:text-dark-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm mb-2">Sin Despachos Activos</h3>
                    <p className="text-xs font-medium">Usa el botón "Despachar Libros" para registrar envíos a librerías.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {consignmentsGroups.map(group => {
                        const totalSent = group.items.reduce((acc, it) => acc + it.sentQuantity, 0)
                        const totalPending = group.items.reduce((acc, it) => acc + (it.sentQuantity - it.soldQuantity - it.returnedQuantity), 0)
                        const isActive = group.items.some(it => it.status === 'activa')

                        return (
                            <div key={group.key} className="glass-card overflow-hidden border border-slate-200 dark:border-dark-300 group hover:shadow-xl transition-all">
                                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-dark-200/20 border-b border-slate-100 dark:border-dark-400">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-dark-100 shadow-sm flex items-center justify-center text-primary">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{group.clientName}</h3>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                                                    {isActive ? 'Activo' : 'Cerrado'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Despachado el {new Date(group.sentDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="text-right hidden sm:block mr-4">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estado de Carga</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{totalPending} de {totalSent} ejemplares en local</p>
                                        </div>
                                        <button 
                                            onClick={() => printDispatchGuide(group.items[0])}
                                            className="flex-1 md:flex-none p-3 rounded-2xl bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-400 text-slate-600 hover:text-primary transition-all shadow-sm flex items-center justify-center gap-2 text-xs font-bold"
                                        >
                                            <Printer className="w-4 h-4" /> Guía
                                        </button>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/30 dark:bg-dark-100/10">
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Libro</th>
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Enviados</th>
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Vendidos</th>
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Devueltos</th>
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Saldo</th>
                                                <th className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-dark-400">
                                            {group.items.map(it => {
                                                const pendingItem = it.sentQuantity - it.soldQuantity - it.returnedQuantity
                                                const itemActive = it.status === 'activa' && pendingItem > 0
                                                const itemSales = (data.finances?.sales || []).filter(s => s.notes?.includes(`consignación ${it.id}`))
                                                const isExpanded = expandedItem === it.id

                                                return (
                                                    <React.Fragment key={it.id}>
                                                        <tr className="hover:bg-slate-50/50 dark:hover:bg-dark-300/10 transition-colors group/row">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <button 
                                                                        onClick={() => setExpandedItem(isExpanded ? null : it.id)}
                                                                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-dark-200 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary transition-all"
                                                                    >
                                                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                    </button>
                                                                    <div className="w-8 h-10 bg-slate-100 dark:bg-dark-200 rounded flex items-center justify-center text-slate-400">
                                                                        <BookOpen className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-tight">{it.bookTitle}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-mono text-center font-bold text-slate-600 dark:text-dark-500">{it.sentQuantity}</td>
                                                            <td className="px-6 py-4 text-sm font-mono text-center font-bold text-emerald-500">{it.soldQuantity}</td>
                                                            <td className="px-6 py-4 text-sm font-mono text-center font-bold text-orange-400">{it.returnedQuantity}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`text-sm font-mono font-black ${pendingItem > 0 ? 'text-primary' : 'text-slate-300'}`}>
                                                                    {pendingItem}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {itemActive ? (
                                                                    <div className="flex justify-end gap-2">
                                                                        <button 
                                                                            onClick={() => setSelectedAction({ type: 'liquidate', item: it })}
                                                                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                                            title="Liquidar Venta"
                                                                        >
                                                                            <DollarSign className="w-4 h-4" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setSelectedAction({ type: 'return', item: it })}
                                                                            className="p-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                                                            title="Registrar Devolución"
                                                                        >
                                                                            <ArrowRightLeft className="w-4 h-4" />
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => setSelectedAction({ type: 'shrinkage', item: it })}
                                                                            className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                                            title="Registrar Merma / Daño"
                                                                        >
                                                                            <AlertTriangle className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest bg-slate-100 dark:bg-dark-300 px-2 py-1 rounded">Cerrado</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="bg-slate-50/50 dark:bg-dark-400/10 shadow-inner">
                                                                <td colSpan="6" className="px-6 py-4">
                                                                    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                                                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 dark:border-dark-400 pb-2 flex items-center gap-2">
                                                                            <Clock className="w-3 h-3" /> Historial de Movimientos "{it.bookTitle}"
                                                                        </h4>
                                                                        
                                                                        {/* Ship Event */}
                                                                        <div className="flex items-center gap-4 text-xs font-bold py-2 border-l-2 border-primary/30 pl-4 ml-2">
                                                                            <span className="text-slate-400 font-mono w-20">{new Date(it.sentDate).toLocaleDateString('es-CL')}</span>
                                                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                                                            <span className="text-slate-900 dark:text-white">Despacho Inicial:</span>
                                                                            <span className="text-primary">{it.sentQuantity} u.</span>
                                                                        </div>

                                                                        {/* Partial Sales & Mermas */}
                                                                        {itemSales.map(sale => {
                                                                            const isShrink = sale.channel.includes('Merma')
                                                                            return (
                                                                                <div key={sale.id} className={`flex items-center gap-4 text-xs font-bold py-2 border-l-2 ${isShrink ? 'border-red-500/30' : 'border-emerald-500/30'} pl-4 ml-2`}>
                                                                                    <span className="text-slate-400 font-mono w-20">{new Date(sale.saleDate).toLocaleDateString('es-CL')}</span>
                                                                                    <div className={`w-2 h-2 rounded-full ${isShrink ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                                                    <span className="text-slate-900 dark:text-white">{isShrink ? 'Merma / Baja:' : 'Liquidación de Venta:'}</span>
                                                                                    <span className={isShrink ? 'text-red-500' : 'text-emerald-500'}>-{sale.quantity} u.</span>
                                                                                    <span className="text-slate-400 text-[10px] font-medium ml-auto max-w-[150px] truncate">
                                                                                        {isShrink ? sale.notes.replace('MERMA: ','') : `Ref: ${sale.documentRef || 'Sin Ref.'}`}
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        })}

                                                                        {/* Returns if any (tracked in audit or notes currently, but ideally we'd have a returns table) */}
                                                                        {it.returnedQuantity > 0 && (
                                                                            <div className="flex items-center gap-4 text-xs font-bold py-2 border-l-2 border-orange-500/30 pl-4 ml-2">
                                                                                <span className="text-slate-400 font-mono w-20">Varios</span>
                                                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                                                <span className="text-slate-900 dark:text-white">Devoluciones Acumuladas:</span>
                                                                                <span className="text-orange-500">-{it.returnedQuantity} u.</span>
                                                                            </div>
                                                                        )}

                                                                        {itemSales.length === 0 && it.returnedQuantity === 0 && (
                                                                            <p className="text-[10px] text-slate-400 italic py-2">No hay movimientos parciales registrados aún.</p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal de Despacho */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-100 rounded-[2.5rem] w-full max-w-2xl border border-slate-200 dark:border-dark-300 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                        <Truck className="w-6 h-6 text-primary" /> Nuevo Despacho
                                    </h2>
                                    <p className="text-slate-500 dark:text-dark-500 text-sm font-medium">Consignación de múltiples títulos.</p>
                                </div>
                                <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-300 transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Cliente / Librería</label>
                                    <input 
                                        type="text" 
                                        value={newItem.clientName}
                                        onChange={e => setNewItem({...newItem, clientName: e.target.value})}
                                        className="input-field w-full text-sm font-bold py-3" 
                                        placeholder="Ej. Librería Antártica" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Contacto / Referencia</label>
                                    <input 
                                        type="text" 
                                        value={newItem.contactInfo}
                                        onChange={e => setNewItem({...newItem, contactInfo: e.target.value})}
                                        className="input-field w-full text-sm font-bold py-3" 
                                        placeholder="Email o Teléfono" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-2">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest flex justify-between items-center">
                                    Títulos a Despachar
                                    <button 
                                        onClick={() => setNewItem({...newItem, items: [...newItem.items, { bookId: '', quantity: 1 }]})}
                                        className="text-primary hover:underline"
                                    >
                                        + Añadir Título
                                    </button>
                                </label>
                                
                                {newItem.items.map((it, idx) => (
                                    <div key={idx} className="flex gap-4 items-end bg-slate-50 dark:bg-dark-400/30 p-4 rounded-2xl relative group">
                                        <div className="flex-[3] space-y-2">
                                            <label className="text-[9px] font-bold text-slate-500">Libro</label>
                                            <select 
                                                value={it.bookId}
                                                onChange={e => {
                                                    const ni = [...newItem.items]
                                                    ni[idx].bookId = e.target.value
                                                    setNewItem({...newItem, items: ni})
                                                }}
                                                className="input-field w-full text-xs font-bold"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {books.map(b => (
                                                    <option key={b.id} value={b.id}>{b.title} (Stock: {inventory.find(inv => inv.bookId === b.id)?.stock || 0})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-bold text-slate-500">Cantidad</label>
                                            <input 
                                                type="number" 
                                                value={it.quantity}
                                                onChange={e => {
                                                    const ni = [...newItem.items]
                                                    ni[idx].quantity = parseInt(e.target.value) || 0
                                                    setNewItem({...newItem, items: ni})
                                                }}
                                                className="input-field w-full text-xs font-bold" 
                                            />
                                        </div>
                                        {newItem.items.length > 1 && (
                                            <button 
                                                onClick={() => {
                                                    const ni = newItem.items.filter((_, i) => i !== idx)
                                                    setNewItem({...newItem, items: ni})
                                                }}
                                                className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 pt-6 bg-slate-50 dark:bg-dark-300/50">
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowAdd(false)} 
                                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-dark-400 text-xs font-black uppercase tracking-widest hover:bg-white dark:hover:bg-dark-100 transition-all font-sans text-slate-500"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleGenerate}
                                    className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary/25"
                                >
                                    Efectuar Despacho y Generar Guía
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Acción (Liquidar / Devolver) */}
            {selectedAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-dark-100 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-dark-300 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {selectedAction.type === 'liquidate' ? (
                                    <><DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Liquidar Venta</>
                                ) : selectedAction.type === 'return' ? (
                                    <><ArrowRightLeft className="w-5 h-5 text-orange-500 dark:text-orange-400" /> Registrar Devolución</>
                                ) : (
                                    <><AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" /> Registrar Merma / Daño</>
                                )}
                            </h2>
                            <button onClick={() => setSelectedAction(null)} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-50 dark:bg-dark-200/50 p-3 rounded-lg mb-4 text-sm">
                            <p className="text-slate-900 dark:text-white font-medium">{selectedAction.item.bookTitle}</p>
                            <p className="text-slate-500 dark:text-dark-400 text-xs mt-1">Librería: {selectedAction.item.clientName}</p>
                            <p className="text-primary-600 dark:text-primary-300 text-xs mt-1 font-mono">Stock en local: {selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity} u.</p>
                        </div>

                        <form onSubmit={processAction} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-dark-500 uppercase tracking-wide mb-1">Cantidad de Ejemplares</label>
                                <input
                                    name="quantity"
                                    required
                                    type="number"
                                    min="1"
                                    max={selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity}
                                    defaultValue={selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity}
                                    className="input-field w-full text-lg font-mono font-bold text-slate-900 dark:text-white"
                                />
                            </div>

                            {selectedAction.type === 'liquidate' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-dark-500 uppercase tracking-wide mb-1">PVP Unitario Pactado</label>
                                        <input
                                            name="price"
                                            required
                                            type="number"
                                            min="0"
                                            defaultValue={books.find(b => b.id === selectedAction.item.bookId)?.pvp || 0}
                                            className="input-field w-full font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-dark-500 uppercase tracking-wide mb-1">Doc. Ref. (Factura/Boleta)</label>
                                        <input name="documentRef" type="text" className="input-field w-full" placeholder="Nro Boleta..." />
                                    </div>
                                </>
                            )}

                            {selectedAction.type === 'shrinkage' && (
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-dark-500 uppercase tracking-wide mb-1">Motivo / Justificación de la Merma</label>
                                    <textarea 
                                        name="shrinkageNotes" 
                                        required 
                                        className="input-field w-full h-24 resize-none pt-3 text-sm"
                                        placeholder="Ej: Libro mojado en vitrina, Robado en local, Dañado en transporte..."
                                    />
                                </div>
                            )}

                            <div className="pt-2">
                                <button type="submit" className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${selectedAction.type === 'liquidate'
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20'
                                    : selectedAction.type === 'return'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 shadow-orange-500/20'
                                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-red-500/20'
                                    }`}>
                                    Confirmar {selectedAction.type === 'liquidate' ? 'Liquidación' : selectedAction.type === 'return' ? 'Devolución' : 'Registro de Merma'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
