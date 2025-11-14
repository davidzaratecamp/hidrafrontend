import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Briefcase, ArrowRight, ArrowLeft, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import ApiService from '../../services/api'

export default function Experiencia() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    nombre_empresa: '',
    cargo_desempenado: '',
    salario_experiencia: '',
    fecha_inicio_experiencia: '',
    fecha_retiro_experiencia: '',
    tiempo_laborado_anos: 0,
    tiempo_laborado_meses: 0,
    motivo_retiro: '',
    experiencia_comercial_certificada: '',
    experiencia_comercial_no_certificada: '',
    primer_empleo_formal: '',
    ha_trabajado_asiste: ''
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
        nombre_empresa: candidatoInfo.nombre_empresa || '',
        cargo_desempenado: candidatoInfo.cargo_desempenado || '',
        salario_experiencia: candidatoInfo.salario_experiencia || '',
        fecha_inicio_experiencia: candidatoInfo.fecha_inicio_experiencia || '',
        fecha_retiro_experiencia: candidatoInfo.fecha_retiro_experiencia || '',
        tiempo_laborado_anos: candidatoInfo.tiempo_laborado_anos || 0,
        tiempo_laborado_meses: candidatoInfo.tiempo_laborado_meses || 0,
        motivo_retiro: candidatoInfo.motivo_retiro || '',
        experiencia_comercial_certificada: candidatoInfo.experiencia_comercial_certificada || '',
        experiencia_comercial_no_certificada: candidatoInfo.experiencia_comercial_no_certificada || '',
        primer_empleo_formal: candidatoInfo.primer_empleo_formal || '',
        ha_trabajado_asiste: candidatoInfo.ha_trabajado_asiste || ''
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const calcularTiempoLaborado = (fechaInicio, fechaRetiro) => {
    if (!fechaInicio || !fechaRetiro) return { anos: 0, meses: 0 }
    
    const inicio = new Date(fechaInicio)
    const retiro = new Date(fechaRetiro)
    
    let anos = retiro.getFullYear() - inicio.getFullYear()
    let meses = retiro.getMonth() - inicio.getMonth()
    
    if (meses < 0) {
      anos--
      meses += 12
    }
    
    return { anos, meses }
  }

  // Efecto para calcular automáticamente el tiempo laborado
  useEffect(() => {
    if (formData.fecha_inicio_experiencia && formData.fecha_retiro_experiencia) {
      const { anos, meses } = calcularTiempoLaborado(
        formData.fecha_inicio_experiencia, 
        formData.fecha_retiro_experiencia
      )
      setFormData(prev => ({
        ...prev,
        tiempo_laborado_anos: anos,
        tiempo_laborado_meses: meses
      }))
    }
  }, [formData.fecha_inicio_experiencia, formData.fecha_retiro_experiencia])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const requiredFields = ['nombre_empresa', 'cargo_desempenado', 'salario_experiencia', 
                           'fecha_inicio_experiencia', 'fecha_retiro_experiencia', 'motivo_retiro',
                           'experiencia_comercial_certificada', 'experiencia_comercial_no_certificada', 
                           'primer_empleo_formal', 'ha_trabajado_asiste']
    
    for (const field of requiredFields) {
      if (formData[field] === '' || formData[field] === null || formData[field] === undefined) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }
    
    try {
      setSaving(true)
      await ApiService.actualizarExperiencia(token, formData)
      navigate(`/candidato/personal/${token}`)
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
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Experiencia Laboral</h1>
                <p className="text-indigo-100">Paso 4 de 6 - Tu experiencia más reciente</p>
              </div>
              <Briefcase className="h-12 w-12 text-indigo-200" />
            </div>
            
            <div className="mt-6 bg-indigo-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-indigo-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-indigo-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                  Información de la Empresa
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_empresa}
                      onChange={(e) => setFormData({...formData, nombre_empresa: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombre completo de la empresa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo Desempeñado *
                    </label>
                    <input
                      type="text"
                      value={formData.cargo_desempenado}
                      onChange={(e) => setFormData({...formData, cargo_desempenado: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Título del cargo que desempeñaste"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Salario *
                    </label>
                    <input
                      type="number"
                      value={formData.salario_experiencia}
                      onChange={(e) => setFormData({...formData, salario_experiencia: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Salario mensual en pesos"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Fechas y Tiempo
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_inicio_experiencia}
                      onChange={(e) => setFormData({...formData, fecha_inicio_experiencia: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Retiro *
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_retiro_experiencia}
                      onChange={(e) => setFormData({...formData, fecha_retiro_experiencia: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo Laborado
                    </label>
                    <input
                      type="text"
                      value={
                        formData.tiempo_laborado_anos > 0 || formData.tiempo_laborado_meses > 0
                          ? `${formData.tiempo_laborado_anos} años y ${formData.tiempo_laborado_meses} meses`
                          : 'Se calcula automáticamente al seleccionar fechas'
                      }
                      disabled
                      className="input-field bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de Retiro *
                    </label>
                    <textarea
                      value={formData.motivo_retiro}
                      onChange={(e) => setFormData({...formData, motivo_retiro: e.target.value})}
                      required
                      className="input-field"
                      rows="3"
                      placeholder="Describe brevemente el motivo por el cual dejaste este empleo"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Experiencia Comercial
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Experiencia comercial certificada? *
                    </label>
                    <select
                      value={formData.experiencia_comercial_certificada}
                      onChange={(e) => setFormData({...formData, experiencia_comercial_certificada: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {catalogos.si_no?.length > 0 ? (
                        catalogos.si_no.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Experiencia comercial no certificada? *
                    </label>
                    <select
                      value={formData.experiencia_comercial_no_certificada}
                      onChange={(e) => setFormData({...formData, experiencia_comercial_no_certificada: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {catalogos.si_no?.length > 0 ? (
                        catalogos.si_no.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Es tu primer empleo formal? *
                    </label>
                    <select
                      value={formData.primer_empleo_formal}
                      onChange={(e) => setFormData({...formData, primer_empleo_formal: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {catalogos.si_no?.length > 0 ? (
                        catalogos.si_no.map((opcion) => (
                          <option key={opcion.value} value={opcion.value}>
                            {opcion.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información Adicional
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Has trabajado en Asiste Ing anteriormente? *
                  </label>
                  <select
                    value={formData.ha_trabajado_asiste}
                    onChange={(e) => setFormData({...formData, ha_trabajado_asiste: e.target.value})}
                    required
                    className="input-field"
                  >
                    <option value="">Selecciona una opción</option>
                    {catalogos.si_no?.length > 0 ? (
                      catalogos.si_no.map((opcion) => (
                        <option key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Información Importante</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Registra tu <strong>experiencia laboral más reciente</strong> o significativa</li>
                  <li>• Si no has tenido experiencia laboral formal, puedes incluir prácticas profesionales</li>
                  <li>• El tiempo laborado (años y meses) se calcula automáticamente según las fechas</li>
                  <li>• Asegúrate de que las fechas sean coherentes y reales</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/estudios/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>
                
                <div className="text-sm text-gray-600">
                  {candidato.formulario_experiencia_completado ? (
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
                      Siguiente: Información Personal
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