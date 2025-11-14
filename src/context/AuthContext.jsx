import { createContext, useContext, useReducer, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false
      }
    case 'RESTORE_SESSION':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    default:
      return state
  }
}

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    try {
      const response = await fetch('http://200.91.204.54/api/auth/verificar-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({
          type: 'RESTORE_SESSION',
          payload: {
            user: data.usuario,
            token: token
          }
        })
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'LOGOUT' })
      }
    } catch (error) {
      console.error('Error verificando token:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const response = await fetch('http://200.91.204.54/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.usuario))
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: data.usuario,
            token: data.token
          }
        })

        // Redireccionar según el rol
        redirectByRole(data.usuario.rol)
      } else {
        throw new Error(data.error || 'Error al iniciar sesión')
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_ERROR',
        payload: error.message
      })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
    window.location.href = '/login'
  }

  const redirectByRole = (rol) => {
    switch (rol) {
      case 'administrador':
      case 'reclutador':
        window.location.href = '/hydra/reclutador/dashboard'
        break
      case 'seleccion':
        window.location.href = '/hydra/seleccion/candidatos'
        break
      default:
        window.location.href = '/hydra/reclutador/dashboard'
    }
  }

  const hasPermission = (permission) => {
    if (!state.user || !state.user.permisos) return false
    return state.user.permisos.includes(permission)
  }

  const isRole = (role) => {
    if (!state.user) return false
    return state.user.rol === role
  }

  const value = {
    ...state,
    login,
    logout,
    hasPermission,
    isRole,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}