import { useAuth } from '../../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, permission, roles, redirectTo = '/login' }) {
  const { isAuthenticated, user, hasPermission, isRole, loading } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Si se requiere un permiso específico
  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">Acceso Denegado</h2>
            <p className="text-red-600 mt-2">No tienes permisos para acceder a esta página.</p>
            <p className="text-sm text-red-500 mt-1">Permiso requerido: {permission}</p>
          </div>
        </div>
      </div>
    )
  }

  // Si se requieren roles específicos
  if (roles && roles.length > 0 && !roles.some(role => isRole(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-red-800">Acceso Denegado</h2>
            <p className="text-red-600 mt-2">Tu rol no tiene acceso a esta página.</p>
            <p className="text-sm text-red-500 mt-1">
              Roles permitidos: {roles.join(', ')}
            </p>
            <p className="text-sm text-red-500">
              Tu rol actual: {user?.rol}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Si pasa todas las validaciones, mostrar el contenido
  return children
}