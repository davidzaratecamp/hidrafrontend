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
    funciones: '',
    fecha_inicio_experiencia: '',
    fecha_retiro_experiencia: '',
    tiempo_laborado_anos: 0,
    tiempo_laborado_meses: 0,
    motivo_retiro: '',
    ha_trabajado_asiste: '',
    ha_estado_proceso_formativo_asiste: '',
    campana_asiste: '',
    fecha_inicio_asiste: '',
    fecha_retiro_asiste: '',
    tiempo_laborado_asiste: '',
    motivo_retiro_asiste: ''
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
        salario_experiencia: candidatoInfo.salario_experiencia
          ? String(Math.round(parseFloat(candidatoInfo.salario_experiencia)))
          : '',
        funciones: candidatoInfo.funciones || '',
        fecha_inicio_experiencia: candidatoInfo.fecha_inicio_experiencia || '',
        fecha_retiro_experiencia: candidatoInfo.fecha_retiro_experiencia || '',
        tiempo_laborado_anos: candidatoInfo.tiempo_laborado_anos || 0,
        tiempo_laborado_meses: candidatoInfo.tiempo_laborado_meses || 0,
        motivo_retiro: candidatoInfo.motivo_retiro || '',
        ha_trabajado_asiste: candidatoInfo.ha_trabajado_asiste || '',
        ha_estado_proceso_formativo_asiste: candidatoInfo.ha_estado_proceso_formativo_asiste || '',
        campana_asiste: candidatoInfo.campana_asiste || '',
        fecha_inicio_asiste: candidatoInfo.fecha_inicio_asiste || '',
        fecha_retiro_asiste: candidatoInfo.fecha_retiro_asiste || '',
        tiempo_laborado_asiste: candidatoInfo.tiempo_laborado_asiste || '',
        motivo_retiro_asiste: candidatoInfo.motivo_retiro_asiste || ''
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const formatSalary = (value) => {
    // Remover caracteres no numéricos
    const numericValue = value.toString().replace(/[^\d]/g, '')

    // Formatear con puntos como separadores de miles
    if (numericValue) {
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    return ''
  }

  const handleSalaryChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '') // Solo números
    setFormData({
      ...formData,
      salario_experiencia: rawValue // Guardar valor numérico puro
    })
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

  // Excel: "SI SU RESPUESTA ES AFIRMATIVA, ¿EN QUE CAMPAÑA LABORÓ?" - los detalles del
  // reintegro solo aplican si contestó "Sí" a alguna de las 2 preguntas de Asiste ING.
  const mostrarDetalleAsiste = formData.ha_trabajado_asiste === 'si' || formData.ha_estado_proceso_formativo_asiste === 'si'

  const handleSubmit = async (e) => {
    e.preventDefault()

    const requiredFields = ['nombre_empresa', 'cargo_desempenado', 'salario_experiencia', 'funciones',
                           'fecha_inicio_experiencia', 'fecha_retiro_experiencia', 'motivo_retiro',
                           'ha_trabajado_asiste', 'ha_estado_proceso_formativo_asiste']

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
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Experiencia Laboral</h1>
                <p className="text-indigo-100 text-sm sm:text-base">Paso 4 de 6 - Tu experiencia más reciente</p>
              </div>
              <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-200" />
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

          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="bg-indigo-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                  Información de la Empresa
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
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
                      type="text"
                      value={formatSalary(formData.salario_experiencia)}
                      onChange={handleSalaryChange}
                      required
                      className="input-field"
                      placeholder="Ejemplo: 2.000.000"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funciones *
                    </label>
                    <textarea
                      value={formData.funciones}
                      onChange={(e) => setFormData({...formData, funciones: e.target.value})}
                      required
                      className="input-field"
                      rows="3"
                      placeholder="Describe las funciones principales que realizabas en este cargo"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Fechas y Tiempo
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="sm:col-span-2">
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

                  <div className="sm:col-span-2">
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

              {/* Excel: bloque "INFORMACIÓN REINTEGROS" (filas 45-50) */}
              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Información Reintegros
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Ha laborado con Asiste ING o Asiste Ingeniería? *
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Ha estado en proceso formativo con Asiste ING? *
                    </label>
                    <select
                      value={formData.ha_estado_proceso_formativo_asiste}
                      onChange={(e) => setFormData({...formData, ha_estado_proceso_formativo_asiste: e.target.value})}
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

                  {mostrarDetalleAsiste && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Si su respuesta es afirmativa, ¿en qué campaña laboró?
                        </label>
                        <input
                          type="text"
                          value={formData.campana_asiste}
                          onChange={(e) => setFormData({...formData, campana_asiste: e.target.value})}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_inicio_asiste}
                          onChange={(e) => setFormData({...formData, fecha_inicio_asiste: e.target.value})}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Retiro
                        </label>
                        <input
                          type="date"
                          value={formData.fecha_retiro_asiste}
                          onChange={(e) => setFormData({...formData, fecha_retiro_asiste: e.target.value})}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tiempo Laborado (indica si fueron meses o años)
                        </label>
                        <input
                          type="text"
                          value={formData.tiempo_laborado_asiste}
                          onChange={(e) => setFormData({...formData, tiempo_laborado_asiste: e.target.value})}
                          className="input-field"
                          placeholder="Ej: 6 meses"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo de Retiro
                        </label>
                        <input
                          type="text"
                          value={formData.motivo_retiro_asiste}
                          onChange={(e) => setFormData({...formData, motivo_retiro_asiste: e.target.value})}
                          className="input-field"
                        />
                      </div>
                    </>
                  )}
                </div>
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
