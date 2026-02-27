import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { FileText, Plus, Calendar, Percent, DollarSign, User } from 'lucide-react'

export default function Books() {
    const { data, addNewBook, formatCLP, addAuditLog } = useAuth()
    const [showAdd, setShowAdd] = useState(false)

    const statusColors = {
        'Original': 'badge-purple', 'Contratación': 'badge-yellow', 'Edición': 'badge-blue',
        'Corrección': 'badge-yellow', 'Maquetación': 'badge-blue', 'Imprenta': 'badge-red', 'Publicado': 'badge-green'
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />Registro de Libros
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">{data.books.length} libros en catálogo</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> Nuevo Libro
                </button>
            </div>

            {showAdd && <AddBookForm data={data} addNewBook={addNewBook} addAuditLog={addAuditLog} onClose={() => setShowAdd(false)} />}

            <div className="space-y-4">
                {data.books.map(book => (
                    <div key={book.id} className="glass-card p-5">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
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
            </div>
        </div>
    )
}

function AddBookForm({ data, addNewBook, addAuditLog, onClose }) {
    const [form, setForm] = useState({ title: '', authorId: '', isbn: '', genre: '', royaltyPercent: 10, advance: 0, pvp: 0, synopsis: '' })
    const authors = data.users.filter(u => u.role === 'AUTOR')

    const handleSubmit = async (e) => {
        e.preventDefault()
        const author = authors.find(a => a.id === form.authorId)
        const book = {
            id: `b${Date.now()}`, ...form, authorName: author?.name || '', status: 'Original',
            assignedTo: [], advance: parseInt(form.advance), pvp: parseInt(form.pvp),
            royaltyPercent: parseInt(form.royaltyPercent), contractExpiry: null, createdAt: new Date().toISOString().split('T')[0], cover: null
        }
        await addNewBook(book)
        addAuditLog(`Registró nuevo libro: '${book.title}'`, 'general')
        onClose()
    }

    return (
        <div className="glass-card p-5 slide-up">
            <h3 className="text-sm font-semibold text-white mb-4">Registrar Nuevo Libro</h3>
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
                    <input type="number" value={form.pvp} onChange={e => setForm(p => ({ ...p, pvp: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">% Regalía</label>
                    <input type="number" value={form.royaltyPercent} onChange={e => setForm(p => ({ ...p, royaltyPercent: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                    <label className="text-xs text-dark-600 mb-1 block">Anticipo (CLP)</label>
                    <input type="number" value={form.advance} onChange={e => setForm(p => ({ ...p, advance: e.target.value }))} className="input-field text-sm" />
                </div>
                <div className="sm:col-span-2">
                    <label className="text-xs text-dark-600 mb-1 block">Sinopsis</label>
                    <textarea value={form.synopsis} onChange={e => setForm(p => ({ ...p, synopsis: e.target.value }))} className="input-field text-sm" rows={2} />
                </div>
                <div className="sm:col-span-2 flex gap-2 justify-end">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">Registrar Libro</button>
                </div>
            </form>
        </div>
    )
}
