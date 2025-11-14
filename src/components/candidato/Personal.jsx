import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Star, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

export default function Personal() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    fortalezas: '',
    aspectos_mejorar: '',
    competencias_laborales: '',
    conocimiento_excel: '',
    conocimiento_powerpoint: '',
    conocimiento_word: '',
    autoevaluacion: ''
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
        fortalezas: candidatoInfo.fortalezas || '',
        aspectos_mejorar: candidatoInfo.aspectos_mejorar || '',
        competencias_laborales: candidatoInfo.competencias_laborales || '',
        conocimiento_excel: candidatoInfo.conocimiento_excel || '',
        conocimiento_powerpoint: candidatoInfo.conocimiento_powerpoint || '',
        conocimiento_word: candidatoInfo.conocimiento_word || '',
        autoevaluacion: candidatoInfo.autoevaluacion || ''
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
    
    const requiredFields = ['fortalezas', 'aspectos_mejorar', 'competencias_laborales',
                           'conocimiento_excel', 'conocimiento_powerpoint', 'conocimiento_word', 'autoevaluacion']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarPersonal(token, formData)
      navigate(`/candidato/consentimiento/${token}`)
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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Información Personal</h1>
                <p className="text-emerald-100 text-sm sm:text-base">Paso 5 de 6 - Perfil personal y competencias</p>
              </div>
              <User className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-200" />
            </div>
            
            <div className="mt-6 bg-emerald-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-emerald-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-green-600" />
                  Características Personales
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fortalezas *
                    </label>
                    <textarea
                      value={formData.fortalezas}
                      onChange={(e) => setFormData({...formData, fortalezas: e.target.value})}
                      required
                      rows={3}
                      className="input-field"
                      placeholder="Describe tus principales fortalezas y cualidades positivas"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspectos a Mejorar *
                    </label>
                    <textarea
                      value={formData.aspectos_mejorar}
                      onChange={(e) => setFormData({...formData, aspectos_mejorar: e.target.value})}
                      required
                      rows={3}
                      className="input-field"
                      placeholder="¿En qué aspectos te gustaría mejorar o desarrollarte?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Competencias Laborales *
                    </label>
                    <textarea
                      value={formData.competencias_laborales}
                      onChange={(e) => setFormData({...formData, competencias_laborales: e.target.value})}
                      required
                      rows={3}
                      className="input-field"
                      placeholder="Describe tus habilidades y competencias profesionales"
                    />
                  </div>
                </div>
              </div>


              <div className="bg-orange-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Conocimientos Informáticos (1-5)
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excel *
                    </label>
                    <select
                      value={formData.conocimiento_excel}
                      onChange={(e) => setFormData({...formData, conocimiento_excel: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Califica tu nivel</option>
                      {catalogos.calificaciones?.length > 0 ? (
                        catalogos.calificaciones.map((cal) => (
                          <option key={cal.value} value={cal.value}>
                            {cal.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={1}>1 - Básico</option>
                          <option value={2}>2 - Principiante</option>
                          <option value={3}>3 - Intermedio</option>
                          <option value={4}>4 - Avanzado</option>
                          <option value={5}>5 - Experto</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PowerPoint *
                    </label>
                    <select
                      value={formData.conocimiento_powerpoint}
                      onChange={(e) => setFormData({...formData, conocimiento_powerpoint: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Califica tu nivel</option>
                      {catalogos.calificaciones?.length > 0 ? (
                        catalogos.calificaciones.map((cal) => (
                          <option key={cal.value} value={cal.value}>
                            {cal.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={1}>1 - Básico</option>
                          <option value={2}>2 - Principiante</option>
                          <option value={3}>3 - Intermedio</option>
                          <option value={4}>4 - Avanzado</option>
                          <option value={5}>5 - Experto</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Word *
                    </label>
                    <select
                      value={formData.conocimiento_word}
                      onChange={(e) => setFormData({...formData, conocimiento_word: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Califica tu nivel</option>
                      {catalogos.calificaciones?.length > 0 ? (
                        catalogos.calificaciones.map((cal) => (
                          <option key={cal.value} value={cal.value}>
                            {cal.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={1}>1 - Básico</option>
                          <option value={2}>2 - Principiante</option>
                          <option value={3}>3 - Intermedio</option>
                          <option value={4}>4 - Avanzado</option>
                          <option value={5}>5 - Experto</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Autoevaluación General *
                    </label>
                    <select
                      value={formData.autoevaluacion}
                      onChange={(e) => setFormData({...formData, autoevaluacion: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Califica tu nivel general</option>
                      {catalogos.calificaciones?.map((cal) => (
                        <option key={cal.value} value={cal.value}>
                          {cal.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/experiencia/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-600">
                  {candidato.formulario_personal_completado ? (
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
                      Siguiente: Consentimiento
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