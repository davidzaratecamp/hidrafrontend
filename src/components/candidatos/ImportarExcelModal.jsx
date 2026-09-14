import { useState } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { Boton, Modal } from '../ui'
import { descargarBlob } from '../../utils/descargar'
import api from '../../services/api'

/**
 * Carga masiva de candidatos desde un Excel.
 *
 * Cada fila termina exactamente igual que un candidato creado a mano en
 * "Nuevo Candidato" (mismos campos, mismo dueño = quien sube el archivo).
 * Todo o nada: si una sola fila del archivo tiene un error, no se registra
 * ningún candidato — por eso el error se muestra como una lista por fila en
 * vez de un mensaje genérico, para poder corregir el archivo de una sola vez.
 */
export default function ImportarExcelModal({ onCerrar, onImportado }) {
  const [archivo, setArchivo] = useState(null)
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false)
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState(null)
  const [erroresPorFila, setErroresPorFila] = useState(null)

  async function descargarPlantilla() {
    setDescargandoPlantilla(true)
    setError(null)
    try {
      const blob = await api.get('/candidatos/plantilla-importacion')
      descargarBlob(blob, 'plantilla-candidatos.xlsx')
    } catch (e) {
      setError(e.message)
    } finally {
      setDescargandoPlantilla(false)
    }
  }

  async function importar() {
    if (!archivo) return
    setImportando(true)
    setError(null)
    setErroresPorFila(null)
    try {
      const formData = new FormData()
      formData.append('archivo', archivo)
      const resultado = await api.postFormData('/candidatos/importar-excel', formData)
      onImportado(resultado.creados)
    } catch (e) {
      if (e.codigo === 'ERRORES_EN_ARCHIVO') {
        setErroresPorFila(e.detalles.filas)
      } else {
        setError(e.message)
      }
    } finally {
      setImportando(false)
    }
  }

  return (
    <Modal
      titulo="Cargar candidatos desde Excel"
      descripcion="Cada fila se registra igual que si vinieras aquí a crear un candidato uno por uno, incluyendo Citado."
      onCerrar={onCerrar}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Download className="h-5 w-5 shrink-0 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Empieza por la plantilla</p>
            <p className="mt-0.5 text-sm text-blue-800">
              Trae las columnas exactas y una hoja de referencia con los códigos válidos de
              Campaña, Cargo, Tipo de Documento, etc.
            </p>
          </div>
          <Boton
            type="button"
            variante="secundario"
            className="!py-1.5 whitespace-nowrap"
            onClick={descargarPlantilla}
            cargando={descargandoPlantilla}
          >
            Descargar plantilla
          </Boton>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Archivo (.xlsx)</span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null)
              setError(null)
              setErroresPorFila(null)
            }}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:text-blue-700"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {erroresPorFila && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm font-medium text-red-900">
                El archivo tiene errores — no se registró ningún candidato. Corrige y vuelve a
                subirlo.
              </p>
            </div>
            <ul className="mt-2 space-y-1.5 pl-6 text-sm text-red-800">
              {erroresPorFila.map((f) => (
                <li key={f.fila} className="list-disc">
                  <span className="font-medium">Fila {f.fila}:</span> {f.errores.join('; ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar} disabled={importando}>
            Cancelar
          </Boton>
          <Boton type="button" onClick={importar} cargando={importando} disabled={!archivo}>
            <Upload className="h-4 w-4" /> Importar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
