import { Cargando, Paginacion, Vacio } from './index'

/**
 * Tabla de datos con sus estados.
 *
 * Cinco pantallas repetían el mismo andamiaje: el contenedor con borde, el
 * `overflow-x-auto`, el `thead` gris, el `divide-y`, y las tres ramas de
 * "cargando / vacío / con datos" más la paginación. Cambiar el aspecto de las
 * tablas obligaba a tocar cinco archivos.
 *
 * Las columnas se declaran como datos, no como marcado:
 *
 *   const COLUMNAS = [
 *     { clave: 'nombre', titulo: 'Candidato', render: (fila) => <Link .../> },
 *     { clave: 'estado', titulo: 'Estado', alineacion: 'right' },
 *   ]
 *
 * `render` es opcional: sin él se muestra `fila[clave]`.
 */
export function Tabla({
  columnas,
  filas,
  clave = (fila) => fila.id,
  cargando,
  vacio = 'No hay registros.',
  iconoVacio,
  meta,
  onPagina,
  onFila,
}) {
  const alinear = (columna) =>
    columna.alineacion === 'right' ? 'text-right' : columna.alineacion === 'center' ? 'text-center' : ''

  if (cargando && filas.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <Cargando />
      </div>
    )
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white">
        <Vacio mensaje={vacio} icono={iconoVacio} />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  className={`px-3 py-3 first:pl-5 last:pr-5 ${alinear(columna)}`}
                >
                  {columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filas.map((fila) => (
              <tr
                key={clave(fila)}
                onClick={onFila ? () => onFila(fila) : undefined}
                className={`transition-colors hover:bg-blue-50/40 ${onFila ? 'cursor-pointer' : ''}`}
              >
                {columnas.map((columna) => (
                  <td
                    key={columna.clave}
                    className={`px-3 py-3 first:pl-5 last:pr-5 ${alinear(columna)}`}
                  >
                    {columna.render ? columna.render(fila) : (fila[columna.clave] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginacion meta={meta} onPagina={onPagina} />
    </div>
  )
}

/** Fila de dos líneas: valor principal y una nota debajo. Patrón muy repetido. */
export function CeldaDoble({ principal, secundario }) {
  return (
    <>
      <p className="font-medium text-gray-900">{principal}</p>
      {secundario && <p className="text-xs text-gray-500">{secundario}</p>}
    </>
  )
}

/** Grupo de botones de filtro. Se repetía en la agenda, el listado y decisiones. */
export function Filtros({ opciones, valor, onCambio }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opciones.map((o) => (
        <button
          key={o.valor}
          onClick={() => onCambio(o.valor)}
          className={`rounded-lg px-3 py-1.5 text-sm transition-all duration-150 active:scale-[0.97] ${
            valor === o.valor
              ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-900/10'
              : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {o.etiqueta}
          {o.total !== undefined && (
            <span className={`ml-1.5 text-xs ${valor === o.valor ? 'text-blue-100' : 'text-gray-400'}`}>
              {o.total}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Campo de búsqueda con su icono. */
export function Buscador({ valor, onCambio, placeholder = 'Buscar…' }) {
  return (
    <div className="relative flex-1 min-w-56">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </div>
  )
}
