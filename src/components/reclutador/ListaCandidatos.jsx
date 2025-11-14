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
  Calendar,
  Phone
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

  const estadosConfig = {
    nuevo: { label: 'Nuevos', color: 'bg-gray-100 text-gray-800', count: 0 },
    formularios_enviados: { label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800', count: 0 },
    formularios_completados: { label: 'Formularios Completados', color: 'bg-green-100 text-green-800', count: 0 },
    citado: { label: 'Citados', color: 'bg-yellow-100 text-yellow-800', count: 0 },
    entrevistado: { label: 'Entrevistados', color: 'bg-purple-100 text-purple-800', count: 0 },
    aprobado: { label: 'Aprobados', color: 'bg-emerald-100 text-emerald-800', count: 0 },
    rechazado: { label: 'Rechazados', color: 'bg-red-100 text-red-800', count: 0 },
    contratado: { label: 'Contratados', color: 'bg-indigo-100 text-indigo-800', count: 0 }
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
          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          <Mail className="h-4 w-4 mr-1" />
          Enviar
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
    
    return (
      <button className="flex items-center px-3 py-1 bg-gray-300 text-gray-600 rounded text-sm cursor-not-allowed">
        <Eye className="h-4 w-4 mr-1" />
        Ver
      </button>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
              <p className="text-gray-600">Gestión y seguimiento del proceso de reclutamiento</p>
            </div>
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              Total: {Object.values(resumenEstados).reduce((a, b) => a + b, 0)} candidatos
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(estadosConfig).map(([estado, config]) => (
              <button
                key={estado}
                onClick={() => setEstadoActivo(estado)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  estadoActivo === estado
                    ? config.color + ' shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.label} ({resumenEstados[estado] || 0})
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido, email o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full max-w-md border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
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
                          <button className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}