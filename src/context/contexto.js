import { createContext } from 'react'

/**
 * Contexto de sesión.
 *
 * En archivo propio para que `AuthContext.jsx` exporte solo el componente
 * provider: mezclar componentes y otros valores en un mismo archivo rompe el
 * hot-reload de React.
 */
export const AuthContext = createContext(null)
