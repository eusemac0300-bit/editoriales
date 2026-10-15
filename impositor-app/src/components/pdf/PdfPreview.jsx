import { useState, useCallback } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import PdfPageRenderer from './PdfPageRenderer.jsx'
import { useImposition } from '../../hooks/useImposition.js'

/**
 * Vista previa del PDF fuente. Cada página es arrastrable (drag source).
 * Al seleccionar una página, se notifica vía onPageSelect.
 */
export default function PdfPreview({ className = '', onPageSelect }) {
  const { loadSourceFile, state } = useImposition()
  const [file, setFile] = useState(null)
  const [selectedPageId, setSelectedPageId] = useState(null)

  const { sourcePages } = state

  const handleFileChange = useCallback(async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    try {
      const ab = await f.arrayBuffer()
      // Carga el PDF en el estado global de la app (hook), no solo localmente
      await loadSourceFile(f, ab)
    } catch (err) {
      console.error('Error leyendo PDF:', err)
    }
  }, [loadSourceFile])

  const handleDragStart = (e, pageId) => {
    e.dataTransfer.setData('application/x-impositor-page', pageId)
    e.dataTransfer.effectAllowed = 'move'
    setSelectedPageId(pageId)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-sm font-medium text-slate-700">Documento fuente</span>
        </div>
        <div className="text-xs text-slate-500">
          {file ? file.name : 'Sin PDF cargado'}
        </div>
      </div>

      <div className="relative">
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {sourcePages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[62vh] overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
              {sourcePages.map((page) => (
                <div
                  key={page.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, page.id)}
                  onClick={() => {
                    setSelectedPageId(page.id)
                    onPageSelect?.(page)
                  }}
                  className="relative group cursor-pointer transition-all duration-200"
                >
                  <div className="relative aspect-[3/4] bg-slate-100 border rounded-lg overflow-hidden">
                    <PdfPageRenderer
                      arrayBuffer={state.sourceArrayBuffer}
                      pageNumber={page.index}
                      width={90}
                    />
                    {selectedPageId === page.id && (
                      <div className="absolute inset-0 border-2 border-impositor-500 flex items-center justify-center bg-impositor-500/20 z-10">
                        <span className="text-impositor-600 text-xs font-semibold">Seleccionada</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                      P{page.index}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-slate-600 truncate">Página {page.index}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[62vh] bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
              <ImageIcon className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-600">Sin PDF cargado</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic para importar un PDF fuente</p>
            </div>
          )}
        </label>
      </div>

      {selectedPageId && (
        <div className="mt-3 px-2 py-1.5 bg-impositor-50 border border-impositor-100 rounded-lg text-xs text-impositor-700 flex items-center gap-2">
          <span>Página {selectedPageId.replace('page-', '')} seleccionada</span>
          <span className="ml-auto">Arrastra a una celda del pliego</span>
        </div>
      )}
    </div>
  )
}
