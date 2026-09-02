import { useEffect, useState } from 'react'
import { Boton, Error, Etiqueta, Modal } from '../ui'
import { AreaTexto, Seleccion, Texto } from '../ui/campos'
import { resultadoSeguimiento } from '../ui/formato'
import { useCatalogos } from '../../hooks/useCatalogos'
import api from '../../services/api'

/** Modales de la agenda: agendar entrevista y registrar asistencia. */

/**
 * Agenda una entrevista.
 *
 * Citar crea una CITACIÓN, no fija una columna suelta: por eso reagendar no pisa
 * el intento anterior y no puede existir un candidato "citado" sin fecha.
 */
/**
 * Citar ya no pide fecha (decisión de negocio, 2026-08-30): citar es marcar que
 * se citó. Solo hay que elegir a quién.
 */
export function ModalCitar({ onCerrar, onListo }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [elegido, setElegido] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (texto.trim().length < 3) {
      setResultados([])
      return undefined
    }
    let vigente = true
    const temporizador = setTimeout(async () => {
      try {
        const encontrados = await api.get(
          `/candidatos${api.qs({ busqueda: texto.trim(), porPagina: 8 })}`
        )
        if (vigente) setResultados(encontrados)
      } catch {
        if (vigente) setResultados([])
      }
    }, 300)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [texto])

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${elegido.id}/citacion`, {})
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Citar candidato" onCerrar={onCerrar}>
      <div className="space-y-4">
        {elegido ? (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {elegido.primer_nombre} {elegido.primer_apellido}
              </p>
              <p className="text-xs text-gray-500">
                {elegido.cliente} · {elegido.estado_nombre}
              </p>
            </div>
            <button onClick={() => setElegido(null)} className="text-sm text-blue-700 hover:underline">
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <Texto
              etiqueta="Buscar candidato"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Nombre, documento o correo"
              ayuda="Escribe al menos 3 caracteres."
            />
            {resultados.length > 0 && (
              <ul className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {resultados.map((c) => {
                  // A quien ya está citado no se le vuelve a citar: sin fecha
                  // que cambiar, una segunda citación solo dejaría dos
                  // pendientes. El backend lo rechaza igual (código YA_CITADO).
                  const yaCitado = c.estado === 'citado'
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setElegido(c)}
                        disabled={yaCitado}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:hover:bg-gray-50"
                      >
                        <p
                          className={`text-sm font-medium ${yaCitado ? 'text-gray-400' : 'text-gray-900'}`}
                        >
                          {c.primer_nombre} {c.primer_apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.numero_documento ?? '—'} ·{' '}
                          {yaCitado ? 'Ya está citado' : c.estado_nombre}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} cargando={guardando} disabled={!elegido}>
            Citar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Seguimiento de asistencia mientras la citación sigue pendiente: si el
 * candidato respondió la llamada y/o el mensaje de WhatsApp/Global de
 * confirmación previos a la entrevista.
 *
 * Los dos canales son independientes: se puede guardar el resultado de uno
 * solo (el backend deja el otro intacto, ver seleccion.repository.js). Al
 * abrir el modal se trae el estado ya guardado, para no perder lo que se
 * registró en un intento anterior.
 */
export function ModalSeguimiento({ candidato, onCerrar, onListo }) {
  const [llamada, setLlamada] = useState(null)
  const [whatsapp, setWhatsapp] = useState(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    api
      .get(`/seleccion/candidatos/${candidato.candidato_id}/seguimiento`)
      .then((actual) => {
        if (!vigente || !actual) return
        setLlamada(actual.llamada)
        setWhatsapp(actual.whatsapp)
      })
      .catch(() => {})
      .finally(() => vigente && setCargandoInicial(false))
    return () => {
      vigente = false
    }
  }, [candidato.candidato_id])

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.candidato_id}/seguimiento`, {
        llamada: llamada ?? undefined,
        whatsapp: whatsapp ?? undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const CANALES = [
    { clave: 'llamada', etiqueta: 'Llamada', valor: llamada, asignar: setLlamada },
    { clave: 'whatsapp', etiqueta: 'Global/WA', valor: whatsapp, asignar: setWhatsapp },
  ]

  return (
    <Modal
      titulo="Seguimiento de asistencia"
      descripcion={`${candidato.primer_nombre} ${candidato.primer_apellido}`}
      onCerrar={onCerrar}
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-500">
          ¿El candidato respondió al contacto de seguimiento antes de la entrevista?
        </p>

        {CANALES.map(({ clave, etiqueta, valor, asignar }) => (
          <div key={clave}>
            <p className="mb-2 text-sm font-medium text-gray-700">{etiqueta}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: true, t: 'Sí', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                { v: false, t: 'No', clase: 'border-red-500 bg-red-50 text-red-700' },
              ].map(({ v, t, clase }) => (
                <button
                  key={t}
                  type="button"
                  disabled={cargandoInicial}
                  onClick={() => asignar(v)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                    valor === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Resultado combinado: responder por cualquiera de los dos canales
            ya cuenta como seguimiento exitoso. Se muestra en vivo mientras se
            eligen las opciones, para que quede claro antes de guardar. */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">Resultado del seguimiento</p>
          <Etiqueta
            texto={{ si: 'Sí', no: 'No', pendiente: 'Pendiente' }[resultadoSeguimiento(llamada, whatsapp)]}
            tono={{ si: 'verde', no: 'rojo', pendiente: 'ambar' }[resultadoSeguimiento(llamada, whatsapp)]}
          />
        </div>

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            onClick={guardar}
            cargando={guardando}
            disabled={cargandoInicial || (llamada === null && whatsapp === null)}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Vuelve a citar a un candidato que no asistió a la entrevista anterior.
 *
 * Mismo endpoint que citar por primera vez: la máquina de estados ya permite
 * la transición `no_asistio -> citado` ("se reagenda", ver
 * db/seeds/002_estados_y_transiciones.sql) y la citación anterior, al estar
 * resuelta (no pendiente), no bloquea una nueva — el backend ya lo soportaba,
 * solo faltaba el punto de entrada en la interfaz.
 */
export function ModalRecitar({ candidato, onCerrar, onListo }) {
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.candidato_id}/citacion`, {})
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo="Volver a citar"
      descripcion={`${candidato.primer_nombre} ${candidato.primer_apellido}`}
      onCerrar={onCerrar}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          El candidato vuelve a la etapa "Citado", con una citación nueva e independiente de
          la anterior — la inasistencia previa queda en su historial, no se pierde.
        </p>
        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton onClick={confirmar} cargando={guardando}>
            Citar de nuevo
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/** Registra asistencia. Asistió → entrevistado; no asistió → motivo obligatorio. */
export function ModalAsistencia({ candidato, onCerrar, onListo }) {
  const { catalogos } = useCatalogos()
  const [asistio, setAsistio] = useState('')
  const [motivo, setMotivo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // El catálogo marca cuáles motivos piden un texto libre adicional.
  const motivoElegido = (catalogos.motivos_inasistencia ?? []).find((m) => m.codigo === motivo)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.candidato_id}/asistencia`, {
        asistio,
        motivoInasistencia: asistio === 'no_asistio' ? motivo : undefined,
        detalle: detalle.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const OPCIONES = [
    { v: 'asistio', t: 'Asistió', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
    { v: 'no_asistio', t: 'No asistió', clase: 'border-red-500 bg-red-50 text-red-700' },
  ]

  return (
    <Modal
      titulo="Registrar asistencia"
      descripcion={`${candidato.primer_nombre} ${candidato.primer_apellido}`}
      onCerrar={onCerrar}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {OPCIONES.map(({ v, t, clase }) => (
            <button
              key={v}
              onClick={() => setAsistio(v)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                asistio === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {asistio === 'no_asistio' && (
          <>
            <Seleccion
              etiqueta="Motivo de inasistencia"
              requerido
              opciones={catalogos.motivos_inasistencia}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            {motivoElegido?.requiere_detalle && (
              <Texto
                etiqueta="Detalle"
                requerido
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
              />
            )}
          </>
        )}

        <AreaTexto
          etiqueta="Observaciones"
          filas={2}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            onClick={guardar}
            cargando={guardando}
            disabled={!asistio || (asistio === 'no_asistio' && !motivo)}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
