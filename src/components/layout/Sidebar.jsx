import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, Menu, User, X } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { menuVisible } from './menu'

/**
 * Sidebar único, generado a partir de los permisos del usuario.
 *
 * Sustituye a `AdminSidebar.jsx`, `Sidebar.jsx` y `SidebarSeleccion.jsx`, que
 * tenían cada uno su propio arreglo fijo de opciones y podían divergir —y
 * divergían— de los permisos reales del backend.
 */
export default function Sidebar() {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth()
  const [abierto, setAbierto] = useState(false)

  const secciones = menuVisible({ hasPermission, hasAnyPermission })
  const cerrar = () => setAbierto(false)

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {abierto ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {abierto && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={cerrar} />}

      <aside
        className={`bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
          ${abierto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* El logo ya trae el nombre y "Reclutamiento Asisteing" impresos:
              no se repite como texto aparte al lado. */}
          <div className="border-b border-gray-200 px-6 py-5">
            <img
              src="/hydra-logo.jpg"
              alt="Hydra — Reclutamiento Asisteing"
              className="mx-auto h-auto w-full max-w-[9rem]"
            />
          </div>

          <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
            {secciones.map((seccion) => (
              <div key={seccion.titulo}>
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {seccion.titulo}
                </p>
                <div className="space-y-1">
                  {seccion.items.map(({ path, icon: Icono, label }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end
                      onClick={cerrar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'border-blue-600 bg-blue-50 font-medium text-blue-700'
                            : 'border-transparent text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <Icono className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombreCompleto}
                </p>
                {/* Varios roles: se listan todos, no uno solo. */}
                <p className="text-xs text-gray-500 truncate">
                  {(user?.roles ?? []).join(' · ') || 'Sin roles'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                cerrar()
                logout()
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
