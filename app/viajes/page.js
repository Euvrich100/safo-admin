'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRoute, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import AdminNavbar from '@/components/AdminNavbar'

const FILTROS = [
  { val: '', label: 'Todos' },
  { val: 'completado', label: 'Completados' },
  { val: 'cancelado_pasajero', label: 'Cancelados' },
  { val: 'solicitado', label: 'Solicitados' },
]

const estadoEstilo = (estado) => {
  if (estado === 'completado') return { color: '#1D1D1F', bg: '#F1F1F3' }
  if (estado?.includes('cancelado')) return { color: '#D92D20', bg: '#FCEAE9' }
  if (estado === 'en_camino') return { color: '#0A66E0', bg: '#EAF2FE' }
  return { color: '#B45309', bg: '#FEF3E2' }
}

export default function ViajesPage() {
  const { listo } = useAuthGuard()
  const [viajes, setViajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    if (!listo) return
    cargarViajes()
  }, [filtro, listo])

  const cargarViajes = async () => {
    setCargando(true)
    try {
      const params = filtro ? `?estado=${filtro}` : ''
      const { data } = await api.get(`/api/admin/viajes${params}`)
      setViajes(data)
    } catch (err) {
      toast.error('Error cargando viajes')
    } finally {
      setCargando(false)
    }
  }

  if (!listo) return null

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Viajes</h1>
          <p className="text-[#6E6E73] text-sm mt-1">Historial, cancelaciones y pagos de la plataforma</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.val}
              onClick={() => setFiltro(f.val)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filtro === f.val
                  ? 'bg-[#0A66E0] text-white'
                  : 'text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="text-[#A1A1A6] text-center py-20">Cargando...</div>
        ) : viajes.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E2E7] bg-[#F5F5F7] py-20 text-center">
            <FontAwesomeIcon icon={faRoute} className="text-4xl text-[#A1A1A6] mx-auto mb-3" />
            <div className="text-[#6E6E73]">No hay viajes</div>
          </div>
        ) : (
          <div className="space-y-4">
            {viajes.map(v => {
              const estilo = estadoEstilo(v.estado)
              return (
                <div key={v.id} className="rounded-2xl p-5 border border-[#E2E2E7] bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ color: estilo.color, background: estilo.bg }}>
                        {v.estado}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#EAF2FE] text-[#0A66E0]">{v.servicio === 'moto' ? 'Moto' : 'Taxi'}</span>
                      <span className="text-[#A1A1A6] text-xs">
                        {new Date(v.solicitado_en).toLocaleString('es-PE')}
                      </span>
                    </div>
                    {(v.direccion_origen || v.direccion_destino) && (
                      <div className="mb-3 text-sm text-[#1D1D1F]">
                        <span className="text-[#A1A1A6] text-xs mr-2">Recorrido</span>
                        {v.direccion_origen || 'Origen en el mapa'}{v.direccion_destino ? ` → ${v.direccion_destino}` : ''}
                        {v.tarifa_estimada && (
                          <span className="ml-3 text-xs px-2.5 py-1 rounded-full bg-[#FFF6D9] text-[#5C4A00] whitespace-nowrap">
                            Tarifa estimada S/ {Number(v.tarifa_estimada).toFixed(2)}{v.distancia_km ? ` · ${Number(v.distancia_km).toFixed(1)} km` : ''}{v.duracion_min ? ` · ${v.duracion_min} min` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl p-3 bg-[#F5F5F7]">
                        <div className="text-[#A1A1A6] text-xs mb-1">Conductor</div>
                        <div className="font-medium text-sm text-[#1D1D1F]">{v.conductor || '—'}</div>
                      </div>
                      <div className="rounded-xl p-3 bg-[#F5F5F7]">
                        <div className="text-[#A1A1A6] text-xs mb-1">Pasajero</div>
                        <div className="font-medium text-sm text-[#1D1D1F]">{v.pasajero || '—'}</div>
                      </div>
                      <div className="rounded-xl p-3 bg-[#F5F5F7]">
                        <div className="text-[#A1A1A6] text-xs mb-1">Pago</div>
                        <div className="font-medium text-sm text-[#1D1D1F]">S/ {v.monto_total || '1.50'}</div>
                      </div>
                      <div className="rounded-xl p-3 bg-[#F5F5F7]">
                        <div className="text-[#A1A1A6] text-xs mb-1">Estado pago</div>
                        <div className="font-medium text-sm text-[#1D1D1F]">{v.estado_pago || '—'}</div>
                      </div>
                    </div>
                    {v.cancelacion_motivo && (
                      <div className="mt-3 rounded-xl p-3 bg-[#FCEAE9]">
                        <div className="text-xs text-[#D92D20]">Motivo de cancelación: {v.cancelacion_motivo}</div>
                        {v.conductor_fue_despachado && (
                          <div className="text-xs mt-1 text-[#B0453B]"><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />Conductor fue despachado — S/ {Number(v.monto_conductor || 0).toFixed(2)} compensado al conductor</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
