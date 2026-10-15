'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faRoute, faTriangleExclamation, faCrosshairs } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import { hace, soles } from '@/lib/formato'

const MapaAdmin = dynamic(() => import('@/components/MapaAdmin'), { ssr: false })

const ESTADO = { solicitado: 'Esperando conductor', aceptado: 'Conductor en camino', en_camino: 'Conductor en camino', recogido: 'En viaje' }

export default function MapaVivoPage() {
  const { listo } = useAuthGuard()
  const [datos, setDatos] = useState({ conductores: [], viajes: [], sos: [] })
  const [zonas, setZonas] = useState([])
  const [capas, setCapas] = useState({ libres: true, viaje: true, viajes: true, sos: true })
  const [ajuste, setAjuste] = useState(1)
  const [actualizado, setActualizado] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/mapa-vivo')
      setDatos(data)
      setActualizado(new Date())
    } catch {
      toast.error('No se pudo actualizar el mapa', { id: 'err-mapa' })
    }
  }, [])

  useEffect(() => {
    if (!listo) return
    cargar()
    api.get('/api/zonas').then(r => setZonas(r.data)).catch(() => {})
    const t = setInterval(cargar, 8000)
    return () => clearInterval(t)
  }, [listo, cargar])

  const conductores = useMemo(
    () => datos.conductores.filter(c => (c.en_viaje ? capas.viaje : capas.libres)), [datos.conductores, capas.libres, capas.viaje])
  const libres = datos.conductores.filter(c => !c.en_viaje).length
  const enViaje = datos.conductores.length - libres

  const Capa = ({ id, texto, color }) => (
    <button onClick={() => setCapas(c => ({ ...c, [id]: !c[id] }))} aria-pressed={capas[id]}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-2 ${capas[id] ? 'bg-white border-[#14213D]/30 text-[#14213D]' : 'bg-[#F1F2F5] border-transparent text-[#9A9EAB]'}`}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: capas[id] ? color : '#C5C8D2' }} />{texto}
    </button>
  )

  if (!listo) return <div className="min-h-screen bg-white" />

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#14213D]">Mapa en vivo</h1>
            <p className="text-sm text-[#6E6E73] mt-1">
              {libres} libres · {enViaje} en viaje · {datos.viajes.length} viajes activos
              {actualizado && <span className="text-[#A1A1A6]"> · actualizado {actualizado.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Capa id="libres" texto="Taxis libres" color="#1E8E3E" />
            <Capa id="viaje" texto="Taxis en viaje" color="#FFC21A" />
            <Capa id="viajes" texto="Viajes" color="#0A66E0" />
            <Capa id="sos" texto="SOS" color="#D92D20" />
            <button onClick={() => setAjuste(a => a + 1)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#14213D] text-white">
              <FontAwesomeIcon icon={faCrosshairs} className="mr-1.5" />Centrar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="tarjeta tarjeta-sombra overflow-hidden lg:col-span-3 relative h-[60vh] min-h-[420px] lg:h-[calc(100vh-180px)]">
            <MapaAdmin className="absolute inset-0" conductores={conductores}
              viajes={capas.viajes ? datos.viajes : []} sos={capas.sos ? datos.sos : []} zonas={zonas} ajustarKey={ajuste} />
          </div>

          <aside className="tarjeta tarjeta-sombra p-4 overflow-y-auto lg:h-[calc(100vh-180px)] max-h-[60vh] lg:max-h-none">
            {datos.sos.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#D92D20] mb-2">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />SOS activas
                </h2>
                {datos.sos.map(a => (
                  <div key={a.id} className="rounded-xl bg-[#FCEAE9] p-3 mb-2 text-sm">
                    <div className="font-semibold text-[#D92D20]">{a.nombre} <span className="font-normal text-xs">({a.rol})</span></div>
                    <a href={`tel:${a.celular}`} className="text-[#14213D] underline">{a.celular}</a>
                    <div className="text-xs text-[#6E6E73] mt-1">{a.mensaje || 'Sin mensaje'} · {hace(a.creado_en)}</div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A8F9C] mb-2">
              <FontAwesomeIcon icon={faRoute} className="mr-1.5" />Viajes activos
            </h2>
            {datos.viajes.length === 0 && <p className="text-sm text-[#A1A1A6] mb-4">No hay viajes en curso.</p>}
            {datos.viajes.map(v => (
              <div key={v.id} className="rounded-xl border border-[#E6E8EF] p-3 mb-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#14213D] truncate">{v.pasajero_nombre}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF2FE] text-[#0A66E0] whitespace-nowrap">{ESTADO[v.estado] || v.estado}</span>
                </div>
                <div className="text-xs text-[#6E6E73] mt-1">Taxi: {v.conductor_nombre}</div>
                <div className="text-xs text-[#6E6E73] truncate">{v.direccion_origen || 'Origen en el mapa'}{v.direccion_destino ? ` → ${v.direccion_destino}` : ''}</div>
                {v.tarifa_estimada && <div className="text-xs text-[#14213D] mt-1">Tarifa estimada {soles(v.tarifa_estimada)}</div>}
              </div>
            ))}

            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A8F9C] mt-4 mb-2">
              <FontAwesomeIcon icon={faTaxi} className="mr-1.5" />Conductores en línea
            </h2>
            {datos.conductores.length === 0 && <p className="text-sm text-[#A1A1A6]">Ningún conductor conectado con GPS.</p>}
            {datos.conductores.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-[#F0F1F5] last:border-0 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.en_viaje ? 'bg-[#FFC21A]' : 'bg-[#1E8E3E]'}`} />
                <div className="min-w-0">
                  <div className="font-medium text-[#14213D] truncate">{c.nombre}</div>
                  <div className="text-xs text-[#8A8F9C] truncate">{c.placa} · {c.en_viaje ? 'En viaje' : 'Disponible'} · GPS {hace(c.actualizado_en)}</div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  )
}
