import ListaCandidatos from './ListaCandidatos'

/**
 * "Candidatos Staff" del menú lateral: mismo listado que "Candidatos", con el
 * filtro de cargo fijo en "distinto a Agente" (decisión de negocio,
 * 2026-09-02). Reemplaza a la vista "Sin evaluación (no Agente)" que tenía
 * "Clínica Agentes" — ver comentarios en `ListaCandidatos.jsx`.
 */
export default function CandidatosStaff() {
  return <ListaCandidatos segmento="staff" />
}
