import { useState, useCallback } from 'react'
import { Upload, ArrowRight, File, Loader2, Info } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { useImposition } from '../hooks/useImposition.js'

// 1 pt = 0.352778 mm
const PT_TO_MM = 0.352778
const MM_TO_PT = 1 / 0.352778

export default function Home({ onStartImposition }) {
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { loadSourceFile, state } = useImposition()
  const { pageWidth, pageHeight, bleed } = state.sheetTemplate

  const ptToMm = (pt) => (pt * PT_TO_MM)

  const handleFileChange = useCallback(async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setIsLoading(true)
    try {
      const arrayBuffer = await f.arrayBuffer()
      loadSourceFile(f, arrayBuffer)
    } catch (err) {
      console.error('Error leyendo PDF:', err)
    } finally {
      setIsLoading(false)
    }
  }, [loadSourceFile])

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle>Importar documento fuente</CardTitle>
          <CardContent>
            Sube el PDF que deseas imponer. La app renderiza cada página con pdf.js
            y te permite distribuirlas sobre el pliego de impresión, inspirado en los
            presets .impp de SmartStream Designer.
          </CardContent>
        </CardHeader>

        <div className="p-6">
          <div
            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-impositor-300 hover:bg-impositor-50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('pdf-input').click()}
          >
            <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm text-slate-600">Haz clic o arrastra un PDF aquí</p>
            <p className="text-xs text-slate-400 mt-1">PDF de una o varias páginas</p>
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="mt-6 flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200">
              <File className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-700 truncate">{file.name}</span>
              <span className="ml-auto text-xs text-blue-600">
                {Math.round(file.size / 1024)} KB
              </span>
            </div>
          )}

          {isLoading && (
            <div className="mt-6 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-slate-600">Procesando PDF…</span>
            </div>
          )}

          {file && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Dimensiones detectadas del PDF
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Ancho terminado</div>
                  <div className="text-slate-900 font-medium">{ptToMm(pageWidth).toFixed(2)} mm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Alto terminado</div>
                  <div className="text-slate-900 font-medium">{ptToMm(pageHeight).toFixed(2)} mm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Sangrado (por lado)</div>
                  <div className="text-slate-900 font-medium">{ptToMm(bleed).toFixed(2)} mm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Total con sangre</div>
                  <div className="text-slate-900 font-medium">
                    {ptToMm(pageWidth + bleed * 2).toFixed(2)} × {ptToMm(pageHeight + bleed * 2).toFixed(2)} mm
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                El ancho y alto son el tamaño terminado (trim box). El sangrado se detecta del
                bleed box del PDF y se aplica por cada lado.
              </p>
            </div>
          )}
          <div className="mt-8 flex items-center justify-between">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ancho hoja terminado (mm)"
                defaultValue={ptToMm(pageWidth).toFixed(2)}
              />
              <Input
                label="Alto hoja terminado (mm)"
                defaultValue={ptToMm(pageHeight).toFixed(2)}
              />
            </div>
            <Button
              disabled={!file || isLoading}
              onClick={() => onStartImposition()}
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continuar al editor
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
