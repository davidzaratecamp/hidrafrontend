import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { UserPlus, Calendar, UserCheck, Phone, Mail, Save, ArrowLeft, User, Briefcase, MessageSquare, ClipboardCheck } from 'lucide-react'
import Sidebar from './Sidebar'
import SidebarSeleccion from '../seleccion/SidebarSeleccion'
import ApiService from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function NuevoCandidato() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  
  // Detectar si venimos del módulo de selección basado en el estado de navegación o parámetros URL
  const urlParams = new URLSearchParams(location.search)
  const isSeleccionModule = location.state?.from?.includes('/seleccion/') || urlParams.get('from') === 'seleccion'
  
  // Componente sidebar apropiado
  const SidebarComponent = isSeleccionModule ? SidebarSeleccion : Sidebar
  const [catalogos, setCatalogos] = useState({})
  const [formData, setFormData] = useState({
    // Datos principales
    tipo_documento: '',
    numero_documento: '',
    edad: '',
    nombre_completo: '',
    email_personal: '',
    numero_celular: '',

    // Contacto (primera gestión)
    contacto_llamada: '',
    contacto_whatsapp: '',

    // Datos del proceso
    cliente: '',
    cargo: '',
    fuente_reclutamiento: '',
    observaciones_generales: '',

    // Perfil y gestión (reemplaza a la tipificación "Observaciones de Llamada", 2026-08-26)
    perfil: '',
    citado_gestion: '',
    estado_gestion_reclutamiento: ''
  })

  useEffect(() => {
    cargarCatalogos()
  }, [])

  const cargarCatalogos = async () => {
    try {
      const data = await ApiService.getCatalogos()
      console.log('Catálogos cargados:', data)
      setCatalogos(data)
    } catch (error) {
      console.error('Error cargando catálogos:', error)
    }
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
      case 'Hogar':
      case 'Móvil':
      case 'TyT':
      case 'Pymes':
      case 'ACA':
      case 'Customer':
        return catalogos.cargos_campanas || []
      default:
        return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar campos requeridos (cédula y email ahora opcionales)
    const requiredFields = ['tipo_documento', 'nombre_completo',
                           'numero_celular', 'cliente', 'cargo', 'fuente_reclutamiento', 'citado_gestion']

    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor completa el campo: ${field.replace(/_/g, ' ')}`)
        return
      }
    }

    // Nombre completo debe tener al menos nombre y apellido
    if (formData.nombre_completo.trim().split(/\s+/).length < 2) {
      alert('Escribe el nombre completo del candidato (nombre y apellido, mínimo)')
      return
    }

    // Validar número de documento solo si se logró citar al candidato
    if (formData.citado_gestion === 'si' && !formData.numero_documento) {
      alert('El número de identificación es obligatorio cuando Citado es "Sí"')
      return
    }

    // Validar Estado Gestión Reclutamiento cuando no se logró citar
    if (formData.citado_gestion === 'no' && !formData.estado_gestion_reclutamiento) {
      alert('Selecciona un Estado Gestión Reclutamiento cuando Citado es "No"')
      return
    }

    try {
      setSaving(true)

      const dataToSend = { ...formData };

      const response = await ApiService.crearCandidato(dataToSend)
      alert(`Candidato creado exitosamente. Token: ${response.candidato.token_acceso}`)
      navigate(isSeleccionModule ? '/hydra/seleccion/candidatos' : '/hydra/reclutador/candidatos')
    } catch (error) {
      console.error('Error creando candidato:', error)
      alert(error.message || 'Error al crear el candidato. Verifica los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarComponent />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 max-w-4xl mx-auto">
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Nuevo Candidato</h1>
                <p className="text-sm lg:text-base text-gray-600">Registrar un nuevo candidato en el sistema de reclutamiento</p>
              </div>
              <button
                onClick={() => navigate(isSeleccionModule ? '/hydra/seleccion/candidatos' : '/hydra/reclutador/candidatos')}
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
              
              {/* Fecha y Analista (automáticos, solo lectura - 2026-08-26) */}
              <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha
                    </label>
                    <p className="input-field bg-gray-100 text-gray-700">
                      {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Analista
                    </label>
                    <p className="input-field bg-gray-100 text-gray-700">
                      {user?.nombre_completo || '—'}
                    </p>
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
                  {/* Campaña (campo interno: cliente) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaña *
                    </label>
                    <select
                      value={formData.cliente}
                      onChange={(e) => setFormData({...formData, cliente: e.target.value, cargo: ''})}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona campaña</option>
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
                          <option value="Obamacare">Obamacare</option>
                          <option value="Hogar">Hogar</option>
                          <option value="Móvil">Móvil</option>
                          <option value="TyT">TyT</option>
                          <option value="Pymes">Pymes</option>
                          <option value="ACA">ACA</option>
                          <option value="Customer">Customer</option>
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
                        {formData.cliente ? 'Selecciona cargo' : 'Primero selecciona una campaña'}
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
                          ) : ['Hogar', 'Móvil', 'TyT', 'Pymes', 'ACA', 'Customer'].includes(formData.cliente) ? (
                            <>
                              <option value="Agente">Agente</option>
                              <option value="Agente Plus">Agente Plus</option>
                              <option value="Analista De Calidad">Analista De Calidad</option>
                              <option value="Analista De Reclutamiento">Analista De Reclutamiento</option>
                              <option value="Analista De Seleccion">Analista De Seleccion</option>
                              <option value="Analista De Usuarios">Analista De Usuarios</option>
                              <option value="Analista PQR">Analista PQR</option>
                              <option value="BackOffice">BackOffice</option>
                              <option value="Community Manager">Community Manager</option>
                              <option value="Coordinador">Coordinador</option>
                              <option value="Coordinador BackOffice">Coordinador BackOffice</option>
                              <option value="Coordinador De Reclutamiento Y Selección">Coordinador De Reclutamiento Y Selección</option>
                              <option value="Coordinadora De Calidad">Coordinadora De Calidad</option>
                              <option value="Director de formación">Director de formación</option>
                              <option value="Formador">Formador</option>
                              <option value="Formador Senior">Formador Senior</option>
                              <option value="Jefe de operacion">Jefe de operacion</option>
                              <option value="Jefe De Reclutamiento Y Selección">Jefe De Reclutamiento Y Selección</option>
                              <option value="Legalizador">Legalizador</option>
                              <option value="Psicologo De Seleccion">Psicologo De Seleccion</option>
                              <option value="Team Leader">Team Leader</option>
                              <option value="Team Lider BackOffice">Team Lider BackOffice</option>
                              <option value="Team Lider Operaciones">Team Lider Operaciones</option>
                            </>
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
                          <option value="Computrabajo">Computrabajo</option>
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
                </div>
              </div>

              {/* Datos Principales del Candidato */}
              <div className="bg-blue-50 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-blue-600 flex-shrink-0" />
                  Datos Principales del Candidato
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nombre Completo */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                      required
                      className="input-field"
                      placeholder="Nombres y apellidos del candidato"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo nombre y apellido. El sistema separa nombre(s)/apellido(s) automáticamente.
                    </p>
                  </div>

                  {/* Tipo de Documento */}
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
                      <option value="">Selecciona tipo</option>
                      {catalogos.tipos_documento?.length > 0 ? (
                        catalogos.tipos_documento.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="CC">CC</option>
                          <option value="PPT">PPT</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Número de Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento
                      {formData.citado_gestion === 'si' && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => {
                        // Solo números
                        const value = e.target.value.replace(/\D/g, '')
                        setFormData({...formData, numero_documento: value})
                      }}
                      className={`input-field ${
                        formData.citado_gestion === 'si' && !formData.numero_documento
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                      placeholder="12345678"
                      pattern="[0-9]*"
                      required={formData.citado_gestion === 'si'}
                    />
                  </div>

                  {/* Edad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.edad}
                      onChange={(e) => setFormData({...formData, edad: e.target.value})}
                      className="input-field"
                      placeholder="25"
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

              {/* Contacto (primera gestión) */}
              <div className="bg-green-50 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-green-600 flex-shrink-0" />
                  Contacto
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contacto por Llamada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Se logró contactar por llamada?
                    </label>
                    <select
                      value={formData.contacto_llamada}
                      onChange={(e) => setFormData({...formData, contacto_llamada: e.target.value})}
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

                  {/* Contacto por WhatsApp */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Se logró contactar por WhatsApp?
                    </label>
                    <select
                      value={formData.contacto_whatsapp}
                      onChange={(e) => setFormData({...formData, contacto_whatsapp: e.target.value})}
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

              {/* Perfil y Gestión (reemplaza a "Observaciones de Llamada", 2026-08-26) */}
              <div className="bg-indigo-50 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClipboardCheck className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-indigo-600 flex-shrink-0" />
                  Perfil y Gestión
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Perfil */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perfil
                    </label>
                    <input
                      type="text"
                      value={formData.perfil}
                      onChange={(e) => setFormData({...formData, perfil: e.target.value})}
                      className="input-field"
                      placeholder="Perfil breve del candidato"
                    />
                  </div>

                  {/* Citado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Citado *
                    </label>
                    <select
                      value={formData.citado_gestion}
                      onChange={(e) => setFormData({
                        ...formData,
                        citado_gestion: e.target.value,
                        // Limpiar el motivo si se cambia a "Sí" - ya no aplica
                        estado_gestion_reclutamiento: e.target.value === 'si' ? '' : formData.estado_gestion_reclutamiento
                      })}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  {/* Estado Gestión Reclutamiento (solo si Citado = No) */}
                  {formData.citado_gestion === 'no' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado Gestión Reclutamiento *
                      </label>
                      <select
                        value={formData.estado_gestion_reclutamiento}
                        onChange={(e) => setFormData({...formData, estado_gestion_reclutamiento: e.target.value})}
                        required
                        className="input-field"
                      >
                        <option value="">Selecciona estado</option>
                        {catalogos.estado_gestion_reclutamiento?.length > 0 ? (
                          catalogos.estado_gestion_reclutamiento.map((item) => (
                            item.grupo ? (
                              <optgroup key={item.grupo} label={item.grupo}>
                                {item.opciones.map((op) => (
                                  <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                              </optgroup>
                            ) : (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            )
                          ))
                        ) : (
                          <>
                            <option value="#Errado">#Errado</option>
                            <option value="No Contesta / Msj Global-Wa">No Contesta / Msj Global-Wa</option>
                            <option value="Contesta / Cuelga / Mensaje Global-Wa">Contesta / Cuelga / Mensaje Global-Wa</option>
                            <optgroup label="NO APTO POR:">
                              <option value="No Apto / Estudiante">No Apto / Estudiante</option>
                              <option value="No Apto / No experiencia">No Apto / No experiencia</option>
                              <option value="No Apto / Ubicación">No Apto / Ubicación</option>
                              <option value="No Apto / Edad mayor a 35">No Apto / Edad mayor a 35</option>
                              <option value="No Apto / No certificado de bachiller">No Apto / No certificado de bachiller</option>
                              <option value="No Apto / Menor de edad">No Apto / Menor de edad</option>
                              <option value="No Apto / Disposición">No Apto / Disposición</option>
                              <option value="No Apto / Sobreperfilado">No Apto / Sobreperfilado</option>
                              <option value="No Apto / EPS">No Apto / EPS</option>
                            </optgroup>
                            <optgroup label="NO INTERESADOS POR:">
                              <option value="No interesado / Horarios">No interesado / Horarios</option>
                              <option value="No interesado / Ventas">No interesado / Ventas</option>
                              <option value="No interesado / Ubicación">No interesado / Ubicación</option>
                              <option value="No interesado / Capacitación">No interesado / Capacitación</option>
                              <option value="No interesado / Call Center">No interesado / Call Center</option>
                              <option value="No interesado / Ya trabaja">No interesado / Ya trabaja</option>
                              <option value="No interesado / No parqueadero">No interesado / No parqueadero</option>
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Observaciones
                </h3>

                <div>
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
                  <li>• Los cargos disponibles cambian según la campaña seleccionada</li>
                  <li>• El candidato recibirá un email con los formularios a completar</li>
                  <li>• El token de acceso tiene una validez de 30 días</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(isSeleccionModule ? '/hydra/seleccion/candidatos' : '/hydra/reclutador/candidatos')}
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