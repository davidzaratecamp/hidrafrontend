import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import Layout from '../layout/Layout'
import { Cargando, Error, Etiqueta } from '../ui'
import api from '../../services/api'

/**
 * Catálogo de roles y permisos, en solo lectura.
 *
 * Es la pantalla que explica de dónde sale lo que cada quien puede hacer. Antes
 * la matriz estaba escrita en `usuario.model.js` del backend y no había forma de
 * consultarla desde la aplicación.
 */
export default function RolesPermisos() {
  const [roles, setRoles] = useState(null)
  const [permisos, setPermisos] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/roles'), api.get('/roles/permisos')])
      .then(([r, p]) => {
        setRoles(r)
        setPermisos(p)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <Layout titulo="Roles y permisos">
        <Error mensaje={error} />
      </Layout>
    )
  }
  if (!roles) {
    return (
      <Layout titulo="Roles y permisos">
        <Cargando />
      </Layout>
    )
  }

  // Los permisos se agrupan por módulo, que es como los expone el backend.
  const porModulo = permisos.reduce((acc, p) => {
    ;(acc[p.modulo] ??= []).push(p)
    return acc
  }, {})

  return (
    <Layout
      titulo="Roles y permisos"
      descripcion="Los permisos son datos en la base: cambiarlos no exige redesplegar"
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => (
            <article key={r.codigo} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{r.nombre}</h2>
                  <p className="mt-1 text-xs text-gray-500">{r.descripcion}</p>
                </div>
                <KeyRound className="h-5 w-5 text-gray-300" />
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">
                {r.total_permisos}
                <span className="ml-1.5 text-sm font-normal text-gray-500">permisos</span>
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Permisos disponibles ({permisos.length})
          </h2>
          <div className="space-y-5">
            {Object.entries(porModulo).map(([modulo, lista]) => (
              <div key={modulo}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {modulo}
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {lista.map((p) => (
                    <li key={p.codigo} className="flex items-start gap-2">
                      <Etiqueta texto={p.codigo} />
                      <span className="text-sm text-gray-600">{p.descripcion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}
