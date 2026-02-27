import { useAuth } from '../../context/AuthContext'
import { FolderOpen, FileText, Download, Upload } from 'lucide-react'

export default function Documents() {
    const { data, formatCLP } = useAuth()

    const documents = [
        ...data.finances.invoices.map(inv => ({
            id: inv.id, name: `${inv.type === 'egreso' ? 'Factura' : 'Ingreso'} - ${inv.concept}`,
            type: inv.type === 'egreso' ? 'Factura Proveedor' : 'Comprobante Ingreso',
            book: data.books.find(b => b.id === inv.bookId)?.title || '—',
            amount: inv.amount, date: inv.date, format: 'PDF'
        }))
    ]

    return (
        <div className="space-y-6 fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" />Gestión Documental
                    </h1>
                    <p className="text-dark-600 text-sm mt-1">Repositorio de archivos y facturas</p>
                </div>
                <button className="btn-primary text-sm"><Upload className="w-4 h-4 inline mr-1" /> Subir Archivo</button>
            </div>

            <div className="glass-card overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-dark-300">
                            <th className="table-header text-left py-3 px-4">Documento</th>
                            <th className="table-header text-left py-3 px-4">Libro</th>
                            <th className="table-header text-left py-3 px-4">Tipo</th>
                            <th className="table-header text-right py-3 px-4">Monto</th>
                            <th className="table-header text-right py-3 px-4">Fecha</th>
                            <th className="table-header text-center py-3 px-4">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.id} className="table-row">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-300" />
                                        <span className="text-sm text-white">{doc.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-dark-700">{doc.book}</td>
                                <td className="py-3 px-4"><span className={doc.type.includes('Factura') ? 'badge-red' : 'badge-green'}>{doc.type}</span></td>
                                <td className="py-3 px-4 text-sm text-right text-dark-800">{formatCLP(doc.amount)}</td>
                                <td className="py-3 px-4 text-sm text-right text-dark-600">{doc.date}</td>
                                <td className="py-3 px-4 text-center">
                                    <button className="p-1.5 rounded-lg hover:bg-dark-200 text-dark-600 hover:text-primary transition-all">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
