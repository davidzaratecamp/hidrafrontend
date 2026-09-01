import { useEffect, useState } from 'react'
import api from '../services/api'

/**
 * Catálogos del backend, cacheados en memoria por sesión de página.
 *
 * Son datos que cambian por migración, no en caliente, así que no tiene sentido
 * volver a pedirlos en cada pantalla: antes cada componente hacía su propio
 * `fetch('/catalogos')` al montarse.
 */
let cache = null
let enVuelo = null

export function useCatalogos() {
  const [catalogos, setCatalogos] = useState(cache)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache) return
    let vigente = true

    enVuelo ??= api.get('/catalogos')
    enVuelo
      .then((datos) => {
        cache = datos
        if (vigente) setCatalogos(datos)
      })
      .catch((e) => {
        enVuelo = null
        if (vigente) setError(e.message)
      })

    return () => {
      vigente = false
    }
  }, [])

  return { catalogos: catalogos ?? {}, listo: Boolean(catalogos), error }
}

/** Cargos habilitados para un cliente. La relación es M:N en la base. */
export function cargosDe(catalogos, cliente) {
  return catalogos.cargos_por_cliente?.[cliente] ?? []
}
