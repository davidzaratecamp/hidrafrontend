import { NavLink } from 'react-router-dom'
import {
  Users,
  FileText,
  Building,
  LogOut,
  User,
  UserPlus,
  UserCheck,
  UserX,
  UserCog
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SidebarSeleccion() {
  const { user, logout, hasPermission } = useAuth()

  const menuItems = [
    {
      path: '/hydra/seleccion/candidatos',
      icon: Users,
      label: 'Candidatos',
      permission: 'ver_candidatos'
    },
    {
      path: '/hydra/seleccion/perfiles-aprobados',
      icon: UserCheck,
      label: 'Perfiles Aprobados',
      permission: 'ver_candidatos'
    },
    {
      path: '/hydra/seleccion/perfiles-rechazados',
      icon: UserX,
      label: 'Perfiles Rechazados',
      permission: 'ver_candidatos'
    },
    {
      path: '/hydra/seleccion/usuarios',
      icon: UserCog,
      label: 'Gestión de Usuarios',
      permission: 'ver_candidatos'
    },
    {
      path: '/hydra/reclutador/dashboard',
      icon: UserPlus,
      label: 'Interfaz Reclutamiento',
      permission: 'crear_candidatos',
      openInNewTab: true
    },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  )

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Building className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">ASISTE ING</h1>
            <p className="text-sm text-gray-600">Selección</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            
            // Caso especial: Items que se abren en nueva pestaña
            if (item.openInNewTab) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-item rounded-lg flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Abrir interfaz de reclutamiento completa en nueva pestaña"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                  <span className="ml-auto text-xs text-gray-400">↗</span>
                </a>
              )
            }
            
            // Navegación normal para otros elementos
            return (
              <NavLink
                key={item.path}
                to={item.path}
                state={item.state}
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
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <User className="h-4 w-4 text-green-600" />
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
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-green-600 text-center">
            Módulo de Selección v1.0
          </p>
        </div>
      </div>
    </div>
  )
}