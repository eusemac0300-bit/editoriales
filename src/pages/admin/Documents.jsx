import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { FolderOpen, FileText, Download, Upload, X } from 'lucide-react'

export default function Documents() {
    const { user, data, formatCLP, addDocument, addAuditLog, supabaseConnected } = useAuth()
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [docType, setDocType] = useState('Manuscrito')
    const [selectedBook, setSelectedBook] = useState('')
    const fileInputRef = useRef(null)

    // Merge uploaded documents with invoices that act as documents
    const generalDocs = (data.documents || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        book: data.books.find(b => b.id === doc.bookId)?.title || '—',
        amount: null,
        date: doc.createdAt ? doc.createdAt.split('T')[0] : '',
        format: doc.fileUrl?.split('.').pop()?.toUpperCase() || 'FILE',
        fileUrl: doc.fileUrl
    }))

    const invoiceDocs = data.finances.invoices.map(inv => ({
        id: inv.id,
        name: `${inv.type === 'egreso' ? 'Factura' : 'Ingreso'} - ${inv.concept}`,
        type: inv.type === 'egreso' ? 'Factura Proveedor' : 'Comprobante Ingreso',
        book: data.books.find(b => b.id === inv.bookId)?.title || '—',
        amount: inv.amount,
        date: inv.date,
        format: 'PDF',
        fileUrl: inv.fileUrl // If added in the future
    }))

    const documents = [...generalDocs, ...invoiceDocs].sort((a, b) => new Date(b.date) - new Date(a.date))

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
            setShowUploadModal(true)
        }
    }

    const handleConfirmUpload = async () => {
        if (!file) return
        if (!supabaseConnected) {
            alert('Atención: La plataforma está en modo local temporal por falta de base de datos activa. No se puede subir el archivo.')
            setShowUploadModal(false)
            setFile(null)
            return
        }

        setIsUploading(true)
        try {
            // Check if bucket exists, or just upload directly
            const fileName = `${user.tenantId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('editorial_documents')
                .upload(fileName, file)

            if (uploadError) {
                // If the bucket doesn't exist, we fallback
                console.warn('Storage upload failed (bucket might be missing):', uploadError)
                alert('Error al subir a la nube. Por favor, asegúrese de haber corrido la migración SQL "docs_migration.sql".')
                setIsUploading(false)
                return
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('editorial_documents')
                .getPublicUrl(fileName)

            const url = publicUrlData.publicUrl

            const newDoc = {
                id: `doc${Date.now()}`,
                name: file.name,
                bookId: selectedBook || null,
                type: docType,
                fileUrl: url,
                size: file.size,
                uploadedBy: user.id,
                createdAt: new Date().toISOString()
            }

            await addDocument(newDoc)
            addAuditLog(`Subió documento: ${file.name}`, 'general')

            setShowUploadModal(false)
            setFile(null)
            setSelectedBook('')
            alert('Documento subido con éxito.')

        } catch (err) {
            console.error(err)
            alert('Se produjo un error durante la subida.')
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

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" />Gestión Documental
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">Repositorio de archivos (Contratos, Manuscritos, Portadas, Facturas)</p>
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-dark-100 border border-dark-300 rounded-xl w-full max-w-md overflow-hidden slide-up relative">
                        <button
                            onClick={() => { setShowUploadModal(false); setFile(null) }}
                            className="absolute top-4 right-4 text-dark-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-white mb-1">Clasificar Documento</h3>
                            <p className="text-sm text-dark-600 mb-6">Archivo seleccionado: <span className="text-primary-400 font-medium truncate line-clamp-1">{file?.name}</span></p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-dark-500 block mb-1">Tipo de Documento</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                        className="input-field w-full text-sm"
                                    >
                                        <option value="Manuscrito">Manuscrito Original</option>
                                        <option value="Contrato">Contrato</option>
                                        <option value="Portada">Diseño / Portada</option>
                                        <option value="Comprobante">Comprobante / Factura</option>
                                        <option value="Varios">Varios</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-dark-500 block mb-1">Vincular a un Título (Opcional)</label>
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
                        <div className="p-4 border-t border-dark-300 bg-dark-50 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowUploadModal(false); setFile(null) }}
                                className="btn-secondary text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={isUploading}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isUploading ? 'Subiendo...' : 'Confirmar Subida'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-dark-300">
                            <th className="table-header text-left py-3 px-4">Documento</th>
                            <th className="table-header text-left py-3 px-4">Títlo Relacionado</th>
                            <th className="table-header text-left py-3 px-4">Categoría</th>
                            <th className="table-header text-right py-3 px-4">Monto / Info</th>
                            <th className="table-header text-right py-3 px-4">Fecha</th>
                            <th className="table-header text-center py-3 px-4">Descarga</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.id} className="table-row">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2 max-w-[250px]">
                                        <FileText className={`w-4 h-4 flex-shrink-0 ${doc.format === 'PDF' ? 'text-red-400' : 'text-primary-300'}`} />
                                        <span className="text-sm text-white truncate" title={doc.name}>{doc.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-dark-700 truncate max-w-[150px]">{doc.book}</td>
                                <td className="py-3 px-4">
                                    <span className={doc.type.includes('Factura') ? 'badge-red' : (doc.type === 'Contrato' ? 'badge-yellow' : 'badge-blue')}>
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-right text-dark-800">
                                    {doc.amount ? formatCLP(doc.amount) : <span className="text-dark-600 text-xs">{doc.format}</span>}
                                </td>
                                <td className="py-3 px-4 text-sm text-right text-dark-600">{doc.date}</td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {!doc.fileUrl && (
                                            <button
                                                onClick={() => {
                                                    setDocType(doc.type.includes('Factura') ? 'Comprobante' : 'Varios')
                                                    const b = data.books.find(b => b.title === doc.book)
                                                    setSelectedBook(b ? b.id : '')
                                                    handleUploadClick()
                                                }}
                                                className="p-1.5 rounded-lg bg-dark-200 text-dark-500 hover:text-white hover:bg-dark-300 transition-all"
                                                title="Adjuntar Archivo"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className={`p-1.5 rounded-lg transition-all ${doc.fileUrl ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white cursor-pointer' : 'opacity-50 text-dark-600 cursor-not-allowed'}`}
                                            title={doc.fileUrl ? "Descargar / Ver Archivo" : "No hay archivo subido"}
                                            disabled={!doc.fileUrl}
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {documents.length === 0 && (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-dark-500 text-sm">No hay documentos ni facturas registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
