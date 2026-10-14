'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

// Muestra una foto de documento del conductor. Las fotos son privadas: se piden
// al backend con el token del administrador y se muestran desde un blob local
// (un <img src=URL> normal no puede enviar el header Authorization).
export default function DocImagen({ archivo, etiqueta }) {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!archivo) return
    let url
    let cancelado = false
    api.get(`/api/admin/documentos/${archivo}`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelado) return
        url = URL.createObjectURL(data)
        setSrc(url)
      })
      .catch(() => { if (!cancelado) setError(true) })
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [archivo])

  return (
    <div>
      <div className="text-[#6E6E73] text-xs font-medium mb-1.5">{etiqueta}</div>
      <div className="aspect-[4/3] rounded-xl bg-[#F5F5F7] border border-[#E2E2E7] overflow-hidden flex items-center justify-center">
        {!archivo ? (
          <span className="text-[#A1A1A6] text-xs">No subida</span>
        ) : error ? (
          <span className="text-[#D92D20] text-xs px-2 text-center">No se pudo cargar (¿se reinició el servidor?)</span>
        ) : !src ? (
          <span className="text-[#A1A1A6] text-xs">Cargando…</span>
        ) : (
          <a href={src} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={src} alt={etiqueta} className="w-full h-full object-cover" />
          </a>
        )}
      </div>
    </div>
  )
}
