import { ClipboardList, RefreshCw, ScrollText } from 'lucide-react'
import Layout from '../layout/Layout'
import api from '../../services/api'
import { useRecurso } from '../../hooks/useRecurso'
import { BarraMedida, ResultadosAgentes, SerieMensual } from '../ui/graficas'
import { NOMBRE_MES_ACTUAL, tonoOrdinal } from '../ui/graficaHelpers'

/**
 * Dashboard de Selección: qué hay que hacer y cómo va la evaluación.
 *
 * Selección no crea candidatos — "Mi trazabilidad" (creados/gestionados/
 * asignados) describe el trabajo de Reclutamiento, no el suyo. Este panel
 * responde las dos preguntas que sí les importan: cuánto trabajo hay
 * pendiente (la cola) y cómo está saliendo la evaluación (resultados,
 * promedio por criterio, ritmo diario). Las cuatro cifras son GLOBALES —
 * "el equipo de Selección", no "yo" — porque evalúan lo que llega de
 * cualquier reclutador, no una cartera propia.
 */

function TarjetaCola({ etiqueta, valor, descripcion, Icono, color }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{etiqueta}</p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{valor}</p>
        </div>
        <span className={`p-2.5 rounded-lg ${color}`}>
          <Icono className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500">{descripcion}</p>
    </article>
  )
}

/**
 * Promedio de evaluación por criterio, en el orden real de la llamada
 * (saludo → perfilamiento → producto → objeciones → cierre): el orden ES el
 * dato, así que el color es la misma rampa ordinal del embudo de
 * conversión, no un tono nominal por criterio.
 */
/**
 * Candidatos registrados por analista de Reclutamiento — no es de Selección
 * (ellos no registran), pero es la carga de trabajo que les va a llegar a
 * evaluar, y es la comparativa que le importa a Selección: quién les está
 * alimentando la cola. Nominal: el orden es solo para lectura (de mayor a
 * menor), no un dato en sí, así que un solo tono plano — nunca la rampa
 * ordinal del criterio de arriba.
 */
const COLOR_ANALISTA = '#1d6091'
const LIMITE_ANALISTAS = 8

function agruparAnalistas(equipo) {
  const conCandidatos = equipo
    .map((r) => ({ nombre: r.nombreCompleto, total: r.creados.total }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  if (conCandidatos.length <= LIMITE_ANALISTAS + 1) return conCandidatos

  const principales = conCandidatos.slice(0, LIMITE_ANALISTAS)
  const resto = conCandidatos.slice(LIMITE_ANALISTAS)
  return [
    ...principales,
    { nombre: `${resto.length} analistas más`, total: resto.reduce((suma, r) => suma + r.total, 0) },
  ]
}

function CandidatosPorAnalista({ equipo }) {
  const filas = agruparAnalistas(equipo ?? [])

  if (filas.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay candidatos registrados.</p>
  }

  const maximo = Math.max(...filas.map((f) => f.total))

  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <BarraMedida
          key={f.nombre}
          etiqueta={f.nombre}
          valor={f.total}
          maximo={maximo}
          color={COLOR_ANALISTA}
          tooltip={
            <>
              <span className="font-semibold">{f.total}</span> candidatos registrados
            </>
          }
        />
      ))}
    </ul>
  )
}

function PorCriterio({ porCriterio }) {
  if (!porCriterio || porCriterio.every((c) => c.evaluaciones === 0)) {
    return <p className="text-sm text-gray-500">Todavía no hay evaluaciones registradas.</p>
  }

  return (
    <ul className="space-y-3">
      {porCriterio.map((criterio, indice) => {
        const fraccion = porCriterio.length > 1 ? indice / (porCriterio.length - 1) : 0
        const porcentaje =
          criterio.evaluaciones > 0 ? Math.round((criterio.promedio / criterio.puntajeMaximo) * 100) : 0
        return (
          <BarraMedida
            key={criterio.codigo}
            etiqueta={criterio.nombre}
            valor={criterio.promedio}
            maximo={criterio.puntajeMaximo}
            color={tonoOrdinal(fraccion)}
            tooltip={
              criterio.evaluaciones > 0 ? (
                <>
                  <span className="font-semibold">{criterio.promedio}</span> de {criterio.puntajeMaximo} ·{' '}
                  {porcentaje}% · {criterio.evaluaciones} evaluaciones
                </>
              ) : (
                'Sin evaluaciones'
              )
            }
          />
        )
      })}
    </ul>
  )
}

export default function DashboardSeleccion() {
  const { datos, cargando, error, recargar } = useRecurso(
    () => api.get('/reportes/panel-seleccion'),
    []
  )
  // Mismo dato que "Trazabilidad del equipo" (`ver_perfiles_completos`, que
  // Selección también tiene): no se duplica la consulta en el backend, se
  // reutiliza el endpoint que ya trae creados por reclutador.
  const { datos: equipo, recargar: recargarEquipo } = useRecurso(
    () => api.get('/trazabilidad/equipo'),
    []
  )

  function actualizarTodo() {
    recargar()
    recargarEquipo()
  }

  const acciones = (
    <button
      onClick={actualizarTodo}
      disabled={cargando}
      aria-label="Actualizar"
      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
    </button>
  )

  return (
    <Layout
      titulo="Dashboard de Selección"
      descripcion="Cola de trabajo y resultados de evaluación del equipo"
      acciones={acciones}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando && !datos ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        datos && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <TarjetaCola
                etiqueta="Pendientes de evaluación"
                valor={datos.cola.pendientesEvaluacion}
                descripcion="Candidatos Agente entrevistados, sin calificar."
                Icono={ClipboardList}
                color="text-blue-600 bg-blue-50"
              />
              <TarjetaCola
                etiqueta="Pendientes de decisión final"
                valor={datos.cola.pendientesDecisionFinal}
                descripcion="Ya evaluados (o no aplica evaluación): falta la decisión del psicólogo."
                Icono={ScrollText}
                color="text-amber-600 bg-amber-50"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Resultados de Agente</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Aprobado vs. rechazado, todo el equipo de Selección.
                </p>
                <ResultadosAgentes resultados={datos.resultadosAgentes} />
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Evaluaciones de {NOMBRE_MES_ACTUAL}
                </h2>
                <p className="text-xs text-gray-500 mb-4">Evaluaciones registradas por día.</p>
                <SerieMensual
                  serie={datos.serie ?? []}
                  campo="evaluaciones"
                  etiquetaValor="evaluaciones"
                  tituloAria={`Evaluaciones realizadas por día — ${NOMBRE_MES_ACTUAL}`}
                />
              </section>
            </div>

            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Promedio de evaluación por criterio
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                {datos.evaluacion.evaluaciones} evaluaciones registradas
                {datos.evaluacion.porcentajePromedio !== null &&
                  ` · ${datos.evaluacion.porcentajePromedio}% promedio general`}
                .
              </p>
              <PorCriterio porCriterio={datos.evaluacion.porCriterio} />
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Candidatos registrados por analista
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Carga de trabajo por analista de Reclutamiento — de ahí sale lo que Selección evalúa.
              </p>
              {equipo ? (
                <CandidatosPorAnalista equipo={equipo} />
              ) : (
                <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
              )}
            </section>
          </div>
        )
      )}
    </Layout>
  )
}
