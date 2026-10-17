'use client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'

// Las fotos son privadas (piden sesión): se bajan una vez por conductor y se reutilizan.
const fotos = new Map() // id → Promise<string | null>
const cargarFoto = (id) => {
  if (!fotos.has(id)) {
    fotos.set(id, api.get(`/api/conductores/${id}/foto`, { responseType: 'blob' })
      .then(({ data }) => URL.createObjectURL(data))
      .catch(() => null))
  }
  return fotos.get(id)
}

// Rostro del conductor para el pasajero; si no hay foto, la inicial de su nombre.
export default function AvatarConductor({ id, nombre, tam = 44, conFoto = false }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!id || !conFoto) return
    let vivo = true
    cargarFoto(id).then(u => { if (vivo) setSrc(u) })
    return () => { vivo = false }
  }, [id, conFoto])

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Foto de ${nombre}`} width={tam} height={tam} className="rounded-full object-cover shrink-0 border border-[#E2E2E7]" style={{ width: tam, height: tam }} />
  }
  return (
    <div className="rounded-full bg-[#EAF2FE] text-[#0A66E0] font-semibold flex items-center justify-center shrink-0"
      style={{ width: tam, height: tam, fontSize: tam * 0.4 }}>
      {(nombre || '?').trim().charAt(0).toUpperCase()}
    </div>
  )
}

// «Documentos verificados»: identidad, licencia, SOAT, revisión y antecedentes revisados por SafO
export function InsigniaVerificado({ compacta = false }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#1A7F4B] bg-[#E6F4EC] rounded-full font-semibold whitespace-nowrap"
      style={{ fontSize: compacta ? 10.5 : 11.5, padding: compacta ? '1px 7px' : '2px 8px' }} title="Identidad, licencia, SOAT y antecedentes revisados por SafO">
      <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: compacta ? 9 : 10 }} />Verificado
    </span>
  )
}
