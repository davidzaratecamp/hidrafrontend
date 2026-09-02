import { useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { HOY, HOY_ETIQUETA, techoAmable } from './graficaHelpers'

/**
 * Componentes de gráfica compartidos por los paneles de trazabilidad
 * (Reclutamiento y Selección). Antes vivían solo en `MiTrazabilidad.jsx`; se
 * movieron aquí en cuanto apareció un segundo panel que necesitaba las mismas
 * tres formas (barra medida, dona de resultados, serie mensual) — repetir
 * ~300 líneas de SVG a mano en dos archivos hubiera sido el primer lugar
 * donde divergieran sin querer.
 *
 * Solo componentes en este archivo (react-refresh lo exige) — las constantes
 * y funciones puras que comparten viven en `graficaHelpers.js`.
 */

/**
 * Una fila de barra + tooltip: mismo marcado y comportamiento de hover en
 * cualquier lista de barras horizontales; solo cambian el color y qué dice
 * el tooltip.
 */
export function BarraMedida({ etiqueta, valor, maximo, color, tooltip, anchoEtiqueta = 'w-40' }) {
  return (
    <li className="group flex items-center gap-3">
      <span className={`${anchoEtiqueta} shrink-0 truncate text-sm text-gray-700`} title={etiqueta}>
        {etiqueta}
      </span>
      <div className="relative h-2.5 flex-1 rounded-full bg-gray-100">
        <div
          className="h-full rounded-r-[4px] transition-[width] duration-500 ease-out group-hover:brightness-110"
          style={{ width: `${(valor / maximo) * 100}%`, backgroundColor: color }}
        />
        <div
          role="tooltip"
          className="pointer-events-none absolute -top-9 left-0 z-10 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          {tooltip}
        </div>
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold text-gray-900 tabular-nums">
        {valor}
      </span>
    </li>
  )
}

const SM_ANCHO = 640
const SM_ALTO = 220
// `arriba` crece un poco respecto a las otras gráficas: necesita sitio para
// la etiqueta "Hoy" de la marca de fecha, siempre visible.
const SM_MARGEN = { izq: 30, der: 12, arriba: 20, abajo: 24 }
const SM_ANCHO_GRAFICO = SM_ANCHO - SM_MARGEN.izq - SM_MARGEN.der
const SM_ALTO_GRAFICO = SM_ALTO - SM_MARGEN.arriba - SM_MARGEN.abajo

/**
 * Serie mensual de un solo valor por día (registros, evaluaciones — lo que
 * sea que cuente `campo`). SVG a mano: no hace falta traer una librería para
 * esto. Incluye la marca de "hoy" siempre visible y crosshair + tooltip al
 * pasar el cursor.
 *
 * @param {{fecha: string, dia: number}[]} serie Un elemento por cada día del
 *   mes, sin huecos — los días sin actividad deben venir en 0, no ausentes.
 * @param {string} campo Nombre de la propiedad de `serie[i]` a graficar.
 * @param {string} color Color de marca de la línea/área.
 * @param {string} etiquetaValor Texto que sigue al número en el tooltip
 *   ("registrados", "evaluaciones"...).
 * @param {string} tituloAria Texto de `aria-label` del contenedor.
 */
export function SerieMensual({ serie, campo = 'valor', color = '#1d6091', etiquetaValor = 'registros', tituloAria }) {
  const [indiceActivo, setIndiceActivo] = useState(null)
  const svgRef = useRef(null)

  if (serie.length === 0) {
    return <p className="text-sm text-gray-500">Sin actividad este mes.</p>
  }

  const valorDe = (d) => d[campo]
  const maximoEje = techoAmable(Math.max(1, ...serie.map(valorDe)))
  const ultimo = serie.length - 1

  const x = (i) => SM_MARGEN.izq + (ultimo > 0 ? (i / ultimo) * SM_ANCHO_GRAFICO : SM_ANCHO_GRAFICO / 2)
  const y = (v) => SM_MARGEN.arriba + SM_ALTO_GRAFICO - (v / maximoEje) * SM_ALTO_GRAFICO

  const trazo = serie.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(valorDe(d)).toFixed(1)}`).join(' ')
  const area = `${trazo} L ${x(ultimo).toFixed(1)} ${y(0)} L ${x(0).toFixed(1)} ${y(0)} Z`

  const ticksY = [0, maximoEje / 2, maximoEje]
  // Pocas marcas en X: 30-31 etiquetas serían ruido. Día 1, uno de mitad, el último del mes y hoy.
  const ticksX = [...new Set([0, Math.round(ultimo / 2), ultimo, HOY - 1])].sort((a, b) => a - b)

  function alMover(e) {
    const rect = svgRef.current.getBoundingClientRect()
    const fraccion = (e.clientX - rect.left) / rect.width
    const i = Math.round(fraccion * ultimo)
    setIndiceActivo(Math.min(ultimo, Math.max(0, i)))
  }

  const activo = indiceActivo !== null ? serie[indiceActivo] : null
  // Clamp para que el tooltip no se salga del contenedor en los extremos.
  const tooltipPct =
    indiceActivo !== null ? Math.min(88, Math.max(12, (x(indiceActivo) / SM_ANCHO) * 100)) : 0

  return (
    <div className="relative" role="img" aria-label={tituloAria}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SM_ANCHO} ${SM_ALTO}`}
        className="w-full touch-none"
        onPointerMove={alMover}
        onPointerLeave={() => setIndiceActivo(null)}
      >
        {/* Grilla: líneas recesivas de un paso fuera de la superficie, nunca punteadas. */}
        {ticksY.map((valor) => (
          <g key={valor}>
            <line
              x1={SM_MARGEN.izq}
              x2={SM_ANCHO - SM_MARGEN.der}
              y1={y(valor)}
              y2={y(valor)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text x={SM_MARGEN.izq - 8} y={y(valor)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[9px]">
              {Math.round(valor)}
            </text>
          </g>
        ))}
        {/* Eje X en número de día del mes, no fecha completa: ya lo dice el título. */}
        {ticksX.map((i) => (
          <text key={i} x={x(i)} y={SM_ALTO - 6} textAnchor="middle" className="fill-gray-400 text-[9px]">
            {serie[i].dia}
          </text>
        ))}

        {/* Área: lavado al 10%, nunca un bloque saturado. */}
        <path d={area} fill={color} fillOpacity="0.1" stroke="none" />
        {/* Línea: 2px, unión y remate redondeados. */}
        <path d={trazo} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Marca de "hoy": SIEMPRE visible, no solo al pasar el cursor — línea
            punteada (el único caso donde discontinuo es correcto: no es
            grilla, es un umbral) más la fecha de verdad, no solo el número
            de día que ya lleva el eje X. */}
        <line
          x1={x(HOY - 1)}
          x2={x(HOY - 1)}
          y1={SM_MARGEN.arriba}
          y2={SM_ALTO - SM_MARGEN.abajo}
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* El texto se ancla cerca de la línea, pero sin salirse del lienzo
            cuando "hoy" cae en el día 1 o en el último del mes. */}
        <text
          x={Math.min(SM_ANCHO - SM_MARGEN.der - 34, Math.max(SM_MARGEN.izq + 34, x(HOY - 1)))}
          y={SM_MARGEN.arriba - 7}
          textAnchor="middle"
          className="fill-gray-500 text-[9px] font-semibold"
        >
          Hoy · {HOY_ETIQUETA}
        </text>
        <circle
          cx={x(HOY - 1)}
          cy={y(valorDe(serie[HOY - 1]))}
          r="3.5"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5"
        />

        {/* Crosshair + punto: solo en la posición activa. */}
        {activo && (
          <>
            <line
              x1={x(indiceActivo)}
              x2={x(indiceActivo)}
              y1={SM_MARGEN.arriba}
              y2={SM_ALTO - SM_MARGEN.abajo}
              stroke="#9ca3af"
              strokeWidth="1"
            />
            <circle cx={x(indiceActivo)} cy={y(valorDe(activo))} r="4.5" fill={color} stroke="#fff" strokeWidth="2" />
          </>
        )}

        {/* Capa de impacto: todo el ancho, así el lector apunta a un día, no a una línea de 2px. */}
        <rect
          x={SM_MARGEN.izq}
          y={SM_MARGEN.arriba}
          width={SM_ANCHO_GRAFICO}
          height={SM_ALTO_GRAFICO}
          fill="transparent"
        />
      </svg>

      {activo && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${tooltipPct}%` }}
        >
          <p className="mb-1.5 font-medium text-gray-500">
            Día {activo.dia}
            {activo.dia === HOY && ' · hoy'}
          </p>
          <p className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold tabular-nums text-gray-900">{valorDe(activo)}</span>
            <span className="text-gray-500">{etiquetaValor}</span>
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Resultados de Agente: aprobado vs. rechazado, en dona.
 *
 * Solo Agente (y variantes: "Agente Plus", etc.) pasa por evaluación de
 * entrevista — el resto de cargos va directo de entrevistado a decisión
 * final (`esCargoAgente`, ver `seleccion.service.js`). Mezclar ambos en un
 * mismo "aprobado" diría cosas distintas con la misma palabra.
 *
 * El color es de ESTADO (bueno/malo), no categórico ni ordinal: aprobado y
 * rechazado son polos con significado fijo, así que usan la familia
 * verde/roja reservada para eso, nunca reutilizada para "serie 3". El matiz
 * más oscuro es la decisión YA confirmada por psicología; el más claro, la
 * evaluación de entrevista todavía sin decisión final. El color nunca va
 * solo: cada porción lleva ícono + etiqueta en la leyenda.
 */
const RESULTADOS_ETAPAS = [
  { clave: 'aprobadoFinal', etiqueta: 'Aprobado final', Icono: CheckCircle2, color: '#0ca30c' },
  { clave: 'aprobado', etiqueta: 'Aprobado (pendiente)', Icono: CheckCircle2, color: '#4ade80' },
  { clave: 'rechazadoFinal', etiqueta: 'Rechazado final', Icono: XCircle, color: '#d03b3b' },
  { clave: 'rechazado', etiqueta: 'Rechazado (pendiente)', Icono: XCircle, color: '#f87171' },
]

const DONA_RADIO = 70
const DONA_GROSOR = 26
const DONA_CIRCUNFERENCIA = 2 * Math.PI * DONA_RADIO
// Separador entre porciones: el mismo principio del "surface gap" que las
// demás gráficas, adaptado a un arco en vez de a un rectángulo.
const DONA_SEPARADOR = 4

/**
 * Candidatos registrados por analista de Reclutamiento.
 *
 * Compartida por el dashboard de Selección (de ahí sale la cola que evalúan)
 * y el de Administrador (panorama global) — antes vivía solo en
 * `DashboardSeleccion.jsx`, se movió aquí en cuanto un segundo panel la
 * necesitó igual. Nominal: el orden es solo para lectura (de mayor a menor),
 * no un dato en sí, así que un solo tono plano — nunca la rampa ordinal del
 * embudo de conversión.
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

export function CandidatosPorAnalista({ equipo }) {
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

export function ResultadosAgentes({ resultados, etiquetaCentro = 'decididos' }) {
  const filas = RESULTADOS_ETAPAS
    .map((etapa) => ({ ...etapa, valor: resultados?.[etapa.clave] ?? 0 }))
    .filter((f) => f.valor > 0)
  const total = filas.reduce((suma, f) => suma + f.valor, 0)

  if (total === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay candidatos Agente con evaluación o decisión.</p>
  }

  // Longitud de arco de cada porción, en el orden en que se dibujan.
  const largos = filas.map((f) => (f.valor / total) * DONA_CIRCUNFERENCIA)
  const arcos = filas.map((f, indice) => {
    const acumulado = largos.slice(0, indice).reduce((suma, largo) => suma + largo, 0)
    const largoVisible = Math.max(0, largos[indice] - DONA_SEPARADOR)
    return {
      ...f,
      dasharray: `${largoVisible} ${DONA_CIRCUNFERENCIA - largoVisible}`,
      dashoffset: -acumulado,
    }
  })

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative shrink-0">
        <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90" role="img" aria-label="Resultados de Agente">
          <circle cx="88" cy="88" r={DONA_RADIO} fill="none" stroke="#f3f4f6" strokeWidth={DONA_GROSOR} />
          {arcos.map((a) => (
            <circle
              key={a.clave}
              cx="88"
              cy="88"
              r={DONA_RADIO}
              fill="none"
              stroke={a.color}
              strokeWidth={DONA_GROSOR}
              strokeDasharray={a.dasharray}
              strokeDashoffset={a.dashoffset}
            />
          ))}
        </svg>
        {/* Cifra al centro: proporcional, no tabular — es una cifra grande
            de un solo vistazo, no una columna que deba alinear con otras. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[11px] text-gray-500">{etiquetaCentro}</span>
        </div>
      </div>

      <ul className="w-full max-w-56 space-y-2 text-sm">
        {arcos.map((a) => {
          const Icono = a.Icono
          const porcentaje = Math.round((a.valor / total) * 100)
          return (
            <li key={a.clave} className="flex items-center gap-2">
              <Icono className="h-4 w-4 shrink-0" style={{ color: a.color }} />
              <span className="truncate text-gray-700">{a.etiqueta}</span>
              <span className="ml-auto font-semibold tabular-nums text-gray-900">{a.valor}</span>
              <span className="w-9 shrink-0 text-right text-xs text-gray-400 tabular-nums">{porcentaje}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
