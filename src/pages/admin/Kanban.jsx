import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GripVertical, MessageSquare, Calendar, User, Clock } from 'lucide-react'

const STAGES = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
const stageColors = {
    'Original': 'border-t-purple-500', 'Contratación': 'border-t-amber-500', 'Edición': 'border-t-primary',
    'Corrección': 'border-t-yellow-500', 'Maquetación': 'border-t-blue-400', 'Imprenta': 'border-t-red-400', 'Publicado': 'border-t-emerald-500'
}

export default function Kanban() {
    const { data, updateBookStatus, updateInventory, addAuditLog, user } = useAuth()
    const [draggedBook, setDraggedBook] = useState(null)
    const [commentModal, setCommentModal] = useState(null)
    const [publishModal, setPublishModal] = useState(null)
    const [readTimestamps, setReadTimestamps] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('kanban_comment_read') || '{}')
        } catch { return {} }
    })

    const books = user?.role === 'FREELANCE'
        ? data.books.filter(b => b.assignedTo?.includes(user.id))
        : data.books

    const handleDragStart = (book) => setDraggedBook(book)
    const handleDragOver = (e) => e.preventDefault()

    const handleDrop = (stage) => {
        if (draggedBook && draggedBook.status !== stage) {
            if (stage === 'Publicado') {
                setPublishModal(draggedBook)
            } else {
                updateBookStatus(draggedBook.id, stage)
            }
        }
        setDraggedBook(null)
    }

    const handlePublishConfirm = async (bookId, qty) => {
        try {
            await updateBookStatus(bookId, 'Publicado')
            if (qty > 0) {
                const entry = { date: new Date().toISOString().split('T')[0], qty, type: 'imprenta', note: 'Llegada desde imprenta' }
                await updateInventory(bookId, (existing, bId) => {
                    if (existing) {
                        return { ...existing, stock: (existing.stock || 0) + qty, entries: [...(existing.entries || []), entry] }
                    } else {
                        return {
                            bookId: bId || bookId,
                            stock: qty,
                            minStock: 100,
                            entries: [entry],
                            exits: []
                        }
                    }
                })
                await addAuditLog(`Inventario: Añadidos ${qty} ejemplares de libro publicado (Tiraje)`, 'inventario')
            }
        } catch (error) {
            console.error('Error al publicar libro:', error)
            alert('Ocurrió un error al intentar publicar y actualizar inventario.')
        } finally {
            setPublishModal(null)
        }
    }

    const getCommentsCount = (bookId) => data.comments.filter(c => c.bookId === bookId).length

    const getUnreadCount = useCallback((bookId) => {
        const lastRead = readTimestamps[bookId]
        if (!lastRead) {
            return data.comments.filter(c => c.bookId === bookId).length
        }
        return data.comments.filter(c => c.bookId === bookId && new Date(c.date) > new Date(lastRead)).length
    }, [data.comments, readTimestamps])

    const openComments = (book) => {
        const now = new Date().toISOString()
        const updated = { ...readTimestamps, [book.id]: now }
        setReadTimestamps(updated)
        localStorage.setItem('kanban_comment_read', JSON.stringify(updated))
        setCommentModal(book)
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Tablero de Producción</h1>
                <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Arrastra las tarjetas para mover libros entre etapas</p>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="flex gap-2 xl:gap-4 w-full h-full">
                    {STAGES.map(stage => {
                        const stageBooks = books.filter(b => b.status === stage)
                        return (
                            <div
                                key={stage}
                                className="kanban-column"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage)}
                            >
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stageColors[stage]?.replace('border-t-', 'bg-')}`} />
                                        <h3 className="text-xs font-semibold text-slate-700 dark:text-dark-800 uppercase tracking-wider">{stage}</h3>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-dark-500 bg-slate-100 dark:bg-dark-200 px-2 py-0.5 rounded-full">{stageBooks.length}</span>
                                </div>

                                <div className="space-y-2 flex-1 min-h-[200px]">
                                    {stageBooks.map(book => (
                                        <div
                                            key={book.id}
                                            draggable
                                            onDragStart={() => handleDragStart(book)}
                                            className={`kanban-card border-t-2 ${stageColors[stage]}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <GripVertical className="w-4 h-4 text-dark-500 mt-0.5 shrink-0 cursor-grab" />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">{book.title}</h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <User className="w-3 h-3 text-slate-500 dark:text-dark-600" />
                                                        <span className="text-xs text-slate-500 dark:text-dark-600 truncate">{book.authorName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3 text-slate-500 dark:text-dark-600" />
                                                        <span className="text-xs text-slate-500 dark:text-dark-600 truncate">{book.genre}</span>
                                                    </div>
                                                    {book.deliveryDate && (() => {
                                                        const today = new Date()
                                                        const due = new Date(book.deliveryDate)
                                                        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
                                                        const colorClass = diff < 0 ? 'text-red-400' : diff <= 7 ? 'text-amber-400' : 'text-dark-600'
                                                        return (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <Clock className={`w-3 h-3 ${colorClass}`} />
                                                                <span className={`text-xs ${colorClass} truncate`}>
                                                                    {diff < 0 ? `Vencido ${Math.abs(diff)}d` : diff === 0 ? 'Hoy' : `${diff}d`}
                                                                </span>
                                                            </div>
                                                        )
                                                    })()}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[10px] text-slate-400 dark:text-dark-500">{book.isbn?.slice(-6)}</span>
                                                        <button
                                                            onClick={() => openComments(book)}
                                                            className={`flex items-center gap-1 text-xs transition-colors relative ${getUnreadCount(book.id) > 0
                                                                ? 'text-primary' : 'text-slate-500 dark:text-dark-600 hover:text-primary'
                                                                }`}
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            {getCommentsCount(book.id)}
                                                            {getUnreadCount(book.id) > 0 && (
                                                                <span className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full pulse-glow" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Comment Modal */}
            {commentModal && <CommentsModal book={commentModal} onClose={() => setCommentModal(null)} />}

            {/* Publish Modal */}
            {publishModal && <PublishModal book={publishModal} onClose={() => setPublishModal(null)} onConfirm={handlePublishConfirm} />}

        </div>
    )
}

function CommentsModal({ book, onClose }) {
    const { data, addComment, user } = useAuth()
    const [text, setText] = useState('')
    const [category, setCategory] = useState('General')
    const comments = data.comments.filter(c => c.bookId === book.id)
    const categories = ['General', 'Edición', 'Corrección', 'Diseño']
    const commentsEndRef = useRef(null)

    // Auto-scroll to the last message
    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Scroll on mount and when comments change
    useEffect(() => {
        scrollToBottom()
    }, [comments.length])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!text.trim()) return
        addComment(book.id, text, category)
        setText('')
        setTimeout(scrollToBottom, 100)
    }

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card max-w-lg w-full max-h-[80vh] flex flex-col slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-dark-300">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{book.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-dark-600">{book.authorName} · Comentarios internos</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-dark-300">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all ${category === cat ? 'bg-primary/15 text-primary-600 dark:text-primary-300 border border-primary/20' : 'text-slate-500 dark:text-dark-600 hover:bg-slate-100 dark:hover:bg-dark-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {comments.length === 0 ? (
                        <p className="text-sm text-dark-600 text-center py-8">No hay comentarios aún</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className={`p-3 rounded-lg ${c.role === 'ADMIN' ? 'bg-primary/5 border border-primary/10' : 'bg-slate-50 dark:bg-dark-50 border border-slate-200 dark:border-dark-300'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${c.role === 'ADMIN' ? 'bg-primary/10 text-primary-600 dark:text-primary-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                                        {(c.userName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                                    </div>
                                    <span className="text-xs font-medium text-slate-900 dark:text-white">{c.userName || 'Usuario'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.role === 'ADMIN' ? 'bg-primary/10 text-primary-600 dark:text-primary-300' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>{c.role || 'Rol'}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-dark-500 ml-auto">{c.date ? new Date(c.date).toLocaleDateString('es-CL') : '-'}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-dark-800 leading-relaxed">{c.text}</p>
                                <span className="inline-block mt-1 text-[10px] text-slate-400 dark:text-dark-500 bg-slate-100 dark:bg-dark-200 px-2 py-0.5 rounded">{c.category}</span>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-dark-300">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            className="input-field flex-1 text-sm py-2"
                            placeholder="Escribe un comentario..."
                        />
                        <button type="submit" className="btn-primary text-sm px-4">
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function PublishModal({ book, onClose, onConfirm }) {
    const [qty, setQty] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        onConfirm(book.id, parseInt(qty) || 0)
    }

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card max-w-sm w-full p-6 slide-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Publicar Libro</h3>
                <p className="text-sm text-slate-500 dark:text-dark-600 mb-4">
                    Has movido "{book.title}" a Publicado. ¿Cuántas copias físicas recibiste de la imprenta para añadir al inventario?
                </p>
                <form onSubmit={handleSubmit}>
                    <label className="text-xs text-slate-500 dark:text-dark-600 mb-1 block uppercase tracking-wider">Tiraje Recibido (Cantidad o 0 si digital)</label>
                    <input
                        type="number"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        className="input-field mb-6"
                        placeholder="Ej: 500"
                        min="0"
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="btn-primary flex-1 text-sm">Guardar y Publicar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
