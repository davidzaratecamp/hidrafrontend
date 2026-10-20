/**
 * Configuración de `ModalMarca` (ver `marcas.jsx`). Asistencia (solo Agente) y
 * activo/baja comparten la forma: dos opciones, la segunda exige razón. Cada
 * una dice de dónde leer el valor actual y qué enviar.
 */

export const CONFIG_ASISTENCIA = {
  titulo: 'Asistencia a formación',
  opciones: [
    { valor: true, texto: 'Asistió' },
    { valor: false, texto: 'No asistió' },
  ],
  actual: (c) => ({ valor: c.asistencia.asistio, razon: c.asistencia.razon }),
  ruta: (c) => `/formacion/candidatos/${c.id}/asistencia`,
  cuerpo: (valor, razon) => ({ asistio: valor, razon }),
  ayudaRazon: 'Obligatoria si no asistió.',
  aviso: (c) =>
    c.formacion.estado === 'activo'
      ? 'Si marcas "No asistió", el candidato deja de estar activo.'
      : null,
}

const configEstado = ({ titulo, ruta, aviso }) => ({
  titulo,
  opciones: [
    { valor: 'activo', texto: 'Activo' },
    { valor: 'baja', texto: 'Baja' },
  ],
  actual: (c) => ({ valor: c.formacion.estado, razon: c.formacion.razon }),
  ruta,
  cuerpo: (valor, razon) => ({ estado: valor, razon }),
  ayudaRazon: 'Obligatoria si se da de baja.',
  aviso,
})

/** Activo/baja de un Agente: lo marca Formación. */
export const CONFIG_ESTADO_AGENTE = configEstado({
  titulo: 'Estado en formación',
  ruta: (c) => `/formacion/candidatos/${c.id}/estado`,
  aviso: (c) =>
    c.asistencia?.asistio !== true
      ? 'Para marcar Activo a un Agente primero debe tener la asistencia en "Asistió".'
      : null,
})

/** Activo/baja de un Staff: lo marca Contratación (migración 020). */
export const CONFIG_ESTADO_STAFF = configEstado({
  titulo: 'Activo / baja',
  ruta: (c) => `/formacion/por-contratar/${c.id}/estado`,
  aviso: () => null,
})
