'use client'
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'

// Muestra una foto o PDF de un documento del conductor. Los archivos son privados: se piden
// al backend con el token del administrador y se muestran desde un blob local
// (un <img src=URL> normal no puede enviar el header Authorization).
export default function DocImagen({ archivo, etiqueta }) {
  const [src, setSrc] = useState(null)
  const [pdf, setPdf] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!archivo) return
    let url
    let cancelado = false
    api.get(`/api/admin/documentos/${archivo}`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelado) return
        url = URL.createObjectURL(data)
        setPdf(data.type === 'application/pdf')
        setSrc(url)
      })
      .catch(() => { if (!cancelado) setError(true) })
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [archivo])

  return (
    <div data-doc={etiqueta}>
      <div className="text-[#6E6E73] text-xs font-medium mb-1.5">{etiqueta}</div>
      <div className="aspect-[4/3] rounded-xl bg-[#F5F5F7] border border-[#E2E2E7] overflow-hidden flex items-center justify-center">
        {!archivo ? (
          <span className="text-[#A1A1A6] text-xs">No subida</span>
        ) : error ? (
          <span className="text-[#D92D20] text-xs px-2 text-center">No se pudo cargar (¿se reinició el servidor?)</span>
        ) : !src ? (
          <span className="text-[#A1A1A6] text-xs">Cargando…</span>
        ) : pdf ? (
          <a href={src} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 text-[#4A4F5C] hover:text-[#0A66E0]">
            <FontAwesomeIcon icon={faFilePdf} className="text-3xl" />
            <span className="text-xs font-medium">Abrir PDF</span>
          </a>
        ) : (
          <a href={src} target="_blank" rel="noreferrer" className="block w-full h-full">
            <img src={src} alt={etiqueta} className="w-full h-full object-cover" />
          </a>
        )}
      </div>
    </div>
  )
}
