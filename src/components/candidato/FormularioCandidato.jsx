import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Building, Check, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { PASOS } from './pasos'

/**
 * Formulario público del candidato, en un solo componente con 6 pasos.
 *
 * Antes eran 6 rutas y 6 componentes independientes, cada uno con su propia
 * carga de datos y su propio marcado. Al ser una sola pantalla, el candidato ve
 * su avance, puede volver atrás sin perder lo escrito, y el token viaja una vez.
 *
 * No requiere sesión: la autorización ES el token del enlace, y el backend
 * deduce de él a qué candidato pertenece. Nunca se envía un id de candidato.
 */

function Cargando({ mensaje }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="mt-3 text-sm text-gray-600">{mensaje}</p>
      </div>
    </div>
  )
}

function Aviso({ titulo, mensaje, tono = 'error' }) {
  const estilos =
    tono === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className={`max-w-md w-full rounded-xl border p-6 text-center ${estilos}`}>
        {tono === 'error' ? (
          <AlertCircle className="h-10 w-10 mx-auto" />
        ) : (
          <Check className="h-10 w-10 mx-auto" />
        )}
        <h2 className="mt-3 text-lg font-semibold">{titulo}</h2>
        <p className="mt-2 text-sm">{mensaje}</p>
      </div>
    </div>
  )
}

/** Indicador de avance: número del paso y barra. */
function Progreso({ indice, completados }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-gray-900">
          Paso {indice + 1} de {PASOS.length}
        </span>
        <span className="text-gray-500">{completados} completados</span>
      </div>
      <div className="flex gap-1.5">
        {PASOS.map((paso, i) => (
          <div
            key={paso.clave}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < indice ? 'bg-blue-600' : i === indice ? 'bg-blue-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function FormularioCandidato() {
  const { token } = useParams()

  const [estado, setEstado] = useState('cargando')
  const [errorCarga, setErrorCarga] = useState(null)
  const [candidato, setCandidato] = useState(null)
  const [catalogos, setCatalogos] = useState({})
  const [completados, setCompletados] = useState(0)
  const [indice, setIndice] = useState(0)

  // Un objeto de datos por paso: volver atrás no pierde lo escrito.
  const [datos, setDatos] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorPaso, setErrorPaso] = useState(null)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [formulario, listas] = await Promise.all([
          api.get(`/formulario/${token}`),
          api.get('/catalogos'),
        ])
        setCandidato(formulario.candidato)
        setCompletados(formulario.progreso.completados)
        setCatalogos(listas)
        // Precarga TODO lo que el candidato ya haya diligenciado en un envío
        // anterior (el token rota en cada reenvío, pero los datos son suyos, no
        // del token): sin esto, reabrir un paso ya completado lo mostraba en
        // blanco y volver a guardarlo pisaba con vacío lo que ya había escrito.
        setDatos((previo) => ({
          ...(formulario.respuestas ?? {}),
          ...previo,
          // "Datos personales" además se pre-llena con lo que ya capturó el
          // reclutador al registrarlo (Nuevo candidato): el candidato no
          // debería volver a escribir su nombre, documento, celular o edad,
          // solo confirmarlos o corregirlos. Así se hacía en la interfaz
          // anterior.
          datos_basicos: {
            ...formulario.respuestas?.datos_basicos,
            nombreCompleto: formulario.candidato.nombreCompleto || '',
            numeroDocumento: formulario.candidato.numeroDocumento || '',
            celular: formulario.candidato.celular || '',
            edad: formulario.candidato.edad ?? '',
            ...previo.datos_basicos,
          },
        }))
        // Retoma donde quedó, sin obligarlo a repetir lo ya enviado.
        setIndice(Math.min(formulario.progreso.completados, PASOS.length - 1))
        setEstado('listo')
      } catch (e) {
        setErrorCarga(e.message)
        setEstado('error')
      }
    })()
  }, [token])

  const paso = PASOS[indice]
  const datosPaso = datos[paso?.clave] ?? {}

  const set = useCallback(
    (cambios) =>
      setDatos((previo) => ({
        ...previo,
        [paso.clave]: { ...(previo[paso.clave] ?? {}), ...cambios },
      })),
    [paso?.clave]
  )

  async function enviar() {
    setGuardando(true)
    setErrorPaso(null)
    try {
      const respuesta = await api.put(`/formulario/${token}/${rutaDe(paso.clave)}`, paso.aCuerpo(datosPaso))

      if (paso.clave === 'consentimiento') {
        // Si FirmaCloud recibió los documentos, se redirige directo a firmarlos
        // en la misma sesión, sin depender de que el candidato revise su
        // correo (interfaz anterior) — el correo se manda igual, de respaldo.
        if (respuesta?.firma?.firmarUrl) {
          window.location.href = respuesta.firma.firmarUrl
          return
        }
        setResultado(respuesta)
        setEstado('finalizado')
        return
      }

      setCompletados((c) => Math.max(c, respuesta?.completados ?? c))
      setIndice((i) => Math.min(i + 1, PASOS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      // Los errores de validación traen el campo exacto; se muestran todos.
      const detalle = e.erroresDeCampo?.map((d) => d.mensaje).join(' · ')
      setErrorPaso(detalle || e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (estado === 'cargando') return <Cargando mensaje="Abriendo tu formulario…" />

  if (estado === 'error') {
    return (
      <Aviso
        titulo="No pudimos abrir tu formulario"
        mensaje={`${errorCarga}. Si recibiste un correo más reciente, usa el enlace de ese correo: los anteriores dejan de funcionar.`}
      />
    )
  }

  if (estado === 'finalizado') {
    return (
      <Aviso
        tono="exito"
        titulo="¡Listo! Recibimos tu información"
        mensaje={
          resultado?.firma?.enviado
            ? 'Te enviamos por correo tu hoja de vida y la autorización de tratamiento de datos para que las firmes electrónicamente.'
            : 'Tu formulario quedó registrado. En breve nos comunicaremos contigo.'
        }
      />
    )
  }

  const { Formulario } = paso

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Building className="h-7 w-7 text-blue-600" />
          <div>
            <p className="font-semibold text-gray-900">ASISTE ING</p>
            <p className="text-xs text-gray-500">
              Hola {candidato?.primerNombre}, completa tu hoja de vida
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Progreso indice={indice} completados={completados} />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviar()
          }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">{paso.titulo}</h1>
            <p className="mt-1 text-sm text-gray-600">{paso.descripcion}</p>
          </div>

          <Formulario datos={datosPaso} set={set} catalogos={catalogos} candidato={candidato} />

          {errorPaso && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorPaso}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              disabled={indice === 0 || guardando}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </button>

            <button
              type="submit"
              disabled={guardando || (paso.clave === 'consentimiento' && datosPaso.aceptado !== true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
              {paso.clave === 'consentimiento' ? 'Ver tratamiento de datos y firmar' : 'Guardar y continuar'}
              {!guardando && paso.clave !== 'consentimiento' && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

/** La clave del paso usa guion bajo; la ruta del backend, guion medio. */
function rutaDe(clave) {
  return clave.replace('_', '-')
}
