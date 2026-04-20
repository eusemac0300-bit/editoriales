import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Calendar, Percent, DollarSign, User, Search, Filter, Edit, Trash2, Image as ImageIcon, Upload, Kanban, QrCode, Download, X, Calculator, Save, Package, Share2, Instagram, Facebook } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import EscandalloModal from '../../components/EscandalloModal'
import BookForm from '../../components/BookForm'

const STAGES = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
const stageColors = {
    'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
    'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
}

export default function Books() {
    const navigate = useNavigate()
    const { user, data, addNewBook, updateBookDetails, deleteExistingBook, formatCLP, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingBook, setEditingBook] = useState(null)
    const [showCodes, setShowCodes] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')
    const [showEscandallo, setShowEscandallo] = useState(null)

    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
    }

    const statuses = ['All', ...Object.keys(statusColors)]

    const handleDelete = async (book) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el título "${book.title}"? Esta acción no se puede deshacer.`)) {
            await deleteExistingBook(book.id)
            addAuditLog(`Eliminó el título: '${book.title}'`, 'general')
        }
    }

    const filteredBooks = data.books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.authorName && book.authorName.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesStatus = filterStatus === 'All' || book.status === filterStatus
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />Registro de Títulos
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">{filteredBooks.length} títulos en catálogo</p>
                </div>
                <button onClick={() => { setEditingBook(null); setShowAdd(!showAdd) }} className="btn-primary text-sm h-10">
                    <Plus className="w-4 h-4 inline mr-1" /> Nuevo Título
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dark-500" />
                    <input
                        type="text"
                        placeholder="Buscar por título o autor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-9 h-10 py-0 text-sm w-full"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-400 dark:text-dark-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-field h-10 py-0 text-sm"
                    >
                        {statuses.map(s => (
                            <option key={s} value={s}>{s === 'All' ? 'Todos los Estados' : s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Form Modal */}
            {(showAdd || editingBook) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowAdd(false); setEditingBook(null) }} />
                    <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 slide-up shadow-2xl border border-primary/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {editingBook ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                                {editingBook ? 'Editar Título' : 'Registrar Nuevo Título'}
                            </h2>
                            <button onClick={() => { setShowAdd(false); setEditingBook(null) }} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <BookForm
                            data={data}
                            initialData={editingBook}
                            onSave={async (bookData) => {
                                try {
                                    const dataWithTenant = { ...bookData, tenantId: user.tenantId }
                                    if (editingBook) {
                                        await updateBookDetails(editingBook.id, dataWithTenant)
                                        addAuditLog(`Actualizó título: '${bookData.title}'`, 'general')
                                    } else {
                                        const newBook = await addNewBook(dataWithTenant)
                                        if (!newBook || !newBook.id) {
                                            console.error('addNewBook returned null or no ID', newBook)
                                            alert('Error al registrar el título en la base de datos. Verifica que todos los campos requeridos estén completos.')
                                            return
                                        }
                                        addAuditLog(`Registró nuevo título: '${bookData.title}'`, 'general')
                                    }
                                    setShowAdd(false)
                                    setEditingBook(null)
                                } catch (err) {
                                    console.error('Error saving book:', err)
                                    const errorMsg = err?.message || 'Error desconocido'
                                    alert(`Error al guardar el título: ${errorMsg}`)
                                }
                            }}
                            onClose={() => { setShowAdd(false); setEditingBook(null) }}
                        />
                    </div>
                </div>
            )}

            {showEscandallo && (
                <EscandalloModal
                    book={data.books.find(b => b.id === showEscandallo.id) || showEscandallo}
                    onClose={() => setShowEscandallo(null)}
                />
            )}

            <div className="space-y-4">
                {filteredBooks.map(book => {
                    // ── Metrics Calculation ──────────────────────────────────────
                    const inv = data.inventory?.physical?.find(i => i.bookId === book.id)
                    const stock = inv?.stock || 0
                    const minStock = inv?.minStock || 0
                    const isLowStock = stock <= minStock && stock > 0
                    const isOutOfStock = stock === 0
                    
                    // Sales for Best Seller identification
                    const bookSalesCount = (data.finances?.sales || [])
                        .filter(s => s.bookId === book.id && s.status !== 'Anulada')
                        .reduce((sum, s) => sum + (s.quantity || 0), 0)
                    
                    // Identify if this is the top seller
                    const allSalesByBook = (data.books || []).map(b => ({
                        id: b.id,
                        total: (data.finances?.sales || [])
                            .filter(s => s.bookId === b.id && s.status !== 'Anulada')
                            .reduce((sum, s) => sum + (s.quantity || 0), 0)
                    }))
                    const maxSales = Math.max(...allSalesByBook.map(b => b.total), 0)
                    const isBestSeller = maxSales > 0 && bookSalesCount === maxSales

                    return (
                        <div 
                            key={book.id} 
                            className={`glass-card p-5 relative group transition-all duration-300 border-l-4 ${
                                isOutOfStock ? 'border-l-rose-500 bg-rose-500/5' : 
                                isLowStock ? 'border-l-amber-500 bg-amber-500/5' : 
                                isBestSeller ? 'border-l-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.1)]' :
                                'border-l-transparent'
                            }`}
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-2 transition-opacity">
                                <button
                                    onClick={() => setShowCodes(book)}
                                    className="p-2 bg-slate-100 dark:bg-dark-200 hover:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-500/70 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors shadow-sm"
                                    title="Ver Códigos QR e ISBN"
                                >
                                    <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowEscandallo(book)}
                                    className="p-2 bg-slate-100 dark:bg-dark-200 hover:bg-primary/20 rounded-lg text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors shadow-sm"
                                    title="Ver Escandallo (Costos)"
                                >
                                    <Calculator className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setEditingBook(book); setShowAdd(false) }}
                                    className="p-2 bg-slate-100 dark:bg-dark-200 hover:bg-slate-200 dark:hover:bg-dark-300 rounded-lg text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
                                    title="Editar título"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(book)}
                                    className="p-2 bg-slate-100 dark:bg-dark-200 hover:bg-red-500/20 rounded-lg text-red-500/70 hover:text-red-400 transition-colors shadow-sm"
                                    title="Eliminar título"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pr-24">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className={`text-lg font-bold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                            {book.title} 
                                            <span className={`ml-2 px-2 py-0.5 rounded text-sm font-mono ${
                                                isOutOfStock ? 'bg-rose-500 text-white animate-pulse' : 
                                                isLowStock ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                                                'bg-slate-100 dark:bg-dark-200 text-slate-500'
                                            }`}>
                                                [S: {stock}]
                                            </span>
                                        </h3>
                                        {isBestSeller && (
                                            <span className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border border-yellow-500">
                                                ★ Best Seller
                                            </span>
                                        )}
                                        {isOutOfStock && (
                                            <span className="flex items-center gap-1 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                Quiebre de Stock
                                            </span>
                                        )}
                                        <span className={statusColors[book.status]}>{book.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-dark-600 mt-1 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {book.authorName}
                                        {bookSalesCount > 0 && <span className="ml-3 text-[10px] opacity-70">• {bookSalesCount} unidades vendidas</span>}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-dark-500 mt-2 italic line-clamp-2">{book.synopsis}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4">
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest">ISBN</p>
                                    <p className="text-xs text-slate-900 dark:text-white font-mono">{book.isbn || '—'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest">Género</p>
                                    <p className="text-xs text-slate-900 dark:text-white">{book.genre || '—'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1"><DollarSign className="w-3 h-3" />PVP</p>
                                    <p className="text-xs text-slate-900 dark:text-white font-bold">{book.pvp ? formatCLP(book.pvp) : '—'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1"><Percent className="w-3 h-3" />Regalía</p>
                                    <p className="text-xs text-slate-900 dark:text-white">{book.royaltyPercent}%</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1">Depósito Legal</p>
                                    <p className={`text-xs font-bold ${book.hasLegalDeposit === 'Sí' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {book.hasLegalDeposit === 'Sí' ? (book.legalDepositNumber || 'SÍ') : 'PENDIENTE'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1">Contrato</p>
                                    <p className={`text-xs font-bold ${book.contractStatus === 'Firmado' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                                        {book.contractStatus || 'PENDIENTE'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {filteredBooks.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-dark-600 glass-card">
                        No se encontraron títulos que coincidan con la búsqueda.
                    </div>
                )}
            </div>

            {showCodes && (
                <CodesModal book={showCodes} onClose={() => setShowCodes(null)} formatCLP={formatCLP} />
            )}
        </div>
    )
}

function CodesModal({ book, onClose, formatCLP }) {
    const qrData = JSON.stringify({
        Titulo: book.title,
        Autor: book.authorName,
        ISBN: book.isbn,
        Genero: book.genre,
        PVP: book.pvp ? formatCLP(book.pvp) : 'N/A',
        Sinopsis: book.synopsis
    }, null, 2)

    const downloadSvg = (selector, filename) => {
        const svg = document.querySelector(selector)
        if (!svg) {
            alert("No se pudo generar el vector.")
            return
        }
        const svgData = new XMLSerializer().serializeToString(svg)
        const preface = '<?xml version="1.0" standalone="no"?>\r\n'
        const finalSvg = svgData.includes('xmlns="http://www.w3.org/2000/svg"')
            ? svgData
            : svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')

        const blob = new Blob([preface + finalSvg], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-dark border border-slate-200 dark:border-primary/20 rounded-xl shadow-2xl max-w-2xl w-full p-6 slide-up flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <div className="w-full flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" /> Códigos Vectoriales: {book.title}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 dark:text-dark-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* QR Code */}
                    <div className="flex flex-col items-center glass-card p-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 text-center">QR Code (Ficha Completa)</h3>
                        <div className="bg-white p-3 rounded-lg flex items-center justify-center m-auto" id="qr-wrapper">
                            <QRCodeSVG value={qrData} size={160} level="L" />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-dark-500 text-center mt-3 leading-relaxed">Al escanear este código se obtienen los detalles del título para compartir.</p>
                        <button onClick={() => downloadSvg('#qr-wrapper svg', `QR_${book.title.replace(/\s+/g, '_')}.svg`)} className="btn-secondary mt-4 w-full flex items-center justify-center gap-2 text-xs">
                            <Download className="w-3 h-3" /> Descargar QR (SVG)
                        </button>
                    </div>

                    {/* Barcode / ISBN */}
                    <div className="flex flex-col items-center glass-card p-6">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 text-center">Código de Barras (ISBN)</h3>
                        {book.isbn ? (() => {
                            const numericIsbn = book.isbn.replace(/\D/g, '')
                            const isEAN13 = numericIsbn.length === 13
                            return (
                                <>
                                    <div className="bg-white p-4 rounded-lg flex items-center justify-center m-auto w-full overflow-hidden" id="barcode-wrapper">
                                        <Barcode
                                            value={isEAN13 ? numericIsbn : book.isbn}
                                            format={isEAN13 ? "EAN13" : "CODE128"}
                                            width={2}
                                            height={70}
                                            fontSize={16}
                                            background="#ffffff"
                                        />
                                    </div>
                                    <p className="text-[10px] text-dark-500 text-center mt-3 leading-relaxed">Contenedor vectorial. Si es de 13 dígitos es EAN-13, ideal para contratapa.</p>
                                    <button onClick={() => downloadSvg('#barcode-wrapper svg', `ISBN_${book.isbn}.svg`)} className="btn-primary mt-4 w-full flex items-center justify-center gap-2 text-xs">
                                        <Download className="w-3 h-3" /> Descargar ISBN (SVG)
                                    </button>
                                </>
                            )
                        })() : (
                            <div className="text-center mt-auto mb-auto bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                                <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 mb-2">Sin código ISBN</p>
                                <p className="text-[10px] text-slate-500 dark:text-dark-500">Edita el libro y agrégale un código ISBN de 13 dígitos para generar este vector.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
