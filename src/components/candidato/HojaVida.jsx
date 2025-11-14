import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, User, Building, Calendar, ArrowRight, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

export default function HojaVida() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    estado_civil: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [token])

  const cargarDatos = async () => {
    try {
      const [candidatoData, catalogosData] = await Promise.all([
        ApiService.validarToken(token),
        ApiService.getCatalogos()
      ])
      
      setCandidato(candidatoData.candidato)
      setCatalogos(catalogosData)
      
      if (candidatoData.candidato.estado_civil) {
        setFormData({ estado_civil: candidatoData.candidato.estado_civil })
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.estado_civil) {
      alert('Por favor selecciona tu estado civil')
      return
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarHojaVida(token, formData)
      navigate(`/candidato/datos-basicos/${token}`)
    } catch (error) {
      console.error('Error guardando:', error)
      alert('Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!candidato) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: No se pudo cargar la información del candidato</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Formulario de Hoja de Vida</h1>
                <p className="text-blue-100">Paso 1 de 6 - Información básica</p>
              </div>
              <FileText className="h-12 w-12 text-blue-200" />
            </div>
            
            <div className="mt-6 bg-blue-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-blue-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Información Personal
                </h2>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                    <p className="text-gray-900 font-medium">
                      {candidato.primer_nombre} {candidato.primer_apellido}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{candidato.email_personal}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Documento</label>
                    <p className="text-gray-900">
                      {candidato.tipo_documento}: {candidato.numero_documento}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Información del Proceso
                </h2>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cliente</label>
                    <p className="text-gray-900 font-medium">{candidato.cliente}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cargo</label>
                    <p className="text-gray-900">{candidato.cargo}</p>
                  </div>
                  {candidato.oleada && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Oleada</label>
                      <p className="text-gray-900">{candidato.oleada}</p>
                    </div>
                  )}
                  {candidato.fecha_citacion_entrevista && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Fecha de Entrevista
                      </label>
                      <p className="text-gray-900">
                        {new Date(candidato.fecha_citacion_entrevista).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información Requerida
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Civil *
                  </label>
                  <select
                    value={formData.estado_civil}
                    onChange={(e) => setFormData({...formData, estado_civil: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona tu estado civil</option>
                    {catalogos.estados_civiles?.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <div className="text-sm text-gray-600">
                  {candidato.formulario_hoja_vida_completado ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Este formulario ya fue completado
                    </span>
                  ) : (
                    'Campos marcados con * son obligatorios'
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      Siguiente: Datos Básicos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}