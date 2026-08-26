import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, UserX, Calendar, Briefcase,
  Clock, CheckCircle, XCircle, Eye, UserPlus, FileText,
  Filter, Search, RefreshCw, BarChart3, Calculator, Gavel,
  ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react'
import SidebarSeleccion from './SidebarSeleccion'
import EvaluacionEntrevista from './EvaluacionEntrevista'
import ModalDescargarExcel from './ModalDescargarExcel'
import { useAuth } from '../../context/AuthContext'

export default function CandidatosSeleccion() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidatos, setCandidatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({ operaciones: [] })
  const [filtros, setFiltros] = useState({
    buscar: '',
    operacion: '',
    asistencia: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  })
  const [showModalExcel, setShowModalExcel] = useState(false)
  // Texto de búsqueda tras el debounce (300ms) - separado de filtros.buscar para no disparar
  // un fetch en cada tecla (mismo patrón que ListaCandidatos.jsx/CandidatosTotal.jsx).
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [selectedCandidato, setSelectedCandidato] = useState(null)
  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false)
  const [showEvaluacionModal, setShowEvaluacionModal] = useState(false)
  const [showDecisionFinalModal, setShowDecisionFinalModal] = useState(false)
  const [estadisticas, setEstadisticas] = useState(null)

  const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  // Paginado + filtros/búsqueda server-side (2026-08-21): antes traía TODOS los candidatos
  // citados (1984 en local) y filtraba en el frontend. Mismo patrón que CandidatosTotal.jsx.
  useEffect(() => {
    cargarCandidatosCitados()
  }, [page, busquedaActiva, filtros.operacion, filtros.asistencia, filtros.estado, filtros.fechaDesde, filtros.fechaHasta])

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
        cargarCandidatosCitados(),
        cargarEstadisticas()
      ])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCandidatosCitados = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ page })
      if (busquedaActiva) params.set('search', busquedaActiva)
      if (filtros.operacion) params.set('operacion', filtros.operacion)
      if (filtros.asistencia) params.set('asistencia', filtros.asistencia)
      if (filtros.estado) params.set('estado', filtros.estado)
      if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde)
      if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta)

      const response = await fetch(`${API_URL}/api/seleccion/candidatos-citados?${params.toString()}`, {
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
      console.error('Error cargando candidatos citados:', error)
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

  const marcarAsistencia = async (candidatoId, asistio, observaciones = '', motivoInasistencia = null) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/candidatos/${candidatoId}/asistencia`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ asistio, observaciones, motivoInasistencia })
      })

      if (response.ok) {
        await cargarCandidatosCitados()
        await cargarEstadisticas()
        setShowAsistenciaModal(false)
        setSelectedCandidato(null)
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error marcando asistencia:', error)
      alert('Error al marcar asistencia')
    }
  }

  const guardarEvaluacion = async (evaluacionData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/candidatos/${evaluacionData.candidatoId}/evaluacion`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluacionData)
      })

      if (response.ok) {
        await cargarCandidatosCitados()
        await cargarEstadisticas()
        setShowEvaluacionModal(false)
        setSelectedCandidato(null)
        alert('Evaluación guardada correctamente')
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error guardando evaluación:', error)
      alert('Error al guardar evaluación')
    }
  }

  const tomarDecisionFinal = async (candidatoId, aprobacionFinal, razon = null) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/candidatos/${candidatoId}/decision-final`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aprobacion_final: aprobacionFinal,
          aprobacion_final_razon: razon
        })
      })

      if (response.ok) {
        await cargarCandidatosCitados()
        await cargarEstadisticas()
        setShowDecisionFinalModal(false)
        setSelectedCandidato(null)
        alert(aprobacionFinal ? 'Candidato aprobado para el trabajo' : 'Candidato rechazado con justificación')
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error tomando decisión final:', error)
      alert('Error al tomar decisión final')
    }
  }


  const descargarExcel = async (fechaDesde, fechaHasta) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({ fechaDesde, fechaHasta })
    if (busquedaActiva) params.set('search', busquedaActiva)
    if (filtros.operacion) params.set('operacion', filtros.operacion)
    if (filtros.asistencia) params.set('asistencia', filtros.asistencia)
    if (filtros.estado) params.set('estado', filtros.estado)

    const response = await fetch(`${API_URL}/api/seleccion/candidatos-citados/exportar-excel?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'No se pudo generar el Excel')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seleccion_${fechaDesde}_a_${fechaHasta}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
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
        <SidebarSeleccion />
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
      <SidebarSeleccion />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Selección</h1>
                <p className="text-sm lg:text-base text-gray-600">Candidatos en proceso de selección (los aprobados aparecen en "Perfiles Aprobados")</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  onClick={() => navigate('/hydra/reclutador/candidatos/nuevo', { state: { from: '/hydra/seleccion/candidatos' } })}
                  className="btn-primary flex items-center text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Candidato
                </button>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
              </div>
              <button
                onClick={() => setShowModalExcel(true)}
                className="btn-secondary flex items-center text-sm"
                title="Descarga el Excel de los candidatos citados en el rango de fechas seleccionado"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                Descargar Excel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha cita desde</label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => actualizarFiltro('fechaDesde', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha cita hasta</label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => actualizarFiltro('fechaHasta', e.target.value)}
                  className="input-field"
                />
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
                <p className="text-gray-600">No se encontraron candidatos</p>
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
                        Evaluación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Acciones
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
                          {candidato.asistio_citacion === 'no_asistio' && candidato.motivo_inasistencia && (
                            <p className="text-xs text-gray-500 mt-1">{candidato.motivo_inasistencia}</p>
                          )}
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
                          {candidato.evaluacion_total !== null ? (
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                candidato.evaluacion_aprobado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {candidato.evaluacion_total}% {candidato.evaluacion_aprobado ? '✓' : '✗'}
                              </span>
                              
                              {candidato.aprobacion_final !== null && (
                                <div className="mt-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    candidato.aprobacion_final ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {candidato.aprobacion_final ? '✅ Aprobado Final' : '❌ Rechazado Final'}
                                  </span>
                                  {!candidato.aprobacion_final && candidato.aprobacion_final_razon && (
                                    <p className="text-xs text-gray-500 mt-1" title={candidato.aprobacion_final_razon}>
                                      {candidato.aprobacion_final_razon.substring(0, 50)}...
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {!candidato.evaluacion_aprobado && candidato.evaluacion_razon_rechazo && (
                                <p className="text-xs text-gray-500 mt-1" title={candidato.evaluacion_razon_rechazo}>
                                  {candidato.evaluacion_razon_rechazo.substring(0, 50)}...
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin evaluar</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {candidato.asistio_citacion === 'pendiente' && (
                              <button
                                onClick={() => {
                                  setSelectedCandidato(candidato)
                                  setShowAsistenciaModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Marcar asistencia"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            
                            {candidato.estado === 'entrevistado' && candidato.evaluacion_total === null && (
                              <button
                                onClick={() => {
                                  setSelectedCandidato(candidato)
                                  setShowEvaluacionModal(true)
                                }}
                                className="text-purple-600 hover:text-purple-800"
                                title="Evaluar entrevista"
                              >
                                <Calculator className="h-4 w-4" />
                              </button>
                            )}
                            
                            {candidato.evaluacion_total !== null && candidato.aprobacion_final === null && (
                              <button
                                onClick={() => {
                                  setSelectedCandidato(candidato)
                                  setShowDecisionFinalModal(true)
                                }}
                                className="text-orange-600 hover:text-orange-800"
                                title="Tomar decisión final"
                              >
                                <Gavel className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => navigate(`/hydra/seleccion/candidato/${candidato.id}`)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Ver perfil"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* Modal de Asistencia */}
      {showAsistenciaModal && selectedCandidato && (
        <AsistenciaModal
          candidato={selectedCandidato}
          onClose={() => {
            setShowAsistenciaModal(false)
            setSelectedCandidato(null)
          }}
          onMarcarAsistencia={marcarAsistencia}
        />
      )}

      {/* Modal de Evaluación */}
      {showEvaluacionModal && selectedCandidato && (
        <EvaluacionEntrevista
          candidato={selectedCandidato}
          onClose={() => {
            setShowEvaluacionModal(false)
            setSelectedCandidato(null)
          }}
          onGuardarEvaluacion={guardarEvaluacion}
        />
      )}

      {/* Modal de Decisión Final */}
      {showDecisionFinalModal && selectedCandidato && (
        <DecisionFinalModal
          candidato={selectedCandidato}
          onClose={() => {
            setShowDecisionFinalModal(false)
            setSelectedCandidato(null)
          }}
          onTomarDecision={tomarDecisionFinal}
        />
      )}

      {/* Modal de Descarga de Excel */}
      <ModalDescargarExcel
        open={showModalExcel}
        onClose={() => setShowModalExcel(false)}
        onDescargar={descargarExcel}
        fechasRequeridas
        fechaDesdeInicial={filtros.fechaDesde}
        fechaHastaInicial={filtros.fechaHasta}
        titulo="Descargar Excel de Selección"
        descripcion="Candidatos citados en el rango de fechas seleccionado"
      />

    </div>
  )
}

// Modal para marcar asistencia
// Catálogo "MOTIVO INASISTENCIA" de BASE RECLUTAMIENTO (Excel oficial) — "Otra" es de texto libre,
// el resto son valores fijos. Ver claude/plan.md, séptima ronda: hasta ahora este detalle no se
// capturaba, solo el sí/no de asistio_citacion.
const MOTIVOS_INASISTENCIA = [
  'Calamidad',
  'Asunto personal',
  'Otra oferta / Menos días capa',
  'Otra oferta / Contrato inmediato',
  'No contesta',
  'No interesado / Horarios',
  'No interesado / Ventas',
  'No interesado / Ubicación',
  'No interesado / Capacitación',
  'No interesado / Call center',
  'No interesado / No parqueadero',
  'Otra'
]

function AsistenciaModal({ candidato, onClose, onMarcarAsistencia }) {
  const [asistio, setAsistio] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [motivoInasistencia, setMotivoInasistencia] = useState('')
  const [motivoOtro, setMotivoOtro] = useState('')

  const handleGuardar = () => {
    if (asistio === 'no_asistio') {
      if (!motivoInasistencia) {
        alert('Selecciona el motivo de inasistencia')
        return
      }
      if (motivoInasistencia === 'Otra' && !motivoOtro.trim()) {
        alert('Escribe el motivo de inasistencia')
        return
      }
    }

    const motivoFinal = motivoInasistencia === 'Otra' ? motivoOtro.trim() : motivoInasistencia
    onMarcarAsistencia(candidato.id, asistio, observaciones, asistio === 'no_asistio' ? motivoFinal : null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Marcar Asistencia - {candidato.primer_nombre} {candidato.primer_apellido}
          </h3>

          <div className="flex space-x-3 mb-4">
            <button
              type="button"
              onClick={() => { setAsistio('asistio'); setMotivoInasistencia(''); setMotivoOtro('') }}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center border-2 ${
                asistio === 'asistio'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-green-700 border-green-600 hover:bg-green-50'
              }`}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Asistió
            </button>
            <button
              type="button"
              onClick={() => setAsistio('no_asistio')}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center border-2 ${
                asistio === 'no_asistio'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-red-700 border-red-600 hover:bg-red-50'
              }`}
            >
              <UserX className="h-4 w-4 mr-2" />
              No asistió
            </button>
          </div>

          {asistio === 'no_asistio' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de inasistencia *
                </label>
                <select
                  value={motivoInasistencia}
                  onChange={(e) => setMotivoInasistencia(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona motivo...</option>
                  {MOTIVOS_INASISTENCIA.map((motivo) => (
                    <option key={motivo} value={motivo}>{motivo}</option>
                  ))}
                </select>
              </div>

              {motivoInasistencia === 'Otra' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especifica el motivo
                  </label>
                  <input
                    type="text"
                    value={motivoOtro}
                    onChange={(e) => setMotivoOtro(e.target.value)}
                    className="input-field"
                    placeholder="Motivo de inasistencia..."
                  />
                </div>
              )}
            </>
          )}

          {asistio && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Observaciones sobre la asistencia..."
              />
            </div>
          )}

          {asistio && (
            <button
              onClick={handleGuardar}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Guardar
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para decisión final del psicólogo
function DecisionFinalModal({ candidato, onClose, onTomarDecision }) {
  const [decision, setDecision] = useState(null) // true = aprobar, false = rechazar
  const [razonRechazo, setRazonRechazo] = useState('')

  const handleSubmit = () => {
    if (decision === null) {
      alert('Debes seleccionar una decisión')
      return
    }

    if (decision === false && razonRechazo.trim() === '') {
      alert('Debes especificar la razón del rechazo')
      return
    }

    onTomarDecision(candidato.id, decision, decision === false ? razonRechazo : null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Decisión Final - {candidato.primer_nombre} {candidato.primer_apellido}
          </h3>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Puntaje de evaluación:</strong> {candidato.evaluacion_total}%
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Evaluación técnica:</strong> {candidato.evaluacion_aprobado ? 'Aprobado' : 'Rechazado'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Estado actual:</strong> {candidato.estado}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Apruebas este candidato para el trabajo?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="aprobar"
                  checked={decision === true}
                  onChange={() => setDecision(true)}
                  className="mr-2"
                />
                <span className="text-green-700 font-medium">✅ Aprobar candidato para el trabajo</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="decision"
                  value="rechazar"
                  checked={decision === false}
                  onChange={() => setDecision(false)}
                  className="mr-2"
                />
                <span className="text-red-700 font-medium">❌ Rechazar candidato</span>
              </label>
            </div>
          </div>

          {decision === false && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del rechazo *
              </label>
              <textarea
                value={razonRechazo}
                onChange={(e) => setRazonRechazo(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Explica por qué rechazas este candidato para el trabajo..."
                required
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={decision === null}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Gavel className="h-4 w-4 mr-2 inline" />
              Confirmar Decisión
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}