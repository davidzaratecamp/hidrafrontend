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
    
    // Validar campos requeridos (cédula y email ahora opcionales)
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
      const response = await ApiService.crearCandidato(formData)
      alert(`Candidato creado exitosamente. Token: ${response.candidato.token_acceso}`)
      navigate('/hydra/reclutador/candidatos')
    } catch (error) {
      console.error('Error creando candidato:', error)
      alert('Error al crear el candidato. Verifica los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nuevo Candidato</h1>
              <p className="text-gray-600">Registrar un nuevo candidato en el sistema de reclutamiento</p>
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
              <UserPlus className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-xl font-semibold">Formulario de Registro</h2>
                <p className="text-blue-100">Complete todos los campos requeridos</p>
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
                
                <div className="grid md:grid-cols-3 gap-4">
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
                  
                  {/* Oleada - Solo visible si cliente NO es Staff */}
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
                  
                  {/* Ciudad que Aplica */}
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
                  
                  {/* Cargo que Aplica */}
                  <div className="md:col-span-2">
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
                      {getCargosDisponibles().length > 0 ? (
                        getCargosDisponibles().map((cargo) => (
                          <option key={cargo} value={cargo}>
                            {cargo}
                          </option>
                        ))
                      ) : formData.cliente ? (
                        <>
                          {formData.cliente === 'Staff Operacional' || formData.cliente === 'Staff Administrativo' ? (
                            <>
                              <option value="Analista Administrativa Y Contable">Analista Administrativa Y Contable</option>
                              <option value="Analista De Calidad">Analista De Calidad</option>
                              <option value="Analista De Calidad Pe">Analista De Calidad Pe</option>
                              <option value="Analista De Contratacion">Analista De Contratacion</option>
                              <option value="Analista De Reclutamiento">Analista De Reclutamiento</option>
                              <option value="Analista De Seleccion">Analista De Seleccion</option>
                              <option value="Analista De Usuarios">Analista De Usuarios</option>
                              <option value="Analista PQR">Analista PQR</option>
                              <option value="Auditor/Gestor Calidad Comercial">Auditor/Gestor Calidad Comercial</option>
                              <option value="Auxiliar De Gestion Humana">Auxiliar De Gestion Humana</option>
                              <option value="Auxiliar De Servicios Generales">Auxiliar De Servicios Generales</option>
                              <option value="Auxiliar Juridico">Auxiliar Juridico</option>
                              <option value="Auxiliar Mantenimiento">Auxiliar Mantenimiento</option>
                              <option value="Auxiliar SST">Auxiliar SST</option>
                              <option value="Ayudante De Obra">Ayudante De Obra</option>
                              <option value="Backoffice">Backoffice</option>
                              <option value="Backoffice Pe">Backoffice Pe</option>
                              <option value="Community Manager">Community Manager</option>
                              <option value="Contador">Contador</option>
                              <option value="Coordinador">Coordinador</option>
                              <option value="Coordinador BackOffice">Coordinador BackOffice</option>
                              <option value="Coordinador Datamarshall">Coordinador Datamarshall</option>
                              <option value="Coordinador De Contratacion">Coordinador De Contratacion</option>
                              <option value="Coordinador De Nomina">Coordinador De Nomina</option>
                              <option value="Coordinador De Tecnologia">Coordinador De Tecnologia</option>
                              <option value="Coordinador De Usuarios">Coordinador De Usuarios</option>
                              <option value="Coordinador Pe">Coordinador Pe</option>
                              <option value="Coordinador Tecnico">Coordinador Tecnico</option>
                              <option value="Coordinadora Backoffice">Coordinadora Backoffice</option>
                              <option value="Coordinadora De Calidad">Coordinadora De Calidad</option>
                              <option value="Datamarshall">Datamarshall</option>
                              <option value="Datamarshall Senior Pe">Datamarshall Senior Pe</option>
                              <option value="Desarrollador Web">Desarrollador Web</option>
                              <option value="Director de formación">Director de formación</option>
                              <option value="Director de Operaciones">Director de Operaciones</option>
                              <option value="Director de Operaciones Pe">Director de Operaciones Pe</option>
                              <option value="Director De Tecnologia">Director De Tecnologia</option>
                              <option value="Diseñador Grafico">Diseñador Grafico</option>
                              <option value="Formador">Formador</option>
                              <option value="Formador Pe">Formador Pe</option>
                              <option value="Formador Senior">Formador Senior</option>
                              <option value="Gestora De Marketing Y Calidad De Se">Gestora De Marketing Y Calidad De Se</option>
                              <option value="GTR">GTR</option>
                              <option value="Jefe Backoffice">Jefe Backoffice</option>
                              <option value="Jefe De Manteniminento">Jefe De Manteniminento</option>
                              <option value="Jefe de operacion">Jefe de operacion</option>
                              <option value="Jefe de workforce">Jefe de workforce</option>
                              <option value="Jefe Financiero">Jefe Financiero</option>
                              <option value="Jefe Juridica">Jefe Juridica</option>
                              <option value="Legalizador">Legalizador</option>
                              <option value="Maestro De Obra">Maestro De Obra</option>
                              <option value="Profesional De SST">Profesional De SST</option>
                              <option value="Psicologo De Seleccion">Psicologo De Seleccion</option>
                              <option value="Recepcionista">Recepcionista</option>
                              <option value="Subgerente De Operaciones">Subgerente De Operaciones</option>
                              <option value="Tecnico De Soporte">Tecnico De Soporte</option>
                              <option value="Staff">Staff</option>
                            </>
                          ) : formData.cliente === 'Claro' ? (
                            <>
                              <option value="Agente Call Center">Agente Call Center</option>
                              <option value="Agente Call Center Plus">Agente Call Center Plus</option>
                            </>
                          ) : formData.cliente === 'Obamacare' ? (
                            <>
                              <option value="Customer Service">Customer Service</option>
                              <option value="Agente Call Center">Agente Call Center</option>
                            </>
                          ) : formData.cliente === 'Majority' ? (
                            <option value="Agente Call Center">Agente Call Center</option>
                          ) : null}
                        </>
                      ) : null}
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
                      type="datetime-local"
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
  )
}