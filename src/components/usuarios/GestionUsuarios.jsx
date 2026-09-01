import { useState } from 'react'
import { Calendar, Mail, Shield, UserCheck, UserPlus, Users } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error, Etiqueta, ModalConfirmacion } from '../ui'
import { fecha } from '../ui/formato'
import { Buscador, Tabla } from '../ui/Tabla'
import { useAuth } from '../../context/useAuth'
import { useRecurso, useRecursoPaginado } from '../../hooks/useRecurso'
import { useBusquedaDiferida } from '../../hooks/useBusquedaDiferida'
import api from '../../services/api'
import ModalUsuario from './ModalUsuario'

/**
 * Gestión de usuarios.
 *
 * Unifica las tres pantallas anteriores (reclutadores del admin, usuarios de
 * selección y alta genérica), que eran casi idénticas y respondían a tres
 * endpoints distintos del backend.
 *
 * Recupera de la interfaz vieja lo que se había perdido en la reestructuración:
 * las tarjetas de conteo por rol, el avatar con iniciales y los iconos de correo
 * y último acceso. Dos diferencias respecto de aquella:
 *
 *   - Las tarjetas se calculan en el SERVIDOR (`/usuarios/resumen-roles`). La
 *     vieja las contaba sobre el array cargado, algo que aquí daría el total de
 *     la página en curso: el listado es paginado.
 *   - Los roles ya no son dos fijos ('reclutador' y 'seleccion') escritos en el
 *     código: salen del catálogo, y un usuario puede tener varios.
 *
 * Las tarjetas son además el filtro por rol, siguiendo el mismo patrón que las
 * pestañas de la lista de candidatos: el conteo y el filtro son el mismo control,
 * en vez de repetir la información en un desplegable aparte.
 */

/** Color e icono por rol. El desconocido cae en un gris neutro, no rompe. */
const ESTILO_ROL = {
  administrador: {
    icono: Shield,
    icon: 'text-indigo-600',
    avatar: 'bg-indigo-100 text-indigo-700',
    etiqueta: 'bg-indigo-100 text-indigo-800',
  },
  seleccion: {
    icono: Shield,
    icon: 'text-purple-600',
    avatar: 'bg-purple-100 text-purple-700',
    etiqueta: 'bg-purple-100 text-purple-800',
  },
  reclutamiento: {
    icono: UserCheck,
    icon: 'text-emerald-600',
    avatar: 'bg-emerald-100 text-emerald-700',
    etiqueta: 'bg-emerald-100 text-emerald-800',
  },
}

const estiloDe = (codigo) =>
  ESTILO_ROL[codigo] ?? {
    icono: Users,
    icon: 'text-gray-500',
    avatar: 'bg-gray-100 text-gray-600',
    etiqueta: 'bg-gray-100 text-gray-700',
  }

/** Iniciales para el avatar: primera letra del nombre y del primer apellido. */
function iniciales(nombreCompleto) {
  const palabras = String(nombreCompleto ?? '').trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  const elegidas = palabras.length === 1 ? [palabras[0]] : [palabras[0], palabras[1]]
  return elegidas.map((p) => p[0]).join('').toUpperCase()
}

/** Tarjeta de conteo. Es también el filtro por rol. */
function Tarjeta({ icono: Icono, color, etiqueta, valor, activa, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border bg-white p-5 text-left transition-colors ${
        activa ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <Icono className={`h-8 w-8 shrink-0 ${color}`} />
      <div>
        <p className="text-sm font-medium text-gray-500">{etiqueta}</p>
        <p className="text-2xl font-semibold text-gray-900">{valor}</p>
      </div>
    </button>
  )
}

export default function GestionUsuarios() {
  const { hasPermission, user } = useAuth()

  const [rol, setRol] = useState('')
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)

  const { texto, setTexto, busqueda } = useBusquedaDiferida(350, () => setPagina(1))

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () => api.getConMeta(`/usuarios${api.qs({ pagina, porPagina: 20, busqueda, rol })}`),
    [pagina, busqueda, rol]
  )

  const { datos: roles } = useRecurso(() => api.get('/roles'), [], { inicial: [] })

  // Se recarga tras cada alta o cambio de estado: si no, las tarjetas quedarían
  // contando lo de antes mientras la tabla ya muestra lo nuevo.
  const { datos: resumen, recargar: recargarResumen } = useRecurso(
    () => api.get('/usuarios/resumen-roles'),
    [],
    { inicial: { total: 0, activos: 0, porRol: [] } }
  )

  const refrescar = () => {
    recargar()
    recargarResumen()
  }

  const filtrarPor = (codigo) => {
    setRol((actual) => (actual === codigo ? '' : codigo))
    setPagina(1)
  }

  /**
   * Desactivar pide confirmación; reactivar no.
   *
   * La pantalla vieja preguntaba antes de dar de baja, y con razón: el usuario
   * pierde el acceso de inmediato. Reactivar no necesita confirmarse porque no
   * quita nada.
   */
  async function cambiarActivo(usuario) {
    setErrorAccion(null)
    try {
      if (usuario.activo) await api.delete(`/usuarios/${usuario.id}`)
      else await api.post(`/usuarios/${usuario.id}/reactivar`)
      setConfirmando(null)
      refrescar()
    } catch (e) {
      setErrorAccion(e.message)
      setConfirmando(null)
    }
  }

  const columnas = [
    {
      clave: 'usuario',
      titulo: 'Usuario',
      render: (u) => {
        const estilo = estiloDe(u.roles[0]?.codigo)
        return (
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${estilo.avatar}`}
            >
              {iniciales(u.nombre_completo)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{u.nombre_completo}</p>
              <p className="flex items-center gap-1 truncate text-sm text-gray-500">
                <Mail className="h-4 w-4 shrink-0" />
                {u.email}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      clave: 'roles',
      titulo: 'Roles',
      // Varios roles por usuario: se listan todos.
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 ? (
            <span className="text-xs text-gray-400">sin roles</span>
          ) : (
            u.roles.map((r) => (
              <Etiqueta key={r.codigo} texto={r.nombre} color={estiloDe(r.codigo).etiqueta} />
            ))
          )}
        </div>
      ),
    },
    {
      // Columna "Candidatos Asignados" de la pantalla vieja de reclutadores.
      // Solo aplica a quien puede tener cartera: para un administrador o un
      // psicólogo un cero no significa nada.
      clave: 'cartera',
      titulo: 'Candidatos',
      render: (u) =>
        u.roles.some((r) => r.codigo === 'reclutamiento') ? (
          <span className="text-sm text-gray-900">{u.cartera ?? 0}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      clave: 'ultimo_acceso',
      titulo: 'Último acceso',
      render: (u) => (
        <span className="flex items-center gap-1 whitespace-nowrap text-sm text-gray-500">
          <Calendar className="h-4 w-4 shrink-0" />
          {/* "Nunca" y no un guion: distingue a quien no ha entrado todavía de
              un dato que falta. */}
          {u.ultimo_acceso ? fecha(u.ultimo_acceso, true) : 'Nunca'}
        </span>
      ),
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (u) => (
        <Etiqueta texto={u.activo ? 'Activo' : 'Inactivo'} tono={u.activo ? 'verde' : 'rojo'} />
      ),
    },
    {
      clave: 'acciones',
      titulo: 'Acciones',
      alineacion: 'right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          {hasPermission('editar_usuarios') && (
            <Boton variante="secundario" className="!py-1.5" onClick={() => setEditando(u)}>
              Editar
            </Boton>
          )}
          {/* Nadie puede desactivarse a sí mismo: el backend también lo impide. */}
          {hasPermission('eliminar_usuarios') && u.id !== user?.id && (
            <Boton
              variante={u.activo ? 'peligro' : 'secundario'}
              className="!py-1.5"
              onClick={() => (u.activo ? setConfirmando(u) : cambiarActivo(u))}
            >
              {u.activo ? 'Desactivar' : 'Reactivar'}
            </Boton>
          )}
        </div>
      ),
    },
  ]

  return (
    <Layout
      titulo="Gestión de usuarios"
      descripcion="Administra las cuentas de reclutamiento, selección y administración"
      acciones={
        hasPermission('crear_usuarios') && (
          <Boton onClick={() => setEditando({})}>
            <UserPlus className="h-4 w-4" /> Nuevo usuario
          </Boton>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tarjeta
            icono={Users}
            color="text-blue-600"
            etiqueta="Usuarios activos"
            valor={resumen?.activos ?? 0}
            activa={rol === ''}
            onClick={() => filtrarPor('')}
          />
          {(resumen?.porRol ?? []).map((r) => {
            const estilo = estiloDe(r.codigo)
            return (
              <Tarjeta
                key={r.codigo}
                icono={estilo.icono}
                color={estilo.icon}
                etiqueta={r.nombre}
                valor={r.activos}
                activa={rol === r.codigo}
                onClick={() => filtrarPor(r.codigo)}
              />
            )
          })}
        </div>

        <Buscador
          valor={texto}
          onCambio={setTexto}
          placeholder="Buscar por nombre, correo o documento…"
        />

        <Error mensaje={error ?? errorAccion} onReintentar={refrescar} />

        <Tabla
          columnas={columnas}
          filas={items}
          cargando={cargando}
          meta={meta}
          onPagina={setPagina}
          iconoVacio={Users}
          vacio="No hay usuarios con estos filtros."
        />
      </div>

      {editando && (
        <ModalUsuario
          usuario={editando}
          roles={roles ?? []}
          onCerrar={() => setEditando(null)}
          onListo={() => {
            setEditando(null)
            refrescar()
          }}
        />
      )}

      {confirmando && (
        <ModalConfirmacion
          titulo="Desactivar usuario"
          descripcion={confirmando.nombre_completo}
          advertencia="Perderá el acceso al sistema de inmediato. Sus candidatos no se borran y se pueden reasignar. Podrás reactivarlo después."
          textoConfirmar="Desactivar"
          onConfirmar={() => cambiarActivo(confirmando)}
          onCerrar={() => setConfirmando(null)}
        />
      )}
    </Layout>
  )
}
