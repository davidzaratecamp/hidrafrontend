import { ArrowRight, History } from 'lucide-react'
import { Vacio } from '../../ui'
import { fecha } from '../../ui/formato'

/**
 * Recorrido completo del candidato por el embudo.
 *
 * Sale de `candidato_estado_historial`, la tabla append-only que introdujo la
 * reestructuración: con el modelo anterior el estado se sobrescribía y esta
 * vista era imposible de construir.
 */
export default function Historial({ historial }) {
  if (historial.length === 0) return <Vacio icono={History} mensaje="Sin movimientos." />

  return (
    <ol className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      {historial.map((h) => (
        <li key={h.id} className="flex items-start gap-4 p-4">
          <time className="w-36 shrink-0 text-xs text-gray-400">{fecha(h.created_at, true)}</time>
          <div className="flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-sm">
              {h.estado_anterior ? (
                <>
                  <span className="text-gray-500">{h.estado_anterior}</span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                </>
              ) : (
                <span className="font-medium text-blue-600">registró</span>
              )}
              <span className="font-medium text-gray-900">{h.estado_nuevo}</span>
            </p>
            {h.motivo && <p className="mt-0.5 text-xs text-gray-500 italic">{h.motivo}</p>}
          </div>
          {/* Sin usuario = lo hizo el propio candidato desde el formulario público. */}
          <span className="shrink-0 text-xs text-gray-400">{h.usuario ?? 'el candidato'}</span>
        </li>
      ))}
    </ol>
  )
}
