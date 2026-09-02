import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, UserPlus } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error } from '../ui'
import { CampoFijo, Seccion } from '../ui/campos'
import { useCatalogos } from '../../hooks/useCatalogos'
import { useAuth } from '../../context/useAuth'
import { fecha as formatearFecha, limpiarCamposCandidato } from '../ui/formato'
import api from '../../services/api'
import ModalPerfilHistorico from '../historico/ModalPerfilHistorico'
import CandidatoCampos from './CandidatoCampos'

/**
 * Registro de un candidato.
 *
 * El ORDEN de los campos sigue exactamente el del Excel oficial
 * "BASE RECLUTAMIENTO", que es el formato con el que trabaja el equipo:
 *
 *   FECHA · ANALISTA · CAMPAÑA · CARGO · NOMBRE · TIPO DE DOC · DOCUMENTO ·
 *   EDAD · CORREO · CONTACTO (LLAMADA / WHATSAPP) · PERFIL · CITADO ·
 *   ESTADO GESTIÓN RECLUTAMIENTO
 *
 * Notas sobre ese orden:
 *   - FECHA y ANALISTA no se piden: los pone el sistema (la fecha de registro y
 *     el usuario en sesión). Se muestran arriba, de solo lectura, para que la
 *     fila del Excel se lea completa.
 *   - CELULAR no existe como columna del Excel, pero es obligatorio en la base.
 *     Va dentro del grupo CONTACTO, que es su lugar natural.
 *   - Fuente de reclutamiento y observación de la llamada tampoco están en el
 *     formato; quedan al final, en su propia sección, para no romper el orden de
 *     arriba sin dejar de capturarlas.
 *   - La ciudad NO se pide aquí (decisión de negocio, 2026-08-30). La columna
 *     `candidatos.ciudad_id` sigue existiendo, pero ya nadie la escribe desde el
 *     registro; la ciudad que sí se captura es la del consentimiento, en el
 *     formulario que llena el propio candidato.
 *
 * Diferencias con la versión anterior a la reestructuración:
 *   - Los desplegables vienen del backend, no de constantes en el frontend.
 *   - El cargo se filtra por el cliente elegido usando la relación M:N real;
 *     antes era un `switch (formData.cliente)` con cinco ramas, dos de ellas
 *     apuntando a clientes que ya no existen en el catálogo.
 *   - El correo es opcional de verdad: si no hay, no se envía. La versión
 *     anterior obligaba al backend a inventar `temp_<timestamp>@…`.
 *   - Los errores de validación del backend se muestran campo por campo.
 */
export default function NuevoCandidato() {
  const navegar = useNavigate()
  const { user } = useAuth()
  const { catalogos, listo, error: errorCatalogos } = useCatalogos()

  const [datos, setDatos] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [errores, setErrores] = useState({})

  // Alerta de duplicado contra la base histórica: se busca por número de
  // documento exacto (no por nombre, que puede coincidir por casualidad).
  const [coincidenciaHistorica, setCoincidenciaHistorica] = useState(null)
  const [verPerfilHistorico, setVerPerfilHistorico] = useState(false)

  const set = (cambios) => setDatos((d) => ({ ...d, ...cambios }))
  const errorDe = (campo) => errores[`body.${campo}`]

  /**
   * Busca en la base histórica mientras el usuario escribe el documento, con
   * espera para no disparar una consulta por cada tecla. Falla en silencio —
   * si el módulo histórico no está configurado en este entorno, o la
   * petición falla por lo que sea, el registro sigue funcionando igual: esto
   * es una ayuda, no un requisito para poder guardar.
   */
  useEffect(() => {
    const documento = (datos.numeroDocumento ?? '').trim()
    if (documento.length < 5) {
      setCoincidenciaHistorica(null)
      return undefined
    }

    let vigente = true
    const temporizador = setTimeout(async () => {
      try {
        const resultados = await api.get(
          `/historico/candidatos${api.qs({ numeroDocumento: documento, porPagina: 1 })}`
        )
        if (vigente) setCoincidenciaHistorica(resultados?.[0] ?? null)
      } catch {
        if (vigente) setCoincidenciaHistorica(null)
      }
    }, 400)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [datos.numeroDocumento])

  async function enviar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    setErrores({})

    try {
      const candidato = await api.post('/candidatos', limpiarCamposCandidato(datos))
      navegar(`/candidatos/${candidato.id}`, { replace: true })
    } catch (e) {
      setError(e.message)
      setErrores(Object.fromEntries(e.erroresDeCampo.map((d) => [d.campo, d.mensaje])))
    } finally {
      setGuardando(false)
    }
  }

  if (!listo) {
    return (
      <Layout titulo="Nuevo candidato">
        {errorCatalogos ? <Error mensaje={errorCatalogos} /> : <Cargando />}
      </Layout>
    )
  }

  return (
    <Layout titulo="Nuevo candidato" descripcion="Registra un candidato en tu cartera">
      <form onSubmit={enviar} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
          {/* FECHA · ANALISTA — los pone el sistema. */}
          <Seccion titulo="Registro" columnas={3}>
            <CampoFijo etiqueta="Fecha" valor={formatearFecha(hoy())} ayuda="Fecha de registro." />
            <CampoFijo
              etiqueta="Analista"
              valor={user?.nombreCompleto ?? '—'}
              ayuda="Quien registra queda como dueño del candidato."
            />
          </Seccion>

          {/* Alerta de duplicado: este documento ya aparece en el archivo del
              sistema anterior. No bloquea el registro — solo avisa, con la
              opción de revisar qué pasó la vez anterior antes de continuar. */}
          {coincidenciaHistorica && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Este documento ya aparece en la base histórica
                </p>
                <p className="mt-0.5 text-sm text-amber-800">
                  {coincidenciaHistorica.nombreCompleto} · {coincidenciaHistorica.cliente ?? 'sin campaña'} ·{' '}
                  {coincidenciaHistorica.estado ?? 'sin estado'}
                </p>
              </div>
              <Boton
                type="button"
                variante="secundario"
                className="!py-1.5 whitespace-nowrap"
                onClick={() => setVerPerfilHistorico(true)}
              >
                Ver perfil
              </Boton>
            </div>
          )}

          <CandidatoCampos datos={datos} set={set} errorDe={errorDe} catalogos={catalogos} modo="crear" />
        </div>

        <Error mensaje={error} />

        <div className="flex justify-end gap-3">
          <Boton type="button" variante="secundario" onClick={() => navegar('/candidatos')}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            <UserPlus className="h-4 w-4" /> Registrar candidato
          </Boton>
        </div>
      </form>

      {verPerfilHistorico && coincidenciaHistorica && (
        <ModalPerfilHistorico
          candidatoId={coincidenciaHistorica.id}
          onCerrar={() => setVerPerfilHistorico(false)}
        />
      )}
    </Layout>
  )
}

/** Fecha local en AAAA-MM-DD, que es lo que `formato.fecha` sabe leer. */
function hoy() {
  const ahora = new Date()
  const dosDigitos = (n) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`
}
