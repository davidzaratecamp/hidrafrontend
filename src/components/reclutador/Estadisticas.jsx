import { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Building,
  BarChart3,
  PieChart
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function Estadisticas() {
  const [resumenEstados, setResumenEstados] = useState({})
  const [estadisticasClientes, setEstadisticasClientes] = useState([])
  const [estadisticasCargos, setEstadisticasCargos] = useState([])
  const [progresoFormularios, setProgresoFormularios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarTodosLosDatos()
  }, [])

  const cargarTodosLosDatos = async () => {
    try {
      const [resumen, clientes, cargos, progreso] = await Promise.all([
        ApiService.getResumenEstados(),
        ApiService.getEstadisticasClientes(),
        ApiService.getEstadisticasCargos(),
        ApiService.getProgresoFormularios()
      ])
      
      setResumenEstados(resumen)
      setEstadisticasClientes(clientes)
      setEstadisticasCargos(cargos)
      setProgresoFormularios(progreso)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCandidatos = Object.values(resumenEstados).reduce((a, b) => a + b, 0)
  const completados = resumenEstados.formularios_completados || 0
  const porcentajeCompletado = totalCandidatos > 0 ? (completados / totalCandidatos * 100).toFixed(1) : 0

  const estadosDetalle = [
    { estado: 'nuevo', label: 'Nuevos', color: 'bg-gray-100 text-gray-800' },
    { estado: 'formularios_enviados', label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800' },
    { estado: 'formularios_completados', label: 'Formularios Completados', color: 'bg-green-100 text-green-800' },
    { estado: 'citado', label: 'Citados', color: 'bg-yellow-100 text-yellow-800' },
    { estado: 'entrevistado', label: 'Entrevistados', color: 'bg-purple-100 text-purple-800' },
    { estado: 'aprobado', label: 'Aprobados', color: 'bg-emerald-100 text-emerald-800' },
    { estado: 'rechazado', label: 'Rechazados', color: 'bg-red-100 text-red-800' },
    { estado: 'contratado', label: 'Contratados', color: 'bg-indigo-100 text-indigo-800' }
  ]

  // Configuración gráfico de estados (Doughnut)
  const estadosChartData = {
    labels: estadosDetalle.map(item => item.label),
    datasets: [{
      data: estadosDetalle.map(item => resumenEstados[item.estado] || 0),
      backgroundColor: [
        '#6B7280', '#3B82F6', '#10B981', '#F59E0B', 
        '#8B5CF6', '#059669', '#EF4444', '#6366F1'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const estadosChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Distribución por Estados'
      }
    }
  }

  // Configuración gráfico de clientes (Bar)
  const clientesChartData = {
    labels: estadisticasClientes.map(item => item.cliente),
    datasets: [
      {
        label: 'Total Candidatos',
        data: estadisticasClientes.map(item => item.total_candidatos),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Contratados',
        data: estadisticasClientes.map(item => item.contratados),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  }

  const clientesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Estadísticas por Cliente'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  // Configuración gráfico de progreso de formularios
  const progresoChartData = {
    labels: progresoFormularios.map(item => `${item.progreso}/6 formularios`),
    datasets: [{
      data: progresoFormularios.map(item => item.cantidad),
      backgroundColor: [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', 
        '#84CC16', '#22C55E', '#10B981'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }

  const progresoChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: 'Progreso de Formularios'
      }
    }
  }

  // Configuración gráfico de cargos (Bar horizontal)
  const cargosChartData = {
    labels: estadisticasCargos.map(item => item.cargo),
    datasets: [{
      label: 'Cantidad de Candidatos',
      data: estadisticasCargos.map(item => item.cantidad),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(132, 204, 22, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  }

  const cargosChartOptions = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Top 10 Cargos Más Demandados'
      }
    },
    scales: {
      x: {
        beginAtZero: true
      }
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estadísticas y Analíticas</h1>
              <p className="text-gray-600">Análisis detallado del proceso de reclutamiento</p>
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
            <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
          </div>
        ) : (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-500 text-white mr-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalCandidatos}</p>
                    <p className="text-sm font-medium text-gray-600">Total Candidatos</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500 text-white mr-4">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{completados}</p>
                    <p className="text-sm font-medium text-gray-600">Completados</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-500 text-white mr-4">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{(resumenEstados.nuevo || 0) + (resumenEstados.formularios_enviados || 0)}</p>
                    <p className="text-sm font-medium text-gray-600">En Proceso</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-500 text-white mr-4">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{porcentajeCompletado}%</p>
                    <p className="text-sm font-medium text-gray-600">Tasa Completado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                  Distribución por Estados
                </h2>
                <div className="h-80">
                  <Doughnut data={estadosChartData} options={estadosChartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Rendimiento por Cliente
                </h2>
                <div className="h-80">
                  <Bar data={clientesChartData} options={clientesChartOptions} />
                </div>
              </div>
            </div>

            {/* Gráficos secundarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Progreso de Formularios
                </h2>
                <div className="h-80">
                  <Doughnut data={progresoChartData} options={progresoChartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                  Cargos Más Demandados
                </h2>
                <div className="h-80">
                  <Bar data={cargosChartData} options={cargosChartOptions} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}