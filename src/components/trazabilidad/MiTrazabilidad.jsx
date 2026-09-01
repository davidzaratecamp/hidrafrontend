import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Inbox,
  Layers,
  RefreshCw,
  Sun,
  UserPlus,
  Wrench,
} from 'lucide-react'
import Layout from '../layout/Layout'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'
import { useRecurso } from '../../hooks/useRecurso'
import { BarraMedida, ResultadosAgentes, SerieMensual } from '../ui/graficas'
import { NOMBRE_MES_ACTUAL, techoAmable, tonoOrdinal } from '../ui/graficaHelpers'

/**
 * Trazabilidad de la gestión propia del reclutador.
 *
 * Responde tres preguntas distintas, que antes no se podían separar:
 *   creados     -> candidatos que registró
 *   gestionados -> candidatos a los que les movió el estado
 *   asignados   -> candidatos que recibió de otra persona
 *
 * Y las corta por día, semana, mes y total.
 *
 * Esto es posible porque el esquema nuevo guarda `candidato_estado_historial` y
 * `candidato_asignaciones`. Con el modelo anterior el estado era una columna que
 * se sobrescribía, así que no había forma de saber qué se gestionó ayer.
 */

const PERIODOS = [
  { clave: 'dia', etiqueta: 'Hoy', Icono: Sun },
  { clave: 'semana', etiqueta: 'Esta semana', Icono: CalendarDays },
  { clave: 'mes', etiqueta: 'Este mes', Icono: CalendarRange },
  { clave: 'total', etiqueta: 'Total', Icono: Layers },
]

const METRICAS = [
  {
    clave: 'creados',
    etiqueta: 'Creados',
    descripcion: 'Candidatos que registraste',
    Icono: UserPlus,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    clave: 'gestionados',
    etiqueta: 'Gestionados',
    descripcion: 'Candidatos a los que les moviste el estado',
    Icono: Wrench,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    clave: 'asignados',
    etiqueta: 'Asignados',
    descripcion: 'Candidatos que te transfirieron',
    Icono: Inbox,
    color: 'text-amber-600 bg-amber-50',
  },
]

function Tarjeta({ metrica, resumen, periodoActivo }) {
  const { Icono } = metrica
  const valores = resumen?.[metrica.clave] ?? {}

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{metrica.etiqueta}</p>
          {/* Cifra grande de tarjeta: figuras proporcionales, no tabulares — a
              este tamaño `tabular-nums` deja los dígitos sueltos. Se reserva
              para columnas que deben alinear verticalmente (la mini-tabla de
              periodos, aquí abajo). */}
          <p className="mt-2 text-4xl font-bold text-gray-900">
            {valores[periodoActivo] ?? 0}
          </p>
        </div>
        <span className={`p-2.5 rounded-lg ${metrica.color}`}>
          <Icono className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-500">{metrica.descripcion}</p>

      {/* Los otros tres periodos siguen visibles: comparar es el punto. */}
      <dl className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-2 text-center">
        {PERIODOS.map(({ clave, etiqueta }) => (
          <div key={clave} className={clave === periodoActivo ? 'opacity-40' : ''}>
            <dt className="text-[11px] uppercase tracking-wide text-gray-400">{etiqueta}</dt>
            <dd className="text-sm font-semibold text-gray-700 tabular-nums">
              {valores[clave] ?? 0}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/**
 * Candidatos por campaña/cargo, en COLUMNAS — no barras horizontales, para
 * que la tarjeta se lea distinto junto a "Mi cartera por estado" y el
 * "Embudo de conversión" (las tres apiladas eran la misma forma repetida
 * tres veces). Mismo encaje de color que antes: el orden no es un dato
 * (cambiar "Agente" por "Customer Service" no cambia el significado), así
 * que es nominal — un solo tono plano, nunca la rampa ordinal del embudo.
 */
const COLOR_CARGO = '#1d6091'
const COLOR_OTROS = '#9ca3af' // gris: no es una categoría real, es la suma del resto.

/**
 * Más de ~7 categorías y el gráfico deja de leerse (columnas del ancho de una
 * línea, etiquetas truncadas que dos cargos distintos terminan compartiendo)
 * — probado con 14 combinaciones reales antes de fijar el techo. Encima de
 * ese número, las que sobran se pliegan en un solo "Otros"; el backend ya las
 * entrega ordenadas de mayor a menor, así que quedan afuera las más chicas.
 */
const LIMITE_COLUMNAS = 6

function agruparColumnas(porCargo) {
  const conCandidatos = porCargo.filter((f) => f.total > 0)
  if (conCandidatos.length <= LIMITE_COLUMNAS + 1) return conCandidatos

  const principales = conCandidatos.slice(0, LIMITE_COLUMNAS)
  const resto = conCandidatos.slice(LIMITE_COLUMNAS)
  return [
    ...principales,
    {
      cliente: null,
      cargo: 'Otros',
      combinaciones: resto.length,
      total: resto.reduce((suma, f) => suma + f.total, 0),
    },
  ]
}

const CARGO_ANCHO = 640
const CARGO_ALTO = 220
const CARGO_MARGEN = { izq: 28, der: 8, arriba: 26, abajo: 58 }
const CARGO_ANCHO_GRAFICO = CARGO_ANCHO - CARGO_MARGEN.izq - CARGO_MARGEN.der
const CARGO_ALTO_GRAFICO = CARGO_ALTO - CARGO_MARGEN.arriba - CARGO_MARGEN.abajo

function PorCargo({ porCargo }) {
  const [indiceActivo, setIndiceActivo] = useState(null)
  const conCandidatos = agruparColumnas(porCargo)

  if (conCandidatos.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no tienes candidatos en cartera.</p>
  }

  const totalGeneral = conCandidatos.reduce((suma, f) => suma + f.total, 0)
  const maximoEje = techoAmable(Math.max(1, ...conCandidatos.map((f) => f.total)))
  const ticksY = [0, maximoEje / 2, maximoEje]

  const anchoBanda = CARGO_ANCHO_GRAFICO / conCandidatos.length
  // <= 24px de grosor (marca de columna): nunca rellena el carril completo,
  // el aire que sobra separa una columna de la siguiente sin necesitar borde.
  const anchoColumna = Math.min(24, anchoBanda * 0.55)
  const xCentro = (i) => CARGO_MARGEN.izq + anchoBanda * (i + 0.5)
  const y = (v) => CARGO_MARGEN.arriba + CARGO_ALTO_GRAFICO - (v / maximoEje) * CARGO_ALTO_GRAFICO

  const activo = indiceActivo !== null ? conCandidatos[indiceActivo] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CARGO_ANCHO} ${CARGO_ALTO}`} className="w-full" role="img" aria-label="Candidatos por campaña y cargo">
        {ticksY.map((valor) => (
          <g key={valor}>
            <line
              x1={CARGO_MARGEN.izq}
              x2={CARGO_ANCHO - CARGO_MARGEN.der}
              y1={y(valor)}
              y2={y(valor)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text x={CARGO_MARGEN.izq - 8} y={y(valor)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[9px]">
              {Math.round(valor)}
            </text>
          </g>
        ))}

        {conCandidatos.map((fila, indice) => {
          const cx = xCentro(indice)
          const yTope = y(fila.total)
          const atenuada = indiceActivo !== null && indiceActivo !== indice
          return (
            <g
              key={`${fila.cliente}-${fila.cargo}`}
              onMouseEnter={() => setIndiceActivo(indice)}
              onMouseLeave={() => setIndiceActivo(null)}
              className="cursor-pointer"
            >
              {/* Área de impacto: todo el carril, no solo la columna angosta. */}
              <rect
                x={CARGO_MARGEN.izq + anchoBanda * indice}
                y={CARGO_MARGEN.arriba}
                width={anchoBanda}
                height={CARGO_ALTO_GRAFICO}
                fill="transparent"
              />
              <rect
                x={cx - anchoColumna / 2}
                y={yTope}
                width={anchoColumna}
                height={Math.max(2, CARGO_ALTO_GRAFICO - (yTope - CARGO_MARGEN.arriba))}
                rx="4"
                fill={fila.cliente === null ? COLOR_OTROS : COLOR_CARGO}
                opacity={atenuada ? 0.4 : 1}
                className="transition-opacity duration-150"
              />
              {/* "Columns -> value on the cap": el valor va en el remate, no adentro. */}
              <text x={cx} y={yTope - 7} textAnchor="middle" className="fill-gray-700 text-[10px] font-semibold tabular-nums">
                {fila.total}
              </text>
              <text
                x={cx}
                y={CARGO_ALTO - CARGO_MARGEN.abajo + 16}
                textAnchor="end"
                className="fill-gray-500 text-[9px]"
                transform={`rotate(-30 ${cx} ${CARGO_ALTO - CARGO_MARGEN.abajo + 16})`}
              >
                {fila.cargo.length > 16 ? `${fila.cargo.slice(0, 15)}…` : fila.cargo}
              </text>
            </g>
          )
        })}
      </svg>

      {activo && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${Math.min(88, Math.max(12, (xCentro(indiceActivo) / CARGO_ANCHO) * 100))}%` }}
        >
          <p className="font-medium text-gray-900">{activo.cargo}</p>
          <p className="text-gray-500">
            {activo.cliente ?? `${activo.combinaciones} campañas/cargos con menos candidatos`}
          </p>
          <p className="mt-1">
            <span className="font-semibold tabular-nums text-gray-900">{activo.total}</span>{' '}
            <span className="text-gray-500">candidatos · {Math.round((activo.total / totalGeneral) * 100)}%</span>
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Embudo de conversión: no dónde está cada candidato HOY, sino hasta dónde
 * llegó alguna vez. Por eso las barras no son estrictamente
 * decrecientes — un candidato rechazado después de entrevistarse sigue
 * contando en "Entrevistado" — y el tooltip siempre muestra el porcentaje
 * sobre el total registrado, para que esa honestidad se lea de un vistazo.
 */
const ETAPAS_EMBUDO = [
  { clave: 'registrados', etiqueta: 'Registrados' },
  { clave: 'citado', etiqueta: 'Citado' },
  { clave: 'entrevistado', etiqueta: 'Entrevistado' },
  { clave: 'aprobado', etiqueta: 'Aprobado' },
]

function EmbudoConversion({ embudo }) {
  if (!embudo || embudo.registrados === 0) {
    return <p className="text-sm text-gray-500">Todavía no tienes candidatos registrados.</p>
  }

  return (
    <ul className="space-y-3">
      {ETAPAS_EMBUDO.map((etapa, indice) => {
        const valor = embudo[etapa.clave]
        const fraccion = indice / (ETAPAS_EMBUDO.length - 1)
        const porcentaje = Math.round((valor / embudo.registrados) * 100)
        return (
          <BarraMedida
            key={etapa.clave}
            etiqueta={etapa.etiqueta}
            valor={valor}
            maximo={embudo.registrados}
            color={tonoOrdinal(fraccion)}
            tooltip={
              <>
                <span className="font-semibold">{valor}</span> de {embudo.registrados} · {porcentaje}%
              </>
            }
          />
        )
      })}
    </ul>
  )
}

function ActividadReciente({ movimientos }) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-gray-500">Sin movimientos registrados.</p>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {movimientos.map((m, indice) => (
        <li key={`${m.candidato_id}-${m.created_at}-${indice}`} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              to={`/candidatos/${m.candidato_id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {m.primer_nombre} {m.primer_apellido}
            </Link>
            <time className="text-xs text-gray-400 shrink-0">
              {new Date(m.created_at).toLocaleString('es-CO', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
            {m.estado_anterior ? (
              <>
                <span>{m.estado_anterior}</span>
                <ArrowRight className="h-3 w-3" />
              </>
            ) : (
              <span className="text-blue-600 font-medium">registró</span>
            )}
            <span className="font-medium text-gray-700">{m.estado_nombre}</span>
          </p>
          {m.motivo && <p className="mt-0.5 text-xs text-gray-400 italic">{m.motivo}</p>}
        </li>
      ))}
    </ul>
  )
}

export default function MiTrazabilidad({ reclutadorId, titulo, descripcion }) {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState('dia')

  const ruta = reclutadorId ? `/trazabilidad/reclutador/${reclutadorId}` : '/trazabilidad/mia'

  const { datos, cargando, error, recargar: cargar } = useRecurso(
    () => api.get(`${ruta}${api.qs({ actividad: 12 })}`),
    [ruta]
  )

  const acciones = (
    <>
      <div className="flex rounded-lg border border-gray-200 bg-white p-1">
        {PERIODOS.map(({ clave, etiqueta, Icono }) => (
          <button
            key={clave}
            onClick={() => setPeriodo(clave)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
              periodo === clave
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icono className="h-4 w-4" />
            {etiqueta}
          </button>
        ))}
      </div>
      <button
        onClick={cargar}
        disabled={cargando}
        aria-label="Actualizar"
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
      </button>
    </>
  )

  return (
    <Layout
      titulo={titulo ?? 'Mi trazabilidad'}
      descripcion={
        descripcion ?? `Gestión de ${user?.nombreCompleto ?? 'tu usuario'} por periodo`
      }
      acciones={acciones}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando && !datos ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRICAS.map((m) => (
            <div key={m.clave} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        datos && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {METRICAS.map((metrica) => (
                <Tarjeta
                  key={metrica.clave}
                  metrica={metrica}
                  resumen={datos.resumen}
                  periodoActivo={periodo}
                />
              ))}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Resultados de Agente
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Aprobado vs. rechazado, evaluación de entrevista y decisión final.
                </p>
                <ResultadosAgentes resultados={datos.resultadosAgentes} />
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Una sola serie no necesita leyenda aparte: el título ya
                    dice qué se está mostrando. */}
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Registros de {NOMBRE_MES_ACTUAL}
                </h2>
                <p className="text-xs text-gray-500 mb-4">Candidatos registrados por día.</p>
                <SerieMensual
                  serie={datos.serie ?? []}
                  campo="creados"
                  etiquetaValor="registrados"
                  tituloAria={`Candidatos registrados por día — ${NOMBRE_MES_ACTUAL}`}
                />
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">
                  Candidatos por campaña y cargo
                </h2>
                <PorCargo porCargo={datos.porCargo ?? []} />
              </section>

              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Embudo de conversión
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Hasta dónde llegó cada candidato alguna vez, no dónde está hoy.
                </p>
                <EmbudoConversion embudo={datos.embudo} />
              </section>
            </div>

            <section className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Actividad reciente</h2>
              <ActividadReciente movimientos={datos.actividadReciente ?? []} />
            </section>
          </div>
        )
      )}
    </Layout>
  )
}
