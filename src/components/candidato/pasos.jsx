import { AreaTexto, Campo, CampoFijo, Escala, Seccion, Seleccion, SiNo, Texto } from '../ui/campos'
import { fecha } from '../ui/formato'

/**
 * Los 6 pasos del formulario del candidato.
 *
 * Cada paso recibe `datos`, `set`, `catalogos` y `candidato`, y devuelve el
 * cuerpo que se envía al backend con `aCuerpo()`. Así el componente contenedor
 * no sabe nada de los campos concretos: agregar un campo se hace en un solo
 * lugar. `candidato` es lo que ya capturó el reclutador (de solo lectura para
 * el candidato); casi ningún paso lo necesita, solo el que muestra ese bloque.
 *
 * Los catálogos vienen del backend (`GET /api/catalogos`), no de constantes en
 * el frontend: cambiar una EPS o un cargo ya no exige redesplegar.
 */

const NIVEL_INFORMATICO = 'conocimientos_informaticos'

// ---------------------------------------------------------------- paso 1 ----
/**
 * Bloque "DATOS BÁSICOS" de la plantilla de hoja de vida (fecha de entrevista,
 * cargo, fuente de reclutamiento, aspiración salarial). Los tres primeros los
 * fijó quien registró al candidato: el candidato solo los ve, no los edita —
 * lo único que aporta acá es su aspiración salarial.
 */
export const hojaVida = {
  clave: 'hoja_vida',
  titulo: 'Datos básicos',
  descripcion: 'Así quedó tu registro. Cargo y fuente los define quien te contactó; la aspiración salarial la defines tú.',
  Formulario: ({ datos, set, candidato }) => (
    <Seccion columnas={2}>
      <CampoFijo etiqueta="Fecha de entrevista" valor={fecha(candidato?.fechaEnvioEmail)} />
      <CampoFijo etiqueta="Cargo al que aspira" valor={candidato?.cargo ?? '—'} />
      <CampoFijo etiqueta="Fuente de reclutamiento" valor={candidato?.fuenteReclutamiento ?? '—'} />
      <Texto
        etiqueta="Aspiración salarial (COP)"
        type="number"
        min="0"
        max="99999999"
        inputMode="numeric"
        placeholder="Ej. 1800000"
        value={datos.aspiracionSalarial ?? ''}
        onChange={(e) => set({ aspiracionSalarial: e.target.value })}
        ayuda="Solo números, sin puntos ni signos."
      />
    </Seccion>
  ),
  aCuerpo: (d) =>
    d.aspiracionSalarial ? { aspiracionSalarial: Number(d.aspiracionSalarial) } : {},
}

// ---------------------------------------------------------------- paso 2 ----
/**
 * Bloque "DATOS PERSONALES" de la plantilla de hoja de vida, EN ESE ORDEN
 * exacto (nombres, correo, documento, EPS, nacionalidad, fondo de pensión,
 * edad, dirección, barrio, estado civil, talla de camisa, celular, RH).
 * Correo y nacionalidad son de solo lectura: el correo es al que ya se le
 * envió este link, y la nacionalidad se deriva del tipo de documento — ninguno
 * de los dos lo escribe el candidato. "Contacto de emergencia" es su propio
 * bloque en la plantilla, aparte de este.
 */
export const datosBasicos = {
  clave: 'datos_basicos',
  titulo: 'Datos personales',
  descripcion: 'Verifica tus datos personales y de contacto.',
  Formulario: ({ datos, set, catalogos, candidato }) => (
    <div className="space-y-6">
      <Seccion>
        <Texto
          etiqueta="Nombres completos"
          maxLength={64}
          value={datos.nombreCompleto ?? ''}
          onChange={(e) => set({ nombreCompleto: e.target.value })}
          ayuda="Nombres y apellidos, como aparecen en tu documento."
        />
        <CampoFijo etiqueta="Correo electrónico" valor={candidato?.email || '—'} />
        <Texto
          etiqueta="N° de documento"
          inputMode="numeric"
          maxLength={20}
          value={datos.numeroDocumento ?? ''}
          onChange={(e) => set({ numeroDocumento: e.target.value })}
        />
        <Seleccion
          etiqueta="EPS"
          opciones={catalogos.eps}
          value={datos.eps ?? ''}
          onChange={(e) => set({ eps: e.target.value })}
        />
        <CampoFijo etiqueta="Nacionalidad" valor={candidato?.nacionalidad || '—'} />
        <Seleccion
          etiqueta="Fondo de pensión"
          opciones={catalogos.afp}
          value={datos.afp ?? ''}
          onChange={(e) => set({ afp: e.target.value })}
        />
        <Texto
          etiqueta="Edad"
          type="number"
          min="14"
          max="99"
          value={datos.edad ?? ''}
          onChange={(e) => set({ edad: e.target.value })}
        />
        <Texto
          etiqueta="Dirección residencial"
          maxLength={53}
          value={datos.direccionResidencial ?? ''}
          onChange={(e) => set({ direccionResidencial: e.target.value })}
        />
        <Texto
          etiqueta="Barrio"
          maxLength={21}
          value={datos.barrio ?? ''}
          onChange={(e) => set({ barrio: e.target.value })}
        />
        <Seleccion
          etiqueta="Estado civil"
          opciones={catalogos.estados_civiles}
          value={datos.estadoCivil ?? ''}
          onChange={(e) => set({ estadoCivil: e.target.value })}
        />
        <Seleccion
          etiqueta="Talla de camisa"
          opciones={catalogos.tallas_camisa}
          value={datos.tallaCamisa ?? ''}
          onChange={(e) => set({ tallaCamisa: e.target.value })}
        />
        <Texto
          etiqueta="Celular"
          inputMode="tel"
          maxLength={18}
          value={datos.celular ?? ''}
          onChange={(e) => set({ celular: e.target.value })}
        />
        <Seleccion
          etiqueta="RH"
          opciones={catalogos.grupos_sanguineos}
          value={datos.grupoSanguineo ?? ''}
          onChange={(e) => set({ grupoSanguineo: e.target.value })}
        />
      </Seccion>

      {/* Bloque "CONTACTO DE EMERGENCIA" de la plantilla, en su mismo orden. */}
      <Seccion titulo="Contacto de emergencia">
        <Seleccion
          etiqueta="Parentesco"
          opciones={catalogos.parentescos}
          value={datos.parentescoEmergencia ?? ''}
          onChange={(e) => set({ parentescoEmergencia: e.target.value })}
        />
        <Texto
          etiqueta="Nombre completo"
          maxLength={50}
          value={datos.nombreEmergencia ?? ''}
          onChange={(e) => set({ nombreEmergencia: e.target.value })}
        />
        <Texto
          etiqueta="Teléfono"
          inputMode="tel"
          maxLength={25}
          value={datos.numeroEmergencia ?? ''}
          onChange={(e) => set({ numeroEmergencia: e.target.value })}
        />
      </Seccion>
    </div>
  ),
  aCuerpo: (d) => limpiar(d),
}

// ---------------------------------------------------------------- paso 3 ----
/**
 * Un nivel se considera "lleno" cuando tiene sus 3 datos (institución/título/
 * año) o, para Conocimientos Informáticos, la descripción — mismo criterio que
 * ya exige `aCuerpo`/el backend para cualquier nivel con datos.
 */
function nivelLleno(codigo, valores) {
  const fila = valores[codigo] ?? {}
  return codigo === NIVEL_INFORMATICO
    ? Boolean(fila.descripcion)
    : Boolean(fila.nombreInstitucion && fila.tituloObtenido && fila.anoFinalizacion)
}

export const estudios = {
  clave: 'estudios',
  titulo: 'Información académica',
  descripcion: 'El bachillerato es obligatorio; el resto solo si aplica.',
  Formulario: ({ datos, set, catalogos }) => {
    const niveles = catalogos.niveles_estudios ?? []
    const valores = datos.estudios ?? {}

    const actualizar = (nivel, campo, valor) =>
      set({ estudios: { ...valores, [nivel]: { ...(valores[nivel] ?? {}), [campo]: valor } } })

    // Bachillerato (primer nivel) siempre visible; cada nivel siguiente solo
    // aparece una vez el anterior está lleno. Reactivo: si el candidato borra un
    // nivel ya lleno, el siguiente vuelve a ocultarse (sin perder sus datos).
    const nivelesVisibles = niveles.filter(
      (nivel, i) => i === 0 || nivelLleno(niveles[i - 1].codigo, valores)
    )

    return (
      <div className="space-y-5">
        {nivelesVisibles.map((nivel) => {
          const esInformatico = nivel.codigo === NIVEL_INFORMATICO
          const fila = valores[nivel.codigo] ?? {}
          const obligatorio = nivel.codigo === 'bachillerato'

          return (
            <fieldset
              key={nivel.codigo}
              className="rounded-xl border border-gray-200 p-4 space-y-4"
            >
              <legend className="px-1 text-sm font-semibold text-gray-900">
                {nivel.nombre}
                {obligatorio && <span className="text-red-500 ml-0.5">*</span>}
              </legend>

              {esInformatico ? (
                <AreaTexto
                  etiqueta="¿Qué herramientas manejas?"
                  filas={2}
                  maxLength={112}
                  placeholder="Ej. Excel avanzado, CRM Salesforce"
                  value={fila.descripcion ?? ''}
                  onChange={(e) => actualizar(nivel.codigo, 'descripcion', e.target.value)}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Texto
                    etiqueta="Nombre institución"
                    maxLength={40}
                    value={fila.nombreInstitucion ?? ''}
                    onChange={(e) =>
                      actualizar(nivel.codigo, 'nombreInstitucion', e.target.value)
                    }
                  />
                  <Texto
                    etiqueta="Título obtenido"
                    maxLength={43}
                    value={fila.tituloObtenido ?? ''}
                    onChange={(e) => actualizar(nivel.codigo, 'tituloObtenido', e.target.value)}
                  />
                  <Texto
                    etiqueta="Año de finalización"
                    type="number"
                    min="1950"
                    max="2100"
                    value={fila.anoFinalizacion ?? ''}
                    onChange={(e) => actualizar(nivel.codigo, 'anoFinalizacion', e.target.value)}
                  />
                </div>
              )}
            </fieldset>
          )
        })}
      </div>
    )
  },
  /** Solo se envían los niveles con algún dato: la tabla es 1:N, no 4 filas fijas. */
  aCuerpo: (d) => ({
    estudios: Object.entries(d.estudios ?? {})
      .filter(([, v]) => Object.values(v).some((x) => String(x ?? '').trim()))
      .map(([nivel, v]) => ({
        nivel,
        ...limpiar({
          nombreInstitucion: v.nombreInstitucion,
          tituloObtenido: v.tituloObtenido,
          anoFinalizacion: v.anoFinalizacion ? Number(v.anoFinalizacion) : undefined,
          descripcion: v.descripcion,
        }),
      })),
  }),
}

// ---------------------------------------------------------------- paso 4 ----
/**
 * "Tiempo laborado" es de solo lectura: se calcula acá igual que lo calcula
 * `hojaVidaPdfService.js` para la celda impresa (contra la fecha de retiro, o
 * contra hoy si el candidato sigue en ese empleo). No se envía al backend —
 * el PDF lo recalcula por su cuenta a partir de las fechas guardadas.
 */
function tiempoLaborado(fechaInicio, fechaRetiro) {
  if (!fechaInicio) return null
  const inicio = new Date(`${fechaInicio}T00:00:00`)
  const fin = fechaRetiro ? new Date(`${fechaRetiro}T00:00:00`) : new Date()
  let meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth())
  if (fin.getDate() < inicio.getDate()) meses -= 1
  if (meses < 0) return null
  const anos = Math.floor(meses / 12)
  const restoMeses = meses % 12
  return `${anos} ${anos === 1 ? 'año' : 'años'}, ${restoMeses} ${restoMeses === 1 ? 'mes' : 'meses'}`
}

/**
 * Solo 2 bloques, fijos: la plantilla trae exactamente dos —
 * "INFORMACIÓN ÚLTIMA O ACTUAL EMPRESA" y "ANTERIOR EMPLEO" — no hay una
 * tercera fila impresa donde poner un tercer empleo (`hojaVidaPdfService.js`
 * solo dibuja `orden === 1` y `orden === 2`). Antes se podían agregar hasta 3
 * con un botón "+"; un tercer empleo cargado así nunca aparecía en el PDF,
 * sin avisar — el mismo tipo de pérdida silenciosa que esta reescritura vino
 * a eliminar en otros lados.
 */
const EMPLEOS = [
  { orden: 1, titulo: 'Información última o actual empresa', opcional: false },
  { orden: 2, titulo: 'Anterior empleo', opcional: true },
]

/**
 * Un empleo se considera "lleno" con empresa + cargo + fecha de inicio (los 3
 * campos que lo identifican) — mismo criterio que `nivelLleno` en Estudios:
 * revelar el siguiente bloque solo cuando el anterior ya tiene con qué
 * completarse, no con el primer caracter escrito.
 */
function empleoLleno(exp) {
  return Boolean(exp?.nombreEmpresa && exp?.cargoDesempenado && exp?.fechaInicio)
}

export const experiencia = {
  clave: 'experiencia',
  titulo: 'Experiencia laboral',
  descripcion: 'Empieza por tu empleo más reciente. Deja la fecha de retiro vacía si sigues ahí.',
  Formulario: ({ datos, set, catalogos }) => {
    const lista = datos.experiencias ?? []
    const resumen = datos.resumen ?? {}

    const actualizar = (orden, campo, valor) =>
      set({
        experiencias: lista.some((e) => e.orden === orden)
          ? lista.map((e) => (e.orden === orden ? { ...e, [campo]: valor } : e))
          : [...lista, { orden, [campo]: valor }],
      })

    /**
     * "Actualmente trabajo aquí" (como en la interfaz anterior): marcar la
     * casilla vacía Fecha de retiro en el mismo cambio — no en dos
     * `actualizar()` seguidos, que pisarían el estado entre sí al partir los
     * dos del mismo `lista` ya desactualizado tras el primero.
     */
    const marcarTrabajaActualmente = (orden, marcado) =>
      set({
        experiencias: lista.some((e) => e.orden === orden)
          ? lista.map((e) =>
              e.orden === orden
                ? { ...e, trabajaActualmente: marcado, fechaRetiro: marcado ? '' : e.fechaRetiro }
                : e
            )
          : [...lista, { orden, trabajaActualmente: marcado }],
      })

    // "Anterior empleo" (opcional) solo se revela una vez que "Información
    // última o actual empresa" está lleno — mismo revelado progresivo que ya
    // tiene Información académica.
    const empleosVisibles = EMPLEOS.filter(
      (emp, i) => i === 0 || empleoLleno(lista.find((e) => e.orden === EMPLEOS[i - 1].orden))
    )

    return (
      <div className="space-y-6">
        {empleosVisibles.map(({ orden: i, titulo, opcional }) => {
          const exp = lista.find((e) => e.orden === i) ?? { orden: i }

          return (
          <fieldset key={i} className="rounded-xl border border-gray-200 p-4 space-y-4">
            <legend className="px-1 text-sm font-semibold text-gray-900">
              {titulo}
              {opcional && <span className="text-gray-400 font-normal ml-2">(opcional)</span>}
            </legend>

            {/* Bloque de la plantilla, en su mismo orden. El bloque "Anterior
                empleo" reutiliza el mismo formulario, aunque en la plantilla
                impresa solo se lea nombre, funciones, cargo y salario. */}
            <Texto
              etiqueta="Nombre de la empresa"
              maxLength={41}
              value={exp.nombreEmpresa ?? ''}
              onChange={(e) => actualizar(i, 'nombreEmpresa', e.target.value)}
            />

            <AreaTexto
              etiqueta="Funciones"
              filas={2}
              maxLength={151}
              value={exp.funciones ?? ''}
              onChange={(e) => actualizar(i, 'funciones', e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Texto
                etiqueta="Fecha de inicio"
                type="date"
                value={exp.fechaInicio ?? ''}
                onChange={(e) => actualizar(i, 'fechaInicio', e.target.value)}
              />
              <Texto
                etiqueta="Cargo desempeñado"
                maxLength={19}
                value={exp.cargoDesempenado ?? ''}
                onChange={(e) => actualizar(i, 'cargoDesempenado', e.target.value)}
              />
              <Campo etiqueta="Fecha de retiro">
                <input
                  type="date"
                  value={exp.fechaRetiro ?? ''}
                  onChange={(e) => actualizar(i, 'fechaRetiro', e.target.value)}
                  disabled={exp.trabajaActualmente === true}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    exp.trabajaActualmente ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-300 bg-white'
                  }`}
                />
                <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={exp.trabajaActualmente === true}
                    onChange={(e) => marcarTrabajaActualmente(i, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  Actualmente trabajo aquí
                </label>
              </Campo>
              <CampoFijo
                etiqueta="Tiempo laborado"
                valor={tiempoLaborado(exp.fechaInicio, exp.fechaRetiro) ?? '—'}
              />
              <Texto
                etiqueta="Salario ($)"
                type="number"
                min="0"
                max="99999999999999999"
                value={exp.salario ?? ''}
                onChange={(e) => actualizar(i, 'salario', e.target.value)}
              />
              <Texto
                etiqueta="Motivo de retiro"
                maxLength={27}
                value={exp.motivoRetiro ?? ''}
                onChange={(e) => actualizar(i, 'motivoRetiro', e.target.value)}
                disabled={exp.trabajaActualmente === true}
                placeholder={exp.trabajaActualmente ? 'No aplica: actualmente trabajas ahí' : undefined}
              />
            </div>
          </fieldset>
          )
        })}

        <Seccion titulo="Tu relación con ASISTE ING" columnas={1}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SiNo
              etiqueta="¿Has trabajado en ASISTE ING?"
              valor={resumen.haTrabajadoAsiste}
              onChange={(v) => set({ resumen: { ...resumen, haTrabajadoAsiste: v } })}
            />
            <SiNo
              etiqueta="¿Has estado en un proceso formativo con nosotros?"
              valor={resumen.haEstadoProcesoFormativoAsiste}
              onChange={(v) =>
                set({ resumen: { ...resumen, haEstadoProcesoFormativoAsiste: v } })
              }
            />
          </div>

          {resumen.haTrabajadoAsiste === true && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-lg bg-blue-50/60 p-4">
              <Seleccion
                etiqueta="Campaña en la que estuviste"
                opciones={catalogos.clientes}
                value={resumen.campanaAsiste ?? ''}
                onChange={(e) => set({ resumen: { ...resumen, campanaAsiste: e.target.value } })}
              />
              <Texto
                etiqueta="Fecha de ingreso"
                type="date"
                value={resumen.fechaInicioAsiste ?? ''}
                onChange={(e) =>
                  set({ resumen: { ...resumen, fechaInicioAsiste: e.target.value } })
                }
              />
              <Texto
                etiqueta="Fecha de retiro"
                type="date"
                value={resumen.fechaRetiroAsiste ?? ''}
                onChange={(e) =>
                  set({ resumen: { ...resumen, fechaRetiroAsiste: e.target.value } })
                }
              />
              <Texto
                etiqueta="Motivo de retiro"
                maxLength={35}
                value={resumen.motivoRetiroAsiste ?? ''}
                onChange={(e) =>
                  set({ resumen: { ...resumen, motivoRetiroAsiste: e.target.value } })
                }
              />
            </div>
          )}
        </Seccion>
      </div>
    )
  },
  aCuerpo: (d) => ({
    // `orden` se conserva tal cual (no se reindexa): 1 es siempre "empresa
    // actual" y 2 siempre "anterior empleo", aunque el candidato deje el
    // primer bloque vacío y solo llene el segundo.
    experiencias: (d.experiencias ?? [])
      .filter((e) => String(e.nombreEmpresa ?? '').trim())
      .map((e) => ({
        orden: e.orden,
        ...limpiar({
          nombreEmpresa: e.nombreEmpresa,
          cargoDesempenado: e.cargoDesempenado,
          salario: e.salario ? Number(e.salario) : undefined,
          funciones: e.funciones,
          fechaInicio: e.fechaInicio,
          motivoRetiro: e.motivoRetiro,
        }),
        // Explícitamente null: "sigo trabajando aquí".
        fechaRetiro: e.fechaRetiro || null,
      })),
    resumen: limpiar(d.resumen ?? {}),
  }),
}

// ---------------------------------------------------------------- paso 5 ----
export const personal = {
  clave: 'personal',
  titulo: 'Sobre ti',
  descripcion: 'Esta sección la revisa el área de selección durante la entrevista.',
  Formulario: ({ datos, set, catalogos }) => {
    const metas = datos.metas ?? {}
    const conocimientos = datos.conocimientos ?? {}

    return (
      <div className="space-y-6">
        <Seccion columnas={1}>
          <AreaTexto
            etiqueta="Tu núcleo familiar"
            filas={2}
            maxLength={1457}
            placeholder="¿Con quién vives?"
            value={datos.genograma ?? ''}
            onChange={(e) => set({ genograma: e.target.value })}
          />
          <AreaTexto
            etiqueta="Tus fortalezas"
            filas={2}
            maxLength={712}
            value={datos.fortalezas ?? ''}
            onChange={(e) => set({ fortalezas: e.target.value })}
          />
          <AreaTexto
            etiqueta="Aspectos por mejorar"
            filas={2}
            maxLength={394}
            value={datos.aspectosMejorar ?? ''}
            onChange={(e) => set({ aspectosMejorar: e.target.value })}
          />
          <AreaTexto
            etiqueta="Competencias laborales"
            filas={2}
            maxLength={632}
            value={datos.competenciasLaborales ?? ''}
            onChange={(e) => set({ competenciasLaborales: e.target.value })}
          />
        </Seccion>

        <Seccion titulo="Tus metas" columnas={1}>
          {[
            ['corto', 'A corto plazo', 44],
            ['mediano', 'A mediano plazo', 40],
            ['largo', 'A largo plazo', 44],
          ].map(([plazo, etiqueta, limite]) => (
            <Texto
              key={plazo}
              etiqueta={etiqueta}
              maxLength={limite}
              value={metas[plazo] ?? ''}
              onChange={(e) => set({ metas: { ...metas, [plazo]: e.target.value } })}
            />
          ))}
        </Seccion>

        <Seccion titulo="Conocimientos informáticos" descripcion="1 es básico, 5 es experto." columnas={1}>
          {(catalogos.herramientas_informaticas ?? []).map((h) => (
            <Escala
              key={h.codigo}
              etiqueta={h.nombre}
              valor={conocimientos[h.codigo]}
              onChange={(v) => set({ conocimientos: { ...conocimientos, [h.codigo]: v } })}
            />
          ))}
        </Seccion>

        <Seccion titulo="Salud" columnas={1}>
          <Texto
            etiqueta="¿Cómo está tu salud actualmente?"
            value={datos.estadoSaludActual ?? ''}
            onChange={(e) => set({ estadoSaludActual: e.target.value })}
          />
          <Escala
            etiqueta="Califícate de 1 a 5 como candidato"
            valor={datos.autoevaluacion}
            onChange={(v) => set({ autoevaluacion: v })}
          />
        </Seccion>

        {/* Último bloque de la plantilla: la página 2 termina con estas 3
            preguntas justo después de la autoevaluación. Aunque la
            respuesta se guarda junto con "Experiencia laboral"
            (`candidato_experiencia_resumen`), se capturan y envían desde
            acá porque es donde la plantilla las imprime. */}
        <Seccion columnas={1}>
          <SiNo
            etiqueta="¿Tu experiencia comercial es certificada, mínimo de 3 meses?"
            valor={datos.experienciaComercialCertificada}
            onChange={(v) => set({ experienciaComercialCertificada: v })}
          />
          <SiNo
            etiqueta="¿Tienes experiencia comercial pero no está certificada?"
            valor={datos.experienciaComercialNoCertificada}
            onChange={(v) => set({ experienciaComercialNoCertificada: v })}
          />
          <SiNo
            etiqueta="¿Es este tu primer empleo?"
            valor={datos.primerEmpleoFormal}
            onChange={(v) => set({ primerEmpleoFormal: v })}
          />
        </Seccion>
      </div>
    )
  },
  aCuerpo: (d) => ({
    ...limpiar({
      genograma: d.genograma,
      fortalezas: d.fortalezas,
      aspectosMejorar: d.aspectosMejorar,
      competenciasLaborales: d.competenciasLaborales,
      estadoSaludActual: d.estadoSaludActual,
      autoevaluacion: d.autoevaluacion,
      experienciaComercialCertificada: d.experienciaComercialCertificada,
      experienciaComercialNoCertificada: d.experienciaComercialNoCertificada,
      primerEmpleoFormal: d.primerEmpleoFormal,
    }),
    metas: limpiar(d.metas ?? {}),
    conocimientos: Object.entries(d.conocimientos ?? {})
      .filter(([, nivel]) => nivel)
      .map(([herramienta, nivel]) => ({ herramienta, nivel })),
  }),
}

// ---------------------------------------------------------------- paso 6 ----
export const consentimiento = {
  clave: 'consentimiento',
  titulo: 'Autorización de tratamiento de datos',
  descripcion: 'Último paso. Al aceptar se generan tus documentos para firma electrónica.',
  Formulario: ({ datos, set, catalogos }) => (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed max-h-56 overflow-y-auto">
        <p>
          Autorizo de manera libre, previa, expresa e informada a <strong>ASISTE ING</strong> para
          recolectar, almacenar, usar y tratar mis datos personales con la finalidad de adelantar
          el proceso de selección, verificar la información suministrada y, en caso de vinculación,
          gestionar la relación laboral.
        </p>
        <p className="mt-3">
          Declaro que la información que he entregado es veraz y que conozco mi derecho a
          conocerla, actualizarla, rectificarla y solicitar su supresión.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Seleccion
          etiqueta="Ciudad"
          requerido
          opciones={catalogos.ciudades}
          value={datos.ciudad ?? ''}
          onChange={(e) => set({ ciudad: e.target.value })}
        />
        <Texto
          etiqueta="Fecha"
          type="date"
          requerido
          value={datos.fecha ?? new Date().toISOString().slice(0, 10)}
          onChange={(e) => set({ fecha: e.target.value })}
        />
      </div>

      <Campo etiqueta="">
        <label className="flex items-start gap-3 rounded-lg border border-gray-300 p-4 cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={datos.aceptado === true}
            onChange={(e) => set({ aceptado: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            He leído y acepto la autorización de tratamiento de datos personales.
          </span>
        </label>
      </Campo>
    </div>
  ),
  aCuerpo: (d) => ({
    ciudad: d.ciudad || undefined,
    fecha: d.fecha || new Date().toISOString().slice(0, 10),
    aceptado: d.aceptado === true,
  }),
}

export const PASOS = [hojaVida, datosBasicos, estudios, experiencia, personal, consentimiento]

/** Quita los campos vacíos: el backend distingue "no enviado" de "vacío". */
function limpiar(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
    )
  )
}
