import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Building, MapPin, Phone, Mail, FileText, Save, ArrowLeft, User, Briefcase, MessageSquare } from 'lucide-react'
import Sidebar from './Sidebar'
import ApiService from '../../services/api'

export default function NuevoCandidato() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
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
    hora_citacion_entrevista: '',
    observaciones_llamada: '',
    observaciones_generales: ''
  })

  useEffect(() => {
    cargarCatalogos()
  }, [])

  const cargarCatalogos = async () => {
    try {
      const data = await ApiService.getCatalogos()
      console.log('Catálogos cargados:', data)
      console.log('Observaciones de llamada:', data.observaciones_llamada)
      setCatalogos(data)
    } catch (error) {
      console.error('Error cargando catálogos:', error)
    }
  }

  // Lógica condicional para tipo de documento
  const handleNacionalidadChange = (nacionalidad) => {
    setFormData({
      ...formData,
      nacionalidad,
      tipo_documento: nacionalidad === 'Colombiano' ? 'CC' : '',
      numero_documento: ''
    })
  }

  const getCargosDisponibles = () => {
    if (!formData.cliente) return []
    
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

  const esClienteStaff = (cliente) => {
    return cliente === 'Staff Operacional' || cliente === 'Staff Administrativo'
  }

  const combinarFechaHora = (fecha, hora) => {
    if (!fecha || !hora) return null
    return `${fecha} ${hora}:00`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const fechaCompleta = combinarFechaHora(formData.fecha_citacion_entrevista, formData.hora_citacion_entrevista)
      
      const candidatoData = {
        ...formData,
        fecha_citacion_entrevista: fechaCompleta
      }
      
      delete candidatoData.hora_citacion_entrevista
      
      console.log('Enviando datos del candidato:', candidatoData)
      
      const response = await ApiService.crearCandidato(candidatoData)
      console.log('Candidato creado:', response)
      
      alert('Candidato creado exitosamente')
      navigate('/hydra/reclutador/candidatos')
    } catch (error) {
      console.error('Error creando candidato:', error)
      const mensaje = error.response?.data?.error || error.message || 'Error desconocido'
      alert(`Error al crear candidato: ${mensaje}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 max-w-4xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Nuevo Candidato</h1>
                <p className="text-sm lg:text-base text-gray-600">Registrar un nuevo candidato en el sistema de reclutamiento</p>
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 lg:p-6">
            <div className="flex items-center">
              <UserPlus className="h-6 w-6 lg:h-8 lg:w-8 mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg lg:text-xl font-semibold">Formulario de Registro</h2>
                <p className="text-sm lg:text-base text-blue-100">Complete todos los campos requeridos</p>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Datos Principales del Candidato */}
              <div className="bg-blue-50 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-600 flex-shrink-0" />
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
                        catalogos.nacionalidades.map((nacionalidad) => (
                          <option key={nacionalidad.value} value={nacionalidad.value}>
                            {nacionalidad.label}
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
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => {
                        // Solo permitir números para documentos colombianos
                        const value = formData.nacionalidad === 'Colombiano' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value
                        setFormData({...formData, numero_documento: value})
                      }}
                      required
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
                      Número Celular *
                    </label>
                    <input
                      type="tel"
                      value={formData.numero_celular}
                      onChange={(e) => {
                        // Solo permitir números
                        const value = e.target.value.replace(/[^0-9]/g, '')
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
                  <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
                  Datos del Proceso de Reclutamiento
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      value={formData.cliente}
                      onChange={(e) => {
                        setFormData({...formData, cliente: e.target.value, cargo: '', oleada: ''})
                      }}
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

                  {/* Oleada - Solo visible si no es Staff */}
                  {!esClienteStaff(formData.cliente) && formData.cliente && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Oleada
                      </label>
                      <input
                        type="text"
                        value={formData.oleada}
                        onChange={(e) => setFormData({...formData, oleada: e.target.value})}
                        className="input-field"
                        placeholder="Q4-2024, Enero-2025..."
                      />
                    </div>
                  )}

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Ciudad
                    </label>
                    <select
                      value={formData.ciudad}
                      onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo *
                    </label>
                    {formData.cliente ? (
                      <select
                        value={formData.cargo}
                        onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                        required
                        className="input-field"
                      >
                        <option value="">
                          {getCargosDisponibles().length === 0 ? 'Selecciona un cliente primero' : 'Selecciona cargo'}
                        </option>
                        {esClienteStaff(formData.cliente) ? (
                          getCargosDisponibles().map((cargo) => (
                            <option key={cargo} value={cargo}>
                              {cargo}
                            </option>
                          ))
                        ) : (
                          <>
                            {formData.cliente === 'Claro' && (
                              <>
                                <option value="Agente Call Center">Agente Call Center</option>
                                <option value="Agente Call Center Plus">Agente Call Center Plus</option>
                              </>
                            )}
                            {formData.cliente === 'Obamacare' && (
                              <>
                                <option value="Customer Service">Customer Service</option>
                                <option value="Agente Call Center">Agente Call Center</option>
                              </>
                            )}
                            {formData.cliente === 'Majority' && (
                              <option value="Agente Call Center">Agente Call Center</option>
                            )}
                          </>
                        )}
                      </select>
                    ) : (
                      <select disabled className="input-field bg-gray-100">
                        <option>Selecciona un cliente primero</option>
                      </select>
                    )}
                  </div>

                  {/* Fuente de Reclutamiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuente de Reclutamiento
                    </label>
                    <select
                      value={formData.fuente_reclutamiento}
                      onChange={(e) => setFormData({...formData, fuente_reclutamiento: e.target.value})}
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

                  {/* Fecha de Citación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Citación
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_citacion_entrevista}
                      onChange={(e) => setFormData({...formData, fecha_citacion_entrevista: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  {/* Hora de Citación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Citación
                    </label>
                    <input
                      type="time"
                      value={formData.hora_citacion_entrevista}
                      onChange={(e) => setFormData({...formData, hora_citacion_entrevista: e.target.value})}
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
                
                <div className="grid md:grid-cols-2 gap-4">
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
                        [
                          ...catalogos.observaciones_llamada,
                          ...(catalogos.observaciones_llamada.find(obs => obs.value === 'No apto') ? [] : [{ value: 'No apto', label: 'No apto' }])
                        ].map((obs) => (
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

              {/* Información importante */}
              <div className="bg-yellow-50 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Información Importante</h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Los campos marcados con (*) son obligatorios</li>
                  <li>• Si el candidato es colombiano, el tipo de documento se asigna automáticamente como "CC"</li>
                  <li>• El campo "Oleada" solo aparece para clientes que no son Staff</li>
                  <li>• Los cargos disponibles cambian según el cliente seleccionado</li>
                  <li>• El candidato recibirá un email con los formularios a completar</li>
                  <li>• El token de acceso tiene una validez de 30 días</li>
                </ul>
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
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Candidato
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}