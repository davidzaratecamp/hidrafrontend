import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, User, Calendar, ArrowRight, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

export default function HojaVida() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [formData, setFormData] = useState({
    aspiracion_salarial: ''
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

      if (candidatoData.candidato.aspiracion_salarial) {
        setFormData({ aspiracion_salarial: candidatoData.candidato.aspiracion_salarial })
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
    
    if (!formData.aspiracion_salarial) {
      alert('Por favor indica tu aspiración salarial')
      return
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarHojaVida(token, formData)
      navigate(`/candidato/datos-basicos/${token}`)
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
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Formulario de Hoja de Vida</h1>
                <p className="text-blue-100 text-sm sm:text-base">Paso 1 de 6 - Información básica</p>
              </div>
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-blue-200" />
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
            {/* Excel: "FORMATO HOJA DE VIDA", bloque "DATOS BÁSICOS" (filas 4-8) - el
                formulario arranca directo con este bloque, sin paneles de bienvenida
                previos. Fecha de Entrevista, Fuente de Reclutamiento y Cargo al que
                Aspira ya los registró el reclutador en "Nuevo Candidato" y se muestran
                de solo lectura; Aspiración Salarial es el único dato que aporta el
                candidato (decisión del usuario, 2026-08-18). */}
            <form onSubmit={handleSubmit}>
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Datos Básicos
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      Fecha de Entrevista
                    </label>
                    <input
                      type="text"
                      value={
                        candidato.fecha_citacion_entrevista
                          ? new Date(candidato.fecha_citacion_entrevista).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Pendiente de agendar'
                      }
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuente de Reclutamiento
                    </label>
                    <input
                      type="text"
                      value={candidato.fuente_reclutamiento || 'No registrada'}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo al que Aspira
                    </label>
                    <input
                      type="text"
                      value={candidato.cargo || ''}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspiración Salarial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.aspiracion_salarial}
                      onChange={(e) => setFormData({...formData, aspiracion_salarial: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Ej: 1800000"
                    />
                  </div>
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