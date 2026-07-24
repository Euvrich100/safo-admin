'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function ViajesPage() {
  const router = useRouter()
  const [viajes, setViajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')

  useEffect(() => { cargarViajes() }, [filtro])

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

  const estadoColor = (estado) => {
    if (estado === 'completado') return 'text-green-400 bg-green-400/10'
    if (estado?.includes('cancelado')) return 'text-red-400 bg-red-400/10'
    if (estado === 'en_camino') return 'text-blue-400 bg-blue-400/10'
    return 'text-yellow-400 bg-yellow-400/10'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster />
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg">Viajes</span>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { val: '', label: 'Todos' },
            { val: 'completado', label: 'Completados' },
            { val: 'cancelado_pasajero', label: 'Cancelados' },
            { val: 'solicitado', label: 'Solicitados' },
          ].map(f => (
            <button
              key={f.val}
              onClick={() => setFiltro(f.val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filtro === f.val
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="text-gray-400 text-center py-20">Cargando...</div>
        ) : viajes.length === 0 ? (
          <div className="text-gray-400 text-center py-20">No hay viajes</div>
        ) : (
          <div className="space-y-4">
            {viajes.map(v => (
              <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${estadoColor(v.estado)}`}>
                        {v.estado}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(v.solicitado_en).toLocaleString('es-PE')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Conductor</div>
                        <div className="font-medium text-sm">{v.conductor || '—'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Pasajero</div>
                        <div className="font-medium text-sm">{v.pasajero || '—'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Pago</div>
                        <div className="font-medium text-sm">S/ {v.monto_total || '1.50'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Estado pago</div>
                        <div className="font-medium text-sm">{v.estado_pago || '—'}</div>
                      </div>
                    </div>
                    {v.cancelacion_motivo && (
                      <div className="mt-3 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
                        <div className="text-red-400 text-xs">Motivo de cancelación: {v.cancelacion_motivo}</div>
                        {v.conductor_fue_despachado && (
                          <div className="text-red-300 text-xs mt-1">⚠️ Conductor fue despachado — S/ 1.00 compensado al conductor</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}