import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { GripVertical, MessageSquare, Calendar, User } from 'lucide-react'

const STAGES = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']
const stageColors = {
    'Original': 'border-t-purple-500', 'Contratación': 'border-t-amber-500', 'Edición': 'border-t-primary',
    'Corrección': 'border-t-yellow-500', 'Maquetación': 'border-t-blue-400', 'Imprenta': 'border-t-red-400', 'Publicado': 'border-t-emerald-500'
}

export default function Kanban() {
    const { data, updateBookStatus, user } = useAuth()
    const [draggedBook, setDraggedBook] = useState(null)
    const [commentModal, setCommentModal] = useState(null)
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
            updateBookStatus(draggedBook.id, stage)
        }
        setDraggedBook(null)
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
                <h1 className="text-2xl font-bold text-white">Tablero de Producción</h1>
                <p className="text-dark-600 text-sm mt-1">Arrastra las tarjetas para mover libros entre etapas</p>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
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
                                        <h3 className="text-xs font-semibold text-dark-800 uppercase tracking-wider">{stage}</h3>
                                    </div>
                                    <span className="text-xs text-dark-500 bg-dark-200 px-2 py-0.5 rounded-full">{stageBooks.length}</span>
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
                                                    <h4 className="text-sm font-medium text-white truncate">{book.title}</h4>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <User className="w-3 h-3 text-dark-600" />
                                                        <span className="text-xs text-dark-600 truncate">{book.authorName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3 text-dark-600" />
                                                        <span className="text-xs text-dark-600">{book.genre}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-[10px] text-dark-500">{book.isbn?.slice(-6)}</span>
                                                        <button
                                                            onClick={() => openComments(book)}
                                                            className={`flex items-center gap-1 text-xs transition-colors relative ${getUnreadCount(book.id) > 0
                                                                ? 'text-primary-300 font-semibold'
                                                                : 'text-dark-600 hover:text-primary'
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
                <div className="p-4 border-b border-dark-300">
                    <h3 className="text-lg font-semibold text-white">{book.title}</h3>
                    <p className="text-xs text-dark-600">{book.authorName} · Comentarios internos</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-3 border-b border-dark-300">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all ${category === cat ? 'bg-primary/15 text-primary-300 border border-primary/20' : 'text-dark-600 hover:bg-dark-200'}`}
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
                            <div key={c.id} className={`p-3 rounded-lg ${c.role === 'ADMIN' ? 'bg-primary/5 border border-primary/10' : 'bg-dark-50 border border-dark-300'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${c.role === 'ADMIN' ? 'bg-primary/20 text-primary-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {c.userName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                    </div>
                                    <span className="text-xs font-medium text-white">{c.userName}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.role === 'ADMIN' ? 'bg-primary/10 text-primary-300' : 'bg-emerald-500/10 text-emerald-400'}`}>{c.role}</span>
                                    <span className="text-[10px] text-dark-500 ml-auto">{new Date(c.date).toLocaleDateString('es-CL')}</span>
                                </div>
                                <p className="text-sm text-dark-800 leading-relaxed">{c.text}</p>
                                <span className="inline-block mt-1 text-[10px] text-dark-500 bg-dark-200 px-2 py-0.5 rounded">{c.category}</span>
                            </div>
                        ))
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-dark-300">
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
