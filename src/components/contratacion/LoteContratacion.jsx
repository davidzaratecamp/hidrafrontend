import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, RefreshCw, RotateCcw, Send, Users } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, BotonEnlace, Cargando, Error, Etiqueta, Modal } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaDoble, CeldaTexto, Tabla } from '../ui/Tabla'
import { AreaTexto } from '../ui/campos'
import { useRecurso } from '../../hooks/useRecurso'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

/**
 * Seguimiento de un lote enviado a Gestor: en qué va cada candidato del lado de
 * RRHH y qué pasó con cada petición (outbox). Mientras haya algo en camino la
 * pantalla se refresca sola.
 */

const ESTADO_CANDIDATO = {
  en_cola: { texto: 'En cola de envío', tono: 'ambar' },
  recibido: { texto: 'En RRHH', tono: 'azul' },
  registrado: { texto: 'Contratado', tono: 'verde' },
  descartado: { texto: 'Descartado por RRHH', tono: 'gris' },
  cancelado: { texto: 'Cancelado', tono: 'gris' },
  error: { texto: 'Error', tono: 'rojo' },
}

const ESTADO_ENVIO = {
  pendiente: { texto: 'Pendiente', tono: 'ambar' },
  enviado: { texto: 'Entregado', tono: 'verde' },
  fallido: { texto: 'Fallido', tono: 'rojo' },
}

const TIPO_ENVIO = { lote: 'Envío del lote', actualizacion: 'Reenvío de datos', cancelacion: 'Cancelación' }

// Mientras haya algo en camino, refresca cada 5 s (el despachador de Hydra corre
// al instante y, si falla, cada 30 s; el aviso de Gestor llega cuando RRHH registra).
const INTERVALO_REFRESCO_MS = 5000

export default function LoteContratacion() {
  const { loteId } = useParams()
  // Formación no ve perfiles de candidatos (no tiene `ver_candidatos`): sin enlace.
  const { hasPermission } = useAuth()
  const verPerfil = hasPermission('ver_candidatos')
  const { datos: lote, cargando, error, recargar } = useRecurso(() => api.get(`/contratacion/lotes/${loteId}`), [loteId])
  const [accion, setAccion] = useState(null) // { tipo: 'cancelar', candidato }
  const [errorAccion, setErrorAccion] = useState(null)
  const [trabajando, setTrabajando] = useState(null)

  const enCamino =
    lote?.candidatos.some((c) => c.estado === 'en_cola') || lote?.envios.some((e) => e.estado === 'pendiente')

  useEffect(() => {
    if (!enCamino) return undefined
    const temporizador = setInterval(recargar, INTERVALO_REFRESCO_MS)
    return () => clearInterval(temporizador)
  }, [enCamino, recargar])

  const ejecutar = async (clave, peticion) => {
    setTrabajando(clave)
    setErrorAccion(null)
    try {
      await peticion()
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    } finally {
      setTrabajando(null)
    }
  }

  if (cargando && !lote) {
    return (
      <Layout titulo="Lote de contratación">
        <Cargando />
      </Layout>
    )
  }

  if (!lote) {
    return (
      <Layout titulo="Lote de contratación">
        <Error mensaje={error ?? 'No se encontró el lote'} onReintentar={recargar} />
      </Layout>
    )
  }

  const columnasCandidatos = [
    {
      clave: 'nombre',
      titulo: 'Candidato',
      render: (c) => (
        <>
          {verPerfil ? (
            <Link to={`/candidatos/${c.candidato_id}`} className="font-medium text-gray-900 hover:text-blue-600">
              {c.nombre}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{c.nombre}</span>
          )}
          <p className="text-xs text-gray-500">{c.numero_documento ?? '—'}</p>
        </>
      ),
    },
    { clave: 'cargo', titulo: 'Cargo' },
    {
      clave: 'estado',
      titulo: 'Estado en Gestor',
      render: (c) => {
        const estado = ESTADO_CANDIDATO[c.estado] ?? { texto: c.estado }
        return (
          <div>
            <Etiqueta texto={estado.texto} tono={estado.tono} />
            {c.users_company_id && <p className="mt-1 text-xs text-gray-500">Empleado #{c.users_company_id}</p>}
            {c.detalle && (
              <CeldaTexto ancho="w-72">
                <span className="text-xs text-gray-500">{c.detalle}</span>
              </CeldaTexto>
            )}
          </div>
        )
      },
    },
    { clave: 'estado_hydra', titulo: 'Estado en Hydra', render: (c) => c.estado_hydra.replaceAll('_', ' ') },
    { clave: 'version', titulo: 'Versión', alineacion: 'center' },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      alineacion: 'right',
      render: (c) =>
        c.estado === 'registrado' ? null : (
          <div className="flex justify-end gap-2">
            <Boton
              variante="secundario"
              className="!py-1.5"
              cargando={trabajando === `reenviar-${c.candidato_id}`}
              onClick={() => ejecutar(`reenviar-${c.candidato_id}`, () => api.post(`/contratacion/candidatos/${c.candidato_id}/reenviar`))}
              title="Manda a RRHH los datos actuales del candidato (versión nueva). Si estaba cancelado, vuelve al proceso."
            >
              <RefreshCw className="h-4 w-4" /> Reenviar datos
            </Boton>
            {c.estado !== 'cancelado' && (
              <Boton variante="peligro" className="!py-1.5" onClick={() => setAccion({ tipo: 'cancelar', candidato: c })}>
                <Ban className="h-4 w-4" /> Cancelar
              </Boton>
            )}
          </div>
        ),
    },
  ]

  const columnasEnvios = [
    {
      clave: 'tipo',
      titulo: 'Petición',
      render: (e) => (
        <CeldaDoble
          principal={TIPO_ENVIO[e.tipo] ?? e.tipo}
          secundario={e.candidato_id ? lote.candidatos.find((c) => c.candidato_id === e.candidato_id)?.nombre : null}
        />
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      render: (e) => {
        const estado = ESTADO_ENVIO[e.estado] ?? { texto: e.estado }
        return <Etiqueta texto={estado.texto} tono={estado.tono} />
      },
    },
    { clave: 'intentos', titulo: 'Intentos', alineacion: 'center' },
    {
      clave: 'ultimo_error',
      titulo: 'Último error',
      render: (e) => (
        <CeldaTexto ancho="w-80">
          <span className="text-xs text-gray-500">{e.ultimo_error}</span>
        </CeldaTexto>
      ),
    },
    { clave: 'created_at', titulo: 'Creado', render: (e) => <CeldaDoble principal={fecha(e.created_at, true)} secundario={e.enviado_por} /> },
    {
      clave: 'acciones',
      titulo: '',
      alineacion: 'right',
      render: (e) =>
        e.estado === 'fallido' ? (
          <Boton
            variante="secundario"
            className="!py-1.5"
            cargando={trabajando === `envio-${e.id}`}
            onClick={() => ejecutar(`envio-${e.id}`, () => api.post(`/contratacion/envios/${e.id}/reintentar`))}
          >
            <RotateCcw className="h-4 w-4" /> Reintentar
          </Boton>
        ) : null,
    },
  ]

  return (
    <Layout
      titulo={lote.nombre}
      descripcion={`${lote.lote_externo_id} · Ingreso sugerido ${fecha(lote.fecha_ingreso_sugerida)} · Enviado ${fecha(lote.created_at, true)}${lote.creado_por ? ` por ${lote.creado_por}` : ''}`}
      acciones={
        <>
          <BotonEnlace to="/contratacion">
            <ArrowLeft className="h-4 w-4" /> Volver
          </BotonEnlace>
          <Boton variante="secundario" onClick={recargar} cargando={cargando}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Boton>
        </>
      }
    >
      <div className="space-y-6">
        {enCamino && (
          <p className="text-sm text-gray-500">Hay envíos en camino: esta pantalla se actualiza sola.</p>
        )}
        <Error mensaje={errorAccion} />

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Candidatos</h2>
          <Tabla columnas={columnasCandidatos} filas={lote.candidatos} clave={(c) => c.candidato_id} iconoVacio={Users} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Peticiones a Gestor</h2>
          <Tabla columnas={columnasEnvios} filas={lote.envios} iconoVacio={Send} vacio="Sin peticiones." />
        </section>
      </div>

      {accion?.tipo === 'cancelar' && (
        <ModalCancelar
          candidato={accion.candidato}
          onCerrar={() => setAccion(null)}
          onCancelado={() => {
            setAccion(null)
            recargar()
          }}
        />
      )}
    </Layout>
  )
}

function ModalCancelar({ candidato, onCerrar, onCancelado }) {
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const confirmar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/contratacion/candidatos/${candidato.candidato_id}/cancelar`, { motivo: motivo.trim() })
      onCancelado()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={`Cancelar a ${candidato.nombre}`}
      descripcion="RRHH dejará de procesarlo en Gestor. Si cambia de opinión, se puede volver a enviar con «Reenviar datos»."
      onCerrar={onCerrar}
    >
      <form onSubmit={confirmar} className="space-y-4">
        <AreaTexto
          etiqueta="Motivo"
          requerido
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={255}
          placeholder="Ej. El candidato desistió del proceso"
          autoFocus
        />
        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar} disabled={guardando}>
            Volver
          </Boton>
          <Boton type="submit" variante="peligro" cargando={guardando} disabled={motivo.trim().length < 3}>
            <Ban className="h-4 w-4" /> Cancelar envío
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
