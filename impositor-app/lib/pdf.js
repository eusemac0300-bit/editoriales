/**
 * Utilidades de PDF.
 * - pdf-lib para generar el PDF impuesto final.
 * - (pendiente) integración con pdf.js para previsualizar páginas del PDF fuente.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Genera un PDF de prueba (placeholder) con una cuadrícula que representa
 * el pliego impuesto. Se debe reemplazar por la lógica real de composición
 * usando las páginas del PDF fuente importado.
 */
export async function generateImposedPdf(template, sourcePages) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([template.sheetWidth, template.sheetHeight])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { sheetWidth, sheetHeight } = template

  // Fondo del pliego
  page.drawRectangle({
    x: 0,
    y: 0,
    width: sheetWidth,
    height: sheetHeight,
    color: rgb(0.97, 0.97, 0.97),
  })

  page.drawText('Pliego impuesto', {
    x: 40,
    y: sheetHeight - 50,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.3),
  })

  page.drawText(`Hoja: ${sheetWidth} x ${sheetHeight} pt`, {
    x: 40,
    y: sheetHeight - 80,
    size: 12,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  // Dibuja celdas de firma
  template.signatures.forEach((sig) => {
    const cellW = sheetWidth / sig.ncols
    const cellH = sheetHeight / sig.nrows
    sig.cells.forEach((cell) => {
      const x = (cell.col - 1) * cellW
      const y = sheetHeight - cell.row * cellH
      const occupied = cell.sourcePageId
      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        borderColor: occupied ? rgb(0.2, 0.5, 1) : rgb(0.8, 0.8, 0.8),
        borderWidth: occupied ? 2 : 1,
        color: occupied ? rgb(0.93, 0.96, 1) : rgb(1, 1, 1),
      })
      if (occupied) {
        const source = sourcePages.find((p) => p.id === cell.sourcePageId)
        page.drawText(`Página ${source ? source.index : '?'}`, {
          x: x + 10,
          y: y + cellH / 2 - 6,
          size: 10,
          font,
          color: rgb(0.2, 0.5, 1),
        })
        page.drawText(`(${cell.face})`, {
          x: x + 10,
          y: y + cellH / 2 - 18,
          size: 8,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })
      }
    })
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

export function downloadPdf(bytes, filename = 'imposicion.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
