'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import AccesoSocial from '@/components/AccesoSocial'
import MapaCiudad, { MAPA_URL } from '@/components/MapaCiudad'
import { CIUDAD } from '@/lib/ciudad'

export default function LoginPage() {
  const router = useRouter()
  const [celular, setCelular] = useState('')
  const [codigo, setCodigo] = useState('')
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [modo, setModo] = useState('clave') // 'clave' | 'otp'
  const [clave, setClave] = useState('')
  const [ayudaClave, setAyudaClave] = useState(false)

  // Si ya hay una sesión abierta, entrar directo al panel que corresponde
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('safo_usuario') || 'null')
      if (u && localStorage.getItem('safo_token')) {
        if (u.rol === 'admin') router.replace('/dashboard')
        else if (u.rol === 'pasajero') router.replace('/pasajero')
        else if (u.rol === 'conductor') router.replace('/conductor')
      }
    } catch { /* sin sesión válida */ }
  }, [router])

  const entrarConClave = async () => {
    const cel = celular.replace(/\D/g, '')
    if (cel.length !== 9) return toast.error('Ingresa tu celular de 9 dígitos')
    if (!clave) return toast.error('Ingresa tu contraseña')
    setCargando(true)
    try {
      const { data } = await api.post('/api/auth/login', { celular: cel, password: clave })
      ingresar(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar sesión')
      if (err.response?.data?.codigo === 'SIN_CLAVE') setAyudaClave(true)
    } finally {
      setCargando(false)
    }
  }

  // Admin → panel de administración; pasajero → su panel con el mapa; conductor → su panel móvil.
  const ingresar = (data) => {
    const rol = data.usuario?.rol
    localStorage.setItem('safo_token', data.token)
    localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
    router.push(rol === 'admin' ? '/dashboard' : rol === 'conductor' ? '/conductor' : '/pasajero')
  }

  const solicitarOTP = async () => {
    if (celular.replace(/\D/g, '').length !== 9) return toast.error('Ingresa tu celular de 9 dígitos')
    setCargando(true)
    try {
      await api.post('/api/auth/solicitar-otp', { celular: celular.replace(/\D/g, '') })
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
      const { data } = await api.post('/api/auth/verificar-otp', { celular: celular.replace(/\D/g, ''), codigo })
      ingresar(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto')
    } finally {
      setCargando(false)
    }
  }

  const titulo = modo === 'clave' ? 'Tu taxi te espera' : paso === 1 ? 'Entra con un código' : 'Revisa tus mensajes'
  const subtitulo = modo === 'clave'
    ? 'Entra con tu celular y tu contraseña.'
    : paso === 1
      ? 'Te enviamos un SMS para confirmar que eres tú.'
      : `Enviamos un código de 6 dígitos al ${celular}.`

  const campoCelular = (alEnter) => (
    <div className="f-campo">
      <label htmlFor="celular" className="f-etiqueta">Celular</label>
      <div className="f-grupo">
        <span className="f-prefijo" aria-hidden="true">{CIUDAD.prefijoTelefono}</span>
        <input id="celular" type="tel" inputMode="numeric" placeholder="987 654 321" value={celular} autoComplete="tel-national"
          onChange={e => setCelular(e.target.value)} onKeyDown={e => e.key === 'Enter' && alEnter()} />
      </div>
    </div>
  )

  const pagina = (
    <div className="min-h-screen flex bg-white">
      <Toaster position="top-center" toastOptions={{ style: { background: '#16181D', color: 'white', fontSize: 14 } }} />

      {/* Panel izquierdo: mapa de la ciudad, con un velo para que el texto se lea */}
      <div className="hidden lg:block relative flex-1 overflow-hidden bg-white">
        <MapaCiudad className="absolute inset-0" zoom={15} />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/0" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/60" />

        <div className="relative h-full flex flex-col justify-between p-12 xl:p-14">
          <SafoLogo size={44} showText priority />

          <div className="max-w-[27rem]">
            <h2 className="titulo text-[2.9rem] xl:text-[3.4rem] font-semibold text-[#16181D] leading-[1.03] mb-5">
              Taxis verificados en cada calle de {CIUDAD.nombre}.
            </h2>
            <p className="text-[#4A4F5C] text-[1.0625rem] leading-relaxed max-w-[24rem]">
              Pide tu taxi, mira quién viene por ti y sigue el viaje en el mapa.
            </p>
          </div>

          <div className="flex items-end justify-between gap-6">
            <ul className="space-y-1.5 text-[14px] text-[#4A4F5C]">
              <li className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16181D]" />Conductores con DNI, licencia y vehículo revisados</li>
              <li className="flex items-center gap-2.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16181D]" />Comparte tu viaje con quien quieras</li>
            </ul>
            <a href={MAPA_URL} target="_blank" rel="noreferrer"
              className="shrink-0 rounded-xl bg-white/95 backdrop-blur px-4 py-2.5 border border-[#E8EAEE] hover:border-[#C2C6D0] transition">
              <div className="text-[13.5px] font-semibold text-[#16181D]">{CIUDAD.lugar}, {CIUDAD.nombre}</div>
              <div className="text-xs text-[#7A7F8C]">{CIUDAD.altitud ? `${CIUDAD.altitud} · ` : ''}Ver mapa completo</div>
            </a>
          </div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex-1 lg:flex-none lg:w-[30rem] flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-14">
        <div className="w-full max-w-[22rem] mx-auto lg:mx-0">

          <div className="lg:hidden mb-9"><SafoLogo size={40} showText priority /></div>

          <div className="mb-8">
            <span className="insignia-taxi mb-5" aria-hidden="true"><FontAwesomeIcon icon={faTaxi} /></span>
            <h1 className="text-[1.75rem] leading-tight font-semibold text-[#16181D] mb-1.5">{titulo}</h1>
            <p className="text-[15px] text-[#4A4F5C]">{subtitulo}</p>
          </div>

          {modo === 'clave' ? (
            <div className="space-y-5">
              {campoCelular(entrarConClave)}
              <div className="f-campo">
                <label htmlFor="clave" className="f-etiqueta">Contraseña</label>
                <ClaveInput id="clave" value={clave} onChange={setClave} onEnter={entrarConClave} />
              </div>

              <button onClick={entrarConClave} disabled={cargando} className="f-btn">
                {cargando ? 'Ingresando…' : 'Iniciar sesión'}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13.5px]">
                <button onClick={() => setAyudaClave(v => !v)} className="f-link-suave">¿Olvidaste tu contraseña?</button>
                <button onClick={() => { setModo('otp'); setPaso(1) }} className="f-link-suave">Prefiero un código por SMS</button>
              </div>
              {ayudaClave && (
                <div className="f-aviso">
                  <FontAwesomeIcon icon={faCircleInfo} className="mr-1.5 text-[#7A7F8C]" />
                  Escríbenos o habla con el administrador de SafO: te dará una contraseña temporal que podrás cambiar en «Mi cuenta».
                </div>
              )}

              <div className="f-divisor">o continúa con</div>
              <AccesoSocial modo="login" />

              <p className="text-center text-[14px] text-[#4A4F5C] pt-1">
                ¿Primera vez en SafO?{' '}
                <button onClick={() => router.push('/registro/pasajero')} className="f-link">Crea tu cuenta</button>
              </p>
            </div>
          ) : paso === 1 ? (
            <div className="space-y-5">
              {campoCelular(solicitarOTP)}
              <button onClick={solicitarOTP} disabled={cargando} className="f-btn">
                {cargando ? 'Enviando…' : 'Enviar código'}
              </button>
              <button onClick={() => setModo('clave')} className="f-btn f-btn-sec">Entrar con contraseña</button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="f-campo">
                <label htmlFor="codigo" className="f-etiqueta">Código de verificación</label>
                <input id="codigo" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="000000" value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verificarOTP()} maxLength={6}
                  className="f-input !h-14 text-center !text-[1.6rem] font-semibold tracking-[0.45em] tabular-nums" />
              </div>
              <button onClick={verificarOTP} disabled={cargando || codigo.length < 6} className="f-btn">
                {cargando ? 'Verificando…' : 'Ingresar al panel'}
              </button>
              <button onClick={() => { setPaso(1); setCodigo('') }} className="f-btn f-btn-sec">Cambiar número</button>
            </div>
          )}

          <p className="text-[12.5px] text-[#7A7F8C] mt-10">SafO · Movilidad segura en {CIUDAD.nombre}</p>
        </div>
      </div>
    </div>
  )

  return pagina
}
