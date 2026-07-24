'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'

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
      toast.success('Código enviado')
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
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#1A6EFF] opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0D1B4B] opacity-30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative"
            style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
            <svg width="44" height="52" viewBox="0 0 60 70">
              <ellipse cx="30" cy="26" rx="26" ry="26" fill="white"/>
              <ellipse cx="30" cy="26" rx="14" ry="14" fill="#1A6EFF"/>
              <path d="M30 52 Q30 62 30 65 Q22 70 16 64" fill="white"/>
              <ellipse cx="30" cy="65" rx="4" ry="2.5" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">SafO Admin</h1>
          <p className="text-[#4D96FF] text-sm">Panel de administración</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-[#1A6EFF20]"
          style={{ background: 'linear-gradient(135deg, #0D1B4B15, #1A6EFF08)' }}>

          {paso === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-[#4D96FF] mb-2 block font-medium">
                  Número de celular
                </label>
                <input
                  type="tel"
                  placeholder="999 000 001"
                  value={celular}
                  onChange={e => setCelular(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && solicitarOTP()}
                  className="w-full bg-[#0D1B4B30] border border-[#1A6EFF30] rounded-xl px-4 py-3.5 text-white placeholder-[#4D96FF50] focus:outline-none focus:border-[#1A6EFF] transition text-lg"
                />
              </div>
              <button
                onClick={solicitarOTP}
                disabled={cargando}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: cargando ? '#1A6EFF80' : 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}
              >
                {cargando ? 'Enviando...' : 'Enviar código →'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <div className="text-4xl mb-3">📱</div>
                <p className="text-[#4D96FF] text-sm">Código enviado al <strong className="text-white">{celular}</strong></p>
              </div>
              <div>
                <label className="text-sm text-[#4D96FF] mb-2 block font-medium">
                  Código OTP
                </label>
                <input
                  type="text"
                  placeholder="_ _ _ _ _ _"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verificarOTP()}
                  maxLength={6}
                  className="w-full bg-[#0D1B4B30] border border-[#1A6EFF30] rounded-xl px-4 py-4 text-white placeholder-[#4D96FF30] focus:outline-none focus:border-[#1A6EFF] transition text-3xl tracking-[0.5em] text-center font-bold"
                />
              </div>
              <button
                onClick={verificarOTP}
                disabled={cargando}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}
              >
                {cargando ? 'Verificando...' : 'Ingresar al panel →'}
              </button>
              <button
                onClick={() => { setPaso(1); setCodigo('') }}
                className="w-full text-[#4D96FF] text-sm hover:text-white transition py-2"
              >
                ← Cambiar número
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[#4D96FF30] text-xs mt-6">
          SafO — Safe + On © 2025
        </p>
      </div>
    </div>
  )
}