'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faDollarSign, faTriangleExclamation, faHand, faRoute } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/navigation'
import AdminNavbar from '@/components/AdminNavbar'
import SafoLogo from '@/components/SafoLogo'

export default function DashboardPage() {
  const router = useRouter()
  const { usuario, listo } = useAuthGuard()
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!listo) return
    cargarStats()
  }, [listo])

  const cargarStats = async () => {
    try {
      const { data } = await api.get('/api/admin/dashboard')
      setStats(data)
    } catch (err) {
      toast.error('Error cargando estadísticas')
    } finally {
      setCargando(false)
    }
  }

  const cards = [
    {
      label: 'Conductores activos',
      value: stats?.conductores?.activos || 0,
      sub: `de ${stats?.conductores?.total || 0} registrados`,
      icon: faTaxi,
      color: '#0A66E0',
      bg: '#EAF2FE'
    },
    {
      label: 'Docs pendientes',
      value: stats?.conductores?.pendientes_doc || 0,
      sub: 'requieren revisión',
      icon: faTriangleExclamation,
      color: '#B45309',
      bg: '#FEF3E2'
    },
    {
      label: 'Viajes hoy',
      value: stats?.viajes_hoy?.completados || 0,
      sub: `${stats?.viajes_hoy?.en_curso || 0} en curso`,
      icon: faRoute,
      color: '#1E8E3E',
      bg: '#E8F5EA'
    },
    {
      label: 'Ingresos del mes',
      value: `S/ ${stats?.ingresos_mes?.suscripciones_mes || '0.00'}`,
      sub: 'suscripciones',
      icon: faDollarSign,
      color: '#7C5CFC',
      bg: '#F1EEFF'
    },
  ]

  if (!listo || cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <SafoLogo size={72} />
        <div className="text-[#6E6E73] text-sm">Cargando SafO...</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-6 max-w-6xl mx-auto">

        {/* Saludo */}
        <div className="mb-8 mt-2">
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">
            Bienvenido, {usuario?.nombre || 'Admin'} <FontAwesomeIcon icon={faHand} className="text-[#FFC21A] ml-1" />
          </h1>
          <p className="text-[#6E6E73] text-sm mt-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="rounded-2xl p-5 border border-[#E2E2E7] bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: c.bg }}>
                  <FontAwesomeIcon icon={c.icon} className="text-lg" style={{ color: c.color }} />
                </div>
                <span className="text-[#6E6E73] text-xs font-medium">{c.label}</span>
              </div>
              <div className="text-3xl font-semibold text-[#1D1D1F] mb-1">{c.value}</div>
              <div className="text-[#A1A1A6] text-xs">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Accesos rápidos */}
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Gestionar conductores', sub: 'Aprobar documentos, ver suscripciones', icon: faTaxi, color: '#0A66E0', bg: '#EAF2FE', path: '/conductores' },
            { label: 'Ver viajes', sub: 'Historial, cancelaciones, pagos', icon: faRoute, color: '#1E8E3E', bg: '#E8F5EA', path: '/viajes' },
            { label: 'Confirmar pagos', sub: 'Verificar Yape/Plin de S/ 5.00', icon: faDollarSign, color: '#7C5CFC', bg: '#F1EEFF', path: '/suscripciones' },
          ].map((item, i) => (
            <button key={i} onClick={() => router.push(item.path)}
              className="rounded-2xl p-6 text-left border border-[#E2E2E7] bg-white hover:border-[#0A66E0] hover:shadow-sm transition group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: item.bg }}>
                <FontAwesomeIcon icon={item.icon} className="text-xl" style={{ color: item.color }} />
              </div>
              <div className="font-semibold text-[#1D1D1F] mb-1 group-hover:text-[#0A66E0] transition">{item.label}</div>
              <div className="text-[#6E6E73] text-sm">{item.sub}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
