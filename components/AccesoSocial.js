'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faApple, faFacebookF, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import { CIUDAD } from '@/lib/ciudad'

// Acceso con Google, Apple y Facebook (el celular con contraseña o código SMS queda en cada pantalla).
// Un proveedor se activa solo si su variable está en Render (web): si falta, el botón se ve apagado con «Pronto».
const GOOGLE_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const APPLE_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
const FACEBOOK_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID

const NOMBRES = { google: 'Google', apple: 'Apple', facebook: 'Facebook' }
const ICONOS = { google: faGoogle, apple: faApple, facebook: faFacebookF }

const scripts = {}
const cargarScript = (src) => {
  if (!scripts[src]) {
    scripts[src] = new Promise((ok, mal) => {
      const s = document.createElement('script')
      s.src = src; s.async = true
      s.onload = ok
      s.onerror = () => { delete scripts[src]; mal(new Error('No se pudo cargar ' + src)) }
      document.head.appendChild(s)
    })
  }
  return scripts[src]
}

export default function AccesoSocial({ modo = 'login' }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(null)       // proveedor en curso
  const [pendiente, setPendiente] = useState(null)     // { proveedor, credential, nombre, email, nombreCliente }
  const [celular, setCelular] = useState('')
  const [nombreManual, setNombreManual] = useState('')
  const [enviando, setEnviando] = useState(false)
  const contenedor = useRef(null)
  const [ancho, setAncho] = useState(320)

  useEffect(() => {
    const medir = () => { if (contenedor.current) setAncho(Math.max(200, Math.min(400, Math.round(contenedor.current.offsetWidth)))) }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  const entrar = (data) => {
    localStorage.setItem('safo_token', data.token)
    localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
    const rol = data.usuario?.rol
    router.push(rol === 'admin' ? '/dashboard' : rol === 'conductor' ? '/conductor' : '/pasajero')
  }

  // Envía la credencial al servidor, que la verifica con el proveedor
  const verificar = async (proveedor, credential, nombreCliente = '') => {
    setCargando(proveedor)
    try {
      const { data } = await api.post('/api/auth/social', { proveedor, credential, nombre: nombreCliente || undefined })
      if (data.nuevo) {
        setPendiente({ proveedor, credential, nombre: data.nombre || '', email: data.email, nombreCliente })
        return
      }
      entrar(data)
    } catch (e) {
      toast.error(e.response?.data?.error || `No se pudo continuar con ${NOMBRES[proveedor]}`)
    } finally {
      setCargando(null)
    }
  }

  const conApple = async () => {
    setCargando('apple')
    try {
      await cargarScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/es_ES/appleid.auth.js')
      window.AppleID.auth.init({ clientId: APPLE_ID, scope: 'name email', redirectURI: window.location.origin, state: 'safo', usePopup: true })
      const r = await window.AppleID.auth.signIn()
      const n = r?.user?.name
      const nombre = n ? [n.firstName, n.lastName].filter(Boolean).join(' ') : ''
      await verificar('apple', r?.authorization?.id_token, nombre)
    } catch (e) {
      if (e?.error && /popup_closed|user_cancelled/i.test(e.error)) return // cerró la ventana: no es un error
      toast.error(e?.response?.data?.error || 'No se pudo continuar con Apple')
    } finally {
      setCargando(null)
    }
  }

  const conFacebook = async () => {
    setCargando('facebook')
    try {
      await cargarScript('https://connect.facebook.net/es_LA/sdk.js')
      window.FB.init({ appId: FACEBOOK_ID, cookie: false, xfbml: false, version: 'v19.0' })
      const r = await new Promise((ok) => window.FB.login(ok, { scope: 'public_profile,email' }))
      if (!r?.authResponse?.accessToken) { toast('Cancelaste el acceso con Facebook', { icon: 'ℹ️' }); return }
      await verificar('facebook', r.authResponse.accessToken)
    } catch {
      toast.error('No se pudo continuar con Facebook')
    } finally {
      setCargando(null)
    }
  }

  const completar = async () => {
    const cel = celular.replace(/\D/g, '')
    if (cel.length !== 9) return toast.error('Ingresa tu celular de 9 dígitos')
    if (!pendiente.nombre && nombreManual.trim().length < 2) return toast.error('Escribe tu nombre')
    setEnviando(true)
    try {
      const { data } = await api.post('/api/auth/social/completar', {
        proveedor: pendiente.proveedor, credential: pendiente.credential, celular: cel,
        nombre: pendiente.nombreCliente || undefined, nombre_manual: nombreManual.trim() || undefined,
      })
      entrar(data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'No se pudo crear tu cuenta')
    } finally {
      setEnviando(false)
    }
  }

  const base = 'w-full h-[46px] rounded-[10px] font-semibold text-[15px] flex items-center justify-center gap-3 transition active:translate-y-px disabled:cursor-not-allowed'
  const apagado = (p) => (
    <button key={p} type="button" disabled aria-label={`${NOMBRES[p]} (pronto)`}
      className={`${base} bg-[#F6F7F9] text-[#A3A8B3] border border-[#E8EAEE]`}>
      <FontAwesomeIcon icon={ICONOS[p]} />{NOMBRES[p]}<span className="text-[11px] font-semibold bg-[#E8EAEE] text-[#7A7F8C] rounded-full px-2 py-0.5">Pronto</span>
    </button>
  )

  const accion = modo === 'registro' ? 'Registrarme' : 'Continuar'
  const cuerpo = (
    <div className="space-y-2.5" ref={contenedor}>
      {GOOGLE_ID ? (
        <div className="h-[46px] flex items-center justify-center" aria-busy={cargando === 'google'}>
          <GoogleLogin onSuccess={(c) => verificar('google', c.credential)} onError={() => toast.error('No se pudo continuar con Google')}
            theme="outline" shape="rectangular" size="large" width={String(ancho)} text={modo === 'registro' ? 'signup_with' : 'continue_with'} locale="es" />
        </div>
      ) : apagado('google')}

      {APPLE_ID ? (
        <button type="button" onClick={conApple} disabled={!!cargando}
          className={`${base} bg-[#16181D] text-white hover:bg-black disabled:opacity-60`}>
          <FontAwesomeIcon icon={faApple} className="text-lg" />{cargando === 'apple' ? 'Abriendo Apple…' : `${accion} con Apple`}
        </button>
      ) : null /* Apple se oculta hasta tener la cuenta Apple Developer y su clave en Render */}

      {FACEBOOK_ID ? (
        <button type="button" onClick={conFacebook} disabled={!!cargando}
          className={`${base} bg-white text-[#16181D] border border-[#D9DCE3] hover:bg-[#F6F7F9] disabled:opacity-60`}>
          <FontAwesomeIcon icon={faFacebookF} className="text-lg text-[#1877F2]" />{cargando === 'facebook' ? 'Abriendo Facebook…' : `${accion} con Facebook`}
        </button>
      ) : apagado('facebook')}
    </div>
  )

  return (
    <>
      {GOOGLE_ID ? <GoogleOAuthProvider clientId={GOOGLE_ID}>{cuerpo}</GoogleOAuthProvider> : cuerpo}

      {pendiente && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Completar registro">
          <div className="w-full max-w-md bg-white rounded-2xl p-7 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <span className="w-11 h-11 rounded-xl bg-[#F6F7F9] border border-[#E8EAEE] text-[#16181D] flex items-center justify-center text-lg"><FontAwesomeIcon icon={ICONOS[pendiente.proveedor]} /></span>
              <button onClick={() => setPendiente(null)} aria-label="Cerrar" className="w-9 h-9 rounded-lg text-[#7A7F8C] hover:bg-[#F6F7F9]"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <h2 className="text-[1.4rem] font-semibold text-[#16181D]">Un último paso{pendiente.nombre ? `, ${pendiente.nombre.split(' ')[0]}` : ''}</h2>
            <p className="text-[14px] leading-relaxed text-[#4A4F5C] mt-1.5">Tu cuenta de {NOMBRES[pendiente.proveedor]}{pendiente.email ? ` (${pendiente.email})` : ''} aún no está en SafO. Indica tu celular para crearla: el conductor lo usará para encontrarte.</p>
            {!pendiente.nombre && (
              <input value={nombreManual} onChange={(e) => setNombreManual(e.target.value)} maxLength={100} placeholder="Tu nombre completo" aria-label="Tu nombre completo"
                className="f-input mt-5" />
            )}
            <div className="f-grupo mt-4">
              <span className="f-prefijo" aria-hidden="true">{CIUDAD.prefijoTelefono}</span>
              <input type="tel" inputMode="numeric" autoFocus value={celular} onChange={(e) => setCelular(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && completar()}
                placeholder="987 654 321" aria-label="Celular" />
            </div>
            <button onClick={completar} disabled={enviando} className="f-btn mt-5">
              {enviando ? 'Creando cuenta…' : 'Crear mi cuenta gratis'}
            </button>
            <p className="text-[12.5px] text-[#7A7F8C] text-center mt-3">Crear tu cuenta es gratis.</p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
