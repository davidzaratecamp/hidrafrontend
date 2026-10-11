import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Send } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta, Modal } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaDoble, CeldaTexto, Filtros, Tabla } from '../ui/Tabla'
import { AreaTexto } from '../ui/campos'
import { Lotes, ModalEnviarLote } from '../contratacion/Contratacion'
import { rutaLote } from '../contratacion/rutas'
import { useRecurso } from '../../hooks/useRecurso'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

/**
 * Formación (rol Formación, migración 019).
 *
 * Solo muestra a quienes pasan a formación y todavía no se han enviado a
 * contratación:
 *   - Agente: aprobado en decisión final y citado a formación. Se marca si
 *     asistió (razón si no) y si está activo o de baja (razón si baja).
 *   - Staff: aprobado en decisión final y marcado como contratación. Solo
 *     activo o baja.
 * Ninguno de los dos cambia el estado del candidato en el embudo: es una nota
 * del expediente. Lo que sí cambia es si se puede enviar a contratación (solo
 * activos y, si es Agente, que asistieron); eso lo decide el backend.
 */

const VISTAS = [
  { valor: 'formacion', etiqueta: 'En formación', permiso: 'gestionar_formacion' },
  { valor: 'lotes', etiqueta: 'Lotes enviados', permiso: 'enviar_contratacion' },
]

export default function Formacion() {
  const { hasPermission } = useAuth()
  const vistas = VISTAS.filter((v) => hasPermission(v.permiso))
  const [vista, setVista] = useState(vistas[0]?.valor)

  return (
    <Layout
      titulo="Formación"
      descripcion="Asistencia y estado de los candidatos en formación, y envío a contratación (Gestor Técnico)"
    >
      <div className="space-y-4">
        {vistas.length > 1 && <Filtros opciones={vistas} valor={vista} onCambio={setVista} />}
        {vista === 'formacion' ? <EnFormacion /> : <Lotes />}
      </div>
    </Layout>
  )
}

// ------------------------------------------------------------- en formación --

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'sin_marcar', etiqueta: 'Sin marcar' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'baja', etiqueta: 'De baja' },
]

const pasaFiltro = (c, filtro) => {
  if (filtro === 'todos') return true
  if (filtro === 'sin_marcar') return c.formacion.estado === null
  return c.formacion.estado === filtro
}

function EnFormacion() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const puedeEnviar = hasPermission('enviar_contratacion')
  const verPerfil = hasPermission('ver_candidatos')

  const { datos, cargando, error, recargar } = useRecurso(() => api.get('/formacion/candidatos'), [], {
    inicial: [],
  })
  const [filtro, setFiltro] = useState('todos')
  const [seleccion, setSeleccion] = useState(new Set())
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(null) // { candidato, tipo: 'asistencia' | 'estado' }

  const candidatos = datos ?? []
  const visibles = candidatos.filter((c) => pasaFiltro(c, filtro))
  const elegibles = candidatos.filter((c) => c.elegible)
  // Lo seleccionado se recalcula sobre los datos actuales: si alguien pasa a
  // baja después de marcarlo, deja de contar.
  const seleccionados = elegibles.filter((c) => seleccion.has(c.id))
  const elegiblesVisibles = visibles.filter((c) => c.elegible)
  const todosMarcados = elegiblesVisibles.length > 0 && elegiblesVisibles.every((c) => seleccion.has(c.id))

  const alternar = (id) =>
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })

  const alternarTodos = () =>
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      for (const c of elegiblesVisibles) {
        if (todosMarcados) siguiente.delete(c.id)
        else siguiente.add(c.id)
      }
      return siguiente
    })

  const columnas = [
    ...(puedeEnviar
      ? [
          {
            clave: 'seleccion',
            titulo: (
              <input
                type="checkbox"
                aria-label="Seleccionar todos los listos para enviar"
                checked={todosMarcados}
                disabled={elegiblesVisibles.length === 0}
                onChange={alternarTodos}
                className="h-4 w-4"
              />
            ),
            render: (c) =>
              c.elegible ? (
                <input
                  type="checkbox"
                  aria-label={`Seleccionar a ${c.nombre}`}
                  checked={seleccion.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="h-4 w-4"
                />
              ) : null,
          },
        ]
      : []),
    {
      clave: 'nombre',
      titulo: 'Candidato',
      render: (c) => (
        <>
          {verPerfil ? (
            <Link to={`/candidatos/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
              {c.nombre}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{c.nombre}</span>
          )}
          <p className="text-xs text-gray-500">{c.numeroDocumento ?? 'Sin documento'}</p>
        </>
      ),
    },
    { clave: 'cliente', titulo: 'Campaña / cargo', render: (c) => <CeldaDoble principal={c.cliente} secundario={c.cargo} /> },
    {
      clave: 'tipo',
      titulo: 'Ingreso',
      render: (c) => (
        <div>
          <Etiqueta texto={c.tipo === 'agente' ? 'Agente · citado' : 'Staff · contratación'} tono={c.tipo === 'agente' ? 'azul' : 'gris'} />
          <p className="mt-1 text-xs text-gray-500">{fecha(c.fechaIngresoFormacion)}</p>
        </div>
      ),
    },
    {
      clave: 'asistencia',
      titulo: 'Asistencia',
      render: (c) =>
        c.asistencia === null ? (
          <span className="text-xs text-gray-400">No aplica</span>
        ) : (
          <Marca
            valor={c.asistencia.asistio === null ? null : c.asistencia.asistio ? 'si' : 'no'}
            textos={{ si: 'Asistió', no: 'No asistió' }}
            razon={c.asistencia.razon}
            usuario={c.asistencia.usuario}
          />
        ),
    },
    {
      clave: 'formacion',
      titulo: 'Estado',
      render: (c) => (
        <Marca
          valor={c.formacion.estado === null ? null : c.formacion.estado === 'activo' ? 'si' : 'no'}
          textos={{ si: 'Activo', no: 'Baja' }}
          razon={c.formacion.razon}
          usuario={c.formacion.usuario}
        />
      ),
    },
    {
      clave: 'envio',
      titulo: 'Contratación',
      render: (c) =>
        c.elegible ? (
          <Etiqueta texto="Listo para enviar" tono="verde" />
        ) : (
          <CeldaTexto ancho="w-48">
            <span className="text-xs text-gray-500">{c.motivoNoElegible}</span>
          </CeldaTexto>
        ),
    },
    {
      clave: 'acciones',
      titulo: '',
      render: (c) => (
        <div className="flex justify-end gap-2">
          {c.tipo === 'agente' && (
            <Boton variante="secundario" onClick={() => setEditando({ candidato: c, tipo: 'asistencia' })}>
              Asistencia
            </Boton>
          )}
          <Boton variante="secundario" onClick={() => setEditando({ candidato: c, tipo: 'estado' })}>
            Activo / baja
          </Boton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Filtros opciones={FILTROS} valor={filtro} onCambio={setFiltro} />
        {puedeEnviar && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600">
              {elegibles.length === 0
                ? 'Nadie listo para enviar todavía.'
                : `${seleccionados.length} de ${elegibles.length} listo(s) seleccionado(s).`}
            </p>
            <Boton disabled={seleccionados.length === 0} onClick={() => setEnviando(true)}>
              <Send className="h-4 w-4" /> Enviar a contratación
            </Boton>
          </div>
        )}
      </div>

      <Error mensaje={error} onReintentar={recargar} />

      <Tabla
        columnas={columnas}
        filas={visibles}
        cargando={cargando}
        iconoVacio={GraduationCap}
        vacio={
          filtro === 'todos'
            ? 'No hay candidatos en formación pendientes de enviar a contratación.'
            : 'Ningún candidato en este filtro.'
        }
      />

      {editando && (
        <ModalMarca
          {...(editando.tipo === 'asistencia' ? CONFIG_ASISTENCIA : CONFIG_ESTADO)}
          candidato={editando.candidato}
          onCerrar={() => setEditando(null)}
          onListo={() => {
            setEditando(null)
            recargar()
          }}
        />
      )}

      {enviando && (
        <ModalEnviarLote
          candidatos={seleccionados}
          onCerrar={() => setEnviando(false)}
          onEnviado={(lote) => navigate(rutaLote(lote.id))}
        />
      )}
    </div>
  )
}

/** Valor marcado (Sí/No) con su razón y quién lo marcó, o "Sin marcar". */
function Marca({ valor, textos, razon, usuario }) {
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

// ------------------------------------------------------------------ modales --

// Asistencia (solo Agente) y activo/baja comparten la forma: dos opciones, la
// segunda exige razón. Cada una dice de dónde leer el valor actual y qué enviar.
const CONFIG_ASISTENCIA = {
  titulo: 'Asistencia a formación',
  opciones: [
    { valor: true, texto: 'Asistió' },
    { valor: false, texto: 'No asistió' },
  ],
  actual: (c) => ({ valor: c.asistencia.asistio, razon: c.asistencia.razon }),
  ruta: (c) => `/formacion/candidatos/${c.id}/asistencia`,
  cuerpo: (valor, razon) => ({ asistio: valor, razon }),
  ayudaRazon: 'Obligatoria si no asistió.',
  aviso: (c) =>
    c.formacion.estado === 'activo'
      ? 'Si marcas "No asistió", el candidato deja de estar activo.'
      : null,
}

const CONFIG_ESTADO = {
  titulo: 'Estado en formación',
  opciones: [
    { valor: 'activo', texto: 'Activo' },
    { valor: 'baja', texto: 'Baja' },
  ],
  actual: (c) => ({ valor: c.formacion.estado, razon: c.formacion.razon }),
  ruta: (c) => `/formacion/candidatos/${c.id}/estado`,
  cuerpo: (valor, razon) => ({ estado: valor, razon }),
  ayudaRazon: 'Obligatoria si se da de baja.',
  aviso: (c) =>
    c.tipo === 'agente' && c.asistencia.asistio !== true
      ? 'Para marcar Activo a un Agente primero debe tener la asistencia en "Asistió".'
      : null,
}

function ModalMarca({ titulo, opciones, actual, ruta, cuerpo, ayudaRazon, aviso, candidato, onCerrar, onListo }) {
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
