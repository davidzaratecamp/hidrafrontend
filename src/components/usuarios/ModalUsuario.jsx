import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Boton, Error, Modal } from '../ui'
import { Texto } from '../ui/campos'
import api from '../../services/api'

/**
 * Alta y edición de un usuario.
 *
 * Un usuario tiene VARIOS roles: no hay desplegable de rol único, se marcan
 * casillas y el backend guarda la relación M:N. Sus permisos efectivos son la
 * unión de los de todos sus roles.
 */
export default function ModalUsuario({ usuario, roles, onCerrar, onListo }) {
  const esNuevo = !usuario.id

  const [datos, setDatos] = useState({
    nombreCompleto: usuario.nombre_completo ?? '',
    email: usuario.email ?? '',
    numeroDocumento: usuario.numero_documento ?? '',
    password: '',
  })
  const [seleccionados, setSeleccionados] = useState(
    new Set((usuario.roles ?? []).map((r) => r.codigo))
  )
  const [error, setError] = useState(null)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const alternar = (codigo) =>
    setSeleccionados((previo) => {
      const copia = new Set(previo)
      if (copia.has(codigo)) copia.delete(codigo)
      else copia.add(codigo)
      return copia
    })

  async function guardar() {
    setGuardando(true)
    setError(null)
    setErrores({})
    try {
      const cuerpo = {
        nombreCompleto: datos.nombreCompleto,
        email: datos.email,
        roles: [...seleccionados],
        ...(datos.numeroDocumento ? { numeroDocumento: datos.numeroDocumento } : {}),
      }

      if (esNuevo) await api.post('/usuarios', { ...cuerpo, password: datos.password })
      // Al editar no se toca la contraseña: cambiarla es cosa del propio usuario.
      else await api.patch(`/usuarios/${usuario.id}`, cuerpo)

      onListo()
    } catch (e) {
      setError(e.message)
      setErrores(Object.fromEntries(e.erroresDeCampo.map((d) => [d.campo, d.mensaje])))
    } finally {
      setGuardando(false)
    }
  }

  const campo = (nombre) => ({
    value: datos[nombre],
    onChange: (e) => setDatos({ ...datos, [nombre]: e.target.value }),
    error: errores[`body.${nombre}`],
  })

  return (
    <Modal titulo={esNuevo ? 'Nuevo usuario' : 'Editar usuario'} onCerrar={onCerrar}>
      <div className="space-y-4">
        <Texto etiqueta="Nombre completo" requerido {...campo('nombreCompleto')} />
        <Texto etiqueta="Correo electrónico" requerido type="email" {...campo('email')} />
        <Texto
          etiqueta="Número de documento"
          inputMode="numeric"
          ayuda="Necesario para consultar sus desprendibles de nómina."
          {...campo('numeroDocumento')}
        />
        {esNuevo && (
          <Texto
            etiqueta="Contraseña"
            requerido
            type="password"
            ayuda="Mínimo 10 caracteres, con mayúscula, minúscula y número."
            {...campo('password')}
          />
        )}

        <div>
          <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <KeyRound className="h-4 w-4 text-gray-400" /> Roles
            <span className="text-red-500">*</span>
          </span>
          <div className="space-y-2">
            {roles.map((r) => (
              <label
                key={r.codigo}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={seleccionados.has(r.codigo)}
                  onChange={() => alternar(r.codigo)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{r.nombre}</span>
                  <span className="block text-xs text-gray-500">
                    {r.descripcion} · {r.total_permisos} permisos
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <Error mensaje={error} />

        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} cargando={guardando} disabled={seleccionados.size === 0}>
            {esNuevo ? 'Crear usuario' : 'Guardar cambios'}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
