import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error, Vacio } from '../ui'
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
      <div className="max-w-2xl space-y-4">
        <Error mensaje={errorCarga ?? errorDescarga} />

        {cargando ? (
          <Cargando />
        ) : (meses ?? []).length === 0 ? (
          <Vacio
            icono={FileText}
            mensaje="No hay desprendibles disponibles. Si crees que es un error, verifica con administración que tu cédula esté registrada."
          />
        ) : (
          <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {(meses ?? []).map(({ anio, mes, etiqueta, disponible }) => (
              <li key={`${anio}-${mes}`} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className={`text-sm ${disponible ? 'text-gray-900' : 'text-gray-400'}`}>
                    {etiqueta}
                  </span>
                  {!disponible && (
                    <span className="text-xs rounded-full bg-gray-100 text-gray-400 px-2 py-0.5">
                      No disponible
                    </span>
                  )}
                </div>
                <Boton
                  variante="secundario"
                  className="!py-1.5"
                  disabled={!disponible}
                  cargando={descargando === `${anio}-${mes}`}
                  onClick={() => descargar(anio, mes)}
                >
                  <Download className="h-4 w-4" /> Descargar
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </div>
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
