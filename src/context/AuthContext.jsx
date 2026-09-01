import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { AuthContext } from './contexto'
import api from '../services/api'

/**
 * Estado de sesión.
 *
 * Cambios respecto a la versión anterior:
 *   - Un usuario tiene VARIOS roles. `user.rol` (singular) desaparece;
 *     `isRole` pasa a comprobar contra el arreglo `user.roles`.
 *   - La sesión se restaura con `GET /api/auth/perfil`, que devuelve el
 *     contexto ya resuelto (roles + permisos efectivos, unión de todos sus
 *     roles). Antes era un POST a `verificar-token`.
 *   - Ya no hay URLs de API aquí: todo pasa por el cliente `api`.
 *   - Sin `console.log` del correo ni de la respuesta del login.
 */

const estadoInicial = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
}

function reducer(estado, accion) {
  switch (accion.type) {
    case 'CARGANDO':
      return { ...estado, loading: true, error: null }
    case 'SESION_OK':
      return {
        ...estado,
        loading: false,
        isAuthenticated: true,
        user: accion.payload.user,
        token: accion.payload.token,
        error: null,
      }
    case 'ERROR':
      return { ...estado, loading: false, error: accion.payload }
    case 'SIN_SESION':
      return { ...estadoInicial, loading: false }
    default:
      return estado
  }
}

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial)

  const restaurarSesion = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      dispatch({ type: 'SIN_SESION' })
      return
    }

    try {
      // El perfil se pide al backend en cada arranque en vez de confiar en el
      // `user` guardado en localStorage: así un cambio de roles o una baja del
      // usuario tienen efecto inmediato.
      const user = await api.get('/auth/perfil')
      localStorage.setItem('user', JSON.stringify(user))
      dispatch({ type: 'SESION_OK', payload: { user, token } })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch({ type: 'SIN_SESION' })
    }
  }, [])

  useEffect(() => {
    restaurarSesion()
  }, [restaurarSesion])

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'CARGANDO' })
    try {
      const { token, usuario } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(usuario))
      dispatch({ type: 'SESION_OK', payload: { user: usuario, token } })
      return usuario
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message })
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    // El JWT no tiene estado en el servidor: cerrar sesión es descartarlo.
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'SIN_SESION' })
    window.location.href = '/login'
  }, [])

  const valor = useMemo(() => {
    const permisos = estado.user?.permisos ?? []
    const roles = estado.user?.roles ?? []

    return {
      ...estado,
      login,
      logout,
      restaurarSesion,

      /** ¿Tiene este permiso? Es la unión de los de todos sus roles. */
      hasPermission: (permiso) => permisos.includes(permiso),

      /** ¿Tiene alguno de estos permisos? */
      hasAnyPermission: (...lista) => lista.flat().some((p) => permisos.includes(p)),

      /** ¿Tiene este rol? Ahora un usuario puede tener varios. */
      isRole: (rol) => roles.includes(rol),

      hasAnyRole: (...lista) => lista.flat().some((r) => roles.includes(r)),
    }
  }, [estado, login, logout, restaurarSesion])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
