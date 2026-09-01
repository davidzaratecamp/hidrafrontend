import { useEffect, useState } from 'react'

/**
 * Búsqueda que espera a que el usuario deje de escribir.
 *
 * Sin esto se dispara una consulta por cada tecla. Estaba duplicado en
 * `ListaCandidatos` y `GestionUsuarios`, con el mismo retardo escrito a mano.
 *
 * Devuelve el texto que ve el usuario y el que debe usarse para consultar.
 */
export function useBusquedaDiferida(retardoMs = 350, alCambiar) {
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusqueda(texto.trim())
      alCambiar?.()
    }, retardoMs)
    return () => clearTimeout(temporizador)
    // `alCambiar` se omite a propósito: suele ser una función nueva en cada
    // render y reiniciaría el temporizador en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, retardoMs])

  return { texto, setTexto, busqueda }
}
