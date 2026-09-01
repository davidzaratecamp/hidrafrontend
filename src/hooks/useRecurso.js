import { useCallback, useEffect, useState } from 'react'

/**
 * Carga de datos remotos: estado, error y recarga, en un solo lugar.
 *
 * Siete pantallas repetían exactamente el mismo bloque —`useState` para datos,
 * otro para cargando, otro para error, un `useCallback` con try/catch/finally y
 * un `useEffect` que lo dispara—. Cada copia era una oportunidad de olvidar el
 * `finally` o de dejar un `setState` tras desmontar el componente.
 *
 * @param {() => Promise<T>} peticion Función que trae los datos.
 * @param {unknown[]} deps Dependencias: cambiar una vuelve a pedir.
 * @param {{inicial?: T, activo?: boolean}} [opciones]
 *
 * @example
 *   const { datos, cargando, error, recargar } = useRecurso(
 *     () => api.get(`/candidatos/${id}`), [id]
 *   )
 */
export function useRecurso(peticion, deps = [], { inicial = null, activo = true } = {}) {
  const [datos, setDatos] = useState(inicial)
  const [cargando, setCargando] = useState(activo)
  const [error, setError] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- las deps las controla quien llama
  const ejecutar = useCallback(peticion, deps)

  const [recargas, setRecargas] = useState(0)
  const recargar = useCallback(() => setRecargas((n) => n + 1), [])

  useEffect(() => {
    if (!activo) return undefined

    // Evita escribir estado si el componente se desmontó o las deps cambiaron
    // mientras la petición estaba en vuelo: una respuesta vieja no debe pisar
    // a una nueva.
    let vigente = true
    setCargando(true)
    setError(null)

    ejecutar()
      .then((resultado) => {
        if (vigente) setDatos(resultado)
      })
      .catch((e) => {
        if (vigente) setError(e.message)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [ejecutar, recargas, activo])

  return { datos, cargando, error, recargar, setDatos }
}

/**
 * Igual que `useRecurso`, para endpoints paginados que devuelven `{ datos, meta }`.
 */
export function useRecursoPaginado(peticion, deps = []) {
  const { datos, ...resto } = useRecurso(peticion, deps, { inicial: { datos: [], meta: null } })
  return { items: datos?.datos ?? [], meta: datos?.meta ?? null, ...resto }
}
