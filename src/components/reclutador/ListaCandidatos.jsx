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
  ChevronUp
} from 'lucide-react'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

export default function ListaCandidatos() {
  const navigate = useNavigate()
  const [candidatos, setCandidatos] = useState([])
  const [resumenEstados, setResumenEstados] = useState({})
  const [estadoActivo, setEstadoActivo] = useState('nuevo')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarContactosFallidos, setMostrarContactosFallidos] = useState(false)

  const estadosConfig = {
    nuevo: { label: 'Nuevos', color: 'bg-gray-100 text-gray-800' },
    contacto_exitoso: { label: 'Contacto Exitoso', color: 'bg-green-100 text-green-800' },
    formularios_enviados: { label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800' },
    formularios_completados: { label: 'Formularios Completados', color: 'bg-green-100 text-green-800' }
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
  }, [])

  useEffect(() => {
    cargarCandidatos()
  }, [estadoActivo])

  const cargarResumenEstados = async () => {
    try {
      const resumen = await ApiService.getResumenEstados()
      setResumenEstados(resumen)
    } catch (error) {
      console.error('Error cargando resumen:', error)
    }
  }

  const cargarCandidatos = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getCandidatosPorEstado(estadoActivo)
      setCandidatos(data)
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

  const handleCambiarEstado = async (candidatoId, candidato, nuevoEstado, accion) => {
    if (!confirm(`¿Está seguro de ${accion.toLowerCase()} a ${candidato.primer_nombre} ${candidato.primer_apellido}?`)) {
      return;
    }
    
    try {
      await ApiService.cambiarEstadoCandidato(candidatoId, nuevoEstado);
      
      alert(`${accion} exitosamente`);
      cargarCandidatos();
      cargarResumenEstados();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert(`Error al ${accion.toLowerCase()}`);
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

  const candidatosFiltrados = candidatos.filter(candidato => {
    const searchLower = searchTerm.toLowerCase()
    return (
      candidato.primer_nombre.toLowerCase().includes(searchLower) ||
      candidato.primer_apellido.toLowerCase().includes(searchLower) ||
      candidato.email_personal.toLowerCase().includes(searchLower) ||
      candidato.numero_documento.includes(searchTerm)
    )
  })

  const getAccionButton = (candidato) => {
    if (candidato.estado === 'nuevo') {
      return (
        <button
          onClick={() => handleReenviarEmail(candidato.id)}
          className="flex items-center px-2 py-1 lg:px-3 lg:py-1 bg-blue-600 text-white rounded text-xs lg:text-sm hover:bg-blue-700 transition-colors"
        >
          <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-1 flex-shrink-0" />
          <span className="hidden sm:inline">Enviar</span>
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
      return (
        <button
          onClick={() => handleCambiarEstado(candidato.id, candidato, 'citado', 'Marcar como Citado')}
          className="flex items-center px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Citar
        </button>
      )
    }

    if (candidato.estado === 'citado') {
      return (
        <button
          onClick={() => handleMarcarNoAsistio(candidato.id, candidato)}
          className="flex items-center px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
        >
          <Clock className="h-4 w-4 mr-1" />
          No asistió
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
                onClick={() => setEstadoActivo(estado)}
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
                        setEstadoActivo(estado)
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
          ) : candidatosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay candidatos en este estado</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards - visible only on small screens */}
              <div className="block lg:hidden">
                {candidatosFiltrados.map((candidato) => (
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
                  {candidatosFiltrados.map((candidato) => (
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
                        {candidato.oleada && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {candidato.oleada}
                          </span>
                        )}
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
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}