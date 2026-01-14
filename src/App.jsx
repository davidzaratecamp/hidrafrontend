import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RoleRedirect from './components/auth/RoleRedirect'
import Login from './components/auth/Login'
import Dashboard from './components/reclutador/Dashboard'
import Estadisticas from './components/reclutador/Estadisticas'
import ListaCandidatos from './components/reclutador/ListaCandidatos'
import NuevoCandidato from './components/reclutador/NuevoCandidato'
import EditarCandidato from './components/reclutador/EditarCandidato'
import PerfilCandidato from './components/reclutador/PerfilCandidato'
import CandidatosSeleccion from './components/seleccion/CandidatosSeleccion'
import PerfilesAprobados from './components/seleccion/PerfilesAprobados'
import PerfilesRechazados from './components/seleccion/PerfilesRechazados'
import GestionUsuarios from './components/seleccion/GestionUsuarios'
import HojaVida from './components/candidato/HojaVida'
import DatosBasicos from './components/candidato/DatosBasicos'
import Estudios from './components/candidato/Estudios'
import Experiencia from './components/candidato/Experiencia'
import Personal from './components/candidato/Personal'
import Consentimiento from './components/candidato/Consentimiento'
import GestionReclutadores from './components/admin/GestionReclutadores'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Redirección inicial basada en rol */}
            <Route path="/" element={<RoleRedirect />} />
            
            {/* Rutas protegidas para reclutadores */}
            <Route 
              path="/hydra/reclutador/dashboard" 
              element={
                <ProtectedRoute permission="ver_dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/reclutador/estadisticas" 
              element={
                <ProtectedRoute permission="ver_estadisticas">
                  <Estadisticas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/reclutador/candidatos" 
              element={
                <ProtectedRoute permission="ver_candidatos">
                  <ListaCandidatos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/reclutador/candidatos/nuevo" 
              element={
                <ProtectedRoute roles={['reclutador', 'seleccion', 'administrador']}>
                  <NuevoCandidato />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/reclutador/editar-candidato/:candidatoId" 
              element={
                <ProtectedRoute permission="editar_candidatos">
                  <EditarCandidato />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/reclutador/candidato/:candidatoId" 
              element={
                <ProtectedRoute roles={['reclutador', 'seleccion', 'administrador']}>
                  <PerfilCandidato />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas protegidas para selección */}
            <Route 
              path="/hydra/seleccion/candidatos" 
              element={
                <ProtectedRoute roles={['seleccion', 'administrador']}>
                  <CandidatosSeleccion />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/seleccion/perfiles-aprobados" 
              element={
                <ProtectedRoute roles={['seleccion', 'administrador']}>
                  <PerfilesAprobados />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hydra/seleccion/perfiles-rechazados" 
              element={
                <ProtectedRoute roles={['seleccion', 'administrador']}>
                  <PerfilesRechazados />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/hydra/seleccion/candidato/:candidatoId"
              element={
                <ProtectedRoute roles={['seleccion', 'administrador']}>
                  <PerfilCandidato />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hydra/seleccion/usuarios"
              element={
                <ProtectedRoute roles={['seleccion', 'administrador']}>
                  <GestionUsuarios />
                </ProtectedRoute>
              }
            />

            {/* Rutas protegidas para administrador */}
            <Route 
              path="/hydra/admin/reclutadores" 
              element={
                <ProtectedRoute roles={['administrador']}>
                  <GestionReclutadores />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas públicas para candidatos (con token) */}
            <Route path="/candidato/hoja-vida/:token" element={<HojaVida />} />
            <Route path="/candidato/datos-basicos/:token" element={<DatosBasicos />} />
            <Route path="/candidato/estudios/:token" element={<Estudios />} />
            <Route path="/candidato/experiencia/:token" element={<Experiencia />} />
            <Route path="/candidato/personal/:token" element={<Personal />} />
            <Route path="/candidato/consentimiento/:token" element={<Consentimiento />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
