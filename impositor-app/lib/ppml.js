/**
 * Serialización / deserialización al formato PPML (.impp),
 * compatible con la estructura de HP SmartStream Designer.
 */

export function sheetToPPML(template, sourcePagesById) {
  const {
    name,
    sheetWidth,
    sheetHeight,
    trimBox,
    nCopies,
    collate,
    signatures,
    marks,
  } = template

  const sigXml = signatures
    .map(
      (sig) => `
    <IMPOSITION Name="${sig.name}" Rotation="0">
      <SIGNATURE Nrows="${sig.nrows}" Ncols="${sig.ncols}" PageCount="${sig.pageCount}">
        ${sig.cells
          .map(
            (cell) => `
          <CELL Row="${cell.row}" Col="${cell.col}" Face="${cell.face}" PageOrder="${cell.pageOrder || ''}" Rotation="${cell.rotation}">
          </CELL>
          `
          )
          .join('')}
        <HOR_TRIM_MARKS MarkDist="8.50394" AllowOnPage="No">
          ${marks.trim
            .filter((m) => m.orientation === 'HOR')
            .map((m) => `<OCCURRENCE_REF Ref="${m.ref}" Environment="SmartStream Designer" />`)
            .join('')}
        </HOR_TRIM_MARKS>
        <VER_TRIM_MARKS MarkDist="8.50394" AllowOnPage="No">
          ${marks.trim
            .filter((m) => m.orientation === 'VER')
            .map((m) => `<OCCURRENCE_REF Ref="${m.ref}" Environment="SmartStream Designer" />`)
            .join('')}
        </VER_TRIM_MARKS>
      </SIGNATURE>
    </IMPOSITION>
    `
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<PPML Creator="Impositor App">
  <PRIVATE_INFO Creator="Impositor App">
    version 1.0
  </PRIVATE_INFO>
  <REUSABLE_OBJECT>
    <!-- Marcas y objetos reutilizables -->
  </REUSABLE_OBJECT>
  <PRINT_LAYOUT Ncopies="${nCopies}" Collate="${collate}">
    <PAGE_LAYOUT TrimBox="0.00 0.00 ${trimBox.width} ${trimBox.height}">
    </PAGE_LAYOUT>
    <SHEET_LAYOUT Hsize="${sheetWidth}" Vsize="${sheetHeight}" GangDocuments="No">
      ${sigXml}
    </SHEET_LAYOUT>
  </PRINT_LAYOUT>
</PPML>
`
}

export function downloadPPML(xml, filename = 'imposicion.impp') {
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
