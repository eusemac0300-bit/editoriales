import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Printer, Plus, Search, Filter, Edit, Trash2, Calendar, FileText, CheckCircle, Clock, XCircle, DollarSign, Download, ChevronDown, ChevronRight, Upload, ExternalLink, List, LayoutGrid } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'

export default function Quotes() {
    const { data, addNewQuote, updateQuoteDetails, deleteExistingQuote, formatCurrency, addAuditLog, taxRate, t } = useAuth()
    const formatCLP = formatCurrency
    const [showAdd, setShowAdd] = useState(false)
    const [editingQuote, setEditingQuote] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [poModalQuote, setPoModalQuote] = useState(null)
    const [viewMode, setViewMode] = useState('list')

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
            default: return <Clock className="w-4 h-4 text-slate-400 dark:text-dark-400" />
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

    const handlePOGenerateClick = (quote) => {
        if (quote.approvedAmount) {
            let matchedPrice = quote.quotedAmount
            if (quote.approvedAmount === quote.requestedAmount2) matchedPrice = quote.quotedAmount2
            if (quote.approvedAmount === quote.requestedAmount3) matchedPrice = quote.quotedAmount3
            if (quote.approvedAmount === quote.requestedAmount4) matchedPrice = quote.quotedAmount4
            generatePOPDF(quote, quote.approvedAmount, matchedPrice)
            return
        }

        const tirajes = [
            { qty: quote.requestedAmount, price: quote.quotedAmount },
            { qty: quote.requestedAmount2, price: quote.quotedAmount2 },
            { qty: quote.requestedAmount3, price: quote.quotedAmount3 },
            { qty: quote.requestedAmount4, price: quote.quotedAmount4 }
        ].filter(v => v.qty && v.qty > 0)

        if (tirajes.length > 1) {
            setPoModalQuote({ ...quote, _tirajesObj: tirajes })
        } else {
            // Implicitly approve the only amount
            updateQuoteDetails(quote.id, { ...quote, approvedAmount: tirajes[0].qty }).then(() => {
                generatePOPDF(quote, tirajes[0].qty, tirajes[0].price)
            })
        }
    }

    const generatePOPDF = (quote, specificAmount = null, specificPrice = null) => {
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

        const quotesSorted = data?.quotes ? [...data.quotes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : []
        const quoteIndex = quotesSorted.findIndex(q => q.id === quote.id)
        const correlativeNum = String(quoteIndex >= 0 ? quoteIndex + 1 : 1).padStart(4, '0')
        const ocRef = `OC-${new Date(quote.createdAt || Date.now()).getFullYear()}-${correlativeNum}`

        // Fechas y Datos de Cabecera
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
        const currentDate = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
        doc.text(`Fecha: ${currentDate}`, 195, pageMargin + 16, { align: 'right' })
        doc.text(`OC REF: #${ocRef}`, 195, pageMargin + 21, { align: 'right' })

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
        if (specificAmount) {
            doc.text(`${specificAmount} unidades`, pageMargin + 40, finalY)
        } else {
            doc.text(tirajes.join(' / ') + ' unidades', pageMargin + 40, finalY)
        }

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
        const total = specificPrice || quote.quotedAmount || 0
        const taxVal = 1 + (taxRate / 100)
        const neto = Math.round(total / taxVal)
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

        doc.text(`${t('iva')} (${taxRate}%):`, pageMargin + 5, finalY + 26)
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
        doc.save(`${ocRef}_${safeProvider}_${safeTitle}.pdf`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-6 h-6 text-primary" />
                        Cotizaciones a Imprenta
                    </h1>
                    <p className="text-slate-600 dark:text-dark-700 text-sm mt-1">
                        Gestiona presupuestos y calcula los costos de impresión.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    {!showAdd && !editingQuote && (
                        <>
                            <div className="flex bg-slate-100 dark:bg-dark-300 p-1 rounded-lg mr-2">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-dark-400 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-dark-600'}`}
                                    title="Vista de Lista"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-dark-400 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-dark-600'}`}
                                    title="Vista de Cuadrícula"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Solicitar Cotización
                            </button>
                        </>
                    )}
                </div>
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
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-dark-500" />
                            <input
                                type="text"
                                placeholder="Buscar por título o proveedor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input-field pl-10 w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400 dark:text-dark-500" />
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

                    {/* Listado de cotizaciones */}
                    {filteredQuotes.length === 0 ? (
                        <div className="text-center py-20 bg-slate-100/50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300">
                            <Printer className="w-12 h-12 text-slate-300 dark:text-dark-500 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-500 dark:text-dark-500">No hay cotizaciones registradas con ese filtro.</p>
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredQuotes.map(quote => (
                                    <div key={quote.id} className="glass-card p-5 relative group border-l-4 border-l-primary/50">
                                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {quote.quoteDocument && (
                                                <a
                                                    href={quote.quoteDocument}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 bg-slate-100 dark:bg-dark-200 hover:bg-emerald-500/20 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                                                    title="Ver Cotización (Documento Adjunto)"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            {quote.status === 'Aprobada' && (
                                                <button
                                                    onClick={() => handlePOGenerateClick(quote)}
                                                    className="p-1.5 bg-slate-50 dark:bg-dark-200 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 transition-colors"
                                                    title="Generar Orden de Compra (OC)"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => generateQuotePDF(quote)}
                                                className="p-1.5 bg-slate-50 dark:bg-dark-200 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                                title="Descargar PDF de Solicitud"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingQuote(quote)}
                                                className="p-1.5 bg-slate-50 dark:bg-dark-200 hover:bg-slate-100 dark:bg-dark-300 rounded text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:text-white transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(quote)}
                                                className="p-1.5 bg-slate-100 dark:bg-dark-200 hover:bg-red-500/20 rounded text-red-500/70 hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-start justify-between pe-16">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">{quote.bookTitle}</h3>
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
                                                            <option value="Solicitada" className="bg-white dark:bg-dark-200 text-blue-400">Solicitada</option>
                                                            <option value="Presupuestada" className="bg-white dark:bg-dark-200 text-yellow-400">Presupuestada</option>
                                                            <option value="Aprobada" className="bg-white dark:bg-dark-200 text-green-400">Aprobada</option>
                                                            <option value="Rechazada" className="bg-white dark:bg-dark-200 text-red-400">Rechazada</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 tabular-nums transition-colors">ID: {quote.id}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-dark-300">
                                            <div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">Imprenta</p>
                                                <p className="text-xs text-slate-900 dark:text-white font-medium">{quote.provider}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                                                    {quote.approvedAmount ? 'Tiraje Aprobado' : 'Tirajes Propios'}
                                                </p>
                                                <p className="text-xs text-slate-900 dark:text-white font-mono">
                                                    {quote.approvedAmount
                                                        ? <span className="text-emerald-400 font-bold">{quote.approvedAmount} u.</span>
                                                        : `${[quote.requestedAmount, quote.requestedAmount2, quote.requestedAmount3, quote.requestedAmount4].filter(v => v && v > 0).join(', ')} u.`
                                                    }
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Costo de Producción</p>
                                                <div className="bg-slate-50 dark:bg-dark-200/50 p-2 rounded border border-slate-200 dark:border-dark-300 grid grid-cols-3 gap-2">
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-medium">{t('neto')}</p>
                                                        <p className="text-xs text-slate-900 dark:text-white font-mono">{quote.quotedAmount > 0 ? formatCLP(Math.round(quote.quotedAmount / (1 + taxRate / 100))) : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-medium">{t('iva')} ({taxRate}%)</p>
                                                        <p className="text-xs text-slate-900 dark:text-white font-mono">{quote.quotedAmount > 0 ? formatCLP(quote.quotedAmount - Math.round(quote.quotedAmount / (1 + taxRate / 100))) : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-primary-400 font-bold uppercase tracking-tight">Total</p>
                                                        <p className="text-xs text-primary-400 font-mono font-bold blur-[0.2px]">{quote.quotedAmount > 0 ? formatCLP(quote.quotedAmount) : 'Pte.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">Fecha Entrega</p>
                                                <p className="text-xs text-slate-900 dark:text-white font-medium">{quote.deliveryDate ? new Date(quote.deliveryDate).toLocaleDateString() : 'Pendiente'}</p>
                                            </div>
                                        </div>

                                        {/* Muestra rápida de detalles técnicos snapshots  */}
                                        <div className="mt-4 bg-slate-50 dark:bg-dark-200 rounded-lg p-3">
                                            <h4 className="text-[10px] text-slate-500 dark:text-slate-200 font-bold uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-dark-300 pb-1">Ficha Técnica Asociada</h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-300">
                                                <span><strong className="text-slate-500 dark:text-slate-400 font-semibold">Medida:</strong> {quote.bookWidth}x{quote.bookHeight}cm</span>
                                                <span><strong className="text-slate-500 dark:text-slate-400 font-semibold">Págs(B/N):</strong> {quote.bookPagesBw}</span>
                                                {quote.bookPagesColor > 0 && <span><strong className="text-slate-500 dark:text-slate-400 font-semibold">Págs(Color):</strong> {quote.bookPagesColor}</span>}
                                                <span><strong className="text-slate-500 dark:text-slate-400 font-semibold">Tap/Sol:</strong> {quote.bookCoverType} / {quote.bookFlaps}</span>
                                                <span><strong className="text-slate-500 dark:text-slate-400 font-semibold">Encuadernación:</strong> {quote.bindingType}</span>
                                                {quote.extraFinishes && <span className="w-full mt-1 text-primary-400"><strong className="text-slate-600 dark:text-slate-300 font-semibold">Terminaciones Ex:</strong> {quote.extraFinishes}</span>}
                                            </div>
                                        </div>

                                        {/* Action Footers */}
                                        {quote.status === 'Aprobada' && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-dark-300">
                                                <button
                                                    onClick={() => handlePOGenerateClick(quote)}
                                                    className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 font-medium px-4 py-2.5 rounded-lg transition-all duration-200 border border-emerald-500/30 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <FileText className="w-4 h-4" /> Generar Orden de Compra en PDF
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card overflow-hidden border border-slate-200 dark:border-dark-300">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-dark-200/50 border-b border-slate-200 dark:border-dark-300">
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500">Obra</th>
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500">Imprenta</th>
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500 text-center">Tiraje(s)</th>
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500">Precio Total</th>
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500">Estado</th>
                                                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-dark-500 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-dark-300">
                                            {filteredQuotes.map(quote => (
                                                <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-200/30 transition-colors group">
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{quote.bookTitle}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-0.5 font-mono">{quote.id.split('-')[0]}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                                                <Printer className="w-3 h-3 text-primary-400" />
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-600 dark:text-dark-600">{quote.provider}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-center">
                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${quote.approvedAmount ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-100 dark:bg-dark-300 text-slate-600 dark:text-dark-600'}`}>
                                                            {quote.approvedAmount ? `${quote.approvedAmount} u.` : `${quote.requestedAmount} u.`}
                                                        </span>
                                                        {(!quote.approvedAmount && (quote.requestedAmount2 || quote.requestedAmount3)) && (
                                                            <span className="text-[9px] text-slate-400 block mt-1">+ alt.</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold text-primary-400 font-mono">
                                                            {quote.quotedAmount > 0 ? formatCLP(quote.quotedAmount) : <span className="text-slate-300 dark:text-dark-200 italic font-normal">Pte.</span>}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="relative inline-block w-32">
                                                            <select
                                                                value={quote.status}
                                                                onChange={(e) => handleQuickStatusChange(quote, e.target.value)}
                                                                className={`${statusColors[quote.status]} w-full flex items-center gap-1 appearance-none pr-6 cursor-pointer outline-none font-bold hover:brightness-110 transition-all text-[10px] uppercase tracking-wider`}
                                                                style={{
                                                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                                    backgroundPosition: 'right 0.2rem center',
                                                                    backgroundRepeat: 'no-repeat',
                                                                    backgroundSize: '1.2em 1.2em'
                                                                }}
                                                            >
                                                                <option value="Solicitada" className="bg-white dark:bg-dark-200 text-blue-400">Solicitada</option>
                                                                <option value="Presupuestada" className="bg-white dark:bg-dark-200 text-yellow-400">Presupuestada</option>
                                                                <option value="Aprobada" className="bg-white dark:bg-dark-200 text-green-400">Aprobada</option>
                                                                <option value="Rechazada" className="bg-white dark:bg-dark-200 text-red-400">Rechazada</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {quote.quoteDocument && (
                                                                <a
                                                                    href={quote.quoteDocument}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-400 transition-colors"
                                                                    title="Ver Documento"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => generateQuotePDF(quote)}
                                                                className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
                                                                title="Solicitud PDF"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                            {quote.status === 'Aprobada' && (
                                                                <button
                                                                    onClick={() => handlePOGenerateClick(quote)}
                                                                    className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                                                                    title="Generar OC"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setEditingQuote(quote)}
                                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-dark-300 rounded-lg text-slate-500 dark:text-dark-500 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(quote)}
                                                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </>
            )}

            {/* Modal de Selección de Tiraje para Orden de Compra */}
            {poModalQuote && (
                <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
                    <div className="glass-card w-full max-w-sm p-6 slide-up border border-primary/30">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-dark-300 pb-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" /> Confirmar Tiraje Aprobado
                            </h3>
                            <button onClick={() => setPoModalQuote(null)} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-dark-400 mb-4 bg-slate-50 dark:bg-dark-200/50 p-3 rounded text-center">
                            Esta cotización posee varias opciones de tiraje propuestas por la imprenta. Selecciona la opción que estás aprobando para la Orden de Compra:
                        </p>
                        <div className="space-y-2">
                            {poModalQuote._tirajesObj?.map((tObj, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const cleanQuote = { ...poModalQuote }
                                        delete cleanQuote._tirajesObj
                                        updateQuoteDetails(poModalQuote.id, { ...cleanQuote, approvedAmount: tObj.qty }).then(() => {
                                            generatePOPDF(cleanQuote, tObj.qty, tObj.price)
                                            setPoModalQuote(null)
                                        })
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-dark-200 hover:bg-emerald-500/10 border border-slate-300 dark:border-dark-400 hover:border-emerald-500/50 transition-all flex justify-between items-center group"
                                >
                                    <div>
                                        <span className="text-slate-900 dark:text-white font-medium pl-1 text-sm">{tObj.qty} unidades</span>
                                        {tObj.price > 0 && <span className="block pl-1 text-xs text-emerald-400">Total CLP: {formatCLP(tObj.price)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-emerald-500 dark:text-emerald-400">Generar PDF</span>
                                        <Download className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
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
        quotedAmountStr2: formatMoneyStr(initialData?.quotedAmount2),
        quotedAmountStr3: formatMoneyStr(initialData?.quotedAmount3),
        quotedAmountStr4: formatMoneyStr(initialData?.quotedAmount4),
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
        const quotedAmountNum2 = parseInt(form.quotedAmountStr2?.toString().replace(/\D/g, ''), 10) || 0
        const quotedAmountNum3 = parseInt(form.quotedAmountStr3?.toString().replace(/\D/g, ''), 10) || 0
        const quotedAmountNum4 = parseInt(form.quotedAmountStr4?.toString().replace(/\D/g, ''), 10) || 0

        const quoteData = {
            ...form,
            quotedAmount: quotedAmountNum,
            quotedAmount2: quotedAmountNum2,
            quotedAmount3: quotedAmountNum3,
            quotedAmount4: quotedAmountNum4
        }

        delete quoteData.quotedAmountStr
        delete quoteData.quotedAmountStr2
        delete quoteData.quotedAmountStr3
        delete quoteData.quotedAmountStr4
        
        // Ensure empty dates are null for Postgres compatibility
        if (quoteData.deliveryDate === "") quoteData.deliveryDate = null;

        if (!initialData) {
            // New quote: snapshot the book data
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                {isNew ? 'Nueva Solicitud de Cotización a Imprenta' : 'Actualizar Cotización'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Book Selection (only writable on New) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 dark:border-dark-300 pb-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Libro a Cotizar</label>
                        {isNew ? (
                            <select
                                value={form.bookId}
                                onChange={e => setForm(p => ({ ...p, bookId: e.target.value }))}
                                className="input-field text-sm font-medium dark:bg-dark-300"
                                style={{ colorScheme: 'dark' }}
                                required
                            >
                                <option value="">Seleccione un título de la biblioteca...</option>
                                {books.map(b => <option key={b.id} value={b.id} className="bg-white dark:bg-dark-200 dark:bg-dark-200 text-slate-900 dark:text-white">{b.title} (ISBN: {b.isbn || 'N/A'})</option>)}
                            </select>
                        ) : (
                            <div className="input-field text-sm bg-slate-100 dark:bg-dark-300 opacity-70 cursor-not-allowed text-slate-900 dark:text-white">
                                {initialData.bookTitle}
                            </div>
                        )}
                        {isNew && <p className="text-[10px] text-primary-400 mt-1">Al guardar, se guardará una "fotografía" de los detalles físicos actuales del libro.</p>}
                    </div>

                    <div>
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Imprenta / Proveedor</label>
                        <select
                            value={form.provider}
                            onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                            className="input-field text-sm font-medium dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
                            required
                        >
                            <option value="">Seleccione una imprenta...</option>
                            {(data.suppliers || [])
                                .filter(s => s.type === 'IMPRENTA')
                                .map(s => (
                                    <option key={s.id} value={s.name} className="bg-white dark:bg-dark-200 text-slate-900 dark:text-white">
                                        {s.name}
                                    </option>
                                ))
                            }
                            {form.provider && !(data.suppliers || []).some(s => s.name === form.provider && s.type === 'IMPRENTA') && (
                                <option value={form.provider}>{form.provider} (Manual/Antiguo)</option>
                            )}
                        </select>
                        {(data.suppliers || []).filter(s => s.type === 'IMPRENTA').length === 0 && (
                            <p className="text-[10px] text-red-500 mt-1 italic">⚠️ Debes registrar imprentas primero en la sección de Proveedores.</p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Tiraje Principal</label>
                        <input
                            type="number"
                            min="1"
                            value={form.requestedAmount}
                            onChange={e => setForm(p => ({ ...p, requestedAmount: e.target.value }))}
                            className="input-field text-sm dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
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
                            <div className="space-y-4 mt-2 p-4 bg-slate-50 dark:bg-dark-200/50 rounded-lg border border-slate-200 dark:border-dark-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tiraje Alt. 1 (uds.)</label>
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
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Precio Tiraje Alt. 1 (Total CLP)</label>
                                        <input
                                            type="text"
                                            value={form.quotedAmountStr2}
                                            onChange={e => setForm(p => ({ ...p, quotedAmountStr2: e.target.value.replace(/\D/g, '') }))}
                                            className="input-field text-sm text-yellow-400 font-medium"
                                            placeholder="Ej: 800000"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tiraje Alt. 2 (uds.)</label>
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
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Precio Tiraje Alt. 2 (Total CLP)</label>
                                        <input
                                            type="text"
                                            value={form.quotedAmountStr3}
                                            onChange={e => setForm(p => ({ ...p, quotedAmountStr3: e.target.value.replace(/\D/g, '') }))}
                                            className="input-field text-sm text-yellow-400 font-medium"
                                            placeholder="Ej: 950000"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Tiraje Alt. 3 (uds.)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.requestedAmount4}
                                            onChange={e => setForm(p => ({ ...p, requestedAmount4: e.target.value }))}
                                            className="input-field text-sm"
                                            placeholder="Ej: 2000"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block">Precio Tiraje Alt. 3 (Total CLP)</label>
                                        <input
                                            type="text"
                                            value={form.quotedAmountStr4}
                                            onChange={e => setForm(p => ({ ...p, quotedAmountStr4: e.target.value.replace(/\D/g, '') }))}
                                            className="input-field text-sm text-yellow-400 font-medium"
                                            placeholder="Ej: 1200000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Tipo de Encuadernación</label>
                        <select
                            value={form.bindingType}
                            onChange={e => setForm(p => ({ ...p, bindingType: e.target.value }))}
                            className="input-field text-sm dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
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
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Otras Terminaciones Especiales</label>
                        <input
                            value={form.extraFinishes}
                            onChange={e => setForm(p => ({ ...p, extraFinishes: e.target.value }))}
                            className="input-field text-sm text-primary-300 dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
                            placeholder="Ej: Laca UV sectorizada, Cuño seco, Cinta marcapáginas..."
                        />
                    </div>
                </div>

                {/* Followup & Prices */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Estado de Cotización</label>
                        <select
                            value={form.status}
                            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                            className="input-field text-sm font-medium dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
                        >
                            <option value="Solicitada">Solicitada</option>
                            <option value="Presupuestada">Presupuestada</option>
                            <option value="Aprobada">Aprobada</option>
                            <option value="Rechazada">Rechazada</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-600 dark:text-dark-400 mb-1 block">Monto Cotizado (Total CLP)</label>
                        <div className="relative mb-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-dark-500"><DollarSign className="w-3 h-3" /></span>
                            <input
                                type="text"
                                value={form.quotedAmountStr}
                                onChange={e => setForm(p => ({ ...p, quotedAmountStr: e.target.value.replace(/\D/g, '') }))}
                                className="input-field pl-8 text-sm text-yellow-400 font-medium dark:bg-dark-300"
                                placeholder="0"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        {(() => {
                            const val = parseInt(form.quotedAmountStr.toString().replace(/\D/g, ''), 10) || 0
                            if (val > 0) {
                                const neto = Math.round(val / 1.19)
                                const iva = val - neto
                                return (
                                    <div className="flex items-center gap-3 text-[10px] bg-slate-50 dark:bg-dark-200/50 px-2 py-1.5 rounded border border-slate-200 dark:border-dark-300">
                                        <span className="text-slate-400 dark:text-dark-400">Neto: <span className="text-slate-900 dark:text-white font-mono">{formatMoneyStr(neto)}</span></span>
                                        <span className="text-slate-400 dark:text-dark-400">IVA: <span className="text-slate-900 dark:text-white font-mono">{formatMoneyStr(iva)}</span></span>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                    <div className="max-w-[220px]">
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> Fecha Prevista Entrega</label>
                        <input
                            type="date"
                            value={form.deliveryDate}
                            onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))}
                            className="input-field text-sm dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-xs text-slate-600 dark:text-dark-700 mb-1 block font-medium">Observaciones y Notas</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="input-field text-sm dark:bg-dark-300"
                            style={{ colorScheme: 'dark' }}
                            rows={3}
                            placeholder="Tiempos de entrega, retractilado individual, despacho a bodega..."
                        />
                    </div>
                </div>

                <div className="md:col-span-3 border-t border-slate-200 dark:border-dark-300 pt-4 pb-2">
                    <label className="text-xs text-slate-600 dark:text-dark-700 mb-2 block font-medium">Adjuntar Cotización Recibida (Opcional)</label>
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-dark-200 p-3 rounded-lg border border-slate-200 dark:border-dark-300">
                        {form.quoteDocument ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded relative text-emerald-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">Documento_Adjunto</p>
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

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">{isNew ? 'Guardar Cotización' : 'Actualizar Cotización'}</button>
                </div>
            </form>
        </div>
    )
}
