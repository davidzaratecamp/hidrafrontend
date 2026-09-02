import { useState } from 'react'
import { Eye, FileSignature } from 'lucide-react'
import { Boton, Cargando, Error, Etiqueta, ModalDocumento } from '../../ui'
import { fecha } from '../../ui/formato'
import { useRecurso } from '../../../hooks/useRecurso'
import { useAuth } from '../../../context/useAuth'
import api from '../../../services/api'
import ModalFirmarHojaVida from './ModalFirmarHojaVida'

/** Citaciones, evaluaciones, decisión final y estado de la firma electrónica. */

function Panel({ titulo, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{titulo}</h3>
      {children}
    </section>
  )
}

const TONO_ASISTENCIA = { asistio: 'verde', no_asistio: 'rojo', pendiente: 'ambar' }
const TEXTO_ASISTENCIA = { asistio: 'Asistió', no_asistio: 'No asistió' }

// Estados reales que devuelve FirmaCloud (`proveedor.status`) — el `estado`
// local que guarda Hydra es solo una foto de cuando se envió, no se actualiza
// después (FirmaCloud sigue siendo la única fuente de verdad).
const TONO_FIRMA = { pending: 'ambar', viewed: 'azul', signed: 'verde' }
const TEXTO_FIRMA = { pending: 'Pendiente de firma', viewed: 'Visto', signed: 'Firmado' }

export default function ExpedienteSeleccion({ candidatoId }) {
  const { hasPermission } = useAuth()

  const { datos, cargando, error } = useRecurso(
    () => api.get(`/seleccion/candidatos/${candidatoId}/expediente`),
    [candidatoId]
  )

  // La firma puede no existir todavía: su ausencia no es un error de pantalla,
  // así que se pide aparte y se traga el fallo.
  const { datos: firma, recargar: recargarFirma } = useRecurso(
    () => api.get(`/firma/${candidatoId}/estado`).catch(() => null),
    [candidatoId]
  )

  // 'cv' | 'tratamiento' | null — cuál de los dos documentos se está
  // previsualizando ahora mismo.
  const [previsualizando, setPrevisualizando] = useState(null)
  const [firmando, setFirmando] = useState(false)

  if (error) return <Error mensaje={error} />
  if (cargando || !datos) return <Cargando />

  const TITULO_DOCUMENTO = { cv: 'Hoja de vida', tratamiento: 'Tratamiento de datos' }

  return (
    <div className="space-y-4">
      <Panel titulo="Citaciones">
        {datos.citaciones.length === 0 ? (
          <p className="text-sm text-gray-500">Sin citaciones.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {datos.citaciones.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                {/* Citar ya no lleva fecha de entrevista: esta es la fecha en
                    que se citó al candidato. */}
                <span className="text-sm text-gray-900">
                  Citado el {fecha(c.fecha_citado, true)}
                </span>
                <div className="flex items-center gap-2">
                  <Etiqueta
                    texto={TEXTO_ASISTENCIA[c.asistio] ?? 'Pendiente'}
                    tono={TONO_ASISTENCIA[c.asistio]}
                  />
                  {c.motivo_inasistencia && (
                    <span className="text-xs text-gray-500">{c.motivo_inasistencia}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel titulo="Evaluaciones">
        {datos.evaluaciones.length === 0 ? (
          <p className="text-sm text-gray-500">Sin evaluar.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {datos.evaluaciones.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {e.total} / {e.total_maximo} ({e.porcentaje}%)
                  </p>
                  <p className="text-xs text-gray-500">
                    {e.evaluador ?? '—'} · {fecha(e.created_at)}
                  </p>
                </div>
                <Etiqueta
                  texto={e.aprobado ? 'Aprobado' : 'Rechazado'}
                  tono={e.aprobado ? 'verde' : 'rojo'}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel titulo="Aprobación de entrevista">
        {datos.aprobacionEntrevista ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Etiqueta
                texto={datos.aprobacionEntrevista.aprobacion ? 'Aprobada' : 'No aprobada'}
                tono={datos.aprobacionEntrevista.aprobacion ? 'verde' : 'rojo'}
              />
              {datos.aprobacionEntrevista.razon && (
                <p className="mt-1.5 text-sm text-gray-600">{datos.aprobacionEntrevista.razon}</p>
              )}
            </div>
            <span className="text-xs text-gray-500">{datos.aprobacionEntrevista.usuario}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin registrar.</p>
        )}
      </Panel>

      <Panel titulo="Decisión final">
        {datos.decisionFinal ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Etiqueta
                texto={datos.decisionFinal.aprobacion ? 'Aprobado final' : 'Rechazado final'}
                tono={datos.decisionFinal.aprobacion ? 'verde' : 'rojo'}
              />
              {datos.decisionFinal.razon && (
                <p className="mt-1.5 text-sm text-gray-600">{datos.decisionFinal.razon}</p>
              )}
            </div>
            <span className="text-xs text-gray-500">{datos.decisionFinal.psicologo}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Pendiente.</p>
        )}
      </Panel>

      <Panel titulo="Citación a formación">
        {datos.citacionFormacion ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Etiqueta
                texto={datos.citacionFormacion.citado ? 'Citado' : 'No citado'}
                tono={datos.citacionFormacion.citado ? 'verde' : 'rojo'}
              />
              {datos.citacionFormacion.razon && (
                <p className="mt-1.5 text-sm text-gray-600">{datos.citacionFormacion.razon}</p>
              )}
            </div>
            <span className="text-xs text-gray-500">{datos.citacionFormacion.usuario}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Sin registrar.</p>
        )}
      </Panel>

      <Panel titulo="Firma electrónica">
        {!firma ? (
          <p className="text-sm text-gray-500">
            Los documentos se envían a firma cuando el candidato completa el formulario.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileSignature className="h-4 w-4 text-gray-400" />
              Estado:{' '}
              <Etiqueta
                texto={TEXTO_FIRMA[firma.proveedor?.status] ?? firma.proveedor?.status ?? firma.estado}
                tono={TONO_FIRMA[firma.proveedor?.status]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Boton variante="secundario" onClick={() => setPrevisualizando('cv')}>
                <Eye className="h-4 w-4" /> Hoja de vida
              </Boton>
              <Boton variante="secundario" onClick={() => setPrevisualizando('tratamiento')}>
                <Eye className="h-4 w-4" /> Tratamiento de datos
              </Boton>
              {firma.proveedor?.status === 'signed' && hasPermission('firmar_hoja_vida') && (
                <Boton onClick={() => setFirmando(true)}>
                  <FileSignature className="h-4 w-4" />
                  {firma.proveedor?.psicologo_signed_at ? 'Volver a firmar' : 'Firmar hoja de vida'}
                </Boton>
              )}
            </div>
            {firma.proveedor?.psicologo_signed_at && (
              <p className="w-full text-xs text-gray-500">
                Firmado por Selección: {firma.proveedor.psicologo_signed_by ?? '—'} ·{' '}
                {fecha(firma.proveedor.psicologo_signed_at, true)}
              </p>
            )}
          </div>
        )}
      </Panel>

      {firmando && (
        <ModalFirmarHojaVida
          candidatoId={candidatoId}
          onFirmado={() => {
            setFirmando(false)
            recargarFirma()
          }}
          onCerrar={() => setFirmando(false)}
        />
      )}

      {previsualizando && (
        <ModalDocumento
          titulo={TITULO_DOCUMENTO[previsualizando]}
          cargar={() => api.get(`/firma/${candidatoId}/documento/${previsualizando}`)}
          onCerrar={() => setPrevisualizando(null)}
        />
      )}
    </div>
  )
}
