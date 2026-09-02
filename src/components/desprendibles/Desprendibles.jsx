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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {meses.map(({ anio, mes, etiqueta, disponible }) => (
            <div
              key={`${anio}-${mes}`}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow ${
                disponible ? 'border-gray-200 hover:shadow-lg' : 'border-gray-100'
              }`}
            >
              <div
                className={`relative flex h-32 items-center justify-center ${
                  disponible
                    ? 'bg-gradient-to-br from-blue-50 to-blue-100/60'
                    : 'bg-gray-50'
                }`}
              >
                <FileText
                  className={`h-14 w-14 transition-transform ${
                    disponible ? 'text-blue-500 group-hover:scale-105' : 'text-gray-300'
                  }`}
                  strokeWidth={1.25}
                />
                {!disponible && (
                  <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-400 shadow-sm">
                    No disponible
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                  <p
                    className={`text-base font-semibold ${
                      disponible ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {etiqueta}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">Comprobante de pago</p>
                </div>

                <div className="mt-auto flex gap-2">
                  <Boton
                    variante="secundario"
                    className="flex-1"
                    disabled={!disponible}
                    onClick={() => setPrevisualizando({ anio, mes, etiqueta })}
                  >
                    <Eye className="h-4 w-4" /> Ver
                  </Boton>
                  <Boton
                    variante="secundario"
                    className="flex-1"
                    disabled={!disponible}
                    cargando={descargando === `${anio}-${mes}`}
                    onClick={() => descargar(anio, mes)}
                  >
                    <Download className="h-4 w-4" /> Descargar
                  </Boton>
                </div>
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
