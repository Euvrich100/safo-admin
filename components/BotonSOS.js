'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faPhone, faXmark } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'

// Botón de emergencia (SOS) para pasajero y conductor durante un viaje.
// Pide confirmación para evitar toques accidentales, toma la ubicación y avisa al
// equipo de SafO; además deja a un toque la llamada a la Policía (105).
export default function BotonSOS({ posicion = null, className = '' }) {
  const [abierto, setAbierto] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const ubicacion = () => new Promise((resolver) => {
    if (posicion && Number.isFinite(Number(posicion[0]))) return resolver(posicion)
    if (!navigator.geolocation) return resolver(null)
    navigator.geolocation.getCurrentPosition(
      (p) => resolver([p.coords.latitude, p.coords.longitude]),
      () => resolver(null),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
    )
  })

  const enviar = async () => {
    setEnviando(true)
    try {
      const pos = await ubicacion()
      await api.post('/api/sos', { lat: pos?.[0], lng: pos?.[1], mensaje: mensaje.trim() })
      setEnviado(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar la alerta. Llama al 105.')
    } finally {
      setEnviando(false)
    }
  }

  const cerrar = () => { setAbierto(false); setEnviado(false); setMensaje('') }

  return (
    <>
      <button onClick={() => setAbierto(true)} aria-label="Botón de emergencia SOS"
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#D92D20] text-white text-sm font-bold shadow-lg shadow-[#D92D20]/30 hover:bg-[#B42318] active:scale-95 transition ${className}`}>
        <FontAwesomeIcon icon={faTriangleExclamation} />SOS
      </button>

      {abierto && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Emergencia">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCEAE9] text-[#D92D20] flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <button onClick={cerrar} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-[#F4F6FA] text-[#6E6E73]"><FontAwesomeIcon icon={faXmark} /></button>
            </div>

            {enviado ? (
              <>
                <h2 className="text-xl font-semibold text-[#14213D]">Alerta enviada</h2>
                <p className="text-sm text-[#6E6E73] mt-2">El equipo de SafO fue avisado con tu ubicación y los datos del viaje. Si estás en peligro inmediato, llama a la Policía.</p>
                <a href="tel:105" className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#D92D20] text-white font-semibold">
                  <FontAwesomeIcon icon={faPhone} />Llamar al 105 (Policía)
                </a>
                <button onClick={cerrar} className="mt-2 w-full py-3 rounded-2xl text-[#6E6E73] font-medium">Cerrar</button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-[#14213D]">¿Necesitas ayuda?</h2>
                <p className="text-sm text-[#6E6E73] mt-2">Enviaremos tu ubicación y los datos de tu viaje al equipo de SafO para que te contacte de inmediato.</p>
                <textarea rows={2} maxLength={300} value={mensaje} onChange={e => setMensaje(e.target.value)}
                  placeholder="Cuéntanos qué pasa (opcional)"
                  className="mt-4 w-full px-4 py-3 rounded-2xl bg-[#F4F6FA] text-sm focus:outline-none focus:ring-2 focus:ring-[#D92D20]/40 resize-none" />
                <button onClick={enviar} disabled={enviando}
                  className="mt-4 w-full py-3.5 rounded-2xl bg-[#D92D20] text-white font-semibold disabled:opacity-60">
                  {enviando ? 'Enviando alerta...' : 'Enviar alerta SOS'}
                </button>
                <a href="tel:105" className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#F4F6FA] text-[#14213D] font-medium text-sm">
                  <FontAwesomeIcon icon={faPhone} />Llamar directo al 105
                </a>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
