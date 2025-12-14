import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirigir según el rol del usuario
  switch (user?.rol) {
    case 'administrador':
      return <Navigate to="/hydra/admin/reclutadores" replace />
    case 'seleccion':
      return <Navigate to="/hydra/seleccion/candidatos" replace />
    case 'reclutador':
    default:
      return <Navigate to="/hydra/reclutador/dashboard" replace />
  }
}