import { fecha } from '../../ui/formato'
import { Cargando, Error } from '../../ui'
import { useRecurso } from '../../../hooks/useRecurso'
import api from '../../../services/api'

/** Los booleanos llegan tipados desde el backend, no como 1/0. */
const siNo = (v) => (v === true ? 'Sí' : v === false ? 'No' : null)

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
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{titulo}</h3>
      {children}
    </section>
  )
}

const NIVEL_ESTUDIOS = {
  bachillerato: 'Bachillerato',
  tecnico_tecnologo: 'Técnico/Tecnólogo',
  profesional_u_otros: 'Profesional u otros',
  conocimientos_informaticos: 'Conocimientos informáticos',
}

/**
 * Lo que el candidato llenó en sus 6 pasos del formulario público, para que el
 * reclutador lo vea sin tener que abrir el PDF. Viene de `obtenerCompleto`
 * (la misma consulta que arma la hoja de vida): estudios y experiencia ya
 * traen TODOS los niveles/empleos, no solo uno aplanado como mostraba la
 * interfaz anterior.
 */
function Formulario({ candidatoId }) {
  const { datos: f, cargando, error } = useRecurso(
    () => api.get(`/candidatos/${candidatoId}/formulario`),
    [candidatoId]
  )

  if (cargando) return <Cargando mensaje="Cargando el formulario…" />
  if (error) return <Error mensaje={error} />
  if (!f) return null

  const sinFormulario =
    !f.aspiracion_salarial &&
    !f.direccion_residencial &&
    f.estudios.length === 0 &&
    f.experiencia.length === 0 &&
    !f.genograma

  if (sinFormulario) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        El candidato todavía no completó el formulario.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Tarjeta titulo="Hoja de vida">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato
            etiqueta="Aspiración salarial"
            valor={f.aspiracion_salarial ? `$${Number(f.aspiracion_salarial).toLocaleString('es-CO')}` : null}
          />
          <Dato etiqueta="Fecha de nacimiento" valor={fecha(f.fecha_nacimiento)} />
          <Dato etiqueta="Estado civil" valor={f.estado_civil} />
          <Dato etiqueta="Dirección residencial" valor={f.direccion_residencial} />
          <Dato etiqueta="Barrio" valor={f.barrio} />
          <Dato etiqueta="EPS" valor={f.eps} />
          <Dato etiqueta="Fondo de pensión" valor={f.afp} />
          <Dato etiqueta="RH" valor={f.grupo_sanguineo} />
          <Dato etiqueta="Talla de camisa" valor={f.talla_camisa} />
        </dl>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <dl className="grid gap-5 sm:grid-cols-3">
            <Dato etiqueta="Contacto de emergencia" valor={f.nombre_emergencia} />
            <Dato etiqueta="Teléfono" valor={f.numero_emergencia} />
            <Dato etiqueta="Parentesco" valor={f.parentesco_emergencia} />
          </dl>
        </div>
      </Tarjeta>

      {f.estudios.length > 0 && (
        <Tarjeta titulo="Información académica">
          <div className="space-y-4">
            {f.estudios.map((e) => (
              <div key={e.nivel_estudios} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <p className="mb-2 text-sm font-medium text-gray-900">
                  {NIVEL_ESTUDIOS[e.nivel_estudios] ?? e.nivel_estudios}
                </p>
                {e.descripcion ? (
                  <p className="text-sm text-gray-700">{e.descripcion}</p>
                ) : (
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <Dato etiqueta="Institución" valor={e.nombre_institucion} />
                    <Dato etiqueta="Título obtenido" valor={e.titulo_obtenido} />
                    <Dato etiqueta="Año de finalización" valor={e.ano_finalizacion} />
                  </dl>
                )}
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      {f.experiencia.length > 0 && (
        <Tarjeta titulo="Experiencia laboral">
          <div className="space-y-5">
            {f.experiencia.map((e) => (
              <div key={e.orden} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <p className="mb-2 text-sm font-medium text-gray-900">
                  {e.orden === 1 ? 'Empleo actual o más reciente' : 'Empleo anterior'}
                </p>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <Dato etiqueta="Empresa" valor={e.nombre_empresa} />
                  <Dato etiqueta="Cargo" valor={e.cargo_desempenado} />
                  <Dato
                    etiqueta="Salario"
                    valor={e.salario ? `$${Number(e.salario).toLocaleString('es-CO')}` : null}
                  />
                  <Dato etiqueta="Fecha de inicio" valor={fecha(e.fecha_inicio)} />
                  <Dato etiqueta="Fecha de retiro" valor={e.fecha_retiro ? fecha(e.fecha_retiro) : 'Actualidad'} />
                  <Dato etiqueta="Motivo de retiro" valor={e.motivo_retiro} />
                </dl>
                {e.funciones && (
                  <p className="mt-3 text-sm text-gray-700">
                    <span className="text-xs uppercase tracking-wide text-gray-400">Funciones: </span>
                    {e.funciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      <Tarjeta titulo="Sobre ti">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Dato etiqueta="Núcleo familiar" valor={f.genograma} />
          <Dato etiqueta="Fortalezas" valor={f.fortalezas} />
          <Dato etiqueta="Aspectos por mejorar" valor={f.aspectos_mejorar} />
          <Dato etiqueta="Competencias laborales" valor={f.competencias_laborales} />
          <Dato etiqueta="Estado de salud actual" valor={f.estado_salud_actual} />
          <Dato etiqueta="Autoevaluación" valor={f.autoevaluacion ? `${f.autoevaluacion}/5` : null} />
        </dl>
        {f.metas.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <dl className="grid gap-4 sm:grid-cols-3">
              {f.metas.map((m) => (
                <Dato key={m.plazo} etiqueta={`Meta a ${m.plazo} plazo`} valor={m.descripcion} />
              ))}
            </dl>
          </div>
        )}
        {f.conocimientos.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <dl className="grid gap-4 sm:grid-cols-3">
              {f.conocimientos.map((c) => (
                <Dato key={c.codigo} etiqueta={c.codigo} valor={`${c.nivel}/5`} />
              ))}
            </dl>
          </div>
        )}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <dl className="grid gap-5 sm:grid-cols-3">
            <Dato etiqueta="¿Ha trabajado en la campaña?" valor={siNo(f.ha_trabajado_asiste)} />
            <Dato
              etiqueta="¿Experiencia comercial certificada?"
              valor={siNo(f.experiencia_comercial_certificada)}
            />
            <Dato etiqueta="¿Es su primer empleo?" valor={siNo(f.primer_empleo_formal)} />
          </dl>
        </div>
      </Tarjeta>
    </div>
  )
}

/** Datos de registro del candidato: lo que carga el reclutador. */
export default function Ficha({ candidato: c, candidatoId }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Dato etiqueta="Documento" valor={`${c.tipo_documento} ${c.numero_documento ?? ''}`} />
          <Dato etiqueta="Nacionalidad" valor={c.nacionalidad} />
          <Dato etiqueta="Edad" valor={c.edad} />
          <Dato etiqueta="Celular" valor={c.celular} />
          <Dato etiqueta="Correo" valor={c.email} />
          {/* La ciudad ya no se pide al registrar, así que no se muestra: saldría
              siempre vacía. Los candidatos anteriores que la tengan la conservan
              en la base. */}
          <Dato etiqueta="Campaña" valor={c.cliente} />
          <Dato etiqueta="Cargo" valor={c.cargo} />
          <Dato etiqueta="Fuente" valor={c.fuente_reclutamiento} />
          <Dato etiqueta="Contacto por llamada" valor={siNo(c.contacto_llamada)} />
          <Dato etiqueta="Contacto por WhatsApp" valor={siNo(c.contacto_whatsapp)} />
          <Dato etiqueta="Perfil" valor={c.perfil} />
          <Dato etiqueta="Citado" valor={siNo(c.citado)} />
          <Dato etiqueta="Registrado" valor={fecha(c.created_at)} />
        </dl>
        {c.observaciones_generales && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <Dato etiqueta="Observaciones" valor={c.observaciones_generales} />
          </div>
        )}
      </div>

      <Formulario candidatoId={candidatoId} />
    </div>
  )
}
