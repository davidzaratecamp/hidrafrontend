import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, CheckCircle,
  Clock, Eye,
  Filter, Search, RefreshCw, BarChart3,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import Sidebar from './Sidebar'

export default function CandidatosTotal() {
  const navigate = useNavigate()
  const [candidatos, setCandidatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({ operaciones: [], reclutadores: [] })
  const [filtros, setFiltros] = useState({
    buscar: '',
    operacion: '',
    asistencia: '',
    estado: '',
    reclutador: ''
  })
  // Texto de búsqueda tras el debounce (ver más abajo) - separado de filtros.buscar para no
  // disparar un fetch en cada tecla.
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [estadisticas, setEstadisticas] = useState(null)

  const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  // Paginado + filtros/búsqueda server-side (2026-08-19): antes traía TODOS los candidatos
  // citados y filtraba en el frontend. Usa /candidatos-total (endpoint dedicado a esta
  // pantalla de solo lectura), no /candidatos-citados - ese lo sigue usando sin paginar la
  // pantalla de trabajo de Selección (CandidatosSeleccion.jsx).
  useEffect(() => {
    cargarCandidatos()
  }, [page, busquedaActiva, filtros.operacion, filtros.asistencia, filtros.estado, filtros.reclutador])

  // Debounce del buscador (300ms) - vuelve a página 1 en el mismo batch en que se activa la
  // búsqueda (un solo fetch, no dos).
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setBusquedaActiva(filtros.buscar.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [filtros.buscar])

  // Cambia un filtro (select) y vuelve a página 1 en el mismo batch, salvo "buscar" que ya
  // lo maneja el debounce de arriba.
  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
    if (campo !== 'buscar') {
      setPage(1)
    }
  }

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([
        cargarCandidatos(),
        cargarEstadisticas()
      ])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCandidatos = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page })
      if (busquedaActiva) params.set('search', busquedaActiva)
      if (filtros.operacion) params.set('operacion', filtros.operacion)
      if (filtros.asistencia) params.set('asistencia', filtros.asistencia)
      if (filtros.estado) params.set('estado', filtros.estado)
      if (filtros.reclutador) params.set('reclutador', filtros.reclutador)

      const response = await fetch(`${API_URL}/api/seleccion/candidatos-total?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCandidatos(data.candidatos)
        setPagination(data.pagination)
        setFiltrosDisponibles(data.filtrosDisponibles)
      }
    } catch (error) {
      console.error('Error cargando candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.estadisticas)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
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

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'citado': return 'bg-blue-100 text-blue-800'
      case 'no_asistio': return 'bg-red-100 text-red-800'
      case 'entrevistado': return 'bg-green-100 text-green-800'
      case 'aprobado_final': return 'bg-emerald-100 text-emerald-800'
      case 'rechazado_final': return 'bg-red-100 text-red-800'
      case 'rechazado': return 'bg-gray-100 text-gray-800'
      case 'contratado': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoTexto = (candidato) => {
    if (candidato.evaluacion_total !== null && candidato.aprobacion_final === null) {
      return 'Pendiente Decisión Final'
    }
    switch (candidato.estado) {
      case 'citado': return 'Citado'
      case 'no_asistio': return 'No asistió'
      case 'entrevistado': return 'Entrevistado'
      case 'aprobado_final': return 'Aprobado Final'
      case 'rechazado_final': return 'Rechazado Final'
      case 'rechazado': return 'Rechazado'
      case 'contratado': return 'Contratado'
      default: return candidato.estado.charAt(0).toUpperCase() + candidato.estado.slice(1)
    }
  }

  const getEstadoColorDinamico = (candidato) => {
    if (candidato.evaluacion_total !== null && candidato.aprobacion_final === null) {
      return 'bg-orange-100 text-orange-800'
    }
    return getEstadoColor(candidato.estado)
  }

  const getAsistenciaColor = (asistencia) => {
    switch (asistencia) {
      case 'asistio': return 'bg-green-100 text-green-800'
      case 'no_asistio': return 'bg-red-100 text-red-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando candidatos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">

          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Candidatos Total</h1>
                <p className="text-sm lg:text-base text-gray-600">Vista de todos los candidatos en proceso de selección (solo lectura)</p>
              </div>
              <button
                onClick={cargarDatos}
                className="btn-secondary flex items-center text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </button>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Total Citados</p>
                      <p className="text-lg font-semibold text-gray-900">{estadisticas.total_citados}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <UserCheck className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Asistieron</p>
                      <p className="text-lg font-semibold text-gray-900">{estadisticas.asistieron}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Aprobados</p>
                      <p className="text-lg font-semibold text-gray-900">{estadisticas.aprobados_finales}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">% Asistencia</p>
                      <p className="text-lg font-semibold text-gray-900">{estadisticas.porcentaje_asistencia}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                    onChange={(e) => actualizarFiltro('buscar', e.target.value)}
                    className="pl-10 input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operación</label>
                <select
                  value={filtros.operacion}
                  onChange={(e) => actualizarFiltro('operacion', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas las operaciones</option>
                  {filtrosDisponibles.operaciones.map(operacion => (
                    <option key={operacion} value={operacion}>{operacion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asistencia</label>
                <select
                  value={filtros.asistencia}
                  onChange={(e) => actualizarFiltro('asistencia', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todas</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="asistio">Asistió</option>
                  <option value="no_asistio">No asistió</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => actualizarFiltro('estado', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  <option value="citado">Citado</option>
                  <option value="no_asistio">No asistió</option>
                  <option value="entrevistado">Entrevistado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reclutador</label>
                <select
                  value={filtros.reclutador}
                  onChange={(e) => actualizarFiltro('reclutador', e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos</option>
                  {filtrosDisponibles.reclutadores.map(reclutador => (
                    <option key={reclutador} value={reclutador}>{reclutador}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Candidatos */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Candidatos ({pagination.total})
              </h3>
            </div>

            {candidatos.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron candidatos citados</p>
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
                        Fecha Cita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Asistencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Oleada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ver
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {candidatos.map((candidato) => (
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
                          <p className="text-sm text-gray-900">
                            {formatearFecha(candidato.fecha_citacion_entrevista)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAsistenciaColor(candidato.asistio_citacion)}`}>
                            {candidato.asistio_citacion === 'asistio' ? 'Asistió' :
                             candidato.asistio_citacion === 'no_asistio' ? 'No asistió' : 'Pendiente'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEstadoColorDinamico(candidato)}`}>
                            {getEstadoTexto(candidato)}
                          </span>
                          {candidato.evaluacion_total !== null && candidato.aprobacion_final === null && (
                            <div className="text-xs text-orange-600 mt-1">
                              ⚠️ Requiere decisión final
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {candidato.numero_oleada ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">Oleada {candidato.numero_oleada}</p>
                              <p className="text-xs text-gray-500">{candidato.descripcion_oleada}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin asignar</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/hydra/reclutador/candidato/${candidato.id}`)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Ver perfil"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
          </div>

        </div>
      </div>
    </div>
  )
}
