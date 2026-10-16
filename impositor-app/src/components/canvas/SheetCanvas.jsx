import { useState } from 'react'
import { Plus, Trash2, FileText, Maximize, Minimize } from 'lucide-react'
import PdfPageRenderer from '../pdf/PdfPageRenderer.jsx'
import CellControls from './CellControls.jsx'

/**
 * Una celda individual del pliego.
 */
function SheetCell({
  cell,
  row,
  col,
  face,
  sourceArrayBuffer,
  selectedPageId,
  selectedCellId,
  onSelect,
  onAssign,
  onClear,
  onRotationChange,
  onFaceChange,
  onPageOrderChange,
  onDrop,
  onDragOver,
  onDragLeave,
  cellSize,
}) {
  const cellId = `r${row}c${col}-${face}`
  const isSelected = selectedCellId === cellId
  const occupied = !!cell?.sourcePageId

  return (
    <div
      key={cellId}
      onClick={() => {
        if (selectedPageId && sourceArrayBuffer) {
          onSelect?.({ id: selectedPageId })
        }
        onSelect?.({ id: cellId, isCell: true })
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`sheet-cell aspect-square transition-all duration-200 flex flex-col ${occupied
        ? 'sheet-cell--occupied border-impositor-500 bg-impositor-50'
        : 'sheet-cell--empty border-slate-300 bg-white'}
        ${isSelected ? 'ring-2 ring-impositor-500' : ''}`}
      style={{ height: cellSize, minHeight: cellSize }}
    >
      {!occupied && (
        <div className="flex flex-col items-center justify-center h-full text-slate-300 p-3">
          <Plus className="w-6 h-6 mx-auto mb-2" />
          <span className="text-xs text-slate-400">Vacía</span>
          <span className="text-[10px] text-slate-300 mt-1">{row},{col} · {face}</span>
        </div>
      )}

      {occupied && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">Página asignada</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear?.(cellId)
              }}
              className="text-rose-500 hover:text-rose-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {sourceArrayBuffer && cell?.sourcePageId && (
            <div className="mb-3">
              <PdfPageRenderer
                arrayBuffer={sourceArrayBuffer}
                pageNumber={parseInt(String(cell.sourcePageId).split('-')[1], 10)}
                width={cellSize > 100 ? 110 : 70}
              />
            </div>
          )}

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Fila:</span>
              <span className="text-slate-900 font-medium">{row}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Col:</span>
              <span className="text-slate-900 font-medium">{col}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cara:</span>
              <span className="text-slate-900 font-medium">{face}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rot:</span>
              <span className="text-slate-900 font-medium">{cell.rotation || 0}°</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.({ id: cellId, isCell: true })
            }}
            className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-impositor-100 text-impositor-600 rounded-lg hover:bg-impositor-200 transition-colors"
          >
            <FileText className="w-3 h-3 mr-1" />
            Editar celda
          </button>

          {isSelected && (
            <CellControls
              cell={{
                row,
                col,
                face,
                rotation: cell.rotation || 0,
                pageOrder: cell.pageOrder || '',
                sourcePageId: cell.sourcePageId || null,
              }}
              onRotationChange={(rot) => onRotationChange?.(cellId, rot)}
              onFaceChange={(fc) => onFaceChange?.(cellId, fc)}
              onClear={() => onClear?.(cellId)}
              onPageOrderChange={(po) => onPageOrderChange?.(cellId, po)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default function SheetCanvas({
  nrows = 2,
  ncols = 2,
  sourceArrayBuffer = null,
  selectedPageId = null,
  activeSignatureId = null,
  signatures = [],
  onPageSelect,
  onAssign,
  onClear,
  onRotationChange,
  onFaceChange,
  onPageOrderChange,
  className = '',
}) {
  const [selectedCellId, setSelectedCellId] = useState(null)
  const [dragOverCellId, setDragOverCellId] = useState(null)
  const [maximized, setMaximized] = useState(false)

  const rows = Array.from({ length: nrows }, (_, i) => i + 1)
  const cols = Array.from({ length: ncols }, (_, i) => i + 1)
  const faces = ['Up', 'Dn']
  const cellSize = maximized ? 160 : 140

  const activeSig = signatures.find((s) => s.id === activeSignatureId)

  if (!activeSig) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center justify-center h-[60vh] bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm text-slate-600">Sin imposición creada</p>
          <p className="text-xs text-slate-400 mt-1">Crea una imposición desde el panel izquierdo</p>
        </div>
      </div>
    )
  }

  const handleCellSelect = (cellId) => {
    setSelectedCellId(cellId)
  }

  return (
    <div className={`${className} flex flex-col min-h-0`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-impositor-500" />
          <span className="text-sm font-medium text-slate-700">Pliego (vista preliminar)</span>
        </div>
        <div className="text-xs text-slate-500">
          {nrows} × {ncols} celdas por cara • {activeSig.pageCount} págs/firma
        </div>
        <button
          onClick={() => setMaximized(!maximized)}
          className="p-1.5 text-slate-400 hover:text-impositor-600 rounded hover:bg-slate-100 transition-colors"
          title={maximized ? 'Reducir' : 'Pantalla completa'}
        >
          {maximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {faces.map((face) => (
        <div key={face} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cara {face}
            </span>
          </div>

          <div
            className={`grid gap-3 ${maximized ? 'justify-center' : 'justify-start'}`}
            style={{
              gridTemplateColumns: `repeat(${ncols}, minmax(${cellSize}px, 1fr))`,
            }}
          >
            {rows.map((row) =>
              cols.map((col) => {
                const cellId = `r${row}c${col}-${face}`
                const cell = activeSig.cells.find((c) => c.id === cellId)

                return (
                  <SheetCell
                    key={cellId}
                    cell={cell}
                    row={row}
                    col={col}
                    face={face}
                    sourceArrayBuffer={sourceArrayBuffer}
                    selectedPageId={selectedPageId}
                    selectedCellId={selectedCellId}
                    onSelect={handleCellSelect}
                    onAssign={(cid) => onAssign?.(cid, selectedPageId)}
                    onClear={(cid) => onClear?.(cid)}
                    onRotationChange={(cid, rot) => onRotationChange?.(cid, rot)}
                    onFaceChange={(cid, fc) => onFaceChange?.(cid, fc)}
                    onPageOrderChange={(cid, po) => onPageOrderChange?.(cid, po)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverCellId(null)
                      const pageId = e.dataTransfer.getData('application/x-impositor-page')
                      if (pageId && onAssign) {
                        onAssign(cellId, pageId)
                        setSelectedCellId(cellId)
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverCellId(cellId)
                    }}
                    onDragLeave={() => setDragOverCellId(null)}
                    cellSize={cellSize}
                  />
                )
              })
            )}
          </div>
        </div>
      ))}

      <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 text-center">
        Arrastra una página del panel derecho a una celda. Haz clic en una celda ocupada para editar.
      </div>
    </div>
  )
}
