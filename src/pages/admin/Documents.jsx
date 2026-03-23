import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FolderOpen, FileText, Download, Upload, X, Edit, Trash2 } from 'lucide-react'

export default function Documents() {
    const { user, data, formatCLP, addDocument, editDocument, deleteDocument, addAuditLog, supabaseConnected } = useAuth()
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [docType, setDocType] = useState('Manuscrito')
    const [selectedBook, setSelectedBook] = useState('')
    const [editingDoc, setEditingDoc] = useState(null)
    const [editDocName, setEditDocName] = useState('')
    const [docAmount, setDocAmount] = useState('')
    const [docStatus, setDocStatus] = useState('Vigente')
    const [docStartDate, setDocStartDate] = useState('')
    const [docEndDate, setDocEndDate] = useState('')
    const [filterCategory, setFilterCategory] = useState('Todos')
    const fileInputRef = useRef(null)

    // Merge uploaded documents with invoices that act as documents
    const generalDocs = (data.documents || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        book: data.books.find(b => b.id === doc.bookId)?.title || '—',
        bookId: doc.bookId,
        amount: doc.amount || null,
        date: doc.createdAt ? doc.createdAt.split('T')[0] : '',
        format: doc.fileUrl?.split('.').pop()?.toUpperCase() || 'FILE',
        fileUrl: doc.fileUrl,
        status: doc.status || 'Vigente',
        startDate: doc.startDate || '',
        endDate: doc.endDate || '',
        isInvoice: false
    }))

    const invoiceDocs = data.finances.invoices.map(inv => ({
        id: inv.id,
        name: `${inv.type === 'egreso' ? 'Factura' : 'Ingreso'} - ${inv.concept}`,
        type: inv.type === 'egreso' ? 'Factura Proveedor' : 'Comprobante Ingreso',
        book: data.books.find(b => b.id === inv.bookId)?.title || '—',
        bookId: inv.bookId,
        amount: inv.amount,
        date: inv.date,
        format: 'PDF',
        fileUrl: inv.fileUrl,
        status: 'Pagado',
        isInvoice: true
    }))

    const filteredDocs = [...generalDocs, ...invoiceDocs]
        .filter(d => filterCategory === 'Todos' || d.type === filterCategory)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            const ext = selectedFile.name.split('.').pop().toLowerCase()
            if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
                alert('Solo se permiten archivos PDF, JPG o PNG.')
                return
            }
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                alert('El archivo es demasiado grande (Máx 10MB).')
                return
            }
            setFile(selectedFile)
            setEditDocName(selectedFile.name)
            setEditingDoc(null)
            setDocAmount('')
            setShowUploadModal(true)
        }
    }

    const handleEditClick = (doc) => {
        setEditingDoc(doc)
        setDocType(doc.type)
        setSelectedBook(doc.bookId || '')
        setEditDocName(doc.name)
        setDocAmount(doc.amount ? doc.amount.toString() : '')
        setDocStatus(doc.status || 'Vigente')
        setDocStartDate(doc.startDate || '')
        setDocEndDate(doc.endDate || '')
        setFile(null)
        setShowUploadModal(true)
    }

    const handleConfirmSubmit = async () => {
        if (!supabaseConnected) {
            alert('Atención: La plataforma está en modo local temporal por falta de base de datos activa. No se pueden guardar cambios.')
            setShowUploadModal(false)
            setFile(null)
            setEditingDoc(null)
            setDocAmount('')
            return
        }

        setIsUploading(true)
        try {
            if (editingDoc) {
                // Modo Edición: solo actualizamos metadata
                const updates = {
                    name: editDocName || editingDoc.name,
                    type: docType,
                    amount: docAmount ? parseInt(docAmount.replace(/\D/g, '')) || null : null,
                    bookId: selectedBook || null,
                    status: docStatus,
                    startDate: docStartDate,
                    endDate: docEndDate
                }

                await editDocument(editingDoc.id, updates)
                addAuditLog(`Editó documento: ${updates.name}`, 'general')
                alert('Documento actualizado con éxito.')
            } else {
                // Modo Subida: original file upload behavior
                if (!file) {
                    setIsUploading(false)
                    return
                }

                const fileName = `${user.tenantId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('editorial_documents')
                    .upload(fileName, file)

                if (uploadError) {
                    console.warn('Storage upload failed (bucket might be missing):', uploadError)
                    alert('Error al subir a la nube. Por favor, asegúrese de haber corrido la migración SQL "docs_migration.sql".')
                    setIsUploading(false)
                    return
                }

                const { data: publicUrlData } = supabase.storage
                    .from('editorial_documents')
                    .getPublicUrl(fileName)

                const url = publicUrlData.publicUrl

                const newDoc = {
                    id: `doc${Date.now()}`,
                    name: editDocName || file.name,
                    bookId: selectedBook || null,
                    type: docType,
                    fileUrl: url,
                    size: file.size,
                    amount: docAmount ? parseInt(docAmount.replace(/\D/g, '')) || null : null,
                    status: docStatus,
                    startDate: docStartDate,
                    endDate: docEndDate,
                    uploadedBy: user.id,
                    createdAt: new Date().toISOString()
                }

                await addDocument(newDoc)
                addAuditLog(`Subió documento: ${file.name}`, 'general')
                alert('Documento guardado con éxito.')
            }

            // Cleanup after success
            setShowUploadModal(false)
            setFile(null)
            setEditingDoc(null)
            setSelectedBook('')
            setEditDocName('')
            setDocAmount('')
            setDocStatus('Vigente')
            setDocStartDate('')
            setDocEndDate('')

        } catch (err) {
            console.error(err)
            alert('Se produjo un error durante la operación.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownload = (doc) => {
        if (doc.fileUrl) {
            // Open in new tab which usually triggers download/view for PDF/images
            window.open(doc.fileUrl, '_blank')
        } else {
            alert('Este registro no tiene un archivo físico asociado en la plataforma aún.')
        }
    }

    const handleDelete = async (doc) => {
        if (!supabaseConnected) {
            alert('Atención: Al estar en modo local, no se pueden eliminar documentos físicos.')
            return
        }
        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el documento "${doc.name}"? Esta acción no se puede deshacer.`)) {
            await deleteDocument(doc.id, doc.fileUrl)
            addAuditLog(`Eliminó documento: ${doc.name}`, 'general')
        }
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" />Gestión Documental
                    </h1>
                    <p className="text-slate-500 dark:text-dark-600 text-sm mt-1">Repositorio de archivos (Contratos, Manuscritos, Portadas, Facturas)</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <button onClick={handleUploadClick} className="btn-primary text-sm whitespace-nowrap">
                        <span className="text-lg leading-none mr-2 font-light">+</span> Crear Documento
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-4">
                {['Todos', 'Contrato', 'Manuscrito', 'Boleta Honorarios', 'Factura Proveedor', 'Portada', 'Varios'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            filterCategory === cat 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white dark:bg-dark-100 text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-200 border border-slate-200 dark:border-dark-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-dark-100 border border-slate-200 dark:border-dark-300 rounded-xl w-full max-w-md overflow-hidden slide-up relative">
                        <button
                            onClick={() => { setShowUploadModal(false); setFile(null); setEditingDoc(null); setEditDocName(''); setDocAmount(''); setDocStartDate(''); setDocEndDate(''); setDocStatus('Vigente') }}
                            className="absolute top-4 right-4 text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                {editingDoc ? 'Editar Documento' : 'Clasificar Documento'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-dark-500 block mb-1">Nombre del Documento</label>
                                    <input
                                        type="text"
                                        value={editDocName}
                                        onChange={(e) => setEditDocName(e.target.value)}
                                        className="input-field w-full text-sm"
                                        placeholder="Ingrese o modifique el nombre..."
                                    />
                                    {!editingDoc && file && (
                                        <p className="text-xs text-slate-500 dark:text-dark-600 mt-2">Archivo original a subir: <span className="text-primary-400 truncate">{file.name}</span></p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-dark-500 block mb-1">Tipo de Documento</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                        className="input-field w-full text-sm"
                                    >
                                        <option value="Manuscrito">Manuscrito Original</option>
                                        <option value="Contrato">Contrato</option>
                                        <option value="Boleta Honorarios">Boleta de Honorarios</option>
                                        <option value="Portada">Diseño / Portada</option>
                                        <option value="Comprobante">Comprobante de Pago</option>
                                        <option value="Factura Proveedor">Factura Proveedor</option>
                                        <option value="Varios">Varios</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Estado</label>
                                        <select value={docStatus} onChange={e => setDocStatus(e.target.value)} className="input-field w-full text-sm">
                                            <option value="Borrador">Borrador</option>
                                            <option value="Enviado">Enviado</option>
                                            <option value="Vigente">Vigente / Firmado</option>
                                            <option value="Vencido">Vencido</option>
                                            <option value="Pendiente Pago">Pendiente Pago</option>
                                            <option value="Pagado">Pagado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Monto ($)</label>
                                        <input
                                            type="text"
                                            value={docAmount ? formatCLP(docAmount) : ''}
                                            onChange={(e) => setDocAmount(e.target.value.replace(/\D/g, ''))}
                                            className="input-field w-full text-sm"
                                            placeholder="$ 0"
                                        />
                                    </div>
                                </div>
                                {(docType === 'Contrato' || docType === 'Boleta Honorarios') && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Fecha Inicio / Emisión</label>
                                            <input type="date" value={docStartDate} onChange={e => setDocStartDate(e.target.value)} className="input-field w-full text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Fecha Vencimiento</label>
                                            <input type="date" value={docEndDate} onChange={e => setDocEndDate(e.target.value)} className="input-field w-full text-sm" />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-dark-500 block mb-1">Vincular a un Título (Opcional)</label>
                                    <select
                                        value={selectedBook}
                                        onChange={(e) => setSelectedBook(e.target.value)}
                                        className="input-field w-full text-sm"
                                    >
                                        <option value="">-- Sin Vincular --</option>
                                        {data.books.map(b => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-dark-300 bg-slate-50 dark:bg-dark-50 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowUploadModal(false); setFile(null); setEditingDoc(null); setEditDocName(''); setDocAmount(''); setDocStartDate(''); setDocEndDate(''); setDocStatus('Vigente') }}
                                className="btn-secondary text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                disabled={isUploading}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isUploading ? 'Guardando...' : editingDoc ? 'Guardar Cambios' : 'Confirmar Subida'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-dark-300">
                            <th className="table-header text-left py-3 px-4">Documento</th>
                            <th className="table-header text-left py-3 px-4">Título</th>
                            <th className="table-header text-left py-3 px-4">Categoría</th>
                            <th className="table-header text-left py-3 px-4">Estado</th>
                            <th className="table-header text-right py-3 px-4">Monto ($)</th>
                            <th className="table-header text-center py-3 px-4">Fecha</th>
                            <th className="table-header text-center py-3 px-4">Descargas & Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDocs.map(doc => (
                            <tr key={doc.id} className="table-row">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2 max-w-[250px]">
                                        <FileText className={`w-4 h-4 flex-shrink-0 ${doc.format === 'PDF' ? 'text-red-400' : 'text-primary-300'}`} />
                                        <span className="text-sm text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600 dark:text-dark-700 truncate max-w-[150px]">{doc.book}</td>
                                <td className="py-3 px-4">
                                    <span className={doc.type.includes('Factura') ? 'badge-red' : (doc.type === 'Contrato' ? 'badge-blue' : (doc.type === 'Boleta Honorarios' ? 'badge-purple' : 'badge-slate'))}>
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        doc.status === 'Vigente' || doc.status === 'Pagado' ? 'bg-emerald-500/10 text-emerald-500' : 
                                        (doc.status === 'Vencido' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500')
                                    }`}>
                                        {doc.status}
                                    </span>
                                    {doc.endDate && doc.status !== 'Pagado' && (
                                        <p className="text-[9px] text-slate-400 mt-0.5">Vence: {doc.endDate}</p>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-sm text-right text-slate-700 dark:text-dark-800 font-mono">
                                    {doc.amount ? formatCLP(doc.amount) : "—"}
                                </td>
                                <td className="py-3 px-4 text-sm text-center text-slate-500 dark:text-dark-600">{doc.date}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {!doc.isInvoice && (
                                            <button
                                                onClick={() => handleEditClick(doc)}
                                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-dark-200 text-slate-500 dark:text-dark-500 hover:text-primary hover:bg-primary/10 transition-all"
                                                title="Editar Título o Vínculo del Documento"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        )}
                                        {!doc.fileUrl && (
                                            <button
                                                onClick={() => {
                                                    setDocType(doc.type.includes('Factura') ? 'Comprobante' : 'Varios')
                                                    const b = doc.bookId ? { id: doc.bookId } : data.books.find(b => b.title === doc.book)
                                                    setSelectedBook(b ? b.id : '')
                                                    handleUploadClick()
                                                }}
                                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-dark-200 text-slate-500 dark:text-dark-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-dark-300 transition-all"
                                                title="Adjuntar Archivo Físico"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className={`p-1.5 rounded-lg transition-all ${doc.fileUrl ? 'bg-primary/10 text-primary hover:bg-primary hover:text-slate-900 dark:text-white cursor-pointer' : 'opacity-50 text-slate-500 dark:text-dark-600 cursor-not-allowed'}`}
                                            title={doc.fileUrl ? "Descargar / Ver Archivo" : "No hay archivo subido"}
                                            disabled={!doc.fileUrl}
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        {!doc.isInvoice && (
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-dark-200 text-slate-500 dark:text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                title="Eliminar Documento"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredDocs.length === 0 && (
                            <tr>
                                <td colSpan="7" className="py-8 text-center text-slate-500 dark:text-dark-500 text-sm">No hay documentos ni facturas registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
