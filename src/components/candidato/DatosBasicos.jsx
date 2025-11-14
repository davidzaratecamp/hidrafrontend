import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Heart, MapPin, Phone, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

export default function DatosBasicos() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    segundo_apellido: '',
    segundo_nombre: '',
    genero: '',
    fecha_nacimiento: '',
    grupo_sanguineo: '',
    eps: '',
    afp: '',
    nombre_emergencia: '',
    numero_emergencia: '',
    parentesco_emergencia: ''
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
        segundo_apellido: candidatoInfo.segundo_apellido || '',
        segundo_nombre: candidatoInfo.segundo_nombre || '',
        genero: candidatoInfo.genero || '',
        fecha_nacimiento: candidatoInfo.fecha_nacimiento || '',
        grupo_sanguineo: candidatoInfo.grupo_sanguineo || '',
        eps: candidatoInfo.eps || '',
        afp: candidatoInfo.afp || '',
        nombre_emergencia: candidatoInfo.nombre_emergencia || '',
        numero_emergencia: candidatoInfo.numero_emergencia || '',
        parentesco_emergencia: candidatoInfo.parentesco_emergencia || ''
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
    
    const requiredFields = ['genero', 'fecha_nacimiento', 'grupo_sanguineo', 'eps', 'afp', 
                           'nombre_emergencia', 'numero_emergencia', 'parentesco_emergencia']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarDatosBasicos(token, formData)
      navigate(`/candidato/estudios/${token}`)
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
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Datos Básicos</h1>
                <p className="text-green-100">Paso 2 de 6 - Información personal detallada</p>
              </div>
              <User className="h-12 w-12 text-green-200" />
            </div>
            
            <div className="mt-6 bg-green-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-green-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Información Personal
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segundo Apellido
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_apellido}
                      onChange={(e) => setFormData({...formData, segundo_apellido: e.target.value})}
                      className="input-field"
                      placeholder="Opcional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Segundo Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.segundo_nombre}
                      onChange={(e) => setFormData({...formData, segundo_nombre: e.target.value})}
                      className="input-field"
                      placeholder="Opcional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género *
                    </label>
                    <select
                      value={formData.genero}
                      onChange={(e) => setFormData({...formData, genero: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu género</option>
                      {catalogos.generos?.map((genero) => (
                        <option key={genero.value} value={genero.value}>
                          {genero.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Información Médica
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grupo Sanguíneo *
                    </label>
                    <select
                      value={formData.grupo_sanguineo}
                      onChange={(e) => setFormData({...formData, grupo_sanguineo: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {catalogos.grupos_sanguineos?.map((grupo) => (
                        <option key={grupo} value={grupo}>
                          {grupo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EPS *
                    </label>
                    <select
                      value={formData.eps}
                      onChange={(e) => setFormData({...formData, eps: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu EPS</option>
                      {catalogos.eps_opciones?.map((eps) => (
                        <option key={eps} value={eps}>
                          {eps}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AFP *
                    </label>
                    <select
                      value={formData.afp}
                      onChange={(e) => setFormData({...formData, afp: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu AFP</option>
                      {catalogos.afp_opciones?.map((afp) => (
                        <option key={afp} value={afp}>
                          {afp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>


              <div className="bg-orange-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-orange-600" />
                  Contacto de Emergencia
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_emergencia}
                      onChange={(e) => setFormData({...formData, nombre_emergencia: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombre de contacto de emergencia"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.numero_emergencia}
                      onChange={(e) => setFormData({...formData, numero_emergencia: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Ej: 3001234567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parentesco *
                    </label>
                    <select
                      value={formData.parentesco_emergencia}
                      onChange={(e) => setFormData({...formData, parentesco_emergencia: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona parentesco</option>
                      {catalogos.parentesco_opciones?.map((parentesco) => (
                        <option key={parentesco} value={parentesco}>
                          {parentesco}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/hoja-vida/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-600">
                  {candidato.formulario_datos_basicos_completado ? (
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
                      Siguiente: Estudios
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