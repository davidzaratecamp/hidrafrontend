import { BrowserRouter as Router, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'
import Login from './components/auth/Login'

import MiTrazabilidad from './components/trazabilidad/MiTrazabilidad'
import TrazabilidadEquipo from './components/trazabilidad/TrazabilidadEquipo'
import TrazabilidadReclutador from './components/trazabilidad/TrazabilidadReclutador'
import NuevoCandidato from './components/candidatos/NuevoCandidato'
import ListaCandidatos from './components/candidatos/ListaCandidatos'
import PerfilCandidato from './components/candidatos/PerfilCandidato'
import Agenda from './components/seleccion/Agenda'
import Decisiones from './components/seleccion/Decisiones'
import DashboardSeleccion from './components/seleccion/DashboardSeleccion'
import GestionUsuarios from './components/usuarios/GestionUsuarios'
import RolesPermisos from './components/usuarios/RolesPermisos'
import Desprendibles from './components/desprendibles/Desprendibles'
import BaseHistorica from './components/historico/BaseHistorica'
import FormularioCandidato from './components/candidato/FormularioCandidato'

/**
 * Rutas de la aplicación.
 *
 * Cambios respecto a la versión anterior:
 *   - Las rutas dejan de llevar el prefijo por rol (`/hydra/reclutador/...`,
 *     `/hydra/seleccion/...`, `/hydra/admin/...`). Con usuarios multirol ese
 *     prefijo dejó de tener sentido: la misma pantalla la usan varios roles y
 *     lo que decide el acceso es el permiso, no el segmento de la URL.
 *   - El acceso se declara con `permission`, que es dato en la base, en vez de
 *     con listas de roles fijas en el código.
 */

/**
 * Los correos enviados con el sistema anterior llevaban una ruta por paso
 * (`/candidato/hoja-vida/:token`). Se redirigen al formulario único para que
 * esos enlaces no queden muertos.
 */
function RedirigirFormularioViejo() {
  const { token } = useParams()
  return <Navigate to={`/candidato/formulario/${token}`} replace />
}

/** Envuelve una pantalla protegida, para no repetir la anidación. */
function Protegida({ permission, permissions, children }) {
  return (
    <ProtectedRoute permission={permission} permissions={permissions}>
      {children}
    </ProtectedRoute>
  )
}

/** Ruta → permiso → pantalla. Un solo lugar donde mirar quién entra a qué. */
const PANTALLAS = [
  { path: '/trazabilidad', permission: 'ver_dashboard', Componente: MiTrazabilidad },
  { path: '/trazabilidad/equipo', permission: 'ver_perfiles_completos', Componente: TrazabilidadEquipo },
  {
    path: '/trazabilidad/reclutador/:reclutadorId',
    permission: 'ver_perfiles_completos',
    Componente: TrazabilidadReclutador,
  },

  { path: '/candidatos', permission: 'ver_candidatos', Componente: ListaCandidatos },
  { path: '/candidatos/nuevo', permission: 'crear_candidatos', Componente: NuevoCandidato },
  { path: '/candidatos/:candidatoId', permission: 'ver_candidatos', Componente: PerfilCandidato },
  { path: '/historico', permission: 'ver_candidatos', Componente: BaseHistorica },

  { path: '/seleccion/dashboard', permission: 'evaluar_candidatos', Componente: DashboardSeleccion },
  {
    path: '/seleccion/agenda',
    permissions: ['agendar_entrevistas', 'registrar_asistencia', 'evaluar_candidatos'],
    Componente: Agenda,
  },
  { path: '/seleccion/evaluaciones', permission: 'ver_candidatos', Componente: Decisiones },

  { path: '/usuarios', permission: 'ver_usuarios', Componente: GestionUsuarios },
  { path: '/roles', permission: 'ver_usuarios', Componente: RolesPermisos },

  // Sin permiso: cualquiera con sesión ve SUS propios desprendibles.
  { path: '/desprendibles', Componente: Desprendibles },
]

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RoleRedirect />} />

            {PANTALLAS.map(({ path, permission, permissions, Componente }) => (
              <Route
                key={path}
                path={path}
                element={
                  <Protegida permission={permission} permissions={permissions}>
                    <Componente />
                  </Protegida>
                }
              />
            ))}

            {/* Formulario público del candidato: sin sesión, autorizado por el token. */}
            <Route path="/candidato/formulario/:token" element={<FormularioCandidato />} />
            <Route path="/candidato/:paso/:token" element={<RedirigirFormularioViejo />} />

            {/* Las rutas viejas con prefijo por rol redirigen al inicio. */}
            <Route path="/hydra/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}
