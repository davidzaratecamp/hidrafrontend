import { useContext } from 'react'
import { AuthContext } from './contexto'

/**
 * Acceso al estado de sesión.
 *
 * En archivo propio: exportar un hook junto al provider rompe el hot-reload
 * (`react-refresh/only-export-components`).
 */
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return contexto
}
