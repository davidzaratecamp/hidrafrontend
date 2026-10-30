import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightCircle, Ban, RefreshCw, Stethoscope } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error, Etiqueta, Modal } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaTexto, Tabla } from '../ui/Tabla'
import { AreaTexto } from '../ui/campos'
import { useRecurso } from '../../hooks/useRecurso'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'
import { rutaLote } from './rutas'
import { ESTADO_EXAMEN, EVENTO_EXAMEN, quienMarco } from './examenes'

/**
 * Exámenes médicos de contratación (migración 022). SST, en Gestor, marca si el
 * candidato asistió y si aprobó; aquí selección ve cada marca y decide si da
 * continuidad a quien no asistió. Primero salen los que esperan decisión.
 */
export default function ExamenesMedicos() {
  const { hasPermission } = useAuth()
  const verPerfil = hasPermission('ver_candidatos')
  const verLote = hasPermission('enviar_contratacion')
  const { datos, cargando, error, recargar } = useRecurso(() => api.get('/contratacion/examenes'), [])
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [decision, setDecision] = useState(null) // { candidato, continuar }

  const candidatos = datos ?? []
  const pendientes = candidatos.filter((c) => c.decisionPendiente)
  const filas = soloPendientes ? pendientes : candidatos

  const columnas = [
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
          <p className="text-xs text-gray-500">
            {c.numero_documento ?? '—'} · {c.cargo} · {c.cliente}
          </p>
          <p className="text-xs text-gray-500">
            Lote{' '}
            {verLote ? (
              <Link to={rutaLote(c.lote_id)} className="hover:text-blue-600">
                {c.lote_nombre}
              </Link>
            ) : (
              c.lote_nombre
            )}
          </p>
        </>
      ),
    },
    {
      clave: 'examen_estado',
      titulo: 'Exámenes médicos',
      render: (c) => {
        const estado = ESTADO_EXAMEN[c.examen_estado] ?? { texto: c.examen_estado }
        return (
          <div>
            <Etiqueta texto={estado.texto} tono={estado.tono} />
            {c.decisionPendiente && <p className="mt-1 text-xs font-medium text-red-700">Espera tu decisión</p>}
            <p className="mt-1 text-xs text-gray-500">Estado en Hydra: {c.estado_hydra_nombre}</p>
          </div>
        )
      },
    },
    {
      clave: 'traza',
      titulo: 'Trazabilidad',
      render: (c) => (
        <CeldaTexto ancho="w-96">
          <ol className="space-y-1.5">
            {c.examenes.map((e) => (
              <li key={e.id} className="text-xs">
                <span className="font-medium text-gray-800">{EVENTO_EXAMEN[e.evento] ?? e.evento}</span>
                {e.nota && <span className="text-gray-700"> — {e.nota}</span>}
                <span className="block text-gray-500">
                  {quienMarco(e)} · {fecha(e.marcado_en, true)}
                </span>
              </li>
            ))}
          </ol>
        </CeldaTexto>
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Decisión',
      alineacion: 'right',
      render: (c) =>
        c.decisionPendiente ? (
          <div className="flex justify-end gap-2">
            <Boton className="!py-1.5" onClick={() => setDecision({ candidato: c, continuar: true })}>
              <ArrowRightCircle className="h-4 w-4" /> Dar continuidad
            </Boton>
            <Boton variante="peligro" className="!py-1.5" onClick={() => setDecision({ candidato: c, continuar: false })}>
              <Ban className="h-4 w-4" /> No continuar
            </Boton>
          </div>
        ) : null,
    },
  ]

  return (
    <Layout
      titulo="Exámenes médicos"
      descripcion="Lo que marca SST en Gestor sobre los candidatos enviados a contratación. Si no asistió, decide si se le da continuidad."
      acciones={
        <Boton variante="secundario" onClick={recargar} cargando={cargando}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Boton>
      }
    >
      {cargando && !datos ? (
        <Cargando />
      ) : error && !datos ? (
        <Error mensaje={error} onReintentar={recargar} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Boton variante={soloPendientes ? 'primario' : 'secundario'} className="!py-1.5" onClick={() => setSoloPendientes(true)}>
              Esperan decisión ({pendientes.length})
            </Boton>
            <Boton variante={soloPendientes ? 'secundario' : 'primario'} className="!py-1.5" onClick={() => setSoloPendientes(false)}>
              Todos ({candidatos.length})
            </Boton>
          </div>
          <Tabla
            columnas={columnas}
            filas={filas}
            clave={(c) => c.candidato_id}
            iconoVacio={Stethoscope}
            vacio={soloPendientes ? 'Nadie espera decisión.' : 'SST todavía no ha marcado exámenes.'}
          />
        </div>
      )}

      {decision && (
        <ModalDecision
          {...decision}
          onCerrar={() => setDecision(null)}
          onDecidido={() => {
            setDecision(null)
            recargar()
          }}
        />
      )}
    </Layout>
  )
}

function ModalDecision({ candidato, continuar, onCerrar, onDecidido }) {
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const confirmar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await api.post(`/contratacion/examenes/candidatos/${candidato.candidato_id}/continuidad`, {
        continuar,
        ...(nota.trim() ? { nota: nota.trim() } : {}),
      })
      onDecidido()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={continuar ? `Dar continuidad a ${candidato.nombre}` : `No continuar con ${candidato.nombre}`}
      descripcion={
        continuar
          ? 'Se le avisa a SST que se le reagenda la cita de exámenes médicos; SST volverá a marcar la asistencia.'
          : 'El candidato sale del proceso: en Hydra pasa a «No continúa (exámenes)» y en Gestor deja de contar para el lote. No se puede deshacer.'
      }
      onCerrar={onCerrar}
    >
      <form onSubmit={confirmar} className="space-y-4">
        <AreaTexto
          etiqueta="Nota (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          maxLength={1000}
          placeholder={continuar ? 'Ej. Nueva cita el lunes 9 a. m.' : 'Ej. El candidato desistió'}
          autoFocus
        />
        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar} disabled={guardando}>
            Volver
          </Boton>
          <Boton type="submit" variante={continuar ? 'primario' : 'peligro'} cargando={guardando}>
            {continuar ? <ArrowRightCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {continuar ? 'Dar continuidad' : 'No continuar'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
