/**
 * Helpers de formato.
 *
 * Viven aparte de los componentes porque mezclar ambos en un archivo rompe el
 * hot-reload de React (`react-refresh/only-export-components`).
 */

/** Formatea una fecha del backend (llega como string, sin corrimiento de zona). */
export function fecha(valor, conHora = false) {
  if (!valor) return '—'
  const [f, h] = String(valor).split(/[ T]/)
  const [a, m, d] = f.split('-')
  if (!d) return '—'
  return conHora && h ? `${d}/${m}/${a} ${h.slice(0, 5)}` : `${d}/${m}/${a}`
}

export function nombreDe(c) {
  return [c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido]
    .filter(Boolean)
    .join(' ')
}

/**
 * Número que llega del backend como string.
 *
 * MySQL devuelve DECIMAL como texto ('80.00'), y mostrarlo tal cual llena la
 * pantalla de decimales que no aportan: "80.00/100.00" en vez de "80/100".
 */
export function numero(valor) {
  return valor === null || valor === undefined ? null : Number(valor)
}

/**
 * La evaluación de entrevista (5 criterios de venta telefónica) solo aplica a
 * cargos "Agente" — "Agente", "Agente Plus", "Agente Call Center", cualquier
 * campaña (decisión de negocio, 2026-08-31). Mismo criterio por texto que usa
 * el backend (`seleccion.service.js::esCargoAgente`), para que un candidato no
 * muestre "Evaluar" acá y el servidor lo rechace igual.
 */
export function esCargoAgente(cargo) {
  return /agente/i.test(cargo ?? '')
}
