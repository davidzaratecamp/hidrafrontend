import { useEffect, useState } from 'react'
import { Boton, Error, Etiqueta, Modal } from '../ui'
import { AreaTexto, Seleccion, Texto } from '../ui/campos'
import { nombreDe, resultadoSeguimiento } from '../ui/formato'
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

/**
 * Cita por primera vez a un candidato que quedó sin citación —típicamente
 * porque se registró con "Citado: No" (queda en "nuevo", sin pasar por
 * Selección) o completó el formulario sin que lo citaran ("formularios
 * completados"). Mismo endpoint que `ModalRecitar`, pero sin la mención a una
 * inasistencia previa que acá no existe.
 *
 * Antes de esto, la única forma de arreglar un "Citado: No" era desde el
 * formulario de creación —el campo queda de solo lectura al editar (ver
 * `CandidatoCampos.jsx`), porque "citado" no es una marca suelta: crea una
 * citación real y mueve el estado (ver `citar.js`)—. Este botón es el
 * arreglo correcto: la transición `nuevo -> citado` y `formularios_completados
 * -> citado` ya eran válidas en la máquina de estados, solo faltaba el punto
 * de entrada en la interfaz (pedido explícito, 2026-09-02).
 */
export function ModalCitarCandidato({ candidato, onCerrar, onListo }) {
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.id}/citacion`, {})
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Citar candidato" descripcion={nombreDe(candidato)} onCerrar={onCerrar}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          El candidato pasa a la etapa "Citado", con una citación nueva.
        </p>
        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton onClick={confirmar} cargando={guardando}>
            Citar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Decisión final: aprobar o rechazar al candidato, con razón obligatoria al
 * rechazar. Compartido entre "Clínica Agentes" (evaluados/rechazados, cargo
 * Agente) y "Candidatos Staff" (cargo distinto a Agente, que llega directo a
 * "entrevistado" y pasa directo acá, sin evaluación — ver
 * seleccion.service.js::decidir). No vive en el listado general de
 * "Candidatos" (decisión de negocio, 2026-09-02): esos dos son los lugares
 * dedicados para decidir, "Candidatos" no es un tercero.
 */
export function ModalDecision({ candidato, onCerrar, onListo }) {
  const [aprobacion, setAprobacion] = useState(null)
  const [razon, setRazon] = useState('')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.id}/decision-final`, {
        aprobacion,
        razon: razon.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Decisión final" descripcion={nombreDe(candidato)} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, t: 'Aprobar', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { v: false, t: 'Rechazar', clase: 'border-red-500 bg-red-50 text-red-700' },
          ].map(({ v, t, clase }) => (
            <button
              key={t}
              onClick={() => setAprobacion(v)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                aprobacion === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AreaTexto
          etiqueta="Razón"
          requerido={aprobacion === false}
          filas={3}
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          ayuda={
            aprobacion === false
              ? 'Obligatoria al rechazar: queda en el expediente.'
              : 'Opcional al aprobar.'
          }
        />

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={aprobacion === false ? 'peligro' : 'primario'}
            onClick={guardar}
            cargando={guardando}
            disabled={aprobacion === null || (aprobacion === false && !razon.trim())}
          >
            Confirmar decisión
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Aprobación de entrevista: paso previo e informativo a la decisión final.
 * Guarda Sí/No (con razón obligatoria si es No) pero no mueve el estado del
 * candidato — a diferencia de `ModalDecision`. Aplica tanto a Agente
 * (evaluado, en "aprobado"/"rechazado") como a Staff ("entrevistado", sin
 * evaluación de criterios) — ver seleccion.service.js::aprobarEntrevista.
 */
export function ModalAprobacionEntrevista({ candidato, onCerrar, onListo }) {
  const [aprobacion, setAprobacion] = useState(
    candidato.aprobacion_entrevista === null || candidato.aprobacion_entrevista === undefined
      ? null
      : Boolean(candidato.aprobacion_entrevista)
  )
  const [razon, setRazon] = useState(candidato.aprobacion_entrevista_razon ?? '')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.id}/aprobacion-entrevista`, {
        aprobacion,
        razon: razon.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Aprobación entrevista" descripcion={nombreDe(candidato)} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, t: 'Sí', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { v: false, t: 'No', clase: 'border-red-500 bg-red-50 text-red-700' },
          ].map(({ v, t, clase }) => (
            <button
              key={t}
              onClick={() => setAprobacion(v)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                aprobacion === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AreaTexto
          etiqueta="Razón"
          requerido={aprobacion === false}
          filas={3}
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          ayuda={
            aprobacion === false
              ? 'Obligatoria si no se aprueba la entrevista.'
              : 'Opcional al aprobar.'
          }
        />

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={aprobacion === false ? 'peligro' : 'primario'}
            onClick={guardar}
            cargando={guardando}
            disabled={aprobacion === null || (aprobacion === false && !razon.trim())}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Aprobación del jefe inmediato o de la prueba técnica: mismo patrón que
 * `ModalAprobacionEntrevista`, exclusivo Staff. Un solo componente
 * parametrizado por `titulo`/`endpoint`/`campoActual`/`campoRazon` en vez de
 * repetir el mismo formulario dos veces.
 */
function ModalAprobacionSimple({ candidato, titulo, endpoint, campoActual, campoRazon, onCerrar, onListo }) {
  const [aprobacion, setAprobacion] = useState(
    candidato[campoActual] === null || candidato[campoActual] === undefined
      ? null
      : Boolean(candidato[campoActual])
  )
  const [razon, setRazon] = useState(candidato[campoRazon] ?? '')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.id}/${endpoint}`, {
        aprobacion,
        razon: razon.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={titulo} descripcion={nombreDe(candidato)} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, t: 'Sí', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { v: false, t: 'No', clase: 'border-red-500 bg-red-50 text-red-700' },
          ].map(({ v, t, clase }) => (
            <button
              key={t}
              onClick={() => setAprobacion(v)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                aprobacion === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AreaTexto
          etiqueta="Razón"
          requerido={aprobacion === false}
          filas={3}
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          ayuda={aprobacion === false ? 'Obligatoria si es No.' : 'Opcional al aprobar.'}
        />

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={aprobacion === false ? 'peligro' : 'primario'}
            onClick={guardar}
            cargando={guardando}
            disabled={aprobacion === null || (aprobacion === false && !razon.trim())}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

export function ModalAprobacionJefeInmediato({ candidato, onCerrar, onListo }) {
  return (
    <ModalAprobacionSimple
      candidato={candidato}
      titulo="Aprobación jefe inmediato"
      endpoint="aprobacion-jefe-inmediato"
      campoActual="aprobacion_jefe_inmediato"
      campoRazon="aprobacion_jefe_inmediato_razon"
      onCerrar={onCerrar}
      onListo={onListo}
    />
  )
}

export function ModalAprobacionPruebaTecnica({ candidato, onCerrar, onListo }) {
  return (
    <ModalAprobacionSimple
      candidato={candidato}
      titulo="Aprobación prueba técnica"
      endpoint="aprobacion-prueba-tecnica"
      campoActual="aprobacion_prueba_tecnica"
      campoRazon="aprobacion_prueba_tecnica_razon"
      onCerrar={onCerrar}
      onListo={onListo}
    />
  )
}

/**
 * Contratación: paso posterior e informativo a la decisión final aprobada,
 * exclusivo Staff — contraparte de "citar a formación" para cargo Agente.
 */
export function ModalContratacion({ candidato, onCerrar, onListo }) {
  const [contratado, setContratado] = useState(
    candidato.contratacion === null || candidato.contratacion === undefined
      ? null
      : Boolean(candidato.contratacion)
  )
  const [razon, setRazon] = useState(candidato.contratacion_razon ?? '')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/seleccion/candidatos/${candidato.id}/contratacion`, {
        contratado,
        razon: razon.trim() || undefined,
      })
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo="Contratación" descripcion={nombreDe(candidato)} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, t: 'Sí', clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { v: false, t: 'No', clase: 'border-red-500 bg-red-50 text-red-700' },
          ].map(({ v, t, clase }) => (
            <button
              key={t}
              onClick={() => setContratado(v)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                contratado === v ? clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <AreaTexto
          etiqueta="Razón"
          requerido={contratado === false}
          filas={3}
          value={razon}
          onChange={(e) => setRazon(e.target.value)}
          ayuda={contratado === false ? 'Obligatoria si no se contrata.' : 'Opcional al contratar.'}
        />

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={contratado === false ? 'peligro' : 'primario'}
            onClick={guardar}
            cargando={guardando}
            disabled={contratado === null || (contratado === false && !razon.trim())}
          >
            Guardar
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
