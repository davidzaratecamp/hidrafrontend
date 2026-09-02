import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardCheck, Download, Eye, Mail, Phone, PhoneCall, UserCheck, UserPlus, Users } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, BotonEnlace, Error, Etiqueta, Progreso } from '../ui'
import { esCargoAgente, fecha, nombreDe } from '../ui/formato'
import { Buscador, CeldaDoble, Filtros, Tabla } from '../ui/Tabla'
import { useAuth } from '../../context/useAuth'
import { useCatalogos } from '../../hooks/useCatalogos'
import { useRecurso, useRecursoPaginado } from '../../hooks/useRecurso'
import { useBusquedaDiferida } from '../../hooks/useBusquedaDiferida'
import api from '../../services/api'
import { ModalAsistencia, ModalSeguimiento } from '../seleccion/modales'
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
 */
const SIEMPRE_VISIBLES = ['formularios_enviados', 'formularios_completados', 'citado', 'entrevistado']

/** Los seis pasos del formulario que llena el candidato. */
const PASOS_FORMULARIO = 6

export default function ListaCandidatos() {
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

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () =>
      api.getConMeta(
        `/candidatos${api.qs({ pagina, porPagina: 20, estado, cliente, busqueda, agentes: soloAgentes || undefined })}`
      ),
    [pagina, estado, cliente, busqueda, soloAgentes]
  )

  const { datos: resumen } = useRecurso(() => api.get('/candidatos/resumen-estados'), [busqueda], {
    inicial: [],
  })

  const visibles = (resumen ?? []).filter(
    (e) => e.total > 0 || SIEMPRE_VISIBLES.includes(e.estado)
  )
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
              pendiente. */}
          {c.estado === 'citado' && hasPermission('registrar_asistencia') && (
            <Boton
              variante="secundario"
              className="!py-1.5 whitespace-nowrap"
              onClick={() => setModal({ tipo: 'seguimiento', candidato: c })}
            >
              <PhoneCall className="h-4 w-4" /> Seguimiento
            </Boton>
          )}
          {/* Reenviar el link del formulario: disponible para cualquier
              candidato (Agente o no) y en cualquier etapa del embudo, igual
              que el botón del perfil. Reenviar no pierde lo que el candidato
              ya diligenció: el backend lo precarga (ver `abrirFormulario`). */}
          {hasPermission('reenviar_emails') && (
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
          <BotonEnlace to={`/candidatos/${c.id}`} className="!py-1.5 whitespace-nowrap">
            <Eye className="h-4 w-4" /> Ver perfil
          </BotonEnlace>
        </div>
      ),
    },
  ]

  return (
    <Layout
      titulo="Candidatos"
      descripcion="Tu cartera de candidatos por estado"
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
              cargo, así que es el que Selección necesita ubicar rápido. */}
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
          onListo={() => {
            setModal(null)
            recargar()
          }}
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
          onListo={() => {
            setModal(null)
            recargar()
          }}
        />
      )}

      {modal?.tipo === 'evaluar' && (
        <ModalEvaluacion
          candidatoId={modal.candidato.id}
          nombre={nombreDe(modal.candidato)}
          onCerrar={() => setModal(null)}
          onListo={() => {
            setModal(null)
            recargar()
          }}
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
