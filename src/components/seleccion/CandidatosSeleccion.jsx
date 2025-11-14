import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Eye, 
  Search,
  Filter,
  Building,
  ChevronDown
} from 'lucide-react'
import SidebarSeleccion from './SidebarSeleccion'
import ApiService from '../../services/api'

export default function CandidatosSeleccion() {
  const [candidatos, setCandidatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('formularios_completados')
  const [filtroTexto, setFiltroTexto] = useState('')
  
  const estados = [
    { valor: 'formularios_completados', label: 'Formularios Completados', color: 'bg-green-100 text-green-800' },
    { valor: 'citado', label: 'Citados', color: 'bg-yellow-100 text-yellow-800' },
    { valor: 'entrevistado', label: 'Entrevistados', color: 'bg-purple-100 text-purple-800' },
    { valor: 'aprobado', label: 'Aprobados', color: 'bg-emerald-100 text-emerald-800' },
    { valor: 'rechazado', label: 'Rechazados', color: 'bg-red-100 text-red-800' },
    { valor: 'contratado', label: 'Contratados', color: 'bg-indigo-100 text-indigo-800' }
  ]

  useEffect(() => {
    if (estadoSeleccionado) {
      cargarCandidatos(estadoSeleccionado)
    }
  }, [estadoSeleccionado])

  const cargarCandidatos = async (estado) => {
    try {
      setLoading(true)
      const data = await ApiService.getCandidatosPorEstado(estado)
      setCandidatos(data)
    } catch (error) {
      console.error('Error cargando candidatos:', error)
      alert('Error al cargar candidatos')
    } finally {
      setLoading(false)
    }
  }

  const candidatosFiltrados = candidatos.filter(candidato =>
    candidato.primer_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    candidato.primer_apellido?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    candidato.email_personal?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    candidato.cliente?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    candidato.cargo?.toLowerCase().includes(filtroTexto.toLowerCase())
  )

  const estadoActual = estados.find(e => e.valor === estadoSeleccionado)

  return (
    <div className="flex">
      <SidebarSeleccion />
      
      <div className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
            <p className="text-gray-600">Gestión de candidatos en proceso de selección</p>
          </div>
          <div className="flex items-center text-gray-600">
            <Building className="h-5 w-5 mr-2" />
            <span>ASISTE ING - Selección</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Estado
              </label>
              <div className="relative">
                <select
                  value={estadoSeleccionado}
                  onChange={(e) => setEstadoSeleccionado(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  {estados.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-5 w-5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Búsqueda por texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Candidatos
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, cliente o cargo..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de candidatos */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Candidatos - {estadoActual?.label}
                </h2>
                <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${estadoActual?.color}`}>
                  {candidatosFiltrados.length} candidatos
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Cargando candidatos...</span>
              </div>
            ) : candidatosFiltrados.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Actualización
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
                          <div className="text-sm text-gray-500">
                            {candidato.email_personal}
                          </div>
                          <div className="text-xs text-gray-400">
                            {candidato.numero_celular}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidato.cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidato.cargo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {candidato.progreso_formularios}/6
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(candidato.updated_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/hydra/seleccion/candidato/${candidato.id}`}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Perfil
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron candidatos
                </h3>
                <p className="text-gray-500">
                  {filtroTexto 
                    ? `No hay candidatos que coincidan con "${filtroTexto}"`
                    : `No hay candidatos en estado "${estadoActual?.label}"`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}