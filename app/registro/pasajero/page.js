'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faMobileScreenButton, faIdCard, faCircleCheck, faUserPlus, faUserCheck } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'

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
      // El registro ya inicia sesión: directo al panel con el mapa
      if (data.token && data.usuario) {
        localStorage.setItem('safo_token', data.token)
        localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
        router.push('/pasajero')
        return
      }
      setCompletado(true)
    } catch (e) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  if (completado) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <FontAwesomeIcon icon={faCircleCheck} className="text-[#1E8E3E] text-7xl mb-6" />
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-4">¡Bienvenido a SafO!</h1>
        <p className="text-[#6E6E73] mb-6">Tu cuenta fue creada. Ya puedes pedir taxis seguros y verificados en Huánuco.</p>
        <div className="p-4 rounded-2xl bg-[#F5F5F7] mb-6">
          <p className="text-[#6E6E73] text-sm font-medium"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />Número registrado</p>
          <p className="text-[#1D1D1F] text-xl font-semibold mt-1">{form.celular}</p>
        </div>
        <button onClick={() => router.push('/')}
          className="px-8 py-3 rounded-full font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0]">
          Volver al inicio
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1D1D1F', color: 'white' }
      }}/>

      <div className="w-full max-w-md">
        <button onClick={() => router.push('/')} className="flex items-center mb-8">
          <SafoLogo size={64} priority />
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2 tracking-tight">Registrate gratis <FontAwesomeIcon icon={faUserCheck} className="text-[#0A66E0] text-2xl ml-1" /></h1>
          <p className="text-[#6E6E73]">Registro gratis — solo pagas S/ 1.50 al pedir tu taxi</p>
        </div>

        <div className="rounded-2xl p-6 border border-[#E2E2E7] space-y-4">

          <div>
            <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">
              <FontAwesomeIcon icon={faUser} className="mr-1.5" />Nombre completo *
            </label>
            <input type="text" placeholder="María García"
              value={form.nombre} onChange={e => actualizar('nombre', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">
              <FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />Celular *
            </label>
            <input type="tel" placeholder="999 000 001"
              value={form.celular} onChange={e => actualizar('celular', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">
              <FontAwesomeIcon icon={faIdCard} className="mr-1.5" />DNI (opcional)
            </label>
            <input type="text" placeholder="12345678" maxLength={8}
              value={form.dni} onChange={e => actualizar('dni', e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] transition"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#E8F5EA]">
            <p className="text-[#1E8E3E] text-xs font-medium"><FontAwesomeIcon icon={faCircleCheck} className="mr-1.5" />Registro simple y rápido</p>
            <p className="text-[#1E8E3E] text-xs mt-1 opacity-80">Tu seguridad está garantizada por los conductores verificados de SafO.</p>
          </div>

          <button onClick={registrar} disabled={cargando}
            className="w-full py-4 rounded-full font-semibold text-white transition disabled:opacity-50 bg-[#0A66E0] hover:bg-[#084FB0]">
            {cargando ? 'Creando cuenta...' : <><FontAwesomeIcon icon={faUserPlus} className="mr-2.5" />Crear cuenta gratis</>}
          </button>
        </div>
      </div>
    </div>
  )
}
