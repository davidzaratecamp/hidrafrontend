import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, UserCheck } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaDoble, CeldaTexto, Filtros, Tabla } from '../ui/Tabla'
import { MarcaAsistencia, MarcaEstado, ModalMarca } from '../formacion/marcas'
import { CONFIG_ESTADO_STAFF } from '../formacion/marcas.config'
import { Lotes, ModalEnviarLote } from './Contratacion'
import { rutaLote } from './rutas'
import { useRecurso } from '../../hooks/useRecurso'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

/**
 * Contratación (rol Contratación, migración 020): quienes se van a contratar y
 * su envío a RRHH (Gestor Técnico).
 *
 *   - Staff aprobado en decisión final y marcado como contratación. Este rol
 *     marca si sigue activo o se dio de baja (razón si baja).
 *   - Agente que pasó la formación (asistió y quedó activo, lo marca el rol
 *     Formación). Aquí solo se envía.
 *
 * Solo los activos se pueden enviar; eso lo decide el backend.
 */

const VISTAS = [
  { valor: 'por_contratar', etiqueta: 'Por contratar' },
  { valor: 'lotes', etiqueta: 'Lotes enviados' },
]

export default function PantallaContratacion() {
  const [vista, setVista] = useState('por_contratar')

  return (
    <Layout titulo="Contratación" descripcion="Staff y Agentes que pasaron formación, y envío a RRHH (Gestor Técnico)">
      <div className="space-y-4">
        <Filtros opciones={VISTAS} valor={vista} onCambio={setVista} />
        {vista === 'por_contratar' ? <PorContratar /> : <Lotes />}
      </div>
    </Layout>
  )
}

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'staff', etiqueta: 'Staff' },
  { valor: 'agente', etiqueta: 'Agentes' },
  { valor: 'listos', etiqueta: 'Listos para enviar' },
]

const pasaFiltro = (c, filtro) => {
  if (filtro === 'todos') return true
  if (filtro === 'listos') return c.elegible
  return c.tipo === filtro
}

function PorContratar() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const verPerfil = hasPermission('ver_candidatos')

  const { datos, cargando, error, recargar } = useRecurso(() => api.get('/formacion/por-contratar'), [], {
    inicial: [],
  })
  const [filtro, setFiltro] = useState('todos')
  const [seleccion, setSeleccion] = useState(new Set())
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(null)

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
          <Etiqueta texto={c.tipo === 'agente' ? 'Agente · formación' : 'Staff · contratación'} tono={c.tipo === 'agente' ? 'azul' : 'gris'} />
          <p className="mt-1 text-xs text-gray-500">{fecha(c.fechaIngresoFormacion)}</p>
        </div>
      ),
    },
    { clave: 'asistencia', titulo: 'Asistencia formación', render: (c) => <MarcaAsistencia candidato={c} /> },
    { clave: 'formacion', titulo: 'Estado', render: (c) => <MarcaEstado candidato={c} /> },
    {
      clave: 'envio',
      titulo: 'Envío',
      render: (c) =>
        c.elegible ? (
          <div className="flex flex-col items-start gap-1">
            <Etiqueta texto="Listo para enviar" tono="verde" />
            {c.antecedentesFaltantes?.length > 0 && (
              <span className="text-xs text-amber-700" title={c.antecedentesFaltantes.join(', ')}>
                Sin {c.antecedentesFaltantes.length} antecedente(s): pedirá nota
              </span>
            )}
          </div>
        ) : (
          <CeldaTexto ancho="w-48">
            <span className="text-xs text-gray-500">{c.motivoNoElegible}</span>
          </CeldaTexto>
        ),
    },
    {
      clave: 'acciones',
      titulo: '',
      // Activo/baja de Agentes es de Formación: aquí solo se marca a Staff.
      render: (c) =>
        c.tipo === 'staff' ? (
          <div className="flex justify-end">
            <Boton variante="secundario" onClick={() => setEditando(c)}>
              Activo / baja
            </Boton>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Filtros opciones={FILTROS} valor={filtro} onCambio={setFiltro} />
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
      </div>

      <Error mensaje={error} onReintentar={recargar} />

      <Tabla
        columnas={columnas}
        filas={visibles}
        cargando={cargando}
        iconoVacio={UserCheck}
        vacio={filtro === 'todos' ? 'No hay candidatos pendientes de enviar a contratación.' : 'Ningún candidato en este filtro.'}
      />

      {editando && (
        <ModalMarca
          {...CONFIG_ESTADO_STAFF}
          candidato={editando}
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
