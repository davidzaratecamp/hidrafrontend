import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

function Denegado({ titulo, detalle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="mt-3 text-lg font-semibold text-red-800">{titulo}</h2>
        {detalle && <p className="mt-2 text-sm text-red-600">{detalle}</p>}
      </div>
    </div>
  )
}

/**
 * Guarda de ruta.
 *
 * Se prefiere `permission`: los permisos son datos en la base, así que ampliar
 * el acceso de un rol no obliga a tocar el frontend. `roles` queda para los
 * casos donde la regla es realmente sobre el rol.
 *
 * Cambio importante: un usuario ahora puede tener VARIOS roles, así que se
 * compara contra `user.roles` en vez de contra `user.rol`.
 */
export default function ProtectedRoute({
  children,
  permission,
  permissions,
  roles,
  redirectTo = '/login',
}) {
  const { isAuthenticated, user, hasPermission, hasAnyPermission, hasAnyRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Verificando sesión…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />

  if (permission && !hasPermission(permission)) {
    return (
      <Denegado
        titulo="No tienes acceso a esta página"
        detalle={`Requiere el permiso "${permission}".`}
      />
    )
  }

  if (permissions?.length > 0 && !hasAnyPermission(permissions)) {
    return (
      <Denegado
        titulo="No tienes acceso a esta página"
        detalle={`Requiere alguno de estos permisos: ${permissions.join(', ')}.`}
      />
    )
  }

  if (roles?.length > 0 && !hasAnyRole(roles)) {
    return (
      <Denegado
        titulo="Tu rol no tiene acceso a esta página"
        detalle={`Permitidos: ${roles.join(', ')}. Tus roles: ${
          (user?.roles ?? []).join(', ') || 'ninguno'
        }.`}
      />
    )
  }

  return children
}
