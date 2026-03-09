import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Printer, Plus, Search, Filter, Edit, Trash2, Calendar, FileText, CheckCircle, Clock, XCircle, DollarSign, Download, ChevronDown, ChevronRight, Upload, ExternalLink } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'

export default function Quotes() {
    const { data, addNewQuote, updateQuoteDetails, deleteExistingQuote, formatCLP, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingQuote, setEditingQuote] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')

    const quotesList = data.quotes || []

    const filteredQuotes = quotesList.filter(q => {
        const matchesSearch = q.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.provider?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'All' || q.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const handleSave = async (quoteData) => {
        if (editingQuote) {
            await updateQuoteDetails(editingQuote.id, quoteData)
            addAuditLog('Cotización actualizada', `Actualizada cotización ${editingQuote.id} de ${quoteData.bookTitle}`, 'ADMIN')
        } else {
            await addNewQuote(quoteData)
            addAuditLog('Cotización registrada', `Se registró la cotización de ${quoteData.bookTitle} a imprenta ${quoteData.provider}`, 'ADMIN')
        }
        setShowAdd(false)
        setEditingQuote(null)
    }

    const handleDelete = async (quote) => {
        if (window.confirm(`¿Estás seguro de eliminar la cotización a ${quote.provider} por "${quote.bookTitle}"?`)) {
            await deleteExistingQuote(quote.id)
            addAuditLog('Cotización eliminada', `Eliminada cotización de ${quote.bookTitle} (${quote.provider})`, 'ADMIN')
        }
    }

    const handleQuickStatusChange = async (quote, newStatus) => {
        if (quote.status === newStatus) return
        await updateQuoteDetails(quote.id, { ...quote, status: newStatus })
        addAuditLog('Estado de cotización actualizado', `Cotización de ${quote.bookTitle} cambió a ${newStatus}`, 'ADMIN')
    }

    const statusColors = {
        'Solicitada': 'bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full',
        'Presupuestada': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-0.5 rounded-full',
        'Aprobada': 'bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-2 py-0.5 rounded-full',
        'Rechazada': 'bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded-full'
    }

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'Solicitada': return <Clock className="w-4 h-4 text-blue-400" />
            case 'Presupuestada': return <FileText className="w-4 h-4 text-yellow-400" />
            case 'Aprobada': return <CheckCircle className="w-4 h-4 text-green-400" />
            case 'Rechazada': return <XCircle className="w-4 h-4 text-red-400" />
            default: return <Clock className="w-4 h-4 text-dark-400" />
        }
    }

    const generateQuotePDF = (quote) => {
        const doc = new jsPDF()

        // Variables de diseño
        const primaryColor = [44, 62, 80] // Slate dark
        const secondaryColor = [52, 152, 219] // Blue para detalles
        const textColor = [60, 60, 60]
        const lightGray = [150, 150, 150]
        const pageMargin = 15 // Margin reducido

        // Encabezado
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('SOLICITUD DE COTIZACIÓN', pageMargin, pageMargin + 5)

        // Línea separadora decorativa
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(pageMargin, pageMargin + 9, 195, pageMargin + 9)

        // Fechas y Datos de Cabecera
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        const currentDate = new Date(quote.createdAt).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        doc.text(`Fecha: ${currentDate}`, 195, pageMargin + 16, { align: 'right' })
        doc.text(`ID Ref: #${quote.id.substring(0, 8).toUpperCase()}`, 195, pageMargin + 21, { align: 'right' })

        // Cuerpo: Saludo formal
        doc.setFontSize(10)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(`Señores`, pageMargin, pageMargin + 26)
        doc.setFont('helvetica', 'bold')
        doc.text(`${quote.provider}`, pageMargin, pageMargin + 31)
        doc.text('Presente.', pageMargin, pageMargin + 36)

        doc.setFont('helvetica', 'normal')
        doc.text(`Junto con saludarles, tenemos el agrado de solicitar a ustedes la elaboración de un presupuesto para la impresión y encuadernación de nuestra obra titulada:`, pageMargin, pageMargin + 46, { maxWidth: 180, lineHeightFactor: 1.3 })

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.text(`"${quote.bookTitle || 'Obra Sin Título'}"`, pageMargin, pageMargin + 56)

        // Cantidades solicitadas
        const quantitiesList = [
            quote.requestedAmount,
            quote.requestedAmount2,
            quote.requestedAmount3,
            quote.requestedAmount4
        ].filter(v => v && v > 0)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(`Cantidades a cotizar:`, pageMargin, pageMargin + 64)

        doc.setFont('helvetica', 'bold')
        doc.text(`${quantitiesList.join(', ')} ejemplares.`, pageMargin + 35, pageMargin + 64)

        doc.setFont('helvetica', 'normal')
        doc.text(`A continuación, detallamos las especificaciones técnicas requeridas:`, pageMargin, pageMargin + 73)

        autoTable(doc, {
            startY: pageMargin + 77,
            head: [['Especificación Técnica', 'Detalle']],
            body: [
                ['Formato (Ancho x Alto)', `${quote.bookWidth || '-'} x ${quote.bookHeight || '-'} cm`],
                ['Páginas B/N interiores', quote.bookPagesBw || '0'],
                ['Páginas Color interiores', quote.bookPagesColor || '0'],
                ['Papel Interior', quote.bookInteriorPaper || ''],
                ['Tipo de Tapa', quote.bookCoverType || ''],
                ['Solapas', quote.bookFlaps === 'Con solapa' ? `Sí (Ancho: ${quote.bookFlapWidth || ''} cm)` : 'No o Sin solapas'],
                ['Papel Tapas', quote.bookCoverPaper || ''],
                ['Terminación de Tapas', quote.bookCoverFinish || ''],
                ['Tipo de Encuadernación', quote.bindingType || ''],
                ['Terminaciones Especiales', quote.extraFinishes || 'Ninguna']
            ],
            theme: 'plain',
            headStyles: {
                fillColor: [240, 244, 248],
                textColor: primaryColor,
                fontStyle: 'bold',
                lineWidth: { bottom: 0.5 },
                lineColor: secondaryColor
            },
            bodyStyles: {
                textColor: textColor,
                lineWidth: { bottom: 0.1 },
                lineColor: [220, 220, 220]
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },
            styles: { fontSize: 9, cellPadding: 2.5, font: 'helvetica' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 70 },
                1: { cellWidth: 100 }
            }
        })

        let finalY = doc.lastAutoTable.finalY + 8

        if (quote.notes) {
            if (finalY > 260) {
                doc.addPage()
                finalY = pageMargin
            }

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.text('Observaciones y Notas Adicionales:', pageMargin, finalY)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(textColor[0], textColor[1], textColor[2])
            const splitNotes = doc.splitTextToSize(quote.notes, 180)
            doc.text(splitNotes, pageMargin, finalY + 5, { lineHeightFactor: 1.3 })

            finalY = finalY + (splitNotes.length * 4) + 12
        }

        if (finalY > 270) {
            doc.addPage()
            finalY = pageMargin
        }

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`Quedamos a su disposición para resolver cualquier duda y a la espera de su propuesta comercial.`, pageMargin, finalY, { maxWidth: 180, lineHeightFactor: 1.3 })

        doc.text(`Atentamente,`, pageMargin, finalY + 12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Departamento de Producción Editorial`, pageMargin, finalY + 18)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        doc.text(`${window.location.hostname}`, pageMargin, finalY + 23)

        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(8)
            doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
            doc.text(`Página ${i} de ${pageCount}`, 195, 285, { align: 'right' })
        }

        const safeTitle = (quote.bookTitle || 'Libro').replace(/\s+/g, '_')
        const safeProvider = (quote.provider || 'Imprenta').replace(/\s+/g, '_')
        doc.save(`Sol_Cotizacion_${safeTitle}_${safeProvider}.pdf`)
    }

    const generatePOPDF = (quote) => {
        const doc = new jsPDF()

        // Variables de diseño
        const primaryColor = [39, 174, 96] // Emerald green
        const secondaryColor = [46, 204, 113]
        const textColor = [60, 60, 60]
        const lightGray = [150, 150, 150]
        const pageMargin = 15

        // Encabezado
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('ORDEN DE COMPRA', pageMargin, pageMargin + 5)

        // Línea separadora decorativa
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(pageMargin, pageMargin + 9, 195, pageMargin + 9)

        // Fechas y Datos de Cabecera
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        const currentDate = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
        doc.text(`Fecha: ${currentDate}`, 195, pageMargin + 16, { align: 'right' })
        doc.text(`OC REF: #OC-${quote.id.substring(0, 8).toUpperCase()}`, 195, pageMargin + 21, { align: 'right' })

        // Proveedor
        doc.setFontSize(10)
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(`Proveedor:`, pageMargin, pageMargin + 26)
        doc.setFont('helvetica', 'bold')
        doc.text(`${quote.provider}`, pageMargin, pageMargin + 31)

        doc.setFont('helvetica', 'normal')
        doc.text(`Por medio del presente documento emitimos la orden de compra respectiva a la cotización aprobada para la obra:`, pageMargin, pageMargin + 46, { maxWidth: 180, lineHeightFactor: 1.3 })

        // Ficha
        let finalY = pageMargin + 60
        doc.setFontSize(10)

        doc.setFont('helvetica', 'bold')
        doc.text('Obra a Imprimir:', pageMargin, finalY)
        doc.setFont('helvetica', 'normal')
        doc.text(quote.bookTitle || 'No especificado', pageMargin + 40, finalY)

        const tirajes = [quote.requestedAmount, quote.requestedAmount2, quote.requestedAmount3, quote.requestedAmount4].filter(v => v && v > 0)
        finalY += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Tiraje(s) Acordado(s):', pageMargin, finalY)
        doc.setFont('helvetica', 'normal')
        doc.text(tirajes.join(' / ') + ' unidades', pageMargin + 40, finalY)

        finalY += 8
        doc.setFont('helvetica', 'bold')
        doc.text('Encuadernación:', pageMargin, finalY)
        doc.setFont('helvetica', 'normal')
        doc.text(quote.bindingType || 'No especificado', pageMargin + 40, finalY)

        if (quote.deliveryDate) {
            finalY += 8
            doc.setFont('helvetica', 'bold')
            doc.text('Entrega Esperada:', pageMargin, finalY)
            doc.setFont('helvetica', 'normal')
            doc.text(new Date(quote.deliveryDate).toLocaleDateString(), pageMargin + 40, finalY)
        }

        // Tabla de Valores
        finalY += 20
        const total = quote.quotedAmount || 0
        const neto = Math.round(total / 1.19)
        const iva = total - neto

        doc.setFillColor(245, 245, 245)
        doc.rect(pageMargin, finalY, 180, 42, 'F')
        doc.setDrawColor(200, 200, 200)
        doc.rect(pageMargin, finalY, 180, 42)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Detalle de Valores', pageMargin + 5, finalY + 8)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Valor Neto:', pageMargin + 5, finalY + 18)
        doc.text(formatCLP(neto), pageMargin + 175, finalY + 18, { align: 'right' })

        doc.text('IVA (19%):', pageMargin + 5, finalY + 26)
        doc.text(formatCLP(iva), pageMargin + 175, finalY + 26, { align: 'right' })

        doc.setFont('helvetica', 'bold')
        doc.text('Total a Pagar:', pageMargin + 5, finalY + 36)
        doc.text(formatCLP(total), pageMargin + 175, finalY + 36, { align: 'right' })

        // Footer
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.text('Documento generado digitalmente. Esta Orden de Compra está sujeta a los términos y condiciones de la editorial.', pageMargin, 280)

        const safeTitle = (quote.bookTitle || 'Libro').replace(/\s+/g, '_')
        const safeProvider = (quote.provider || 'Imprenta').replace(/\s+/g, '_')
        doc.save(`OC_${safeProvider}_${safeTitle}.pdf`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Printer className="w-6 h-6 text-primary" />
                        Cotizaciones a Imprenta
                    </h1>
                    <p className="text-dark-500 text-sm mt-1">
                        Gestiona presupuestos y calcula los costos de impresión.
                    </p>
                </div>
                {!showAdd && !editingQuote && (
                    <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Solicitar Cotización
                    </button>
                )}
            </div>

            {/* Formulario */}
            {(showAdd || editingQuote) && (
                <QuoteForm
                    data={data}
                    initialData={editingQuote}
                    onSave={handleSave}
                    onClose={() => { setShowAdd(false); setEditingQuote(null) }}
                />
            )}

            {/* Listado */}
            {!showAdd && !editingQuote && (
                <>
                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                            <input
                                type="text"
                                placeholder="Buscar por título o proveedor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input-field pl-10 w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-dark-500" />
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="input-field w-full sm:w-auto"
                            >
                                <option value="All">Todos los estados</option>
                                <option value="Solicitada">Solicitada</option>
                                <option value="Presupuestada">Presupuestada</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Rechazada">Rechazada</option>
                            </select>
                        </div>
                    </div>

                    {/* Tarjetas de cotizaciones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredQuotes.length === 0 ? (
                            <div className="col-span-full text-center py-10 bg-dark-200/50 rounded-xl border border-dark-300">
                                <Printer className="w-12 h-12 text-dark-500 mx-auto mb-3 opacity-50" />
                                <p className="text-dark-500">No hay cotizaciones registradas con ese filtro.</p>
                            </div>
                        ) : (
                            filteredQuotes.map(quote => (
                                <div key={quote.id} className="glass-card p-5 relative group border-l-4 border-l-primary/50">
                                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {quote.quoteDocument && (
                                            <a
                                                href={quote.quoteDocument}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 bg-dark-200 hover:bg-emerald-500/20 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                                                title="Ver Cotización (Documento Adjunto)"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                        {quote.status === 'Aprobada' && (
                                            <button
                                                onClick={() => generatePOPDF(quote)}
                                                className="p-1.5 bg-dark-200 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 transition-colors"
                                                title="Generar Orden de Compra (OC)"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => generateQuotePDF(quote)}
                                            className="p-1.5 bg-dark-200 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Descargar PDF de Solicitud"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingQuote(quote)}
                                            className="p-1.5 bg-dark-200 hover:bg-dark-300 rounded text-dark-500 hover:text-white transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quote)}
                                            className="p-1.5 bg-dark-200 hover:bg-red-500/20 rounded text-red-500/70 hover:text-red-400 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-start justify-between pe-16">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-medium text-white">{quote.bookTitle}</h3>
                                                <div className="relative inline-block">
                                                    <select
                                                        value={quote.status}
                                                        onChange={(e) => handleQuickStatusChange(quote, e.target.value)}
                                                        className={`${statusColors[quote.status]} flex items-center gap-1 appearance-none pr-6 cursor-pointer outline-none font-medium hover:brightness-110 transition-all`}
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                            backgroundPosition: 'right 0.2rem center',
                                                            backgroundRepeat: 'no-repeat',
                                                            backgroundSize: '1.2em 1.2em'
                                                        }}
                                                    >
                                                        <option value="Solicitada" className="bg-dark-200 text-blue-400">Solicitada</option>
                                                        <option value="Presupuestada" className="bg-dark-200 text-yellow-400">Presupuestada</option>
                                                        <option value="Aprobada" className="bg-dark-200 text-green-400">Aprobada</option>
                                                        <option value="Rechazada" className="bg-dark-200 text-red-400">Rechazada</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <p className="text-sm text-dark-500 mt-1 tabular-nums">ID: {quote.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-300">
                                        <div>
                                            <p className="text-[10px] text-dark-500 uppercase">Imprenta</p>
                                            <p className="text-xs text-white font-medium">{quote.provider}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-dark-500 uppercase">Tirajes</p>
                                            <p className="text-xs text-white font-mono">
                                                {[quote.requestedAmount, quote.requestedAmount2, quote.requestedAmount3, quote.requestedAmount4]
                                                    .filter(v => v && v > 0).join(', ')} u.
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-dark-500 uppercase mb-1">Costo de Producción</p>
                                            <div className="bg-dark-200/50 p-2 rounded border border-dark-300 grid grid-cols-3 gap-2">
                                                <div>
                                                    <p className="text-[9px] text-dark-500">Neto</p>
                                                    <p className="text-xs text-white font-mono">{quote.quotedAmount > 0 ? formatCLP(Math.round(quote.quotedAmount / 1.19)) : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-dark-500">IVA (19%)</p>
                                                    <p className="text-xs text-white font-mono">{quote.quotedAmount > 0 ? formatCLP(quote.quotedAmount - Math.round(quote.quotedAmount / 1.19)) : '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-primary-400 font-semibold">Total</p>
                                                    <p className="text-xs text-primary-300 font-mono font-bold">{quote.quotedAmount > 0 ? formatCLP(quote.quotedAmount) : 'Pte.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-dark-500 uppercase">Fecha Entrega</p>
                                            <p className="text-xs text-white">{quote.deliveryDate ? new Date(quote.deliveryDate).toLocaleDateString() : 'Pendiente'}</p>
                                        </div>
                                    </div>

                                    {/* Muestra rápida de detalles técnicos snapshots  */}
                                    <div className="mt-4 bg-dark-200 rounded-lg p-3">
                                        <h4 className="text-[10px] text-dark-500 uppercase mb-2 border-b border-dark-300 pb-1">Ficha Técnica Asociada</h4>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-dark-400">
                                            <span><strong className="text-dark-500">Medida:</strong> {quote.bookWidth}x{quote.bookHeight}cm</span>
                                            <span><strong className="text-dark-500">Págs(B/N):</strong> {quote.bookPagesBw}</span>
                                            {quote.bookPagesColor > 0 && <span><strong className="text-dark-500">Págs(Color):</strong> {quote.bookPagesColor}</span>}
                                            <span><strong className="text-dark-500">Tap/Sol:</strong> {quote.bookCoverType} / {quote.bookFlaps}</span>
                                            <span><strong className="text-dark-500">Encuadernación:</strong> {quote.bindingType}</span>
                                            {quote.extraFinishes && <span className="w-full mt-1 text-primary-400"><strong className="text-dark-500">Terminaciones Ex:</strong> {quote.extraFinishes}</span>}
                                        </div>
                                    </div>

                                    {/* Action Footers */}
                                    {quote.status === 'Aprobada' && (
                                        <div className="mt-4 pt-4 border-t border-dark-300">
                                            <button
                                                onClick={() => generatePOPDF(quote)}
                                                className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-medium px-4 py-2.5 rounded-lg transition-all duration-200 border border-emerald-500/30 flex items-center justify-center gap-2 text-sm"
                                            >
                                                <FileText className="w-4 h-4" /> Generar Orden de Compra en PDF
                                            </button>
                                        </div>
                                    )}

                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

function QuoteForm({ data, initialData, onSave, onClose }) {
    const { user } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const formatMoneyStr = (val) => val === 0 || !val ? '' : new Intl.NumberFormat('es-CL').format(val)

    const [showAltAmounts, setShowAltAmounts] = useState(
        (initialData?.requestedAmount2 || initialData?.requestedAmount3 || initialData?.requestedAmount4) ? true : false
    )

    const [form, setForm] = useState({
        bookId: initialData?.bookId || '',
        provider: initialData?.provider || '',
        requestedAmount: initialData?.requestedAmount || '',
        requestedAmount2: initialData?.requestedAmount2 || '',
        requestedAmount3: initialData?.requestedAmount3 || '',
        requestedAmount4: initialData?.requestedAmount4 || '',
        bindingType: initialData?.bindingType || 'Rústica Fresada PUR',
        extraFinishes: initialData?.extraFinishes || '',
        status: initialData?.status || 'Solicitada',
        quotedAmountStr: formatMoneyStr(initialData?.quotedAmount),
        deliveryDate: initialData?.deliveryDate || '',
        notes: initialData?.notes || '',
        quoteDocument: initialData?.quoteDocument || ''
    })

    const books = data.books || []

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) return alert('El documento excede los 10MB.')

        setIsUploading(true)
        try {
            const fileName = `${user?.tenantId || 'general'}/quotes/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const { error: uploadErr } = await supabase.storage.from('editorial_documents').upload(fileName, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage.from('editorial_documents').getPublicUrl(fileName)
            setForm(p => ({ ...p, quoteDocument: publicUrlData.publicUrl }))
        } catch (err) {
            console.error(err)
            alert('Error al subir el documento. Revisa tu conexión.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const selectedBook = books.find(b => b.id === form.bookId)
        if (!selectedBook && !initialData) {
            alert('Debe seleccionar un libro para solicitar una cotización.')
            return
        }

        const quotedAmountNum = parseInt(form.quotedAmountStr.toString().replace(/\D/g, ''), 10) || 0

        const quoteData = {
            ...form,
            quotedAmount: quotedAmountNum
        }

        delete quoteData.quotedAmountStr

        if (!initialData) {
            // New quote: snapshot the book data
            quoteData.id = `q${Date.now()}`
            quoteData.createdAt = new Date().toISOString()
            quoteData.updatedAt = quoteData.createdAt

            if (selectedBook) {
                quoteData.bookTitle = selectedBook.title
                quoteData.bookWidth = selectedBook.width
                quoteData.bookHeight = selectedBook.height
                quoteData.bookPagesBw = selectedBook.pages
                quoteData.bookPagesColor = selectedBook.pagesColor
                quoteData.bookCoverType = selectedBook.coverType
                quoteData.bookFlaps = selectedBook.flaps
                quoteData.bookFlapWidth = selectedBook.flapWidth
                quoteData.bookInteriorPaper = selectedBook.interiorPaper
                quoteData.bookCoverPaper = selectedBook.coverPaper
                quoteData.bookCoverFinish = selectedBook.coverFinish
            }
        }

        await onSave(quoteData)
    }

    const isNew = !initialData

    return (
        <div className="glass-card p-5 slide-up border border-primary/30">
            <h3 className="text-sm font-semibold text-white mb-4">
                {isNew ? 'Nueva Solicitud de Cotización a Imprenta' : 'Actualizar Cotización'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Book Selection (only writable on New) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dark-300 pb-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-dark-600 mb-1 block">Libro a Cotizar</label>
                        {isNew ? (
                            <select
                                value={form.bookId}
                                onChange={e => setForm(p => ({ ...p, bookId: e.target.value }))}
                                className="input-field text-sm font-medium"
                                required
                            >
                                <option value="">Seleccione un título de la biblioteca...</option>
                                {books.map(b => <option key={b.id} value={b.id}>{b.title} (ISBN: {b.isbn || 'N/A'})</option>)}
                            </select>
                        ) : (
                            <div className="input-field text-sm bg-dark-300 opacity-70 cursor-not-allowed text-white">
                                {initialData.bookTitle}
                            </div>
                        )}
                        {isNew && <p className="text-[10px] text-primary-400 mt-1">Al guardar, se guardará una "fotografía" de los detalles físicos actuales del libro.</p>}
                    </div>

                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Imprenta / Proveedor</label>
                        <input
                            value={form.provider}
                            onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                            className="input-field text-sm"
                            placeholder="Ej: Salesianos, Gráfica Andes..."
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Tiraje Principal</label>
                        <input
                            type="number"
                            min="1"
                            value={form.requestedAmount}
                            onChange={e => setForm(p => ({ ...p, requestedAmount: e.target.value }))}
                            className="input-field text-sm"
                            placeholder="Ej: 500"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="button"
                            onClick={() => setShowAltAmounts(!showAltAmounts)}
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors py-2"
                        >
                            {showAltAmounts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            Opciones de Tiraje Alternativas
                        </button>

                        {showAltAmounts && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-3 bg-dark-200/50 rounded-lg border border-dark-300">
                                <div>
                                    <label className="text-xs text-dark-600 mb-1 block">Tiraje Alt. 1</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.requestedAmount2}
                                        onChange={e => setForm(p => ({ ...p, requestedAmount2: e.target.value }))}
                                        className="input-field text-sm"
                                        placeholder="Ej: 1000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dark-600 mb-1 block">Tiraje Alt. 2</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.requestedAmount3}
                                        onChange={e => setForm(p => ({ ...p, requestedAmount3: e.target.value }))}
                                        className="input-field text-sm"
                                        placeholder="Ej: 1500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dark-600 mb-1 block">Tiraje Alt. 3</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.requestedAmount4}
                                        onChange={e => setForm(p => ({ ...p, requestedAmount4: e.target.value }))}
                                        className="input-field text-sm"
                                        placeholder="Ej: 2000"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-xs text-dark-600 mb-1 block">Tipo de Encuadernación</label>
                        <select
                            value={form.bindingType}
                            onChange={e => setForm(p => ({ ...p, bindingType: e.target.value }))}
                            className="input-field text-sm"
                        >
                            <option value="Rústica Fresada PUR">Rústica Fresada PUR</option>
                            <option value="Rústica Cosida">Rústica Cosida</option>
                            <option value="Tapa Dura Cosida">Tapa Dura Cosida</option>
                            <option value="Corcheteado">Corcheteado al Lomo</option>
                            <option value="Anillado">Anillado/Espiral</option>
                            <option value="Otro">Otro (Especificar en notas)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Otras Terminaciones Especiales</label>
                        <input
                            value={form.extraFinishes}
                            onChange={e => setForm(p => ({ ...p, extraFinishes: e.target.value }))}
                            className="input-field text-sm text-primary-300"
                            placeholder="Ej: Laca UV sectorizada, Cuño seco, Cinta marcapáginas..."
                        />
                    </div>
                </div>

                {/* Followup & Prices */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Estado de Cotización</label>
                        <select
                            value={form.status}
                            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                            className="input-field text-sm font-medium"
                        >
                            <option value="Solicitada">Solicitada</option>
                            <option value="Presupuestada">Presupuestada</option>
                            <option value="Aprobada">Aprobada</option>
                            <option value="Rechazada">Rechazada</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block">Monto Cotizado (Total CLP)</label>
                        <div className="relative mb-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-500"><DollarSign className="w-3 h-3" /></span>
                            <input
                                type="text"
                                value={form.quotedAmountStr}
                                onChange={e => setForm(p => ({ ...p, quotedAmountStr: e.target.value.replace(/\D/g, '') }))}
                                className="input-field pl-8 text-sm text-yellow-400 font-medium"
                                placeholder="0"
                            />
                        </div>
                        {(() => {
                            const val = parseInt(form.quotedAmountStr.toString().replace(/\D/g, ''), 10) || 0
                            if (val > 0) {
                                const neto = Math.round(val / 1.19)
                                const iva = val - neto
                                return (
                                    <div className="flex items-center gap-3 text-[10px] bg-dark-200/50 px-2 py-1.5 rounded border border-dark-300">
                                        <span className="text-dark-400">Neto: <span className="text-white font-mono">{formatMoneyStr(neto)}</span></span>
                                        <span className="text-dark-400">IVA: <span className="text-white font-mono">{formatMoneyStr(iva)}</span></span>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                    <div>
                        <label className="text-xs text-dark-600 mb-1 block flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha Prevista Entrega</label>
                        <input
                            type="date"
                            value={form.deliveryDate}
                            onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))}
                            className="input-field text-sm"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-dark-600 mb-1 block">Observaciones y Notas</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="input-field text-sm"
                            rows={3}
                            placeholder="Tiempos de entrega, retractilado individual, despacho a bodega..."
                        />
                    </div>
                </div>

                <div className="md:col-span-3 border-t border-dark-300 pt-4 pb-2">
                    <label className="text-xs text-dark-600 mb-2 block">Adjuntar Cotización Recibida (Opcional)</label>
                    <div className="flex items-center gap-4 bg-dark-200 p-3 rounded-lg border border-dark-300">
                        {form.quoteDocument ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded relative text-emerald-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">Documento_Adjunto</p>
                                    <a href={form.quoteDocument} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-400 hover:underline">Ver Documento</a>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, quoteDocument: '' }))} className="text-[10px] text-red-400 hover:underline ml-3">Eliminar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 w-full">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                                    className="hidden"
                                    id="quote-upload"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="quote-upload"
                                    className={`btn-secondary text-xs inline-flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                                >
                                    <Upload className="w-4 h-4" />
                                    {isUploading ? 'Subiendo documento...' : 'Subir Archivo (.pdf, .jpg, .png)'}
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-dark-300">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">{isNew ? 'Guardar Cotización' : 'Actualizar Cotización'}</button>
                </div>
            </form>
        </div>
    )
}
