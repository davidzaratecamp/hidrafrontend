import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta } from '../ui'
import { fecha } from '../ui/formato'
import { CeldaDoble, CeldaTexto, Filtros, Tabla } from '../ui/Tabla'
import { MarcaAsistencia, MarcaEstado, ModalMarca } from './marcas'
import { CONFIG_ASISTENCIA, CONFIG_ESTADO_AGENTE } from './marcas.config'
import { useRecurso } from '../../hooks/useRecurso'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

/**
 * Formación (rol Formación, migraciones 019 y 020).
 *
 * Solo Agentes, de cualquier campaña: son los únicos que pasan por formación.
 * Aparecen al quedar aprobados en decisión final y citados a formación, y se
 * marca si asistieron (razón si no) y si están activos o de baja (razón si
 * baja). Ninguno de los dos cambia el estado del candidato en el embudo.
 *
 * Quien asistió y quedó activo pasa a la cola de Contratación, que es quien lo
 * envía a RRHH. Formación lo sigue viendo hasta que se envíe, por si hay que
 * corregir algo.
 */

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

export default function Formacion() {
  const { hasPermission } = useAuth()
  const verPerfil = hasPermission('ver_candidatos')

  const { datos, cargando, error, recargar } = useRecurso(() => api.get('/formacion/candidatos'), [], {
    inicial: [],
  })
  const [filtro, setFiltro] = useState('todos')
  const [editando, setEditando] = useState(null) // { candidato, config }

  const candidatos = datos ?? []
  const visibles = candidatos.filter((c) => pasaFiltro(c, filtro))
  const listos = candidatos.filter((c) => c.elegible).length

  const columnas = [
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
    { clave: 'citado', titulo: 'Citado a formación', render: (c) => fecha(c.fechaIngresoFormacion) },
    { clave: 'asistencia', titulo: 'Asistencia', render: (c) => <MarcaAsistencia candidato={c} /> },
    { clave: 'formacion', titulo: 'Estado', render: (c) => <MarcaEstado candidato={c} /> },
    {
      clave: 'resultado',
      titulo: 'Contratación',
      render: (c) =>
        c.elegible ? (
          <Etiqueta texto="Pasa a Contratación" tono="verde" />
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
          <Boton variante="secundario" onClick={() => setEditando({ candidato: c, config: CONFIG_ASISTENCIA })}>
            Asistencia
          </Boton>
          <Boton variante="secundario" onClick={() => setEditando({ candidato: c, config: CONFIG_ESTADO_AGENTE })}>
            Activo / baja
          </Boton>
        </div>
      ),
    },
  ]

  return (
    <Layout titulo="Formación" descripcion="Asistencia y estado de los Agentes en formación">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Filtros opciones={FILTROS} valor={filtro} onCambio={setFiltro} />
          <p className="text-sm text-gray-600">
            {listos === 0 ? 'Nadie ha pasado a Contratación todavía.' : `${listos} pasan a Contratación.`}
          </p>
        </div>

        <Error mensaje={error} onReintentar={recargar} />

        <Tabla
          columnas={columnas}
          filas={visibles}
          cargando={cargando}
          iconoVacio={GraduationCap}
          vacio={filtro === 'todos' ? 'No hay Agentes en formación.' : 'Ningún candidato en este filtro.'}
        />

        {editando && (
          <ModalMarca
            {...editando.config}
            candidato={editando.candidato}
            onCerrar={() => setEditando(null)}
            onListo={() => {
              setEditando(null)
              recargar()
            }}
          />
        )}
      </div>
    </Layout>
  )
}
