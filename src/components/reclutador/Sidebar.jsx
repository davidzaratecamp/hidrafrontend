import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  BarChart3,
  Building,
  LogOut,
  User,
  Menu,
  X,
  Settings
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    },
    {
      path: '/hydra/admin/reclutadores',
      icon: Settings,
      label: 'Admin Panel',
      adminOnly: true
    }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return user?.rol === 'administrador'
    }
    return !item.permission || hasPermission(item.permission)
  })

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-800">Hydra</h1>
                <p className="text-sm text-gray-600">Reclutamiento</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `sidebar-item rounded-lg ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
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
              onClick={() => {
                logout()
                closeMobileMenu()
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Footer */}
          <div className="p-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 text-center">
                Sistema de Reclutamiento v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}