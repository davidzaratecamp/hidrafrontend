/**
 * Abre en una pestaña nueva un archivo recibido como Blob.
 *
 * El backend nunca sirve la carpeta de subidas como estática: cada descarga pasa
 * por un endpoint autenticado que comprueba la visibilidad del candidato. Por eso
 * el archivo llega como Blob y hay que crearle una URL temporal.
 *
 * Estaba repetido tres veces (dos en el perfil del candidato, una en
 * desprendibles), incluido el `revokeObjectURL` que es fácil de olvidar y que,
 * si falta, deja el archivo retenido en memoria.
 */
export function abrirBlob(blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  // Se libera con retraso: revocarla de inmediato cancelaría la pestaña nueva.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Guarda un Blob como archivo, con nombre.
 *
 * Para los Excel no sirve `abrirBlob`: una pestaña nueva con un .xlsx queda en
 * blanco o se guarda con un nombre aleatorio. Aquí se fuerza la descarga y el
 * archivo conserva el nombre que le corresponde.
 */
export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
