'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faMagnifyingGlass, faUserSlash, faUserCheck } from '@fortawesome/free-solid-svg-icons'
import AdminNavbar from '@/components/AdminNavbar'

const FILTROS = [
  { val: '', label: 'Todos' },
  { val: 'activo', label: 'Activos' },
  { val: 'suspendido', label: 'Suspendidos' },
]

export default function PasajerosPage() {
  const { listo } = useAuthGuard()
  const [pasajeros, setPasajeros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtro) params.set('estado', filtro)
      if (busqueda.trim()) params.set('buscar', busqueda.trim())
      const { data } = await api.get(`/api/admin/pasajeros?${params}`)
      setPasajeros(data)
    } catch (err) {
      toast.error('Error cargando pasajeros')
    } finally {
      setCargando(false)
    }
  }, [filtro, busqueda])

  useEffect(() => {
    if (!listo) return
    const t = setTimeout(cargar, busqueda ? 350 : 0)
    return () => clearTimeout(t)
  }, [listo, cargar, busqueda])

  const cambiarEstado = async (p) => {
    const nuevo = p.estado_usuario === 'suspendido' ? 'activo' : 'suspendido'
    if (nuevo === 'suspendido' && !window.confirm(`¿Suspender a ${p.nombre}? No podrá pedir taxis.`)) return
    try {
      await api.put(`/api/admin/usuarios/${p.usuario_id}/estado`, { estado: nuevo })
      toast.success(nuevo === 'activo' ? 'Cuenta reactivada' : 'Cuenta suspendida')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado')
    }
  }

  if (!listo) return null

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">Pasajeros</h1>
          <p className="text-[#6E6E73] text-sm mt-1">Cuentas registradas. Los pasajeros se activan al registrarse; aquí puedes suspender o reactivar.</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <div className="flex gap-2">
            {FILTROS.map(f => (
              <button key={f.val} onClick={() => setFiltro(f.val)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filtro === f.val ? 'bg-[#0A66E0] text-white' : 'text-[#6E6E73] border border-[#E2E2E7] hover:bg-[#F5F5F7]'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm text-[#A1A1A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o celular"
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none" />
          </div>
        </div>

        {cargando ? (
          <div className="text-[#A1A1A6] text-center py-20">Cargando...</div>
        ) : pasajeros.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E2E7] bg-[#F5F5F7] py-20 text-center">
            <FontAwesomeIcon icon={faUsers} className="text-4xl text-[#A1A1A6] mx-auto mb-3" />
            <div className="text-[#6E6E73]">No hay pasajeros</div>
          </div>
        ) : (
          <div className="space-y-3">
            {pasajeros.map(p => {
              const suspendido = p.estado_usuario === 'suspendido'
              return (
                <div key={p.id} className="rounded-2xl p-5 border border-[#E2E2E7] bg-white">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white bg-[#1E8E3E] shrink-0">
                      {p.nombre?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium text-[#1D1D1F]">{p.nombre}</div>
                      <div className="text-[#6E6E73] text-sm">{p.celular}{p.email ? ` · ${p.email}` : ''}</div>
                    </div>
                    <div className="text-sm text-[#6E6E73]">
                      <div>{p.total_viajes} viajes</div>
                      <div>{p.cancelaciones_mes} cancelaciones este mes</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium"
                      style={suspendido ? { color: '#D92D20', background: '#FCEAE9' } : { color: '#1E8E3E', background: '#E8F5EA' }}>
                      {suspendido ? 'Suspendido' : 'Activo'}
                    </span>
                    <button onClick={() => cambiarEstado(p)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        suspendido ? 'text-white bg-[#1E8E3E] hover:bg-[#177530]' : 'text-[#D92D20] bg-[#FCEAE9] hover:bg-[#F9D9D6]'
                      }`}>
                      <FontAwesomeIcon icon={suspendido ? faUserCheck : faUserSlash} className="text-xs mr-1.5" />{suspendido ? 'Reactivar' : 'Suspender'}
                    </button>
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
