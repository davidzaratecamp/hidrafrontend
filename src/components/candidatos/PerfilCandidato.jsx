import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, Mail, UserCog } from 'lucide-react'
import Layout from '../layout/Layout'
import { Boton, Cargando, Error, Etiqueta } from '../ui'
import { nombreDe } from '../ui/formato'
import { useAuth } from '../../context/useAuth'
import { useRecurso } from '../../hooks/useRecurso'
import api from '../../services/api'

import Ficha from './perfil/Ficha'
import Historial from './perfil/Historial'
import ExpedienteSeleccion from './perfil/ExpedienteSeleccion'
import Antecedentes from './perfil/Antecedentes'
import { ModalEstado, ModalReasignar } from './perfil/modales'

/**
 * Perfil del candidato.
 *
 * Este archivo es solo el armazón: cabecera, pestañas y acciones. Cada pestaña
 * es un componente que carga sus propios datos, así que abrir el perfil no pide
 * el expediente de selección ni los antecedentes hasta que hacen falta.
 */

const PESTANAS = [
  { clave: 'ficha', etiqueta: 'Ficha' },
  { clave: 'historial', etiqueta: 'Historial' },
  { clave: 'seleccion', etiqueta: 'Selección' },
  { clave: 'antecedentes', etiqueta: 'Antecedentes' },
]

export default function PerfilCandidato() {
  const { candidatoId } = useParams()
  const { hasPermission } = useAuth()

  const { datos: candidato, cargando, error, recargar } = useRecurso(
    () => api.get(`/candidatos/${candidatoId}`),
    [candidatoId]
  )

  const [pestana, setPestana] = useState('ficha')
  const [modal, setModal] = useState(null)
  const [aviso, setAviso] = useState(null)

  async function enviarFormulario() {
    setAviso(null)
    try {
      const r = await api.post(`/candidatos/${candidatoId}/enviar-formulario`)
      setAviso({ tono: 'exito', texto: `Formulario enviado a ${r.destinatario}.` })
      recargar()
    } catch (e) {
      // Si el correo falló, el backend igual devuelve el enlace para compartirlo
      // a mano: el token ya existe.
      const enlace = e.detalles?.link
      setAviso({ tono: 'error', texto: enlace ? `${e.message}. Enlace: ${enlace}` : e.message })
    }
  }

  if (cargando && !candidato) {
    return (
      <Layout titulo="Candidato">
        <Cargando />
      </Layout>
    )
  }
  if (error) {
    return (
      <Layout titulo="Candidato">
        <Error mensaje={error} onReintentar={recargar} />
      </Layout>
    )
  }

  const cerrarModal = () => setModal(null)
  const trasAccion = () => {
    cerrarModal()
    recargar()
  }

  return (
    <Layout
      titulo={nombreDe(candidato)}
      descripcion={`${candidato.cliente} · ${candidato.cargo}`}
      acciones={
        <div className="flex flex-wrap gap-2">
          {hasPermission('reenviar_emails') && (
            <Boton variante="secundario" onClick={enviarFormulario}>
              <Mail className="h-4 w-4" /> Enviar formulario
            </Boton>
          )}
          {hasPermission('reasignar_candidatos') && (
            <Boton variante="secundario" onClick={() => setModal('reasignar')}>
              <UserCog className="h-4 w-4" /> Reasignar
            </Boton>
          )}
          <Boton onClick={() => setModal('estado')}>
            <ArrowRight className="h-4 w-4" /> Cambiar estado
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Etiqueta texto={candidato.estado_nombre} tono="azul" />
          <span className="text-sm text-gray-500">
            Formulario: {candidato.formulario.completados}/{candidato.formulario.total} pasos
          </span>
          {candidato.reclutador_nombre && (
            <span className="text-sm text-gray-500">· {candidato.reclutador_nombre}</span>
          )}
        </div>

        {aviso && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              aviso.tono === 'exito'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {aviso.texto}
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                pestana === p.clave
                  ? 'border-blue-600 text-blue-700 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        {pestana === 'ficha' && <Ficha candidato={candidato} candidatoId={candidatoId} />}
        {pestana === 'historial' && <Historial historial={candidato.historial} />}
        {pestana === 'seleccion' && <ExpedienteSeleccion candidatoId={candidatoId} />}
        {pestana === 'antecedentes' && (
          <Antecedentes
            candidatoId={candidatoId}
            puedeGestionar={hasPermission('gestionar_antecedentes')}
          />
        )}
      </div>

      {modal === 'estado' && (
        <ModalEstado candidatoId={candidatoId} onCerrar={cerrarModal} onListo={trasAccion} />
      )}
      {modal === 'reasignar' && (
        <ModalReasignar candidatoId={candidatoId} onCerrar={cerrarModal} onListo={trasAccion} />
      )}
    </Layout>
  )
}
