'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Users, Car, DollarSign, AlertTriangle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('safo_token')
    if (!token) router.push('/login')
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

  if (cargando) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white text-lg">Cargando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster />

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg">SafO Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/conductores')} className="text-gray-400 hover:text-white transition text-sm">Conductores</button>
          <button onClick={() => router.push('/viajes')} className="text-gray-400 hover:text-white transition text-sm">Viajes</button>
          <button onClick={cerrarSesion} className="text-red-400 hover:text-red-300 transition text-sm">Cerrar sesión</button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400 text-sm">Conductores activos</span>
            </div>
            <div className="text-3xl font-bold">{stats?.conductores?.activos || 0}</div>
            <div className="text-gray-500 text-xs mt-1">de {stats?.conductores?.total || 0} registrados</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-gray-400 text-sm">Docs pendientes</span>
            </div>
            <div className="text-3xl font-bold">{stats?.conductores?.pendientes_doc || 0}</div>
            <div className="text-gray-500 text-xs mt-1">requieren revisión</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Viajes hoy</span>
            </div>
            <div className="text-3xl font-bold">{stats?.viajes_hoy?.completados || 0}</div>
            <div className="text-gray-500 text-xs mt-1">{stats?.viajes_hoy?.en_curso || 0} en curso</div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400 text-sm">Ingresos del mes</span>
            </div>
            <div className="text-3xl font-bold">S/ {stats?.ingresos_mes?.suscripciones_mes || '0.00'}</div>
            <div className="text-gray-500 text-xs mt-1">suscripciones</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/conductores')}
            className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-2xl p-6 text-left transition"
          >
            <Car className="w-8 h-8 text-blue-400 mb-3" />
            <div className="font-medium mb-1">Gestionar conductores</div>
            <div className="text-gray-400 text-sm">Aprobar documentos, ver suscripciones</div>
          </button>

          <button
            onClick={() => router.push('/viajes')}
            className="bg-gray-900 border border-gray-800 hover:border-green-500 rounded-2xl p-6 text-left transition"
          >
            <Users className="w-8 h-8 text-green-400 mb-3" />
            <div className="font-medium mb-1">Ver viajes</div>
            <div className="text-gray-400 text-sm">Historial, cancelaciones, pagos</div>
          </button>

          <button
            onClick={() => router.push('/suscripciones')}
            className="bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-2xl p-6 text-left transition"
          >
            <DollarSign className="w-8 h-8 text-purple-400 mb-3" />
            <div className="font-medium mb-1">Confirmar pagos</div>
            <div className="text-gray-400 text-sm">Verificar Yape/Plin de conductores</div>
          </button>
        </div>
      </main>
    </div>
  )
}