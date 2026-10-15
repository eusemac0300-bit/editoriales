import {
  RotateCw,
  RotateCcw,
  ArrowUpDown,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

/**
 * Controles de una celda seleccionada: rotación, cara (Up/Dn), limpiar.
 */
export default function CellControls({
  cell,
  onRotationChange,
  onFaceChange,
  onClear,
  onPageOrderChange,
}) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Celda {cell.row},{cell.col} ({cell.face})
        </span>
        <button
          onClick={onClear}
          className="text-rose-500 hover:text-rose-600 text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Limpiar
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Rotación</span>
            <span className="text-slate-400">{cell.rotation || 0}°</span>
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => onRotationChange(((cell.rotation || 0) - 90 + 360) % 360)}
              className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              title="Rotar -90°"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRotationChange(((cell.rotation || 0) + 90) % 360)}
              className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              title="Rotar +90°"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Cara de hoja</span>
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => onFaceChange('Up')}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cell.face === 'Up'
                  ? 'bg-impositor-100 text-impositor-700 border border-impositor-300'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Up
            </button>
            <button
              onClick={() => onFaceChange('Dn')}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cell.face === 'Dn'
                  ? 'bg-impositor-100 text-impositor-700 border border-impositor-300'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Dn
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span>Orden de página</span>
          </label>
          <input
            type="text"
            value={cell.pageOrder || ''}
            onChange={(e) => onPageOrderChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-impositor-500"
            placeholder="ej: 4*s-3"
          />
        </div>
      </div>
    </div>
  )
}
