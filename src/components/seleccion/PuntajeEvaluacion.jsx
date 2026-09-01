import { Progreso } from '../ui'
import { numero } from '../ui/formato'

/**
 * Puntaje de la entrevista, como celda de tabla.
 *
 * Lo muestran la agenda y la pantalla de evaluaciones, y estaba escrito dos
 * veces: la misma barra, los mismos colores y el mismo "sin evaluar". Vive en
 * `seleccion/` y no en `ui/` porque no es una primitiva de interfaz sino una
 * pieza de este dominio: sabe qué significa aprobado y de dónde sale el máximo.
 *
 * `conPorcentaje` es la única diferencia real entre las dos pantallas: en la
 * agenda basta el puntaje; en evaluaciones, donde se decide, interesa también
 * cuánto de la escala se alcanzó.
 */
export default function PuntajeEvaluacion({ candidato, conPorcentaje = false }) {
  const total = numero(candidato.evaluacion_total)

  if (total === null) {
    return <span className="text-xs text-gray-400">sin evaluar</span>
  }

  const maximo = numero(candidato.evaluacion_maximo)
  const porcentaje = numero(candidato.evaluacion_porcentaje)

  return (
    <Progreso
      valor={total}
      total={maximo}
      etiqueta={conPorcentaje ? `${total}/${maximo} · ${porcentaje}%` : `${total}/${maximo}`}
      tono={candidato.evaluacion_aprobado ? 'bg-emerald-500' : 'bg-red-500'}
    />
  )
}
