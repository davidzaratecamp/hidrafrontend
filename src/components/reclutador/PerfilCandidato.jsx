import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, 
  GraduationCap, Heart, Shield, Star, Award, FileText, Download, Clock, Save, Users, Edit3
} from 'lucide-react'
import jsPDF from 'jspdf'
import ApiService from '../../services/api'
import Sidebar from './Sidebar'
import SidebarSeleccion from '../seleccion/SidebarSeleccion'
import { useAuth } from '../../context/AuthContext'

export default function PerfilCandidato() {
  const { candidatoId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // Detectar si estamos en el módulo de selección
  const isSeleccionModule = location.pathname.includes('/seleccion/')
  
  // Componente sidebar apropiado
  const SidebarComponent = isSeleccionModule ? SidebarSeleccion : Sidebar
  const [candidato, setCandidato] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fechaEntrevista, setFechaEntrevista] = useState('')
  const [editandoFecha, setEditandoFecha] = useState(false)
  const [guardandoFecha, setGuardandoFecha] = useState(false)
  
  // Estados para edición de operación y oleada (solo para psicólogos)
  const [editandoOperacion, setEditandoOperacion] = useState(false)
  const [nuevaOperacion, setNuevaOperacion] = useState('')
  const [nuevaCampana, setNuevaCampana] = useState('')
  const [oleadas, setOleadas] = useState([])
  const [nuevaOleada, setNuevaOleada] = useState('')
  const [guardandoOperacion, setGuardandoOperacion] = useState(false)

  useEffect(() => {
    cargarPerfil()
  }, [candidatoId])

  const cargarPerfil = async () => {
    try {
      const response = await ApiService.getPerfilCompleto(candidatoId)
      setCandidato(response.candidato)
      setFechaEntrevista(response.candidato.fecha_citacion_entrevista || '')
    } catch (error) {
      console.error('Error cargando perfil:', error)
      alert('Error al cargar el perfil del candidato')
    } finally {
      setLoading(false)
    }
  }

  const generarPDF = () => {
    const doc = new jsPDF()
    
    // Configuración
    const margin = 20
    let yPosition = margin
    const lineHeight = 7
    const sectionSpacing = 10
    
    // Header
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('PERFIL DEL CANDIDATO', margin, yPosition)
    doc.setFontSize(14)
    doc.setFont(undefined, 'normal')
    doc.text('ASISTE ING', margin, yPosition + 8)
    yPosition += 25
    
    // Información básica
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('INFORMACIÓN BÁSICA', margin, yPosition)
    yPosition += lineHeight + 3
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Nombre: ${candidato.primer_nombre} ${candidato.primer_apellido}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Email: ${candidato.email_personal}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Teléfono: ${candidato.numero_celular}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Documento: ${candidato.tipo_documento} ${candidato.numero_documento}`, margin, yPosition)
    yPosition += lineHeight
    if (candidato.nacionalidad) {
      doc.text(`Nacionalidad: ${candidato.nacionalidad}`, margin, yPosition)
      yPosition += lineHeight
    }
    if (candidato.fecha_nacimiento) {
      doc.text(`Fecha de nacimiento: ${new Date(candidato.fecha_nacimiento).toLocaleDateString()}`, margin, yPosition)
      yPosition += lineHeight
    }
    if (candidato.estado_civil) {
      doc.text(`Estado civil: ${candidato.estado_civil}`, margin, yPosition)
      yPosition += lineHeight
    }
    if (candidato.genero) {
      doc.text(`Género: ${candidato.genero}`, margin, yPosition)
      yPosition += lineHeight
    }
    yPosition += sectionSpacing
    
    // Información médica
    if (candidato.grupo_sanguineo || candidato.eps || candidato.afp) {
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('INFORMACIÓN MÉDICA', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      if (candidato.grupo_sanguineo) {
        doc.text(`Grupo sanguíneo: ${candidato.grupo_sanguineo}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.eps) {
        doc.text(`EPS: ${candidato.eps}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.afp) {
        doc.text(`AFP: ${candidato.afp}`, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += sectionSpacing
    }
    
    // Contacto de emergencia
    if (candidato.nombre_emergencia || candidato.numero_emergencia) {
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('CONTACTO DE EMERGENCIA', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      if (candidato.nombre_emergencia) {
        doc.text(`Nombre: ${candidato.nombre_emergencia}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.numero_emergencia) {
        doc.text(`Teléfono: ${candidato.numero_emergencia}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.parentesco_emergencia) {
        doc.text(`Parentesco: ${candidato.parentesco_emergencia}`, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += sectionSpacing
    }
    
    // Información del cargo
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('INFORMACIÓN DEL CARGO', margin, yPosition)
    yPosition += lineHeight + 3
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text(`Cliente: ${candidato.cliente}`, margin, yPosition)
    yPosition += lineHeight
    doc.text(`Cargo: ${candidato.cargo}`, margin, yPosition)
    yPosition += lineHeight
    if (candidato.ciudad) {
      doc.text(`Ciudad: ${candidato.ciudad}`, margin, yPosition)
      yPosition += lineHeight
    }
    yPosition += sectionSpacing
    
    // Educación
    if (candidato.nivel_estudios || candidato.titulo_obtenido) {
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('EDUCACIÓN', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      if (candidato.nivel_estudios) {
        doc.text(`Nivel: ${candidato.nivel_estudios}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.titulo_obtenido) {
        doc.text(`Título: ${candidato.titulo_obtenido}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.nombre_institucion) {
        doc.text(`Institución: ${candidato.nombre_institucion}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.ano_finalizacion) {
        doc.text(`Año finalización: ${candidato.ano_finalizacion}`, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += sectionSpacing
    }
    
    // Experiencia laboral
    if (candidato.nombre_empresa || candidato.cargo_desempenado) {
      if (yPosition > 250) { // Nueva página si no hay espacio
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('EXPERIENCIA LABORAL', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      if (candidato.nombre_empresa) {
        doc.text(`Empresa: ${candidato.nombre_empresa}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.cargo_desempenado) {
        doc.text(`Cargo: ${candidato.cargo_desempenado}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.salario_experiencia) {
        doc.text(`Salario: $${Number(candidato.salario_experiencia).toLocaleString()}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.fecha_inicio_experiencia) {
        doc.text(`Fecha inicio: ${new Date(candidato.fecha_inicio_experiencia).toLocaleDateString()}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.fecha_retiro_experiencia) {
        doc.text(`Fecha retiro: ${new Date(candidato.fecha_retiro_experiencia).toLocaleDateString()}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.tiempo_laborado_anos || candidato.tiempo_laborado_meses) {
        doc.text(`Tiempo laborado: ${candidato.tiempo_laborado_anos || 0} años, ${candidato.tiempo_laborado_meses || 0} meses`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.motivo_retiro) {
        doc.text(`Motivo de retiro: ${candidato.motivo_retiro}`, margin, yPosition, { maxWidth: 170 })
        yPosition += lineHeight * 2 // Doble espacio para texto largo
      }
      if (candidato.experiencia_comercial_certificada) {
        doc.text(`Experiencia comercial certificada: ${candidato.experiencia_comercial_certificada}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.experiencia_comercial_no_certificada) {
        doc.text(`Experiencia comercial no certificada: ${candidato.experiencia_comercial_no_certificada}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.primer_empleo_formal) {
        doc.text(`Primer empleo formal: ${candidato.primer_empleo_formal}`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.ha_trabajado_asiste) {
        doc.text(`Ha trabajado en Asiste Ing: ${candidato.ha_trabajado_asiste}`, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += sectionSpacing
    }
    
    // Perfil Personal y Aptitudes
    if (candidato.fortalezas || candidato.aspectos_mejorar || candidato.competencias_laborales) {
      if (yPosition > 220) { // Nueva página si no hay espacio
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('PERFIL PERSONAL Y APTITUDES', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      
      if (candidato.fortalezas) {
        doc.setFont(undefined, 'bold')
        doc.text('Fortalezas:', margin, yPosition)
        yPosition += lineHeight
        doc.setFont(undefined, 'normal')
        const fortalezasLines = doc.splitTextToSize(candidato.fortalezas, 170)
        doc.text(fortalezasLines, margin, yPosition)
        yPosition += (fortalezasLines.length * lineHeight) + 3
      }
      
      if (candidato.aspectos_mejorar) {
        doc.setFont(undefined, 'bold')
        doc.text('Aspectos a Mejorar:', margin, yPosition)
        yPosition += lineHeight
        doc.setFont(undefined, 'normal')
        const aspectosLines = doc.splitTextToSize(candidato.aspectos_mejorar, 170)
        doc.text(aspectosLines, margin, yPosition)
        yPosition += (aspectosLines.length * lineHeight) + 3
      }
      
      if (candidato.competencias_laborales) {
        doc.setFont(undefined, 'bold')
        doc.text('Competencias Laborales:', margin, yPosition)
        yPosition += lineHeight
        doc.setFont(undefined, 'normal')
        const competenciasLines = doc.splitTextToSize(candidato.competencias_laborales, 170)
        doc.text(competenciasLines, margin, yPosition)
        yPosition += (competenciasLines.length * lineHeight) + 3
      }
      
      yPosition += sectionSpacing
    }
    
    // Conocimientos informáticos
    if (candidato.conocimiento_excel || candidato.conocimiento_powerpoint || candidato.conocimiento_word) {
      if (yPosition > 250) { // Nueva página si no hay espacio
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('CONOCIMIENTOS INFORMÁTICOS', margin, yPosition)
      yPosition += lineHeight + 3
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      if (candidato.conocimiento_excel) {
        doc.text(`Excel: ${candidato.conocimiento_excel}/5`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.conocimiento_powerpoint) {
        doc.text(`PowerPoint: ${candidato.conocimiento_powerpoint}/5`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.conocimiento_word) {
        doc.text(`Word: ${candidato.conocimiento_word}/5`, margin, yPosition)
        yPosition += lineHeight
      }
      if (candidato.autoevaluacion) {
        doc.text(`Autoevaluación General: ${candidato.autoevaluacion}/5`, margin, yPosition)
        yPosition += lineHeight
      }
    }
    
    // Guardar el PDF
    const fileName = `perfil_${candidato.primer_nombre}_${candidato.primer_apellido}.pdf`
    doc.save(fileName)
  }

  const actualizarFechaEntrevista = async () => {
    try {
      setGuardandoFecha(true)
      await ApiService.actualizarFechaEntrevista(candidatoId, fechaEntrevista)
      
      // Actualizar el estado local del candidato
      setCandidato(prev => ({
        ...prev,
        fecha_citacion_entrevista: fechaEntrevista
      }))
      
      setEditandoFecha(false)
      alert('Fecha de entrevista actualizada exitosamente')
    } catch (error) {
      console.error('Error actualizando fecha:', error)
      alert('Error al actualizar la fecha de entrevista')
    } finally {
      setGuardandoFecha(false)
    }
  }

  const cancelarEdicionFecha = () => {
    setFechaEntrevista(candidato.fecha_citacion_entrevista || '')
    setEditandoFecha(false)
  }

  // Funciones para psicólogos - gestión de operación y oleada
  const cargarOleadas = async () => {
    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/seleccion/oleadas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOleadas(data.oleadas)
      }
    } catch (error) {
      console.error('Error cargando oleadas:', error)
    }
  }

  const iniciarEdicionOperacion = () => {
    setNuevaOperacion(candidato.cliente || '')
    setNuevaCampana(candidato.cargo || '')
    setEditandoOperacion(true)
    cargarOleadas()
  }

  const actualizarOperacionCampana = async () => {
    if (!nuevaOperacion || !nuevaCampana) {
      alert('Operación y campaña son requeridas')
      return
    }

    try {
      setGuardandoOperacion(true)
      const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/seleccion/candidatos/${candidatoId}/operacion-campana`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cliente: nuevaOperacion,
          cargo: nuevaCampana
        })
      })

      if (response.ok) {
        setCandidato(prev => ({
          ...prev,
          cliente: nuevaOperacion,
          cargo: nuevaCampana
        }))
        setEditandoOperacion(false)
        alert('Operación y campaña actualizadas correctamente')
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error actualizando operación:', error)
      alert('Error al actualizar operación')
    } finally {
      setGuardandoOperacion(false)
    }
  }

  const asignarOleada = async () => {
    if (!nuevaOleada) {
      alert('Selecciona una oleada')
      return
    }

    try {
      const API_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'http://200.91.204.54'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/api/seleccion/candidatos/${candidatoId}/oleada`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oleadaId: nuevaOleada })
      })

      if (response.ok) {
        // Recargar perfil para obtener información actualizada de oleada
        cargarPerfil()
        alert('Candidato asignado a oleada correctamente')
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error asignando oleada:', error)
      alert('Error al asignar oleada')
    }
  }

  const cancelarEdicionOperacion = () => {
    setEditandoOperacion(false)
    setNuevaOperacion('')
    setNuevaCampana('')
    setNuevaOleada('')
  }

  const getCargosDisponibles = () => {
    if (!nuevaOperacion) return []
    
    const cargosPorOperacion = {
      'Staff Operacional': [
        'Analista Administrativa Y Contable', 'Analista De Calidad', 'Analista De Calidad Pe',
        'Analista De Contratacion', 'Analista De Reclutamiento', 'Analista De Seleccion',
        'Analista De Usuarios', 'Analista PQR', 'Auditor/Gestor Calidad Comercial',
        'Auxiliar De Gestion Humana', 'Auxiliar De Servicios Generales', 'Auxiliar Juridico',
        'Auxiliar Mantenimiento', 'Auxiliar SST', 'Ayudante De Obra', 'Backoffice',
        'Backoffice Pe', 'Community Manager', 'Contador', 'Coordinador',
        'Coordinador BackOffice', 'Coordinador Datamarshall', 'Coordinador De Contratacion',
        'Coordinador De Nomina', 'Coordinador De Tecnologia', 'Coordinador De Usuarios',
        'Coordinador Pe', 'Coordinador Tecnico', 'Coordinadora Backoffice',
        'Coordinadora De Calidad', 'Datamarshall', 'Datamarshall Senior Pe',
        'Desarrollador Web', 'Director de formación', 'Director de Operaciones',
        'Director de Operaciones Pe', 'Director De Tecnologia', 'Diseñador Grafico',
        'Formador', 'Formador Pe', 'Formador Senior', 'Gestora De Marketing Y Calidad De Se',
        'GTR', 'Jefe Backoffice', 'Jefe De Manteniminento', 'Jefe de operacion',
        'Jefe de workforce', 'Jefe Financiero', 'Jefe Juridica', 'Legalizador',
        'Maestro De Obra', 'Profesional De SST', 'Psicologo De Seleccion',
        'Recepcionista', 'Subgerente De Operaciones', 'Tecnico De Soporte', 'Staff'
      ],
      'Staff Administrativo': [
        'Analista Administrativa Y Contable', 'Analista De Calidad', 'Analista De Calidad Pe',
        'Analista De Contratacion', 'Analista De Reclutamiento', 'Analista De Seleccion',
        'Analista De Usuarios', 'Analista PQR', 'Auditor/Gestor Calidad Comercial',
        'Auxiliar De Gestion Humana', 'Auxiliar De Servicios Generales', 'Auxiliar Juridico',
        'Auxiliar Mantenimiento', 'Auxiliar SST', 'Ayudante De Obra', 'Backoffice',
        'Backoffice Pe', 'Community Manager', 'Contador', 'Coordinador',
        'Coordinador BackOffice', 'Coordinador Datamarshall', 'Coordinador De Contratacion',
        'Coordinador De Nomina', 'Coordinador De Tecnologia', 'Coordinador De Usuarios',
        'Coordinador Pe', 'Coordinador Tecnico', 'Coordinadora Backoffice',
        'Coordinadora De Calidad', 'Datamarshall', 'Datamarshall Senior Pe',
        'Desarrollador Web', 'Director de formación', 'Director de Operaciones',
        'Director de Operaciones Pe', 'Director De Tecnologia', 'Diseñador Grafico',
        'Formador', 'Formador Pe', 'Formador Senior', 'Gestora De Marketing Y Calidad De Se',
        'GTR', 'Jefe Backoffice', 'Jefe De Manteniminento', 'Jefe de operacion',
        'Jefe de workforce', 'Jefe Financiero', 'Jefe Juridica', 'Legalizador',
        'Maestro De Obra', 'Profesional De SST', 'Psicologo De Seleccion',
        'Recepcionista', 'Subgerente De Operaciones', 'Tecnico De Soporte', 'Staff'
      ],
      'Claro': ['Agente Call Center', 'Agente Call Center Plus'],
      'Obamacare': ['Customer Service', 'Agente Call Center'],
      'Majority': ['Agente Call Center']
    }
    
    return cargosPorOperacion[nuevaOperacion] || []
  }

  const getOleadasDisponibles = () => {
    if (!nuevaOperacion || !nuevaCampana) return []
    
    return oleadas.filter(oleada => 
      oleada.operacion === nuevaOperacion && oleada.campana === nuevaCampana
    )
  }

  const cambiarEstado = async (nuevoEstado, mensaje) => {
    if (!confirm(mensaje)) {
      return;
    }
    
    try {
      console.log('Cambiando estado a:', nuevoEstado);
      await ApiService.cambiarEstadoCandidato(candidatoId, nuevoEstado);
      
      // Actualizar el estado local
      setCandidato(prev => ({
        ...prev,
        estado: nuevoEstado
      }));
      
      alert(`Candidato marcado como "${getEstadoLabel(nuevoEstado)}" exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    }
  }

  const marcarCitado = () => {
    cambiarEstado('citado', '¿Está seguro de marcar este candidato como "Citado"?');
  }

  const getEstadoLabel = (estado) => {
    const labels = {
      'nuevo': 'Nuevo',
      'contacto_exitoso': 'Contacto Exitoso',
      'formularios_enviados': 'Formularios Enviados',
      'formularios_completados': 'Formularios Completados',
      'citado': 'Citado',
      'no_asistio': 'No Asistió',
      'entrevistado': 'Entrevistado',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'contratado': 'Contratado'
    };
    return labels[estado] || estado;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarComponent />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!candidato) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarComponent />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Error: No se pudo cargar el perfil del candidato</p>
          </div>
        </div>
      </div>
    )
  }

  const estadosConfig = {
    nuevo: { label: 'Nuevo', color: 'bg-gray-100 text-gray-800' },
    contacto_exitoso: { label: 'Contacto Exitoso', color: 'bg-green-100 text-green-800' },
    formularios_enviados: { label: 'Formularios Enviados', color: 'bg-blue-100 text-blue-800' },
    formularios_completados: { label: 'Formularios Completados', color: 'bg-green-100 text-green-800' },
    citado: { label: 'Citado', color: 'bg-yellow-100 text-yellow-800' },
    entrevistado: { label: 'Entrevistado', color: 'bg-purple-100 text-purple-800' },
    aprobado: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-800' },
    rechazado: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    contratado: { label: 'Contratado', color: 'bg-indigo-100 text-indigo-800' }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarComponent />
      
      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-6 pt-20 lg:pt-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(isSeleccionModule ? '/hydra/seleccion/candidatos' : '/hydra/reclutador/candidatos')}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a candidatos
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidato.primer_nombre} {candidato.primer_apellido}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600">{candidato.cargo} - {candidato.cliente}</p>
                  {user?.rol === 'seleccion' && (
                    <button
                      onClick={iniciarEdicionOperacion}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar operación y campaña"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={generarPDF}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </button>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadosConfig[candidato.estado]?.color || 'bg-gray-100 text-gray-800'}`}>
                {estadosConfig[candidato.estado]?.label || candidato.estado}
              </span>
              <div className="text-sm text-gray-600">
                Progreso: {candidato.progreso_formularios}/6 formularios
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Básica */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Información Básica
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidato.email_personal}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidato.numero_celular}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidato.tipo_documento} {candidato.numero_documento}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{candidato.nacionalidad}</span>
                  </div>
                  {candidato.fecha_nacimiento && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(candidato.fecha_nacimiento).toLocaleDateString()}</span>
                    </div>
                  )}
                  {candidato.genero && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{candidato.genero}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información Médica */}
              {(candidato.grupo_sanguineo || candidato.eps || candidato.afp) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Información Médica
                  </h3>
                  <div className="space-y-3 text-sm">
                    {candidato.grupo_sanguineo && (
                      <div><strong>Grupo sanguíneo:</strong> {candidato.grupo_sanguineo}</div>
                    )}
                    {candidato.eps && (
                      <div><strong>EPS:</strong> {candidato.eps}</div>
                    )}
                    {candidato.afp && (
                      <div><strong>AFP:</strong> {candidato.afp}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Contacto de Emergencia */}
              {(candidato.nombre_emergencia || candidato.numero_emergencia) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-orange-600" />
                    Contacto de Emergencia
                  </h3>
                  <div className="space-y-3 text-sm">
                    {candidato.nombre_emergencia && (
                      <div><strong>Nombre:</strong> {candidato.nombre_emergencia}</div>
                    )}
                    {candidato.numero_emergencia && (
                      <div><strong>Teléfono:</strong> {candidato.numero_emergencia}</div>
                    )}
                    {candidato.parentesco_emergencia && (
                      <div><strong>Parentesco:</strong> {candidato.parentesco_emergencia}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Información Detallada */}
            <div className="lg:col-span-2 space-y-6">
              {/* Educación */}
              {(candidato.nivel_estudios || candidato.titulo_obtenido) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                    Educación
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {candidato.nivel_estudios && (
                      <div><strong>Nivel:</strong> {candidato.nivel_estudios}</div>
                    )}
                    {candidato.titulo_obtenido && (
                      <div><strong>Título:</strong> {candidato.titulo_obtenido}</div>
                    )}
                    {candidato.nombre_institucion && (
                      <div><strong>Institución:</strong> {candidato.nombre_institucion}</div>
                    )}
                    {candidato.ano_finalizacion && (
                      <div><strong>Año finalización:</strong> {candidato.ano_finalizacion}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Experiencia Laboral */}
              {(candidato.nombre_empresa || candidato.cargo_desempenado) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                    Experiencia Laboral
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {candidato.nombre_empresa && (
                      <div><strong>Empresa:</strong> {candidato.nombre_empresa}</div>
                    )}
                    {candidato.cargo_desempenado && (
                      <div><strong>Cargo:</strong> {candidato.cargo_desempenado}</div>
                    )}
                    {candidato.salario_experiencia && (
                      <div><strong>Salario:</strong> ${Number(candidato.salario_experiencia).toLocaleString()}</div>
                    )}
                    {candidato.fecha_inicio_experiencia && (
                      <div><strong>Fecha inicio:</strong> {new Date(candidato.fecha_inicio_experiencia).toLocaleDateString()}</div>
                    )}
                    {candidato.fecha_retiro_experiencia && (
                      <div><strong>Fecha retiro:</strong> {new Date(candidato.fecha_retiro_experiencia).toLocaleDateString()}</div>
                    )}
                    {(candidato.tiempo_laborado_anos || candidato.tiempo_laborado_meses) && (
                      <div><strong>Tiempo laborado:</strong> {candidato.tiempo_laborado_anos} años, {candidato.tiempo_laborado_meses} meses</div>
                    )}
                  </div>
                  {candidato.motivo_retiro && (
                    <div className="mt-4 text-sm">
                      <strong>Motivo de retiro:</strong>
                      <p className="mt-1 text-gray-600">{candidato.motivo_retiro}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Información Personal */}
              {(candidato.fortalezas || candidato.aspectos_mejorar || candidato.competencias_laborales) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-emerald-600" />
                    Perfil Personal
                  </h3>
                  <div className="space-y-4 text-sm">
                    {candidato.fortalezas && (
                      <div>
                        <strong>Fortalezas:</strong>
                        <p className="mt-1 text-gray-600">{candidato.fortalezas}</p>
                      </div>
                    )}
                    {candidato.aspectos_mejorar && (
                      <div>
                        <strong>Aspectos a mejorar:</strong>
                        <p className="mt-1 text-gray-600">{candidato.aspectos_mejorar}</p>
                      </div>
                    )}
                    {candidato.competencias_laborales && (
                      <div>
                        <strong>Competencias laborales:</strong>
                        <p className="mt-1 text-gray-600">{candidato.competencias_laborales}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conocimientos Informáticos */}
              {(candidato.conocimiento_excel || candidato.conocimiento_powerpoint || candidato.conocimiento_word) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Conocimientos Informáticos
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {candidato.conocimiento_excel && (
                      <div><strong>Excel:</strong> {candidato.conocimiento_excel}/5</div>
                    )}
                    {candidato.conocimiento_powerpoint && (
                      <div><strong>PowerPoint:</strong> {candidato.conocimiento_powerpoint}/5</div>
                    )}
                    {candidato.conocimiento_word && (
                      <div><strong>Word:</strong> {candidato.conocimiento_word}/5</div>
                    )}
                    {candidato.autoevaluacion && (
                      <div><strong>Autoevaluación:</strong> {candidato.autoevaluacion}/5</div>
                    )}
                  </div>
                </div>
              )}

              {/* Gestión de Entrevista */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Gestión de Entrevista
                </h3>
                
                <div className="space-y-4">
                  {editandoFecha ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha y Hora de Entrevista
                        </label>
                        <input
                          type="datetime-local"
                          value={fechaEntrevista}
                          onChange={(e) => setFechaEntrevista(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={actualizarFechaEntrevista}
                          disabled={guardandoFecha}
                          className="flex items-center px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                          {guardandoFecha ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              Guardar
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelarEdicionFecha}
                          disabled={guardandoFecha}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {candidato.fecha_citacion_entrevista ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Date(candidato.fecha_citacion_entrevista).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            No hay fecha de entrevista programada
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditandoFecha(true)}
                          className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {candidato.fecha_citacion_entrevista ? 'Editar' : 'Programar'}
                        </button>
                        
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gestión del Proceso */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Gestión del Proceso
                </h3>
                
                <div className="space-y-4">
                  {/* Estado actual */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Estado actual:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      candidato.estado === 'formularios_completados' ? 'bg-green-100 text-green-800' :
                      candidato.estado === 'citado' ? 'bg-purple-100 text-purple-800' :
                      candidato.estado === 'entrevistado' ? 'bg-indigo-100 text-indigo-800' :
                      candidato.estado === 'no_asistio' ? 'bg-orange-100 text-orange-800' :
                      candidato.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-800' :
                      candidato.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getEstadoLabel(candidato.estado)}
                    </span>
                  </div>

                  {/* Botones de acción según el estado */}
                  {/* DEBUG: candidato.estado = */}{candidato.estado}{/* END DEBUG */}
                  <div className="flex flex-wrap gap-2">
                    {candidato.estado === 'nuevo' && (
                      <button
                        onClick={marcarCitado}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Marcar como Citado
                      </button>
                    )}

                    {candidato.estado === 'contacto_exitoso' && (
                      <button
                        onClick={marcarCitado}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Marcar como Citado
                      </button>
                    )}

                    {candidato.estado === 'formularios_completados' && (
                      <button
                        onClick={marcarCitado}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Marcar como Citado
                      </button>
                    )}
                    
                    {candidato.estado === 'citado' && (
                      <div className="text-sm text-gray-600 italic p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                          <span>Candidato citado. La gestión de asistencia y entrevistas corresponde al área de Selección.</span>
                        </div>
                      </div>
                    )}
                    
                    {candidato.estado === 'entrevistado' && (
                      <div className="text-sm text-gray-600 italic p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          <span>Candidato entrevistado. La aprobación/rechazo corresponde al área de Selección.</span>
                        </div>
                      </div>
                    )}
                    
                    {(candidato.estado === 'no_asistio' || candidato.estado === 'aprobado' || candidato.estado === 'rechazado') && (
                      <div className="text-sm text-gray-600 italic p-2 bg-gray-50 rounded">
                        No hay más acciones disponibles para este estado.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estado de Formularios */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-600" />
                  Estado de Formularios
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className={`flex items-center ${candidato.formulario_hoja_vida_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_hoja_vida_completado ? '✅' : '⏸️'} Hoja de Vida
                  </div>
                  <div className={`flex items-center ${candidato.formulario_datos_basicos_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_datos_basicos_completado ? '✅' : '⏸️'} Datos Básicos
                  </div>
                  <div className={`flex items-center ${candidato.formulario_estudios_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_estudios_completado ? '✅' : '⏸️'} Estudios
                  </div>
                  <div className={`flex items-center ${candidato.formulario_experiencia_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_experiencia_completado ? '✅' : '⏸️'} Experiencia
                  </div>
                  <div className={`flex items-center ${candidato.formulario_personal_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_personal_completado ? '✅' : '⏸️'} Personal
                  </div>
                  <div className={`flex items-center ${candidato.formulario_consentimiento_completado ? 'text-green-600' : 'text-gray-400'}`}>
                    {candidato.formulario_consentimiento_completado ? '✅' : '⏸️'} Consentimiento
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de operación y oleada para psicólogos */}
      {editandoOperacion && user?.rol === 'seleccion' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Editar Operación y Campaña
              </h3>
              
              <div className="space-y-4">
                {/* Operación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operación
                  </label>
                  <select
                    value={nuevaOperacion}
                    onChange={(e) => {
                      setNuevaOperacion(e.target.value)
                      setNuevaCampana('') // Reset campaña cuando cambia operación
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona operación</option>
                    <option value="Staff Operacional">Staff Operacional</option>
                    <option value="Staff Administrativo">Staff Administrativo</option>
                    <option value="Claro">Claro</option>
                    <option value="Obamacare">Obamacare</option>
                    <option value="Majority">Majority</option>
                  </select>
                </div>

                {/* Campaña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaña
                  </label>
                  <select
                    value={nuevaCampana}
                    onChange={(e) => setNuevaCampana(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={!nuevaOperacion}
                  >
                    <option value="">Selecciona campaña</option>
                    {getCargosDisponibles().map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>

                {/* Oleada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oleada
                  </label>
                  <select
                    value={nuevaOleada}
                    onChange={(e) => setNuevaOleada(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={!nuevaOperacion || !nuevaCampana}
                  >
                    <option value="">Selecciona oleada</option>
                    {getOleadasDisponibles().map(oleada => (
                      <option key={oleada.id} value={oleada.id}>
                        Oleada {oleada.numero_oleada} - {oleada.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={actualizarOperacionCampana}
                  disabled={!nuevaOperacion || !nuevaCampana || guardandoOperacion}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {guardandoOperacion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Operación
                    </>
                  )}
                </button>
              </div>

              {nuevaOleada && (
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={asignarOleada}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Asignar a Oleada
                  </button>
                </div>
              )}

              <button
                onClick={cancelarEdicionOperacion}
                className="w-full mt-3 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}