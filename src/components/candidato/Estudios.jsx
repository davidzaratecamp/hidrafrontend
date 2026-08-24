import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import ApiService from '../../services/api'

// Excel: "FORMATO HOJA DE VIDA", bloque "INFORMACIÓN ACADEMICA" (filas 22-27) - son 4
// filas fijas, no un nivel único como antes. Bachillerato, Técnico/Tecnólogo y
// Profesional u Otros son opcionales pero completos si se llenan (institución + título
// + año, validado en el backend). Conocimientos Informáticos es distinto (2026-08-18,
// decisión del usuario): texto libre, sin institución/título/año.
const NIVEL_TEXTO_LIBRE = 'conocimientos_informaticos'
// Límites calculados contra el ancho REAL de cada celda de la tabla "INFORMACIÓN ACADEMICA" en
// hojavida.pdf (hojaVidaPdfService.js detecta esos bordes dinámicamente por escaneo de trazos
// vectoriales — ver getTableBorders/getRowColumnBorders en utils/pdfFillHelpers.js). El cálculo
// reutiliza la lógica real de ajuste de texto (fitSingleLine) con texto representativo en
// español, A TAMAÑO ESTÁNDAR (sin encoger la letra): es la cantidad máxima que esa celda puede
// mostrar sin truncarse. Institución/Título son una sola línea (drawFit, no drawTextBox) porque
// el espacio entre filas de la tabla es de ~19pt, insuficiente para envolver texto sin pisar la
// fila siguiente — igual que Conocimientos Informáticos (celda fusionada, mucho más ancha).
// Recalculados 2026-08-21 tras pasar la plantilla a Times New Roman.
const MAX_INSTITUCION = 40
const MAX_TITULO = 43
const MAX_DESCRIPCION = 112

const NIVELES = [
  { value: 'bachillerato', label: 'Bachillerato' },
  { value: 'tecnico_tecnologo', label: 'Técnico/Tecnólogo' },
  { value: 'profesional_u_otros', label: 'Profesional u Otros' },
  { value: NIVEL_TEXTO_LIBRE, label: 'Conocimientos Informáticos' }
]

const filaVacia = (nivel) => ({
  nivel_estudios: nivel, nombre_institucion: '', titulo_obtenido: '', ano_finalizacion: '', descripcion: ''
})

export default function Estudios() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [filas, setFilas] = useState(NIVELES.map((n) => filaVacia(n.value)))
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

      const estudiosGuardados = candidatoData.candidato.estudios || []
      setFilas(NIVELES.map((n) => {
        const guardado = estudiosGuardados.find((e) => e.nivel_estudios === n.value)
        return guardado
          ? {
              nivel_estudios: n.value,
              nombre_institucion: guardado.nombre_institucion || '',
              titulo_obtenido: guardado.titulo_obtenido || '',
              ano_finalizacion: guardado.ano_finalizacion || '',
              descripcion: guardado.descripcion || ''
            }
          : filaVacia(n.value)
      }))
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  const actualizarFila = (nivel, campo, valor) => {
    setFilas((prev) => prev.map((f) => f.nivel_estudios === nivel ? { ...f, [campo]: valor } : f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const filasConDatos = filas.filter((f) =>
      f.nombre_institucion || f.titulo_obtenido || f.ano_finalizacion || f.descripcion
    )

    if (filasConDatos.length === 0) {
      alert('Completa al menos un nivel de estudios')
      return
    }

    for (const f of filasConDatos) {
      const nivel = NIVELES.find((n) => n.value === f.nivel_estudios)?.label
      if (f.nivel_estudios === NIVEL_TEXTO_LIBRE) {
        if (!f.descripcion) {
          alert(`Completa la descripción de "${nivel}"`)
          return
        }
        if (f.descripcion.length > MAX_DESCRIPCION) {
          alert(`"${nivel}" no puede superar ${MAX_DESCRIPCION} caracteres`)
          return
        }
      } else if (!f.nombre_institucion || !f.titulo_obtenido || !f.ano_finalizacion) {
        alert(`Completa institución, título y año en "${nivel}" (o deja las 3 casillas vacías si no aplica)`)
        return
      }
    }

    try {
      setSaving(true)
      await ApiService.actualizarEstudios(token, { estudios: filasConDatos })
      navigate(`/candidato/experiencia/${token}`)
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
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 sm:p-8">
            <div className="flex items-center justify-between flex-col sm:flex-row text-center sm:text-left">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Información Académica</h1>
                <p className="text-purple-100 text-sm sm:text-base">Paso 3 de 6 - Formación educativa</p>
              </div>
              <GraduationCap className="h-8 w-8 sm:h-12 sm:w-12 text-purple-200" />
            </div>

            <div className="mt-6 bg-purple-700 bg-opacity-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span>Progreso del formulario</span>
                <span>{candidato.progreso_formularios}/6 completados</span>
              </div>
              <div className="w-full bg-purple-600 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(candidato.progreso_formularios / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
                  Información Académica
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Completa los niveles que apliquen. Deja en blanco los que no correspondan.
                </p>

                <div className="space-y-6">
                  {NIVELES.map((nivel) => {
                    const fila = filas.find((f) => f.nivel_estudios === nivel.value)
                    const esTextoLibre = nivel.value === NIVEL_TEXTO_LIBRE

                    return (
                      <div key={nivel.value} className="bg-white rounded-lg p-4 border border-purple-100">
                        <h3 className="font-semibold text-gray-800 mb-3">{nivel.label}</h3>

                        {esTextoLibre ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Describe tus conocimientos informáticos
                            </label>
                            <textarea
                              value={fila.descripcion}
                              onChange={(e) => actualizarFila(nivel.value, 'descripcion', e.target.value.slice(0, MAX_DESCRIPCION))}
                              className="input-field"
                              rows="3"
                              maxLength={MAX_DESCRIPCION}
                              placeholder="Ej: Manejo de Excel avanzado, Word, PowerPoint, herramientas de CRM..."
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              {fila.descripcion.length}/{MAX_DESCRIPCION} caracteres
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Institución
                              </label>
                              <input
                                type="text"
                                value={fila.nombre_institucion}
                                onChange={(e) => actualizarFila(nivel.value, 'nombre_institucion', e.target.value.slice(0, MAX_INSTITUCION))}
                                className="input-field"
                                maxLength={MAX_INSTITUCION}
                                placeholder="Nombre de la institución"
                              />
                              <p className="text-xs text-gray-500 mt-1 text-right">
                                {fila.nombre_institucion.length}/{MAX_INSTITUCION} caracteres
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título Obtenido
                              </label>
                              <input
                                type="text"
                                value={fila.titulo_obtenido}
                                onChange={(e) => actualizarFila(nivel.value, 'titulo_obtenido', e.target.value.slice(0, MAX_TITULO))}
                                className="input-field"
                                maxLength={MAX_TITULO}
                                placeholder="Título obtenido"
                              />
                              <p className="text-xs text-gray-500 mt-1 text-right">
                                {fila.titulo_obtenido.length}/{MAX_TITULO} caracteres
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Año de Finalización
                              </label>
                              <select
                                value={fila.ano_finalizacion}
                                onChange={(e) => actualizarFila(nivel.value, 'ano_finalizacion', e.target.value)}
                                className="input-field"
                              >
                                <option value="">Selecciona el año</option>
                                {catalogos.anios?.map((ano) => (
                                  <option key={ano} value={ano}>
                                    {ano}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(`/candidato/datos-basicos/${token}`)}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </button>

                <div className="text-sm text-gray-600">
                  {candidato.formulario_estudios_completado ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Este formulario ya fue completado
                    </span>
                  ) : (
                    'Completa al menos un nivel de estudios'
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
                      Siguiente: Experiencia
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
