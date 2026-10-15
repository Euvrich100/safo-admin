'use client'
import { Suspense, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faShieldHalved, faLocationDot, faFlagCheckered, faStar, faCircleCheck, faTriangleExclamation, faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import SafoLogo from '@/components/SafoLogo'

const MapaConductor = dynamic(() => import('@/components/MapaConductor'), { ssr: false })

const ESTADOS = {
  solicitado: ['Esperando que el conductor acepte', '#B45309', '#FEF3E2'],
  aceptado: ['El conductor va a recoger al pasajero', '#0A66E0', '#EAF2FE'],
  en_camino: ['El conductor va a recoger al pasajero', '#0A66E0', '#EAF2FE'],
  recogido: ['Viaje en curso', '#0A66E0', '#EAF2FE'],
  completado: ['El viaje terminó. Llegó a su destino.', '#1D1D1F', '#F1F1F3'],
  cancelado_pasajero: ['El viaje fue cancelado', '#6E6E73', '#F5F5F7'],
  cancelado_conductor: ['El viaje fue cancelado', '#6E6E73', '#F5F5F7'],
  no_show: ['El viaje fue cancelado', '#6E6E73', '#F5F5F7'],
}
const coord = (lat, lng) => (lat !== null && lat !== undefined && lng !== null && lng !== undefined && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? [Number(lat), Number(lng)] : null)

function Seguimiento() {
  const params = useSearchParams()
  const token = params.get('t') || ''
  const [viaje, setViaje] = useState(null)
  const [error, setError] = useState('')
  const [ajuste, setAjuste] = useState(1)
  const [actualizado, setActualizado] = useState(null)

  const cargar = useCallback(async () => {
    if (!token) { setError('Este enlace no es válido.'); return }
    try {
      const { data } = await api.get(`/api/publico/viaje/${encodeURIComponent(token)}`)
      setViaje(data); setError(''); setActualizado(new Date())
    } catch (e) {
      const st = e?.response?.status
      if (st === 404) setError('Este enlace no es válido o fue desactivado.')
      else if (st === 410) setError('Este viaje ya terminó y el enlace caducó.')
      else if (!viaje) setError('No pudimos cargar el viaje. Revisa tu conexión.')
    }
  }, [token, viaje])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 6000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const activo = viaje && ['solicitado', 'aceptado', 'en_camino', 'recogido'].includes(viaje.estado)
  const taxi = viaje ? coord(viaje.lat_actual, viaje.lng_actual) : null
  const origen = viaje ? coord(viaje.lat_origen, viaje.lng_origen) : null
  const destino = viaje ? coord(viaje.lat_destino, viaje.lng_destino) : null
  const [texto, color, fondo] = (viaje && ESTADOS[viaje.estado]) || ['', '#6E6E73', '#F5F5F7']

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#14213D]">
      <header className="bg-white border-b border-[#E6E8EF]">
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <SafoLogo size={48} priority />
          <span className="text-xs font-semibold text-[#1D1D1F] bg-[#F1F1F3] px-3 py-1.5 rounded-full"><FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />Seguimiento seguro</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {error && !viaje && (
          <div className="rounded-3xl bg-white border border-[#E6E8EF] p-8 text-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-[#B45309]" />
            <p className="mt-3 font-semibold">{error}</p>
            <p className="text-sm text-[#6E6E73] mt-1">Pídele a quien viaja que te comparta el enlace otra vez.</p>
          </div>
        )}

        {viaje && (
          <>
            <div className="rounded-3xl bg-white border border-[#E6E8EF] p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#8A8F9C]">{viaje.pasajero_nombre} te compartió su viaje</div>
              <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold" style={{ color, background: fondo }}>
                {viaje.estado === 'completado' && <FontAwesomeIcon icon={faCircleCheck} />}{texto}
              </div>
            </div>

            <div className="relative h-[46vh] min-h-[280px] rounded-3xl overflow-hidden border border-[#E6E8EF]">
              <MapaConductor className="absolute inset-0" yo={activo ? taxi : null} recojo={origen} destino={destino} ajustarKey={ajuste} />
              <button onClick={() => setAjuste((a) => a + 1)} aria-label="Centrar mapa" className="absolute top-3 right-3 z-[500] w-10 h-10 rounded-full bg-white shadow text-[#14213D]"><FontAwesomeIcon icon={faLocationCrosshairs} /></button>
              {activo && !taxi && (
                <div className="absolute bottom-3 left-3 right-3 z-[500] rounded-xl bg-white/95 text-xs text-[#4B5873] px-3.5 py-2">La ubicación del taxi aparecerá en cuanto el conductor active su GPS.</div>
              )}
            </div>

            <div className="rounded-3xl bg-white border border-[#E6E8EF] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full bg-[#14213D] text-[#FFC21A] flex items-center justify-center"><FontAwesomeIcon icon={faTaxi} /></span>
                <div className="min-w-0">
                  <div className="font-semibold">{viaje.conductor_nombre}</div>
                  <div className="text-sm text-[#6E6E73]">
                    <FontAwesomeIcon icon={faStar} className="text-[#FFC21A] mr-1" />{Number(viaje.calificacion_prom || 0).toFixed(1)} · {[viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_color].filter(Boolean).join(' ')}
                  </div>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-md bg-[#FFC21A] text-[#14213D] text-sm font-bold tracking-wider">{viaje.placa}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2"><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mt-1" /><span>{viaje.direccion_origen || 'Punto de recojo'}</span></div>
                {viaje.direccion_destino && <div className="flex gap-2"><FontAwesomeIcon icon={faFlagCheckered} className="text-[#14213D] mt-1" /><span>{viaje.direccion_destino}</span></div>}
              </div>
              {activo && <p className="text-xs text-[#8A8F9C]">Se actualiza solo cada pocos segundos{actualizado ? ` · última vez ${actualizado.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : ''}.</p>}
            </div>

            <p className="text-center text-xs text-[#8A8F9C] px-6">Por su seguridad, este enlace no muestra teléfonos ni datos personales. Si crees que hay una emergencia, llama a la Policía al <a href="tel:105" className="font-semibold underline">105</a>.</p>
          </>
        )}
      </main>
    </div>
  )
}

export default function PaginaSeguimiento() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F4F6FA]" />}><Seguimiento /></Suspense>
}
