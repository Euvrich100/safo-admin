'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPowerOff, faLocationDot, faLocationCrosshairs, faRoute, faPhone, faStar, faClockRotateLeft, faWallet,
  faUser, faHouse, faCheck, faXmark, faFlagCheckered, faTriangleExclamation, faRightFromBracket, faCar,
  faCircleInfo, faLock, faBell,
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import api from '@/lib/api'
import { rutaEntre, distanciaKm, minutosPara } from '@/lib/geo'
import { pitar, vibrar, notificar, pedirPermisoNotificaciones } from '@/lib/avisos'
import { hace, soles } from '@/lib/formato'
import { nombreVehiculo } from '@/lib/vehiculos'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import BotonSOS from '@/components/BotonSOS'
import ReclamosPanel from '@/components/ReclamosPanel'
import MisDocumentos from '@/components/MisDocumentos'

const MapaConductor = dynamic(() => import('@/components/MapaConductor'), { ssr: false })

const YAPE = process.env.NEXT_PUBLIC_PAGO_YAPE || ''
const PLIN = process.env.NEXT_PUBLIC_PAGO_PLIN || ''
const ENVIO_GPS_MS = 10000
const errorDe = (e, resp) => e?.response?.data?.error || resp

const TABS = [
  { id: 'inicio', texto: 'Inicio', icono: faHouse },
  { id: 'historial', texto: 'Viajes', icono: faClockRotateLeft },
  { id: 'ganancias', texto: 'Ganancias', icono: faWallet },
  { id: 'cuenta', texto: 'Cuenta', icono: faUser },
]
const ESTADO_VIAJE = {
  completado: ['Completado', 'bg-[#F1F1F3] text-[#1D1D1F]'],
  cancelado_pasajero: ['Canceló el pasajero', 'bg-[#FCEAE9] text-[#D92D20]'],
  cancelado_conductor: ['Cancelado', 'bg-[#FEF3E2] text-[#B45309]'],
  no_show: ['No se presentó', 'bg-[#FEF3E2] text-[#B45309]'],
  solicitado: ['Solicitud', 'bg-[#EAF2FE] text-[#0A66E0]'],
  aceptado: ['En camino', 'bg-[#EAF2FE] text-[#0A66E0]'],
  en_camino: ['En camino', 'bg-[#EAF2FE] text-[#0A66E0]'],
  recogido: ['En viaje', 'bg-[#FFF6D9] text-[#8A6A00]'],
}

export default function ConductorPage() {
  const router = useRouter()
  const [sesion, setSesion] = useState(undefined) // undefined: leyendo · null: sin sesión
  const [tab, setTab] = useState('inicio')
  const [perfil, setPerfil] = useState(null)
  const [ganancias, setGanancias] = useState(null)
  const [viaje, setViaje] = useState(null)
  const [historial, setHistorial] = useState(null)
  const [pos, setPos] = useState(null)
  const [permiso, setPermiso] = useState('desconocido') // desconocido | concedido | denegado | no_soportado
  const [modalUbi, setModalUbi] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [ruta, setRuta] = useState(null)
  const [ajuste, setAjuste] = useState(1)
  const [confirmaCancelar, setConfirmaCancelar] = useState(false)
  const [claves, setClaves] = useState({ actual: '', nueva: '', repetir: '' })

  const posRef = useRef(null)
  const ultimoEnvio = useRef(0)
  const idAvisado = useRef(null)
  const vistoViaje = useRef(null)    // { id, venceEn }
  const [, setTick] = useState(0)
  const rutaDesde = useRef(null)
  const tenia = useRef(null)

  // ── Sesión ──
  useEffect(() => {
    let usr = null
    try { usr = JSON.parse(localStorage.getItem('safo_usuario') || 'null') } catch { usr = null }
    if (!localStorage.getItem('safo_token') || !usr) { setSesion(null); return }
    if (usr.rol === 'admin') { router.replace('/dashboard'); return }
    if (usr.rol === 'pasajero') { router.replace('/pasajero'); return }
    setSesion(usr)
  }, [router])

  // ── Datos ──
  const cargarPerfil = useCallback(async () => {
    try { setPerfil((await api.get('/api/conductores/perfil')).data) } catch (e) { toast.error(errorDe(e, 'No se pudo cargar tu perfil'), { id: 'perfil' }) }
  }, [])
  const cargarGanancias = useCallback(async () => {
    try { setGanancias((await api.get('/api/conductores/ganancias')).data) } catch { /* se reintenta */ }
  }, [])
  useEffect(() => { if (sesion) { cargarPerfil(); cargarGanancias() } }, [sesion, cargarPerfil, cargarGanancias])
  useEffect(() => {
    if (!sesion) return
    const t = setInterval(cargarGanancias, 60000)
    return () => clearInterval(t)
  }, [sesion, cargarGanancias])

  // ── Permiso de ubicación (reacciona si el usuario lo concede desde el candado del navegador) ──
  useEffect(() => {
    if (!sesion) return
    if (!navigator.geolocation) { setPermiso('no_soportado'); return }
    let estado = null
    const aplicar = () => setPermiso(estado.state === 'granted' ? 'concedido' : estado.state === 'denied' ? 'denegado' : 'desconocido')
    navigator.permissions?.query({ name: 'geolocation' }).then((e) => { estado = e; aplicar(); e.onchange = aplicar }).catch(() => {})
    return () => { if (estado) estado.onchange = null }
  }, [sesion])

  const obtenerPosicion = useCallback(() => new Promise((resolver, rechazar) => {
    if (!navigator.geolocation) return rechazar({ code: 0 })
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const nueva = [p.coords.latitude, p.coords.longitude]
        posRef.current = nueva; setPos(nueva); setPermiso('concedido'); resolver(nueva)
      },
      (e) => { if (e.code === 1) setPermiso('denegado'); rechazar(e) },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    )
  }), [])

  // ── GPS en vivo mientras estoy conectado o con un viaje ──
  const conectado = !!perfil?.disponible
  const activoGPS = sesion && (conectado || !!viaje) && permiso !== 'denegado' && permiso !== 'no_soportado'
  useEffect(() => {
    if (!activoGPS) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const nueva = [p.coords.latitude, p.coords.longitude]
        const antes = posRef.current
        posRef.current = nueva
        if (!antes || distanciaKm(antes, nueva) > 0.008) setPos(nueva)
        if (Date.now() - ultimoEnvio.current > ENVIO_GPS_MS) enviarPos()
      },
      (e) => { if (e.code === 1) setPermiso('denegado') },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )
    // Aunque no me mueva, aviso cada 20 s que sigo aquí (si no, SafO me da por desconectado)
    const latido = setInterval(() => { if (posRef.current) enviarPos() }, 20000)
    return () => { navigator.geolocation.clearWatch(id); clearInterval(latido) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activoGPS])

  const enviarPos = async () => {
    const p = posRef.current
    if (!p) return
    ultimoEnvio.current = Date.now()
    try { await api.put('/api/conductores/ubicacion', { lat: p[0], lng: p[1] }) } catch { /* el próximo latido reintenta */ }
  }

  // ── Solicitud / viaje en curso (se consulta cada 4 s) ──
  const cargarViaje = useCallback(async () => {
    try {
      const { data } = await api.get('/api/conductores/viaje-activo')
      setViaje(data.viaje)
    } catch { /* silencioso */ }
  }, [])
  useEffect(() => {
    if (!sesion) return
    cargarViaje()
    const t = setInterval(cargarViaje, 4000)
    return () => clearInterval(t)
  }, [sesion, cargarViaje])

  // Cuenta regresiva local de la solicitud
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])
  if (viaje?.estado === 'solicitado') {
    if (vistoViaje.current?.id !== viaje.id) vistoViaje.current = { id: viaje.id, venceEn: Date.now() + viaje.segundos_restantes * 1000 }
  }
  const segundos = viaje?.estado === 'solicitado' && vistoViaje.current?.id === viaje.id
    ? Math.max(0, Math.ceil((vistoViaje.current.venceEn - Date.now()) / 1000)) : 0

  // Aviso de solicitud nueva y de fin de viaje / solicitud vencida
  useEffect(() => {
    if (viaje?.estado === 'solicitado' && idAvisado.current !== viaje.id) {
      idAvisado.current = viaje.id
      pitar(); vibrar()
      notificar('Nueva solicitud de SafO', `${viaje.pasajero_nombre} te pide un taxi`)
      setTab('inicio')
    }
    const prev = tenia.current
    if (prev && !viaje) {
      // La solicitud desapareció sin que yo actuara: venció o el pasajero canceló
      if (prev.estado === 'solicitado' && !prev.respondida) {
        toast('La solicitud venció. Vuelve a conectarte para recibir más viajes.', { icon: '⏱️', duration: 7000 })
        cargarPerfil()
      } else if (['aceptado', 'en_camino'].includes(prev.estado) && !prev.respondida) {
        toast('El pasajero canceló el viaje. Recibes S/ de compensación según las reglas de SafO.', { duration: 8000 })
        cargarPerfil(); cargarGanancias()
      }
    }
    tenia.current = viaje ? { id: viaje.id, estado: viaje.estado, respondida: tenia.current?.id === viaje.id ? tenia.current.respondida : false } : null
  }, [viaje, cargarPerfil, cargarGanancias])
  const marcarRespondida = () => { if (tenia.current) tenia.current.respondida = true }

  // ── Ruta de la fase actual ──
  const fase = !viaje ? null : viaje.estado === 'solicitado' ? 'solicitud' : viaje.estado === 'recogido' ? 'viaje' : 'recojo'
  const recojo = viaje ? [Number(viaje.lat_origen), Number(viaje.lng_origen)] : null
  const destino = viaje && viaje.lat_destino !== null && viaje.lng_destino !== null ? [Number(viaje.lat_destino), Number(viaje.lng_destino)] : null
  const objetivo = fase === 'viaje' ? destino : recojo

  useEffect(() => {
    if (!fase || !pos || !objetivo) { setRuta(null); rutaDesde.current = null; return }
    const clave = `${viaje.id}:${fase}`
    const ant = rutaDesde.current
    if (ant && ant.clave === clave && distanciaKm(ant.pos, pos) < 0.15) return
    rutaDesde.current = { clave, pos }
    const ctl = new AbortController()
    rutaEntre(pos, objetivo, ctl.signal).then(r => { setRuta(r); setAjuste(a => (ant && ant.clave === clave ? a : a + 1)) }).catch(() => {})
    return () => ctl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, viaje?.id, pos?.[0], pos?.[1], objetivo?.[0], objetivo?.[1]])
  const aproximado = pos && objetivo ? { km: distanciaKm(pos, objetivo) * 1.3, min: minutosPara(distanciaKm(pos, objetivo)) } : null
  const tramo = ruta || aproximado

  // ── Acciones ──
  const ejecutar = async (fn, okMsg) => {
    setOcupado(true)
    try {
      const data = await fn()
      if (okMsg) toast.success(okMsg(data))
      await Promise.all([cargarViaje(), cargarPerfil(), cargarGanancias()])
      setAjuste(a => a + 1)
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo completar la acción'))
      cargarViaje()
    } finally { setOcupado(false) }
  }

  const conectar = async () => {
    if (perfil?.estado_doc !== 'aprobado') return toast.error('Tus documentos aún no están aprobados')
    if (permiso === 'denegado') return toast.error('Activa la ubicación del navegador (candado junto a la dirección) para recibir viajes', { duration: 7000 })
    if (permiso === 'desconocido') { setModalUbi(true); return }
    await ejecutarConectar(true)
  }
  const ejecutarConectar = async (disponible) => {
    setOcupado(true)
    try {
      let p = posRef.current
      if (disponible && !p) p = await obtenerPosicion()
      await api.put('/api/conductores/disponibilidad', { disponible, lat: p?.[0], lng: p?.[1] })
      if (disponible) { pedirPermisoNotificaciones(); pitar() }
      toast.success(disponible ? 'Estás en línea: recibirás solicitudes' : 'Te desconectaste')
      await cargarPerfil()
    } catch (e) {
      if (e?.code === 1) toast.error('Sin ubicación no puedes recibir viajes cerca de ti', { duration: 6000 })
      else if (e?.code) toast.error('No pudimos obtener tu ubicación. Revisa que el GPS esté activo.')
      else toast.error(errorDe(e, 'No se pudo cambiar tu estado'))
    } finally { setOcupado(false) }
  }
  const autorizarUbicacion = async () => {
    setModalUbi(false)
    try { await obtenerPosicion(); await ejecutarConectar(true) } catch { toast.error('Sin ubicación no puedes recibir viajes cerca de ti', { duration: 6000 }) }
  }

  const aceptar = () => { ejecutar(() => api.put(`/api/viajes/${viaje.id}/aceptar`).then(r => r.data), () => 'Viaje aceptado. Ve al punto de recojo.') }
  const rechazar = () => { marcarRespondida(); ejecutar(() => api.put(`/api/viajes/${viaje.id}/rechazar`, { motivo: 'Rechazado por el conductor' }).then(r => r.data), () => 'Solicitud rechazada'); setConfirmaCancelar(false) }
  const iniciar = () => ejecutar(() => api.put(`/api/viajes/${viaje.id}/iniciar`).then(r => r.data), () => 'Viaje iniciado. ¡Buen camino!')
  const completar = () => {
    const tarifa = viaje.tarifa_estimada
    marcarRespondida()
    ejecutar(() => api.put(`/api/viajes/${viaje.id}/completar`).then(r => r.data),
      () => (tarifa ? `Viaje completado. Cobra ${soles(tarifa)} al pasajero (estimado).` : 'Viaje completado'))
  }

  const cambiarClave = async () => {
    if (claves.nueva.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres')
    if (claves.nueva !== claves.repetir) return toast.error('Las contraseñas nuevas no coinciden')
    setOcupado(true)
    try {
      await api.put('/api/cuenta/clave', { actual: claves.actual, nueva: claves.nueva })
      toast.success('Contraseña actualizada'); setClaves({ actual: '', nueva: '', repetir: '' })
    } catch (e) { toast.error(errorDe(e, 'No se pudo cambiar la contraseña')) } finally { setOcupado(false) }
  }
  const cerrarSesion = async () => {
    if (conectado) { try { await api.put('/api/conductores/disponibilidad', { disponible: false }) } catch { /* igual se cierra */ } }
    localStorage.removeItem('safo_token'); localStorage.removeItem('safo_usuario'); router.push('/login')
  }

  useEffect(() => {
    if (tab !== 'historial' || !sesion) return
    api.get('/api/conductores/viajes').then(r => setHistorial(r.data)).catch(() => toast.error('No se pudo cargar tu historial', { id: 'hist' }))
  }, [tab, sesion, viaje?.id])

  const vencida = perfil?.suscripcion_vence && new Date(String(perfil.suscripcion_vence).slice(0, 10) + 'T23:59:59') < new Date()
  const sinSuscripcion = perfil && perfil.estado_doc === 'aprobado' && (!perfil.suscripcion_vence || vencida)
  const hoy = ganancias?.hoy
  const nombre = (perfil?.nombre || sesion?.nombre || '').split(' ')[0]
  const telPasajero = viaje?.pasajero_celular ? String(viaje.pasajero_celular).replace(/\D/g, '') : null

  const mapaProps = useMemo(() => ({
    yo: pos, recojo: fase && fase !== 'viaje' ? recojo : null,
    destino: fase === 'viaje' ? destino : null,
  }), [pos, fase, viaje?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ═════════ Pantallas de acceso ═════════
  if (sesion === undefined) return <div className="min-h-screen bg-[#F4F6FA]" />
  if (sesion === null) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <SafoLogo size={96} priority />
      <h1 className="text-2xl font-semibold text-[#14213D] mt-6">Panel del conductor</h1>
      <p className="text-[#6E6E73] mt-2 max-w-sm">Conéctate, recibe solicitudes de pasajeros y mira tus ganancias.</p>
      <div className="mt-8 w-full max-w-xs space-y-3">
        <button onClick={() => router.push('/login')} className="w-full py-3.5 rounded-full bg-[#0A66E0] text-white font-semibold">Iniciar sesión</button>
        <button onClick={() => router.push('/registro/conductor')} className="w-full py-3.5 rounded-full border border-[#E2E2E7] text-[#14213D] font-semibold">Quiero ser conductor</button>
      </div>
    </div>
  )

  // ═════════ Vistas ═════════
  const Estadisticas = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white p-4 text-center border border-[#E6E8EF]">
        <div className="text-2xl font-bold text-[#14213D]">{soles(hoy?.total)}</div>
        <div className="text-xs text-[#6E6E73] mt-1">Ganancias de hoy</div>
      </div>
      <div className="rounded-2xl bg-white p-4 text-center border border-[#E6E8EF]">
        <div className="text-2xl font-bold text-[#14213D]">{hoy?.viajes ?? 0}</div>
        <div className="text-xs text-[#6E6E73] mt-1">Viajes de hoy</div>
      </div>
    </div>
  )

  const Avisos = () => (
    <div className="space-y-2">
      {perfil?.estado_doc === 'pendiente' && (
        <div className="rounded-2xl bg-[#FEF3E2] text-[#92400E] p-4 text-sm"><FontAwesomeIcon icon={faCircleInfo} className="mr-2" />Tu registro está en revisión. Te avisaremos en menos de 24 horas.</div>
      )}
      {perfil?.estado_doc === 'rechazado' && (
        <div className="rounded-2xl bg-[#FCEAE9] text-[#B42318] p-4 text-sm"><FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />Tus documentos fueron rechazados{perfil.rechazo_motivo ? `: ${perfil.rechazo_motivo}` : '.'}</div>
      )}
      {perfil?.estado_doc === 'aprobado' && (perfil.documentos?.vencidos?.length > 0 || perfil.documentos?.vigencias?.some(v => v.estado === 'por_vencer')) && (
        <button type="button" onClick={() => { setTab('cuenta'); setTimeout(() => document.getElementById('mis-documentos')?.scrollIntoView({ behavior: 'smooth' }), 80) }}
          className={`w-full text-left rounded-2xl p-4 text-sm ${perfil.documentos.vencidos.length > 0 ? 'bg-[#FCEAE9] text-[#B42318]' : 'bg-[#FEF3E2] text-[#92400E]'}`}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
          {perfil.documentos.vencidos.length > 0
            ? <>Tienes vencido: <b>{perfil.documentos.vencidos.join(', ')}</b>. No puedes recibir viajes hasta renovarlo. <u>Renovar ahora</u></>
            : <>Por vencer: <b>{perfil.documentos.vigencias.filter(v => v.estado === 'por_vencer').map(v => v.etiqueta).join(', ')}</b>. <u>Actualiza tus documentos</u></>}
        </button>
      )}
      {sinSuscripcion && (
        <div className="rounded-2xl bg-[#FEF3E2] text-[#92400E] p-4 text-sm">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />Tu suscripción {vencida ? 'venció' : 'no está activa'}. Paga <b>S/ 5.00</b> por Yape{YAPE ? ` (${YAPE})` : ''}{PLIN ? ` o Plin (${PLIN})` : ''} y el administrador la confirmará para que puedas conectarte.
        </div>
      )}
      {permiso === 'denegado' && (
        <div className="rounded-2xl bg-[#FCEAE9] text-[#B42318] p-4 text-sm"><FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" />La ubicación está bloqueada. Toca el candado junto a la dirección del navegador y permite “Ubicación” para recibir viajes.</div>
      )}
    </div>
  )

  // Solicitud entrante
  const Solicitud = () => (
    <div className="rounded-3xl bg-white border border-[#E6E8EF] shadow-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-[#14213D] text-[#FFC21A] flex items-center justify-center text-lg font-bold">{(viaje.pasajero_nombre || '?')[0]}</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#0A66E0]">Nueva solicitud{viaje.servicio === 'moto' ? ' · Moto' : ''}</div>
            <div className="font-semibold text-[#14213D] text-lg leading-tight">{viaje.pasajero_nombre}</div>
          </div>
        </div>
        {viaje.tarifa_estimada && (
          <div className="text-right">
            <div className="text-xl font-bold text-[#14213D]">{soles(viaje.tarifa_estimada)}</div>
            <div className="text-xs text-[#8A8F9C]">tarifa estimada</div>
          </div>
        )}
      </div>

      <div className="relative pl-6 space-y-3 text-sm">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D5D8E0]" />
        <div><span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[#0A66E0] border-2 border-white ring-1 ring-[#0A66E0]" />
          <div className="text-[11px] uppercase tracking-wider text-[#8A8F9C]">Recojo{tramo ? ` · a ${tramo.km.toFixed(1)} km (${tramo.min} min)` : ''}</div>
          <div className="text-[#14213D] font-medium">{viaje.direccion_origen || 'Punto marcado en el mapa'}</div></div>
        <div><span className="absolute left-0 bottom-1 w-3.5 h-3.5 rounded-sm bg-[#14213D] border-2 border-white ring-1 ring-[#14213D]" />
          <div className="text-[11px] uppercase tracking-wider text-[#8A8F9C]">Destino{viaje.distancia_km ? ` · ${Number(viaje.distancia_km).toFixed(1)} km` : ''}</div>
          <div className="text-[#14213D] font-medium">{viaje.direccion_destino || (destino ? 'Punto marcado en el mapa' : 'Lo indicará el pasajero')}</div></div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-[#6E6E73] mb-1.5">
          <span>Tiempo para responder</span><b className={segundos <= 30 ? 'text-[#D92D20]' : 'text-[#14213D]'}>{Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')}</b>
        </div>
        <div className="h-1.5 rounded-full bg-[#EDEFF4] overflow-hidden">
          <div className="h-full bg-[#FFC21A] transition-all duration-1000" style={{ width: `${Math.min(100, (segundos / 180) * 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={rechazar} disabled={ocupado} className="py-3.5 rounded-2xl border-2 border-[#D92D20] text-[#D92D20] font-semibold disabled:opacity-50">
          <FontAwesomeIcon icon={faXmark} className="mr-2" />Rechazar
        </button>
        <button onClick={aceptar} disabled={ocupado || segundos === 0} className="py-3.5 rounded-2xl bg-[#14213D] text-white font-semibold disabled:opacity-50">
          <FontAwesomeIcon icon={faCheck} className="mr-2" />Aceptar
        </button>
      </div>
    </div>
  )

  // Viaje aceptado / en curso
  const ViajeEnCurso = () => (
    <div className="rounded-3xl bg-white border border-[#E6E8EF] shadow-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#0A66E0]">
            {fase === 'recojo' ? 'Ve a recoger al pasajero' : 'Llevando al pasajero'}
          </div>
          <div className="text-lg font-semibold text-[#14213D]">
            {tramo ? `${tramo.km.toFixed(1)} km · ${tramo.min} min` : 'Calculando ruta…'}
          </div>
        </div>
        {viaje.tarifa_estimada && (
          <div className="text-right">
            <div className="text-xl font-bold text-[#14213D]">{soles(viaje.tarifa_estimada)}</div>
            <div className="text-xs text-[#8A8F9C]">cobra en efectivo</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-[#F4F6FA] p-3">
        <span className="w-11 h-11 rounded-full bg-[#14213D] text-[#FFC21A] flex items-center justify-center font-bold">{(viaje.pasajero_nombre || '?')[0]}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#14213D] truncate">{viaje.pasajero_nombre}</div>
          <div className="text-xs text-[#6E6E73] truncate">{fase === 'recojo' ? (viaje.direccion_origen || 'Punto marcado en el mapa') : (viaje.direccion_destino || 'Destino en el mapa')}</div>
        </div>
        {viaje.pasajero_celular && (
          <>
            <a href={`tel:${viaje.pasajero_celular}`} aria-label="Llamar al pasajero" className="w-11 h-11 rounded-full bg-[#14213D] text-white flex items-center justify-center"><FontAwesomeIcon icon={faPhone} /></a>
            <a href={`https://wa.me/51${telPasajero?.slice(-9)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center"><FontAwesomeIcon icon={faWhatsapp} /></a>
          </>
        )}
      </div>

      {fase === 'recojo' ? (
        <>
          <button onClick={iniciar} disabled={ocupado} className="w-full py-4 rounded-2xl bg-[#14213D] text-white font-semibold text-base disabled:opacity-50">
            <FontAwesomeIcon icon={faCar} className="mr-2" />Ya lo recogí · Iniciar viaje
          </button>
          {confirmaCancelar ? (
            <div className="rounded-2xl bg-[#FCEAE9] p-3 text-sm text-[#B42318]">
              Si cancelas, se le devuelve la garantía al pasajero y no recibes compensación.
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => setConfirmaCancelar(false)} className="py-2.5 rounded-xl bg-white text-[#14213D] font-medium">Seguir</button>
                <button onClick={rechazar} disabled={ocupado} className="py-2.5 rounded-xl bg-[#D92D20] text-white font-semibold disabled:opacity-50">Sí, cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmaCancelar(true)} className="w-full py-2.5 text-sm font-medium text-[#D92D20]">Cancelar este viaje</button>
          )}
        </>
      ) : (
        <button onClick={completar} disabled={ocupado} className="w-full py-4 rounded-2xl bg-[#1D1D1F] text-white font-semibold text-base disabled:opacity-50">
          <FontAwesomeIcon icon={faFlagCheckered} className="mr-2" />Finalizar viaje
        </button>
      )}
    </div>
  )

  const Inicio = () => {
    if (viaje) {
      return (
        <div className="space-y-3">
          <div className="relative h-[42vh] min-h-[260px] rounded-3xl overflow-hidden border border-[#E6E8EF]">
            <MapaConductor className="absolute inset-0" tipo={perfil?.tipo_vehiculo} {...mapaProps} ruta={ruta?.puntos} ajustarKey={ajuste} />
            <button onClick={() => setAjuste(a => a + 1)} aria-label="Centrar mapa" className="absolute top-3 right-3 z-[500] w-10 h-10 rounded-full bg-white shadow text-[#14213D]"><FontAwesomeIcon icon={faLocationCrosshairs} /></button>
          </div>
          {viaje.estado === 'solicitado' ? Solicitud() : ViajeEnCurso()}
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {Avisos()}
        {conectado ? (
          <div className="rounded-3xl overflow-hidden bg-white border border-[#E6E8EF]">
            <div className="relative h-[36vh] min-h-[240px]">
              <MapaConductor className="absolute inset-0" tipo={perfil?.tipo_vehiculo} yo={pos} ajustarKey={ajuste} />
              <button onClick={() => setAjuste(a => a + 1)} aria-label="Centrar mapa" className="absolute top-3 right-3 z-[500] w-10 h-10 rounded-full bg-white shadow text-[#14213D]"><FontAwesomeIcon icon={faLocationCrosshairs} /></button>
            </div>
            <div className="p-5 flex items-center gap-4">
              <span className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#1D1D1F]/25 animate-ping" />
                <span className="relative w-12 h-12 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center"><FontAwesomeIcon icon={faBell} /></span>
              </span>
              <div>
                <div className="font-semibold text-[#14213D]">Buscando pasajeros cerca de ti…</div>
                <div className="text-sm text-[#6E6E73]">Suena una alerta cuando llegue una solicitud. Mantén esta pantalla abierta.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-[#E6E8EF] p-8 text-center">
            <span className="w-16 h-16 rounded-full bg-[#F4F6FA] text-[#A1A1A6] flex items-center justify-center text-2xl mx-auto"><FontAwesomeIcon icon={faPowerOff} /></span>
            <h2 className="text-xl font-semibold text-[#14213D] mt-4">Estás desconectado</h2>
            <p className="text-sm text-[#6E6E73] mt-1">Conéctate para que los pasajeros cercanos te vean y puedan pedirte un viaje.</p>
            <button onClick={conectar} disabled={ocupado || perfil?.estado_doc !== 'aprobado'}
              className="mt-5 w-full py-4 rounded-2xl bg-[#FFC21A] text-[#14213D] font-bold text-base disabled:opacity-50">
              <FontAwesomeIcon icon={faPowerOff} className="mr-2" />Conectarme
            </button>
          </div>
        )}
        {Estadisticas()}
        {ganancias && (
          <div className="rounded-2xl bg-white border border-[#E6E8EF] p-4 flex items-center justify-between text-sm">
            <span className="text-[#6E6E73]">Tu calificación</span>
            <span className="font-semibold text-[#14213D]"><FontAwesomeIcon icon={faStar} className="text-[#FFC21A] mr-1.5" />{Number(ganancias.calificacion_prom || 0).toFixed(1)} · {ganancias.total_viajes} viajes</span>
          </div>
        )}
      </div>
    )
  }

  const Historial = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-[#14213D] px-1">Mis viajes</h2>
      {historial === null ? <p className="text-center text-sm text-[#8A8F9C] py-10">Cargando…</p>
        : historial.length === 0 ? <p className="text-center text-sm text-[#8A8F9C] py-10">Aún no tienes viajes.</p>
        : historial.map(v => {
          const [texto, clase] = ESTADO_VIAJE[v.estado] || [v.estado, 'bg-[#F1F2F5] text-[#6E6E73]']
          return (
            <article key={v.id} className="rounded-2xl bg-white border border-[#E6E8EF] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#14213D] truncate">{v.nombre_pasajero}</span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${clase}`}>{texto}</span>
              </div>
              <div className="text-sm text-[#6E6E73] mt-1 truncate">{v.direccion_origen || 'Origen en el mapa'}{v.direccion_destino ? ` → ${v.direccion_destino}` : ''}</div>
              <div className="flex items-center justify-between mt-2 text-xs text-[#8A8F9C]">
                <span>{hace(v.solicitado_en)}{v.servicio === 'moto' ? ' · Moto' : ''}{v.distancia_km ? ` · ${Number(v.distancia_km).toFixed(1)} km` : ''}</span>
                {v.tarifa_estimada && v.estado === 'completado' && <b className="text-sm text-[#14213D]">{soles(v.tarifa_estimada)}</b>}
              </div>
            </article>
          )
        })}
    </div>
  )

  const Ganancias = () => {
    const bloques = [['Hoy', ganancias?.hoy], ['Últimos 7 días', ganancias?.semana], ['Últimos 30 días', ganancias?.mes]]
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#14213D] px-1">Mis ganancias</h2>
        <div className="rounded-3xl bg-[#14213D] text-white p-6">
          <div className="text-sm text-white/60">Hoy</div>
          <div className="text-4xl font-bold mt-1">{soles(ganancias?.hoy?.total)}</div>
          <div className="text-sm text-white/70 mt-1">{ganancias?.hoy?.viajes ?? 0} viajes completados</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bloques.slice(1).map(([t, g]) => (
            <div key={t} className="rounded-2xl bg-white border border-[#E6E8EF] p-4">
              <div className="text-xs text-[#8A8F9C]">{t}</div>
              <div className="text-xl font-bold text-[#14213D] mt-1">{soles(g?.total)}</div>
              <div className="text-xs text-[#6E6E73] mt-1">{g?.viajes ?? 0} viajes{g?.compensaciones > 0 ? ` · ${soles(g.compensaciones)} compensaciones` : ''}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-[#FFF6D9] text-[#5C4A00] p-4 text-sm">
          <FontAwesomeIcon icon={faCircleInfo} className="mr-2" />Las tarifas se cobran en efectivo al pasajero y SafO no te descuenta comisión por viaje: solo pagas tu suscripción mensual de S/ 5.00. Los montos son <b>estimados</b> según la cotización de cada viaje.
        </div>
        {ganancias?.suscripcion_vence && (
          <div className="rounded-2xl bg-white border border-[#E6E8EF] p-4 text-sm flex justify-between">
            <span className="text-[#6E6E73]">Suscripción vigente hasta</span>
            <b className="text-[#14213D]">{new Date(String(ganancias.suscripcion_vence).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</b>
          </div>
        )}
        {ganancias?.resenas?.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-[#14213D] px-1">Últimas reseñas</h3>
            {ganancias.resenas.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white border border-[#E6E8EF] p-4 text-sm">
                <div className="text-[#FFC21A]">{'★'.repeat(r.estrellas)}<span className="text-[#D5D8E0]">{'★'.repeat(5 - r.estrellas)}</span></div>
                {r.comentario && <p className="text-[#14213D] mt-1">{r.comentario}</p>}
                <p className="text-xs text-[#A1A1A6] mt-1">{hace(r.creado_en)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const Cuenta = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#14213D] px-1">Mi cuenta</h2>
      <div className="rounded-2xl bg-white border border-[#E6E8EF] p-5 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-[#14213D] text-[#FFC21A] flex items-center justify-center text-xl font-bold">{(perfil?.nombre || '?')[0]}</span>
          <div><div className="font-semibold text-[#14213D] text-base">{perfil?.nombre}</div><div className="text-[#6E6E73]">{perfil?.celular}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {[['Tipo', nombreVehiculo(perfil?.tipo_vehiculo)], ['Vehículo', [perfil?.vehiculo_marca, perfil?.vehiculo_modelo].filter(Boolean).join(' ') || '—'], ['Placa', perfil?.placa || '—'], ['Color', perfil?.vehiculo_color || '—'], ['Año', perfil?.vehiculo_anno || '—']].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[#F4F6FA] p-3"><div className="text-xs text-[#8A8F9C]">{k}</div><div className="font-medium text-[#14213D]">{v}</div></div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#E6E8EF] p-5 space-y-3">
        <h3 className="font-semibold text-[#14213D]"><FontAwesomeIcon icon={faLock} className="text-[#0A66E0] mr-2" />Cambiar contraseña</h3>
        <ClaveInput value={claves.actual} onChange={v => setClaves(c => ({ ...c, actual: v }))} placeholder="Contraseña actual" />
        <ClaveInput value={claves.nueva} onChange={v => setClaves(c => ({ ...c, nueva: v }))} placeholder="Nueva contraseña" autoComplete="new-password" />
        <ClaveInput value={claves.repetir} onChange={v => setClaves(c => ({ ...c, repetir: v }))} placeholder="Repite la nueva contraseña" autoComplete="new-password" onEnter={cambiarClave} />
        <button onClick={cambiarClave} disabled={ocupado || !claves.actual || !claves.nueva} className="w-full py-3 rounded-xl bg-[#14213D] text-white font-semibold text-sm disabled:opacity-50">Guardar contraseña</button>
      </div>

      <h3 className="text-lg font-semibold text-[#14213D] px-1 pt-2" id="mis-documentos">Mis documentos</h3>
      <MisDocumentos onCambio={cargarPerfil} />

      <ReclamosPanel />

      <button onClick={cerrarSesion} className="w-full py-3.5 rounded-2xl border border-[#E6E8EF] bg-white text-[#D92D20] font-semibold">
        <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />Cerrar sesión
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F6FA] pb-28">
      <Toaster position="top-center" toastOptions={{ style: { background: '#14213D', color: '#fff' } }} />

      {/* Encabezado */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E6E8EF]">
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SafoLogo size={48} priority />
            <div className="min-w-0">
              <div className="text-xs text-[#8A8F9C]">Hola,</div>
              <div className="font-semibold text-[#14213D] leading-tight truncate">{nombre || 'conductor'}</div>
            </div>
          </div>
          <button onClick={() => (conectado ? ejecutarConectar(false) : conectar())} disabled={ocupado || !!viaje || !perfil}
            aria-pressed={conectado} aria-label={conectado ? 'Desconectarme' : 'Conectarme'}
            className={`flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-semibold transition disabled:opacity-60 ${conectado ? 'bg-[#F1F1F3] text-[#1D1D1F]' : 'bg-[#F1F2F5] text-[#6E6E73]'}`}>
            {conectado ? 'En línea' : 'Desconectado'}
            <span className={`relative w-11 h-6 rounded-full transition ${conectado ? 'bg-[#1D1D1F]' : 'bg-[#C5C8D2]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${conectado ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4">
        {tab === 'inicio' && Inicio()}
        {tab === 'historial' && Historial()}
        {tab === 'ganancias' && Ganancias()}
        {tab === 'cuenta' && Cuenta()}
      </main>

      {/* SOS durante un viaje */}
      {viaje && viaje.estado !== 'solicitado' && (
        <div className="fixed right-4 bottom-24 z-40"><BotonSOS posicion={pos} /></div>
      )}

      {/* Pestañas inferiores */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E6E8EF]" aria-label="Secciones">
        <div className="max-w-xl mx-auto grid grid-cols-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`py-3 flex flex-col items-center gap-1 text-xs font-medium transition ${tab === t.id ? 'text-[#0A66E0]' : 'text-[#8A8F9C]'}`}>
              <FontAwesomeIcon icon={t.icono} className="text-lg" />{t.texto}
            </button>
          ))}
        </div>
      </nav>

      {/* Permiso de ubicación (antes de pedírselo al navegador) */}
      {modalUbi && (
        <div className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl text-center">
            <span className="w-16 h-16 rounded-full bg-[#EAF2FE] text-[#0A66E0] flex items-center justify-center text-2xl mx-auto"><FontAwesomeIcon icon={faLocationDot} /></span>
            <h2 className="text-xl font-semibold text-[#14213D] mt-4">SafO quiere acceder a tu ubicación</h2>
            <p className="text-sm text-[#6E6E73] mt-2">La usamos para mostrarte a los pasajeros cercanos y guiarte hasta ellos. Solo se comparte mientras estés en línea.</p>
            <button onClick={autorizarUbicacion} className="mt-5 w-full py-3.5 rounded-2xl bg-[#0A66E0] text-white font-semibold">Permitir ubicación</button>
            <button onClick={() => setModalUbi(false)} className="mt-2 w-full py-3 rounded-2xl text-[#6E6E73] font-medium">Ahora no</button>
          </div>
        </div>
      )}
    </div>
  )
}
