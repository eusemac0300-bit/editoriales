import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Kanban, Calendar, FileText, X, Package, Upload, Image as ImageIcon, Share2, Trash2, Save, UserPlus, CheckCircle } from 'lucide-react'

const STAGES = ['Original', 'Contratación', 'Edición', 'Corrección', 'Maquetación', 'Imprenta', 'Publicado']

export default function BookForm({ data, initialData, onSave, onClose }) {
    const { user, addNewUser } = useAuth()
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [showNewAuthor, setShowNewAuthor] = useState(false)
    const [newAuthorName, setNewAuthorName] = useState('')
    const [savingAuthor, setSavingAuthor] = useState(false)
    const [form, setForm] = useState({
        title: initialData?.title || '',
        authorId: initialData?.authorId || '',
        isbn: initialData?.isbn || '',
        genre: initialData?.genre || '',
        status: initialData?.status || 'Original',
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
        contractStatus: initialData?.contractStatus || 'Borrador',
        contractDate: initialData?.contractDate || '',
        contractFile: initialData?.contractFile || '',
        deliveryDate: initialData?.deliveryDate || ''
    })

    useEffect(() => {
        if (initialData) {
            setForm({ ...initialData })
        }
    }, [initialData])

    const [localAuthors, setLocalAuthors] = useState(data?.users?.filter(u => u.role === 'AUTOR') || [])

    useEffect(() => {
        setLocalAuthors(data?.users?.filter(u => u.role === 'AUTOR') || [])
    }, [data?.users])

    const authors = localAuthors

    const handleCreateAuthor = async () => {
        if (!newAuthorName.trim()) return
        setSavingAuthor(true)
        try {
            const newId = `u${Date.now()}`
            const slug = newAuthorName.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')
            const newAuthor = {
                id: newId,
                name: newAuthorName.trim(),
                role: 'AUTOR',
                email: `${slug}.${Date.now()}@pendiente.editorial`,
                password: 'pendiente-1234',
                title: 'Autor',
                tenantId: user?.tenantId
            }
            await addNewUser(newAuthor)
            setLocalAuthors(prev => [...prev, newAuthor])
            setForm(p => ({ ...p, authorId: newId }))
            setNewAuthorName('')
            setShowNewAuthor(false)
        } catch (err) {
            console.error('Error al crear autor:', err)
            alert('No se pudo crear el autor. Intenta de nuevo.')
        } finally {
            setSavingAuthor(false)
        }
    }

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
            royaltyPercent: parseFloat(form.royaltyPercent) || 0,
            deliveryDate: form.deliveryDate || null
        }

        if (!initialData) {
            bookData.id = `b${Date.now()}`
            bookData.status = form.status || 'Original'
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
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs text-dark-600">Autor *</label>
                                <button
                                    type="button"
                                    onClick={() => setShowNewAuthor(v => !v)}
                                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-600 transition-colors"
                                >
                                    <UserPlus className="w-3 h-3" />
                                    {showNewAuthor ? 'Cancelar' : 'Nuevo autor'}
                                </button>
                            </div>
                            <select value={form.authorId} onChange={e => setForm(p => ({ ...p, authorId: e.target.value }))} className="input-field text-sm" required>
                                <option value="">Seleccionar autor...</option>
                                {authors.map(a => {
                                    const bio = (() => {
                                        if (!a.bio) return {}
                                        if (typeof a.bio === 'object') return a.bio
                                        try { return JSON.parse(a.bio) } catch { return {} }
                                    })()
                                    const isPending = a.email?.includes('@pendiente.editorial') || !bio.rut || !bio.bankAccountNumber
                                    return (
                                        <option key={a.id} value={a.id}>
                                            {a.name} {isPending ? '⚠️' : '✅'}
                                        </option>
                                    )
                                })}
                            </select>
                            {showNewAuthor && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={newAuthorName}
                                        onChange={e => setNewAuthorName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateAuthor())}
                                        placeholder="Nombre completo del autor..."
                                        className="input-field text-sm flex-1 py-1.5"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateAuthor}
                                        disabled={savingAuthor || !newAuthorName.trim()}
                                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shrink-0 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        {savingAuthor ? '...' : 'Crear'}
                                    </button>
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-1">Puedes completar el perfil del autor luego en la sección Usuarios.</p>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block">Género *</label>
                            <input value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} className="input-field text-sm" placeholder="Ej: Narrativa" required />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block flex items-center gap-1">
                                <Kanban className="w-3 h-3 text-primary" /> Etapa Actual *
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
                    <label className="text-xs text-dark-600 mb-1 block">% Regalías Autor</label>
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
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Gestión Legal y Contratos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block text-[10px] uppercase font-bold text-slate-400">Estado del Contrato</label>
                            <select value={form.contractStatus} onChange={e => setForm(p => ({ ...p, contractStatus: e.target.value }))} className="input-field text-sm">
                                <option value="Borrador">Borrador</option>
                                <option value="Enviado">Enviado a Autor</option>
                                <option value="Firmado">Firmado / Vigente</option>
                                <option value="Vencido">Vencido</option>
                                <option value="Rescindido">Rescindido</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block text-[10px] uppercase font-bold text-slate-400">Fecha de Contratación</label>
                            <input type="date" value={form.contractDate} onChange={e => setForm(p => ({ ...p, contractDate: e.target.value }))} className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-dark-600 mb-1 block text-[10px] uppercase font-bold text-slate-400">Depósito Legal</label>
                            <select value={form.hasLegalDeposit} onChange={e => setForm(p => ({ ...p, hasLegalDeposit: e.target.value }))} className="input-field text-sm">
                                <option value="No">No (Pendiente)</option>
                                <option value="Sí">Sí (Realizado)</option>
                            </select>
                        </div>
                        {form.hasLegalDeposit === 'Sí' && (
                            <div>
                                <label className="text-xs text-dark-600 mb-1 block text-[10px] uppercase font-bold text-slate-400">Nº Depósito Legal</label>
                                <input value={form.legalDepositNumber} onChange={e => setForm(p => ({ ...p, legalDepositNumber: e.target.value }))} className="input-field text-sm" placeholder="Ej: 12345/2026" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Caja Contenedora — visible pero desactivada temporalmente */}
                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-dark-300 relative">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/50 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
                        <div className="bg-white dark:bg-dark-200 border border-amber-500/30 rounded-lg px-5 py-3 shadow-lg text-center max-w-xs">
                            <Package className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Módulo en Mantenimiento</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-600 mt-1">La carga de PDFs finales estará disponible próximamente.</p>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-emerald-600/50 dark:text-emerald-500/30 flex items-center gap-2 mb-4 uppercase tracking-widest text-[11px]">
                        <Package className="w-4 h-4" /> Caja Contenedora: Versiones PDF Finales
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex flex-col gap-3">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">PDF Interior (Maqueta Final)</span>
                            <div className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-200 dark:border-dark-400 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-300 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-slate-400 dark:text-dark-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-dark-600 mt-2">SUBIR PDF INTERIOR</span>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-dark-200/50 rounded-xl border border-slate-200 dark:border-dark-300 flex flex-col gap-3">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">PDF Tapa (Arte Final)</span>
                            <div className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-200 dark:border-dark-400 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-300 flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-slate-400 dark:text-dark-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-dark-600 mt-2">SUBIR PDF TAPA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 mb-2 pt-4 border-t border-slate-200 dark:border-dark-300">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-dark-600 mb-2 block uppercase tracking-wider flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5 text-primary" /> Portada para Redes Sociales
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-dark-200/40 border border-slate-200 dark:border-dark-300 rounded-xl">
                        {form.cover ? (
                            <img src={form.cover} alt="Cover" className="w-20 h-24 object-cover rounded-lg shadow-md border border-dark-400" />
                        ) : (
                            <div className="w-20 h-24 bg-dark-300/50 rounded-xl flex items-center justify-center border-2 border-dashed border-dark-400 text-dark-500">
                                <ImageIcon className="w-6 h-6 opacity-40" />
                            </div>
                        )}
                        <div className="flex-1">
                            <input
                                type="file" accept="image/*" className="hidden" id="cover-upload"
                                onChange={handleCoverUpload} disabled={isUploadingCover}
                            />
                            <div className="flex gap-2">
                                <label htmlFor="cover-upload" className="btn-secondary text-[10px] py-1.5 px-3 cursor-pointer">
                                    {isUploadingCover ? 'Subiendo...' : 'SUBIR IMAGEN'}
                                </label>
                                {form.cover && <button type="button" onClick={() => setForm(p => ({ ...p, cover: '' }))} className="text-rose-500 text-[10px]">Eliminar</button>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-2 flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200 dark:border-dark-300">
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
