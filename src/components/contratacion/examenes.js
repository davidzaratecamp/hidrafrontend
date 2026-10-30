/**
 * Exámenes médicos que marca SST en Gestor (migración 022). Etiquetas compartidas
 * por la pantalla de exámenes de selección y el detalle del lote.
 */

export const ESTADO_EXAMEN = {
  pendiente: { texto: 'Examen pendiente', tono: 'ambar' },
  no_asistio: { texto: 'No asistió', tono: 'rojo' },
  reagendado: { texto: 'Reagendado', tono: 'azul' },
  asistio: { texto: 'Asistió · sin resultado', tono: 'azul' },
  aprobado: { texto: 'Aprobó', tono: 'verde' },
  no_aprobado: { texto: 'No aprobó', tono: 'rojo' },
}

export const EVENTO_EXAMEN = {
  asistio: 'Asistió a los exámenes médicos',
  no_asistio: 'No asistió a los exámenes médicos',
  aprobado: 'Aprobó los exámenes médicos',
  no_aprobado: 'No aprobó los exámenes médicos',
  continuidad: 'Selección dio continuidad (se reagenda)',
  no_continuidad: 'Selección no dio continuidad',
}

export const quienMarco = (e) => `${e.origen === 'hydra' ? 'Selección' : 'SST'}${e.marcado_por ? ` · ${e.marcado_por}` : ''}`
