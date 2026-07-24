'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { Users, Car, DollarSign, AlertTriangle, LogOut, MapPin } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('safo_token')
    const u = localStorage.getItem('safo_usuario')
    if (!token) { router.push('/login'); return }
    if (u) setUsuario(JSON.parse(u))
    cargarStats()
  }, [])

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

  const cerrarSesion = () => {
    localStorage.removeItem('safo_token')
    localStorage.removeItem('safo_usuario')
    router.push('/login')
  }

  const cards = [
    {
      label: 'Conductores activos',
      value: stats?.conductores?.activos || 0,
      sub: `de ${stats?.conductores?.total || 0} registrados`,
      icon: Car,
      color: '#1A6EFF',
      bg: '#1A6EFF15'
    },
    {
      label: 'Docs pendientes',
      value: stats?.conductores?.pendientes_doc || 0,
      sub: 'requieren revisión',
      icon: AlertTriangle,
      color: '#F59E0B',
      bg: '#F59E0B15'
    },
    {
      label: 'Viajes hoy',
      value: stats?.viajes_hoy?.completados || 0,
      sub: `${stats?.viajes_hoy?.en_curso || 0} en curso`,
      icon: Users,
      color: '#22C55E',
      bg: '#22C55E15'
    },
    {
      label: 'Ingresos del mes',
      value: `S/ ${stats?.ingresos_mes?.suscripciones_mes || '0.00'}`,
      sub: 'suscripciones',
      icon: DollarSign,
      color: '#A855F7',
      bg: '#A855F715'
    },
  ]

  if (cargando) return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="text-[#4D96FF] text-sm">Cargando SafO...</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060B18]">
      <Toaster position="top-center" />

      {/* Navbar */}
      <nav className="border-b border-[#1A6EFF15] px-6 py-4"
        style={{ background: 'linear-gradient(135deg, #0D1B4B20, #060B18)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">SafO</span>
              <span className="text-[#4D96FF] text-sm ml-2">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/conductores')}
              className="px-4 py-2 text-sm text-[#4D96FF] hover:text-white hover:bg-[#1A6EFF15] rounded-xl transition">
              Conductores
            </button>
            <button onClick={() => router.push('/viajes')}
              className="px-4 py-2 text-sm text-[#4D96FF] hover:text-white hover:bg-[#1A6EFF15] rounded-xl transition">
              Viajes
            </button>
            <button onClick={() => router.push('/suscripciones')}
              className="px-4 py-2 text-sm text-[#4D96FF] hover:text-white hover:bg-[#1A6EFF15] rounded-xl transition">
              Pagos
            </button>
            <button onClick={cerrarSesion}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition">
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">

        {/* Saludo */}
        <div className="mb-8 mt-2">
          <h1 className="text-2xl font-bold text-white">
            Bienvenido, {usuario?.nombre || 'Admin'} 👋
          </h1>
          <p className="text-[#4D96FF] text-sm mt-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="rounded-2xl p-5 border border-[#1A6EFF15]"
              style={{ background: `linear-gradient(135deg, ${c.bg}, #060B1880)` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: c.bg }}>
                  <c.icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <span className="text-[#4D96FF] text-xs font-medium">{c.label}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{c.value}</div>
              <div className="text-[#4D96FF50] text-xs">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Accesos rápidos */}
        <h2 className="text-lg font-semibold text-white mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Gestionar conductores', sub: 'Aprobar documentos, ver suscripciones', icon: Car, color: '#1A6EFF', path: '/conductores' },
            { label: 'Ver viajes', sub: 'Historial, cancelaciones, pagos', icon: Users, color: '#22C55E', path: '/viajes' },
            { label: 'Confirmar pagos', sub: 'Verificar Yape/Plin de S/ 5.00', icon: DollarSign, color: '#A855F7', path: '/suscripciones' },
          ].map((item, i) => (
            <button key={i} onClick={() => router.push(item.path)}
              className="rounded-2xl p-6 text-left border border-[#1A6EFF15] hover:border-[#1A6EFF40] transition group"
              style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition"
                style={{ background: `${item.color}15` }}>
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <div className="font-semibold text-white mb-1 group-hover:text-[#4D96FF] transition">{item.label}</div>
              <div className="text-[#4D96FF50] text-sm">{item.sub}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}