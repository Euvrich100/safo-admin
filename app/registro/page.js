'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { MapPin, User, Car, Phone, CreditCard, Palette } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const [rol, setRol] = useState(null)
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    celular: '',
    dni: '',
    licencia_numero: '',
    placa: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_color: '',
  })

  const actualizar = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const registrar = async () => {
    if (!form.nombre || !form.celular) return toast.error('Completa todos los campos')
    setCargando(true)
    try {
      await api.post('/api/auth/registrar', { ...form, rol })
      toast.success('¡Registro exitoso! El administrador revisará tu solicitud.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060B18] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D1B4B', color: 'white', border: '1px solid #1A6EFF30' }
      }}/>

      {/* Fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-5 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-white">SafO</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Únete a SafO</h1>
          <p className="text-[#4D96FF80] text-sm">Plataforma de taxis seguros en Huánuco</p>
        </div>

        {/* Paso 1 — Elegir rol */}
        {!rol && (
          <div className="space-y-4">
            <p className="text-center text-[#4D96FF] text-sm font-medium mb-6">¿Cómo quieres unirte?</p>
            <button onClick={() => setRol('conductor')}
              className="w-full p-6 rounded-2xl border border-[#1A6EFF20] hover:border-[#1A6EFF] transition text-left group"
              style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: '#1A6EFF15' }}>
                  🚖
                </div>
                <div>
                  <div className="font-bold text-white text-lg group-hover:text-[#4D96FF] transition">Soy conductor</div>
                  <div className="text-[#4D96FF60] text-sm">Quiero llevar pasajeros y ganar dinero</div>
                  <div className="text-[#1A6EFF] text-xs mt-1 font-medium">Suscripción S/ 5.00/mes</div>
                </div>
              </div>
            </button>

            <button onClick={() => setRol('pasajero')}
              className="w-full p-6 rounded-2xl border border-[#1A6EFF20] hover:border-[#1A6EFF] transition text-left group"
              style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: '#22C55E15' }}>
                  👤
                </div>
                <div>
                  <div className="font-bold text-white text-lg group-hover:text-[#4D96FF] transition">Soy pasajero</div>
                  <div className="text-[#4D96FF60] text-sm">Quiero pedir taxis seguros y verificados</div>
                  <div className="text-[#22C55E] text-xs mt-1 font-medium">Gratis — solo pagas S/ 1.50 por viaje</div>
                </div>
              </div>
            </button>

            <div className="text-center mt-4">
              <button onClick={() => router.push('/login')}
                className="text-[#4D96FF60] hover:text-[#4D96FF] text-sm transition">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </div>
        )}

        {/* Paso 2 — Datos personales */}
        {rol && paso === 1 && (
          <div className="rounded-2xl p-6 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>

            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">{rol === 'conductor' ? '🚖' : '👤'}</div>
              <div>
                <div className="font-bold text-white">Datos personales</div>
                <div className="text-[#4D96FF60] text-xs">Registro como {rol}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={form.nombre}
                    onChange={e => actualizar('nombre', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
                  Número de celular
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input
                    type="tel"
                    placeholder="999 000 001"
                    value={form.celular}
                    onChange={e => actualizar('celular', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
                  DNI
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input
                    type="text"
                    placeholder="12345678"
                    value={form.dni}
                    onChange={e => actualizar('dni', e.target.value)}
                    maxLength={8}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <button
                onClick={() => rol === 'conductor' ? setPaso(2) : registrar()}
                disabled={cargando}
                className="w-full py-4 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}
              >
                {rol === 'conductor' ? 'Siguiente — Datos del vehículo →' : (cargando ? 'Registrando...' : 'Completar registro →')}
              </button>

              <button onClick={() => setRol(null)}
                className="w-full py-3 text-[#4D96FF60] hover:text-[#4D96FF] text-sm transition">
                ← Volver
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 — Datos del vehículo (solo conductor) */}
        {rol === 'conductor' && paso === 2 && (
          <div className="rounded-2xl p-6 border border-[#1A6EFF20]"
            style={{ background: 'linear-gradient(135deg, #0D1B4B15, #060B18)' }}>

            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl">🚗</div>
              <div>
                <div className="font-bold text-white">Datos del vehículo</div>
                <div className="text-[#4D96FF60] text-xs">Información de tu taxi</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Número de licencia</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input type="text" placeholder="A123456" value={form.licencia_numero}
                    onChange={e => actualizar('licencia_numero', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Placa del vehículo</label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input type="text" placeholder="ABC-123" value={form.placa}
                    onChange={e => actualizar('placa', e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Marca</label>
                  <input type="text" placeholder="Toyota" value={form.vehiculo_marca}
                    onChange={e => actualizar('vehiculo_marca', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Modelo</label>
                  <input type="text" placeholder="Yaris" value={form.vehiculo_modelo}
                    onChange={e => actualizar('vehiculo_modelo', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">Color</label>
                <div className="relative">
                  <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4D96FF50]" />
                  <input type="text" placeholder="Blanco" value={form.vehiculo_color}
                    onChange={e => actualizar('vehiculo_color', e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-[#4D96FF30] focus:outline-none transition"
                    style={{ background: '#0D1B4B30', border: '1.5px solid #1A6EFF25' }}
                    onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                    onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                  />
                </div>
              </div>

              <button onClick={registrar} disabled={cargando}
                className="w-full py-4 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
                {cargando ? 'Registrando...' : '✅ Completar registro'}
              </button>

              <button onClick={() => setPaso(1)}
                className="w-full py-3 text-[#4D96FF60] hover:text-[#4D96FF] text-sm transition">
                ← Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}