import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, 
  GraduationCap, Heart, Shield, Star, Award, FileText, Download 
} from 'lucide-react'
import jsPDF from 'jspdf'
import ApiService from '../../services/api'
import Sidebar from './Sidebar'

export default function PerfilCandidato() {
  const { candidatoId } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPerfil()
  }, [candidatoId])

  const cargarPerfil = async () => {
    try {
      const response = await ApiService.getPerfilCompleto(candidatoId)
      setCandidato(response.candidato)
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
    yPosition += sectionSpacing
    
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
      if (candidato.tiempo_laborado_anos || candidato.tiempo_laborado_meses) {
        doc.text(`Tiempo laborado: ${candidato.tiempo_laborado_anos || 0} años, ${candidato.tiempo_laborado_meses || 0} meses`, margin, yPosition)
        yPosition += lineHeight
      }
      yPosition += sectionSpacing
    }
    
    // Conocimientos informáticos
    if (candidato.conocimiento_excel || candidato.conocimiento_powerpoint || candidato.conocimiento_word) {
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
    }
    
    // Guardar el PDF
    const fileName = `perfil_${candidato.primer_nombre}_${candidato.primer_apellido}.pdf`
    doc.save(fileName)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
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
        <Sidebar />
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
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/hydra/reclutador/candidatos')}
                className="btn-secondary flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a candidatos
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidato.primer_nombre} {candidato.primer_apellido}
                </h1>
                <p className="text-gray-600">{candidato.cargo} - {candidato.cliente}</p>
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
    </div>
  )
}