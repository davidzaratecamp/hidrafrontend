import { useState } from 'react'
import { Archive, Download, Search } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Error } from '../ui'
import { Tabla } from '../ui/Tabla'
import { fecha } from '../ui/formato'
import { useAuth } from '../../context/useAuth'
import { useRecursoPaginado } from '../../hooks/useRecurso'
import { useBusquedaDiferida } from '../../hooks/useBusquedaDiferida'
import api from '../../services/api'
import ModalDescargarExcel from '../seleccion/ModalDescargarExcel'

/**
 * Consulta del archivo histórico (sistema anterior, base `noviembrehidra`).
 *
 * Es solo lectura: existe para responder "¿esta persona ya se había
 * presentado?, ¿quién la gestionó?, ¿en qué quedó?" sin tener que abrir la
 * base vieja a mano. Mismo endpoint (`/api/historico/candidatos`) y mismo
 * permiso (`ver_candidatos`) para los tres roles — reclutamiento, selección y
 * administrador.
 *
 * Las columnas son las del documento oficial "BASE RECLUTAMIENTO" (el mismo
 * que arma `historico.excel.js`): la vista en pantalla y el Excel descargado
 * dicen exactamente lo mismo para el mismo candidato.
 */
const si = (v) => (v === true ? 'Sí' : v === false ? 'No' : '—')
const texto = (v) => (v ? v : '—')

export default function BaseHistorica() {
  const { hasPermission } = useAuth()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [modalExcel, setModalExcel] = useState(false)

  const volverAPrimera = () => setPagina(1)
  const { texto: busquedaTexto, setTexto, busqueda } = useBusquedaDiferida(350, volverAPrimera)

  const { items, meta, cargando, error, recargar } = useRecursoPaginado(
    () => api.getConMeta(`/historico/candidatos${api.qs({ pagina, porPagina: 20, q: busqueda, desde, hasta })}`),
    [pagina, busqueda, desde, hasta]
  )

  // Antecedentes, aprobación y motivo de rechazo son valoración psicológica:
  // el backend ya las omite de la respuesta sin `ver_perfiles_completos` — acá
  // solo se decide si la columna se dibuja.
  const columnas = [
    { clave: 'createdAt', titulo: 'Fecha', render: (c) => fecha(c.createdAt) },
    { clave: 'analista', titulo: 'Analista', render: (c) => texto(c.reclutador?.nombreCompleto) },
    { clave: 'cliente', titulo: 'Campaña', render: (c) => texto(c.cliente) },
    { clave: 'cargo', titulo: 'Cargo', render: (c) => texto(c.cargo) },
    { clave: 'nombreCompleto', titulo: 'Nombre', render: (c) => texto(c.nombreCompleto) },
    { clave: 'tipoDocumento', titulo: 'Tipo doc.', render: (c) => texto(c.tipoDocumento) },
    { clave: 'numeroDocumento', titulo: 'Documento', render: (c) => texto(c.numeroDocumento) },
    { clave: 'edad', titulo: 'Edad', render: (c) => c.edad ?? '—' },
    { clave: 'email', titulo: 'Correo', render: (c) => texto(c.email) },
    { clave: 'contactoLlamada', titulo: 'Contacto llamada', render: (c) => si(c.contactoLlamada) },
    { clave: 'contactoWhatsapp', titulo: 'Contacto WhatsApp', render: (c) => si(c.contactoWhatsapp) },
    {
      clave: 'perfil',
      titulo: 'Perfil',
      // Texto libre y a veces largo: se limita la altura de la celda con
      // scroll propio para que una fila no estire toda la tabla.
      render: (c) => (
        <div className="max-h-20 w-56 overflow-y-auto whitespace-normal">{texto(c.perfil)}</div>
      ),
    },
    // Bug ya documentado del sistema viejo: el archivo histórico no tiene
    // forma confiable de saber si citó de verdad, así que sale fijo (ver
    // `historico.excel.js`) — la vista en pantalla no debe inventar algo
    // distinto de lo que dice el Excel para el mismo candidato.
    { clave: 'citado', titulo: 'Citado', render: () => 'Sí' },
    { clave: 'estadoGestionReclutamiento', titulo: 'Estado gestión reclutamiento', render: (c) => texto(c.estadoGestionReclutamiento) },
    { clave: 'asisteEntrevista', titulo: 'Asiste entrevista', render: (c) => texto(c.asisteEntrevista) },
    { clave: 'motivoInasistencia', titulo: 'Motivo inasistencia', render: (c) => texto(c.motivoInasistencia) },
    ...(hasPermission('ver_perfiles_completos')
      ? [
          { clave: 'antecedentesAdres', titulo: 'Antecedentes ADRES', render: (c) => texto(c.antecedentesAdres) },
          { clave: 'antecedentesPol', titulo: 'Antecedentes Policía', render: (c) => texto(c.antecedentesPol) },
          { clave: 'antecedentesComp', titulo: 'Antecedentes Contraloría', render: (c) => texto(c.antecedentesComp) },
          { clave: 'antecedentesProcu', titulo: 'Antecedentes Procuraduría', render: (c) => texto(c.antecedentesProcu) },
          { clave: 'aprobado', titulo: 'Aprobado', render: (c) => si(c.aprobado) },
          { clave: 'razonNoAprobado', titulo: '¿Por qué no aprobó?', render: (c) => texto(c.razonNoAprobado) },
        ]
      : []),
  ]

  return (
    <Layout
      titulo="Base histórica"
      descripcion="Archivo de solo lectura del sistema anterior, formato BASE RECLUTAMIENTO. Consulta si un candidato ya se había presentado antes."
      acciones={
        <Boton variante="secundario" onClick={() => setModalExcel(true)}>
          <Download className="h-4 w-4" /> Descargar histórico
        </Boton>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={busquedaTexto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por nombre, documento, correo o celular…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value)
              volverAPrimera()
            }}
            aria-label="Registrado desde"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value)
              volverAPrimera()
            }}
            aria-label="Registrado hasta"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <Error mensaje={error} onReintentar={recargar} />

        <Tabla
          columnas={columnas}
          filas={items}
          cargando={cargando}
          meta={meta}
          onPagina={setPagina}
          iconoVacio={Archive}
          vacio="No hay candidatos con estos filtros en el archivo histórico."
        />
      </div>

      {modalExcel && (
        <ModalDescargarExcel
          reporte="historico"
          ruta="/historico/base-reclutamiento.xlsx"
          titulo="Descargar histórico"
          descripcion="Archivo del sistema anterior, formato BASE RECLUTAMIENTO. FECHA es la fecha de registro. Sin rango, trae los últimos 100 registrados."
          desdeInicial={desde}
          hastaInicial={hasta}
          onCerrar={() => setModalExcel(false)}
        />
      )}
    </Layout>
  )
}
