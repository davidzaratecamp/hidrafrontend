import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { menuVisible } from '../layout/menu'

/**
 * Destino inicial tras iniciar sesión.
 *
 * Ya no hay un `switch (user.rol)` con una ruta fija por rol: un usuario puede
 * tener varios roles y ese switch tomaba solo el primero que coincidiera.
 *
 * En su lugar se manda al usuario a la primera opción que su menú realmente le
 * muestra. Así nunca aterriza en una pantalla a la que no tiene acceso, ni hace
 * falta mantener el mapa rol → ruta sincronizado con los permisos.
 */
export default function RoleRedirect() {
  const { loading, isAuthenticated, hasPermission, hasAnyPermission } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Cargando…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const primera = menuVisible({ hasPermission, hasAnyPermission })
    .flatMap((seccion) => seccion.items)
    .at(0)

  return <Navigate to={primera?.path ?? '/sin-acceso'} replace />
}
