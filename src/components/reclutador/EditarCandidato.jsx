import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, User, Building, MapPin, Phone, Mail, MessageSquare } from 'lucide-react'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

export default function EditarCandidato() {
  const { candidatoId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    // Datos principales
    nacionalidad: '',
    tipo_documento: '',
    numero_documento: '',
    primer_apellido: '',
    primer_nombre: '',
    email_personal: '',
    numero_celular: '',
    
    // Datos del proceso
    cliente: '',
    oleada: '',
    ciudad: '',
    cargo: '',
    fuente_reclutamiento: '',
    fecha_citacion_entrevista: '',
    observaciones_llamada: '',
    observaciones_generales: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [candidatoId])

  const cargarDatos = async () => {
    try {
      const [candidatoData, catalogosData] = await Promise.all([
        ApiService.getPerfilCompleto(candidatoId),
        ApiService.getCatalogos()
      ])
      
      const candidatoInfo = candidatoData.candidato
      setCandidato(candidatoInfo)
      setCatalogos(catalogosData)
      
      setFormData({
        nacionalidad: candidatoInfo.nacionalidad || '',
        tipo_documento: candidatoInfo.tipo_documento || '',
        numero_documento: candidatoInfo.numero_documento || '',
        primer_apellido: candidatoInfo.primer_apellido || '',
        primer_nombre: candidatoInfo.primer_nombre || '',
        email_personal: candidatoInfo.email_personal || '',
        numero_celular: candidatoInfo.numero_celular || '',
        cliente: candidatoInfo.cliente || '',
        oleada: candidatoInfo.oleada || '',
        ciudad: candidatoInfo.ciudad || '',
        cargo: candidatoInfo.cargo || '',
        fuente_reclutamiento: candidatoInfo.fuente_reclutamiento || '',
        fecha_citacion_entrevista: candidatoInfo.fecha_citacion_entrevista || '',
        observaciones_llamada: candidatoInfo.observaciones_llamada || '',
        observaciones_generales: candidatoInfo.observaciones_generales || ''
      })
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar el candidato')
    } finally {
      setLoading(false)
    }
  }

  // Lógica condicional para tipo de documento
  const handleNacionalidadChange = (nacionalidad) => {
    setFormData({
      ...formData,
      nacionalidad,
      tipo_documento: nacionalidad === 'Colombiano' ? 'CC' : ''
    })
  }

  // Lógica condicional para mostrar/ocultar oleada
  const mostrarOleada = () => {
    const clientesConOleada = ['Claro', 'Obamacare', 'Majority']
    return clientesConOleada.includes(formData.cliente)
  }

  // Obtener cargos según cliente seleccionado
  const getCargosDisponibles = () => {
    if (!formData.cliente || !catalogos) return []
    
    switch (formData.cliente) {
      case 'Staff Operacional':
      case 'Staff Administrativo':
        return catalogos.cargos_staff || []
      case 'Claro':
        return catalogos.cargos_claro || []
      case 'Obamacare':
        return catalogos.cargos_obamacare || []
      case 'Majority':
        return catalogos.cargos_majority || []
      default:
        return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar campos requeridos
    const requiredFields = ['nacionalidad', 'primer_apellido', 'primer_nombre', 
                           'numero_celular', 'cliente', 'ciudad', 'cargo', 'fuente_reclutamiento']
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }

    // Validar oleada si es requerida
    if (mostrarOleada() && !formData.oleada) {
      alert('Por favor completa el campo: oleada')
      return
    }
    
    try {
      setSaving(true)
      await ApiService.editarCandidato(candidatoId, formData)
      alert('Candidato actualizado exitosamente')
      navigate('/hydra/reclutador/candidatos')
    } catch (error) {
      console.error('Error actualizando candidato:', error)
      alert('Error al actualizar el candidato. Verifica los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando candidato...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!candidato) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Error: No se pudo cargar el candidato</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Candidato</h1>
              <p className="text-gray-600">Modificar información del candidato: {candidato.primer_nombre} {candidato.primer_apellido}</p>
            </div>
            <button
              onClick={() => navigate('/hydra/reclutador/candidatos')}
              className="btn-secondary flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Candidatos
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-xl font-semibold">Editar Información</h2>
                <p className="text-blue-100">Modifica los datos del candidato</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Datos Principales del Candidato */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Datos Principales del Candidato
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nacionalidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nacionalidad *
                    </label>
                    <select
                      value={formData.nacionalidad}
                      onChange={(e) => handleNacionalidadChange(e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona nacionalidad</option>
                      {catalogos.nacionalidades?.length > 0 ? (
                        catalogos.nacionalidades.map((nac) => (
                          <option key={nac.value} value={nac.value}>
                            {nac.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Colombiano">Colombiano</option>
                          <option value="Venezolano">Venezolano</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Tipo de Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    {formData.nacionalidad === 'Colombiano' ? (
                      <input
                        type="text"
                        value="CC"
                        disabled
                        className="input-field bg-gray-100 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={formData.tipo_documento}
                        onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                        required
                        className="input-field"
                        disabled={!formData.nacionalidad || formData.nacionalidad === 'Colombiano'}
                      >
                        <option value="">Selecciona tipo</option>
                        {catalogos.tipos_documento_extranjero?.length > 0 ? (
                          catalogos.tipos_documento_extranjero.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Pasaporte">Pasaporte</option>
                            <option value="CE">CE (Cédula de Extranjería)</option>
                            <option value="DNI">DNI</option>
                            <option value="Otro">Otro</option>
                          </>
                        )}
                      </select>
                    )}
                  </div>
                  
                  {/* Número de Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => {
                        // Solo números
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData({...formData, numero_documento: value})
                      }}
                      className="input-field"
                      placeholder="12345678"
                      pattern="[0-9]*"
                    />
                  </div>
                  
                  {/* Primer Apellido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primer Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_apellido}
                      onChange={(e) => setFormData({...formData, primer_apellido: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Apellido del candidato"
                    />
                  </div>
                  
                  {/* Primer Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primer Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.primer_nombre}
                      onChange={(e) => setFormData({...formData, primer_nombre: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombre del candidato"
                    />
                  </div>
                  
                  {/* Email Personal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email Personal
                    </label>
                    <input
                      type="email"
                      value={formData.email_personal}
                      onChange={(e) => setFormData({...formData, email_personal: e.target.value})}
                      className="input-field"
                      placeholder="candidato@email.com"
                    />
                  </div>
                  
                  {/* Número Celular */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Número de Celular *
                    </label>
                    <input
                      type="tel"
                      value={formData.numero_celular}
                      onChange={(e) => {
                        // Solo números
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData({...formData, numero_celular: value})
                      }}
                      required
                      className="input-field"
                      placeholder="3001234567"
                      pattern="[0-9]*"
                    />
                  </div>
                </div>
              </div>

              {/* Datos del Proceso de Reclutamiento */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-purple-600" />
                  Datos del Proceso de Reclutamiento
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      value={formData.cliente}
                      onChange={(e) => setFormData({...formData, cliente: e.target.value, cargo: ''})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona cliente</option>
                      {catalogos.clientes?.length > 0 ? (
                        catalogos.clientes.map((cliente) => (
                          <option key={cliente.value} value={cliente.value}>
                            {cliente.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Staff Operacional">Staff Operacional</option>
                          <option value="Staff Administrativo">Staff Administrativo</option>
                          <option value="Claro">Claro</option>
                          <option value="Obamacare">Obamacare</option>
                          <option value="Majority">Majority</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Oleada */}
                  {mostrarOleada() && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Oleada *
                      </label>
                      <input
                        type="text"
                        value={formData.oleada}
                        onChange={(e) => setFormData({...formData, oleada: e.target.value})}
                        required={mostrarOleada()}
                        className="input-field"
                        placeholder="Q4-2024, Enero-2025..."
                      />
                    </div>
                  )}
                  
                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Ciudad que Aplica *
                    </label>
                    <select
                      value={formData.ciudad}
                      onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona ciudad</option>
                      {catalogos.ciudades?.length > 0 ? (
                        catalogos.ciudades.map((ciudad) => (
                          <option key={ciudad.value} value={ciudad.value}>
                            {ciudad.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Bogotá">Bogotá</option>
                          <option value="Barranquilla">Barranquilla</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Cargo */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo que Aplica *
                    </label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      required
                      className="input-field"
                      disabled={!formData.cliente}
                    >
                      <option value="">
                        {formData.cliente ? 'Selecciona cargo' : 'Primero selecciona un cliente'}
                      </option>
                      {getCargosDisponibles().length > 0 && getCargosDisponibles().map((cargo) => (
                        <option key={cargo} value={cargo}>
                          {cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Fuente de Reclutamiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuente de Reclutamiento *
                    </label>
                    <select
                      value={formData.fuente_reclutamiento}
                      onChange={(e) => setFormData({...formData, fuente_reclutamiento: e.target.value})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona fuente</option>
                      {catalogos.fuentes_reclutamiento?.length > 0 ? (
                        catalogos.fuentes_reclutamiento.map((fuente) => (
                          <option key={fuente.value} value={fuente.value}>
                            {fuente.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Portal Web">Portal Web</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Referido Empleado">Referido Empleado</option>
                          <option value="Referido Externo">Referido Externo</option>
                          <option value="Redes Sociales">Redes Sociales</option>
                          <option value="Ferias de Empleo">Ferias de Empleo</option>
                          <option value="Universidades">Universidades</option>
                          <option value="Base de Datos">Base de Datos</option>
                          <option value="Otro">Otro</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Fecha de Citación a Entrevista */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Citación a Entrevista
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_citacion_entrevista}
                      onChange={(e) => setFormData({...formData, fecha_citacion_entrevista: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Observaciones
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Observaciones de Llamada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones de Llamada
                    </label>
                    <select
                      value={formData.observaciones_llamada}
                      onChange={(e) => setFormData({...formData, observaciones_llamada: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Selecciona observación</option>
                      {catalogos.observaciones_llamada?.length > 0 ? (
                        catalogos.observaciones_llamada.map((obs) => (
                          <option key={obs.value} value={obs.value}>
                            {obs.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Contacto exitoso">Contacto exitoso</option>
                          <option value="No contesta">No contesta</option>
                          <option value="Ocupado">Ocupado</option>
                          <option value="Número incorrecto">Número incorrecto</option>
                          <option value="Interesado">Interesado</option>
                          <option value="No interesado">No interesado</option>
                          <option value="Reagendar">Reagendar</option>
                          <option value="No apto">No apto</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Observaciones Generales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones Generales
                    </label>
                    <textarea
                      value={formData.observaciones_generales}
                      onChange={(e) => setFormData({...formData, observaciones_generales: e.target.value})}
                      rows={3}
                      className="input-field"
                      placeholder="Observaciones adicionales sobre el candidato..."
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/hydra/reclutador/candidatos')}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                
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
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
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