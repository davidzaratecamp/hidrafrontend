import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Building,
  BarChart3,
  ArrowRight,
  Activity,
  Target,
  Eye
} from 'lucide-react'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

export default function Dashboard() {
  const [resumenEstados, setResumenEstados] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarResumen()
  }, [])

  const cargarResumen = async () => {
    try {
      const resumen = await ApiService.getResumenEstados()
      setResumenEstados(resumen)
    } catch (error) {
      console.error('Error cargando resumen:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCandidatos = Object.values(resumenEstados).reduce((a, b) => a + b, 0)
  const completados = resumenEstados.formularios_completados || 0
  const porcentajeCompletado = totalCandidatos > 0 ? (completados / totalCandidatos * 100).toFixed(1) : 0

  const estadisticas = [
    {
      titulo: 'Total Candidatos',
      valor: totalCandidatos,
      icon: Users,
      color: 'bg-blue-500',
      descripcion: 'Candidatos registrados'
    },
    {
      titulo: 'Formularios Completados',
      valor: completados,
      icon: CheckCircle,
      color: 'bg-green-500',
      descripcion: 'Listos para entrevista'
    },
    {
      titulo: 'En Proceso',
      valor: (resumenEstados.nuevo || 0) + (resumenEstados.formularios_enviados || 0),
      icon: Clock,
      color: 'bg-yellow-500',
      descripcion: 'Pendientes de completar'
    },
    {
      titulo: 'Tasa Completado',
      valor: `${porcentajeCompletado}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      descripcion: 'Eficiencia del proceso'
    }
  ]

  const accionesRapidas = [
    {
      titulo: 'Nuevo Candidato',
      descripcion: 'Registrar un nuevo candidato',
      icon: UserPlus,
      color: 'bg-green-500',
      link: '/hydra/reclutador/candidatos/nuevo'
    },
    {
      titulo: 'Ver Candidatos',
      descripcion: 'Gestionar candidatos existentes',
      icon: Users,
      color: 'bg-blue-500',
      link: '/hydra/reclutador/candidatos'
    },
    {
      titulo: 'Estadísticas',
      descripcion: 'Análisis detallado y reportes',
      icon: BarChart3,
      color: 'bg-purple-500',
      link: '/hydra/reclutador/estadisticas'
    }
  ]

  const estadosDetalle = [
    { estado: 'nuevo', label: 'Nuevos', color: 'bg-gray-100 text-gray-800', count: resumenEstados.nuevo || 0 },
    { estado: 'formularios_enviados', label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800', count: resumenEstados.formularios_enviados || 0 },
    { estado: 'formularios_completados', label: 'Formularios Completados', color: 'bg-green-100 text-green-800', count: resumenEstados.formularios_completados || 0 },
    { estado: 'citado', label: 'Citados', color: 'bg-yellow-100 text-yellow-800', count: resumenEstados.citado || 0 },
    { estado: 'entrevistado', label: 'Entrevistados', color: 'bg-purple-100 text-purple-800', count: resumenEstados.entrevistado || 0 },
    { estado: 'contratado', label: 'Contratados', color: 'bg-indigo-100 text-indigo-800', count: resumenEstados.contratado || 0 }
  ]

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bienvenido al sistema de reclutamiento</p>
            </div>
            <div className="flex items-center text-gray-600">
              <Building className="h-5 w-5 mr-2" />
              <span>ASISTE ING</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando dashboard...</span>
          </div>
        ) : (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {estadisticas.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${stat.color} text-white mr-4`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
                        <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{stat.descripcion}</p>
                  </div>
                )
              })}
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {accionesRapidas.map((accion, index) => {
                const Icon = accion.icon
                return (
                  <Link
                    key={index}
                    to={accion.link}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`w-12 h-12 ${accion.color} rounded-lg flex items-center justify-center mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{accion.titulo}</h3>
                        <p className="text-sm text-gray-600">{accion.descripcion}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Estados de candidatos */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Estados de Candidatos
                  </h2>
                  <Link 
                    to="/hydra/reclutador/candidatos"
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    Ver todos <Eye className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {estadosDetalle.filter(item => item.count > 0).map((item) => (
                    <div key={item.estado} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.color}`}>
                        {item.label}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {item.count}
                      </span>
                    </div>
                  ))}
                  {estadosDetalle.every(item => item.count === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay candidatos registrados aún</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progreso y acciones */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Progreso del Proceso
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Formularios Completados</span>
                      <span className="text-sm text-gray-600">{completados}/{totalCandidatos}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${porcentajeCompletado}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {porcentajeCompletado}% de candidatos han completado el proceso
                    </span>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Tareas Pendientes</h3>
                    <div className="space-y-2">
                      {resumenEstados.nuevo > 0 && (
                        <div className="flex justify-between items-center text-sm p-2 bg-yellow-50 rounded">
                          <span className="text-gray-700">📧 Enviar formularios</span>
                          <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            {resumenEstados.nuevo} pendientes
                          </span>
                        </div>
                      )}
                      {resumenEstados.formularios_completados > 0 && (
                        <div className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                          <span className="text-gray-700">📅 Citar para entrevista</span>
                          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {resumenEstados.formularios_completados} listos
                          </span>
                        </div>
                      )}
                      {resumenEstados.entrevistado > 0 && (
                        <div className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded">
                          <span className="text-gray-700">✅ Procesar resultados</span>
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {resumenEstados.entrevistado} entrevistados
                          </span>
                        </div>
                      )}
                      {(!resumenEstados.nuevo && !resumenEstados.formularios_completados && !resumenEstados.entrevistado) && (
                        <div className="text-center py-4 text-gray-500">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay tareas pendientes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}