import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  UserX, Eye, Calendar, Briefcase, 
  Filter, Search, RefreshCw, BarChart3,
  AlertTriangle, XCircle, TrendingDown, Users,
  FileText, Clock, User
} from 'lucide-react'
import SidebarSeleccion from './SidebarSeleccion'
import { useAuth } from '../../context/AuthContext'

export default function PerfilesRechazados() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidatos, setCandidatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    buscar: '',
    operacion: '',
    psicologoDecision: '',
    fechaDesde: '',
    fechaHasta: ''
  })

  const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await cargarCandidatosRechazados()
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCandidatosRechazados = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/candidatos-rechazados`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCandidatos(data.candidatos)
      }
    } catch (error) {
      console.error('Error cargando candidatos rechazados:', error)
    }
  }

  const candidatosFiltrados = candidatos.filter(candidato => {
    const matchBuscar = !filtros.buscar || 
      `${candidato.primer_nombre} ${candidato.primer_apellido}`.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
      candidato.email_personal?.toLowerCase().includes(filtros.buscar.toLowerCase()) ||
      candidato.numero_celular?.includes(filtros.buscar)

    const matchOperacion = !filtros.operacion || candidato.cliente === filtros.operacion
    const matchPsicologo = !filtros.psicologoDecision || candidato.nombre_psicologo_decision?.toLowerCase().includes(filtros.psicologoDecision.toLowerCase())
    
    const matchFecha = (!filtros.fechaDesde && !filtros.fechaHasta) || 
      (candidato.fecha_aprobacion_final && 
       new Date(candidato.fecha_aprobacion_final) >= (filtros.fechaDesde ? new Date(filtros.fechaDesde) : new Date('1900-01-01')) &&
       new Date(candidato.fecha_aprobacion_final) <= (filtros.fechaHasta ? new Date(filtros.fechaHasta + 'T23:59:59') : new Date()))

    return matchBuscar && matchOperacion && matchPsicologo && matchFecha
  })

  const getOperacionesUnicas = () => {
    const operaciones = [...new Set(candidatos.map(c => c.cliente))]
    return operaciones.filter(op => op)
  }

  const getPsicologosUnicos = () => {
    const psicologos = [...new Set(candidatos.map(c => c.nombre_psicologo_decision))]
    return psicologos.filter(p => p)
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPuntajeColor = (puntaje) => {
    if (puntaje >= 90) return 'bg-green-100 text-green-800'
    if (puntaje >= 85) return 'bg-blue-100 text-blue-800'
    if (puntaje >= 80) return 'bg-yellow-100 text-yellow-800'
    if (puntaje >= 71) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarSeleccion />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando perfiles rechazados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarSeleccion />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                  <UserX className="h-8 w-8 mr-3 text-red-600" />
                  Perfiles Rechazados
                </h1>
                <p className="text-sm lg:text-base text-gray-600">
                  Candidatos rechazados en la decisión final por parte del psicólogo
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={cargarDatos}
                  className="btn-secondary flex items-center text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Rechazados</p>
                    <p className="text-lg font-semibold text-gray-900">{candidatos.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Promedio Puntaje</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {candidatos.length > 0 ? 
                        (candidatos.reduce((sum, c) => sum + (c.evaluacion_total || 0), 0) / candidatos.length).toFixed(1)
                        : '0'
                      }%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Con Puntaje ≥71%</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {candidatos.filter(c => c.evaluacion_total >= 71).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Psicólogos Activos</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {getPsicologosUnicos().length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-6">
            <div className="flex items-center mb-4">
              <Filter className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre, email o teléfono..."
                    value={filtros.buscar}
                    onChange={(e) => setFiltros({...filtros, buscar: e.target.value})}
                    className="pl-10 input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operación</label>
                <select
                  value={filtros.operacion}
                  onChange={(e) => setFiltros({...filtros, operacion: e.target.value})}
                  className="input-field"
                >
                  <option value="">Todas las operaciones</option>
                  {getOperacionesUnicas().map(operacion => (
                    <option key={operacion} value={operacion}>{operacion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Psicólogo</label>
                <input
                  type="text"
                  placeholder="Buscar psicólogo..."
                  value={filtros.psicologoDecision}
                  onChange={(e) => setFiltros({...filtros, psicologoDecision: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Lista de Candidatos Rechazados */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Perfiles Rechazados ({candidatosFiltrados.length})
              </h3>
            </div>

            {candidatosFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron perfiles rechazados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Candidato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Operación / Campaña
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reclutador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Puntaje Obtenido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Psicólogo Decisión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Razón Rechazo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Decisión
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidatosFiltrados.map((candidato) => {
                      return (
                        <tr key={candidato.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {candidato.primer_nombre} {candidato.primer_apellido}
                              </p>
                              <p className="text-xs text-gray-500">{candidato.email_personal}</p>
                              <p className="text-xs text-gray-500">{candidato.numero_celular}</p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{candidato.cliente}</p>
                              <p className="text-xs text-gray-500">{candidato.cargo}</p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {candidato.nombre_reclutador || 'No asignado'}
                              </p>
                              <p className="text-xs text-gray-500">Reclutador responsable</p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <XCircle className="h-5 w-5 mr-2 text-red-500" />
                              <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getPuntajeColor(candidato.evaluacion_total)}`}>
                                {candidato.evaluacion_total || 0}%
                              </span>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {candidato.nombre_psicologo_decision || 'No asignado'}
                                </p>
                                <p className="text-xs text-gray-500">Psicólogo decisión</p>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 max-w-xs">
                            <div className="text-sm text-gray-900">
                              {candidato.aprobacion_final_razon ? (
                                <div>
                                  <p className="text-sm leading-5 break-words">
                                    {candidato.aprobacion_final_razon.length > 100 
                                      ? `${candidato.aprobacion_final_razon.substring(0, 100)}...`
                                      : candidato.aprobacion_final_razon
                                    }
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Sin razón especificada</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm text-gray-900">
                                {formatearFecha(candidato.fecha_aprobacion_final)}
                              </p>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/hydra/seleccion/candidato/${candidato.id}`)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Ver perfil completo"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}