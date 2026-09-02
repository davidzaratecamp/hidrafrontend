import {
  Activity,
  Archive,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  FileText,
  KeyRound,
  LayoutDashboard,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'

/**
 * Definición del menú, en un solo lugar.
 *
 * Antes había TRES sidebars con arreglos fijos en código (`AdminSidebar.jsx`,
 * `Sidebar.jsx`, `SidebarSeleccion.jsx`) que podían divergir —y divergían— de
 * los permisos reales del backend. El caso más visible: el administrador tenía
 * todos los permisos y las rutas lo dejaban entrar a Dashboard, Candidatos,
 * Estadísticas y Gestión de Usuarios, pero su sidebar solo listaba dos
 * opciones, así que nunca llegaba al resto.
 *
 * Ahora el menú se DERIVA de `user.permisos`. Un administrador ve todo porque
 * tiene todos los permisos, no porque haya un `if` que lo diga; y dar acceso a
 * un rol nuevo es marcar una casilla en `rol_permisos`, sin tocar el frontend.
 *
 * `permiso`: se muestra si el usuario lo tiene.
 * `permisos`: se muestra si tiene AL MENOS UNO de la lista.
 * Sin ninguno de los dos: visible para cualquier sesión.
 */
export const SECCIONES = [
  {
    titulo: 'Mi gestión',
    items: [
      {
        path: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        // Primero en el menú (y primer item visible del array, así que
        // también el destino de `RoleRedirect` tras iniciar sesión) para
        // quien lo tiene: es la pantalla de inicio del administrador
        // (decisión de negocio, 2026-09-02). `ver_usuarios` es hoy exclusivo
        // de Administrador — mismo patrón que "Agenda de entrevistas" y
        // "Trazabilidad del equipo" más abajo, no hay permiso propio.
        permiso: 'ver_usuarios',
      },
      {
        path: '/seleccion/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard de Selección',
        // Primero en el menú para quien lo tiene (pedido explícito,
        // 2026-09-01): es lo primero que Selección necesita ver al entrar,
        // no algo enterrado bajo "Mi gestión" (que para ellos, aparte de
        // esto, solo trae Candidatos y Base histórica).
        //
        // `ver_dashboard_seleccion` (migración 013, 2026-09-02): antes era
        // `evaluar_candidatos`, que Administrador también tiene — con eso
        // Administrador heredaba este panel como si fuera su pantalla de
        // inicio, que ya no es el caso (tiene la suya, arriba).
        permiso: 'ver_dashboard_seleccion',
      },
      {
        path: '/trazabilidad',
        icon: Activity,
        label: 'Mi trazabilidad',
        // Es cartera por `reclutador_id`: Selección nunca es dueño de un
        // candidato, así que esta pantalla siempre le sale vacía (pedido
        // explícito, 2026-09-01). Se gatea por `crear_candidatos` —que solo
        // tiene Reclutamiento y Administrador, aunque la ruta en sí solo
        // exige `ver_dashboard`— en vez de por rol, mismo patrón que
        // "Agenda de entrevistas" más abajo. Selección tiene su propio
        // "Dashboard de Selección".
        permiso: 'crear_candidatos',
      },
      {
        path: '/candidatos/nuevo',
        icon: UserPlus,
        label: 'Nuevo candidato',
        permiso: 'crear_candidatos',
      },
      {
        path: '/candidatos',
        icon: Users,
        label: 'Candidatos',
        permiso: 'ver_candidatos',
      },
      {
        path: '/historico',
        icon: Archive,
        label: 'Base histórica',
        permiso: 'ver_candidatos',
      },
    ],
  },
  {
    titulo: 'Selección',
    items: [
      // "Agenda de entrevistas" se quitó del menú también para Administrador
      // (pedido explícito, 2026-09-02) — ya no le quedaba ningún rol que la
      // viera: Reclutamiento y Selección la habían perdido antes (2026-09-01)
      // porque citar, asistencia y seguimiento se hacen desde Candidatos/
      // Candidatos Staff. La ruta (`/seleccion/agenda`) sigue viva por si
      // algo la enlaza directo, mismo patrón que el resto de este archivo.
      {
        path: '/seleccion/evaluaciones',
        icon: ClipboardCheck,
        // Antes "Evaluaciones" (renombrado, decisión de negocio, 2026-09-02):
        // ya solo cubre cargo Agente (evaluación de 5 criterios + decisión
        // final), desde que "Candidatos Staff" se llevó el resto.
        label: 'Clínica Agentes',
        permiso: 'evaluar_candidatos',
      },
      {
        path: '/seleccion/staff',
        icon: Briefcase,
        label: 'Candidatos Staff',
        // Reemplaza a la vista "Sin evaluación (no Agente)" que tenía
        // "Clínica Agentes": todo candidato de cargo distinto a Agente, con
        // el mismo permiso que esa pantalla —exclusivo de Selección y
        // Administrador— para controlar quién VE el enlace (mismo patrón que
        // el resto de este menú).
        permiso: 'evaluar_candidatos',
      },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      {
        path: '/trazabilidad/equipo',
        icon: BarChart3,
        label: 'Trazabilidad del equipo',
        permiso: 'ver_perfiles_completos',
      },
      {
        path: '/usuarios',
        icon: UsersRound,
        label: 'Usuarios',
        permiso: 'ver_usuarios',
      },
      {
        path: '/roles',
        icon: KeyRound,
        label: 'Roles y permisos',
        permiso: 'ver_usuarios',
      },
    ],
  },
  {
    titulo: 'Otros',
    items: [{ path: '/desprendibles', icon: FileText, label: 'Desprendibles' }],
  },
]

/** Aplica los permisos del usuario y descarta las secciones que quedan vacías. */
export function menuVisible({ hasPermission, hasAnyPermission }) {
  return SECCIONES.map((seccion) => ({
    ...seccion,
    items: seccion.items.filter((item) => {
      if (item.permisos) return hasAnyPermission(item.permisos)
      if (item.permiso) return hasPermission(item.permiso)
      return true
    }),
  })).filter((seccion) => seccion.items.length > 0)
}
