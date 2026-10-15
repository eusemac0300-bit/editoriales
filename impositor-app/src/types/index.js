/**
 * Modelo de datos de la app de imposición.
 * Inspirado en el formato PPML/.impp de HP SmartStream Designer.
 */

// Una página del documento fuente (PDF importado)
export const createSourcePage = (index, file, arrayBuffer, thumbnailUrl) => ({
  id: `page-${index}`,
  index, // número de página en el documento fuente (1-based)
  file, // File del PDF original
  arrayBuffer, // ArrayBuffer del PDF completo (para renderizar con pdf.js)
  thumbnailUrl, // URL de miniatura (opcional)
  width: null, // ancho en puntos (PDF points)
  height: null, // alto en puntos
})

// Celda del pliego (posición donde va una página)
export const createCell = (row, col, face = 'Up', rotation = 0) => ({
  id: `cell-r${row}c${col}-${face}`,
  row,
  col,
  face, // 'Up' | 'Dn' (cara de la hoja)
  rotation, // 0 | 90 | 180 | 270
  sourcePageId: null, // id de la página fuente asignada
  pageOrder: null, // fórmula o índice de orden
})

// Firma del pliego (grupo de celdas)
export const createSignature = (name, nrows, ncols, pageCount) => ({
  id: `sig-${name}`,
  name,
  nrows,
  ncols,
  pageCount, // páginas por firma
  cells: [],
})

// Plantilla de hoja completa
export const createSheetTemplate = () => ({
  name: 'Nueva plantilla',
  sheetWidth: 595.28, // A4 en puntos
  sheetHeight: 841.89,
  trimBox: { x: 0, y: 0, width: 595.28, height: 841.89 },
  nCopies: 1,
  collate: 'Job',
  signatures: [],
  marks: {
    trim: [],
    fold: [],
    register: [],
  },
  // Opciones de salida
  imposition: {
    mode: 'manual', // 'manual' | 'auto'
    preset: null, // '2up' | '4up' | 'nup' | 'booklet'
    nUp: 1,
    gutter: 0, // espacio entre celdas en pt
    margin: 36, // margen en pt
  },
})

// Presets de imposición automática (estilo SmartStream Designer)
export const IMPOSITION_PRESETS = {
  '2up': {
    label: '2 páginas por hoja',
    nrows: 1,
    ncols: 2,
    pageCount: 2,
    description: 'Dos páginas fuente lado a lado en cada hoja',
  },
  '4up': {
    label: '4 páginas por hoja',
    nrows: 2,
    ncols: 2,
    pageCount: 4,
    description: 'Cuatro páginas fuente en una hoja (2x2)',
  },
  'nup': {
    label: 'N páginas por hoja',
    nrows: 2,
    ncols: 3,
    pageCount: 6,
    description: 'Cuadrícula personalizable de páginas',
  },
  'booklet': {
    label: 'Folleto / Libro',
    nrows: 2,
    ncols: 2,
    pageCount: 4,
    description: 'Imposición para plegado y grapado (firma de 4 páginas)',
  },
}

// Estado global de la imposición
export const createImpositionState = () => ({
  sourceFile: null,
  sourceArrayBuffer: null,
  sourcePages: [],
  selectedPageId: null,
  sheetTemplate: createSheetTemplate(),
  activeSignatureId: null,
  // resultado final
  outputPdfUrl: null,
})
