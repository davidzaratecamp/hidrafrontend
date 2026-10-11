import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, Send } from 'lucide-react'
import { Boton, Error, Etiqueta, Modal, Progreso } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaDoble, Tabla } from '../ui/Tabla'
import { Texto } from '../ui/campos'
import { useRecurso } from '../../hooks/useRecurso'
import api from '../../services/api'
import { rutaLote } from './rutas'

/**
 * Contratación: envío de candidatos al Gestor Técnico (RRHH) y seguimiento de
 * los lotes. Piezas que usa la pantalla "Formación" (`formacion/Formacion.jsx`):
 * desde la migración 019 es el rol Formación quien envía, no Selección.
 *
 * En Gestor, RRHH completa lo que Hydra no tiene (contrato, salario, seguridad
 * social…) y los registra como empleados; cuando lo hace, Gestor avisa y el
 * candidato pasa a "contratado" aquí. Contrato de la integración:
 * `conexionhydra.md` en el repo de Gestor.
 */

export function ModalEnviarLote({ candidatos, onCerrar, onEnviado }) {
  const [nombre, setNombre] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const lote = await api.post('/contratacion/lotes', {
        nombre: nombre.trim(),
        ...(fechaIngreso ? { fechaIngresoSugerida: fechaIngreso } : {}),
        candidatoIds: candidatos.map((c) => c.id),
      })
      onEnviado(lote)
    } catch (err) {
      // CANDIDATOS_NO_ELEGIBLES trae { nombre, motivo } por candidato;
      // VALIDACION, { campo, mensaje } por campo.
      const detalles = (err.detalles ?? []).map((d) => (d.motivo ? `${d.nombre ?? `#${d.candidatoId}`}: ${d.motivo}` : d.mensaje))
      setError({ mensaje: err.message, detalles })
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo="Enviar a contratación"
      descripcion="RRHH recibirá estos candidatos en Gestor para completar sus datos y registrarlos como empleados."
      onCerrar={onCerrar}
    >
      <form onSubmit={enviar} className="space-y-4">
        <Texto
          etiqueta="Nombre del lote"
          requerido
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={150}
          placeholder="Ej. Formación Obamacare — 13 de octubre"
          ayuda="Así lo verá RRHH en su bandeja."
          autoFocus
        />
        <Texto
          etiqueta="Fecha de ingreso sugerida"
          type="date"
          value={fechaIngreso}
          onChange={(e) => setFechaIngreso(e.target.value)}
          ayuda="Opcional. RRHH la usa como fecha de ingreso inicial y puede cambiarla."
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">{candidatos.length} candidato(s)</p>
          <ul className="max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200 text-sm">
            {candidatos.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 px-3 py-2">
                <span className="text-gray-900">{c.nombre}</span>
                <span className="text-xs text-gray-500">{c.cargo}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error.mensaje}</p>
            {error.detalles.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {error.detalles.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Boton type="button" variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={guardando} disabled={nombre.trim().length < 3}>
            <Send className="h-4 w-4" /> Enviar {candidatos.length}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

// ------------------------------------------------------------------- lotes --

export function Lotes() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = useRecurso(() => api.get('/contratacion/lotes'), [], { inicial: [] })

  const columnas = [
    {
      clave: 'nombre',
      titulo: 'Lote',
      render: (l) => <CeldaDoble principal={l.nombre} secundario={l.lote_externo_id} />,
    },
    { clave: 'fecha_ingreso_sugerida', titulo: 'Ingreso sugerido', render: (l) => fecha(l.fecha_ingreso_sugerida) },
    {
      clave: 'avance',
      titulo: 'Contratados',
      render: (l) => {
        const activos = l.total - l.fuera_del_lote
        return <Progreso valor={l.registrados} total={activos} tono="bg-emerald-500" />
      },
    },
    {
      clave: 'estado',
      titulo: 'Estado en Gestor',
      render: (l) => (
        <div className="flex flex-wrap gap-1">
          {l.en_cola > 0 && <Etiqueta texto={`${l.en_cola} en cola`} tono="ambar" />}
          {l.recibidos > 0 && <Etiqueta texto={`${l.recibidos} en RRHH`} tono="azul" />}
          {l.registrados > 0 && <Etiqueta texto={`${l.registrados} contratado(s)`} tono="verde" />}
          {l.fuera_del_lote > 0 && <Etiqueta texto={`${l.fuera_del_lote} fuera`} />}
          {(l.con_error > 0 || l.envios_fallidos > 0) && <Etiqueta texto="Con errores" tono="rojo" />}
        </div>
      ),
    },
    { clave: 'creado_por', titulo: 'Enviado por', render: (l) => <CeldaDoble principal={l.creado_por ?? '—'} secundario={fecha(l.created_at, true)} /> },
  ]

  return (
    <div className="space-y-4">
      <Error mensaje={error} onReintentar={recargar} />
      <Tabla
        columnas={columnas}
        filas={datos ?? []}
        cargando={cargando}
        onFila={(l) => navigate(rutaLote(l.id))}
        iconoVacio={Inbox}
        vacio="Todavía no se ha enviado ningún lote."
      />
    </div>
  )
}
