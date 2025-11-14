import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  BarChart3,
  Building,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth()

  const menuItems = [
    {
      path: '/hydra/reclutador/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      permission: 'ver_dashboard'
    },
    {
      path: '/hydra/reclutador/candidatos/nuevo',
      icon: UserPlus,
      label: 'Nuevo Candidato',
      permission: 'crear_candidatos'
    },
    {
      path: '/hydra/reclutador/candidatos',
      icon: Users,
      label: 'Candidatos',
      permission: 'ver_candidatos'
    },
    {
      path: '/hydra/reclutador/estadisticas',
      icon: BarChart3,
      label: 'Estadísticas',
      permission: 'ver_estadisticas'
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Hydra</h1>
            <p className="text-sm text-gray-600">Reclutamiento</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `sidebar-item rounded-lg ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nombre_completo}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.rol}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-600 text-center">
            Sistema de Reclutamiento v1.0
          </p>
        </div>
      </div>
    </div>
  )
}