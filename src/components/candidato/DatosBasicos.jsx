import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, Phone, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

// Excel: "FORMATO HOJA DE VIDA" no trae catálogo de tallas - lista estándar local.
const TALLAS_CAMISA = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function DatosBasicos() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    nombre_completo: '',
    tipo_documento: '',
    numero_documento: '',
    numero_celular: '',
    edad: '',
    estado_civil: '',
    direccion_residencial: '',
    barrio: '',
    talla_camisa: '',
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
      // Nombres Completos se recompone desde los 4 campos guardados (mismo patrón que
      // EditarCandidato.jsx en la intranet) para que el candidato lo vea y pueda
      // corregirlo si el reclutador lo puso mal.
      const nombreCompuesto = [
        candidatoInfo.primer_nombre, candidatoInfo.segundo_nombre,
        candidatoInfo.primer_apellido, candidatoInfo.segundo_apellido
      ].filter(Boolean).join(' ')
      setFormData({
        nombre_completo: nombreCompuesto,
        tipo_documento: candidatoInfo.tipo_documento || '',
        numero_documento: candidatoInfo.numero_documento || '',
        numero_celular: candidatoInfo.numero_celular || '',
        edad: candidatoInfo.edad ?? '',
        estado_civil: candidatoInfo.estado_civil || '',
        direccion_residencial: candidatoInfo.direccion_residencial || '',
        barrio: candidatoInfo.barrio || '',
        talla_camisa: candidatoInfo.talla_camisa || '',
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

    const requiredFields = [
      'nombre_completo', 'tipo_documento', 'numero_documento', 'numero_celular', 'edad',
      'estado_civil', 'direccion_residencial', 'barrio', 'talla_camisa',
      'grupo_sanguineo', 'eps', 'afp',
      'nombre_emergencia', 'numero_emergencia', 'parentesco_emergencia'
    ]

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

  // Nacionalidad no se pide suelta: se deriva en vivo de tipo_documento (mismo criterio
  // que el backend en actualizarDatosBasicos y en crearCandidato/editarCandidato de la
  // intranet: CC -> Colombiano, PPT -> Venezolano).
  const nacionalidadDerivada = formData.tipo_documento === 'CC' ? 'Colombiano'
    : formData.tipo_documento === 'PPT' ? 'Venezolano'
    : ''

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
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Datos Básicos</h1>
                <p className="text-green-100 text-sm sm:text-base">Paso 2 de 6 - Información personal detallada</p>
              </div>
              <User className="h-8 w-8 sm:h-12 sm:w-12 text-green-200" />
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

          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Excel: bloque "DATOS PERSONALES" (filas 12-16). Nombres Completos, N° de
                  Documento, Nacionalidad, Celular, Correo Electrónico y Edad ya los
                  registró el reclutador en "Nuevo Candidato" - se muestran de solo
                  lectura para que el candidato confirme sus datos. Género y Fecha de
                  Nacimiento no están en el Excel oficial, pero se mantienen porque el
                  sistema ya los captura y usa (decisión del usuario, 2026-08-18). */}
              <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Datos Personales
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres Completos *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombre y apellidos completos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {catalogos.tipos_documento?.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° de Documento *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nacionalidad
                    </label>
                    <input
                      type="text"
                      value={nacionalidadDerivada}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se calcula según el tipo de documento.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular *
                    </label>
                    <input
                      type="tel"
                      value={formData.numero_celular}
                      onChange={(e) => setFormData({...formData, numero_celular: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="text"
                      value={candidato.email_personal || ''}
                      readOnly
                      disabled
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Es el correo al que te llegó este link, no se puede cambiar aquí.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.edad}
                      onChange={(e) => setFormData({...formData, edad: e.target.value})}
                      required
                      className="input-field"
                    />
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
                      Fondo de Pensión *
                    </label>
                    <select
                      value={formData.afp}
                      onChange={(e) => setFormData({...formData, afp: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu fondo de pensión</option>
                      {catalogos.afp_opciones?.map((afp) => (
                        <option key={afp} value={afp}>
                          {afp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RH *
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
                      Dirección Residencial *
                    </label>
                    <input
                      type="text"
                      value={formData.direccion_residencial}
                      onChange={(e) => setFormData({...formData, direccion_residencial: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barrio *
                    </label>
                    <input
                      type="text"
                      value={formData.barrio}
                      onChange={(e) => setFormData({...formData, barrio: e.target.value})}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado Civil *
                    </label>
                    <select
                      value={formData.estado_civil}
                      onChange={(e) => setFormData({...formData, estado_civil: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona tu estado civil</option>
                      {catalogos.estados_civiles?.map((estado) => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Talla de Camisa *
                    </label>
                    <select
                      value={formData.talla_camisa}
                      onChange={(e) => setFormData({...formData, talla_camisa: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      {TALLAS_CAMISA.map((talla) => (
                        <option key={talla} value={talla}>
                          {talla}
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
                      Teléfono *
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
