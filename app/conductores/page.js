'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, ArrowLeft, Clock } from 'lucide-react'

export default function ConductoresPage() {
  const router = useRouter()
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')

  useEffect(() => {
    cargarConductores()
  }, [filtro])

  const cargarConductores = async () => {
    setCargando(true)
    try {
      const { data } = await api.get(`/api/admin/conductores?estado_doc=${filtro}`)
      setConductores(data)
    } catch (err) {
      toast.error('Error cargando conductores')
    } finally {
      setCargando(false)
    }
  }

  const revisar = async (id, decision) => {
    const motivo = decision === 'rechazado' ? prompt('Motivo del rechazo:') : null
    try {
      await api.put(`/api/admin/conductores/${id}/documentos`, { decision, motivo })
      toast.success(decision === 'aprobado' ? '✅ Conductor aprobado' : '❌ Conductor rechazado')
      cargarConductores()
    } catch (err) {
      toast.error('Error al procesar')
    }
  }

  const estadoColor = (estado) => {
    if (estado === 'aprobado') return 'text-green-400 bg-green-400/10'
    if (estado === 'rechazado') return 'text-red-400 bg-red-400/10'
    return 'text-yellow-400 bg-yellow-400/10'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster />

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg">Conductores</span>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">

        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          {['pendiente', 'aprobado', 'rechazado'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                filtro === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-gray-400 text-center py-20">Cargando...</div>
        ) : conductores.length === 0 ? (
          <div className="text-gray-400 text-center py-20">No hay conductores {filtro}s</div>
        ) : (
          <div className="space-y-4">
            {conductores.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                        {c.nombre?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{c.nombre}</div>
                        <div className="text-gray-400 text-sm">{c.celular}</div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${estadoColor(c.estado_doc)}`}>
                        {c.estado_doc}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Placa</div>
                        <div className="font-medium text-sm">{c.placa || '—'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Vehículo</div>
                        <div className="font-medium text-sm">{c.vehiculo_marca} {c.vehiculo_modelo || '—'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Calificación</div>
                        <div className="font-medium text-sm">⭐ {c.calificacion_prom || '0.0'}</div>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="text-gray-400 text-xs mb-1">Suscripción</div>
                        <div className="font-medium text-sm">{c.suscripcion_vence || 'Sin pago'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones solo para pendientes */}
                  {c.estado_doc === 'pendiente' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => revisar(c.id, 'aprobado')}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => revisar(c.id, 'rechazado')}
                        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-xl text-sm transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}