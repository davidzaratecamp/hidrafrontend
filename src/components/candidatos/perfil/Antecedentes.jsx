import { useState } from 'react'
import { Eye, ShieldCheck, Upload } from 'lucide-react'
import { Boton, Cargando, Error, Etiqueta, Modal, ModalDocumento } from '../../ui'
import { fecha } from '../../ui/formato'
import { AreaTexto, Seleccion } from '../../ui/campos'
import { useRecurso } from '../../../hooks/useRecurso'
import api from '../../../services/api'

/**
 * Las cuatro verificaciones de antecedentes.
 *
 * Se consultan manualmente fuera del sistema; aquí solo se registra el resultado
 * y se adjunta el soporte. El backend valida que el candidato ya haya pasado por
 * la entrevista: esa regla vivía solo en el frontend en el sistema anterior.
 */
export default function Antecedentes({ candidatoId, puedeGestionar }) {
  const { datos: lista, cargando, error, recargar } = useRecurso(
    () => api.get(`/antecedentes/candidatos/${candidatoId}`),
    [candidatoId]
  )
  const [editando, setEditando] = useState(null)
  const [previsualizando, setPrevisualizando] = useState(null)

  if (error) return <Error mensaje={error} onReintentar={recargar} />
  if (cargando || !lista) return <Cargando />

  const colorIcono = (estado) =>
    estado === 'aprobado'
      ? 'text-emerald-500'
      : estado === 'no_aprobado'
        ? 'text-red-500'
        : 'text-gray-300'

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {lista.map((a) => (
          <div key={a.tipo} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${colorIcono(a.estado)}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                {a.novedad && <p className="text-xs text-red-600">{a.novedad}</p>}
                {a.verificado_por && (
                  <p className="text-xs text-gray-400">
                    {a.verificado_por} · {fecha(a.updated_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {a.documento_id && (
                <button
                  onClick={() => setPrevisualizando(a)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" /> Ver soporte
                </button>
              )}
              {a.estado ? (
                <Etiqueta
                  texto={a.estado === 'aprobado' ? 'Aprobado' : 'No aprobado'}
                  tono={a.estado === 'aprobado' ? 'verde' : 'rojo'}
                />
              ) : (
                <Etiqueta texto="Sin verificar" />
              )}
              {puedeGestionar && (
                <Boton variante="secundario" onClick={() => setEditando(a)} className="!py-1.5">
                  <Upload className="h-4 w-4" /> Registrar
                </Boton>
              )}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ModalAntecedente
          candidatoId={candidatoId}
          antecedente={editando}
          onCerrar={() => setEditando(null)}
          onListo={() => {
            setEditando(null)
            recargar()
          }}
        />
      )}

      {previsualizando && (
        <ModalDocumento
          titulo={previsualizando.nombre}
          cargar={() =>
            api.get(
              `/antecedentes/candidatos/${candidatoId}/documento/${previsualizando.documento_id}`
            )
          }
          onCerrar={() => setPrevisualizando(null)}
        />
      )}
    </>
  )
}

function ModalAntecedente({ candidatoId, antecedente, onCerrar, onListo }) {
  const [estado, setEstado] = useState(antecedente.estado ?? '')
  const [novedad, setNovedad] = useState(antecedente.novedad ?? '')
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      // multipart: el soporte viaja junto con el resultado de la verificación.
      const formData = new FormData()
      formData.append('tipo', antecedente.tipo)
      formData.append('estado', estado)
      if (novedad.trim()) formData.append('novedad', novedad.trim())
      if (archivo) formData.append('documento', archivo)

      await api.postFormData(`/antecedentes/candidatos/${candidatoId}`, formData)
      onListo()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={antecedente.nombre}
      descripcion="Registra el resultado de la verificación"
      onCerrar={onCerrar}
    >
      <div className="space-y-4">
        <Seleccion
          etiqueta="Resultado"
          requerido
          opciones={[
            { codigo: 'aprobado', nombre: 'Aprobado' },
            { codigo: 'no_aprobado', nombre: 'No aprobado' },
          ]}
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        />

        {estado === 'no_aprobado' && (
          <AreaTexto
            etiqueta="Novedad"
            requerido
            filas={2}
            value={novedad}
            onChange={(e) => setNovedad(e.target.value)}
            ayuda="Obligatoria cuando el resultado no es aprobado."
          />
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Soporte</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:text-blue-700"
          />
          <span className="mt-1 block text-xs text-gray-500">PDF, JPG o PNG. Máximo 10 MB.</span>
        </label>

        <Error mensaje={error} />

        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            onClick={guardar}
            cargando={guardando}
            disabled={!estado || (estado === 'no_aprobado' && !novedad.trim())}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
