/**
 * Cliente de la API.
 *
 * Cambios respecto a la versión anterior:
 *   - La URL sale de `VITE_API_URL`, no de una IP escrita en el código
 *     (`import.meta.env.DEV ? localhost : 'http://200.91.204.54:3000/api'`,
 *     repetida además en AuthContext).
 *   - TODOS los verbos exponen el error real del backend. Antes `get()` y
 *     `post()` lanzaban solo `Error: 400`, descartando el mensaje que el
 *     servidor sí enviaba: cualquier fallo de creación se veía en consola como
 *     un número sin causa.
 *   - El backend responde siempre con el mismo sobre — `{ ok, datos, meta }` o
 *     `{ ok:false, error:{ codigo, mensaje, detalles } }` — así que el
 *     desempaquetado y el manejo de error viven aquí una sola vez.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

/** Error con el detalle que manda el backend, para que la UI pueda ramificar. */
export class ApiError extends Error {
  constructor({ mensaje, codigo, detalles, estado }) {
    super(mensaje)
    this.name = 'ApiError'
    this.codigo = codigo
    this.detalles = detalles
    this.estado = estado
  }

  /** Errores de validación: lista de `{ campo, mensaje }`. */
  get erroresDeCampo() {
    return Array.isArray(this.detalles) ? this.detalles : []
  }
}

class ApiService {
  #cabeceras(extra = {}) {
    const token = localStorage.getItem('token')
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    }
  }

  #cerrarSesion() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  async #peticion(metodo, ruta, { cuerpo, formData, señal } = {}) {
    const esFormData = formData instanceof FormData

    let respuesta
    try {
      respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        method: metodo,
        // Con FormData el navegador debe poner el Content-Type (incluye el boundary).
        headers: this.#cabeceras(esFormData ? {} : { 'Content-Type': 'application/json' }),
        body: esFormData ? formData : cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        signal: señal,
      })
    } catch (error) {
      if (error.name === 'AbortError') throw error
      throw new ApiError({
        mensaje: 'No se pudo conectar con el servidor',
        codigo: 'SIN_CONEXION',
        estado: 0,
      })
    }

    // Un 401 solo significa "tu sesión expiró" si HABÍA una sesión (token guardado) que
    // el servidor acaba de rechazar. Un intento de login fallido (credenciales inválidas)
    // también responde 401, pero sin token previo — ahí no hay sesión que expirar, así que se
    // deja pasar al manejo de error normal de abajo, que expone el mensaje real del backend
    // ("Credenciales inválidas") en vez de uno genérico y engañoso.
    if (respuesta.status === 401 && localStorage.getItem('token')) {
      this.#cerrarSesion()
      throw new ApiError({
        mensaje: 'Tu sesión expiró',
        codigo: 'NO_AUTENTICADO',
        estado: 401,
      })
    }

    if (respuesta.status === 204) return { datos: null, meta: null }

    // Descargas binarias (PDF de firma, soportes de antecedentes).
    const tipo = respuesta.headers.get('content-type') ?? ''
    if (respuesta.ok && !tipo.includes('application/json')) {
      return { datos: await respuesta.blob(), meta: null }
    }

    const cuerpoRespuesta = await respuesta.json().catch(() => null)

    if (!respuesta.ok) {
      const error = cuerpoRespuesta?.error ?? {}
      throw new ApiError({
        mensaje: error.mensaje ?? `Error ${respuesta.status}`,
        codigo: error.codigo ?? 'ERROR',
        detalles: error.detalles,
        estado: respuesta.status,
      })
    }

    return { datos: cuerpoRespuesta?.datos ?? null, meta: cuerpoRespuesta?.meta ?? null }
  }

  /** Devuelve solo los datos. Para lo habitual. */
  async get(ruta, opciones) {
    return (await this.#peticion('GET', ruta, opciones)).datos
  }

  /** Devuelve datos y metadatos de paginación. */
  async getConMeta(ruta, opciones) {
    return this.#peticion('GET', ruta, opciones)
  }

  async post(ruta, cuerpo) {
    return (await this.#peticion('POST', ruta, { cuerpo })).datos
  }

  async put(ruta, cuerpo) {
    return (await this.#peticion('PUT', ruta, { cuerpo })).datos
  }

  async patch(ruta, cuerpo) {
    return (await this.#peticion('PATCH', ruta, { cuerpo })).datos
  }

  async delete(ruta) {
    return (await this.#peticion('DELETE', ruta)).datos
  }

  /** Subidas multipart (soportes de antecedentes). */
  async postFormData(ruta, formData) {
    return (await this.#peticion('POST', ruta, { formData })).datos
  }

  /** Construye un query string omitiendo los valores vacíos. */
  qs(parametros) {
    const limpios = Object.entries(parametros ?? {}).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
    return limpios.length > 0 ? `?${new URLSearchParams(limpios)}` : ''
  }
}

export const api = new ApiService()
export default api
export { API_BASE_URL }
