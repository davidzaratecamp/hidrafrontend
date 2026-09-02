import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error } from '../ui'
import { CampoFijo, Seccion } from '../ui/campos'
import { useCatalogos } from '../../hooks/useCatalogos'
import { useRecurso } from '../../hooks/useRecurso'
import { fecha as formatearFecha, limpiarCamposCandidato, nombreDe } from '../ui/formato'
import api from '../../services/api'
import CandidatoCampos from './CandidatoCampos'

/**
 * Edición de un candidato ya registrado.
 *
 * Existía en el sistema viejo (`components/reclutador/EditarCandidato.jsx`,
 * rol `reclutador`) y no se reconstruyó en la reestructuración. El backend
 * (`PATCH /candidatos/:id`, permiso `editar_candidatos`) ya estaba listo —hoy
 * lo tienen `reclutamiento`, `seleccion` y `administrador`—, solo faltaba
 * esta pantalla.
 *
 * Comparte los campos con `NuevoCandidato.jsx` vía `CandidatoCampos`
 * (`modo="editar"` oculta "Citado", que el backend no acepta editar aquí).
 * "Registro" pasa a ser de solo lectura: fecha real de creación y el
 * reclutador dueño, no "quien está registrando ahora".
 */
export default function EditarCandidato() {
  const { candidatoId } = useParams()
  const navegar = useNavigate()
  const { catalogos, listo, error: errorCatalogos } = useCatalogos()

  const { datos: candidato, cargando, error: errorCarga } = useRecurso(
    () => api.get(`/candidatos/${candidatoId}`),
    [candidatoId]
  )

  const [datos, setDatos] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [errores, setErrores] = useState({})

  // El formulario se precarga una sola vez, cuando llega el candidato: si se
  // resincronizara en cada recarga de `candidato`, se perdería lo que el
  // usuario ya haya escrito.
  useEffect(() => {
    if (candidato && datos === null) {
      setDatos({
        nombreCompleto: nombreDe(candidato),
        tipoDocumento: candidato.tipo_documento ?? '',
        numeroDocumento: candidato.numero_documento ?? '',
        edad: candidato.edad ?? '',
        email: candidato.email ?? '',
        celular: candidato.celular ?? '',
        contactoLlamada: candidato.contacto_llamada,
        contactoWhatsapp: candidato.contacto_whatsapp,
        cliente: candidato.cliente ?? '',
        cargo: candidato.cargo ?? '',
        fuenteReclutamiento: candidato.fuente_reclutamiento ?? '',
        tipificacionLlamada: candidato.tipificacion_llamada ?? '',
        perfil: candidato.perfil ?? '',
        citado: candidato.citado,
      })
    }
  }, [candidato, datos])

  const set = (cambios) => setDatos((d) => ({ ...d, ...cambios }))
  const errorDe = (campo) => errores[`body.${campo}`]

  async function enviar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    setErrores({})

    try {
      await api.patch(`/candidatos/${candidatoId}`, limpiarCamposCandidato(datos))
      navegar(`/candidatos/${candidatoId}`, { replace: true })
    } catch (e) {
      setError(e.message)
      setErrores(Object.fromEntries((e.erroresDeCampo ?? []).map((d) => [d.campo, d.mensaje])))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando || !listo || datos === null) {
    return (
      <Layout titulo="Editar candidato">
        {errorCarga || errorCatalogos ? <Error mensaje={errorCarga ?? errorCatalogos} /> : <Cargando />}
      </Layout>
    )
  }

  return (
    <Layout titulo="Editar candidato" descripcion={nombreDe(candidato)}>
      <form onSubmit={enviar} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
          <Seccion titulo="Registro" columnas={3}>
            <CampoFijo
              etiqueta="Fecha de registro"
              valor={formatearFecha(candidato.created_at)}
            />
            <CampoFijo etiqueta="Reclutador" valor={candidato.reclutador_nombre ?? '—'} />
          </Seccion>

          <CandidatoCampos datos={datos} set={set} errorDe={errorDe} catalogos={catalogos} modo="editar" />
        </div>

        <Error mensaje={error} />

        <div className="flex justify-end gap-3">
          <Boton type="button" variante="secundario" onClick={() => navegar(`/candidatos/${candidatoId}`)}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando}>
            <Save className="h-4 w-4" /> Guardar cambios
          </Boton>
        </div>
      </form>
    </Layout>
  )
}
