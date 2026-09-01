/**
 * Utilidades puras compartidas por las gráficas de `graficas.jsx`. Separadas
 * en su propio archivo (en vez de vivir junto a los componentes) porque
 * react-refresh exige que un archivo `.jsx` solo exporte componentes — mismo
 * patrón que `estilos.js` junto a `campos.jsx`.
 */

/** Redondea hacia arriba a un número "limpio", para que el eje Y no muestre topes como 17 o 23. */
export function techoAmable(valor) {
  if (valor <= 5) return 5
  const magnitud = 10 ** Math.floor(Math.log10(valor))
  const normalizado = valor / magnitud
  const paso = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10
  return paso * magnitud
}

/**
 * Tono de una rampa ordinal de un solo hue (claro → oscuro), para series donde
 * el ORDEN es el dato (etapas de un embudo, criterios en el orden real de la
 * llamada). Rango validado contra superficie blanca: extremo claro ≥ 2:1 de
 * contraste, banda de luminosidad monótona
 * (`node scripts/validate_palette.js ... --ordinal`).
 */
const EMBUDO_CLARO = { r: 0x87, g: 0xbc, b: 0xdd }
const EMBUDO_OSCURO = { r: 0x17, g: 0x3f, b: 0x60 }

export function tonoOrdinal(fraccion) {
  const mezclar = (canal) =>
    Math.round(EMBUDO_CLARO[canal] + (EMBUDO_OSCURO[canal] - EMBUDO_CLARO[canal]) * fraccion)
  return `rgb(${mezclar('r')} ${mezclar('g')} ${mezclar('b')})`
}

/**
 * Nombre del mes en curso y el día de hoy — se recalculan si se recarga la
 * página. La gráfica de serie mensual cambia sola en cuanto cambia el mes
 * real (octubre trae sus 31 días, febrero los suyos), sin tocar código.
 */
export const NOMBRE_MES_ACTUAL = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
export const HOY = new Date().getDate()
export const HOY_ETIQUETA = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
