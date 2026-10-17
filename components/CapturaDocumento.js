'use client'
import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faUpload, faXmark, faCircleCheck, faFilePdf, faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

const MAX_MB = 8          // igual que el servidor
const MAX_LADO = 1600     // las fotos de celular se reducen: pesan menos y se leen igual
const IMAGENES = ['image/jpeg', 'image/png', 'image/webp']

export const pesoLegible = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

// Reduce una foto grande a JPEG de hasta 1600 px (los PDF y las fotos ya livianas pasan igual).
async function prepararArchivo(archivo, aceptaPdf) {
  if (archivo.type === 'application/pdf') {
    if (!aceptaPdf) throw new Error('Aquí solo se aceptan fotos (JPG, PNG o WEBP)')
    if (archivo.size > MAX_MB * 1048576) throw new Error(`El PDF pesa más de ${MAX_MB} MB`)
    return archivo
  }
  if (!IMAGENES.includes(archivo.type)) {
    throw new Error(aceptaPdf ? 'Sube una foto (JPG, PNG, WEBP) o un PDF' : 'Sube una foto en JPG, PNG o WEBP')
  }
  let bitmap
  try {
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('No pudimos leer esa imagen. Toma la foto de nuevo o usa otro archivo.')
  }
  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height))
  if (escala === 1 && archivo.size <= 900 * 1024) { bitmap.close?.(); return archivo }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // los PNG con transparencia no quedan negros en JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise(ok => canvas.toBlob(ok, 'image/jpeg', 0.85))
  if (!blob) throw new Error('No pudimos procesar la imagen')
  if (blob.size > MAX_MB * 1048576) throw new Error(`La imagen pesa más de ${MAX_MB} MB`)
  const nombre = (archivo.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() })
}

// Visor de cámara en pantalla completa (computadoras y navegadores sin captura nativa).
// En celulares se usa mejor la cámara del propio sistema: ver `tomarFoto` abajo.
function VisorCamara({ titulo, frontal, onFoto, onCerrar }) {
  const videoRef = useRef(null)
  const flujoRef = useRef(null)
  const [error, setError] = useState('')
  const [lista, setLista] = useState(false)
  const [captura, setCaptura] = useState(null) // { blob, url }

  const parar = () => { flujoRef.current?.getTracks().forEach(t => t.stop()); flujoRef.current = null }

  const encender = async () => {
    setError(''); setLista(false)
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: frontal ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      flujoRef.current = flujo
      if (videoRef.current) { videoRef.current.srcObject = flujo; await videoRef.current.play().catch(() => {}) }
      setLista(true)
    } catch (e) {
      setError(e?.name === 'NotAllowedError'
        ? 'No diste permiso a la cámara. Actívalo en el navegador o sube un archivo.'
        : 'No encontramos una cámara disponible. Sube un archivo desde tu equipo.')
    }
  }

  useEffect(() => {
    encender()
    const tecla = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', tecla)
    return () => { window.removeEventListener('keydown', tecla); parar() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { if (captura?.url) URL.revokeObjectURL(captura.url) }, [captura])

  const capturar = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    c.toBlob(blob => { if (blob) setCaptura({ blob, url: URL.createObjectURL(blob) }) }, 'image/jpeg', 0.92)
  }

  const usar = () => {
    parar()
    onFoto(new File([captura.blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' }))
  }

  const repetir = () => { setCaptura(null) }

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Cámara: ${titulo}`}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[15px] font-semibold text-[#16181D]">{titulo}</span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar cámara" className="p-2 rounded-full hover:bg-[#F5F5F7]">
            <FontAwesomeIcon icon={faXmark} className="text-[#6E6E73]" />
          </button>
        </div>
        <div className="relative bg-black aspect-[4/3]">
          {/* El video se mantiene montado para no perder la cámara al revisar la captura */}
          <video ref={videoRef} playsInline muted aria-label="Vista de la cámara"
            className={`w-full h-full object-cover ${frontal ? '[transform:scaleX(-1)]' : ''} ${captura ? 'invisible' : ''}`} />
          {captura && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={captura.url} alt="Foto tomada" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {!lista && !error && <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">Abriendo cámara…</div>}
          {error && <div role="alert" className="absolute inset-0 flex items-center justify-center text-white text-sm text-center p-6">{error}</div>}
        </div>
        <div className="p-4 flex gap-3">
          {captura ? (
            <>
              <button type="button" onClick={repetir} className="f-btn f-btn-sec"><FontAwesomeIcon icon={faRotateRight} className="mr-2 text-xs" />Repetir</button>
              <button type="button" onClick={usar} className="f-btn"><FontAwesomeIcon icon={faCircleCheck} className="mr-2 text-xs" />Usar esta foto</button>
            </>
          ) : error ? (
            <>
              <button type="button" onClick={encender} className="f-btn f-btn-sec">Reintentar</button>
              <button type="button" onClick={onCerrar} className="f-btn">Cerrar</button>
            </>
          ) : (
            <button type="button" onClick={capturar} disabled={!lista} className="f-btn"><FontAwesomeIcon icon={faCamera} className="mr-2" />Tomar foto</button>
          )}
        </div>
      </div>
    </div>
  )
}

// Un documento del formulario: se puede TOMAR con la cámara o SUBIR desde el equipo.
//   valor: File | null          onCambio(campo, File | null)
//   aceptaPdf: certificados y constancias que muchas veces están en PDF
//   frontal: usa la cámara frontal (selfies)
// Vive en su propio archivo (fuera de las páginas) para que el formulario no pierda el foco al escribir.
export default function CapturaDocumento({ campo, label, ayuda, valor, onCambio, aceptaPdf = false, frontal = false, opcional = false, compacto = false }) {
  const inputCamara = useRef(null)
  const inputArchivo = useRef(null)
  const [visor, setVisor] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [url, setUrl] = useState(null)

  // Vista previa local; se libera al cambiar o desmontar
  useEffect(() => {
    if (!valor || valor.type === 'application/pdf') { setUrl(null); return }
    const u = URL.createObjectURL(valor)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [valor])

  const recibir = async (archivo) => {
    if (!archivo) return
    setError(''); setOcupado(true)
    try {
      onCambio(campo, await prepararArchivo(archivo, aceptaPdf))
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const tomarFoto = () => {
    setError('')
    const tactil = window.matchMedia?.('(pointer: coarse)').matches
    // En celulares y tabletas, la cámara del sistema (mejor enfoque, flash y resolución).
    // En computadoras, un visor propio con getUserMedia; si no existe, el selector de archivos.
    if (tactil || !navigator.mediaDevices?.getUserMedia) inputCamara.current?.click()
    else setVisor(true)
  }

  const esPdf = valor?.type === 'application/pdf'
  const alto = compacto ? 'h-24' : 'h-32'

  return (
    <div className="f-campo" data-campo-doc={campo}>
      <span className="f-etiqueta">{label}{opcional && <small>opcional</small>}</span>
      {ayuda && <span className="f-ayuda">{ayuda}</span>}

      {valor ? (
        <div className="rounded-[10px] border border-[#16181D] overflow-hidden bg-[#F6F7F9]">
          <div className={`relative ${alto} flex items-center justify-center`}>
            {esPdf ? (
              <div className="flex flex-col items-center text-[#4A4F5C]">
                <FontAwesomeIcon icon={faFilePdf} className="text-3xl mb-1.5" />
                <span className="text-[12.5px] font-medium max-w-[11rem] truncate">{valor.name}</span>
                <span className="text-[12px] text-[#7A7F8C]">{pesoLegible(valor.size)}</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              url && <img src={url} alt={`Vista previa: ${label}`} className="w-full h-full object-cover" />
            )}
            <span className="absolute top-2 right-2 bg-[#16181D] rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
              <FontAwesomeIcon icon={faCircleCheck} className="text-[11px] text-white" />
            </span>
          </div>
          <div className="flex border-t border-[#E2E2E7]">
            <button type="button" onClick={tomarFoto} aria-label={`Cambiar con la cámara: ${label}`}
              className="flex-1 py-2 text-[12.5px] font-medium text-[#4A4F5C] hover:bg-white"><FontAwesomeIcon icon={faCamera} className="mr-1.5" />Otra foto</button>
            <button type="button" onClick={() => inputArchivo.current?.click()} aria-label={`Cambiar archivo: ${label}`}
              className="flex-1 py-2 text-[12.5px] font-medium text-[#4A4F5C] hover:bg-white border-l border-[#E2E2E7]"><FontAwesomeIcon icon={faUpload} className="mr-1.5" />Cambiar</button>
            <button type="button" onClick={() => { setError(''); onCambio(campo, null) }} aria-label={`Quitar: ${label}`}
              className="px-3.5 py-2 text-[12.5px] font-medium text-[#D92D20] hover:bg-white border-l border-[#E2E2E7]"><FontAwesomeIcon icon={faXmark} /></button>
          </div>
        </div>
      ) : (
        <div className={`rounded-[10px] border border-dashed border-[#C2C6D0] bg-[#F6F7F9] p-2.5 grid grid-cols-2 gap-2`}>
          <button type="button" onClick={tomarFoto} disabled={ocupado} aria-label={`Tomar foto: ${label}`}
            className={`${compacto ? 'py-3' : 'py-4'} rounded-lg border border-[#E2E2E7] bg-white text-[#16181D] hover:border-[#0A66E0] disabled:opacity-60 flex flex-col items-center gap-1.5 transition`}>
            <FontAwesomeIcon icon={faCamera} className="text-lg text-[#4A4F5C]" />
            <span className="text-[13px] font-medium">{ocupado ? 'Procesando…' : 'Tomar foto'}</span>
          </button>
          <button type="button" onClick={() => inputArchivo.current?.click()} disabled={ocupado} aria-label={`Subir archivo: ${label}`}
            className={`${compacto ? 'py-3' : 'py-4'} rounded-lg border border-[#E2E2E7] bg-white text-[#16181D] hover:border-[#0A66E0] disabled:opacity-60 flex flex-col items-center gap-1.5 transition`}>
            <FontAwesomeIcon icon={faUpload} className="text-lg text-[#4A4F5C]" />
            <span className="text-[13px] font-medium">Subir archivo</span>
            <span className="text-[11px] text-[#8A8F9C] -mt-1">{aceptaPdf ? 'Foto o PDF' : 'Foto'}</span>
          </button>
        </div>
      )}

      {error && (
        <span role="alert" className="text-[12.5px] text-[#D92D20] flex items-start gap-1.5">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-[11px]" />{error}
        </span>
      )}

      {/* Entradas ocultas: la de cámara abre la cámara nativa del celular; la otra, el selector de archivos */}
      <input ref={inputCamara} type="file" accept="image/*" capture={frontal ? 'user' : 'environment'} className="hidden"
        data-campo={campo} data-modo="camara" tabIndex={-1} aria-hidden="true"
        onChange={e => { recibir(e.target.files[0]); e.target.value = '' }} />
      <input ref={inputArchivo} type="file" accept={aceptaPdf ? 'image/jpeg,image/png,image/webp,application/pdf' : 'image/jpeg,image/png,image/webp'} className="hidden"
        data-campo={campo} data-modo="subir" tabIndex={-1} aria-hidden="true"
        onChange={e => { recibir(e.target.files[0]); e.target.value = '' }} />

      {visor && <VisorCamara titulo={label} frontal={frontal} onCerrar={() => setVisor(false)}
        onFoto={f => { setVisor(false); recibir(f) }} />}
    </div>
  )
}
