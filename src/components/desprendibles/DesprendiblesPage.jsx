import { useState, useEffect } from 'react'
import { FileText, Eye, Download } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../reclutador/Sidebar'
import SidebarSeleccion from '../seleccion/SidebarSeleccion'
import AdminSidebar from '../admin/AdminSidebar'
import ApiService from '../../services/api'

export default function DesprendiblesPage() {
  const { user } = useAuth()
  const [meses, setMeses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accionando, setAccionando] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ApiService.getMesesDesprendibles()
      if (!data.ok) throw new Error(data.message)
      setMeses(data.data ?? [])
    } catch (err) {
      setError(err.message ?? 'Error al cargar los desprendibles')
    } finally {
      setLoading(false)
    }
  }

  const handleVer = async (mes) => {
    const key = `ver_${mes.month}_${mes.year}`
    setAccionando(key)
    try {
      const blob = await ApiService.getPdfDesprendible(mes.year, mes.month)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message ?? 'Error al abrir el desprendible')
    } finally {
      setAccionando(null)
    }
  }

  const handleDescargar = async (mes) => {
    const key = `dl_${mes.month}_${mes.year}`
    setAccionando(key)
    try {
      const blob = await ApiService.getPdfDesprendible(mes.year, mes.month)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `desprendible_${mes.label.replaceAll(' ', '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message ?? 'Error al descargar')
    } finally {
      setAccionando(null)
    }
  }

  const renderSidebar = () => {
    if (user?.rol === 'seleccion') return <SidebarSeleccion />
    if (user?.rol === 'administrador') return (
      <div className="h-screen w-64 fixed left-0 top-0">
        <AdminSidebar />
      </div>
    )
    return <Sidebar />
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {renderSidebar()}

      <main className="flex-1 overflow-y-auto ml-64 p-8">
        <div className="max-w-3xl space-y-6">

          <div>
            <h2 className="text-2xl font-bold text-gray-800">Desprendibles de nómina</h2>
            <p className="text-sm text-gray-400 mt-1">Tus últimos 3 desprendibles de pago</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-red-400 text-sm mt-1">
                Verifica que tu usuario tenga número de documento registrado o contacta al administrador.
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {meses.map((mes) => (
                <div
                  key={`${mes.year}_${mes.month}`}
                  className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col gap-4
                    ${mes.disponible ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${mes.disponible ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">{mes.label}</p>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full
                        ${mes.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {mes.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      disabled={!mes.disponible || accionando !== null}
                      onClick={() => handleVer(mes)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        bg-blue-700 hover:bg-blue-800 text-white
                        disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {accionando === `ver_${mes.month}_${mes.year}`
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Eye className="h-4 w-4" />
                      }
                      Ver
                    </button>

                    <button
                      disabled={!mes.disponible || accionando !== null}
                      onClick={() => handleDescargar(mes)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                        border border-gray-200 text-gray-600 hover:bg-gray-50
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {accionando === `dl_${mes.month}_${mes.year}`
                        ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        : <Download className="h-4 w-4" />
                      }
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
