'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faDollarSign, faLightbulb, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import AdminNavbar from '@/components/AdminNavbar'

export default function SuscripcionesPage() {
  const { listo } = useAuthGuard()
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

  useEffect(() => {
    if (!listo) return
    cargarConductores()
  }, [listo, cargarConductores])

  const confirmarPago = async (conductor_id, metodo_pago) => {
    setProcesando(conductor_id)
    try {
      await api.post('/api/admin/suscripciones/confirmar', { conductor_id, metodo_pago })
      toast.success('Pago de S/ 5.00 confirmado')
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

  if (!listo) return null

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Confirmar pagos</h1>
          <p className="text-[#6E6E73] text-sm mt-1">Suscripción mensual de S/ 5.00 por conductor</p>
        </div>

        <div className="rounded-2xl p-4 mb-6 bg-[#EAF2FE]">
          <p className="text-[#0A66E0] text-sm">
            <FontAwesomeIcon icon={faLightbulb} className="mr-2" />Cuando un conductor pague su suscripción por Yape o Plin, confirma el pago aquí para activarlo.
          </p>
        </div>

        {cargando ? (
          <div className="text-[#A1A1A6] text-center py-20">Cargando...</div>
        ) : conductores.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E2E7] bg-[#F5F5F7] py-20 text-center">
            <FontAwesomeIcon icon={faDollarSign} className="text-4xl text-[#A1A1A6] mx-auto mb-3" />
            <div className="text-[#6E6E73]">No hay conductores aprobados</div>
          </div>
        ) : (
          <div className="space-y-4">
            {conductores.map(c => (
              <div key={c.id} className="rounded-2xl p-5 border border-[#E2E2E7] bg-white">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white bg-[#0A66E0]">
                      {c.nombre?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-[#1D1D1F]">{c.nombre}</div>
                      <div className="text-[#6E6E73] text-sm">{c.celular} — {c.placa}</div>
                      <div className="text-xs mt-1" style={{ color: suscripcionVencida(c.suscripcion_vence) ? '#D92D20' : '#1E8E3E' }}>
                        {suscripcionVencida(c.suscripcion_vence)
                          ? <><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />Suscripción vencida</>
                          : <><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />Activo hasta {new Date(c.suscripcion_vence).toLocaleDateString('es-PE')}</>
                        }
                      </div>
                    </div>
                  </div>
                  {suscripcionVencida(c.suscripcion_vence) && (
                    <div className="flex gap-2 flex-wrap">
                      {['yape', 'plin', 'efectivo'].map(metodo => (
                        <button
                          key={metodo}
                          onClick={() => confirmarPago(c.id, metodo)}
                          disabled={procesando === c.id}
                          className="flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50 capitalize bg-[#1E8E3E] hover:bg-[#177530]"
                        >
                          <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
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
