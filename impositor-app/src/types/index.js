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

// Presets de imposición automática (tipos de HP SmartStream Designer / formato .impp)
// Referencia: https://developers.hp.com/smartstream-designer
export const IMPOSITION_PRESETS = {
  /* ========== N-UP (múltiples páginas por hoja) ========== */
  '2up': {
    label: '2-Up',
    nrows: 1,
    ncols: 2,
    pageCount: 2,
    description: 'Dos páginas fuente lado a lado en cada hoja',
  },
  '4up': {
    label: '4-Up',
    nrows: 2,
    ncols: 2,
    pageCount: 4,
    description: 'Cuatro páginas fuente en una hoja (2×2)',
  },
  '6up': {
    label: '6-Up',
    nrows: 2,
    ncols: 3,
    pageCount: 6,
    description: 'Seis páginas fuente en una hoja (2×3)',
  },
  '8up': {
    label: '8-Up',
    nrows: 2,
    ncols: 4,
    pageCount: 8,
    description: 'Ocho páginas fuente en una hoja (2×4)',
  },
  '10up': {
    label: '10-Up',
    nrows: 2,
    ncols: 5,
    pageCount: 10,
    description: 'Diez páginas fuente en una hoja (2×5)',
  },
  '12up': {
    label: '12-Up',
    nrows: 3,
    ncols: 4,
    pageCount: 12,
    description: 'Doce páginas fuente en una hoja (3×4)',
  },
  '16up': {
    label: '16-Up',
    nrows: 4,
    ncols: 4,
    pageCount: 16,
    description: 'Dieciséis páginas fuente en una hoja (4×4)',
  },
  '20up': {
    label: '20-Up',
    nrows: 4,
    ncols: 5,
    pageCount: 20,
    description: 'Veinte páginas fuente en una hoja (4×5)',
  },
  '24up': {
    label: '24-Up',
    nrows: 4,
    ncols: 6,
    pageCount: 24,
    description: 'Veinticuatro páginas fuente en una hoja (4×6)',
  },
  '32up': {
    label: '32-Up',
    nrows: 4,
    ncols: 8,
    pageCount: 32,
    description: 'Treinta y dos páginas fuente en una hoja (4×8)',
  },
  '40up': {
    label: '40-Up',
    nrows: 5,
    ncols: 8,
    pageCount: 40,
    description: 'Cuarenta páginas fuente en una hoja (5×8)',
  },
  '48up': {
    label: '48-Up',
    nrows: 6,
    ncols: 8,
    pageCount: 48,
    description: 'Cuarenta y ocho páginas fuente en una hoja (6×8)',
  },
  '64up': {
    label: '64-Up',
    nrows: 8,
    ncols: 8,
    pageCount: 64,
    description: 'Sesenta y cuatro páginas fuente en una hoja (8×8)',
  },

  /* ========== BOOKLET / FOLLETO (plegado y grapado) ========== */
  'booklet4': {
    label: 'Booklet 4 páginas',
    nrows: 2,
    ncols: 2,
    pageCount: 4,
    description: 'Folleto de 4 páginas para plegado y grapado',
  },
  'booklet8': {
    label: 'Booklet 8 páginas',
    nrows: 2,
    ncols: 4,
    pageCount: 8,
    description: 'Folleto de 8 páginas (2 hojas pliego, cara Up y Dn)',
  },
  'booklet12': {
    label: 'Booklet 12 páginas',
    nrows: 3,
    ncols: 4,
    pageCount: 12,
    description: 'Folleto de 12 páginas para plegado y grapado',
  },
  'booklet16': {
    label: 'Booklet 16 páginas',
    nrows: 4,
    ncols: 4,
    pageCount: 16,
    description: 'Folleto de 16 páginas para plegado y grapado',
  },
  'booklet20': {
    label: 'Booklet 20 páginas',
    nrows: 4,
    ncols: 5,
    pageCount: 20,
    description: 'Folleto de 20 páginas para plegado y grapado',
  },
  'booklet24': {
    label: 'Booklet 24 páginas',
    nrows: 4,
    ncols: 6,
    pageCount: 24,
    description: 'Folleto de 24 páginas para plegado y grapado',
  },
  'booklet28': {
    label: 'Booklet 28 páginas',
    nrows: 4,
    ncols: 7,
    pageCount: 28,
    description: 'Folleto de 28 páginas para plegado y grapado',
  },
  'booklet32': {
    label: 'Booklet 32 páginas',
    nrows: 4,
    ncols: 8,
    pageCount: 32,
    description: 'Folleto de 32 páginas para plegado y grapado',
  },
  'booklet36': {
    label: 'Booklet 36 páginas',
    nrows: 4,
    ncols: 9,
    pageCount: 36,
    description: 'Folleto de 36 páginas para plegado y grapado',
  },
  'booklet40': {
    label: 'Booklet 40 páginas',
    nrows: 5,
    ncols: 8,
    pageCount: 40,
    description: 'Folleto de 40 páginas para plegado y grapado',
  },

  /* ========== DOBLE CARA ========== */
  'work-and-turn': {
    label: 'Work and Turn',
    nrows: 2,
    ncols: 1,
    pageCount: 2,
    description: 'Imprime una cara, voltea la hoja sobre el eje vertical e imprime la otra',
  },
  'work-and-tumble': {
    label: 'Work and Tumble',
    nrows: 2,
    ncols: 1,
    pageCount: 2,
    description: 'Imprime una cara, gira la hoja sobre el eje horizontal e imprime la otra',
  },
  'sheetwise': {
    label: 'Sheetwise',
    nrows: 2,
    ncols: 1,
    pageCount: 2,
    description: 'Cada cara de la hoja se impone de forma independiente',
  },
  'perfecting': {
    label: 'Perfecting',
    nrows: 1,
    ncols: 1,
    pageCount: 1,
    description: 'Impresión a dos caras en una sola pasada',
  },
  'simplex': {
    label: 'Simplex',
    nrows: 1,
    ncols: 1,
    pageCount: 1,
    description: 'Impresión a una sola cara',
  },
  'duplex': {
    label: 'Duplex',
    nrows: 1,
    ncols: 1,
    pageCount: 1,
    description: 'Impresión a dos caras',
  },

  /* ========== OTROS ========== */
  'step-and-repeat': {
    label: 'Step and Repeat',
    nrows: 2,
    ncols: 2,
    pageCount: 1,
    description: 'Repite la misma imagen/página en todas las celdas del pliego',
  },
  'cut-and-stack': {
    label: 'Cut and Stack',
    nrows: 2,
    ncols: 2,
    pageCount: 4,
    description: 'Ordena páginas para apilar y cortar después de imprimir',
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
