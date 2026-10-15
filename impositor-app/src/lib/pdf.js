/**
 * Exportación PDF real usando pdf-lib.
 * Copia páginas del PDF fuente y las coloca en el pliego según la plantilla.
 */
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

/**
 * Genera el PDF impuesto final.
 * @param {Object} template - plantilla de hoja (sheetTemplate)
 * @param {ArrayBuffer} sourceArrayBuffer - PDF fuente completo
 * @returns {Promise<Uint8Array>} bytes del PDF impuesto
 */
export async function exportImposedPdf(template, sourceArrayBuffer) {
  const { sheetWidth, sheetHeight, signatures } = template

  const sourcePdf = await PDFDocument.load(sourceArrayBuffer)
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const sig of signatures) {
    const page = pdfDoc.addPage([sheetWidth, sheetHeight])

    // Fondo del pliego
    page.drawRectangle({
      x: 0,
      y: 0,
      width: sheetWidth,
      height: sheetHeight,
      color: rgb(0.97, 0.97, 0.97),
    })

    page.drawText(`Firma: ${sig.name}`, {
      x: 40,
      y: sheetHeight - 40,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.3),
    })

    const cellW = sheetWidth / sig.ncols
    const cellH = sheetHeight / sig.nrows

    for (const cell of sig.cells) {
      const x = (cell.col - 1) * cellW
      const y = sheetHeight - cell.row * cellH // pdf-lib: y desde abajo

      // Borde de celda
      const occupied = !!cell.sourcePageId
      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        borderColor: occupied ? rgb(0.2, 0.5, 1) : rgb(0.8, 0.8, 0.8),
        borderWidth: occupied ? 2 : 1,
        color: occupied ? rgb(0.93, 0.96, 1) : rgb(1, 1, 1),
      })

      if (!occupied) continue

      const sourceIndex = stateSourceIndex(cell.sourcePageId)
      if (sourceIndex == null) continue

      // Insertar la página fuente en el pliego (drawPage requiere un PDFEmbeddedPage,
      // que devuelve embedPdf; copyPages devuelve un PDFPage y fallaría)
      const [embeddedPage] = await pdfDoc.embedPdf(sourcePdf, [sourceIndex])

      const { width: srcW, height: srcH } = embeddedPage.size()
      const scale = Math.min(cellW / srcW, cellH / srcH)
      const drawW = srcW * scale
      const drawH = srcH * scale

      // Centrar en la celda y aplicar rotación (0, 90, 180, 270)
      page.drawPage(embeddedPage, {
        x: x + (cellW - drawW) / 2,
        y: y + (cellH - drawH) / 2,
        xScale: scale,
        yScale: scale,
        rotate: degrees(cell.rotation || 0),
      })

      // Etiqueta de página
      page.drawText(`P${sourceIndex + 1}`, {
        x: x + 6,
        y: y + 6,
        size: 8,
        font,
        color: rgb(0.2, 0.5, 1),
      })
    }
  }

  return await pdfDoc.save()
}

/**
 * Helper interno: dado un sourcePageId, devuelve el índice (0-based) en el PDF fuente.
 * Como no tenemos acceso directo a sourcePages aquí, lo resolvemos desde el id.
 */
function stateSourceIndex(sourcePageId) {
  const match = String(sourcePageId).match(/page-(\d+)/)
  return match ? parseInt(match[1], 10) - 1 : null
}

export function downloadPdfBytes(bytes, filename = 'imposicion.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
