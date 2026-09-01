import { useParams } from 'react-router-dom'
import MiTrazabilidad from './MiTrazabilidad'

/**
 * Trazabilidad de OTRO reclutador, para quien puede ver a todo el equipo.
 *
 * Reutiliza la misma vista que el reclutador ve de sí mismo: es exactamente la
 * misma información, solo cambia de quién. El backend valida el permiso
 * (`ver_perfiles_completos`) en `/trazabilidad/reclutador/:id`.
 */
export default function TrazabilidadReclutador() {
  const { reclutadorId } = useParams()

  return (
    <MiTrazabilidad
      reclutadorId={reclutadorId}
      titulo="Trazabilidad del reclutador"
      descripcion="Gestión del reclutador seleccionado por periodo"
    />
  )
}
