import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarPlus, ClipboardCheck, Download, PhoneCall, UserCheck } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta } from '../ui'
import { esCargoAgente, fecha } from '../ui/formato'
import { CeldaDoble, Filtros, Tabla } from '../ui/Tabla'
import { useAuth } from '../../context/useAuth'
import { useRecursoPaginado } from '../../hooks/useRecurso'
import api from '../../services/api'
import { ModalAsistencia, ModalCitar, ModalSeguimiento } from './modales'
import ModalDescargarExcel from './ModalDescargarExcel'
import PuntajeEvaluacion from './PuntajeEvaluacion'
import ModalEvaluacion from './ModalEvaluacion'

/**
 * Agenda de entrevistas del área de selección.
 *
 * El listado respeta la visibilidad por dueño en el backend: un reclutador ve
 * solo sus candidatos. El endpoint equivalente del sistema anterior devolvía la
 * base completa a cualquiera que pudiera leerlo.
 *
 * Citar dejó de llevar fecha de entrevista (decisión de negocio, 2026-08-30), así
 * que la columna y los filtros de fecha son ahora sobre la fecha EN QUE se citó
 * al candidato, no sobre cuándo será la entrevista.
 */

const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'asistio', etiqueta: 'Asistieron' },
  { valor: 'no_asistio', etiqueta: 'No asistieron' },
]

const TONO = { asistio: 'verde', no_asistio: 'rojo', pendiente: 'ambar' }
const TEXTO = { asistio: 'Asistió', no_asistio: 'No asistió' }

export default function Agenda() {
  const { hasPermission } = useAuth()

  const [asistio, setAsistio] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () =>
      api.getConMeta(
        `/seleccion/agenda${api.qs({ pagina, porPagina: 20, asistio, desde, hasta })}`
      ),
    [pagina, asistio, desde, hasta]
  )

  const cerrarYRecargar = () => {
    setModal(null)
    recargar()
  }

  const columnas = [
    {
      clave: 'fecha_citado',
      titulo: 'Citado el',
      render: (c) => <span className="whitespace-nowrap">{fecha(c.fecha_citado, true)}</span>,
    },
    {
      clave: 'candidato',
      titulo: 'Candidato',
      render: (c) => (
        <>
          <Link
            to={`/candidatos/${c.candidato_id}`}
            className="font-medium text-gray-900 hover:text-blue-600"
          >
            {c.primer_nombre} {c.primer_apellido}
          </Link>
          <p className="text-xs text-gray-500">{c.numero_documento ?? '—'}</p>
        </>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Campaña',
      render: (c) => <CeldaDoble principal={c.cliente} secundario={c.cargo} />,
    },
    // Columna "Reclutador" de la pantalla vieja: quién trajo al candidato, para
    // saber a quién preguntarle sin abrir el perfil.
    { clave: 'reclutador', titulo: 'Reclutador' },
    {
      clave: 'asistio',
      titulo: 'Asistencia',
      render: (c) => <Etiqueta texto={TEXTO[c.asistio] ?? 'Pendiente'} tono={TONO[c.asistio]} />,
    },
    {
      // Columna "Evaluación": el puntaje de la entrevista, cuando ya se evaluó.
      clave: 'evaluacion',
      titulo: 'Evaluación',
      render: (c) => <PuntajeEvaluacion candidato={c} />,
    },
    { clave: 'estado', titulo: 'Estado', render: (c) => <Etiqueta texto={c.estado_nombre ?? c.estado} /> },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      alineacion: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          {c.asistio === 'pendiente' && hasPermission('registrar_asistencia') && (
            <Boton
              variante="secundario"
              className="!py-1.5"
              onClick={() => setModal({ tipo: 'asistencia', candidato: c })}
            >
              <UserCheck className="h-4 w-4" /> Asistencia
            </Boton>
          )}
          {/* Seguimiento antes de la entrevista: si respondió la llamada y/o
              el WhatsApp/Global de confirmación, mientras sigue pendiente. */}
          {c.asistio === 'pendiente' && hasPermission('registrar_asistencia') && (
            <Boton
              variante="secundario"
              className="!py-1.5"
              onClick={() => setModal({ tipo: 'seguimiento', candidato: c })}
            >
              <PhoneCall className="h-4 w-4" /> Seguimiento
            </Boton>
          )}
          {/* Evaluar solo tiene sentido tras la entrevista, y solo para cargo
              Agente (decisión de negocio, 2026-08-31): el resto pasa directo
              a Decisión Final, sin la calificación de 5 criterios. El backend
              también lo exige. */}
          {c.estado === 'entrevistado' && hasPermission('evaluar_candidatos') && esCargoAgente(c.cargo) && (
            <Boton className="!py-1.5" onClick={() => setModal({ tipo: 'evaluar', candidato: c })}>
              <ClipboardCheck className="h-4 w-4" /> Evaluar
            </Boton>
          )}
        </div>
      ),
    },
  ]

  return (
    <Layout
      titulo="Agenda de entrevistas"
      descripcion="Citaciones, asistencia y evaluación"
      acciones={
        <div className="flex gap-2">
          {hasPermission('generar_reportes_seleccion') && (
            <Boton variante="secundario" onClick={() => setModal({ tipo: 'excel' })}>
              <Download className="h-4 w-4" /> Descargar Excel
            </Boton>
          )}
          {hasPermission('agendar_entrevistas') && (
            <Boton onClick={() => setModal({ tipo: 'citar' })}>
              <CalendarPlus className="h-4 w-4" /> Citar candidato
            </Boton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Filtros
            opciones={FILTROS}
            valor={asistio}
            onCambio={(v) => {
              setAsistio(v)
              setPagina(1)
            }}
          />
          {/* El rango es sobre la fecha en que se citó, no sobre una fecha de
              entrevista: citar ya no lleva fecha. */}
          {[
            ['Citados desde', desde, setDesde],
            ['hasta', hasta, setHasta],
          ].map(([etiqueta, valor, asignar]) => (
            <label key={etiqueta} className="text-sm text-gray-600">
              {etiqueta}
              <input
                type="date"
                value={valor}
                onChange={(e) => {
                  asignar(e.target.value)
                  setPagina(1)
                }}
                className="ml-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </label>
          ))}
        </div>

        <Error mensaje={error} onReintentar={recargar} />

        <Tabla
          columnas={columnas}
          filas={items}
          clave={(c) => c.citacion_id}
          cargando={cargando}
          meta={meta}
          onPagina={setPagina}
          iconoVacio={CalendarClock}
          vacio="No hay entrevistas con estos filtros."
        />
      </div>

      {modal?.tipo === 'citar' && (
        <ModalCitar onCerrar={() => setModal(null)} onListo={cerrarYRecargar} />
      )}
      {modal?.tipo === 'excel' && (
        <ModalDescargarExcel
          reporte="citados"
          titulo="Descargar citados"
          descripcion="Formato oficial BASE RECLUTAMIENTO. El rango es obligatorio."
          fechasRequeridas
          desdeInicial={desde}
          hastaInicial={hasta}
          onCerrar={() => setModal(null)}
        />
      )}
      {modal?.tipo === 'asistencia' && (
        <ModalAsistencia
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={cerrarYRecargar}
        />
      )}
      {modal?.tipo === 'seguimiento' && (
        <ModalSeguimiento
          candidato={modal.candidato}
          onCerrar={() => setModal(null)}
          onListo={cerrarYRecargar}
        />
      )}
      {modal?.tipo === 'evaluar' && (
        <ModalEvaluacion
          candidatoId={modal.candidato.candidato_id}
          nombre={`${modal.candidato.primer_nombre} ${modal.candidato.primer_apellido}`}
          onCerrar={() => setModal(null)}
          onListo={cerrarYRecargar}
        />
      )}
    </Layout>
  )
}
