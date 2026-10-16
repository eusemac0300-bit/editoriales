import { useState, useCallback } from 'react'
import {
  ArrowLeft,
  Layout,
  LayoutGrid,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCw,
  FileText,
  Zap,
  Download as DownloadIcon,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import SheetCanvas from '../components/canvas/SheetCanvas.jsx'
import PdfPreview from '../components/pdf/PdfPreview.jsx'
import { useImposition } from '../hooks/useImposition.js'

export default function Editor({ onBack }) {
  const [sheetName, setSheetName] = useState('Pliego 1')
  const [nrows, setNrows] = useState(2)
  const [ncols, setNcols] = useState(2)
  const [pageCount, setPageCount] = useState(4)

  const {
    state,
    isExporting,
    draggedPageId,
    loadSourceFile,
    setSheetSize,
    addSignature,
    removeSignature,
    assignPageToCell,
    clearCell,
    setCellRotation,
    setCellFace,
    setCellPageOrder,
    setActiveSignature,
    selectPage,
    setDragged,
    dropPageOnCell,
    exportPdf,
    downloadPPML,
    applyPreset,
    autoDistribute,
    IMPOSITION_PRESETS,
  } = useImposition()

  const { sourcePages, sourceArrayBuffer, selectedPageId, sheetTemplate, activeSignatureId } = state
  const signatures = sheetTemplate.signatures

  const activeSig = signatures.find((s) => s.id === activeSignatureId)

  const handlePageSelect = useCallback((page) => {
    selectPage(page.id)
  }, [selectPage])

  const handleAddSignature = useCallback(() => {
    if (!sheetName) return
    addSignature(sheetName, nrows, ncols, pageCount)
  }, [sheetName, nrows, ncols, pageCount, addSignature])

  const handleApplyPreset = useCallback((presetId) => {
    const preset = IMPOSITION_PRESETS[presetId]
    if (!preset) return
    setNrows(preset.nrows)
    setNcols(preset.ncols)
    setPageCount(preset.pageCount)
    applyPreset(presetId)
  }, [applyPreset])

  const handleAutoDistribute = useCallback(() => {
    if (!activeSignatureId) return
    autoDistribute(activeSignatureId)
  }, [activeSignatureId, autoDistribute])

  const handleAssign = useCallback((cellId, pageId) => {
    assignPageToCell(cellId, pageId)
  }, [assignPageToCell])

  const handleRotationChange = useCallback((cellId, rot) => {
    setCellRotation(cellId, rot)
  }, [setCellRotation])

  const handleFaceChange = useCallback((cellId, fc) => {
    setCellFace(cellId, fc)
  }, [setCellFace])

  const handlePageOrderChange = useCallback((cellId, po) => {
    setCellPageOrder(cellId, po)
  }, [setCellPageOrder])

  const assignedCount = signatures.reduce(
    (sum, sig) => sum + sig.cells.filter((c) => c.sourcePageId).length,
    0
  )
  const totalCells = signatures.reduce((sum, sig) => sum + sig.cells.length, 0)

  return (
    <div className="flex h-full gap-0">
      {/* ===== Panel izquierdo: controles ===== */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-white p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4 text-slate-400" onClick={onBack} />
          <span className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-slate-900">
            Volver
          </span>
        </div>

        {/* Plantilla de hoja */}
        <Card>
          <CardHeader>
            <CardTitle>Plantilla de hoja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                label="Filas"
                value={nrows}
                onChange={(e) => setNrows(Math.max(1, Number(e.target.value) || 1))}
              />
              <Input
                type="number"
                label="Columnas"
                value={ncols}
                onChange={(e) => setNcols(Math.max(1, Number(e.target.value) || 1))}
              />
              <Input
                type="number"
                label="Págs/firma"
                value={pageCount}
                onChange={(e) => setPageCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <Button variant="outline" onClick={handleAddSignature} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Crear imposición
            </Button>
          </CardContent>
        </Card>

        {/* Presets de imposición automática */}
        {sourceArrayBuffer && (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-impositor-600" />
                <CardTitle className="text-sm">Impostición automática</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Aplica un preset de imposición a la plantilla activa
              </p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(IMPOSITION_PRESETS).map(([id, preset]) => (
                  <Button
                    key={id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyPreset(id)}
                    className="w-full text-left text-xs px-3 py-2"
                  >
                    <div className="font-medium text-slate-900">{preset.label}</div>
                    <div className="text-[10px] text-slate-500">{preset.description}</div>
                  </Button>
                ))}
              </div>
              {activeSig && (
                <Button
                  variant="secondary"
                  onClick={handleAutoDistribute}
                  className="w-full mt-3 text-xs"
                  disabled={signatures.length === 0}
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Auto-distribuir páginas en la plantilla activa
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Firmas */}
        {signatures.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Imposiciones ({signatures.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {signatures.map((sig) => {
                const occupied = sig.cells.filter((c) => c.sourcePageId).length
                return (
                  <div
                    key={sig.id}
                    onClick={() => setActiveSignature(sig.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeSignatureId === sig.id
                        ? 'bg-impositor-50 border border-impositor-200'
                        : 'bg-white border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900">{sig.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {sig.nrows}x{sig.ncols} • {occupied}/{sig.cells.length} celdas ocupadas
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSignature(sig.id)
                      }}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Páginas fuente */}
        {sourceArrayBuffer && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Páginas fuente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-slate-500 mb-2">
                {sourcePages.length} páginas disponibles
              </div>
              <div className="text-xs text-slate-500">
                Arrastrá una página a una celda del pliego.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={() => downloadPPML()}
              disabled={signatures.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar plantilla (.impp)
            </Button>
            <Button
              className="w-full"
              onClick={() => exportPdf(`${sheetName || 'imposicion'}.pdf`)}
              disabled={!sourceArrayBuffer || signatures.length === 0 || isExporting || assignedCount === 0}
            >
              {isExporting ? (
                <>
                  <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                  Generando PDF…
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Exportar PDF impuesto
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </aside>

      {/* ===== Área principal: pliego + vista previa ===== */}
      <main className="flex-1 bg-slate-100 p-6 overflow-hidden flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Editor de imposición — {activeSig ? activeSig.name : 'Sin imposición creada'}
            </h1>
            <p className="text-slate-500 text-sm">
              {assignedCount}/{totalCells} celdas ocupadas •
              {sourceArrayBuffer ? `${sourcePages.length} páginas fuente` : 'Sin PDF'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-3 h-3 mr-1" />
              Volver a inicio
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* Vista previa grande del pliego */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pliego — vista previa
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">
                  {(sheetTemplate.sheetWidth * 0.352778).toFixed(2)} × {(sheetTemplate.sheetHeight * 0.352778).toFixed(2)} mm
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 rounded-lg border border-slate-200 p-2 relative">
              <SheetCanvas
                nrows={activeSig ? activeSig.nrows : nrows}
                ncols={activeSig ? activeSig.ncols : ncols}
                sourceArrayBuffer={sourceArrayBuffer}
                selectedPageId={selectedPageId}
                activeSignatureId={activeSignatureId}
                signatures={signatures}
                onPageSelect={handlePageSelect}
                onAssign={handleAssign}
                onClear={clearCell}
                onRotationChange={handleRotationChange}
                onFaceChange={handleFaceChange}
                onPageOrderChange={handlePageOrderChange}
                className="w-full max-w-[900px] mx-auto"
              />
            </div>
          </div>

          {/* Panel derecho: páginas fuente (solo si no hay PDF cargado en el canvas) */}
          {sourceArrayBuffer && (
            <div className="w-72 flex-shrink-0 flex flex-col">
              <PdfPreview
                className="flex-1 min-h-0"
                onPageSelect={handlePageSelect}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
