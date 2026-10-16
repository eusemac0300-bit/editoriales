/**
 * Hook de imposición.
 * Gestiona: carga de PDF fuente, plantilla de hoja, firmas, celdas,
 * asignación de páginas (drag & drop), rotación, cara, exportación PPML y PDF.
 */
import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import {
  createImpositionState,
  createSourcePage,
  createCell,
  createSignature,
  createSheetTemplate,
  IMPOSITION_PRESETS,
} from '../types/index.js'
import { sheetToPPML } from '../lib/ppml.js'
import { exportImposedPdf } from '../lib/pdf.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export function useImposition() {
  const [state, setState] = useState(createImpositionState())
  const [isExporting, setIsExporting] = useState(false)
  const [draggedPageId, setDraggedPageId] = useState(null)

  /* ---------- Carga de PDF fuente ---------- */
  const loadSourceFile = useCallback(async (file, arrayBuffer) => {
    let pageCount = 0
    let trimWidth = 595.28   // tamaño terminado (sin sangre) en pt
    let trimHeight = 841.89  // tamaño terminado (sin sangre) en pt
    let bleedWidth = 0       // ancho total incluyendo sangre en pt
    let bleedHeight = 0      // alto total incluyendo sangre en pt
    let bleed = 0            // sangre por lado en pt
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      pageCount = pdf.numPages

      const firstPage = await pdf.getPage(1)

      // Dimensiones del trim box (tamaño terminado del documento)
      const trimBox = firstPage.getTrimBox ? firstPage.getTrimBox() : null
      if (trimBox) {
        trimWidth = trimBox[2] - trimBox[0]
        trimHeight = trimBox[3] - trimBox[1]
      } else {
        const viewport = firstPage.getViewport({ scale: 1 })
        trimWidth = viewport.width
        trimHeight = viewport.height
      }

      // Dimensiones del bleed box (tamaño total incluyendo sangre)
      const bleedBox = firstPage.getBleedBox ? firstPage.getBleedBox() : null
      if (bleedBox) {
        bleedWidth = bleedBox[2] - bleedBox[0]
        bleedHeight = bleedBox[3] - bleedBox[1]
      } else {
        bleedWidth = trimWidth
        bleedHeight = trimHeight
      }

      // Calcular sangre por lado (diferencia entre bleed y trim, dividida entre 2)
      const horizontalBleed = (bleedWidth - trimWidth) / 2
      const verticalBleed = (bleedHeight - trimHeight) / 2
      bleed = Math.max(horizontalBleed, verticalBleed, 0)
    } catch (err) {
      console.error('Error contando páginas del PDF:', err)
      pageCount = 40 // fallback
    }

    const pages = Array.from({ length: pageCount }, (_, i) =>
      createSourcePage(i + 1, file, arrayBuffer)
    )
    setState((prev) => ({
      ...prev,
      sourceFile: file,
      sourceArrayBuffer: arrayBuffer,
      sourcePages: pages,
      selectedPageId: pages[0]?.id || null,
      sheetTemplate: {
        ...prev.sheetTemplate,
        // Tamaño terminado de la página (lo que se imprime realmente)
        pageWidth: trimWidth,
        pageHeight: trimHeight,
        // Sangrado detectado (por lado)
        bleed,
        // Dimensiones de la hoja pliego (usamos el tamaño terminado por defecto)
        sheetWidth: trimWidth,
        sheetHeight: trimHeight,
        trimBox: { x: 0, y: 0, width: trimWidth, height: trimHeight },
      },
    }))
  }, [])

  /* ---------- Presets de imposición automática ---------- */
  const applyPreset = useCallback((presetId) => {
    const preset = IMPOSITION_PRESETS[presetId]
    if (!preset) return

    setState((prev) => ({
      ...prev,
      sheetTemplate: {
        ...prev.sheetTemplate,
        imposition: {
          ...prev.sheetTemplate.imposition,
          mode: 'auto',
          preset: presetId,
        },
      },
    }))
  }, [])

  const autoDistribute = useCallback((signatureId) => {
    setState((prev) => {
      const { sourcePages, sheetTemplate } = prev
      const sig = sheetTemplate.signatures.find((s) => s.id === signatureId)
      if (!sig || sourcePages.length === 0) return prev

      const { nrows, ncols } = sig

      const signatures = sheetTemplate.signatures.map((s) => {
        if (s.id !== signatureId) return s
        const cells = []
        let pageIdx = 0

        // Distribución: llenar cara Up primero, luego Dn
        for (let row = 1; row <= nrows; row++) {
          for (let col = 1; col <= ncols; col++) {
            for (const face of ['Up', 'Dn']) {
              const sourcePageId = pageIdx < sourcePages.length
                ? sourcePages[pageIdx].id
                : null
              cells.push({
                ...createCell(row, col, face),
                sourcePageId,
                rotation: face === 'Dn' ? 180 : 0, // cara Dn volteada 180°
              })
              pageIdx++
            }
          }
        }
        return { ...s, cells }
      })

      return { ...prev, sheetTemplate: { ...sheetTemplate, signatures } }
    })
  }, [])

  /* ---------- Plantilla / firmas ---------- */

  /* ---------- Plantilla / firmas ---------- */
  const setSheetSize = useCallback((width, height) => {
    setState((prev) => ({
      ...prev,
      sheetTemplate: {
        ...prev.sheetTemplate,
        sheetWidth: width,
        sheetHeight: height,
      },
    }))
  }, [])

  const addSignature = useCallback((name, nrows, ncols, pageCount) => {
    const signature = createSignature(name, nrows, ncols, pageCount)
    const cells = []
    for (let row = 1; row <= nrows; row++) {
      for (let col = 1; col <= ncols; col++) {
        for (const face of ['Up', 'Dn']) {
          cells.push(createCell(row, col, face))
        }
      }
    }
    signature.cells = cells
    setState((prev) => ({
      ...prev,
      sheetTemplate: {
        ...prev.sheetTemplate,
        signatures: [...prev.sheetTemplate.signatures, signature],
      },
      activeSignatureId: signature.id,
    }))
    return signature
  }, [])

  const removeSignature = useCallback((id) => {
    setState((prev) => {
      const signatures = prev.sheetTemplate.signatures.filter((s) => s.id !== id)
      return {
        ...prev,
        sheetTemplate: { ...prev.sheetTemplate, signatures },
        activeSignatureId:
          prev.activeSignatureId === id ? signatures[0]?.id || null : prev.activeSignatureId,
      }
    })
  }, [])

  /* ---------- Celdas ---------- */
  const findCell = (signatures, cellId) => {
    for (const sig of signatures) {
      const cell = sig.cells.find((c) => c.id === cellId)
      if (cell) return { sig, cell }
    }
    return null
  }

  const assignPageToCell = useCallback((cellId, sourcePageId) => {
    setState((prev) => {
      const found = findCell(prev.sheetTemplate.signatures, cellId)
      if (!found) return prev
      const { sig, cell } = found
      const signatures = prev.sheetTemplate.signatures.map((s) => {
        if (s.id !== sig.id) return s
        return {
          ...s,
          cells: s.cells.map((c) =>
            c.id === cellId ? { ...c, sourcePageId } : c
          ),
        }
      })
      return { ...prev, sheetTemplate: { ...prev.sheetTemplate, signatures } }
    })
  }, [])

  const clearCell = useCallback((cellId) => {
    setState((prev) => {
      const signatures = prev.sheetTemplate.signatures.map((s) => ({
        ...s,
        cells: s.cells.map((c) =>
          c.id === cellId ? { ...c, sourcePageId: null } : c
        ),
      }))
      return { ...prev, sheetTemplate: { ...prev.sheetTemplate, signatures } }
    })
  }, [])

  const setCellRotation = useCallback((cellId, rotation) => {
    setState((prev) => {
      const signatures = prev.sheetTemplate.signatures.map((s) => {
        if (s.id !== prev.activeSignatureId && !s.cells.some((c) => c.id === cellId)) return s
        return {
          ...s,
          cells: s.cells.map((c) =>
            c.id === cellId ? { ...c, rotation } : c
          ),
        }
      })
      return { ...prev, sheetTemplate: { ...prev.sheetTemplate, signatures } }
    })
  }, [])

  const setCellFace = useCallback((cellId, face) => {
    setState((prev) => {
      const signatures = prev.sheetTemplate.signatures.map((s) => {
        if (!s.cells.some((c) => c.id === cellId)) return s
        return {
          ...s,
          cells: s.cells.map((c) =>
            c.id === cellId ? { ...c, face } : c
          ),
        }
      })
      return { ...prev, sheetTemplate: { ...prev.sheetTemplate, signatures } }
    })
  }, [])

  const setCellPageOrder = useCallback((cellId, pageOrder) => {
    setState((prev) => {
      const signatures = prev.sheetTemplate.signatures.map((s) => {
        if (!s.cells.some((c) => c.id === cellId)) return s
        return {
          ...s,
          cells: s.cells.map((c) =>
            c.id === cellId ? { ...c, pageOrder } : c
          ),
        }
      })
      return { ...prev, sheetTemplate: { ...prev.sheetTemplate, signatures } }
    })
  }, [])

  const setActiveSignature = useCallback((id) => {
    setState((prev) => ({ ...prev, activeSignatureId: id }))
  }, [])

  /* ---------- Selección / DnD ---------- */
  const selectPage = useCallback((pageId) => {
    setState((prev) => ({ ...prev, selectedPageId: pageId }))
  }, [])

  const setDragged = useCallback((id) => {
    setDraggedPageId(id)
  }, [])

  const dropPageOnCell = useCallback((cellId) => {
    if (!draggedPageId) return
    assignPageToCell(cellId, draggedPageId)
    setDraggedPageId(null)
  }, [draggedPageId, assignPageToCell])

  /* ---------- Exportación ---------- */
  const exportPdf = useCallback(async (filename = 'imposicion.pdf') => {
    if (!state.sourceArrayBuffer) return null
    setIsExporting(true)
    try {
      const bytes = await exportImposedPdf(state.sheetTemplate, state.sourceArrayBuffer)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setState((prev) => ({ ...prev, outputPdfUrl: url }))
      return url
    } finally {
      setIsExporting(false)
    }
  }, [state.sourceArrayBuffer, state.sheetTemplate])

  const downloadPPML = useCallback((filename = 'imposicion.impp') => {
    const xml = sheetToPPML(state.sheetTemplate, state.sourcePages)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [state.sheetTemplate, state.sourcePages])

  const loadPPML = useCallback((xml) => {
    // Placeholder para futura deserialización completa
    console.warn('Deserialización PPML no implementada aún')
  }, [])

  const reset = useCallback(() => {
    setState(createImpositionState())
    setDraggedPageId(null)
  }, [])

  return {
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
    loadPPML,
    applyPreset,
    autoDistribute,
    IMPOSITION_PRESETS,
    reset,
  }
}
