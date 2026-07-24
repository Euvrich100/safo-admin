'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function SuscripcionesPage() {
  const router = useRouter()
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(null)

  const cargarConductores = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await api.get('/api/admin/conductores?estado_doc=aprobado')
      setConductores(data)
    } catch (err) {
      toast.error('Error cargando conductores')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarConductores() }, [cargarConductores])

  const confirmarPago = async (conductor_id, metodo_pago) => {
    setProcesando(conductor_id)
    try {
      await api.post('/api/admin/suscripciones/confirmar', { conductor_id, metodo_pago })
      toast.success('✅ Pago de S/ 5.00 confirmado')
      cargarConductores()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al confirmar pago')
    } finally {
      setProcesando(null)
    }
  }

  const suscripcionVencida = (fecha) => {
    if (!fecha) return true
    return new Date(fecha) < new Date()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster />
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-lg">Confirmar pagos — S/ 5.00</span>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-2xl p-4 mb-6">
          <p className="text-blue-300 text-sm">
            💡 Cuando un conductor pague su suscripción por Yape o Plin, confirma el pago aquí para activarlo.
          </p>
        </div>

        {cargando ? (
          <div className="text-gray-400 text-center py-20">Cargando...</div>
        ) : conductores.length === 0 ? (
          <div className="text-gray-400 text-center py-20">No hay conductores aprobados</div>
        ) : (
          <div className="space-y-4">
            {conductores.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      {c.nombre?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{c.nombre}</div>
                      <div className="text-gray-400 text-sm">{c.celular} — {c.placa}</div>
                      <div className={`text-xs mt-1 ${suscripcionVencida(c.suscripcion_vence) ? 'text-red-400' : 'text-green-400'}`}>
                        {suscripcionVencida(c.suscripcion_vence)
                          ? '⚠️ Suscripción vencida'
                          : `✅ Activo hasta ${new Date(c.suscripcion_vence).toLocaleDateString('es-PE')}`
                        }
                      </div>
                    </div>
                  </div>
                  {suscripcionVencida(c.suscripcion_vence) && (
                    <div className="flex gap-2">
                      {['yape', 'plin', 'efectivo'].map(metodo => (
                        <button
                          key={metodo}
                          onClick={() => confirmarPago(c.id, metodo)}
                          disabled={procesando === c.id}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm transition capitalize"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {metodo}
                        </button>
                      ))}
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