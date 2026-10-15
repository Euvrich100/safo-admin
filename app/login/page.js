'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast, { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faArrowLeft, faHand, faFlagCheckered, faMobileScreenButton, faRightToBracket, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import MapaHuanuco, { MAPA_URL } from '@/components/MapaHuanuco'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

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

  const conGoogle = async (credentialResponse) => {
    setCargando(true)
    try {
      const { data } = await api.post('/api/auth/google', { credential: credentialResponse.credential })
      if (data.nuevo) return toast.error('Esa cuenta aún no está registrada. Crea tu cuenta gratis primero.')
      ingresar(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar sesión con Google')
    } finally {
      setCargando(false)
    }
  }

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
      ingresar(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código incorrecto')
    } finally {
      setCargando(false)
    }
  }

  const pagina = (
    <div className="min-h-screen flex bg-white">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1D1D1F', color: 'white' }
      }}/>

      {/* Panel izquierdo — mapa de Huánuco sobre fondo blanco */}
      <div className="hidden lg:block relative flex-1 overflow-hidden bg-white">
        <MapaHuanuco className="absolute inset-0" zoom={15} centro={[-9.9306, -76.2522]} />
        {/* Velo blanco: deja el texto legible a la izquierda y el mapa a la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-white/0" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/60" />

        <div className="relative h-full flex flex-col justify-between p-12">
          <SafoLogo size={64} showText priority />

          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-semibold text-[#14213D] mb-5 leading-[1.1] tracking-tight">
              Taxis seguros para cada calle de Huánuco.
            </h2>
            <p className="text-[#4B5873] text-lg leading-relaxed">
              Pide tu taxi, mira quién viene y viaja tranquilo. Los administradores gestionan la plataforma desde aquí.
            </p>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex gap-8 text-[#14213D]">
              {[
                { n: 'S/ 5', label: 'por conductor al mes' },
                { n: 'S/ 1.50', label: 'garantía por viaje' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-semibold">{s.n}</div>
                  <div className="text-[#6B7894] text-sm mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <a href={MAPA_URL} target="_blank" rel="noreferrer"
              className="rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-sm border border-[#E2E8F0] hover:border-[#0A66E0] transition">
              <div className="text-sm font-semibold text-[#14213D]">Plaza de Armas, Huánuco</div>
              <div className="text-xs text-[#6B7894]">1 894 m s. n. m. · Ver mapa completo</div>
            </a>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 lg:max-w-md flex flex-col justify-center p-8 lg:p-12">

        {/* Logo mobile */}
        <div className="flex justify-center mb-8 lg:hidden">
          <SafoLogo size={72} priority />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            {modo === 'clave' || paso === 1
              ? <>Hola de nuevo <FontAwesomeIcon icon={faHand} className="text-[#FFC21A] text-2xl ml-1" /></>
              : <>¡Casi listo! <FontAwesomeIcon icon={faFlagCheckered} className="text-[#0A66E0] text-2xl ml-1" /></>}
          </h1>
          <p className="text-[#6E6E73] text-sm">
            {modo === 'clave'
              ? 'Ingresa con tu celular y tu contraseña'
              : paso === 1
                ? 'Te enviaremos un código de verificación'
                : `Código enviado al ${celular}`}
          </p>
        </div>

        {modo === 'clave' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">Número de celular</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1A6] text-sm font-medium"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />+51</span>
                <input type="tel" inputMode="numeric" placeholder="999 000 001" value={celular} autoComplete="tel-national"
                  onChange={e => setCelular(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && entrarConClave()}
                  className="w-full pl-[5.5rem] pr-4 py-4 rounded-2xl text-[#1D1D1F] text-lg font-medium placeholder-[#A1A1A6] bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none transition" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">Contraseña</label>
              <ClaveInput value={clave} onChange={setClave} onEnter={entrarConClave} className="!py-4 !rounded-2xl text-lg" />
            </div>

            <button onClick={entrarConClave} disabled={cargando}
              className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition disabled:opacity-50 bg-[#0A66E0] hover:bg-[#084FB0]">
              {cargando ? 'Ingresando...' : <><FontAwesomeIcon icon={faRightToBracket} className="mr-2.5" />Iniciar sesión</>}
            </button>

            <div className="flex items-center justify-between text-sm pt-1">
              <button onClick={() => setAyudaClave(v => !v)} className="text-[#6E6E73] hover:text-[#0A66E0] transition">¿Olvidaste tu contraseña?</button>
              <button onClick={() => { setModo('otp'); setPaso(1) }} className="text-[#6E6E73] hover:text-[#0A66E0] transition">Entrar con código SMS</button>
            </div>
            {ayudaClave && (
              <div className="rounded-xl bg-[#F3F8FF] p-3.5 text-sm text-[#4B5873]">
                <FontAwesomeIcon icon={faCircleInfo} className="mr-1.5 text-[#0A66E0]" />
                Comunícate con el administrador de SafO: te dará una contraseña temporal que podrás cambiar en «Mi cuenta».
              </div>
            )}

            <div className="rounded-2xl border border-[#E2E8F0] p-4 text-center">
              <span className="text-[#6E6E73] text-sm">¿Eres nuevo en SafO? </span>
              <button onClick={() => router.push('/registro/pasajero')} className="text-[#0A66E0] font-semibold text-sm hover:underline">Crea tu cuenta gratis</button>
            </div>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-[#E2E2E7]" />
                  <span className="text-[#A1A1A6] text-xs uppercase tracking-widest">o continúa con</span>
                  <div className="flex-1 h-px bg-[#E2E2E7]" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin onSuccess={conGoogle} onError={() => toast.error('No se pudo iniciar sesión con Google')}
                    theme="outline" shape="pill" size="large" text="signin_with" locale="es" />
                </div>
              </>
            )}
          </div>
        ) : paso === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">
                Número de celular
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1A6] text-sm font-medium"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />+51</span>
                <input
                  type="tel"
                  placeholder="999 000 001"
                  value={celular}
                  onChange={e => setCelular(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && solicitarOTP()}
                  className="w-full pl-[5.5rem] pr-4 py-4 rounded-2xl text-[#1D1D1F] text-lg font-medium placeholder-[#A1A1A6] bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none transition"
                />
              </div>
            </div>

            <button
              onClick={solicitarOTP}
              disabled={cargando}
              className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition disabled:opacity-50 bg-[#0A66E0] hover:bg-[#084FB0]"
            >
              {cargando ? 'Enviando...' : <><FontAwesomeIcon icon={faPaperPlane} className="mr-2.5" />Enviar código</>}
            </button>

            <button onClick={() => setModo('clave')}
              className="w-full py-3 text-sm text-[#0A66E0] font-semibold hover:underline transition">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Entrar con contraseña
            </button>

          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2 block">
                Código de verificación
              </label>
              <input
                type="text"
                placeholder="• • • • • •"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verificarOTP()}
                maxLength={6}
                className="w-full px-4 py-5 rounded-2xl text-[#1D1D1F] text-4xl tracking-[0.5em] text-center font-semibold placeholder-[#D2D2D7] bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none transition"
              />
              <div className="flex justify-center mt-3">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-1 mx-1 rounded-full transition-all"
                    style={{ background: codigo.length > i ? '#0A66E0' : '#E2E2E7' }}/>
                ))}
              </div>
            </div>

            <button
              onClick={verificarOTP}
              disabled={cargando || codigo.length < 6}
              className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition disabled:opacity-40 bg-[#0A66E0] hover:bg-[#084FB0]"
            >
              {cargando ? 'Verificando...' : <><FontAwesomeIcon icon={faRightToBracket} className="mr-2.5" />Ingresar al panel</>}
            </button>

            <button
              onClick={() => { setPaso(1); setCodigo('') }}
              className="w-full py-3 text-[#6E6E73] hover:text-[#1D1D1F] text-sm transition"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Cambiar número
            </button>
          </div>
        )}

        <p className="text-center text-[#A1A1A6] text-xs mt-12">
          SafO — Safe + On · Huánuco, Perú
        </p>
      </div>
    </div>
  )

  if (!GOOGLE_CLIENT_ID) return pagina
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{pagina}</GoogleOAuthProvider>
}
