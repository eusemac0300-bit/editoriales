import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Calendar, Percent, DollarSign, User, Search, Filter, Edit, Trash2, Image as ImageIcon, Upload, Kanban, QrCode, Download, X, Calculator, Save, Package, Share2, Instagram, Facebook } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import EscandalloModal from '../../components/EscandalloModal'

const STAGES = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
const stageColors = {
    'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
    'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
}

export default function Books() {
    const navigate = useNavigate()
    const { data, addNewBook, updateBookDetails, deleteExistingBook, formatCLP, addAuditLog } = useAuth()
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
                                if (editingBook) {
                                    await updateBookDetails(editingBook.id, bookData)
                                    addAuditLog(`Actualizó título: '${bookData.title}'`, 'general')
                                } else {
                                    await addNewBook(bookData)
                                    addAuditLog(`Registró nuevo título: '${bookData.title}'`, 'general')
                                }
                                setShowAdd(false)
                                setEditingBook(null)
                            }}
                            onClose={() => { setShowAdd(false); setEditingBook(null) }}
                        />
                    </div>
                </div>
            )}

            {showEscandallo && (
                <EscandalloModal
                    book={showEscandallo}
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
                                    title="Ver Costos y Escandallo"
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
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" />Vence</p>
                                    <p className="text-xs text-slate-900 dark:text-white">{book.contractExpiry || '—'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-dark-50 rounded-lg p-2.5">
                                    <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" />Entrega</p>
                                    <p className="text-xs text-slate-900 dark:text-white">{book.deliveryDate || '—'}</p>
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

function BookForm({ data, initialData, onSave, onClose }) {
    const { user } = useAuth()
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [form, setForm] = useState({
        title: initialData?.title || '',
        authorId: initialData?.authorId || '',
        isbn: initialData?.isbn || '',
        genre: initialData?.genre || '',
        royaltyPercent: initialData?.royaltyPercent || 10,
        advance: initialData?.advance || 0,
        pvp: initialData?.pvp || 0,
        synopsis: initialData?.synopsis || '',
        width: initialData?.width || '',
        height: initialData?.height || '',
        pages: initialData?.pages || '',
        coverType: initialData?.coverType || '',
        flaps: initialData?.flaps || '',
        interiorPaper: initialData?.interiorPaper || '',
        coverPaper: initialData?.coverPaper || '',
        coverFinish: initialData?.coverFinish || '',
        cover: initialData?.cover || '',
        pagesColor: initialData?.pagesColor || '',
        sku: initialData?.sku || '',
        hasLegalDeposit: initialData?.hasLegalDeposit || 'No',
        legalDepositNumber: initialData?.legalDepositNumber || '',
        flapWidth: initialData?.flapWidth || '',
        // Nuevos campos de producción
        deliveryDate: initialData?.deliveryDate || '',
        finalPdfInterior: initialData?.finalPdfInterior || '',
        finalPdfCover: initialData?.finalPdfCover || ''
    })

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                authorId: initialData.authorId || '',
                authorName: initialData.authorName || '',
                genre: initialData.genre || '',
                status: initialData.status || 'Original',
                isbn: initialData.isbn || '',
                synopsis: initialData.synopsis || '',
                pvp: initialData.pvp || 0,
                royaltyPercent: initialData.royaltyPercent || 0,
                advance: initialData.advance || 0,
                width: initialData.width || '',
                height: initialData.height || '',
                pages: initialData.pages || '',
                coverType: initialData.coverType || '',
                flaps: initialData.flaps || '',
                interiorPaper: initialData.interiorPaper || '',
                coverPaper: initialData.coverPaper || '',
                coverFinish: initialData.coverFinish || '',
                cover: initialData.cover || '',
                pagesColor: initialData.pagesColor || '',
                sku: initialData.sku || '',
                hasLegalDeposit: initialData.hasLegalDeposit || 'No',
                legalDepositNumber: initialData.legalDepositNumber || '',
                flapWidth: initialData.flapWidth || '',
                deliveryDate: initialData.deliveryDate || '',
                finalPdfInterior: initialData.finalPdfInterior || '',
                finalPdfCover: initialData.finalPdfCover || ''
            })
        }
    }, [initialData])

    const authors = data.users.filter(u => u.role === 'AUTOR')
    const [isUploadingInterior, setIsUploadingInterior] = useState(false)
    const [isUploadingFinalCover, setIsUploadingFinalCover] = useState(false)

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede pesar más de 5MB')
            return
        }
        setIsUploadingCover(true)
        try {
            const fileName = `${user.tenantId}/covers/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const { error: uploadErr } = await supabase.storage.from('editorial_documents').upload(fileName, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage.from('editorial_documents').getPublicUrl(fileName)
            setForm(p => ({ ...p, cover: publicUrlData.publicUrl }))
        } catch (err) {
            console.error(err)
            alert('Error al subir la imagen. Verifica tu conexión a internet o los permisos de base de datos.')
        } finally {
            setIsUploadingCover(false)
        }
    }

    const handleFinalFileUpload = async (e, type) => {
        const file = e.target.files[0]
        if (!file) return
        
        // 20MB limit as requested by user
        if (file.size > 20 * 1024 * 1024) {
            alert('El archivo PDF no puede pesar más de 20MB.')
            return
        }

        const isInterior = type === 'interior'
        if (isInterior) setIsUploadingInterior(true)
        else setIsUploadingFinalCover(true)

        try {
            const folder = isInterior ? 'final_interiors' : 'final_covers'
            const fileName = `${user.tenantId}/${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            
            const { error: uploadErr } = await supabase.storage.from('editorial_documents').upload(fileName, file)
            if (uploadErr) throw uploadErr

            const { data: publicUrlData } = supabase.storage.from('editorial_documents').getPublicUrl(fileName)
            
            if (isInterior) {
                setForm(p => ({ ...p, finalPdfInterior: publicUrlData.publicUrl }))
            } else {
                setForm(p => ({ ...p, finalPdfCover: publicUrlData.publicUrl }))
            }
        } catch (err) {
            console.error(err)
            alert('Error al subir el archivo PDF. Revisa tu conexión.')
        } finally {
            if (isInterior) setIsUploadingInterior(false)
            else setIsUploadingFinalCover(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const author = authors.find(a => a.id === form.authorId)

        const bookData = {
            ...form,
            authorName: author?.name || '',
            advance: parseInt(form.advance.toString().replace(/\D/g, ''), 10) || 0,
            pvp: parseInt(form.pvp.toString().replace(/\D/g, ''), 10) || 0,
            royaltyPercent: parseFloat(form.royaltyPercent) || 0,
            deliveryDate: form.deliveryDate || null
        }

        if (!initialData) {
            bookData.id = `b${Date.now()}`
            bookData.status = form.entryStage  // Etapa elegida por el admin
            bookData.assignedTo = []
            bookData.contractExpiry = null
            bookData.createdAt = new Date().toISOString().split('T')[0]
        }

        await onSave(bookData)
    }

    const formatMoney = (val) => val === 0 || val === '' ? '' : new Intl.NumberFormat('es-CL').format(val)

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ── Sección: Datos de Producción ── */}
                <div className="sm:col-span-2 pb-3 border-b border-primary/20">
                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2 mb-3">
                        <Kanban className="w-3.5 h-3.5" /> Datos de Producción
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                            <label className="text-xs text-dark-600 mb-1 block">Título del Libro *</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field text-sm" required placeholder="Título completo" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Autor *</label>
                            <select value={form.authorId} onChange={e => setForm(p => ({ ...p, authorId: e.target.value }))} className="input-field text-sm" required>
                                <option value="">Seleccionar autor...</option>
                                {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Género *</label>
                            <input value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} className="input-field text-sm" placeholder="Ej: Narrativa" required />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block flex items-center gap-1">
                                <Kanban className="w-3 h-3 text-primary" /> Etapa de Entrada *
                            </label>
                            <select
                                value={form.status || 'Original'}
                                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                className="input-field text-sm"
                            >
                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-600 dark:text-dark-700 font-medium mb-1 block flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Fecha Estimada de Entrega
                            </label>
                            <div className="max-w-[200px]">
                                <input
                                    type="date"
                                    value={form.deliveryDate}
                                    onChange={e => setForm(p => ({ ...p, deliveryDate: e.target.value }))}
                                    className="input-field text-sm dark:bg-dark-300"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">ISBN</label>
                            <input value={form.isbn} onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} className="input-field text-sm" placeholder="978-956-..." />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-dark-600 mb-1 block">PVP (CLP)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">$</span>
                        <input type="text" value={formatMoney(form.pvp)} onChange={e => setForm(p => ({ ...p, pvp: e.target.value.replace(/\D/g, '') }))} className="input-field pl-7 text-sm" placeholder="0" />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">% Regalía</label>
                    <input type="number" value={form.royaltyPercent === 0 ? '' : form.royaltyPercent} onChange={e => setForm(p => ({ ...p, royaltyPercent: e.target.value }))} className="input-field text-sm" min="0" max="100" placeholder="0" />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Anticipo (CLP)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dark-500">$</span>
                        <input type="text" value={formatMoney(form.advance)} onChange={e => setForm(p => ({ ...p, advance: e.target.value.replace(/\D/g, '') }))} className="input-field pl-7 text-sm" placeholder="0" />
                    </div>
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs text-dark-600 mb-1 block">Sinopsis</label>
                    <textarea value={form.synopsis} onChange={e => setForm(p => ({ ...p, synopsis: e.target.value }))} className="input-field text-sm" rows={2} />
                </div>

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Detalles Físicos y Técnicos (Opcional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Ancho (cm)</label>
                            <input value={form.width} onChange={e => setForm(p => ({ ...p, width: e.target.value }))} className="input-field text-sm" placeholder="Ej: 14" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Alto (cm)</label>
                            <input value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} className="input-field text-sm" placeholder="Ej: 21" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Páginas (B/N)</label>
                            <input type="number" value={form.pages} onChange={e => setForm(p => ({ ...p, pages: e.target.value }))} className="input-field text-sm" placeholder="Ej: 320" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Páginas (Color)</label>
                            <input type="number" value={form.pagesColor} onChange={e => setForm(p => ({ ...p, pagesColor: e.target.value }))} className="input-field text-sm" placeholder="Ej: 16" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Tipo de Tapa</label>
                            <select value={form.coverType} onChange={e => setForm(p => ({ ...p, coverType: e.target.value }))} className="input-field text-sm">
                                <option value="">Indefinido</option>
                                <option value="Blanda">Tapa Blanda (Rústica)</option>
                                <option value="Dura">Tapa Dura (Cartoné)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Solapas</label>
                            <select value={form.flaps} onChange={e => setForm(p => ({ ...p, flaps: e.target.value }))} className="input-field text-sm">
                                <option value="">Indefinido</option>
                                <option value="Con solapa">Con solapas</option>
                                <option value="Sin solapa">Sin solapas</option>
                            </select>
                        </div>
                        {form.flaps === 'Con solapa' && (
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block">Medida Solapa (cm)</label>
                                <input value={form.flapWidth} onChange={e => setForm(p => ({ ...p, flapWidth: e.target.value }))} className="input-field text-sm" placeholder="Ej: 8" />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Papel Interiores</label>
                            <input value={form.interiorPaper} onChange={e => setForm(p => ({ ...p, interiorPaper: e.target.value }))} className="input-field text-sm" placeholder="Ej: Ahuesado 90g" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Papel Tapas</label>
                            <input value={form.coverPaper} onChange={e => setForm(p => ({ ...p, coverPaper: e.target.value }))} className="input-field text-sm" placeholder="Ej: Cartulina 250g" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Laminado Tapa</label>
                            <select value={form.coverFinish} onChange={e => setForm(p => ({ ...p, coverFinish: e.target.value }))} className="input-field text-sm">
                                <option value="">Indefinido</option>
                                <option value="Brillante">Brillante</option>
                                <option value="Mate">Mate</option>
                                <option value="Soft Touch">Soft Touch</option>
                                <option value="Sin laminado">Sin laminado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Identificadores Adicionales (Opcional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">SKU</label>
                            <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className="input-field text-sm" placeholder="Ej: ED100-XXX" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Depósito Legal</label>
                            <select value={form.hasLegalDeposit} onChange={e => setForm(p => ({ ...p, hasLegalDeposit: e.target.value }))} className="input-field text-sm">
                                <option value="No">No</option>
                                <option value="Sí">Sí</option>
                            </select>
                        </div>
                        {form.hasLegalDeposit === 'Sí' && (
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block">Nº Depósito Legal</label>
                                <input value={form.legalDepositNumber} onChange={e => setForm(p => ({ ...p, legalDepositNumber: e.target.value }))} className="input-field text-sm" placeholder="Ej: 12345/2026" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-2 mb-4 uppercase tracking-widest text-[11px]">
                        <Package className="w-4 h-4" /> Caja Contenedora: Versiones PDF Finales
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PDF Interior */}
                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">PDF Interior (Maqueta Final)</span>
                                {form.finalPdfInterior && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">CARGADO</span>}
                            </div>
                            
                            {form.finalPdfInterior ? (
                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-dark-300 rounded-lg border border-slate-200 dark:border-dark-400">
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold">Archivo actual</p>
                                        <a href={form.finalPdfInterior} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium truncate block">Ver / Descargar PDF</a>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setForm(p => ({ ...p, finalPdfInterior: '' }))}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-200 dark:border-dark-400 rounded-lg">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        id="pdf-interior-upload"
                                        onChange={(e) => handleFinalFileUpload(e, 'interior')}
                                        disabled={isUploadingInterior}
                                    />
                                    <label
                                        htmlFor="pdf-interior-upload"
                                        className={`flex flex-col items-center gap-2 cursor-pointer group ${isUploadingInterior ? 'opacity-50' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-300 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                                            <Upload className="w-5 h-5 text-slate-400 dark:text-dark-600 group-hover:text-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-dark-600">
                                            {isUploadingInterior ? 'Subiendo...' : 'SUBIR PDF INTERIOR'}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* PDF Tapa */}
                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">PDF Tapa (Arte Final)</span>
                                {form.finalPdfCover && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">CARGADO</span>}
                            </div>

                            {form.finalPdfCover ? (
                                <div className="flex items-center gap-2 p-2 bg-white dark:bg-dark-300 rounded-lg border border-slate-200 dark:border-dark-400">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-500 dark:text-dark-600 uppercase font-bold">Archivo actual</p>
                                        <a href={form.finalPdfCover} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium truncate block">Ver / Descargar PDF</a>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setForm(p => ({ ...p, finalPdfCover: '' }))}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-200 dark:border-dark-400 rounded-lg">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        id="pdf-tapa-upload"
                                        onChange={(e) => handleFinalFileUpload(e, 'tapa')}
                                        disabled={isUploadingFinalCover}
                                    />
                                    <label
                                        htmlFor="pdf-tapa-upload"
                                        className={`flex flex-col items-center gap-2 cursor-pointer group ${isUploadingFinalCover ? 'opacity-50' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-300 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                                            <Upload className="w-5 h-5 text-slate-400 dark:text-dark-600 group-hover:text-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-dark-600">
                                            {isUploadingFinalCover ? 'Subiendo...' : 'SUBIR PDF TAPA'}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-500 dark:text-dark-600 italic">⚠️ Límite de 20MB por archivo para optimización de recursos.</p>
                </div>

                <div className="sm:col-span-2 mb-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-dark-600 mb-2 block uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5 text-primary" /> Portada para Redes Sociales (IG, FB, Ads)
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-dark-200/40 border border-slate-200 dark:border-dark-300 rounded-xl">
                        {form.cover ? (
                            <div className="relative group">
                                <img src={form.cover} alt="Cover preview" className="w-20 h-24 object-cover rounded-lg shadow-md border border-dark-400 group-hover:brightness-75 transition-all" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-1 text-white">
                                        <Instagram className="w-3.5 h-3.5" />
                                        <Facebook className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-20 h-24 bg-dark-300/50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-dark-400 text-dark-500 gap-2">
                                <ImageIcon className="w-6 h-6 opacity-40" />
                                <div className="flex gap-1 opacity-20">
                                    <Instagram className="w-3 h-3" />
                                    <Facebook className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            <h5 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Imagen de Visualización</h5>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 mb-3 leading-relaxed">Esta imagen se utilizará como previsualización en la web y para generar contenido en redes sociales.</p>
                            
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                id="cover-upload"
                                onChange={handleCoverUpload}
                                disabled={isUploadingCover}
                            />
                            <div className="flex gap-2">
                                <label
                                    htmlFor="cover-upload"
                                    className={`btn-secondary text-[10px] py-1.5 px-3 inline-flex items-center gap-2 cursor-pointer ${isUploadingCover ? 'opacity-50' : ''}`}
                                >
                                    <Upload className="w-3 h-3" />
                                    {isUploadingCover ? 'Subiendo...' : 'SUBIR IMAGEN'}
                                </label>
                                {form.cover && (
                                    <button 
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, cover: '' }))}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-md text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sm:col-span-2 flex gap-2 justify-end mt-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm flex items-center gap-2 px-6">
                        <Save className="w-4 h-4" />
                        {initialData ? 'Guardar Cambios' : 'Registrar Título'}
                    </button>
                </div>
            </form>
        </div>
    )
}
