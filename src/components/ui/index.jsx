import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import { clasesBoton } from './estilos'

/** Piezas de interfaz compartidas por las pantallas internas. */

export function Cargando({ mensaje = 'Cargando…', alto = 'h-40' }) {
  return (
    <div className={`flex items-center justify-center ${alto}`}>
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-500">{mensaje}</p>
      </div>
    </div>
  )
}

export function Error({ mensaje, onReintentar }) {
  if (!mensaje) return null
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{mensaje}</span>
      {onReintentar && (
        <button onClick={onReintentar} className="font-medium underline shrink-0">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function Vacio({ mensaje, icono: Icono }) {
  return (
    <div className="py-12 text-center">
      {Icono && <Icono className="h-8 w-8 text-gray-300 mx-auto mb-3" />}
      <p className="text-sm text-gray-500">{mensaje}</p>
    </div>
  )
}

/**
 * Etiqueta de estado. El color lo define el backend (`estados_candidato.color`),
 * así que agregar un estado no obliga a tocar el frontend.
 */
export function Etiqueta({ texto, color, tono = 'gris' }) {
  const tonos = {
    gris: 'bg-gray-100 text-gray-700',
    verde: 'bg-emerald-100 text-emerald-800',
    rojo: 'bg-red-100 text-red-800',
    ambar: 'bg-amber-100 text-amber-800',
    azul: 'bg-blue-100 text-blue-800',
  }
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        color ?? tonos[tono]
      }`}
    >
      {texto}
    </span>
  )
}

/**
 * Barra de avance con su cuenta al lado ("4/6").
 *
 * La tenía el listado de candidatos del sistema viejo para el progreso del
 * formulario, y se perdió en la reestructuración. Aquí es genérica porque el
 * mismo patrón sirve para el puntaje de la entrevista.
 */
export function Progreso({ valor, total, etiqueta, tono = 'bg-blue-500' }) {
  const porcentaje = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${tono}`} style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="whitespace-nowrap text-xs text-gray-500">
        {etiqueta ?? `${valor}/${total}`}
      </span>
    </div>
  )
}

export function Boton({ children, cargando, variante = 'primario', ...props }) {
  return (
    <button
      {...props}
      disabled={cargando || props.disabled}
      className={clasesBoton({ variante, className: props.className })}
    >
      {cargando && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

/** Acción que navega. Mismo aspecto que `Boton`, pero es un enlace de verdad. */
export function BotonEnlace({ to, children, variante = 'secundario', className, ...props }) {
  return (
    <Link {...props} to={to} className={clasesBoton({ variante, className })}>
      {children}
    </Link>
  )
}

/**
 * Confirmación de una acción destructiva.
 *
 * Genérico a propósito: desactivar un usuario no es la única acción que conviene
 * confirmar, y el patrón —aviso ámbar, cancelar, confirmar en rojo— no debería
 * reescribirse en cada pantalla.
 */
export function ModalConfirmacion({
  titulo,
  descripcion,
  advertencia,
  textoConfirmar = 'Confirmar',
  onConfirmar,
  onCerrar,
  cargando,
}) {
  return (
    <Modal titulo={titulo} descripcion={descripcion} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">{advertencia}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

export function Modal({ titulo, descripcion, onCerrar, children, ancho = 'max-w-lg' }) {
  // Escape cierra el modal: es lo que espera cualquiera que use el teclado.
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full ${ancho} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/**
 * Previsualiza un documento adentro del modal, en vez de abrirlo en pestaña
 * nueva — así se veía en la interfaz anterior. Sirve tanto para los soportes
 * de antecedentes (PDF o imagen) como para la hoja de vida y el tratamiento de
 * datos firmados desde FirmaCloud (siempre PDF).
 *
 * `cargar` es la función que trae el Blob (normalmente `() => api.get(ruta)`,
 * que ya devuelve Blob para respuestas no-JSON). El propio `blob.type` que
 * pone el navegador (del `Content-Type` real de la respuesta) decide si se
 * muestra como imagen o como PDF — no hace falta que el llamador lo sepa de
 * antemano. La URL se revoca al cerrar para no retener el archivo en memoria.
 */
export function ModalDocumento({ titulo, descripcion, cargar, onCerrar }) {
  const [url, setUrl] = useState(null)
  const [esImagen, setEsImagen] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vigente = true
    let objectUrl = null
    cargar()
      .then((blob) => {
        if (!vigente) return
        objectUrl = URL.createObjectURL(blob)
        setEsImagen(blob.type.startsWith('image/'))
        setUrl(objectUrl)
      })
      .catch((e) => vigente && setError(e.message))
    return () => {
      vigente = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Modal titulo={titulo} descripcion={descripcion} onCerrar={onCerrar} ancho="max-w-4xl">
      {error ? (
        <Error mensaje={error} />
      ) : !url ? (
        <Cargando alto="h-[75vh]" />
      ) : esImagen ? (
        <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-lg bg-gray-50">
          <img src={url} alt={titulo} className="max-h-[75vh] max-w-full object-contain" />
        </div>
      ) : (
        <iframe src={url} title={titulo} className="h-[75vh] w-full rounded-lg border-0" />
      )}
    </Modal>
  )
}

export function Paginacion({ meta, onPagina }) {
  if (!meta || meta.totalPaginas <= 1) return null
  const { pagina, totalPaginas, total } = meta

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm">
      <span className="text-gray-500">
        Página {pagina} de {totalPaginas} · {total} registros
      </span>
      <div className="flex gap-2">
        <Boton
          variante="secundario"
          disabled={pagina <= 1}
          onClick={() => onPagina(pagina - 1)}
          className="!py-1.5"
        >
          Anterior
        </Boton>
        <Boton
          variante="secundario"
          disabled={pagina >= totalPaginas}
          onClick={() => onPagina(pagina + 1)}
          className="!py-1.5"
        >
          Siguiente
        </Boton>
      </div>
    </div>
  )
}
