'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import SafoLogo from '@/components/SafoLogo'

export default function LoginPage() {
  const router = useRouter()
  const [celular, setCelular] = useState('')
  const [codigo, setCodigo] = useState('')
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const solicitarOTP = async () => {
    if (!celular) return toast.error('Ingresa tu número de celular')
    setCargando(true)
    try {
      await api.post('/api/auth/solicitar-otp', { celular })
      toast.success('¡Código enviado!')
      setPaso(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar código')
    } finally {
      setCargando(false)
    }
  }

  const verificarOTP = async () => {
    if (!codigo) return toast.error('Ingresa el código')
    setCargando(true)
    try {
      const { data } = await api.post('/api/auth/verificar-otp', { celular, codigo })
      if (data.usuario.rol !== 'admin') return toast.error('Solo administradores')
      localStorage.setItem('safo_token', data.token)
      localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#060B18' }}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#0D1B4B', color: 'white', border: '1px solid #1A6EFF30' }
      }}/>

      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1B4B, #060B18)' }}>

        {/* Círculos decorativos */}
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>
        <div className="absolute bottom-[-50px] right-[-50px] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4D96FF, transparent)' }}/>

        {/* Grid de puntos */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #1A6EFF 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}/>

        <SafoLogo size={48} showText={true} />

        <div className="relative z-10">
          <div className="text-6xl mb-6">🚖</div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Gestiona tu<br/>
            <span style={{ color: '#1A6EFF' }}>flota segura</span><br/>
            desde aquí.
          </h2>
          <p className="text-[#4D96FF80] text-lg leading-relaxed max-w-sm">
            Panel de control para administrar conductores, viajes y pagos de la plataforma SafO.
          </p>
        </div>

        {/* Stats decorativos */}
        <div className="flex gap-6 relative z-10">
          {[
            { n: 'S/ 5', label: 'por conductor/mes' },
            { n: 'S/ 1.50', label: 'garantía por viaje' },
            { n: '100%', label: 'conductores verificados' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-black text-white">{s.n}</div>
              <div className="text-[#4D96FF60] text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 lg:max-w-md flex flex-col justify-center p-8 lg:p-12">

        {/* Logo mobile */}
        <div className="flex justify-center mb-8 lg:hidden">
          <SafoLogo size={56} showText={true} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            {paso === 1 ? 'Hola, Admin 👋' : '¡Casi listo! 🎉'}
          </h1>
          <p className="text-[#4D96FF80] text-sm">
            {paso === 1
              ? 'Ingresa tu número para continuar'
              : `Código enviado al ${celular}`}
          </p>
        </div>

        {paso === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
                Número de celular
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4D96FF60] text-sm font-medium">+51</span>
                <input
                  type="tel"
                  placeholder="999 000 001"
                  value={celular}
                  onChange={e => setCelular(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && solicitarOTP()}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl text-white text-lg font-medium placeholder-[#4D96FF30] focus:outline-none transition"
                  style={{
                    background: '#0D1B4B30',
                    border: '1.5px solid #1A6EFF25',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                  onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
                />
              </div>
            </div>

            <button
              onClick={solicitarOTP}
              disabled={cargando}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg transition disabled:opacity-50 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}
            >
              <span className="relative z-10">
                {cargando ? 'Enviando...' : 'Enviar código →'}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                style={{ background: 'linear-gradient(135deg, #4D96FF, #1A6EFF)' }}/>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Inputs OTP individuales visual */}
            <div>
              <label className="text-xs font-semibold text-[#4D96FF] uppercase tracking-widest mb-2 block">
                Código de verificación
              </label>
              <input
                type="text"
                placeholder="• • • • • •"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verificarOTP()}
                maxLength={6}
                className="w-full px-4 py-5 rounded-2xl text-white text-4xl tracking-[0.6em] text-center font-black placeholder-[#4D96FF20] focus:outline-none transition"
                style={{
                  background: '#0D1B4B30',
                  border: '1.5px solid #1A6EFF25',
                  letterSpacing: codigo ? '0.6em' : '0.3em'
                }}
                onFocus={e => e.target.style.borderColor = '#1A6EFF'}
                onBlur={e => e.target.style.borderColor = '#1A6EFF25'}
              />
              <div className="flex justify-center mt-3">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-1 mx-1 rounded-full transition-all"
                    style={{ background: codigo.length > i ? '#1A6EFF' : '#1A6EFF20' }}/>
                ))}
              </div>
            </div>

            <button
              onClick={verificarOTP}
              disabled={cargando || codigo.length < 6}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg transition disabled:opacity-40 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}
            >
              <span className="relative z-10">
                {cargando ? 'Verificando...' : 'Ingresar al panel →'}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                style={{ background: 'linear-gradient(135deg, #4D96FF, #1A6EFF)' }}/>
            </button>

            <button
              onClick={() => { setPaso(1); setCodigo('') }}
              className="w-full py-3 text-[#4D96FF60] hover:text-[#4D96FF] text-sm transition"
            >
              ← Cambiar número
            </button>
          </div>
        )}

        <p className="text-center text-[#4D96FF20] text-xs mt-12">
          SafO — Safe + On · Huánuco, Perú · 2025
        </p>
      </div>
    </div>
  )
}