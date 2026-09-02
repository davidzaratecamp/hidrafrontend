import { useState } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error, ModalDocumento, Vacio } from '../ui'
import api from '../../services/api'
import { useRecurso } from '../../hooks/useRecurso'
import { abrirBlob } from '../../utils/descargar'

/**
 * Desprendibles de nómina del usuario en sesión.
 *
 * La cédula sale del token en el backend, nunca de la petición: nadie puede
 * pedir los desprendibles de otra persona.
 */
export default function Desprendibles() {
  const [descargando, setDescargando] = useState(null)
  const [errorDescarga, setErrorDescarga] = useState(null)
  const [previsualizando, setPrevisualizando] = useState(null)

  const { datos: meses, cargando, error: errorCarga } = useRecurso(
    async () => normalizar(await api.get('/desprendibles/meses')),
    [],
    { inicial: [] }
  )

  async function descargar(anio, mes) {
    setDescargando(`${anio}-${mes}`)
    setErrorDescarga(null)
    try {
      abrirBlob(await api.get(`/desprendibles/${anio}/${mes}.pdf`))
    } catch (e) {
      setErrorDescarga(e.message)
    } finally {
      setDescargando(null)
    }
  }

  return (
    <Layout titulo="Desprendibles de nómina" descripcion="Tus comprobantes de pago">
      <Error mensaje={errorCarga ?? errorDescarga} />

      {cargando ? (
        <Cargando />
      ) : (meses ?? []).length === 0 ? (
        <Vacio
          icono={FileText}
          mensaje="No hay desprendibles disponibles. Si crees que es un error, verifica con administración que tu cédula esté registrada."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {meses.map(({ anio, mes, etiqueta, disponible }) => (
            <div
              key={`${anio}-${mes}`}
              className={`flex flex-col gap-4 rounded-xl border bg-white p-5 ${
                disponible ? 'border-gray-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`rounded-xl p-3 ${
                    disponible ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </div>
                {!disponible && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                    No disponible
                  </span>
                )}
              </div>

              <p className={`text-sm font-medium ${disponible ? 'text-gray-900' : 'text-gray-400'}`}>
                {etiqueta}
              </p>

              <div className="mt-auto flex gap-2">
                <Boton
                  variante="secundario"
                  className="!py-1.5 flex-1"
                  disabled={!disponible}
                  onClick={() => setPrevisualizando({ anio, mes, etiqueta })}
                >
                  <Eye className="h-4 w-4" /> Ver
                </Boton>
                <Boton
                  variante="secundario"
                  className="!py-1.5 flex-1"
                  disabled={!disponible}
                  cargando={descargando === `${anio}-${mes}`}
                  onClick={() => descargar(anio, mes)}
                >
                  <Download className="h-4 w-4" /> Descargar
                </Boton>
              </div>
            </div>
          ))}
        </div>
      )}

      {previsualizando && (
        <ModalDocumento
          titulo={previsualizando.etiqueta}
          cargar={() => api.get(`/desprendibles/${previsualizando.anio}/${previsualizando.mes}.pdf`)}
          onCerrar={() => setPrevisualizando(null)}
        />
      )}
    </Layout>
  )
}

/**
 * La API de nómina es externa y su forma no está bajo nuestro control: se
 * aceptan varias variantes en vez de asumir una sola.
 *
 * `month` llega como nombre en español ("septiembre"), no como número 1-12 —
 * se pasa tal cual (nunca `Number(...)`), porque es lo que hay que reenviar
 * después al endpoint de descarga. La API ya manda una `label` armada
 * ("9. Septiembre 2026"); se usa directo en vez de reconstruirla.
 */
function normalizar(respuesta) {
  const lista = Array.isArray(respuesta) ? respuesta : (respuesta?.data ?? respuesta?.meses ?? [])
  return lista
    .map((item) => {
      const anio = item.anio ?? item.year ?? item.ano
      const mes = item.mes ?? item.month
      if (!anio || !mes) return null
      return {
        anio,
        mes,
        etiqueta: item.label ?? item.etiqueta ?? `${mes} ${anio}`,
        disponible: item.disponible ?? true,
      }
    })
    .filter(Boolean)
}
