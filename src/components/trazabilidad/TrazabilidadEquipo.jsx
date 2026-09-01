import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, Users } from 'lucide-react'
import Layout from '../layout/Layout'
import api from '../../services/api'
import { useRecurso } from '../../hooks/useRecurso'

/**
 * Comparativa de todos los reclutadores.
 *
 * Es la vista que el administrador no tenía: su sidebar solo listaba "Gestión de
 * Reclutadores" y "Desprendibles", así que no había ningún lugar donde ver la
 * productividad del equipo.
 */

const COLUMNAS = [
  { clave: 'dia', etiqueta: 'Hoy' },
  { clave: 'semana', etiqueta: 'Semana' },
  { clave: 'mes', etiqueta: 'Mes' },
  { clave: 'total', etiqueta: 'Total' },
]

function TarjetaGlobal({ icono: Icono, etiqueta, valor, detalle }) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{etiqueta}</p>
          {/* Proporcional, no tabular: reservado para columnas (ver tabla abajo). */}
          <p className="mt-2 text-3xl font-bold text-gray-900">{valor}</p>
          {detalle && <p className="mt-1 text-xs text-gray-500">{detalle}</p>}
        </div>
        <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <Icono className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

export default function TrazabilidadEquipo() {
  const navegar = useNavigate()
  const [orden, setOrden] = useState('mes')

  const { datos, cargando, error, recargar: cargar } = useRecurso(
    async () => {
      // Los totales globales exigen un permiso extra: si falta, el resto de la
      // pantalla sigue siendo útil.
      const [equipo, global] = await Promise.all([
        api.get('/trazabilidad/equipo'),
        api.get('/trazabilidad/global').catch(() => null),
      ])
      return { equipo, global }
    },
    [],
    { inicial: { equipo: [], global: null } }
  )

  const equipo = datos?.equipo ?? []
  const global = datos?.global ?? null

  const ordenados = [...equipo].sort((a, b) => b.creados[orden] - a.creados[orden])
  const maximo = Math.max(1, ...ordenados.map((r) => r.creados[orden]))

  return (
    <Layout
      titulo="Trazabilidad del equipo"
      descripcion="Candidatos creados y gestionados por cada reclutador"
      acciones={
        <button
          onClick={cargar}
          disabled={cargando}
          aria-label="Actualizar"
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {global && (
        <section className="grid gap-4 sm:grid-cols-3 mb-6">
          <TarjetaGlobal
            icono={Users}
            etiqueta="Candidatos en el sistema"
            valor={global.candidatos.total}
          />
          <TarjetaGlobal
            icono={TrendingUp}
            etiqueta="Registrados este mes"
            valor={global.candidatos.mes}
            detalle={`${global.candidatos.semana} esta semana · ${global.candidatos.dia} hoy`}
          />
          <TarjetaGlobal
            icono={Users}
            etiqueta="Usuarios activos"
            valor={global.usuariosActivos}
          />
        </section>
      )}

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Reclutadores {equipo.length > 0 && `(${equipo.length})`}
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Ordenar por
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="rounded-md border-gray-200 text-sm py-1.5"
            >
              {COLUMNAS.map((c) => (
                <option key={c.clave} value={c.clave}>
                  {c.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>

        {cargando && equipo.length === 0 ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : ordenados.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No hay usuarios con el rol de reclutamiento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Reclutador</th>
                  {COLUMNAS.map((c) => (
                    <th key={c.clave} className="px-3 py-3 font-medium text-right">
                      {c.etiqueta}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium text-right">Gestionados (mes)</th>
                  <th className="px-3 py-3 font-medium text-right">Cartera</th>
                  <th className="px-5 py-3 font-medium w-32">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenados.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navegar(`/trazabilidad/reclutador/${r.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{r.nombreCompleto}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      {!r.activo && (
                        <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                          inactivo
                        </span>
                      )}
                    </td>
                    {COLUMNAS.map((c) => (
                      <td
                        key={c.clave}
                        className={`px-3 py-3 text-right tabular-nums ${
                          c.clave === orden ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {r.creados[c.clave]}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                      {r.gestionadosMes}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                      {r.carteraActual}
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(r.creados[orden] / maximo) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  )
}
