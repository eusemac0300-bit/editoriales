import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FileText, Plus, Calendar, Percent, DollarSign, User, Search, Filter, Edit, Trash2 } from 'lucide-react'

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
    const [form, setForm] = useState({
        title: initialData?.title || '',
        authorId: initialData?.authorId || '',
        isbn: initialData?.isbn || '',
        genre: initialData?.genre || '',
        royaltyPercent: initialData?.royaltyPercent || 10,
        advance: initialData?.advance || 0,
        pvp: initialData?.pvp || 0,
        synopsis: initialData?.synopsis || ''
    })
    const authors = data.users.filter(u => u.role === 'AUTOR')

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
            bookData.cover = null
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
                <div className="sm:col-span-2 flex gap-2 justify-end mt-2">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">{initialData ? 'Guardar Cambios' : 'Registrar Título'}</button>
                </div>
            </form>
        </div>
    )
}
