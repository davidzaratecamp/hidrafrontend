import Sidebar from './Sidebar'

/**
 * Marco de las pantallas con sesión: sidebar + contenido.
 *
 * Antes cada pantalla importaba su propio sidebar según el rol y repetía el
 * `<div className="lg:ml-64">`, que es lo que hacía que agregar una opción
 * obligara a tocar tres archivos.
 */
export default function Layout({ titulo, descripcion, acciones, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        {(titulo || acciones) && (
          <header className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {titulo && (
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">{titulo}</h1>
                )}
                {descripcion && <p className="mt-1 text-sm text-gray-600">{descripcion}</p>}
              </div>
              {acciones && <div className="flex items-center gap-2">{acciones}</div>}
            </div>
          </header>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
