import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FileText, Plus, Calendar, Percent, DollarSign, User, Search, Filter, Edit, Trash2, Image as ImageIcon, Upload } from 'lucide-react'

export default function Books() {
    const { data, addNewBook, updateBookDetails, deleteExistingBook, formatCLP, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)
    const [editingBook, setEditingBook] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('All')

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
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />Registro de Títulos
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">{filteredBooks.length} títulos en catálogo</p>
                </div>
                <button onClick={() => { setEditingBook(null); setShowAdd(!showAdd) }} className="btn-primary text-sm h-10">
                    <Plus className="w-4 h-4 inline mr-1" /> Nuevo Título
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                    <input
                        type="text"
                        placeholder="Buscar por título o autor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-9 h-10 py-0 text-sm w-full"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-dark-500" />
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

            {(showAdd || editingBook) && (
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
            )}

            <div className="space-y-4">
                {filteredBooks.map(book => (
                    <div key={book.id} className="glass-card p-5 relative group">
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => { setEditingBook(book); setShowAdd(false) }}
                                className="p-1.5 bg-dark-200 hover:bg-dark-300 rounded text-dark-500 hover:text-white transition-colors"
                                title="Editar título"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(book)}
                                className="p-1.5 bg-dark-200 hover:bg-red-500/20 rounded text-red-500/70 hover:text-red-400 transition-colors"
                                title="Eliminar título"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pr-20">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium text-white">{book.title}</h3>
                                    <span className={statusColors[book.status]}>{book.status}</span>
                                </div>
                                <p className="text-sm text-dark-600 mt-1 flex items-center gap-1"><User className="w-3 h-3" /> {book.authorName}</p>
                                <p className="text-xs text-dark-500 mt-1">{book.synopsis}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                            <div className="bg-dark-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-dark-600 uppercase">ISBN</p>
                                <p className="text-xs text-white font-mono">{book.isbn || '—'}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-dark-600 uppercase">Género</p>
                                <p className="text-xs text-white">{book.genre}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-dark-600 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3" />PVP</p>
                                <p className="text-xs text-white font-medium">{book.pvp ? formatCLP(book.pvp) : '—'}</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-dark-600 uppercase flex items-center gap-1"><Percent className="w-3 h-3" />Regalía</p>
                                <p className="text-xs text-white">{book.royaltyPercent}%</p>
                            </div>
                            <div className="bg-dark-50 rounded-lg p-2.5">
                                <p className="text-[10px] text-dark-600 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" />Vence</p>
                                <p className="text-xs text-white">{book.contractExpiry || '—'}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredBooks.length === 0 && (
                    <div className="p-8 text-center text-dark-600 glass-card">
                        No se encontraron títulos que coincidan con la búsqueda.
                    </div>
                )}
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
        flapWidth: initialData?.flapWidth || ''
    })
    const authors = data.users.filter(u => u.role === 'AUTOR')

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        const author = authors.find(a => a.id === form.authorId)

        const bookData = {
            ...form,
            authorName: author?.name || '',
            advance: parseInt(form.advance.toString().replace(/\D/g, ''), 10) || 0,
            pvp: parseInt(form.pvp.toString().replace(/\D/g, ''), 10) || 0,
            royaltyPercent: parseFloat(form.royaltyPercent) || 0
        }

        if (!initialData) {
            bookData.id = `b${Date.now()}`
            bookData.status = 'Original'
            bookData.assignedTo = []
            bookData.contractExpiry = null
            bookData.createdAt = new Date().toISOString().split('T')[0]
        }

        await onSave(bookData)
    }

    const formatMoney = (val) => val === 0 || val === '' ? '' : new Intl.NumberFormat('es-CL').format(val)

    return (
        <div className="glass-card p-5 slide-up border border-primary/30">
            <h3 className="text-sm font-semibold text-white mb-4">{initialData ? 'Editar Título' : 'Registrar Nuevo Título'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <label className="text-xs text-dark-600 mb-1 block">Título</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field text-sm" required />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Autor</label>
                    <select value={form.authorId} onChange={e => setForm(p => ({ ...p, authorId: e.target.value }))} className="input-field text-sm" required>
                        <option value="">Seleccionar...</option>
                        {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">ISBN</label>
                    <input value={form.isbn} onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Género</label>
                    <input value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} className="input-field text-sm" />
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

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-dark-300">
                    <h4 className="text-sm font-medium text-white mb-3">Detalles Físicos y Técnicos (Opcional)</h4>
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

                <div className="sm:col-span-2 mt-2 pt-4 border-t border-dark-300">
                    <h4 className="text-sm font-medium text-white mb-3">Identificadores Adicionales (Opcional)</h4>
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

                <div className="sm:col-span-2 mb-2">
                    <label className="text-xs text-dark-600 mb-1 block">Imagen de Portada (Opcional)</label>
                    <div className="flex items-center gap-4 p-3 bg-dark-200 border border-dark-300 rounded-lg">
                        {form.cover ? (
                            <img src={form.cover} alt="Cover preview" className="w-16 h-20 object-cover rounded shadow border border-dark-400" />
                        ) : (
                            <div className="w-16 h-20 bg-dark-300 rounded flex items-center justify-center border border-dark-400 border-dashed">
                                <ImageIcon className="w-6 h-6 text-dark-500" />
                            </div>
                        )}
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                                id="cover-upload"
                                onChange={handleCoverUpload}
                                disabled={isUploadingCover}
                            />
                            <label
                                htmlFor="cover-upload"
                                className={`btn-secondary text-xs inline-flex items-center gap-2 cursor-pointer ${isUploadingCover ? 'opacity-50' : ''}`}
                            >
                                <Upload className="w-3 h-3" />
                                {isUploadingCover ? 'Subiendo...' : 'Subir Imagen'}
                            </label>
                            <p className="text-[10px] text-dark-500 mt-2">Formatos aceptados: JPG, PNG, WEBP. Máx: 5MB.</p>
                        </div>
                    </div>
                </div>
                <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">{initialData ? 'Guardar Cambios' : 'Registrar Título'}</button>
                </div>
            </form>
        </div>
    )
}
