import { CampoFijo, Seccion, Seleccion, SiNo, Texto } from '../ui/campos'
import { cargosDe } from '../../hooks/useCatalogos'

/**
 * Campos del candidato: Campaña/Cargo/Nombre/Documento/Edad/Correo, Contacto,
 * Gestión y Otros datos. Compartido entre `NuevoCandidato.jsx` (crear) y
 * `EditarCandidato.jsx` (editar), para no duplicar ~150 líneas de formulario
 * entre los dos.
 *
 * "Citado" (+ "Estado gestión reclutamiento", que solo aplica con Citado =
 * No) es exclusivo de creación: el backend no lo acepta en `PUT
 * /candidatos/:id` (ver `candidato.schema.js::actualizar` — citar crea una
 * citación real y mueve el estado, dejarlo como marca suelta editable
 * volvería a desincronizar la marca del estado real). En modo "editar" se
 * muestra de solo lectura, para que no desaparezca sin explicación.
 */
export default function CandidatoCampos({ datos, set, errorDe, catalogos, modo = 'crear' }) {
  const cambiarCliente = (cliente) => set({ cliente, cargo: '' })

  const cambiarCitado = (citado) =>
    set({ citado, estadoGestion: citado === false ? datos.estadoGestion : '' })

  return (
    <>
      <Seccion titulo="Candidato" columnas={3}>
        <Seleccion
          etiqueta="Campaña"
          requerido
          opciones={catalogos.clientes}
          value={datos.cliente ?? ''}
          onChange={(e) => cambiarCliente(e.target.value)}
          error={errorDe('cliente')}
        />
        <Seleccion
          etiqueta="Cargo"
          requerido
          disabled={!datos.cliente}
          opciones={cargosDe(catalogos, datos.cliente)}
          value={datos.cargo ?? ''}
          onChange={(e) => set({ cargo: e.target.value })}
          error={errorDe('cargo')}
          vacio={datos.cliente ? 'Selecciona…' : 'Elige primero la campaña'}
        />
        <Texto
          etiqueta="Nombre"
          requerido
          value={datos.nombreCompleto ?? ''}
          onChange={(e) => set({ nombreCompleto: e.target.value })}
          error={errorDe('nombreCompleto')}
          ayuda="Nombre completo. Las dos últimas palabras se toman como apellidos."
        />
        <Seleccion
          etiqueta="Tipo de documento"
          requerido
          opciones={catalogos.tipos_documento}
          value={datos.tipoDocumento ?? ''}
          onChange={(e) => set({ tipoDocumento: e.target.value })}
          error={errorDe('tipoDocumento')}
        />
        <Texto
          etiqueta="Documento"
          inputMode="numeric"
          value={datos.numeroDocumento ?? ''}
          onChange={(e) => set({ numeroDocumento: e.target.value })}
          error={errorDe('numeroDocumento')}
        />
        <Texto
          etiqueta="Edad"
          type="number"
          min="14"
          max="99"
          value={datos.edad ?? ''}
          onChange={(e) => set({ edad: e.target.value })}
          error={errorDe('edad')}
        />
        <Texto
          etiqueta="Correo"
          type="email"
          value={datos.email ?? ''}
          onChange={(e) => set({ email: e.target.value })}
          error={errorDe('email')}
          ayuda="Sin correo no se le puede enviar el formulario."
        />
      </Seccion>

      <Seccion titulo="Contacto" columnas={3}>
        <Texto
          etiqueta="Celular"
          requerido
          inputMode="tel"
          value={datos.celular ?? ''}
          onChange={(e) => set({ celular: e.target.value })}
          error={errorDe('celular')}
        />
        <SiNo
          etiqueta="Llamada"
          valor={datos.contactoLlamada}
          onChange={(v) => set({ contactoLlamada: v })}
        />
        <SiNo
          etiqueta="WhatsApp"
          valor={datos.contactoWhatsapp}
          onChange={(v) => set({ contactoWhatsapp: v })}
        />
      </Seccion>

      <Seccion titulo="Gestión" columnas={3}>
        <Texto
          etiqueta="Perfil"
          value={datos.perfil ?? ''}
          onChange={(e) => set({ perfil: e.target.value })}
          error={errorDe('perfil')}
          maxLength={255}
        />
        {modo === 'crear' ? (
          <>
            <SiNo
              etiqueta="Citado"
              valor={datos.citado}
              onChange={cambiarCitado}
              ayuda="Con Sí queda citado, sin pasar por Selección."
            />
            {datos.citado === false && (
              <Seleccion
                etiqueta="Estado gestión reclutamiento"
                opciones={catalogos.estados_gestion_reclutamiento}
                value={datos.estadoGestion ?? ''}
                onChange={(e) => set({ estadoGestion: e.target.value })}
                ayuda="Por qué no se citó al candidato."
              />
            )}
          </>
        ) : (
          <CampoFijo
            etiqueta="Citado"
            valor={datos.citado ? 'Sí' : 'No'}
            ayuda='Para citarlo usa el botón "Citar" en Candidatos, no aquí.'
          />
        )}
      </Seccion>

      <Seccion titulo="Otros datos" descripcion="No van en el formato oficial." columnas={3}>
        <Seleccion
          etiqueta="Fuente de reclutamiento"
          opciones={catalogos.fuentes_reclutamiento}
          value={datos.fuenteReclutamiento ?? ''}
          onChange={(e) => set({ fuenteReclutamiento: e.target.value })}
        />
      </Seccion>
    </>
  )
}
