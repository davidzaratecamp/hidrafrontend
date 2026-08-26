import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Briefcase, ArrowRight, ArrowLeft, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import ApiService from '../../services/api'

// Límites calculados contra el ancho/alto real de cada celda de hojavida.pdf
// (hojaVidaPdfService.js), reutilizando la lógica real de ajuste de texto
// (fitSingleLine/wrapLines) con texto representativo en español, A TAMAÑO ESTÁNDAR (sin
// encoger la letra). Recalculados 2026-08-21 tras pasar la plantilla a Times New Roman y
// corregir la calibración de varias celdas en hidrabackend/services/hojaVidaPdfService.js.
// FUNCIONES bajó bastante (518->151): la celda impresa mide solo 21.6pt de alto y ya la
// ocupa la etiqueta "FUNCIONES:" — no hay espacio para envolver a una 2da línea sin invadir
// la fila de abajo, así que ahora se dibuja en una sola línea junto a la etiqueta.
const MAX_NOMBRE_EMPRESA = 41
const MAX_CARGO_DESEMPENADO = 19
const MAX_SALARIO_DIGITS = 17
const MAX_FUNCIONES = 151
const MAX_MOTIVO_RETIRO = 27
const MAX_CAMPANA_ASISTE = 86
const MAX_TIEMPO_LABORADO_ASISTE = 24
const MAX_MOTIVO_RETIRO_ASISTE = 35

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
  // "Actualmente trabajo aquí" (2026-08-26): fecha_retiro_experiencia y motivo_retiro pasan a ser
  // opcionales cuando está marcado - no se guarda un flag aparte, se infiere de que
  // fecha_retiro_experiencia venga vacía (ver misma inferencia en el backend).
  const [trabajaActualmente, setTrabajaActualmente] = useState(false)

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
      setTrabajaActualmente(!!candidatoInfo.fecha_inicio_experiencia && !candidatoInfo.fecha_retiro_experiencia)
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
    const rawValue = e.target.value.replace(/[^\d]/g, '').slice(0, MAX_SALARIO_DIGITS) // Solo números
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

  // Efecto para calcular automáticamente el tiempo laborado - si "trabaja actualmente" está
  // marcado, usa la fecha de hoy como fin en vez de fecha_retiro_experiencia (que queda vacía).
  useEffect(() => {
    const fechaFin = trabajaActualmente ? new Date().toISOString().slice(0, 10) : formData.fecha_retiro_experiencia
    if (formData.fecha_inicio_experiencia && fechaFin) {
      const { anos, meses } = calcularTiempoLaborado(formData.fecha_inicio_experiencia, fechaFin)
      setFormData(prev => ({
        ...prev,
        tiempo_laborado_anos: anos,
        tiempo_laborado_meses: meses
      }))
    }
  }, [formData.fecha_inicio_experiencia, formData.fecha_retiro_experiencia, trabajaActualmente])

  // Excel: "SI SU RESPUESTA ES AFIRMATIVA, ¿EN QUE CAMPAÑA LABORÓ?" - los detalles del
  // reintegro solo aplican si contestó "Sí" a alguna de las 2 preguntas de Asiste ING.
  const mostrarDetalleAsiste = formData.ha_trabajado_asiste === 'si' || formData.ha_estado_proceso_formativo_asiste === 'si'

  const handleSubmit = async (e) => {
    e.preventDefault()

    const requiredFields = ['nombre_empresa', 'cargo_desempenado', 'salario_experiencia', 'funciones',
                           'fecha_inicio_experiencia',
                           'ha_trabajado_asiste', 'ha_estado_proceso_formativo_asiste']
    // Fecha de Retiro y Motivo de Retiro solo son obligatorios si NO está trabajando actualmente.
    if (!trabajaActualmente) {
      requiredFields.push('fecha_retiro_experiencia', 'motivo_retiro')
    }

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
                      onChange={(e) => setFormData({...formData, nombre_empresa: e.target.value.slice(0, MAX_NOMBRE_EMPRESA)})}
                      required
                      maxLength={MAX_NOMBRE_EMPRESA}
                      className="input-field"
                      placeholder="Nombre completo de la empresa"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.nombre_empresa.length}/{MAX_NOMBRE_EMPRESA} caracteres
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo Desempeñado *
                    </label>
                    <input
                      type="text"
                      value={formData.cargo_desempenado}
                      onChange={(e) => setFormData({...formData, cargo_desempenado: e.target.value.slice(0, MAX_CARGO_DESEMPENADO)})}
                      required
                      maxLength={MAX_CARGO_DESEMPENADO}
                      className="input-field"
                      placeholder="Título del cargo que desempeñaste"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.cargo_desempenado.length}/{MAX_CARGO_DESEMPENADO} caracteres
                    </p>
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
                      maxLength={MAX_SALARIO_DIGITS + 6}
                      className="input-field"
                      placeholder="Ejemplo: 2.000.000"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.salario_experiencia.length}/{MAX_SALARIO_DIGITS} dígitos
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funciones *
                    </label>
                    <textarea
                      value={formData.funciones}
                      onChange={(e) => setFormData({...formData, funciones: e.target.value.slice(0, MAX_FUNCIONES)})}
                      required
                      className="input-field"
                      rows="3"
                      maxLength={MAX_FUNCIONES}
                      placeholder="Describe las funciones principales que realizabas en este cargo"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.funciones.length}/{MAX_FUNCIONES} caracteres
                    </p>
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
                      Fecha de Retiro {!trabajaActualmente && '*'}
                    </label>
                    <label className="flex items-center text-sm text-gray-600 mb-2">
                      <input
                        type="checkbox"
                        checked={trabajaActualmente}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setTrabajaActualmente(checked)
                          if (checked) {
                            setFormData((prev) => ({ ...prev, fecha_retiro_experiencia: '' }))
                          }
                        }}
                        className="mr-2"
                      />
                      Actualmente trabajo aquí
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_retiro_experiencia}
                      onChange={(e) => setFormData({...formData, fecha_retiro_experiencia: e.target.value})}
                      required={!trabajaActualmente}
                      disabled={trabajaActualmente}
                      className={`input-field ${trabajaActualmente ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                          ? `${formData.tiempo_laborado_anos} años y ${formData.tiempo_laborado_meses} meses${trabajaActualmente ? ' (hasta la fecha)' : ''}`
                          : 'Se calcula automáticamente al seleccionar fechas'
                      }
                      disabled
                      className="input-field bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de Retiro {!trabajaActualmente && '*'}
                    </label>
                    <textarea
                      value={formData.motivo_retiro}
                      onChange={(e) => setFormData({...formData, motivo_retiro: e.target.value.slice(0, MAX_MOTIVO_RETIRO)})}
                      required={!trabajaActualmente}
                      className="input-field"
                      rows="2"
                      maxLength={MAX_MOTIVO_RETIRO}
                      placeholder={trabajaActualmente ? 'No aplica - actualmente trabajas aquí' : 'Motivo breve (ej: Nueva oportunidad laboral)'}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formData.motivo_retiro.length}/{MAX_MOTIVO_RETIRO} caracteres — la plantilla solo tiene espacio para una frase corta
                    </p>
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
                          onChange={(e) => setFormData({...formData, campana_asiste: e.target.value.slice(0, MAX_CAMPANA_ASISTE)})}
                          maxLength={MAX_CAMPANA_ASISTE}
                          className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {formData.campana_asiste.length}/{MAX_CAMPANA_ASISTE} caracteres
                        </p>
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
                          onChange={(e) => setFormData({...formData, tiempo_laborado_asiste: e.target.value.slice(0, MAX_TIEMPO_LABORADO_ASISTE)})}
                          maxLength={MAX_TIEMPO_LABORADO_ASISTE}
                          className="input-field"
                          placeholder="Ej: 6 meses"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {formData.tiempo_laborado_asiste.length}/{MAX_TIEMPO_LABORADO_ASISTE} caracteres
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motivo de Retiro
                        </label>
                        <input
                          type="text"
                          value={formData.motivo_retiro_asiste}
                          onChange={(e) => setFormData({...formData, motivo_retiro_asiste: e.target.value.slice(0, MAX_MOTIVO_RETIRO_ASISTE)})}
                          maxLength={MAX_MOTIVO_RETIRO_ASISTE}
                          className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {formData.motivo_retiro_asiste.length}/{MAX_MOTIVO_RETIRO_ASISTE} caracteres
                        </p>
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
