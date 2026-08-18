'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { MapPin, User, Phone, CreditCard } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

export default function RegistroPasajeroPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [form, setForm] = useState({ nombre: '', celular: '', dni: '' })

  const actualizar = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const registrar = async () => {
    if (!form.nombre || !form.celular) return toast.error('Nombre y celular son obligatorios')
    setCargando(true)
    try {
      const res = await fetch(`${API}/api/auth/registrar-pasajero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      setCompletado(true)
    } catch (e) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  if (completado) return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-black text-white mb-4">¡Bienvenido a SafO!</h1>
        <p className="text-[#4D96FF80] mb-6">Tu cuenta fue creada. Ya puedes pedir taxis seguros y verificados en Huánuco.</p>
        <div className="p-4 rounded-2xl border border-[#1A6EFF20] mb-6" style={{ background: '#0D1B4B20' }}>
          <p className="text-[#4D96FF] text-sm font-medium">📱 Número registrado</p>
          <p className="text-white text-xl font-bold mt-1">{form.celular}</p>
        </div>
        <button onClick={() => router.push('/')}
          className="px-8 py-3 rounded-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060B18] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D1B4B', color: 'white', border: '1px solid #1A6EFF30' }
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-5 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>

      <div className="w-full max-w-md relative z-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl text-white">Saf<span style={{ color: '#1A6EFF' }}>O</span></span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Crear cuenta 👤</h1>
          <p className="text-[#4D96FF80]">Registro gratis — solo pagas S/ 1.50 al pedir tu taxi</p>
        </div>

        <div className="rounded-2xl p-6 border border-[#1A6EFF20] space-y-4"
          style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>

          <div>
            <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
              Nombre completo *
            </label>
            <input type="text" placeholder="María García"
              value={form.nombre} onChange={e => actualizar('nombre', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none bg-[#0D1B4B30] border border-[#1A6EFF25] focus:border-[#1A6EFF] transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
              Celular *
            </label>
            <input type="tel" placeholder="999 000 001"
              value={form.celular} onChange={e => actualizar('celular', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none bg-[#0D1B4B30] border border-[#1A6EFF25] focus:border-[#1A6EFF] transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
              DNI (opcional)
            </label>
            <input type="text" placeholder="12345678" maxLength={8}
              value={form.dni} onChange={e => actualizar('dni', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none bg-[#0D1B4B30] border border-[#1A6EFF25] focus:border-[#1A6EFF] transition"
            />
          </div>

          <div className="p-4 rounded-xl border border-[#22C55E20] bg-[#22C55E08]">
            <p className="text-[#22C55E] text-xs font-medium">✅ Registro simple y rápido</p>
            <p className="text-[#22C55E60] text-xs mt-1">Tu seguridad está garantizada por los conductores verificados de SafO.</p>
          </div>

          <button onClick={registrar} disabled={cargando}
            className="w-full py-4 rounded-xl font-bold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
            {cargando ? 'Creando cuenta...' : '✅ Crear cuenta gratis →'}
          </button>
        </div>
      </div>
    </div>
  )
}