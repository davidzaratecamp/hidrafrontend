import { useState } from 'react'
import { Boton, Error, Etiqueta, Modal } from '../ui'
import { CeldaTexto } from '../ui/Tabla'
import { AreaTexto } from '../ui/campos'
import api from '../../services/api'

/**
 * Piezas compartidas por Formación (Agentes) y Contratación (Staff): el mismo
 * dato de asistencia y activo/baja (`candidato_formacion`), marcado por dos
 * roles distintos desde la migración 020.
 */

/** Valor marcado (Sí/No) con su razón y quién lo marcó, o "Sin marcar". */
export function Marca({ valor, textos, razon, usuario }) {
  if (valor === null) return <Etiqueta texto="Sin marcar" tono="ambar" />
  return (
    <div>
      <Etiqueta texto={textos[valor]} tono={valor === 'si' ? 'verde' : 'rojo'} />
      {razon && (
        <CeldaTexto ancho="w-48">
          <span className="text-xs text-gray-500">{razon}</span>
        </CeldaTexto>
      )}
      {usuario && <p className="text-xs text-gray-400">por {usuario}</p>}
    </div>
  )
}

/** Celda "Asistencia a formación": solo Agentes. */
export function MarcaAsistencia({ candidato: c }) {
  if (c.asistencia === null) return <span className="text-xs text-gray-400">No aplica</span>
  return (
    <Marca
      valor={c.asistencia.asistio === null ? null : c.asistencia.asistio ? 'si' : 'no'}
      textos={{ si: 'Asistió', no: 'No asistió' }}
      razon={c.asistencia.razon}
      usuario={c.asistencia.usuario}
    />
  )
}

/** Celda "Activo / baja". */
export function MarcaEstado({ candidato: c }) {
  return (
    <Marca
      valor={c.formacion.estado === null ? null : c.formacion.estado === 'activo' ? 'si' : 'no'}
      textos={{ si: 'Activo', no: 'Baja' }}
      razon={c.formacion.razon}
      usuario={c.formacion.usuario}
    />
  )
}

export function ModalMarca({ titulo, opciones, actual, ruta, cuerpo, ayudaRazon, aviso, candidato, onCerrar, onListo }) {
  const inicial = actual(candidato)
  const [valor, setValor] = useState(inicial.valor)
  const [razon, setRazon] = useState(inicial.razon ?? '')
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [positiva, negativa] = opciones
  const exigeRazon = valor === negativa.valor
  const mensajeAviso = aviso(candidato)

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await api.put(ruta(candidato), cuerpo(valor, exigeRazon ? razon.trim() : undefined))
      onListo()
    } catch (e) {
      setError(e.message)
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={titulo} descripcion={candidato.nombre} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { ...positiva, clase: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { ...negativa, clase: 'border-red-500 bg-red-50 text-red-700' },
          ].map((o) => (
            <button
              key={o.texto}
              type="button"
              onClick={() => setValor(o.valor)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                valor === o.valor ? o.clase : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {o.texto}
            </button>
          ))}
        </div>

        {exigeRazon && (
          <AreaTexto
            etiqueta="Razón"
            requerido
            filas={3}
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            ayuda={ayudaRazon}
          />
        )}

        {mensajeAviso && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{mensajeAviso}</p>
        )}

        <Error mensaje={error} />
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            variante={exigeRazon ? 'peligro' : 'primario'}
            onClick={guardar}
            cargando={guardando}
            disabled={valor === null || valor === undefined || (exigeRazon && razon.trim().length < 3)}
          >
            Guardar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
