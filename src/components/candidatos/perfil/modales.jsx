import { useState } from 'react'
import { Boton, Cargando, Error, Modal } from '../../ui'
import { AreaTexto, Seleccion, Texto } from '../../ui/campos'
import { useRecurso } from '../../../hooks/useRecurso'
import api from '../../../services/api'

/** Modales de acción sobre un candidato: cambio de estado y reasignación. */

/**
 * Cambio de estado.
 *
 * Las opciones NO son la lista completa de estados: se piden al backend las
 * transiciones legales desde el estado actual. Con el modelo anterior este
 * desplegable ofrecía los 17 y permitía saltar de cualquiera a cualquiera.
 */
export function ModalEstado({ candidatoId, onCerrar, onListo }) {
  const { datos: opciones, error: errorCarga } = useRecurso(
    () => api.get(`/candidatos/${candidatoId}/transiciones`),
    [candidatoId]
  )

  const [estado, setEstado] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/candidatos/${candidatoId}/estado`, {
        estado,
        motivo: motivo.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo="Cambiar estado"
      descripcion={opciones ? `Estado actual: ${opciones.actual}` : undefined}
      onCerrar={onCerrar}
    >
      {errorCarga ? (
        <Error mensaje={errorCarga} />
      ) : !opciones ? (
        <Cargando alto="h-20" />
      ) : opciones.disponibles.length === 0 ? (
        <p className="text-sm text-gray-500">
          Este es un estado final: no admite más transiciones.
        </p>
      ) : (
        <div className="space-y-4">
          <Seleccion
            etiqueta="Nuevo estado"
            requerido
            opciones={opciones.disponibles.map((d) => ({ codigo: d, nombre: d }))}
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            ayuda="Solo se listan las transiciones válidas desde el estado actual."
          />
          <AreaTexto
            etiqueta="Motivo"
            filas={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            ayuda="Algunas transiciones lo exigen; queda en el historial."
          />
          <Error mensaje={error} />
          <div className="flex justify-end gap-2">
            <Boton variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton onClick={guardar} cargando={guardando} disabled={!estado}>
              Cambiar estado
            </Boton>
          </div>
        </div>
      )}
    </Modal>
  )
}

/** Reasignación a otro reclutador. */
export function ModalReasignar({ candidatoId, onCerrar, onListo }) {
  const { datos: reclutadores, error: errorCarga } = useRecurso(
    () => api.get('/usuarios/reclutadores'),
    [],
    { inicial: [] }
  )

  const [reclutadorId, setReclutadorId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/candidatos/${candidatoId}/reasignar`, {
        reclutadorId: Number(reclutadorId),
        motivo: motivo.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Reasignar candidato" onCerrar={onCerrar}>
      <div className="space-y-4">
        <Seleccion
          etiqueta="Nuevo reclutador"
          requerido
          // La carga actual se muestra para no sobrecargar a nadie sin verlo.
          opciones={(reclutadores ?? []).map((r) => ({
            codigo: String(r.id),
            nombre: `${r.nombreCompleto} (${r.cartera} candidatos)`,
          }))}
          value={reclutadorId}
          onChange={(e) => setReclutadorId(e.target.value)}
        />
        <Texto etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <Error mensaje={errorCarga ?? error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} cargando={guardando} disabled={!reclutadorId}>
            Reasignar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
