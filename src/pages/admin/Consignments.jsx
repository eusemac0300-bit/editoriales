import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
    Truck, Plus, Search, Building2, BookOpen, Clock, AlertTriangle, ArrowRightLeft,
    DollarSign, XCircle, CheckCircle, Package
} from 'lucide-react'

export default function Consignments() {
    const { data, formatCLP, addAuditLog, reloadData } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAction, setSelectedAction] = useState(null) // { type: 'liquidate' | 'return', item }

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

    const handleGenerate = async (e) => {
        e.preventDefault()
        const fd = new FormData(e.target)
        const bookId = fd.get('bookId')
        const qty = parseInt(fd.get('quantity'), 10)
        const clientName = fd.get('clientName')

        if (!bookId || !qty || !clientName) return alert('Completa los campos obligatorios.')

        const book = books.find(b => b.id === bookId)
        const inv = inventory.find(i => i.bookId === bookId)
        if (!inv || inv.stock < qty) return alert(`Stock insuficiente. Disponible: ${inv?.stock || 0}`)

        try {
            const newConsignment = {
                id: `cons-${Date.now()}`,
                tenant_id: data.users[0]?.tenantId || 't1',
                book_id: bookId,
                client_name: clientName,
                contact_info: fd.get('contactInfo') || '',
                sent_date: new Date().toISOString().slice(0, 10),
                sent_quantity: qty,
                sold_quantity: 0,
                returned_quantity: 0,
                status: 'activa',
                notes: fd.get('notes') || ''
            }

            // Insert consignment
            const { error: cErr } = await supabase.from('consignments').insert(newConsignment)
            if (cErr) throw cErr

            // Deduct stock
            const newStock = inv.stock - qty
            const newExits = [...(inv.exits || []), {
                date: new Date().toISOString().slice(0, 10),
                qty,
                ref: `Consignación a ${clientName} (${newConsignment.id})`
            }]
            const { error: iErr } = await supabase.from('inventory_physical')
                .update({ stock: newStock, exits: newExits })
                .eq('id', inv.id)
            if (iErr) throw iErr

            await addAuditLog(`Registró consignación: ${qty} u. de "${book.title}" a ${clientName}. Nuevo stock: ${newStock}`, 'ventas')
            await reloadData()
            setShowAdd(false)
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

                // 1. Generate Sale (no stock deduction because it was already deducted when consigned)
                const saleId = `sale-${Date.now()}`
                const { error: sErr } = await supabase.from('sales').insert({
                    id: saleId,
                    tenant_id: data.users[0]?.tenantId || 't1',
                    book_id: item.bookId,
                    channel: 'Consignación',
                    type: 'B2B (Empresa / Librería)',
                    client_name: item.clientName,
                    document_ref: docRef,
                    sale_date: new Date().toISOString().slice(0, 10),
                    quantity: qty,
                    unit_price: price,
                    total_amount: qty * price,
                    notes: `Liquidación de consignación ${item.id}`,
                    status: 'Completada'
                })
                if (sErr) throw sErr

                // 2. Update consignment
                const newSold = item.soldQuantity + qty
                const isClosed = (newSold + item.returnedQuantity) >= item.sentQuantity
                const { error: cErr } = await supabase.from('consignments')
                    .update({
                        sold_quantity: newSold,
                        status: isClosed ? 'cerrada' : 'activa'
                    }).eq('id', item.id)
                if (cErr) throw cErr

                await addAuditLog(`Liquidó venta por consignación: ${qty} u. de "${item.bookTitle}" (${item.clientName}) por ${formatCLP(qty * price)}`, 'ventas')
            }

            await reloadData()
            setSelectedAction(null)
        } catch (err) {
            alert('Error en el proceso: ' + err.message)
        }
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Truck className="w-6 h-6 text-primary" /> Gestión de Consignaciones
                    </h1>
                    <p className="text-sm text-dark-500 mt-1">
                        Despacho de stock, tracking de pendientes, liquidaciones y devoluciones.
                    </p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
                    <Plus className="w-4 h-4" /> Despachar Libros
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por libro o cliente..."
                    className="input-field pl-9 text-sm w-full"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Building2 className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-1">Sin consignaciones</h3>
                    <p className="text-sm text-dark-500">Haz clic en "Despachar Libros" para enviar ejemplares a librerías.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(item => {
                        const pending = item.sentQuantity - item.soldQuantity - item.returnedQuantity
                        const isActive = item.status === 'activa' && pending > 0
                        return (
                            <div key={item.id} className="glass-card p-5 relative overflow-hidden flex flex-col">
                                {isActive ? (
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-primary" />
                                ) : (
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-dark-400" />
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> {item.clientName}
                                        </p>
                                        <h3 className="text-base font-bold text-white">{item.bookTitle}</h3>
                                        <p className="text-xs text-dark-400 mt-0.5 px-0">Fecha despacho: {new Date(item.sentDate).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary/20 text-primary-300 border border-primary/30' : 'bg-dark-300 text-dark-500'}`}>
                                        {isActive ? 'ACTIVA' : 'CERRADA'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-5">
                                    <div className="bg-dark-100/50 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-dark-500 uppercase">Enviados</p>
                                        <p className="text-lg font-mono text-white mt-1">{item.sentQuantity}</p>
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-emerald-500/70 uppercase">Vendidos</p>
                                        <p className="text-lg font-mono text-emerald-400 mt-1">{item.soldQuantity}</p>
                                    </div>
                                    <div className="bg-orange-500/10 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-orange-500/70 uppercase">Devueltos</p>
                                        <p className="text-lg font-mono text-orange-400 mt-1">{item.returnedQuantity}</p>
                                    </div>
                                    <div className={`rounded-lg p-2 text-center ${pending > 0 ? 'bg-primary/20' : 'bg-dark-200'}`}>
                                        <p className="text-[10px] text-primary-300 uppercase">En Local</p>
                                        <p className="text-lg font-bold font-mono text-white mt-1">{pending}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-2">
                                    {isActive ? (
                                        <>
                                            <button onClick={() => setSelectedAction({ type: 'liquidate', item })} className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-2">
                                                <DollarSign className="w-3 h-3" /> Liquidar Venta
                                            </button>
                                            <button onClick={() => setSelectedAction({ type: 'return', item })} className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-2 text-orange-400 hover:text-orange-300 border-orange-500/20">
                                                <ArrowRightLeft className="w-3 h-3" /> Devolución
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-xs text-dark-500 italic w-full text-center">Consignación concluida (no hay stock pendiente)</p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal de Despacho */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-dark-100 rounded-2xl w-full max-w-lg border border-dark-300 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" /> Crear Despacho
                            </h2>
                            <button onClick={() => setShowAdd(false)} className="text-dark-500 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Librería / Cliente</label>
                                <input name="clientName" required type="text" className="input-field w-full" placeholder="Ej. Librería Antártica" />
                            </div>
                            <div>
                                <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Título a consignar</label>
                                <select name="bookId" required className="input-field w-full">
                                    <option value="">Selecciona un título...</option>
                                    {books.map(b => (
                                        <option key={b.id} value={b.id}>{b.title} (Stock: {inventory.find(i => i.bookId === b.id)?.stock || 0})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Cantidad de Ejemplares</label>
                                    <input name="quantity" required type="number" min="1" className="input-field w-full" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Datos de Contacto (Opcional)</label>
                                    <input name="contactInfo" type="text" className="input-field w-full" placeholder="Email o teléfono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Notas del despacho</label>
                                <textarea name="notes" rows="2" className="input-field w-full" placeholder="Número de guía, observaciones, etc." />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-dark-300">
                                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Registrar y Descontar Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Acción (Liquidar / Devolver) */}
            {selectedAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-dark-100 rounded-2xl w-full max-w-sm border border-dark-300 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                {selectedAction.type === 'liquidate' ? (
                                    <><DollarSign className="w-5 h-5 text-emerald-400" /> Liquidar Venta</>
                                ) : (
                                    <><ArrowRightLeft className="w-5 h-5 text-orange-400" /> Registrar Devolución</>
                                )}
                            </h2>
                            <button onClick={() => setSelectedAction(null)} className="text-dark-500 hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-dark-200/50 p-3 rounded-lg mb-4 text-sm">
                            <p className="text-white font-medium">{selectedAction.item.bookTitle}</p>
                            <p className="text-dark-400 text-xs mt-1">Librería: {selectedAction.item.clientName}</p>
                            <p className="text-primary-300 text-xs mt-1 font-mono">Stock en local: {selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity} u.</p>
                        </div>

                        <form onSubmit={processAction} className="space-y-4">
                            <div>
                                <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Cantidad de Ejemplares</label>
                                <input
                                    name="quantity"
                                    required
                                    type="number"
                                    min="1"
                                    max={selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity}
                                    defaultValue={selectedAction.item.sentQuantity - selectedAction.item.soldQuantity - selectedAction.item.returnedQuantity}
                                    className="input-field w-full text-lg font-mono font-bold"
                                />
                            </div>

                            {selectedAction.type === 'liquidate' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">PVP Unitario Pactado</label>
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
                                        <label className="block text-xs text-dark-500 uppercase tracking-wide mb-1">Doc. Ref. (Factura/Boleta)</label>
                                        <input name="documentRef" type="text" className="input-field w-full" placeholder="Nro Boleta..." />
                                    </div>
                                </>
                            )}

                            <div className="pt-2">
                                <button type="submit" className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg text-sm ${selectedAction.type === 'liquidate'
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 shadow-orange-500/20'
                                    }`}>
                                    Confirmar {selectedAction.type === 'liquidate' ? 'Liquidación' : 'Devolución'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
