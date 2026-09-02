import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Boton, Cargando, Error, Modal, ModalDocumento } from '../ui'
import { fecha } from '../ui/formato'
import { useRecurso } from '../../hooks/useRecurso'
import api from '../../services/api'

/**
 * Ficha resumida de un candidato de la base histórica (`noviembrehidra`),
 * para responder rápido "¿quién es, qué campaña, en qué quedó?" cuando
 * "Nuevo candidato" detecta un documento repetido — sin salir del registro
 * para ir a la pantalla completa de Base histórica.
 *
 * El backend ya omite el bloque de valoración psicológica (antecedentes,
 * aprobación) a quien no tiene `ver_perfiles_completos`; acá solo se decide
 * si esa tarjeta se dibuja, igual que en Base histórica y en el perfil del
 * sistema nuevo.
 */

/** El esquema viejo mezcla booleanos reales con texto 'si'/'no' según la columna. */
function siNo(v) {
  if (v === true || v === 'si' || v === 'Si' || v === 'SI') return 'Sí'
  if (v === false || v === 'no' || v === 'No' || v === 'NO') return 'No'
  return null
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{valor || '—'}</dd>
    </div>
  )
}

function Tarjeta({ titulo, children }) {
  return (
    <section className="rounded-lg border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{titulo}</h3>
      {children}
    </section>
  )
}

export default function ModalPerfilHistorico({ candidatoId, onCerrar }) {
  const { datos: c, cargando, error } = useRecurso(
    () => api.get(`/historico/candidatos/${candidatoId}`),
    [candidatoId]
  )
  const [previsualizando, setPrevisualizando] = useState(null)

  const firmacloudId = c?.formularios?.firmacloudSignatureId

  return (
    <Modal
      titulo={c?.nombreCompleto ?? 'Candidato en base histórica'}
      descripcion="Archivo del sistema anterior, de solo lectura"
      onCerrar={onCerrar}
      ancho="max-w-2xl"
    >
      {cargando ? (
        <Cargando />
      ) : error ? (
        <Error mensaje={error} />
      ) : !c ? null : (
        <div className="space-y-4">
          <Tarjeta titulo="Identificación">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato etiqueta="Documento" valor={`${c.tipoDocumento ?? ''} ${c.numeroDocumento}`.trim()} />
              <Dato etiqueta="Edad" valor={c.edad} />
              <Dato etiqueta="Celular" valor={c.celular} />
              <Dato etiqueta="Correo" valor={c.email} />
            </dl>
          </Tarjeta>

          <Tarjeta titulo="Proceso">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato etiqueta="Campaña" valor={c.cliente} />
              <Dato etiqueta="Cargo" valor={c.cargo} />
              <Dato etiqueta="Estado" valor={c.estado} />
              <Dato etiqueta="Estado gestión reclutamiento" valor={c.estadoGestionReclutamiento} />
              <Dato etiqueta="Reclutador" valor={c.reclutador?.nombreCompleto} />
              <Dato etiqueta="Registrado" valor={fecha(c.createdAt, true)} />
              <Dato etiqueta="Asiste a entrevista" valor={c.asisteEntrevista} />
              <Dato etiqueta="Motivo de inasistencia" valor={c.motivoInasistencia} />
            </dl>
          </Tarjeta>

          {(c.perfil || c.observacionesLlamada || c.observacionesGenerales) && (
            <Tarjeta titulo="Perfil y observaciones">
              {c.perfil && <p className="text-sm text-gray-700">{c.perfil}</p>}
              {c.observacionesLlamada && (
                <p className="mt-2 text-sm text-gray-700">{c.observacionesLlamada}</p>
              )}
              {c.observacionesGenerales && (
                <p className="mt-2 text-sm text-gray-700">{c.observacionesGenerales}</p>
              )}
            </Tarjeta>
          )}

          {/* Hoja de vida y tratamiento de datos firmados en FirmaCloud, si el
              sistema viejo alcanzó a enviarlos (no todo candidato del archivo
              los tiene). Mismo proveedor que usa el sistema nuevo — la
              referencia solo cambia de dónde sale. */}
          {firmacloudId && (
            <Tarjeta titulo="Documentos firmados">
              <div className="flex flex-wrap gap-2">
                <Boton
                  type="button"
                  variante="secundario"
                  className="!py-1.5"
                  onClick={() => setPrevisualizando('cv')}
                >
                  <FileText className="h-4 w-4" /> Hoja de vida
                </Boton>
                <Boton
                  type="button"
                  variante="secundario"
                  className="!py-1.5"
                  onClick={() => setPrevisualizando('tratamiento')}
                >
                  <FileText className="h-4 w-4" /> Tratamiento de datos
                </Boton>
              </div>
            </Tarjeta>
          )}

          {/* Solo presente cuando el usuario tiene `ver_perfiles_completos`:
              el backend omite el bloque entero, no solo lo enmascara. */}
          {c.seleccion && (
            <Tarjeta titulo="Selección">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Dato etiqueta="Antecedentes ADRES" valor={c.seleccion.antecedentes.adres.resultado} />
                <Dato etiqueta="Antecedentes Policía" valor={c.seleccion.antecedentes.policia.resultado} />
                <Dato
                  etiqueta="Antecedentes Contraloría"
                  valor={c.seleccion.antecedentes.contraloria.resultado}
                />
                <Dato
                  etiqueta="Antecedentes Procuraduría"
                  valor={c.seleccion.antecedentes.procuraduria.resultado}
                />
                <Dato etiqueta="Evaluación total" valor={c.seleccion.evaluacion.total} />
                <Dato etiqueta="Evaluación aprobada" valor={siNo(c.seleccion.evaluacion.aprobado)} />
                <Dato etiqueta="Decisión final" valor={siNo(c.seleccion.decisionFinal.aprobado)} />
                <Dato etiqueta="Razón de la decisión" valor={c.seleccion.decisionFinal.razon} />
              </dl>
            </Tarjeta>
          )}
        </div>
      )}

      {previsualizando && (
        <ModalDocumento
          titulo={previsualizando === 'cv' ? 'Hoja de vida' : 'Tratamiento de datos'}
          descripcion={`${c.nombreCompleto} · archivo histórico`}
          cargar={() => api.get(`/historico/candidatos/${candidatoId}/documento/${previsualizando}`)}
          onCerrar={() => setPrevisualizando(null)}
        />
      )}
    </Modal>
  )
}
