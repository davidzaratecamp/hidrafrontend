import { useRef, useState } from 'react'
import { PenLine, Type, FileSignature } from 'lucide-react'
import { Modal, Boton, Error } from '../../ui'
import api from '../../../services/api'

/**
 * Segunda firma (Selección/Administrador) sobre la hoja de vida ya firmada por
 * el candidato. Se estampa en el campo "PSICÓLOGO" de la plantilla, del lado
 * de FirmaCloud (ver reclutamientoPdfService.js — este componente solo captura
 * la imagen, dibujada o tecleada, en el mismo formato PNG en ambos casos).
 */
export default function ModalFirmarHojaVida({ candidatoId, onFirmado, onCerrar }) {
  const [modo, setModo] = useState('draw')
  const [nombreFirma, setNombreFirma] = useState('')
  const [hayTrazo, setHayTrazo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const canvasRef = useRef(null)
  const dibujando = useRef(false)
  const ultimoPunto = useRef(null)

  function posicion(evento, canvas) {
    const rect = canvas.getBoundingClientRect()
    const punto = evento.touches?.[0] ?? evento
    return {
      x: ((punto.clientX - rect.left) / rect.width) * canvas.width,
      y: ((punto.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function iniciarTrazo(evento) {
    evento.preventDefault()
    dibujando.current = true
    ultimoPunto.current = posicion(evento, canvasRef.current)
  }

  function trazar(evento) {
    if (!dibujando.current) return
    evento.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const actual = posicion(evento, canvas)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y)
    ctx.lineTo(actual.x, actual.y)
    ctx.stroke()
    ultimoPunto.current = actual
    setHayTrazo(true)
  }

  function terminarTrazo() {
    dibujando.current = false
  }

  function limpiar() {
    const canvas = canvasRef.current
    canvas?.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHayTrazo(false)
  }

  /**
   * Ambos modos terminan en el mismo formato: un PNG con fondo transparente
   * (FirmaCloud recorta por canal alfa, `cropSignatureToContent`) — "escribir"
   * solo cambia cómo se genera esa imagen, nunca lo que viaja al backend.
   */
  function generarDataUrl() {
    if (modo === 'draw') {
      return hayTrazo ? canvasRef.current.toDataURL('image/png') : null
    }
    const texto = nombreFirma.trim()
    if (!texto) return null
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    ctx.font = "56px 'Dancing Script', cursive"
    ctx.fillStyle = '#1e293b'
    ctx.textBaseline = 'middle'
    ctx.fillText(texto, 12, canvas.height / 2)
    return canvas.toDataURL('image/png')
  }

  async function firmar() {
    const signatureDataUrl = generarDataUrl()
    if (!signatureDataUrl) {
      setError(modo === 'draw' ? 'Dibuja tu firma antes de continuar' : 'Escribe tu nombre antes de continuar')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await api.post(`/firma/${candidatoId}/firmar-hoja-vida`, { signatureDataUrl, signatureMode: modo })
      onFirmado()
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const claseToggle = (activo) =>
    `flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
      activo ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
    }`

  return (
    <Modal
      titulo="Firmar hoja de vida"
      descripcion="Se estampará tu firma sobre el campo de Selección de la hoja de vida ya firmada por el candidato."
      onCerrar={onCerrar}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setModo('draw')} className={claseToggle(modo === 'draw')}>
            <PenLine className="h-4 w-4" /> Dibujar
          </button>
          <button type="button" onClick={() => setModo('font')} className={claseToggle(modo === 'font')}>
            <Type className="h-4 w-4" /> Escribir
          </button>
        </div>

        {modo === 'draw' ? (
          <div>
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              style={{ touchAction: 'none' }}
              className="w-full rounded-lg border border-gray-300 bg-white"
              onMouseDown={iniciarTrazo}
              onMouseMove={trazar}
              onMouseUp={terminarTrazo}
              onMouseLeave={terminarTrazo}
              onTouchStart={iniciarTrazo}
              onTouchMove={trazar}
              onTouchEnd={terminarTrazo}
            />
            <button type="button" onClick={limpiar} className="mt-2 text-xs font-medium text-gray-500 underline">
              Limpiar
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={nombreFirma}
              onChange={(e) => setNombreFirma(e.target.value)}
              placeholder="Escribe tu nombre"
              maxLength={80}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {nombreFirma.trim() && (
              <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <span style={{ fontFamily: "'Dancing Script', cursive" }} className="text-3xl text-gray-800">
                  {nombreFirma}
                </span>
              </div>
            )}
          </div>
        )}

        {error && <Error mensaje={error} />}

        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton onClick={firmar} cargando={enviando}>
            <FileSignature className="h-4 w-4" /> Firmar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
