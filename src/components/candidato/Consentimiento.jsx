import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, CheckCircle, Calendar, FileSignature } from 'lucide-react'
import ApiService from '../../services/api'

export default function Consentimiento() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [formData, setFormData] = useState({
    ciudad_consentimiento: '',
    dia_consentimiento: '',
    mes_consentimiento: '',
    ano_consentimiento: new Date().getFullYear()
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [token])

  const cargarDatos = async () => {
    try {
      const candidatoData = await ApiService.validarToken(token)
      setCandidato(candidatoData.candidato)
      
      const candidatoInfo = candidatoData.candidato
      setFormData({
        ciudad_consentimiento: candidatoInfo.ciudad_consentimiento || '',
        dia_consentimiento: candidatoInfo.dia_consentimiento || '',
        mes_consentimiento: candidatoInfo.mes_consentimiento || '',
        ano_consentimiento: candidatoInfo.ano_consentimiento || new Date().getFullYear()
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

    const requiredFields = ['ciudad_consentimiento', 'dia_consentimiento', 'mes_consentimiento', 'ano_consentimiento']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      const resultado = await ApiService.actualizarConsentimiento(token, formData)

      // Si FirmaCloud recibió la hoja de vida + tratamiento de datos, se redirige directo a
      // firmarlos en la misma sesión — sin depender de que el candidato revise su correo (el
      // correo/WhatsApp se sigue enviando igual, como respaldo).
      if (resultado?.firmacloudDispatch?.ok && resultado.firmacloudDispatch.firmarUrl) {
        window.location.href = resultado.firmacloudDispatch.firmarUrl
        return
      }

      alert('¡Felicitaciones! Has completado todos los formularios exitosamente. El equipo de reclutamiento se pondrá en contacto contigo pronto.')

      // Redirigir a una página de confirmación o cerrar
      window.close()
    } catch (error) {
      console.error('Error guardando:', error)
      alert(error.message || 'Error al guardar los datos')
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tratamiento de Datos Personales</h1>
                <p className="text-blue-100 text-sm sm:text-base">Paso 6 de 6 - Paso final</p>
              </div>
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-blue-200" />
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

          <div className="p-4 sm:p-8">
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-start space-x-3">
                <FileSignature className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    ¡Gracias por completar tu hoja de vida!
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Ya diligenciaste toda la información requerida. Como último paso, a
                    continuación podrás leer nuestra <strong>Autorización para el Tratamiento
                    de Datos Personales</strong> (Ley 1581 de 2012) y firmarla
                    electrónicamente para finalizar tu proceso de aplicación con{' '}
                    <strong>ASISTE ING</strong>.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Datos de Consentimiento
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad_consentimiento}
                      onChange={(e) => setFormData({...formData, ciudad_consentimiento: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Ciudad donde firmas"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Día *
                    </label>
                    <select
                      value={formData.dia_consentimiento}
                      onChange={(e) => setFormData({...formData, dia_consentimiento: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Día</option>
                      {Array.from({length: 31}, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes *
                    </label>
                    <select
                      value={formData.mes_consentimiento}
                      onChange={(e) => setFormData({...formData, mes_consentimiento: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Mes</option>
                      {[
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                      ].map((mes, index) => (
                        <option key={index + 1} value={index + 1}>{mes}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año *
                    </label>
                    <select
                      value={formData.ano_consentimiento}
                      onChange={(e) => setFormData({...formData, ano_consentimiento: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Año</option>
                      {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((ano) => (
                        <option key={ano} value={ano}>{ano}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🎉 ¡Último Paso!</h3>
                <p className="text-gray-700 mb-4">
                  Estás a punto de completar tu proceso de aplicación. Al enviar este formulario:
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>✅ Habrás completado todos los formularios requeridos</li>
                  <li>✅ Tu información será revisada por el equipo de reclutamiento</li>
                  <li>✅ Te contactaremos en los próximos días hábiles</li>
                  <li>✅ Podrás conocer los siguientes pasos del proceso</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/personal/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-600">
                  {candidato.formulario_consentimiento_completado ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Proceso completado
                    </span>
                  ) : (
                    'Continúa para finalizar tu proceso'
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
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <FileSignature className="h-4 w-4 mr-2" />
                      Ver Tratamiento de Datos
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