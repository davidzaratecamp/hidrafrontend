/**
 * Clases compartidas del sistema de diseño.
 *
 * Vive aparte de los componentes por la misma razón que `formato.js`: exportar
 * una función junto a componentes rompe el hot-reload
 * (`react-refresh/only-export-components`).
 */

const VARIANTES_BOTON = {
  primario: 'bg-blue-600 text-white shadow-sm shadow-blue-900/10 hover:bg-blue-700 hover:shadow-blue-900/20',
  secundario: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50',
  peligro: 'bg-red-600 text-white shadow-sm shadow-red-900/10 hover:bg-red-700',
}

/**
 * Clases del botón, separadas del componente.
 *
 * Existe para que un enlace pueda verse como botón sin copiar las clases: sin
 * esto, cada acción que navega en vez de ejecutar terminaba con su propio
 * `className` a mano y el sistema de diseño dejaba de ser una sola fuente.
 *
 * `active:scale-[0.97]` es la única retroalimentación táctil que tenía la
 * interfaz: un botón sin ella se siente inerte al hacer clic.
 */
export function clasesBoton({ variante = 'primario', className = '' } = {}) {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANTES_BOTON[variante]} ${className}`
}
