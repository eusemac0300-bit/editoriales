import React, { useState } from 'react'
import { FileText, Calendar, Clock, Download, ExternalLink, Code2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import manualContent from '../../../DEVELOPER_MANUAL.md?raw'
import adminManualContent from '../../../MANUAL_ADMINISTRADOR.md?raw'

const DOCS = [
    {
        id: 'dev_manual',
        title: 'Manual del Desarrollador (Developer Docs)',
        description: 'Documentación técnica completa sobre la arquitectura, el stack de tecnologías, la estrategia multi-tenant y los patrones de carga de datos.',
        date: new Date().toISOString().split('T')[0],
        type: 'MARKDOWN',
        content: manualContent,
        icon: Code2,
        color: 'bg-purple-500'
    },
    {
        id: 'admin_manual',
        title: 'Manual del Administrador (User Guide)',
        description: 'Guía detallada sobre la navegación, flujos de trabajo editoriales y el prompt para NotebookLM.',
        date: new Date().toISOString().split('T')[0],
        type: 'MARKDOWN',
        content: adminManualContent,
        icon: FileText,
        color: 'bg-indigo-500'
    },
    {
        id: 'api_ref',
        title: 'Referencia API (Próximamente)',
        description: 'Detalles de los endpoints de la API REST generados por Supabase y las llamadas RPC.',
        date: '2026-03-18',
        type: 'PDF',
        icon: FileText,
        color: 'bg-blue-500',
        disabled: true
    }
]

export default function SuperAdminDocumentation() {
    const [selectedDoc, setSelectedDoc] = useState(DOCS[0])

    const handleDownload = () => {
        if (!selectedDoc || selectedDoc.type !== 'MARKDOWN') return;
        const blob = new Blob([selectedDoc.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DEVELOPER_MANUAL.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-dark-200 border border-dark-300 flex items-center justify-center shadow-lg">
                        <FileText className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Centro de Documentación</h1>
                        <p className="text-dark-600 font-medium">Archivos técnicos, manuales y notas de arquitectura para el equipo core.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Docs Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-widest pl-2 mb-4">Documentos Disponibles</p>
                    {DOCS.map(doc => (
                        <button 
                            key={doc.id}
                            onClick={() => !doc.disabled && setSelectedDoc(doc)}
                            disabled={doc.disabled}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all border ${
                                selectedDoc?.id === doc.id 
                                    ? 'bg-dark-200 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                                    : 'bg-dark-100 border-transparent hover:bg-dark-200 hover:border-dark-300'
                            } ${doc.disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${doc.color}`}>
                                <doc.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold truncate ${selectedDoc?.id === doc.id ? 'text-purple-400' : 'text-white'}`}>
                                    {doc.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1.5 opacity-70">
                                    <Calendar className="w-3 h-3 text-dark-500" />
                                    <span className="text-[10px] uppercase font-bold text-dark-500 tracking-widest">{doc.date}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Doc Viewer */}
                <div className="lg:col-span-3">
                    {selectedDoc ? (
                        <div className="bg-dark-100 border border-dark-300 rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden sticky top-8 animate-in slide-in-from-right-8 duration-500">
                            {/* Viewer Header */}
                            <div className="p-6 border-b border-dark-300 bg-dark-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedDoc.color} shadow-lg shadow-black/20`}>
                                        <selectedDoc.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{selectedDoc.title}</h2>
                                        <p className="text-sm text-dark-500 font-medium max-w-lg mt-1 leading-tight">{selectedDoc.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleDownload} className="btn-secondary py-2.5 px-5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-dark-300 transition-all text-white border border-dark-400">
                                        <Download className="w-4 h-4" /> Bajar .MD
                                    </button>
                                </div>
                            </div>

                            {/* Viewer Content */}
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 prose prose-invert prose-purple max-w-none custom-scrollbar">
                                {selectedDoc.type === 'MARKDOWN' && (
                                    <ReactMarkdown 
                                        components={{
                                            h1: ({node, ...props}) => <h1 className="text-4xl font-black text-white border-b border-dark-300 pb-4 mb-8" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-2xl font-black text-purple-400 mt-12 mb-6" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-8 mb-4 tracking-widest uppercase" {...props} />,
                                            p: ({node, ...props}) => <p className="text-dark-500 leading-relaxed font-medium mb-6" {...props} />,
                                            ul: ({node, ...props}) => <ul className="space-y-3 mb-6 list-disc pl-6 text-dark-500" {...props} />,
                                            li: ({node, ...props}) => <li className="pl-2" {...props} />,
                                            code: ({node, inline, ...props}) => inline ? <code className="bg-dark-300 text-purple-300 px-2 py-1 rounded-md text-sm font-bold mx-1" {...props} /> : <pre className="bg-black/50 p-6 rounded-2xl border border-dark-400 overflow-x-auto my-6 custom-scrollbar text-sm font-mono text-purple-200"><code {...props} /></pre>,
                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-6 my-8 italic text-dark-600 bg-purple-500/5 p-4 rounded-r-2xl" {...props} />
                                        }}
                                    >
                                        {selectedDoc.content}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[500px] border-2 border-dashed border-dark-300 rounded-[2.5rem] flex flex-col items-center justify-center text-dark-500">
                            <FileText className="w-16 h-16 opacity-20 mb-4" />
                            <p className="font-bold uppercase tracking-widest">Selecciona un documento</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
