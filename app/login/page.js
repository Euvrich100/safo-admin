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
      toast.success('Código enviado a tu celular')
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
      if (data.usuario.rol !== 'admin') {
        return toast.error('Solo administradores pueden acceder')
      }
      localStorage.setItem('safo_token', data.token)
      localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
      toast.success('Bienvenido al panel SafO')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Toaster />
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SafO Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Panel de administración</p>
        </div>

        {paso === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Número de celular</label>
              <input
                type="tel"
                placeholder="999000001"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={solicitarOTP}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar código'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Código OTP</label>
              <input
                type="text"
                placeholder="123456"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-center text-2xl tracking-widest"
              />
              <p className="text-gray-500 text-xs mt-2 text-center">
                Código enviado al {celular}
              </p>
            </div>
            <button
              onClick={verificarOTP}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
            >
              {cargando ? 'Verificando...' : 'Ingresar'}
            </button>
            <button
              onClick={() => setPaso(1)}
              className="w-full text-gray-400 text-sm hover:text-white transition"
            >
              Cambiar número
            </button>
          </div>
        )}
      </div>
    </div>
  )
}