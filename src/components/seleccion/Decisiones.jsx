import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Download, Gavel } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta, Modal } from '../ui'
import { esCargoAgente, fecha, nombreDe } from '../ui/formato'
import { CeldaDoble, Filtros, Tabla } from '../ui/Tabla'
import { AreaTexto } from '../ui/campos'
import { useAuth } from '../../context/useAuth'
import { useRecursoPaginado } from '../../hooks/useRecurso'
import api from '../../services/api'
import ModalDescargarExcel from './ModalDescargarExcel'
import PuntajeEvaluacion from './PuntajeEvaluacion'

/**
 * Evaluaciones y decisión final.
 *
 * Sustituye a `EvaluacionEntrevista.jsx` y a las pantallas separadas de perfiles
 * aprobados y rechazados: son el mismo listado con distinto filtro de estado, y
 * el backend ya expone el estado como dato.
 */

const VISTAS = [
  // La evaluación de 5 criterios solo aplica a cargo Agente (decisión de
  // negocio, 2026-08-31): el resto de cargos llega "entrevistado" y pasa
  // directo a decisión final, sin puntaje.
  { clave: 'entrevistado', etiqueta: 'Sin evaluación (no Agente)', descripcion: 'Pasan directo a decisión final' },
  { clave: 'aprobado', etiqueta: 'Pendientes de decisión', descripcion: 'Aprobaron la evaluación' },
  { clave: 'rechazado', etiqueta: 'Rechazados en evaluación', descripcion: 'No alcanzaron el umbral' },
  { clave: 'aprobado_final', etiqueta: 'Aprobados', descripcion: 'Decisión final favorable' },
  { clave: 'rechazado_final', etiqueta: 'Rechazados', descripcion: 'Decisión final desfavorable' },
]

/** Vistas donde ya existe decisión final, y por tanto quién decidió y por qué. */
const DECIDIDOS = ['aprobado_final', 'rechazado_final']

export default function Decisiones() {
  const { hasPermission } = useAuth()

  const [vista, setVista] = useState('aprobado')
  const [pagina, setPagina] = useState(1)
  const [decidiendo, setDecidiendo] = useState(null)
  const [descargando, setDescargando] = useState(false)

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () => api.getConMeta(`/candidatos${api.qs({ estado: vista, pagina, porPagina: 20 })}`),
    [vista, pagina]
  )

  const actual = VISTAS.find((v) => v.clave === vista)
  const puedeDecidir = hasPermission('tomar_decision_final')

  const tonoEstado = (estado) =>
    estado.startsWith('aprobado') ? 'verde' : estado.startsWith('rechazado') ? 'rojo' : 'gris'

  const columnas = [
    {
      clave: 'candidato',
      titulo: 'Candidato',
      render: (c) => (
        <>
          <Link to={`/candidatos/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
            {nombreDe(c)}
          </Link>
          <p className="text-xs text-gray-500">{c.numero_documento ?? '—'}</p>
        </>
      ),
    },
    {
      clave: 'cliente',
      titulo: 'Campaña / cargo',
      render: (c) => <CeldaDoble principal={c.cliente} secundario={c.cargo} />,
    },
    // Columna "Reclutador" de las pantallas viejas de perfiles.
    { clave: 'reclutador_nombre', titulo: 'Reclutador' },
    {
      // "Puntaje Total" / "Puntaje Obtenido": el resultado de la entrevista, que
      // es de lo que trata esta pantalla y obligaba a abrir cada perfil.
      clave: 'puntaje',
      titulo: 'Puntaje',
      render: (c) => <PuntajeEvaluacion candidato={c} conPorcentaje />,
    },
    {
      clave: 'fecha_evaluacion',
      titulo: 'Evaluado',
      render: (c) => fecha(c.fecha_evaluacion),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (c) => <Etiqueta texto={c.estado_nombre} tono={tonoEstado(c.estado)} />,
    },
    // Las dos últimas columnas solo tienen sentido cuando ya hay decisión final:
    // en "Pendientes de decisión" saldrían vacías para todas las filas. La
    // pantalla vieja las tenía porque eran listados separados.
    ...(DECIDIDOS.includes(vista)
      ? [
          {
            clave: 'decision_psicologo',
            titulo: 'Decidió',
            render: (c) => c.decision_psicologo ?? '—',
          },
          {
            clave: 'decision_razon',
            titulo: 'Razón',
            render: (c) => (
              <span className="block max-w-64 truncate" title={c.decision_razon ?? ''}>
                {c.decision_razon || '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      clave: 'acciones',
      titulo: 'Acciones',
      alineacion: 'right',
      // Decidir aplica a quien ya fue evaluado (aprobado/rechazado), y también
      // a un "entrevistado" que no es cargo Agente (pasa directo, sin
      // evaluación). Un "entrevistado" que SÍ es Agente todavía no tiene nada
      // que decidir acá: le falta pasar por "Evaluar" en la Agenda.
      render: (c) =>
        puedeDecidir &&
        (['aprobado', 'rechazado'].includes(c.estado) ||
          (c.estado === 'entrevistado' && !esCargoAgente(c.cargo))) ? (
          <Boton className="!py-1.5" onClick={() => setDecidiendo(c)}>
            <Gavel className="h-4 w-4" /> Decidir
          </Boton>
        ) : null,
    },
  ]

  return (
    <Layout
      titulo="Evaluaciones"
      descripcion={actual?.descripcion}
      acciones={
        // El reporte de aprobados es el que tenía botón de descarga en la
        // pantalla vieja de perfiles aprobados.
        hasPermission('generar_reportes_seleccion') && (
          <Boton variante="secundario" onClick={() => setDescargando(true)}>
            <Download className="h-4 w-4" /> Descargar aprobados
          </Boton>
        )
      }
    >
      <div className="space-y-4">
        <Filtros
          opciones={VISTAS.map((v) => ({ valor: v.clave, etiqueta: v.etiqueta }))}
          valor={vista}
          onCambio={(v) => {
            setVista(v)
            setPagina(1)
          }}
        />

        <Error mensaje={error} onReintentar={recargar} />

        <Tabla
          columnas={columnas}
          filas={items}
          cargando={cargando}
          meta={meta}
          onPagina={setPagina}
          iconoVacio={ClipboardCheck}
          vacio="No hay candidatos en esta vista."
        />
      </div>

      {decidiendo && (
        <ModalDecision
          candidato={decidiendo}
          onCerrar={() => setDecidiendo(null)}
          onListo={() => {
            setDecidiendo(null)
            recargar()
          }}
        />
      )}

      {descargando && (
        <ModalDescargarExcel
          reporte="aprobados"
          titulo="Descargar aprobados"
          descripcion="Sin rango de fechas salen todos los aprobados."
          onCerrar={() => setDescargando(false)}
        />
      )}
    </Layout>
  )
}

function ModalDecision({ candidato, onCerrar, onListo }) {
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
