/**
 * Controles de formulario compartidos por los 6 pasos.
 *
 * En el sistema anterior cada paso era un archivo suelto que repetía su propio
 * marcado de label + input + mensaje de error. Aquí se define una vez.
 */

const BASE_INPUT =
  'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40'

function conError(error) {
  return error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
}

export function Campo({ etiqueta, requerido, error, ayuda, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">
        {etiqueta}
        {requerido && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {ayuda && !error && <span className="mt-1 block text-xs text-gray-500">{ayuda}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

/**
 * Campo de solo lectura: lo que decide el sistema y el usuario no escribe.
 *
 * No usa `Campo` porque eso envuelve en un `<label>`, y una etiqueta sin control
 * asociado confunde a los lectores de pantalla.
 */
export function CampoFijo({ etiqueta, valor, ayuda }) {
  return (
    <div className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{etiqueta}</span>
      <p className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        {valor}
      </p>
      {ayuda && <span className="mt-1 block text-xs text-gray-500">{ayuda}</span>}
    </div>
  )
}

/**
 * Con `maxLength` puesto, agrega el contador "X/Y caracteres" debajo del
 * campo — igual que lo mostraba la interfaz anterior en cada campo con un
 * límite calibrado contra el ancho real de su celda en `hojavida.pdf`. Si ya
 * viene una `ayuda` propia, el contador se agrega al lado, no la reemplaza.
 */
function conContador(ayuda, maxLength, valor) {
  if (!maxLength || typeof valor !== 'string') return ayuda
  const contador = `${valor.length}/${maxLength} caracteres`
  return ayuda ? `${ayuda} · ${contador}` : contador
}

export function Texto({ etiqueta, requerido, error, ayuda, ...props }) {
  return (
    <Campo
      etiqueta={etiqueta}
      requerido={requerido}
      error={error}
      ayuda={conContador(ayuda, props.maxLength, props.value)}
    >
      <input {...props} className={`${BASE_INPUT} ${conError(error)}`} />
    </Campo>
  )
}

export function AreaTexto({ etiqueta, requerido, error, ayuda, filas = 3, ...props }) {
  return (
    <Campo
      etiqueta={etiqueta}
      requerido={requerido}
      error={error}
      ayuda={conContador(ayuda, props.maxLength, props.value)}
    >
      <textarea {...props} rows={filas} className={`${BASE_INPUT} ${conError(error)} resize-y`} />
    </Campo>
  )
}

/**
 * Desplegable alimentado por el catálogo del backend.
 * `opciones` son `{ codigo, nombre }`: el valor que viaja es el código, nunca el id.
 */
export function Seleccion({ etiqueta, requerido, error, ayuda, opciones = [], vacio = 'Selecciona…', ...props }) {
  return (
    <Campo etiqueta={etiqueta} requerido={requerido} error={error} ayuda={ayuda}>
      <select {...props} className={`${BASE_INPUT} ${conError(error)}`}>
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.codigo} value={o.codigo}>
            {o.nombre}
          </option>
        ))}
      </select>
    </Campo>
  )
}

/** Sí / No explícito. Evita la casilla marcada por defecto, que sesga la respuesta. */
export function SiNo({ etiqueta, valor, onChange, requerido, error, ayuda }) {
  return (
    <Campo etiqueta={etiqueta} requerido={requerido} error={error} ayuda={ayuda}>
      <div className="flex gap-2">
        {[
          { v: true, t: 'Sí' },
          { v: false, t: 'No' },
        ].map(({ v, t }) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(valor === v ? undefined : v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
              valor === v
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </Campo>
  )
}

/** Escala 1–5, la que usa el formato oficial para conocimientos y autoevaluación. */
export function Escala({ etiqueta, valor, onChange, error }) {
  return (
    <Campo etiqueta={etiqueta} error={error}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(valor === n ? undefined : n)}
            aria-label={`Nivel ${n} de 5`}
            className={`h-10 flex-1 rounded-lg border text-sm transition-colors ${
              valor === n
                ? 'border-blue-500 bg-blue-600 text-white font-semibold'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </Campo>
  )
}

const CLASES_COLUMNAS = {
  1: '',
  2: 'sm:grid-cols-2',
  // Se queda en 2 columnas hasta pantallas grandes: en un formulario angosto
  // (el del candidato, por token, sin sidebar) 3 columnas apretaría los
  // campos antes de que hubiera espacio real para ellas.
  3: 'sm:grid-cols-2 lg:grid-cols-3',
}

export function Seccion({ titulo, descripcion, children, columnas = 2 }) {
  return (
    <section className="space-y-4">
      {titulo && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
          {descripcion && <p className="mt-0.5 text-xs text-gray-500">{descripcion}</p>}
        </div>
      )}
      <div className={`grid gap-4 ${CLASES_COLUMNAS[columnas] ?? CLASES_COLUMNAS[2]}`}>{children}</div>
    </section>
  )
}
