import { useEffect, useMemo, useState } from 'react'
import { Boton, Cargando, Error, Modal } from '../ui'
import { AreaTexto } from '../ui/campos'
import api from '../../services/api'

/**
 * Evaluación de entrevista.
 *
 * Los criterios se piden al backend (`GET /seleccion/criterios`): dejaron de ser
 * cinco columnas fijas, así que agregar o quitar uno no toca esta pantalla.
 *
 * El total que se muestra aquí es solo una previsualización para el evaluador.
 * El total real y la aprobación los calcula el SERVIDOR a partir de los puntajes
 * enviados; antes el cliente mandaba el total y el backend lo guardaba sin
 * recalcular, así que se podía enviar 100 con los criterios en cero.
 */

const UMBRAL = 71

export default function ModalEvaluacion({ candidatoId, nombre, onCerrar, onListo }) {
  const [criterios, setCriterios] = useState(null)
  const [puntajes, setPuntajes] = useState({})
  const [razonRechazo, setRazonRechazo] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/seleccion/criterios').then(setCriterios).catch((e) => setError(e.message))
  }, [])

  const resumen = useMemo(() => {
    if (!criterios) return { total: 0, maximo: 0, porcentaje: 0, completo: false }
    const maximo = criterios.reduce((s, c) => s + c.puntaje_maximo, 0)
    const total = criterios.reduce((s, c) => s + (Number(puntajes[c.codigo]) || 0), 0)
    const completo = criterios.every((c) => puntajes[c.codigo] !== undefined && puntajes[c.codigo] !== '')
    return {
      total,
      maximo,
      porcentaje: maximo > 0 ? Math.round((100 * total) / maximo * 100) / 100 : 0,
      completo,
    }
  }, [criterios, puntajes])

  const aprobaria = resumen.porcentaje >= UMBRAL

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidatoId}/evaluacion`, {
        puntajes: Object.fromEntries(
          Object.entries(puntajes).map(([codigo, valor]) => [codigo, Number(valor)])
        ),
        razonRechazo: razonRechazo.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Evaluación de entrevista" descripcion={nombre} onCerrar={onCerrar} ancho="max-w-xl">
      {!criterios ? (
        <Cargando alto="h-24" />
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            {criterios.map((c) => (
              <div key={c.codigo} className="flex items-center gap-4">
                <label htmlFor={`c-${c.codigo}`} className="flex-1 text-sm text-gray-700">
                  {c.nombre}
                  <span className="ml-1 text-xs text-gray-400">/ {c.puntaje_maximo}</span>
                </label>
                <input
                  id={`c-${c.codigo}`}
                  type="number"
                  min="0"
                  max={c.puntaje_maximo}
                  step="0.5"
                  value={puntajes[c.codigo] ?? ''}
                  onChange={(e) => setPuntajes((p) => ({ ...p, [c.codigo]: e.target.value }))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            ))}
          </div>

          <div
            className={`rounded-lg border px-4 py-3 ${
              !resumen.completo
                ? 'border-gray-200 bg-gray-50'
                : aprobaria
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold tabular-nums text-gray-900">
                {resumen.total} / {resumen.maximo}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({resumen.porcentaje}%)
                </span>
              </span>
            </div>
            {resumen.completo && (
              <p className="mt-1 text-xs text-gray-600">
                {aprobaria
                  ? `Alcanza el umbral de aprobación (${UMBRAL}%).`
                  : `Por debajo del umbral (${UMBRAL}%): debes indicar la razón del rechazo.`}
              </p>
            )}
          </div>

          {resumen.completo && !aprobaria && (
            <AreaTexto
              etiqueta="Razón del rechazo"
              requerido
              filas={2}
              value={razonRechazo}
              onChange={(e) => setRazonRechazo(e.target.value)}
            />
          )}

          <Error mensaje={error} />

          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton
              onClick={guardar}
              cargando={guardando}
              disabled={!resumen.completo || (!aprobaria && !razonRechazo.trim())}
            >
              Guardar evaluación
            </Boton>
          </div>
        </div>
      )}
    </Modal>
  )
}
