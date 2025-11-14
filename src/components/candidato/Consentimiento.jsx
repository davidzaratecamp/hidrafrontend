import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, CheckCircle, Calendar } from 'lucide-react'
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
  const [consentimientoAceptado, setConsentimientoAceptado] = useState(false)

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
      
      if (candidatoInfo.consentimiento_aceptado) {
        setConsentimientoAceptado(true)
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
    
    if (!consentimientoAceptado) {
      alert('Debes aceptar el consentimiento para continuar')
      return
    }
    
    const requiredFields = ['ciudad_consentimiento', 'dia_consentimiento', 'mes_consentimiento', 'ano_consentimiento']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarConsentimiento(token, formData)
      
      alert('¡Felicitaciones! Has completado todos los formularios exitosamente. El equipo de reclutamiento se pondrá en contacto contigo pronto.')
      
      // Redirigir a una página de confirmación o cerrar
      window.close()
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
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Consentimiento y Autorización</h1>
                <p className="text-red-100 text-sm sm:text-base">Paso 6 de 6 - Autorización final</p>
              </div>
              <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-red-200" />
            </div>
            
            <div className="mt-6 bg-red-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-red-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Autorización para el Tratamiento de Datos Personales
              </h2>
              
              <div className="text-sm text-gray-700 space-y-3 bg-white p-4 rounded border">
                <p>
                  <strong>AUTORIZACIÓN TRATAMIENTO DE DATOS - LEY 1581/2012</strong>
                </p>
                
                <p>
                  Yo, <strong>{candidato.primer_nombre} {candidato.primer_apellido}</strong>, 
                  identificado(a) con {candidato.tipo_documento} {candidato.numero_documento}, 
                  autorizo a <strong>ASISTE ING</strong> para recopilar, almacenar y tratar 
                  mis datos personales para:
                </p>
                
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Proceso de selección y reclutamiento</li>
                  <li>Evaluación del perfil profesional</li>
                  <li>Contacto durante el proceso</li>
                  <li>Verificación de información suministrada</li>
                </ul>
                
                <p>
                  <strong>Mis derechos:</strong> Puedo conocer, actualizar, rectificar y solicitar 
                  la eliminación de mis datos contactando a ASISTE ING.
                </p>
                
                <p className="text-center font-semibold text-blue-600">
                  Al marcar acepto esta autorización según la Ley 1581 de 2012.
                </p>
              </div>
              
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={consentimientoAceptado}
                    onChange={(e) => setConsentimientoAceptado(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm font-medium text-gray-900">
                    He leído y acepto la autorización para el tratamiento de datos personales
                  </span>
                </label>
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
                    'Debes aceptar el consentimiento para finalizar'
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={saving || !consentimientoAceptado}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      🎯 Finalizar Proceso
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