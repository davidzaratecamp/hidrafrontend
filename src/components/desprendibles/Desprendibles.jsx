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
            {(meses ?? []).map(({ anio, mes, etiqueta }) => (
              <li key={`${anio}-${mes}`} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-900">{etiqueta}</span>
                </div>
                <Boton
                  variante="secundario"
                  className="!py-1.5"
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

const NOMBRE_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/**
 * La API de nómina es externa y su forma no está bajo nuestro control: se
 * aceptan varias variantes en vez de asumir una sola.
 */
function normalizar(respuesta) {
  const lista = Array.isArray(respuesta) ? respuesta : (respuesta?.meses ?? [])
  return lista
    .map((item) => {
      const anio = Number(item.anio ?? item.year ?? item.ano)
      const mes = Number(item.mes ?? item.month)
      if (!anio || !mes) return null
      return { anio, mes, etiqueta: `${NOMBRE_MES[mes - 1] ?? mes} ${anio}` }
    })
    .filter(Boolean)
}
