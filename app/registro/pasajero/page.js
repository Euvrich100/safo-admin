'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import AccesoSocial from '@/components/AccesoSocial'
import { CIUDAD } from '@/lib/ciudad'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://safo-backend.onrender.com'

export default function RegistroPasajeroPage() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [completado, setCompletado] = useState(false)
  const [form, setForm] = useState({ nombre: '', celular: '', password: '', repetir: '' })

  const actualizar = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const registrar = async () => {
    const celular = form.celular.replace(/\D/g, '')
    if (!form.nombre.trim() || !celular) return toast.error('Escribe tu nombre y tu celular')
    if (celular.length !== 9) return toast.error('El celular debe tener 9 dígitos')
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    if (form.password !== form.repetir) return toast.error('Las contraseñas no coinciden')
    setCargando(true)
    try {
      const res = await fetch(`${API}/api/auth/registrar-pasajero`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre.trim(), celular, password: form.password })
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
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const marco = (hijos) => (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-10 sm:py-14">
      <Toaster position="top-center" toastOptions={{ style: { background: '#16181D', color: 'white', fontSize: 14 } }} />
      <div className="w-full max-w-[24rem]">
        <button onClick={() => router.push('/')} className="mb-10 block" aria-label="Ir al inicio"><SafoLogo size={40} showText priority /></button>
        {hijos}
      </div>
    </div>
  )

  if (completado) return marco(
    <>
      <span className="insignia-taxi mb-5" aria-hidden="true"><FontAwesomeIcon icon={faTaxi} /></span>
      <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">Tu cuenta está lista</h1>
      <p className="text-[15px] text-[#4A4F5C] mb-7">Ya puedes pedir taxis verificados en {CIUDAD.nombre}.</p>
      <div className="f-aviso mb-6">
        Número registrado
        <div className="text-[1.1rem] font-semibold text-[#16181D] tabular-nums mt-0.5">{CIUDAD.prefijoTelefono} {form.celular}</div>
      </div>
      <button onClick={() => router.push('/login')} className="f-btn">Iniciar sesión</button>
    </>
  )

  return marco(
    <>
      <div className="mb-7">
        <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">Crea tu cuenta</h1>
        <p className="text-[15px] text-[#4A4F5C]">Es gratis y toma un minuto. Pide tu primer taxi en {CIUDAD.nombre} al terminar.</p>
      </div>

      <div className="space-y-5">
        <AccesoSocial modo="registro" />

        <div className="f-divisor">o con tu celular</div>

        <div className="f-campo">
          <label htmlFor="nombre" className="f-etiqueta">Nombre completo</label>
          <input id="nombre" type="text" autoComplete="name" placeholder="Ej. María García" className="f-input"
            value={form.nombre} onChange={e => actualizar('nombre', e.target.value)} />
        </div>

        <div className="f-campo">
          <label htmlFor="celular" className="f-etiqueta">Celular</label>
          <div className="f-grupo">
            <span className="f-prefijo" aria-hidden="true">{CIUDAD.prefijoTelefono}</span>
            <input id="celular" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="987 654 321"
              value={form.celular} onChange={e => actualizar('celular', e.target.value)} />
          </div>
          <span className="f-ayuda">El conductor lo usará para encontrarte.</span>
        </div>

        <div className="f-campo">
          <label htmlFor="clave" className="f-etiqueta">Contraseña <small>mínimo 6 caracteres</small></label>
          <ClaveInput id="clave" value={form.password} onChange={v => actualizar('password', v)} autoComplete="new-password" placeholder="Crea una contraseña" />
        </div>

        <div className="f-campo">
          <label htmlFor="repetir" className="f-etiqueta">Repite la contraseña</label>
          <ClaveInput id="repetir" value={form.repetir} onChange={v => actualizar('repetir', v)} autoComplete="new-password" placeholder="Escríbela otra vez" onEnter={registrar} />
        </div>

        <button onClick={registrar} disabled={cargando} className="f-btn">
          {cargando ? 'Creando cuenta…' : 'Crear cuenta gratis'}
        </button>

        <p className="f-ayuda text-center">Cada conductor presenta su DNI, licencia y vehículo antes de recibir viajes.</p>
      </div>

      <p className="text-center text-[14px] text-[#4A4F5C] mt-8">
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => router.push('/login')} className="f-link">Inicia sesión</button>
      </p>
    </>
  )
}
