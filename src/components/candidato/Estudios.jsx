import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

export default function Estudios() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    nivel_estudios: '',
    titulo_obtenido: '',
    nombre_institucion: '',
    ano_finalizacion: ''
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
      
      const candidatoInfo = candidatoData.candidato
      setFormData({
        nivel_estudios: candidatoInfo.nivel_estudios || '',
        titulo_obtenido: candidatoInfo.titulo_obtenido || '',
        nombre_institucion: candidatoInfo.nombre_institucion || '',
        ano_finalizacion: candidatoInfo.ano_finalizacion || ''
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const requiredFields = ['nivel_estudios', 'titulo_obtenido', 'nombre_institucion', 'ano_finalizacion']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarEstudios(token, formData)
      navigate(`/candidato/experiencia/${token}`)
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
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Formación Académica</h1>
                <p className="text-purple-100">Paso 3 de 6 - Información educativa</p>
              </div>
              <GraduationCap className="h-12 w-12 text-purple-200" />
            </div>
            
            <div className="mt-6 bg-purple-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-purple-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-purple-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                  Máximo Nivel de Estudios Alcanzado
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nivel de Estudios *
                    </label>
                    <select
                      value={formData.nivel_estudios}
                      onChange={(e) => setFormData({...formData, nivel_estudios: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu nivel de estudios</option>
                      {catalogos.niveles_estudios?.map((nivel) => (
                        <option key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año de Finalización *
                    </label>
                    <select
                      value={formData.ano_finalizacion}
                      onChange={(e) => setFormData({...formData, ano_finalizacion: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona el año</option>
                      {catalogos.anios?.map((ano) => (
                        <option key={ano} value={ano}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título Obtenido *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo_obtenido}
                      onChange={(e) => setFormData({...formData, titulo_obtenido: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Ej: Bachiller Académico, Tecnólogo en Sistemas, Ingeniero Industrial..."
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Institución *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_institucion}
                      onChange={(e) => setFormData({...formData, nombre_institucion: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombre completo de la institución educativa"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Información Importante</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Ingresa información sobre tu <strong>máximo nivel de estudios alcanzado</strong></li>
                  <li>• Si tienes múltiples títulos, registra el de mayor nivel académico</li>
                  <li>• Asegúrate de que el nombre de la institución sea completo y correcto</li>
                  <li>• Si estás actualmente estudiando, indica el año estimado de finalización</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/datos-basicos/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-600">
                  {candidato.formulario_estudios_completado ? (
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
                      Siguiente: Experiencia
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