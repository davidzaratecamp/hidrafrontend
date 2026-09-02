import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarPlus,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  Gavel,
  Handshake,
  Mail,
  Phone,
  PhoneCall,
  UserCheck,
  UserCheck2,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, BotonEnlace, Error, Etiqueta, Progreso } from '../ui'
import { claseBotonSeguimiento, esCargoAgente, fecha, nombreDe, resultadoSeguimiento } from '../ui/formato'
import { Buscador, CeldaDoble, Filtros, Tabla } from '../ui/Tabla'
import { useAuth } from '../../context/useAuth'
import { useCatalogos } from '../../hooks/useCatalogos'
import { useRecurso, useRecursoPaginado } from '../../hooks/useRecurso'
import { useBusquedaDiferida } from '../../hooks/useBusquedaDiferida'
import api from '../../services/api'
import {
  ModalAprobacionEntrevista,
  ModalAprobacionJefeInmediato,
  ModalAprobacionPruebaTecnica,
  ModalAsistencia,
  ModalCitarCandidato,
  ModalContratacion,
  ModalDecision,
  ModalRecitar,
  ModalSeguimiento,
} from '../seleccion/modales'
import ModalEvaluacion from '../seleccion/ModalEvaluacion'
import ModalDescargarExcel from '../seleccion/ModalDescargarExcel'

/**
 * Listado de candidatos con pestañas por estado.
 *
 * Las pestañas se generan desde `resumen-estados`, que devuelve todos los
 * estados con su conteo. La versión anterior las tenía fijas en el código y por
 * eso un candidato ya evaluado desaparecía de la pantalla.
 *
 * El filtrado por dueño lo aplica el backend: aquí no hay lógica de visibilidad.
 *
 * `segmento="staff"` (usado por `CandidatosStaff.jsx`, menú "Candidatos
 * Staff") fija el filtro a cargos distintos de Agente en vez del toggle "Solo
 * Agentes" (decisión de negocio, 2026-09-02): reemplaza a la vista "Sin
 * evaluación (no Agente)" que tenía "Clínica Agentes" — de ahí que el botón
 * "Decidir" viva acá también, para quien tiene `tomar_decision_final`.
 */

/**
 * Estados que siempre tienen pestaña, aunque estén en cero.
 *
 * Los demás aparecen solo cuando hay candidatos, para no llenar la barra con los
 * dieciséis del catálogo. Estos cuatro son los que reclutamiento consulta a
 * diario, y una pestaña que desaparece al quedar en cero obliga a adivinar si el
 * filtro no existe o si de verdad no hay nadie en esa etapa. "Entrevistado" es
 * el estado al que pasa el candidato al marcarle "Asistió" (ver
 * `seleccion.service.js::marcarAsistencia`), así que es el filtro de "quién
 * asistió a la entrevista".
 *
 * El orden lo sigue dando el catálogo (`orden` de `estados_candidato`), así que
 * las pestañas se leen en el orden del embudo, no en el de esta lista.
 *
 * "No Asistió" se agregó a propósito al lado de "Citado" (decisión de negocio,
 * 2026-09-01): un candidato que falta a la entrevista sale del filtro
 * "Citado" y aparece acá, con la opción de volver a citarlo (ver columna
 * Acciones) — antes no había dónde encontrarlo sin usar "Todos".
 */
const SIEMPRE_VISIBLES = [
  'formularios_enviados',
  'formularios_completados',
  'citado',
  'no_asistio',
  'entrevistado',
]

/**
 * En "Candidatos Staff" (`segmento="staff"`) se quitan estas cuatro pestañas
 * de logística de citación (pedido explícito, 2026-09-02): esa gestión ya
 * vive en "Candidatos" (Reclutamiento); Staff se enfoca desde "Entrevistado"
 * en adelante, con las aprobaciones nuevas. Un candidato en uno de estos
 * estados sigue viéndose en "Todos", solo no tiene pestaña dedicada.
 */
const OCULTOS_STAFF = ['formularios_enviados', 'formularios_completados', 'citado', 'no_asistio']

/** Los seis pasos del formulario que llena el candidato. */
const PASOS_FORMULARIO = 6

export default function ListaCandidatos({ segmento }) {
  const navegar = useNavigate()
  const { hasPermission } = useAuth()
  const { catalogos } = useCatalogos()

  const [estado, setEstado] = useState('')
  const [cliente, setCliente] = useState('')
  const [soloAgentes, setSoloAgentes] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [enviandoEmailId, setEnviandoEmailId] = useState(null)

  const volverAPrimera = () => setPagina(1)
  const { texto, setTexto, busqueda } = useBusquedaDiferida(350, volverAPrimera)

  // "Candidatos Staff" fija el filtro de cargo: no hay toggle que lo cambie.
  const filtroCargo =
    segmento === 'staff' ? { staff: true } : { agentes: soloAgentes || undefined }

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () =>
      api.getConMeta(
        `/candidatos${api.qs({ pagina, porPagina: 20, estado, cliente, busqueda, ...filtroCargo })}`
      ),
    [pagina, estado, cliente, busqueda, soloAgentes, segmento]
  )

  const { datos: resumen, recargar: recargarResumen } = useRecurso(
    () => api.get('/candidatos/resumen-estados'),
    [busqueda],
    { inicial: [] }
  )

  /**
   * La tabla y los conteos de las pestañas son dos peticiones independientes
   * (`useRecurso` distintos). Cualquier acción que mueva a un candidato de
   * estado —asistencia, recitar, evaluar— tiene que refrescar las dos, o el
   * número de cada pestaña queda desactualizado hasta que alguien recargue la
   * página a mano.
   */
  function recargarTodo() {
    setModal(null)
    recargar()
    recargarResumen()
  }

  const visibles = (resumen ?? []).filter((e) => {
    if (segmento === 'staff' && OCULTOS_STAFF.includes(e.estado)) return false
    return e.total > 0 || SIEMPRE_VISIBLES.includes(e.estado)
  })
  const total = (resumen ?? []).reduce((suma, e) => suma + e.total, 0)

  const pestanas = [
    { valor: '', etiqueta: 'Todos', total },
    ...visibles.map((e) => ({ valor: e.estado, etiqueta: e.nombre, total: e.total })),
  ]

  /** Reenvía el correo con el link del formulario. Mismo endpoint que usa el perfil. */
  async function enviarEmail(candidato) {
    setAviso(null)
    setEnviandoEmailId(candidato.id)
    try {
      const r = await api.post(`/candidatos/${candidato.id}/enviar-formulario`)
      setAviso({ tono: 'exito', texto: `Formulario enviado a ${r.destinatario}.` })
    } catch (e) {
      // Si el correo falló, el backend igual devuelve el enlace para compartirlo a mano.
      const enlace = e.detalles?.link
      setAviso({ tono: 'error', texto: enlace ? `${e.message}. Enlace: ${enlace}` : e.message })
    } finally {
      setEnviandoEmailId(null)
    }
  }

  const columnas = [
    {
      clave: 'candidato',
      titulo: 'Candidato',
      render: (c) => (
        <>
          <Link to={`/candidatos/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
            {nombreDe(c)}
          </Link>
          <p className="text-xs text-gray-500">{c.numero_documento ?? 'sin documento'}</p>
        </>
      ),
    },
    {
      // Columna "Contacto" del listado viejo: el celular y el correo juntos, para
      // poder llamar o escribir sin abrir el perfil.
      clave: 'contacto',
      titulo: 'Contacto',
      render: (c) => (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 whitespace-nowrap text-sm text-gray-900">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {c.celular}
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {c.email ?? 'sin correo'}
          </p>
        </div>
      ),
    },
    {
      clave: 'vacante',
      titulo: 'Campaña / cargo',
      render: (c) => <CeldaDoble principal={c.cliente} secundario={c.cargo} />,
    },
    {
      // Columna "Progreso": cuántos de los seis pasos del formulario ha cerrado.
      clave: 'progreso',
      titulo: 'Progreso',
      render: (c) => <Progreso valor={c.pasos_completados ?? 0} total={PASOS_FORMULARIO} />,
    },
    { clave: 'estado', titulo: 'Estado', render: (c) => <Etiqueta texto={c.estado_nombre} /> },
    { clave: 'reclutador_nombre', titulo: 'Reclutador' },
    { clave: 'created_at', titulo: 'Registrado', render: (c) => fecha(c.created_at) },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      alineacion: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          {/* Citar por primera vez: la máquina de estados ya permite
              'nuevo' -> 'citado' y 'formularios_completados' -> 'citado' (esta
              última sin pasar por el resto del embudo tampoco), pero hasta
              ahora no había botón para hacerlo desde acá — la única forma era
              marcar "Citado: Sí" al crear el candidato, sin poder corregirlo
              después (pedido explícito, 2026-09-02). */}
          {['nuevo', 'formularios_completados'].includes(c.estado) &&
            hasPermission('agendar_entrevistas') && (
              <Boton
                variante="secundario"
                className="!py-1.5 whitespace-nowrap"
                onClick={() => setModal({ tipo: 'citar', candidato: c })}
              >
                <CalendarPlus className="h-4 w-4" /> Citar
              </Boton>
            )}
          {/* Candidato citado y aún sin resolver: mismo criterio que la Agenda
              (`asistio === 'pendiente'`), solo que aquí no se trae la citación
              completa, así que se infiere del estado del candidato. */}
          {c.estado === 'citado' && hasPermission('registrar_asistencia') && (
            <Boton
              variante="secundario"
              className="!py-1.5 whitespace-nowrap"
              onClick={() => setModal({ tipo: 'asistencia', candidato: c })}
            >
              <UserCheck className="h-4 w-4" /> Asistencia
            </Boton>
          )}
          {/* Seguimiento antes de la entrevista: si respondió la llamada y/o
              el WhatsApp/Global de confirmación. Mismo criterio que
              "Asistencia" — solo tiene sentido mientras la citación sigue
              pendiente. El botón se pinta verde/rojo según el resultado. */}
          {c.estado === 'citado' && hasPermission('registrar_asistencia') && (
            <Boton
              variante="secundario"
              className={`!py-1.5 whitespace-nowrap ${claseBotonSeguimiento(
                resultadoSeguimiento(c.seguimiento_llamada, c.seguimiento_whatsapp)
              )}`}
              onClick={() => setModal({ tipo: 'seguimiento', candidato: c })}
            >
              <PhoneCall className="h-4 w-4" /> Seguimiento
            </Boton>
          )}
          {/* No asistió a la entrevista anterior: la máquina de estados ya
              permite reagendar (no_asistio -> citado), esto solo abre la
              puerta desde la interfaz. */}
          {c.estado === 'no_asistio' && hasPermission('agendar_entrevistas') && (
            <Boton
              variante="secundario"
              className="!py-1.5 whitespace-nowrap"
              onClick={() => setModal({ tipo: 'recitar', candidato: c })}
            >
              <CalendarPlus className="h-4 w-4" /> Citar
            </Boton>
          )}
          {/* Reenviar el link del formulario: disponible para cualquier
              candidato (Agente o no) y en cualquier etapa del embudo, igual
              que el botón del perfil. Reenviar no pierde lo que el candidato
              ya diligenció: el backend lo precarga (ver `abrirFormulario`).
              Fuera de "Candidatos Staff" (decisión de negocio, 2026-09-02):
              esa vista se llenó con las aprobaciones de abajo, y el reenvío
              de formulario sigue disponible en "Candidatos". */}
          {segmento !== 'staff' && hasPermission('reenviar_emails') && (
            <Boton
              variante="secundario"
              className="!py-1.5 whitespace-nowrap"
              onClick={() => enviarEmail(c)}
              cargando={enviandoEmailId === c.id}
            >
              <Mail className="h-4 w-4" /> Email
            </Boton>
          )}
          {/* Evaluar solo aplica a cargo Agente (decisión de negocio,
              2026-09-01): mismo criterio que la Agenda de entrevistas. */}
          {c.estado === 'entrevistado' && hasPermission('evaluar_candidatos') && esCargoAgente(c.cargo) && (
            <Boton
              variante="secundario"
              className="!py-1.5 whitespace-nowrap"
              onClick={() => setModal({ tipo: 'evaluar', candidato: c })}
            >
              <ClipboardCheck className="h-4 w-4" /> Evaluar
            </Boton>
          )}
          {/* Contraparte de "Evaluar" para cargo distinto a Agente: pasa
              directo de "entrevistado" a decisión final, sin evaluación (ver
              seleccion.service.js::decidir). Exclusivo de "Candidatos Staff"
              (decisión de negocio, 2026-09-02): con las tres aprobaciones de
              abajo ya viviendo ahí, "Decidir" en el listado general quedaba
              duplicado — hay dos lugares dedicados para decidir (acá para
              Staff, "Clínica Agentes" para Agente) y "Candidatos" no debe ser
              un tercero. */}
          {segmento === 'staff' &&
            c.estado === 'entrevistado' &&
            hasPermission('tomar_decision_final') &&
            !esCargoAgente(c.cargo) && (
              <Boton
                variante="secundario"
                className="!py-1.5 whitespace-nowrap"
                onClick={() => setModal({ tipo: 'decidir', candidato: c })}
              >
                <Gavel className="h-4 w-4" /> Decidir
              </Boton>
            )}
          {/* Las tres aprobaciones previas a la decisión final, exclusivas de
              "Candidatos Staff" (decisión de negocio, 2026-09-02): la
              contraparte, para Staff, de la evaluación de 5 criterios que
              solo aplica a Agente en "Clínica Agentes". Informativas — no
              bloquean "Decidir" — se pintan verde/rojo según lo ya guardado,
              mismo mecanismo que "Seguimiento". */}
          {segmento === 'staff' &&
            c.estado === 'entrevistado' &&
            hasPermission('tomar_decision_final') &&
            !esCargoAgente(c.cargo) && (
              <>
                <Boton
                  variante="secundario"
                  className={`!py-1.5 whitespace-nowrap ${claseBotonSeguimiento(
                    c.aprobacion_entrevista === true ? 'si' : c.aprobacion_entrevista === false ? 'no' : 'pendiente'
                  )}`}
                  onClick={() => setModal({ tipo: 'aprobacion-entrevista', candidato: c })}
                >
                  <UserCheck2 className="h-4 w-4" /> Aprobación entrevista
                </Boton>
                <Boton
                  variante="secundario"
                  className={`!py-1.5 whitespace-nowrap ${claseBotonSeguimiento(
                    c.aprobacion_jefe_inmediato === true
                      ? 'si'
                      : c.aprobacion_jefe_inmediato === false
                        ? 'no'
                        : 'pendiente'
                  )}`}
                  onClick={() => setModal({ tipo: 'aprobacion-jefe-inmediato', candidato: c })}
                >
                  <UserCog className="h-4 w-4" /> Aprobación jefe inmediato
                </Boton>
                <Boton
                  variante="secundario"
                  className={`!py-1.5 whitespace-nowrap ${claseBotonSeguimiento(
                    c.aprobacion_prueba_tecnica === true
                      ? 'si'
                      : c.aprobacion_prueba_tecnica === false
                        ? 'no'
                        : 'pendiente'
                  )}`}
                  onClick={() => setModal({ tipo: 'aprobacion-prueba-tecnica', candidato: c })}
                >
                  <FileCheck2 className="h-4 w-4" /> Aprobación prueba técnica
                </Boton>
              </>
            )}
          {/* Contratación: paso posterior a la decisión final aprobada,
              exclusivo Staff — contraparte de "Citar a formación" para
              Agente en "Clínica Agentes". */}
          {segmento === 'staff' &&
            c.estado === 'aprobado_final' &&
            hasPermission('tomar_decision_final') &&
            !esCargoAgente(c.cargo) && (
              <Boton
                variante="secundario"
                className={`!py-1.5 whitespace-nowrap ${claseBotonSeguimiento(
                  c.contratacion === true ? 'si' : c.contratacion === false ? 'no' : 'pendiente'
                )}`}
                onClick={() => setModal({ tipo: 'contratacion', candidato: c })}
              >
                <Handshake className="h-4 w-4" /> Contratación
              </Boton>
            )}
          <BotonEnlace to={`/candidatos/${c.id}`} className="!py-1.5 whitespace-nowrap">
            <Eye className="h-4 w-4" /> Ver perfil
          </BotonEnlace>
        </div>
      ),
    },
  ]

  return (
    <Layout
      titulo={segmento === 'staff' ? 'Candidatos Staff' : 'Candidatos'}
      descripcion={
        segmento === 'staff'
          ? 'Candidatos de campañas distintas a Agente'
          : 'Tu cartera de candidatos por estado'
      }
      acciones={
        <div className="flex gap-2">
          {/* Todos los candidatos de la base nueva, sin filtrar por citación
              ni decisión — FECHA es la de registro. Sin rango, los últimos 100. */}
          {hasPermission('generar_reportes_seleccion') && (
            <Boton variante="secundario" onClick={() => setModal({ tipo: 'excel-todos' })}>
              <Download className="h-4 w-4" /> Descargar Excel
            </Boton>
          )}
          {hasPermission('crear_candidatos') && (
            <Boton onClick={() => navegar('/candidatos/nuevo')}>
              <UserPlus className="h-4 w-4" /> Nuevo candidato
            </Boton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Filtros
          opciones={pestanas}
          valor={estado}
          onCambio={(v) => {
            setEstado(v)
            volverAPrimera()
          }}
        />

        <div className="flex flex-wrap gap-3">
          <Buscador
            valor={texto}
            onCambio={setTexto}
            placeholder="Buscar por nombre, documento, correo o celular…"
          />
          <select
            value={cliente}
            onChange={(e) => {
              setCliente(e.target.value)
              volverAPrimera()
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors hover:border-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Todas las campañas</option>
            {(catalogos.clientes ?? []).map((c) => (
              <option key={c.codigo} value={c.codigo}>
                {c.nombre}
              </option>
            ))}
          </select>
          {/* Filtro dedicado: la evaluación de entrevista solo aplica a este
              cargo, así que es el que Selección necesita ubicar rápido. Con
              `segmento` fijo (p. ej. "Candidatos Staff") el cargo ya no se
              elige acá, así que el toggle no tiene nada que hacer. */}
          {!segmento && (
            <button
              type="button"
              onClick={() => {
                setSoloAgentes((v) => !v)
                volverAPrimera()
              }}
              className={`rounded-lg border px-3 py-2 text-sm transition-all duration-150 active:scale-[0.97] ${
                soloAgentes
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              Solo Agentes
            </button>
          )}
        </div>

        <Error mensaje={error} onReintentar={recargar} />

        {aviso && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              aviso.tono === 'exito'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {aviso.texto}
          </div>
        )}

        <Tabla
          columnas={columnas}
          filas={items}
          cargando={cargando}
          meta={meta}
          onPagina={setPagina}
          iconoVacio={Users}
          vacio="No hay candidatos con estos filtros."
        />
      </div>

      {modal?.tipo === 'asistencia' && (
        <ModalAsistencia
          candidato={{
            candidato_id: modal.candidato.id,
            primer_nombre: modal.candidato.primer_nombre,
            primer_apellido: modal.candidato.primer_apellido,
          }}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'seguimiento' && (
        <ModalSeguimiento
          candidato={{
            candidato_id: modal.candidato.id,
            primer_nombre: modal.candidato.primer_nombre,
            primer_apellido: modal.candidato.primer_apellido,
          }}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'recitar' && (
        <ModalRecitar
          candidato={{
            candidato_id: modal.candidato.id,
            primer_nombre: modal.candidato.primer_nombre,
            primer_apellido: modal.candidato.primer_apellido,
          }}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'citar' && (
        <ModalCitarCandidato
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'evaluar' && (
        <ModalEvaluacion
          candidatoId={modal.candidato.id}
          nombre={nombreDe(modal.candidato)}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'decidir' && (
        <ModalDecision
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'aprobacion-entrevista' && (
        <ModalAprobacionEntrevista
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'aprobacion-jefe-inmediato' && (
        <ModalAprobacionJefeInmediato
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'aprobacion-prueba-tecnica' && (
        <ModalAprobacionPruebaTecnica
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'contratacion' && (
        <ModalContratacion
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={recargarTodo}
        />
      )}

      {modal?.tipo === 'excel-todos' && (
        <ModalDescargarExcel
          reporte="todos"
          titulo="Descargar candidatos"
          descripcion="Base nueva, sin filtrar por citación ni decisión. FECHA es la fecha de registro. Sin rango, trae los últimos 100 registrados."
          onCerrar={() => setModal(null)}
        />
      )}
    </Layout>
  )
}
