import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Eye,
  Mail,
  Edit,
  Users,
  Building,
  MapPin,
  Clock,
  Calendar,
  Phone,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

export default function ListaCandidatos() {
  const navigate = useNavigate()
  const [candidatos, setCandidatos] = useState([])
  const [resumenEstados, setResumenEstados] = useState({})
  const [estadoActivo, setEstadoActivo] = useState(() => {
    // Preservar el estado del filtro en localStorage
    return localStorage.getItem('listaCandidatos_estadoActivo') || 'nuevo'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarContactosFallidos, setMostrarContactosFallidos] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  // Modal "Citar" (2026-08-26): ya no pide fecha/hora de entrevista - se simplificó al mismo
  // control "Citado" (Sí/No) + "Estado Gestión Reclutamiento" del formulario "Nuevo Candidato"
  // (citado_gestion/estado_gestion_reclutamiento, actualizarCitadoGestion). No toca `estado` ni
  // `fecha_citacion_entrevista` (misma decisión de columnas separadas que en crearCandidato).
  const [candidatoACitar, setCandidatoACitar] = useState(null)
  const [citadoGestionModal, setCitadoGestionModal] = useState('')
  const [estadoGestionModal, setEstadoGestionModal] = useState('')
  const [guardandoCita, setGuardandoCita] = useState(false)
  const [catalogos, setCatalogos] = useState({})

  // 'nuevo' reemplaza a 'contacto_exitoso' (2026-08-26) - lista todos los registros creados vía
  // "Nuevo Candidato" (todo candidato nuevo entra con estado='nuevo', ver crearCandidato), del
  // más reciente al más antiguo (mismo ORDER BY updated_at DESC del backend, que en estado
  // 'nuevo' coincide con la fecha de creación salvo que se edite el registro).
  const estadosConfig = {
    nuevo: { label: 'Nuevos Candidatos', color: 'bg-green-100 text-green-800' },
    formularios_enviados: { label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800' },
    formularios_completados: { label: 'Formularios Completados', color: 'bg-green-100 text-green-800' },
    citado: { label: 'Citados', color: 'bg-purple-100 text-purple-800' },
    entrevistado: { label: 'Entrevistados', color: 'bg-indigo-100 text-indigo-800' }
  }

  const estadosContactoFallido = {
    contacto_fallido: { label: 'Contacto Fallido', color: 'bg-red-100 text-red-800' },
    no_contesta: { label: 'No Contesta', color: 'bg-orange-100 text-orange-800' },
    reagendar: { label: 'Reagendar', color: 'bg-yellow-100 text-yellow-800' },
    no_interesado: { label: 'No Interesado', color: 'bg-red-100 text-red-800' },
    numero_incorrecto: { label: 'Número Incorrecto', color: 'bg-red-100 text-red-800' },
    no_asistio: { label: 'No Asistió', color: 'bg-orange-100 text-orange-800' }
  }

  useEffect(() => {
    cargarResumenEstados()
    cargarCatalogos()
  }, [])

  useEffect(() => {
    cargarCandidatos()
  }, [estadoActivo, page, busquedaActiva])

  // Guardar el estado activo en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('listaCandidatos_estadoActivo', estadoActivo)
  }, [estadoActivo])

  // Debounce del buscador (300ms): la búsqueda ahora la resuelve el backend sobre TODO el
  // estado (no solo la página cargada), así que no conviene disparar un fetch por cada tecla.
  // Vuelve a la página 1 en el mismo batch en que se actualiza la búsqueda (un solo fetch).
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setBusquedaActiva(searchTerm.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Cambia el filtro de estado y vuelve a la página 1 (batched: un solo fetch, no dos)
  const handleSetEstadoActivo = (estado) => {
    setEstadoActivo(estado)
    setPage(1)
  }

  const cargarResumenEstados = async () => {
    try {
      const resumen = await ApiService.getResumenEstados()
      setResumenEstados(resumen)
    } catch (error) {
      console.error('Error cargando resumen:', error)
    }
  }

  // Catálogo de "Estado Gestión Reclutamiento" para el modal "Citar" (mismo que usa
  // NuevoCandidato.jsx).
  const cargarCatalogos = async () => {
    try {
      const data = await ApiService.getCatalogos()
      setCatalogos(data)
    } catch (error) {
      console.error('Error cargando catálogos:', error)
    }
  }

  const cargarCandidatos = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getCandidatosPorEstado(estadoActivo, page, busquedaActiva)
      setCandidatos(data.candidatos)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReenviarEmail = async (candidatoId) => {
    try {
      await ApiService.reenviarEmail(candidatoId)
      cargarCandidatos()
      cargarResumenEstados()
      alert('Email reenviado exitosamente')
    } catch (error) {
      console.error('Error reenviando email:', error)
      alert('Error al reenviar email')
    }
  }

  const handleAbrirModalCitar = (candidato) => {
    setCandidatoACitar(candidato)
    setCitadoGestionModal('')
    setEstadoGestionModal('')
  }

  const handleConfirmarCita = async () => {
    if (!citadoGestionModal) {
      alert('Selecciona Citado')
      return
    }
    if (citadoGestionModal === 'no' && !estadoGestionModal) {
      alert('Selecciona un Estado Gestión Reclutamiento')
      return
    }

    try {
      setGuardandoCita(true)
      await ApiService.actualizarCitadoGestion(candidatoACitar.id, citadoGestionModal, estadoGestionModal)

      alert('Candidato actualizado exitosamente')
      setCandidatoACitar(null)
      setCitadoGestionModal('')
      setEstadoGestionModal('')
      cargarCandidatos()
      cargarResumenEstados()
    } catch (error) {
      console.error('Error actualizando citado:', error)
      alert('Error al actualizar el candidato')
    } finally {
      setGuardandoCita(false)
    }
  }

  const handleMarcarNoAsistio = async (candidatoId, candidato) => {
    if (!confirm(`¿Está seguro de marcar a ${candidato.primer_nombre} ${candidato.primer_apellido} como "No asistió"?`)) {
      return;
    }
    
    try {
      await ApiService.cambiarEstadoCandidato(candidatoId, 'no_asistio');
      
      alert('Candidato marcado como "No asistió" exitosamente');
      cargarCandidatos();
      cargarResumenEstados();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al marcar como no asistió');
    }
  }

  const getAccionButton = (candidato) => {
    if (candidato.estado === 'contacto_exitoso') {
      return (
        <button
          onClick={() => handleAbrirModalCitar(candidato)}
          className="flex items-center px-2 py-1 lg:px-3 lg:py-1 bg-purple-600 text-white rounded text-xs lg:text-sm hover:bg-purple-700 transition-colors"
        >
          <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
          <span className="hidden sm:inline">Citar</span>
        </button>
      )
    }
    
    if (candidato.estado === 'formularios_enviados') {
      return (
        <button
          onClick={() => handleReenviarEmail(candidato.id)}
          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          <Mail className="h-4 w-4 mr-1" />
          Reenviar
        </button>
      )
    }
    
    if (candidato.estado === 'nuevo') {
      // Si en el formulario "Nuevo Candidato" ya se marcó Citado=Sí (citado_gestion), no se
      // ofrece el modal "Citar" de nuevo acá - solo se ofrece a los que quedaron con Citado=No
      // (o sin marcar, candidatos previos a esta funcionalidad) (2026-08-26).
      if (candidato.citado_gestion === 'si') {
        return (
          <button className="flex items-center px-3 py-1 bg-gray-300 text-gray-600 rounded text-sm cursor-not-allowed">
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </button>
        )
      }
      return (
        <button
          onClick={() => handleAbrirModalCitar(candidato)}
          className="flex items-center px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Citar
        </button>
      )
    }

    if (candidato.estado === 'citado' || candidato.estado === 'entrevistado') {
      return (
        <button
          onClick={() => handleReenviarEmail(candidato.id)}
          className="flex items-center px-2 py-1 lg:px-3 lg:py-1 bg-blue-600 text-white rounded text-xs lg:text-sm hover:bg-blue-700 transition-colors"
        >
          <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
          <span className="hidden sm:inline">Email</span>
        </button>
      )
    }

    return (
      <button className="flex items-center px-3 py-1 bg-gray-300 text-gray-600 rounded text-sm cursor-not-allowed">
        <Eye className="h-4 w-4 mr-1" />
        Ver
      </button>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Candidatos</h1>
              <p className="text-sm lg:text-base text-gray-600">Gestión y seguimiento del proceso de reclutamiento</p>
            </div>
            <div className="flex items-center text-gray-600 text-sm lg:text-base">
              <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 flex-shrink-0" />
              <span className="whitespace-nowrap">
                Total: {Object.values(resumenEstados).reduce((a, b) => a + b, 0)} candidatos
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {/* Estados principales */}
            {Object.entries(estadosConfig).map(([estado, config]) => (
              <button
                key={estado}
                onClick={() => handleSetEstadoActivo(estado)}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-all text-xs lg:text-sm ${
                  estadoActivo === estado
                    ? config.color + ' shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">{config.label.split(' ')[0]}</span>
                <span className="ml-1">({resumenEstados[estado] || 0})</span>
              </button>
            ))}
            
            {/* Botón para contactos fallidos con dropdown */}
            <div className="relative">
              <button
                onClick={() => setMostrarContactosFallidos(!mostrarContactosFallidos)}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg font-medium transition-all flex items-center text-xs lg:text-sm ${
                  Object.keys(estadosContactoFallido).includes(estadoActivo)
                    ? 'bg-red-100 text-red-800 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">Contactos Fallidos</span>
                <span className="sm:hidden">C. Fallidos</span>
                <span className="ml-1">({Object.keys(estadosContactoFallido).reduce((total, estado) => total + (resumenEstados[estado] || 0), 0)})</span>
                {mostrarContactosFallidos ? 
                  <ChevronUp className="h-3 w-3 lg:h-4 lg:w-4 ml-1 flex-shrink-0" /> : 
                  <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 ml-1 flex-shrink-0" />
                }
              </button>
              
              {/* Dropdown con los estados de contacto fallido */}
              {mostrarContactosFallidos && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-full">
                  {Object.entries(estadosContactoFallido).map(([estado, config]) => (
                    <button
                      key={estado}
                      onClick={() => {
                        handleSetEstadoActivo(estado)
                        setMostrarContactosFallidos(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        estadoActivo === estado ? config.color : 'text-gray-700'
                      }`}
                    >
                      {config.label} ({resumenEstados[estado] || 0})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="h-4 w-4 lg:h-5 lg:w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar candidatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 lg:pl-10 pr-4 py-2 lg:py-3 w-full sm:max-w-md border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando candidatos...</p>
            </div>
          ) : candidatos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay candidatos en este estado</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards - visible only on small screens */}
              <div className="block lg:hidden">
                {candidatos.map((candidato) => (
                  <div key={candidato.id} className="border-b border-gray-200 p-4 last:border-b-0">
                    <div className="flex flex-col space-y-3">
                      {/* Header with name and actions */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {candidato.primer_nombre} {candidato.primer_apellido}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{candidato.email_personal}</p>
                        </div>
                        <button 
                          onClick={() => navigate(`/hydra/reclutador/candidato/${candidato.id}`)}
                          className="flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors ml-2 flex-shrink-0"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                      </div>

                      {/* Contact info */}
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{candidato.numero_celular}</span>
                        {candidato.fecha_citacion_entrevista && (
                          <>
                            <span className="mx-2">•</span>
                            <Calendar className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{new Date(candidato.fecha_citacion_entrevista).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {/* Client and position */}
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center text-gray-600 flex-1 min-w-0">
                          <Building className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{candidato.cliente}</span>
                        </div>
                        <div className="text-gray-900 font-medium truncate">
                          {candidato.cargo}
                        </div>
                      </div>

                      {/* Progress and actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 mr-4">
                          <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {candidato.progreso_formularios}/6
                          </span>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          {getAccionButton(candidato)}
                          <button 
                            onClick={() => navigate(`/hydra/reclutador/editar-candidato/${candidato.id}`)}
                            className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table - hidden on small screens */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidatos.map((candidato) => (
                    <tr key={candidato.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidato.primer_nombre} {candidato.primer_apellido}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <span>{candidato.email_personal}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {candidato.numero_celular}
                        </div>
                        {candidato.fecha_citacion_entrevista && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(candidato.fecha_citacion_entrevista).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Building className="h-4 w-4 mr-1 text-gray-400" />
                          {candidato.cliente}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{candidato.cargo}</div>
                        {candidato.ciudad && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {candidato.ciudad}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {candidato.progreso_formularios}/6
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate(`/hydra/reclutador/candidato/${candidato.id}`)}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Perfil
                          </button>
                          {getAccionButton(candidato)}
                          <button 
                            onClick={() => navigate(`/hydra/reclutador/editar-candidato/${candidato.id}`)}
                            className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 lg:px-6">
                  <p className="text-xs lg:text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages} · {pagination.total} candidatos
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={pagination.page <= 1}
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>

      {/* Modal "Citar": Citado (Sí/No) + Estado Gestión Reclutamiento, mismo control que
          NuevoCandidato.jsx (2026-08-26, ya no pide fecha/hora de entrevista) */}
      {candidatoACitar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Citado - {candidatoACitar.primer_nombre} {candidatoACitar.primer_apellido}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Citado *
                </label>
                <select
                  value={citadoGestionModal}
                  onChange={(e) => {
                    const valor = e.target.value
                    setCitadoGestionModal(valor)
                    if (valor === 'si') setEstadoGestionModal('')
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecciona</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>

              {citadoGestionModal === 'no' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Gestión Reclutamiento *
                  </label>
                  <select
                    value={estadoGestionModal}
                    onChange={(e) => setEstadoGestionModal(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Selecciona estado</option>
                    {catalogos.estado_gestion_reclutamiento?.length > 0 ? (
                      catalogos.estado_gestion_reclutamiento.map((item) => (
                        item.grupo ? (
                          <optgroup key={item.grupo} label={item.grupo}>
                            {item.opciones.map((op) => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </optgroup>
                        ) : (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        )
                      ))
                    ) : (
                      <>
                        <option value="#Errado">#Errado</option>
                        <option value="No Contesta / Msj Global-Wa">No Contesta / Msj Global-Wa</option>
                        <option value="Contesta / Cuelga / Mensaje Global-Wa">Contesta / Cuelga / Mensaje Global-Wa</option>
                        <optgroup label="NO APTO POR:">
                          <option value="No Apto / Estudiante">No Apto / Estudiante</option>
                          <option value="No Apto / No experiencia">No Apto / No experiencia</option>
                          <option value="No Apto / Ubicación">No Apto / Ubicación</option>
                          <option value="No Apto / Edad mayor a 35">No Apto / Edad mayor a 35</option>
                          <option value="No Apto / No certificado de bachiller">No Apto / No certificado de bachiller</option>
                          <option value="No Apto / Menor de edad">No Apto / Menor de edad</option>
                          <option value="No Apto / Disposición">No Apto / Disposición</option>
                          <option value="No Apto / Sobreperfilado">No Apto / Sobreperfilado</option>
                          <option value="No Apto / EPS">No Apto / EPS</option>
                        </optgroup>
                        <optgroup label="NO INTERESADOS POR:">
                          <option value="No interesado / Horarios">No interesado / Horarios</option>
                          <option value="No interesado / Ventas">No interesado / Ventas</option>
                          <option value="No interesado / Ubicación">No interesado / Ubicación</option>
                          <option value="No interesado / Capacitación">No interesado / Capacitación</option>
                          <option value="No interesado / Call Center">No interesado / Call Center</option>
                          <option value="No interesado / Ya trabaja">No interesado / Ya trabaja</option>
                          <option value="No interesado / No parqueadero">No interesado / No parqueadero</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmarCita}
                  disabled={guardandoCita}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {guardandoCita ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setCandidatoACitar(null)}
                  disabled={guardandoCita}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}