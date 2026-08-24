import { useState } from 'react'
import { FileSpreadsheet, X, Download, Loader2 } from 'lucide-react'

// Modal de descarga de Excel reutilizado por CandidatosSeleccion.jsx (citados) y
// PerfilesAprobados.jsx (aprobados) - solo cambia qué callback de descarga y si las fechas son
// obligatorias. Mantiene su propio estado de fechas (prellenado con los filtros activos de la
// pantalla) para poder ajustar el rango justo antes de exportar sin tocar el filtro visible.
export default function ModalDescargarExcel({
  open,
  onClose,
  onDescargar,
  fechasRequeridas = false,
  fechaDesdeInicial = '',
  fechaHastaInicial = '',
  titulo = 'Descargar Excel',
  descripcion = 'Elige el rango de fechas para generar el archivo.'
}) {
  const [fechaDesde, setFechaDesde] = useState(fechaDesdeInicial)
  const [fechaHasta, setFechaHasta] = useState(fechaHastaInicial)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleClose = () => {
    if (descargando) return
    setError('')
    onClose()
  }

  const handleDescargar = async () => {
    if (fechasRequeridas && (!fechaDesde || !fechaHasta)) {
      setError('Selecciona fecha desde y fecha hasta')
      return
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta"')
      return
    }

    setError('')
    setDescargando(true)
    try {
      await onDescargar(fechaDesde, fechaHasta)
      onClose()
    } catch (err) {
      setError(err?.message || 'No se pudo generar el Excel')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Encabezado con icono estilo Excel */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 px-6 pt-8 pb-10 text-center">
          <button
            onClick={handleClose}
            disabled={descargando}
            className="absolute top-4 right-4 text-white/80 hover:text-white disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
            <FileSpreadsheet className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
          </div>
          <h3 className="text-white text-lg font-semibold">{titulo}</h3>
          <p className="text-emerald-50 text-sm mt-1 px-2">{descripcion}</p>
        </div>

        {/* Cuerpo */}
        <div className="p-6 -mt-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Desde{fechasRequeridas && ' *'}
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="input-field"
                  disabled={descargando}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hasta{fechasRequeridas && ' *'}
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="input-field"
                  disabled={descargando}
                />
              </div>
            </div>
            {!fechasRequeridas && (
              <p className="text-xs text-gray-400 mt-2">
                Opcional: deja las fechas en blanco para exportar todos los registros.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleClose}
              disabled={descargando}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDescargar}
              disabled={descargando}
              className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {descargando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {descargando ? 'Generando...' : 'Descargar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
