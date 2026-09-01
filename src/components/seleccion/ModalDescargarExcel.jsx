import { useState } from 'react'
import { Download } from 'lucide-react'
import { Boton, Error, Modal } from '../ui'
import { Texto } from '../ui/campos'
import { descargarBlob } from '../../utils/descargar'
import api from '../../services/api'

/**
 * Descarga del Excel oficial "BASE RECLUTAMIENTO".
 *
 * Recupera el modal que tenía el sistema viejo y que se perdió en la
 * reestructuración: los endpoints `/reportes/*.xlsx` existían, pero ninguna
 * pantalla los ofrecía, así que el reporte solo se podía sacar a mano.
 *
 * Sirve a los tres reportes porque solo cambian el endpoint y si el rango es
 * obligatorio:
 *   - citados   -> rango OBLIGATORIO (así lo exige el reporte oficial)
 *   - aprobados -> rango opcional; sin él salen todos
 *   - histórico -> rango opcional; sin él salen los últimos 100 registrados
 *
 * El rango se lleva aparte del filtro de la pantalla: se ajusta justo antes de
 * exportar sin alterar lo que se está viendo.
 *
 * `ruta`, si se pasa, reemplaza el endpoint por defecto (`/reportes/${reporte}.xlsx`)
 * — lo usa el reporte histórico, que vive en otro módulo (`/historico/...`).
 */
export default function ModalDescargarExcel({
  reporte,
  ruta,
  titulo,
  descripcion,
  fechasRequeridas = false,
  desdeInicial = '',
  hastaInicial = '',
  onCerrar,
}) {
  const [desde, setDesde] = useState(desdeInicial)
  const [hasta, setHasta] = useState(hastaInicial)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState(null)

  async function descargar() {
    if (fechasRequeridas && (!desde || !hasta)) {
      setError('Elige la fecha inicial y la final.')
      return
    }
    if (desde && hasta && desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la final.')
      return
    }

    setError(null)
    setDescargando(true)
    try {
      const blob = await api.get(`${ruta ?? `/reportes/${reporte}.xlsx`}${api.qs({ desde, hasta })}`)
      const sufijo = desde && hasta ? `${desde}-a-${hasta}` : new Date().toISOString().slice(0, 10)
      descargarBlob(blob, `${reporte}-${sufijo}.xlsx`)
      onCerrar()
    } catch (e) {
      setError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <Modal titulo={titulo} descripcion={descripcion} onCerrar={onCerrar}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            etiqueta="Desde"
            type="date"
            requerido={fechasRequeridas}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <Texto
            etiqueta="Hasta"
            type="date"
            requerido={fechasRequeridas}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>

        <Error mensaje={error} />

        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} disabled={descargando}>
            Cancelar
          </Boton>
          <Boton onClick={descargar} cargando={descargando}>
            <Download className="h-4 w-4" /> Descargar
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
