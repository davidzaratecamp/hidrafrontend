import { Building2, FileText, RefreshCw, TrendingUp, Users, UsersRound } from 'lucide-react'
import Layout from '../layout/Layout'
import api from '../../services/api'
import { useRecurso } from '../../hooks/useRecurso'
import { BarraMedida, CandidatosPorAnalista } from '../ui/graficas'
import { tonoOrdinal } from '../ui/graficaHelpers'

/**
 * Dashboard de Administrador: panorama global del sistema.
 *
 * Antes el administrador aterrizaba en el "Dashboard de Selección" —lo tenía
 * por compartir `evaluar_candidatos` con Selección, no porque ese panel
 * respondiera lo que el administrador necesita ver primero (decisión de
 * negocio, 2026-09-02: se le quita esa pantalla y se le da esta). Selección
 * pregunta "¿cuánto trabajo tengo pendiente de evaluar?"; el administrador
 * pregunta "¿cómo va el embudo completo, y quién está produciendo?" — de ahí
 * el corte distinto: nada de cola de evaluación ni criterios de entrevista,
 * sí el embudo end-to-end, la distribución por cliente y el avance de
 * formularios, que hoy no vive en ninguna pantalla.
 */

function Tarjeta({ etiqueta, valor, detalle, Icono }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{etiqueta}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-gray-500">{detalle}</p>}
        </div>
        <span className="p-2.5 rounded-lg text-blue-600 bg-blue-50">
          <Icono className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

/**
 * Embudo GLOBAL de conversión: todo el sistema, no un reclutador (esa versión
 * ya existe en `MiTrazabilidad`). Sale de `/reportes/estadisticas`, que ya
 * aplica la visibilidad del usuario — para el administrador, sin filtro.
 */
const ETAPAS_EMBUDO = [
  { clave: 'total_candidatos', etiqueta: 'Registrado' },
  { clave: 'citados', etiqueta: 'Citado' },
  { clave: 'entrevistados', etiqueta: 'Entrevistado' },
  { clave: 'aprobados', etiqueta: 'Aprobado' },
  { clave: 'contratados', etiqueta: 'Contratado' },
]

function EmbudoGlobal({ estadisticas }) {
  if (!estadisticas || estadisticas.total_candidatos === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay candidatos registrados.</p>
  }

  return (
    <ul className="space-y-3">
      {ETAPAS_EMBUDO.map((etapa, indice) => {
        const valor = estadisticas[etapa.clave]
        const fraccion = indice / (ETAPAS_EMBUDO.length - 1)
        const porcentaje = Math.round((valor / estadisticas.total_candidatos) * 100)
        return (
          <BarraMedida
            key={etapa.clave}
            etiqueta={etapa.etiqueta}
            valor={valor}
            maximo={estadisticas.total_candidatos}
            color={tonoOrdinal(fraccion)}
            tooltip={
              <>
                <span className="font-semibold">{valor}</span> de {estadisticas.total_candidatos} ·{' '}
                {porcentaje}%
              </>
            }
          />
        )
      })}
    </ul>
  )
}

const LIMITE_CLIENTES = 8

function CandidatosPorCliente({ porCliente }) {
  const filas = (porCliente ?? []).filter((f) => f.total > 0).slice(0, LIMITE_CLIENTES)

  if (filas.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay candidatos registrados.</p>
  }

  const maximo = Math.max(...filas.map((f) => f.total))

  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <BarraMedida
          key={f.cliente}
          etiqueta={f.cliente}
          valor={f.total}
          maximo={maximo}
          color="#1d6091"
          tooltip={
            <>
              <span className="font-semibold">{f.total}</span> candidatos · {f.aprobados} aprobados
            </>
          }
        />
      ))}
    </ul>
  )
}

/**
 * Avance de formularios, ACUMULADO ("llegó al menos hasta el paso N"), no el
 * balde exacto que devuelve el backend (`pasosCompletados === N`): un
 * candidato que completó los 6 pasos sí cuenta para "llegó al paso 3", y es
 * esa lectura —cuántos se van cayendo en cada paso— la que importa aquí.
 */
function ProgresoFormularios({ progreso }) {
  const lista = progreso ?? []
  const total = lista.reduce((suma, p) => suma + p.candidatos, 0)

  if (total === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay formularios enviados.</p>
  }

  const pasos = Array.from({ length: 6 }, (_, i) => i + 1).map((paso) => {
    const candidatos = lista
      .filter((p) => p.pasosCompletados >= paso)
      .reduce((suma, p) => suma + p.candidatos, 0)
    return { paso, candidatos, porcentaje: Math.round((candidatos / total) * 100) }
  })

  return (
    <ul className="space-y-3">
      {pasos.map((p) => (
        <BarraMedida
          key={p.paso}
          etiqueta={`Paso ${p.paso}`}
          valor={p.candidatos}
          maximo={total}
          color="#1d6091"
          tooltip={
            <>
              <span className="font-semibold">{p.candidatos}</span> de {total} · {p.porcentaje}%
            </>
          }
        />
      ))}
    </ul>
  )
}

export default function DashboardAdministrador() {
  const { datos, cargando, error, recargar } = useRecurso(async () => {
    const [global, estadisticas, porCliente, progreso, equipo] = await Promise.all([
      api.get('/trazabilidad/global'),
      api.get('/reportes/estadisticas'),
      api.get('/reportes/analytics/clientes'),
      api.get('/reportes/analytics/progreso'),
      api.get('/trazabilidad/equipo'),
    ])
    return { global, estadisticas, porCliente, progreso, equipo }
  }, [])

  const acciones = (
    <button
      onClick={recargar}
      disabled={cargando}
      aria-label="Actualizar"
      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
    </button>
  )

  return (
    <Layout
      titulo="Dashboard"
      descripcion="Panorama global del sistema: embudo, clientes y equipo"
      acciones={acciones}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando && !datos ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        datos && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
              <Tarjeta
                etiqueta="Candidatos en el sistema"
                valor={datos.global.candidatos.total}
                Icono={Users}
              />
              <Tarjeta
                etiqueta="Registrados este mes"
                valor={datos.global.candidatos.mes}
                detalle={`${datos.global.candidatos.semana} esta semana · ${datos.global.candidatos.dia} hoy`}
                Icono={TrendingUp}
              />
              <Tarjeta
                etiqueta="Usuarios activos"
                valor={datos.global.usuariosActivos}
                Icono={UsersRound}
              />
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Embudo de conversión</h2>
              <p className="text-xs text-gray-500 mb-4">
                Todo el sistema, de registrado a contratado.
              </p>
              <EmbudoGlobal estadisticas={datos.estadisticas} />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  Candidatos por cliente
                </h2>
                <p className="text-xs text-gray-500 mb-4">Cartera actual y aprobados por campaña.</p>
                <CandidatosPorCliente porCliente={datos.porCliente} />
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Progreso de formularios
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Candidatos que llegaron al menos hasta cada paso.
                </p>
                <ProgresoFormularios progreso={datos.progreso} />
              </section>
            </div>

            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Candidatos registrados por analista
              </h2>
              <p className="text-xs text-gray-500 mb-4">Carga de trabajo por analista de Reclutamiento.</p>
              <CandidatosPorAnalista equipo={datos.equipo} />
            </section>
          </div>
        )
      )}
    </Layout>
  )
}
