'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTaxi, faStar, faLocationCrosshairs, faLocationDot, faFlagCheckered, faPhone, faShieldHalved,
  faRightFromBracket, faMobileScreenButton, faCircleCheck, faHourglassHalf, faRotate, faXmark,
  faRoute, faWallet, faCarSide, faReceipt, faCircleInfo, faCoins, faTriangleExclamation,
  faMapPin, faRightToBracket, faUserPlus, faLock, faBullseye, faClock, faUser, faKey,
  faShareNodes, faHeadset, faBolt, faThumbsUp, faCheck,
} from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import { buscarLugares, direccionDe, rutaEntre, distanciaKm } from '@/lib/geo'
import SafoLogo from '@/components/SafoLogo'
import ClaveInput from '@/components/ClaveInput'
import MapaPasajero from '@/components/MapaPasajero'
import BotonSOS from '@/components/BotonSOS'
import ReclamosPanel from '@/components/ReclamosPanel'
import { PLAZA } from '@/components/MapaHuanuco'

const RADIO_KM = 5
const GARANTIA_BASE = 1.5 // valor por defecto; el real viene de /api/ajustes-publicos
// Números de SafO que reciben la garantía. Se configuran en Render (variables del web):
// NEXT_PUBLIC_PAGO_YAPE y NEXT_PUBLIC_PAGO_PLIN
const NUMERO_PAGO = { yape: process.env.NEXT_PUBLIC_PAGO_YAPE || '', plin: process.env.NEXT_PUBLIC_PAGO_PLIN || '' }

const ESTADO_VIAJE = {
  solicitado: { t: 'Esperando al conductor', c: '#B45309', bg: '#FEF3E2' },
  aceptado: { t: 'El conductor va hacia ti', c: '#0A66E0', bg: '#EAF2FE' },
  en_camino: { t: 'Conductor en camino', c: '#0A66E0', bg: '#EAF2FE' },
  recogido: { t: 'Viaje en curso', c: '#0A66E0', bg: '#EAF2FE' },
  completado: { t: 'Completado', c: '#1D1D1F', bg: '#F1F1F3' },
  cancelado_pasajero: { t: 'Cancelado por ti', c: '#6E6E73', bg: '#F5F5F7' },
  cancelado_conductor: { t: 'Sin respuesta / cancelado', c: '#D92D20', bg: '#FCEAE9' },
  no_show: { t: 'No te encontró', c: '#D92D20', bg: '#FCEAE9' },
}
const ESTADO_PAGO = {
  retenido: { t: 'Garantía retenida', c: '#B45309' },
  liberado_plataforma: { t: 'Viaje realizado', c: '#1D1D1F' },
  devuelto: { t: 'Devuelto a ti', c: '#1D1D1F' },
  compensado_conductor: { t: 'Retenido por cancelación', c: '#D92D20' },
}
const PASOS = ['solicitado', 'aceptado', 'recogido', 'completado']

const soles = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`
const fecha = (f) => (f ? new Date(f).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const errorDe = (e, porDefecto) => e?.response?.data?.error || porDefecto
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const coord = (lat, lng) => (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && lat !== null && lng !== null ? [Number(lat), Number(lng)] : null)

const minutosA = (km) => Math.max(1, Math.round(((Number(km) * 1.3) / 25) * 60))
const ORDENES = [
  { k: 'recomendado', t: 'Recomendado', i: faThumbsUp },
  { k: 'cercano', t: 'Más cercano', i: faBolt },
  { k: 'calificacion', t: 'Mejor calificado', i: faStar },
]

function Estrellas({ valor }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#B45309] font-semibold">
      <FontAwesomeIcon icon={faStar} className="text-xs" />{Number(valor || 5).toFixed(1)}
    </span>
  )
}

function Avatar({ nombre, tam = 44 }) {
  return (
    <div className="rounded-full bg-[#EAF2FE] text-[#0A66E0] font-semibold flex items-center justify-center shrink-0"
      style={{ width: tam, height: tam, fontSize: tam * 0.4 }}>
      {(nombre || '?').trim().charAt(0).toUpperCase()}
    </div>
  )
}

function DatosVehiculo({ c }) {
  return (
    <div className="text-sm text-[#6E6E73]">
      <FontAwesomeIcon icon={faCarSide} className="mr-1.5 text-[#A1A1A6]" />
      {[c.vehiculo_marca, c.vehiculo_modelo, c.vehiculo_anno].filter(Boolean).join(' ') || 'Vehículo'}
      {c.vehiculo_color ? ` · ${c.vehiculo_color}` : ''}
      <span className="ml-2 px-2 py-0.5 rounded-md bg-[#FFC21A] text-[#14213D] text-xs font-bold tracking-wider">{c.placa}</span>
    </div>
  )
}

// Campo de dirección con sugerencias (OpenStreetMap/Nominatim, solo Huánuco)
function CampoLugar({ valor, onTexto, onElegir, placeholder, icono, colorIcono, onLimpiar, ayuda }) {
  const [resultados, setResultados] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const timer = useRef(null)
  const ctl = useRef(null)

  const escribir = (texto) => {
    onTexto(texto)
    clearTimeout(timer.current)
    ctl.current?.abort()
    if (texto.trim().length < 3) { setResultados([]); setAbierto(false); return }
    timer.current = setTimeout(async () => {
      ctl.current = new AbortController()
      setBuscando(true)
      try {
        const r = await buscarLugares(texto, ctl.current.signal)
        setResultados(r); setAbierto(true)
      } catch { /* sin resultados */ } finally { setBuscando(false) }
    }, 500)
  }
  useEffect(() => () => { clearTimeout(timer.current); ctl.current?.abort() }, [])

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 px-3.5 rounded-xl bg-[#F5F5F7] border border-transparent focus-within:bg-white focus-within:border-[#0A66E0] transition">
        <FontAwesomeIcon icon={icono} className="text-sm shrink-0" style={{ color: colorIcono }} />
        <input value={valor} onChange={(e) => escribir(e.target.value)} onFocus={() => resultados.length && setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)} maxLength={120} placeholder={placeholder} aria-label={placeholder}
          className="flex-1 min-w-0 py-3 bg-transparent outline-none text-sm" />
        {buscando && <FontAwesomeIcon icon={faRotate} className="text-xs text-[#A1A1A6] animate-spin" />}
        {onLimpiar && valor && !buscando && (
          <button type="button" onClick={onLimpiar} aria-label="Quitar" className="text-[#A1A1A6] hover:text-[#1D1D1F]"><FontAwesomeIcon icon={faXmark} /></button>
        )}
      </div>
      {ayuda}
      {abierto && resultados.length > 0 && (
        <ul className="absolute z-[600] left-0 right-0 mt-1.5 rounded-xl bg-white border border-[#E2E2E7] shadow-lg overflow-hidden">
          {resultados.map((r, i) => (
            <li key={i}>
              <button type="button" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setAbierto(false); setResultados([]); onElegir(r) }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#F3F8FF] flex gap-3 items-start">
                <FontAwesomeIcon icon={faMapPin} className="text-[#0A66E0] mt-1 text-sm" />
                <span className="min-w-0"><span className="block text-sm font-medium truncate">{r.nombre}</span>
                  <span className="block text-xs text-[#6E6E73] truncate">{r.detalle}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function PasajeroPage() {
  const router = useRouter()
  const [sesion, setSesion] = useState(undefined) // undefined: comprobando · null: sin sesión
  const [tab, setTab] = useState('pedir')

  // ── ubicación ──
  const [permiso, setPermiso] = useState('desconocido') // desconocido | concedido | denegado | no_soportado
  const [modalPermiso, setModalPermiso] = useState(false)
  const [pidiendoGps, setPidiendoGps] = useState(false)
  const [pos, setPos] = useState(PLAZA)            // punto de recojo
  const [siguiendo, setSiguiendo] = useState(true) // el recojo sigue al GPS
  const [precision, setPrecision] = useState(null)
  const gpsRef = useRef(null)
  const saltarGeocode = useRef(false)

  const [origenTxt, setOrigenTxt] = useState('')
  const [destino, setDestino] = useState(null)
  const [destinoTxt, setDestinoTxt] = useState('')
  const [modoDestino, setModoDestino] = useState(false)
  const [ruta, setRuta] = useState(null) // { km, min, puntos, aproximada }

  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [ajustarKey, setAjustarKey] = useState(0)

  const [viaje, setViaje] = useState(null)
  const [porCalificar, setPorCalificar] = useState(null)
  const [historial, setHistorial] = useState([])
  const [finSolicitud, setFinSolicitud] = useState(null)
  const [ahora, setAhora] = useState(() => Date.now())

  const [pago, setPago] = useState({ metodo: 'yape', referencia: '' })
  const panelPedido = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const estadoPrevio = useRef(null)
  const idPrevio = useRef(null)
  const [nombreEdit, setNombreEdit] = useState('')
  const [claves, setClaves] = useState({ actual: '', nueva: '', repetir: '' })
  const [guardando, setGuardando] = useState(false)
  const [ajustes, setAjustes] = useState({ garantia: GARANTIA_BASE, compensacion_conductor: 1, compensacion_plataforma: 0.5, radio_busqueda_km: RADIO_KM })
  const [zonas, setZonas] = useState([])
  const [cotizacion, setCotizacion] = useState(null)   // { tarifa, desglose, en_zona, garantia, ... }
  const [cotizando, setCotizando] = useState(false)
  const [orden, setOrden] = useState('recomendado')
  const [verDesglose, setVerDesglose] = useState(false)
  const [compartiendo, setCompartiendo] = useState(false)
  const GARANTIA = ajustes.garantia
  const ajustesRef = useRef(ajustes)
  useEffect(() => { ajustesRef.current = ajustes }, [ajustes])

  // ── sesión ──
  useEffect(() => {
    let u = null
    try { u = JSON.parse(localStorage.getItem('safo_usuario') || 'null') } catch { u = null }
    if (!localStorage.getItem('safo_token') || !u) { setSesion(null); return }
    if (u.rol === 'admin') { router.replace('/dashboard'); return }
    if (u.rol !== 'pasajero') { setSesion(null); return }
    setSesion(u)
    setNombreEdit(u.nombre || '')
  }, [router])
  const listo = !!sesion

  // ── permiso y seguimiento de la ubicación ──
  const siguiendoRef = useRef(true)
  useEffect(() => { siguiendoRef.current = siguiendo }, [siguiendo])
  const aceptarPosicion = useCallback((p) => {
    const nueva = [p.coords.latitude, p.coords.longitude]
    setPrecision(Math.round(p.coords.accuracy || 0))
    const previa = gpsRef.current
    if (previa && distanciaKm(previa, nueva) < 0.01) return // menos de 10 m: ignorar
    gpsRef.current = nueva
    setPos((actual) => (siguiendoRef.current || !previa ? nueva : actual))
    if (!previa) setAjustarKey((k) => k + 1)
  }, [])
  const pedirUbicacion = useCallback(() => {
    if (!navigator.geolocation) { setPermiso('no_soportado'); setModalPermiso(false); return }
    setPidiendoGps(true)
    // Si el usuario cierra el aviso del navegador sin responder, el navegador no
    // avisa nada: liberamos el botón para que pueda volver a intentarlo.
    const espera = setTimeout(() => setPidiendoGps(false), 20000)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(espera)
        setPidiendoGps(false); setModalPermiso(false); setPermiso('concedido')
        setSiguiendo(true); siguiendoRef.current = true
        gpsRef.current = null
        aceptarPosicion(p)
      },
      (err) => {
        clearTimeout(espera)
        setPidiendoGps(false); setModalPermiso(false)
        if (err.code === 1) setPermiso('denegado')
        else toast('No pudimos ubicarte (señal débil). Elige el punto de recojo en el mapa.', { icon: '📍' })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
    )
  }, [aceptarPosicion])

  // al entrar: ¿ya tenemos permiso, hay que pedirlo o está bloqueado?
  useEffect(() => {
    if (!listo) return
    if (!navigator.geolocation) { setPermiso('no_soportado'); return }
    let estado = null
    let cancelado = false
    const alCambiar = () => {
      if (cancelado || !estado) return
      if (estado.state === 'granted') pedirUbicacion()
      else if (estado.state === 'denied') setPermiso('denegado')
    }
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((s) => {
        if (cancelado) return
        estado = s
        s.onchange = alCambiar
        if (s.state === 'granted') pedirUbicacion()
        else if (s.state === 'denied') setPermiso('denegado')
        else setModalPermiso(true)
      }).catch(() => setModalPermiso(true))
    } else {
      setModalPermiso(true)
    }
    return () => { cancelado = true; if (estado) estado.onchange = null }
  }, [listo, pedirUbicacion])

  // con permiso concedido, seguir al pasajero en vivo
  useEffect(() => {
    if (permiso !== 'concedido' || !navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(aceptarPosicion, () => {}, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 })
    return () => navigator.geolocation.clearWatch(id)
  }, [permiso, aceptarPosicion])

  const centrarEnMi = () => {
    if (permiso === 'concedido' && gpsRef.current) {
      setSiguiendo(true); setPos(gpsRef.current); setAjustarKey((k) => k + 1)
    } else if (permiso === 'denegado') {
      toast('La ubicación está bloqueada. Actívala en el candado de la barra de direcciones.', { icon: '🔒', duration: 6000 })
    } else {
      setModalPermiso(true)
    }
  }

  const moverPin = useCallback((p) => {
    setSiguiendo(false); setPos(p)
  }, [])

  // dirección legible del punto de recojo (cuando se mueve el pin o el GPS)
  useEffect(() => {
    if (!listo) return
    if (saltarGeocode.current) { saltarGeocode.current = false; return }
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const d = await direccionDe(pos, ctl.signal)
        setOrigenTxt(d || (siguiendo ? 'Mi ubicación actual' : 'Punto elegido en el mapa'))
      } catch { setOrigenTxt((o) => o || (siguiendo ? 'Mi ubicación actual' : 'Punto elegido en el mapa')) }
    }, 900)
    return () => { clearTimeout(t); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, listo])

  // ── destino y ruta ──
  const elegirDestinoEnMapa = useCallback(async (p) => {
    setDestino(p); setModoDestino(false)
    setDestinoTxt('Punto elegido en el mapa')
    try { const d = await direccionDe(p); if (d) setDestinoTxt(d) } catch { /* se queda el texto genérico */ }
  }, [])

  const quitarDestino = () => { setDestino(null); setDestinoTxt(''); setRuta(null); setModoDestino(false); setAjustarKey((k) => k + 1) }

  // origen/destino efectivos: durante un viaje se usan los del viaje
  const origenViaje = viaje ? coord(viaje.lat_origen, viaje.lng_origen) : null
  const destinoViaje = viaje ? coord(viaje.lat_destino, viaje.lng_destino) : null
  const origenMapa = origenViaje || pos
  const destinoMapa = viaje ? destinoViaje : destino

  const claveRuta = destinoMapa ? `${origenMapa[0].toFixed(4)},${origenMapa[1].toFixed(4)}|${destinoMapa[0].toFixed(4)},${destinoMapa[1].toFixed(4)}` : null
  useEffect(() => {
    if (!claveRuta) { setRuta(null); return }
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const r = await rutaEntre(origenMapa, destinoMapa, ctl.signal)
        setRuta(r); setAjustarKey((k) => k + 1)
      } catch { /* cancelado */ }
    }, 600)
    return () => { clearTimeout(t); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveRuta])

  // ── datos del servidor ──
  const cargarConductores = useCallback(async () => {
    try {
      const { data } = await api.get('/api/viajes/conductores-disponibles', { params: { lat: pos[0], lng: pos[1], radio_km: RADIO_KM } })
      setConductores(data)
      setSeleccionado((s) => (s && !data.some((c) => c.id === s) ? null : s))
    } catch (e) {
      if (e?.response?.status !== 401) toast.error(errorDe(e, 'No se pudo cargar los conductores'))
    } finally {
      setCargando(false)
    }
  }, [pos])

  const cargarHistorial = useCallback(async () => {
    try { const { data } = await api.get('/api/viajes/mis-viajes'); setHistorial(data); return data } catch { return null }
  }, [])

  const avisar = useCallback((mensaje, opciones) => {
    toast(mensaje, { duration: 7000, ...opciones })
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('SafO', { body: mensaje }) } catch { /* ignorar */ }
  }, [])

  const cargarViaje = useCallback(async () => {
    try {
      const { data } = await api.get('/api/viajes/mi-viaje')
      const prev = estadoPrevio.current
      const act = data.activo
      setViaje(act)
      setPorCalificar(data.por_calificar)
      setFinSolicitud(act?.estado === 'solicitado' ? Date.now() + (act.segundos_restantes ?? 0) * 1000 : null)

      // avisos al cambiar de estado
      if (act && prev !== act.estado) {
        if (act.estado === 'aceptado') avisar(`¡${act.conductor_nombre} aceptó tu viaje y va hacia ti!`, { icon: '🚖' })
        if (act.estado === 'recogido') avisar('Tu viaje comenzó. ¡Buen viaje!', { icon: '🛣️' })
      }
      if (!act && prev) {
        if (data.por_calificar) avisar('Llegaste a tu destino. Califica tu viaje.', { icon: '✅' })
        else {
          const h = await cargarHistorial()
          const ult = h?.find((x) => x.id === idPrevio.current) || h?.[0]
          if (ult?.estado === 'cancelado_conductor') avisar(`El conductor no pudo atender tu solicitud. Tu garantía de ${soles(ajustesRef.current.garantia)} fue devuelta. Elige otro taxi.`, { icon: '↩️', duration: 9000 })
        }
      }
      estadoPrevio.current = act ? act.estado : null
      idPrevio.current = act ? act.id : idPrevio.current
    } catch { /* se reintenta en el siguiente ciclo */ }
  }, [avisar, cargarHistorial])

  useEffect(() => { if (listo) { cargarViaje(); cargarHistorial() } }, [listo, cargarViaje, cargarHistorial])
  useEffect(() => {
    if (!listo) return
    const id = setInterval(cargarViaje, 4000)
    return () => clearInterval(id)
  }, [listo, cargarViaje])

  useEffect(() => {
    if (!listo || viaje) return
    cargarConductores()
    const id = setInterval(cargarConductores, 10000)
    return () => clearInterval(id)
  }, [listo, viaje, cargarConductores])

  // ajustes públicos (garantía, reparto) y zonas de servicio
  useEffect(() => {
    if (!listo) return
    api.get('/api/ajustes-publicos').then((r) => setAjustes((a) => ({ ...a, ...r.data }))).catch(() => {})
    api.get('/api/zonas').then((r) => setZonas(r.data)).catch(() => {})
  }, [listo])

  // cotización estimada cuando hay destino (usa la ruta por calles si ya se calculó)
  const kmRuta = ruta?.km
  const minRuta = ruta?.min
  useEffect(() => {
    if (!listo || viaje || !destino) { setCotizacion(null); setCotizando(false); return }
    if (!ruta) { setCotizando(true); return } // se cotiza cuando llega la ruta por calles
    const ctl = new AbortController()
    setCotizando(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/viajes/cotizar', {
          signal: ctl.signal,
          params: {
            lat_origen: pos[0], lng_origen: pos[1], lat_destino: destino[0], lng_destino: destino[1],
            distancia_km: kmRuta ? Number(kmRuta).toFixed(2) : undefined, duracion_min: minRuta || undefined,
          },
        })
        setCotizacion(data)
        if (data.garantia) setAjustes((a) => (a.garantia === data.garantia ? a : { ...a, garantia: data.garantia }))
      } catch (e) { if (e?.code !== 'ERR_CANCELED') setCotizacion(null) } finally { if (!ctl.signal.aborted) setCotizando(false) }
    }, 500)
    return () => { clearTimeout(t); ctl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, viaje, destino, pos, kmRuta, minRuta])

  const idViaje = viaje?.id
  useEffect(() => { if (listo) cargarHistorial() }, [listo, idViaje, porCalificar?.id, cargarHistorial])

  useEffect(() => {
    if (finSolicitud === null) return
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [finSolicitud])

  const hayConductores = conductores.length > 0
  useEffect(() => { if (hayConductores) setAjustarKey((k) => k + 1) }, [hayConductores])

  const elegido = useMemo(() => conductores.find((c) => c.id === seleccionado) || null, [conductores, seleccionado])
  useEffect(() => {
    if (seleccionado && panelPedido.current) panelPedido.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [seleccionado])

  // ── acciones ──
  const pedirTaxi = async () => {
    if (!elegido) return
    if (cotizacion && cotizacion.en_zona === false) return toast.error('Tu punto de recojo está fuera de la zona de servicio de SafO')
    if (pago.referencia.trim().length < 4) return toast.error('Ingresa el código de operación de tu pago')
    setEnviando(true)
    try {
      await api.post('/api/viajes/solicitar', {
        conductor_id: elegido.id,
        lat_origen: pos[0], lng_origen: pos[1],
        direccion_origen: origenTxt.trim() || 'Mi ubicación actual',
        lat_destino: destino ? destino[0] : undefined,
        lng_destino: destino ? destino[1] : undefined,
        direccion_destino: destino ? (destinoTxt.trim() || undefined) : (destinoTxt.trim() || undefined),
        distancia_km: destino && ruta ? Number(ruta.km.toFixed(2)) : undefined,
        duracion_min: destino && ruta ? ruta.min : undefined,
        metodo_pago: pago.metodo,
        referencia_pago: pago.referencia.trim(),
      })
      toast.success('¡Taxi solicitado! Esperando al conductor')
      setSeleccionado(null)
      setPago((p) => ({ ...p, referencia: '' }))
      await cargarViaje()
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo solicitar el taxi'), { duration: 6000 })
      cargarConductores()
    } finally {
      setEnviando(false)
    }
  }

  const cancelarViaje = async () => {
    if (!viaje) return
    try {
      const { data } = await api.put(`/api/viajes/${viaje.id}/cancelar`, { motivo: 'Cancelado por el pasajero' })
      toast(data.mensaje, { icon: data.reembolso ? '✅' : '⚠️', duration: 6000 })
      if (data.advertencia) toast.error(data.advertencia, { duration: 8000 })
      setConfirmarCancelar(false)
      await cargarViaje()
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo cancelar el viaje'))
      setConfirmarCancelar(false)
    }
  }

  const compartirViaje = async () => {
    if (!viaje) return
    setCompartiendo(true)
    try {
      const { data } = await api.post(`/api/viajes/${viaje.id}/compartir`)
      const enlace = `${window.location.origin}/seguimiento?t=${data.token}`
      const texto = `Sigue mi viaje en SafO (${viaje.conductor_nombre} · placa ${viaje.placa}):`
      if (navigator.share) {
        try { await navigator.share({ title: 'Mi viaje en SafO', text: texto, url: enlace }); return } catch (e) { if (e?.name === 'AbortError') return }
      }
      try { await navigator.clipboard.writeText(`${texto} ${enlace}`); toast.success('Enlace copiado. Pégalo en WhatsApp para compartirlo.') }
      catch { window.prompt('Copia este enlace para compartir tu viaje:', enlace) }
    } catch (e) { toast.error(errorDe(e, 'No se pudo generar el enlace')) } finally { setCompartiendo(false) }
  }

  const calificar = async () => {
    if (!porCalificar || !estrellas) return toast.error('Elige de 1 a 5 estrellas')
    try {
      await api.post(`/api/viajes/${porCalificar.id}/calificar`, { estrellas, comentario: comentario.trim() || undefined })
      toast.success('¡Gracias por tu calificación!')
      setEstrellas(0); setComentario('')
      await cargarViaje()
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo enviar la calificación'))
    }
  }

  const guardarNombre = async () => {
    setGuardando(true)
    try {
      const { data } = await api.put('/api/cuenta/perfil', { nombre: nombreEdit })
      localStorage.setItem('safo_usuario', JSON.stringify(data.usuario))
      setSesion(data.usuario)
      toast.success('Nombre actualizado')
    } catch (e) { toast.error(errorDe(e, 'No se pudo guardar el nombre')) } finally { setGuardando(false) }
  }

  const cambiarClave = async () => {
    if (claves.nueva.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres')
    if (claves.nueva !== claves.repetir) return toast.error('Las contraseñas nuevas no coinciden')
    setGuardando(true)
    try {
      await api.put('/api/cuenta/clave', { actual: claves.actual, nueva: claves.nueva })
      toast.success('Contraseña actualizada')
      setClaves({ actual: '', nueva: '', repetir: '' })
    } catch (e) { toast.error(errorDe(e, 'No se pudo cambiar la contraseña')) } finally { setGuardando(false) }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('safo_token')
    localStorage.removeItem('safo_usuario')
    router.push('/login')
  }

  // ═════════ Pantallas previas al panel ═════════
  if (sesion === undefined) return (
    <div className="min-h-screen bg-white flex items-center justify-center"><SafoLogo size={72} /></div>
  )

  if (sesion === null) return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F8FF] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8"><SafoLogo size={88} priority /></div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#14213D] mb-3">Pide tu taxi seguro en Huánuco</h1>
        <p className="text-[#6E6E73] mb-9">Entra a tu cuenta o crea una gratis para ver los taxis que tienes cerca.</p>
        <div className="space-y-3">
          <button onClick={() => router.push('/login')}
            className="w-full py-4 rounded-2xl font-semibold text-white text-lg bg-[#0A66E0] hover:bg-[#084FB0] transition">
            <FontAwesomeIcon icon={faRightToBracket} className="mr-2.5" />Iniciar sesión
          </button>
          <button onClick={() => router.push('/registro/pasajero')}
            className="w-full py-4 rounded-2xl font-semibold text-[#0A66E0] text-lg bg-white border-2 border-[#0A66E0] hover:bg-[#EAF2FE] transition">
            <FontAwesomeIcon icon={faUserPlus} className="mr-2.5" />Crear cuenta gratis
          </button>
        </div>
        <p className="text-xs text-[#A1A1A6] mt-8">Registro gratis · pide tu taxi cuando quieras</p>
        <button onClick={() => router.push('/')} className="text-xs text-[#6E6E73] hover:text-[#0A66E0] mt-3">Volver al inicio</button>
      </div>
    </div>
  )

  const conductorViaje = viaje ? { lat: viaje.lat_actual, lng: viaje.lng_actual, nombre: viaje.conductor_nombre } : null
  const paso = viaje ? Math.max(PASOS.indexOf(viaje.estado === 'en_camino' ? 'aceptado' : viaje.estado), 0) : 0
  const puedeCancelar = viaje && ['solicitado', 'aceptado', 'en_camino'].includes(viaje.estado)
  const despachado = viaje && ['aceptado', 'en_camino'].includes(viaje.estado)
  const segundosRestantes = finSolicitud ? Math.max(0, Math.round((finSolicitud - ahora) / 1000)) : null
  const planificando = !viaje && !porCalificar
  const etiquetas = (() => {
    if (conductores.length === 0) return {}
    const dist = (c) => Number(c.distancia_km)
    const cal = (c) => Number(c.calificacion_prom || 0)
    const puntaje = (c) => cal(c) * 2 - dist(c)
    const masCerca = [...conductores].sort((a, b) => dist(a) - dist(b))[0]
    const mejor = [...conductores].sort((a, b) => cal(b) - cal(a) || (b.total_viajes || 0) - (a.total_viajes || 0))[0]
    const recomendado = [...conductores].sort((a, b) => puntaje(b) - puntaje(a))[0]
    const r = {}
    const poner = (c, k) => { r[c.id] = [...(r[c.id] || []), k] }
    if (conductores.length > 1) poner(recomendado, 'recomendado')
    poner(masCerca, 'cercano')
    if (cal(mejor) > 0 && conductores.length > 1) poner(mejor, 'calificacion')
    return r
  })()
  const conductoresOrdenados = [...conductores].sort((a, b) => {
    if (orden === 'cercano') return Number(a.distancia_km) - Number(b.distancia_km)
    if (orden === 'calificacion') return Number(b.calificacion_prom || 0) - Number(a.calificacion_prom || 0) || (b.total_viajes || 0) - (a.total_viajes || 0)
    return (Number(b.calificacion_prom || 0) * 2 - Number(b.distancia_km)) - (Number(a.calificacion_prom || 0) * 2 - Number(a.distancia_km))
  })
  const fueraDeZona = !!cotizacion && cotizacion.en_zona === false
  const posConductor = viaje ? coord(viaje.lat_actual, viaje.lng_actual) : null
  const kmConductor = posConductor && origenViaje && ['aceptado', 'en_camino'].includes(viaje?.estado) ? distanciaKm(posConductor, origenViaje) : null

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#14213D]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1D1D1F', color: 'white' } }} />

      {/* Permiso de ubicación (previo al aviso del navegador) */}
      {modalPermiso && permiso !== 'concedido' && (
        <div className="fixed inset-0 z-[1000] bg-[#14213D]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-permiso">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#EAF2FE] flex items-center justify-center mb-5 mx-auto">
              <FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] text-3xl" />
            </div>
            <h2 id="titulo-permiso" className="text-xl font-semibold text-center mb-2">SafO quiere acceder a tu ubicación</h2>
            <p className="text-sm text-[#6E6E73] text-center mb-5">Al pulsar «Permitir», tu navegador te pedirá confirmar. La usamos solo mientras tengas SafO abierto para:</p>
            <ul className="space-y-2.5 text-sm mb-6">
              <li className="flex gap-3"><FontAwesomeIcon icon={faTaxi} className="text-[#0A66E0] mt-0.5" />Mostrarte los taxis disponibles cerca de ti</li>
              <li className="flex gap-3"><FontAwesomeIcon icon={faBullseye} className="text-[#0A66E0] mt-0.5" />Que el conductor te encuentre en el punto exacto</li>
              <li className="flex gap-3"><FontAwesomeIcon icon={faShieldHalved} className="text-[#0A66E0] mt-0.5" />Seguir tu viaje y cuidar tu seguridad</li>
            </ul>
            <button onClick={pedirUbicacion} disabled={pidiendoGps}
              className="w-full py-3.5 rounded-2xl font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-60 transition">
              <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" />{pidiendoGps ? 'Esperando tu permiso…' : 'Permitir ubicación'}
            </button>
            <button onClick={() => setModalPermiso(false)} className="w-full py-3 text-sm text-[#6E6E73] hover:text-[#1D1D1F] mt-1">Ahora no, elegiré el punto en el mapa</button>
          </div>
        </div>
      )}

      {/* Barra superior */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#E2E2E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <SafoLogo size={60} priority />
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0 hidden sm:block">
              <div className="text-sm font-semibold truncate">{sesion.nombre}</div>
              <div className="text-xs text-[#6E6E73]"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1" />+51 {sesion.celular}</div>
            </div>
            <Avatar nombre={sesion.nombre} tam={40} />
            <button onClick={cerrarSesion} aria-label="Cerrar sesión"
              className="flex items-center gap-2 px-3.5 py-2 text-sm text-[#D92D20] hover:bg-[#FCEAE9] rounded-full transition">
              <FontAwesomeIcon icon={faRightFromBracket} /><span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 pb-2 overflow-x-auto">
          {[
            { k: 'pedir', t: 'Pedir taxi', i: faTaxi },
            { k: 'viajes', t: 'Mis viajes', i: faRoute },
            { k: 'pagos', t: 'Pagos y garantía', i: faWallet },
            { k: 'ayuda', t: 'Ayuda y reclamos', i: faHeadset },
            { k: 'cuenta', t: 'Mi cuenta', i: faUser },
          ].map((x) => (
            <button key={x.k} onClick={() => setTab(x.k)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition ${tab === x.k ? 'text-[#0A66E0] bg-[#EAF2FE]' : 'text-[#6E6E73] hover:bg-[#F5F5F7]'}`}>
              <FontAwesomeIcon icon={x.i} className="mr-2 text-xs" />{x.t}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">

        {/* ═════════ PEDIR TAXI ═════════ */}
        {tab === 'pedir' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Mapa */}
            <section className="lg:col-span-3 order-1 min-w-0">
              <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-[0_20px_50px_-30px_rgba(20,33,61,.35)]">
                <MapaPasajero
                  className="h-[340px] sm:h-[460px] lg:h-[600px] w-full"
                  centro={origenMapa}
                  destino={destinoMapa}
                  ruta={ruta?.puntos || null}
                  conductores={viaje ? [] : conductores}
                  seleccionadoId={seleccionado}
                  onSeleccionar={setSeleccionado}
                  onMover={viaje ? undefined : moverPin}
                  onMoverDestino={viaje ? undefined : elegirDestinoEnMapa}
                  modoDestino={modoDestino && !viaje}
                  radioKm={RADIO_KM}
                  zonas={zonas}
                  conductorViaje={conductorViaje}
                  ajustarKey={ajustarKey}
                />
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none" style={{ zIndex: 500 }}>
                  <div className="rounded-xl bg-white/95 backdrop-blur border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#4B5873] max-w-[75%]">
                    {modoDestino
                      ? <><FontAwesomeIcon icon={faFlagCheckered} className="text-[#14213D] mr-1.5" />Toca el mapa para marcar tu destino</>
                      : permiso === 'concedido' && siguiendo
                        ? <><FontAwesomeIcon icon={faLocationDot} className="text-[#1D1D1F] mr-1.5" />Usando tu ubicación{precision ? ` · ±${precision} m` : ''}</>
                        : <><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mr-1.5" />Arrastra el pin azul o toca el mapa para elegir dónde te recogen</>}
                  </div>
                  <button onClick={centrarEnMi} aria-label="Ir a mi ubicación"
                    className="pointer-events-auto rounded-xl bg-white border border-[#E2E8F0] w-10 h-10 flex items-center justify-center text-[#0A66E0] hover:bg-[#EAF2FE] shadow-sm">
                    <FontAwesomeIcon icon={faLocationCrosshairs} />
                  </button>
                </div>
                {viaje && viaje.estado !== 'solicitado' && (
                  <div className="absolute left-3 bottom-3" style={{ zIndex: 500 }}><BotonSOS posicion={gpsRef.current || pos} /></div>
                )}
              </div>
              {permiso === 'denegado' && (
                <div className="mt-3 rounded-2xl bg-[#FEF3E2] border border-[#F5D9A8] p-4 text-sm text-[#8a4a07]">
                  <FontAwesomeIcon icon={faLock} className="mr-2" />
                  <b>La ubicación está bloqueada.</b> Para ver los taxis cerca de ti, toca el candado junto a la dirección del sitio → <i>Permisos</i> → <i>Ubicación</i> → <i>Permitir</i>, y recarga la página. Mientras tanto puedes buscar una dirección o mover el pin.
                </div>
              )}
              {permiso === 'desconocido' && !modalPermiso && (
                <button onClick={() => setModalPermiso(true)} className="mt-3 w-full rounded-2xl bg-[#EAF2FE] text-[#0A66E0] font-semibold text-sm py-3 hover:bg-[#dbe9fd] transition">
                  <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" />Activar mi ubicación para ver taxis cerca
                </button>
              )}
            </section>

            {/* Panel lateral */}
            <section className="lg:col-span-2 order-2 min-w-0 space-y-4 relative z-[600] -mt-8 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-[#F6F8FB] lg:bg-transparent pt-3 lg:pt-0 shadow-[0_-12px_30px_-18px_rgba(20,33,61,.45)] lg:shadow-none">
              <div className="lg:hidden mx-auto w-11 h-1.5 rounded-full bg-[#D2D2D7]" aria-hidden="true" />

              {/* Calificar viaje terminado */}
              {!viaje && porCalificar && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <div className="flex items-center gap-2 text-[#1D1D1F] font-semibold mb-1">
                    <FontAwesomeIcon icon={faCircleCheck} />Viaje completado
                  </div>
                  <p className="text-sm text-[#6E6E73] mb-4">¿Cómo te fue con {porCalificar.conductor_nombre}?</p>
                  <div className="flex gap-1.5 mb-4" role="radiogroup" aria-label="Calificación">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setEstrellas(n)} aria-label={`${n} estrellas`}
                        className={`text-3xl transition ${n <= estrellas ? 'text-[#FFC21A]' : 'text-[#D2D2D7] hover:text-[#FFC21A]/60'}`}>
                        <FontAwesomeIcon icon={faStar} />
                      </button>
                    ))}
                  </div>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} maxLength={300}
                    placeholder="Comentario (opcional)"
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-3" />
                  <button onClick={calificar} disabled={!estrellas}
                    className="w-full py-3 rounded-2xl font-semibold text-white bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-40 transition">
                    Enviar calificación
                  </button>
                </div>
              )}

              {/* Dónde te recogemos / a dónde vas */}
              {planificando && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <h2 className="font-semibold text-lg mb-3">¿A dónde vamos?</h2>
                  <div className="space-y-2.5">
                    <CampoLugar
                      valor={origenTxt} icono={faLocationDot} colorIcono="#0A66E0" placeholder="Punto de recojo"
                      onTexto={setOrigenTxt}
                      onElegir={(r) => { saltarGeocode.current = true; setOrigenTxt(r.nombre + (r.detalle ? `, ${r.detalle.split(',')[0]}` : '')); setSiguiendo(false); setPos([r.lat, r.lng]); setAjustarKey((k) => k + 1) }}
                    />
                    <CampoLugar
                      valor={destinoTxt} icono={faFlagCheckered} colorIcono="#14213D" placeholder="¿A dónde vas? (opcional)"
                      onTexto={(t) => { setDestinoTxt(t); if (!t) { setDestino(null); setRuta(null) } }}
                      onElegir={(r) => { setDestinoTxt(r.nombre + (r.detalle ? `, ${r.detalle.split(',')[0]}` : '')); setDestino([r.lat, r.lng]) }}
                      onLimpiar={quitarDestino}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                    <button onClick={() => setModoDestino((m) => !m)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-full transition ${modoDestino ? 'bg-[#14213D] text-white' : 'text-[#0A66E0] bg-[#EAF2FE] hover:bg-[#dbe9fd]'}`}>
                      <FontAwesomeIcon icon={faMapPin} className="mr-1.5" />{modoDestino ? 'Toca el mapa…' : 'Elegir destino en el mapa'}
                    </button>
                    {ruta && (
                      <span className="text-sm text-[#4B5873]">
                        <FontAwesomeIcon icon={faRoute} className="mr-1.5 text-[#0A66E0]" />{ruta.km.toFixed(1)} km · ~{ruta.min} min{ruta.aproximada ? ' (aprox.)' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Tarifa estimada */}
              {planificando && (
                <div className="rounded-3xl bg-[#14213D] text-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Tarifa estimada</div>
                      {cotizacion ? (
                        <div className="text-4xl font-bold mt-1">{soles(cotizacion.tarifa)}</div>
                      ) : cotizando ? (
                        <div className="text-lg mt-2 text-white/70"><FontAwesomeIcon icon={faRotate} className="animate-spin mr-2" />Calculando…</div>
                      ) : (
                        <div className="text-base mt-2 text-white/70">Indica tu destino para ver cuánto cuesta.</div>
                      )}
                    </div>
                    {cotizacion && (
                      <div className="text-right text-sm text-white/80">
                        <div><FontAwesomeIcon icon={faRoute} className="mr-1.5 text-[#FFC21A]" />{Number(cotizacion.distancia_km).toFixed(1)} km</div>
                        <div><FontAwesomeIcon icon={faClock} className="mr-1.5 text-[#FFC21A]" />~{cotizacion.duracion_min} min</div>
                      </div>
                    )}
                  </div>
                  {cotizacion && (
                    <>
                      <p className="text-xs text-white/60 mt-2">Se paga en efectivo al conductor al terminar el viaje. El precio final puede variar un poco según el recorrido.</p>
                      <button onClick={() => setVerDesglose((v) => !v)} className="text-xs font-semibold text-[#FFC21A] mt-2">{verDesglose ? 'Ocultar desglose' : 'Ver desglose'}</button>
                      {verDesglose && (
                        <ul className="mt-2 text-sm space-y-1 text-white/85">
                          <li className="flex justify-between"><span>Tarifa base</span><span>{soles(cotizacion.desglose?.base)}</span></li>
                          <li className="flex justify-between"><span>Por distancia</span><span>{soles(cotizacion.desglose?.por_km)}</span></li>
                          <li className="flex justify-between"><span>Por tiempo</span><span>{soles(cotizacion.desglose?.por_tiempo)}</span></li>
                          {cotizacion.desglose?.minima_aplicada && <li className="text-xs text-[#FFC21A]">Se aplicó la tarifa mínima.</li>}
                        </ul>
                      )}
                    </>
                  )}
                  {fueraDeZona && (
                    <div className="mt-3 rounded-xl bg-[#D92D20] text-white text-sm p-3">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />Tu punto de recojo está fuera de la zona de servicio de SafO. Mueve el pin hacia el área punteada en verde.
                    </div>
                  )}
                </div>
              )}

              {/* Viaje en curso */}
              {viaje && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="font-semibold text-lg">Tu viaje</h2>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ color: ESTADO_VIAJE[viaje.estado]?.c, background: ESTADO_VIAJE[viaje.estado]?.bg }}>
                      {ESTADO_VIAJE[viaje.estado]?.t}
                    </span>
                  </div>

                  <ol className="flex items-center gap-1.5 mb-4" aria-label="Progreso del viaje">
                    {['Solicitado', 'Aceptado', 'En viaje', 'Llegaste'].map((t, i) => (
                      <li key={t} className="flex-1">
                        <div className={`h-1.5 rounded-full ${i <= paso ? 'bg-[#0A66E0]' : 'bg-[#E2E2E7]'}`} />
                        <div className={`text-[10px] mt-1.5 ${i <= paso ? 'text-[#0A66E0] font-semibold' : 'text-[#A1A1A6]'}`}>{t}</div>
                      </li>
                    ))}
                  </ol>

                  {viaje.estado === 'solicitado' && segundosRestantes !== null && (
                    <div className="mb-4 p-3 rounded-xl bg-[#FEF3E2] text-sm text-[#8a4a07] flex items-center gap-2.5">
                      <FontAwesomeIcon icon={faClock} className="animate-pulse" />
                      <span>{viaje.conductor_nombre.split(' ')[0]} tiene <b>{mmss(segundosRestantes)}</b> para responder. Si no responde, te devolvemos tu garantía.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <Avatar nombre={viaje.conductor_nombre} tam={52} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{viaje.conductor_nombre}</div>
                      <div className="text-sm flex items-center gap-3 text-[#6E6E73]">
                        <Estrellas valor={viaje.calificacion_prom} /><span>{viaje.total_viajes || 0} viajes</span>
                      </div>
                    </div>
                  </div>
                  <DatosVehiculo c={viaje} />

                  {kmConductor !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-[#EAF2FE] text-sm text-[#0A66E0] font-medium">
                      <FontAwesomeIcon icon={faTaxi} className="mr-2" />Tu conductor llega en ~{minutosA(kmConductor)} min · a {kmConductor.toFixed(1)} km
                    </div>
                  )}
                  {viaje.tarifa_estimada && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[#6E6E73]">Tarifa estimada (efectivo)</span>
                      <b className="text-lg">{soles(viaje.tarifa_estimada)}</b>
                    </div>
                  )}

                  {viaje.conductor_celular && (
                    <a href={`tel:+51${viaje.conductor_celular}`}
                      className="mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F1F1F3] text-[#1D1D1F] font-semibold hover:bg-[#E4E4E8] transition">
                      <FontAwesomeIcon icon={faPhone} />Llamar al conductor · +51 {viaje.conductor_celular}
                    </a>
                  )}

                  <button onClick={compartirViaje} disabled={compartiendo}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F5F5F7] text-[#14213D] font-semibold hover:bg-[#E8E8ED] transition disabled:opacity-60">
                    <FontAwesomeIcon icon={faShareNodes} />{compartiendo ? 'Generando enlace…' : 'Compartir mi viaje'}
                  </button>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-2"><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mt-1" /><span>{viaje.direccion_origen || 'Punto de recojo'}</span></div>
                    {viaje.direccion_destino && <div className="flex gap-2"><FontAwesomeIcon icon={faFlagCheckered} className="text-[#6E6E73] mt-1" /><span>{viaje.direccion_destino}{ruta ? ` · ${ruta.km.toFixed(1)} km · ~${ruta.min} min` : ''}</span></div>}
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-[#F5F5F7] text-sm flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{soles(viaje.monto_total)} de garantía · {String(viaje.metodo_pago || '').toUpperCase()}</div>
                      <div className="text-xs text-[#6E6E73]">Operación {viaje.referencia_pago}</div>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: ESTADO_PAGO[viaje.pago_estado]?.c }}>{ESTADO_PAGO[viaje.pago_estado]?.t}</span>
                  </div>

                  {puedeCancelar && !confirmarCancelar && (
                    <button onClick={() => setConfirmarCancelar(true)}
                      className="mt-4 w-full py-3 rounded-2xl text-[#D92D20] font-semibold hover:bg-[#FCEAE9] transition">
                      Cancelar viaje
                    </button>
                  )}
                  {puedeCancelar && confirmarCancelar && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FEF3E2] text-sm">
                      <p className="text-[#8a4a07] mb-3">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />
                        {despachado
                          ? `El conductor ya va hacia ti: si cancelas se retiene tu garantía de ${soles(GARANTIA)} (${soles(ajustes.compensacion_conductor)} para el conductor).`
                          : `Aún no sale el conductor: si cancelas te devolvemos tus ${soles(GARANTIA)}.`}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={cancelarViaje} className="flex-1 py-2.5 rounded-xl bg-[#D92D20] text-white font-semibold">Sí, cancelar</button>
                        <button onClick={() => setConfirmarCancelar(false)} className="flex-1 py-2.5 rounded-xl bg-white border border-[#E2E2E7] font-semibold">Seguir</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conductores cercanos */}
              {planificando && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-lg">Elige tu taxi</h2>
                    <button onClick={() => { setCargando(true); cargarConductores() }} aria-label="Actualizar"
                      className="text-[#0A66E0] text-sm font-medium hover:underline"><FontAwesomeIcon icon={faRotate} className="mr-1.5" />Actualizar</button>
                  </div>
                  <p className="text-xs text-[#6E6E73] mb-4">
                    {cargando ? 'Buscando conductores… la primera vez puede tardar hasta un minuto.' : `${conductores.length} disponible${conductores.length === 1 ? '' : 's'} en ${RADIO_KM} km a la redonda`}
                  </p>

                  {!cargando && conductores.length === 0 && (
                    <div className="text-center py-8 text-[#6E6E73]">
                      <FontAwesomeIcon icon={faTaxi} className="text-4xl text-[#D2D2D7] mb-3" />
                      <div className="font-medium text-[#1D1D1F]">No hay conductores disponibles ahora</div>
                      <div className="text-sm mt-1">Prueba mover el pin o vuelve a intentar en unos minutos.</div>
                    </div>
                  )}

                  {conductores.length > 1 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1" role="radiogroup" aria-label="Ordenar taxis">
                      {ORDENES.map((o) => (
                        <button key={o.k} onClick={() => setOrden(o.k)} role="radio" aria-checked={orden === o.k}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${orden === o.k ? 'bg-[#14213D] text-white border-[#14213D]' : 'bg-white text-[#4B5873] border-[#E2E2E7] hover:border-[#B8D2F7]'}`}>
                          <FontAwesomeIcon icon={o.i} className="mr-1.5" />{o.t}
                        </button>
                      ))}
                    </div>
                  )}

                  <ul className="space-y-2.5">
                    {conductoresOrdenados.map((c) => {
                      const sel = c.id === seleccionado
                      const marcas = (etiquetas[c.id] || []).map((k) => ORDENES.find((o) => o.k === k)).filter(Boolean)
                      return (
                        <li key={c.id}>
                          <button onClick={() => setSeleccionado(sel ? null : c.id)} aria-pressed={sel}
                            className={`w-full text-left rounded-2xl border p-4 transition ${sel ? 'border-[#0A66E0] bg-[#F3F8FF] ring-2 ring-[#0A66E0]/20' : 'border-[#E2E2E7] hover:border-[#B8D2F7]'}`}>
                            <div className="flex items-center gap-3">
                              <Avatar nombre={c.nombre} />
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold truncate">{c.nombre}</div>
                                <div className="text-xs flex items-center gap-3 text-[#6E6E73] mt-0.5">
                                  <Estrellas valor={c.calificacion_prom} />
                                  <span>{c.total_viajes || 0} viajes</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {cotizacion && <div className="font-bold text-[#14213D]">{soles(cotizacion.tarifa)}</div>}
                                <div className="text-xs font-semibold text-[#0A66E0]">{minutosA(c.distancia_km)} min · {Number(c.distancia_km).toFixed(1)} km</div>
                              </div>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                              <DatosVehiculo c={c} />
                              {marcas.length > 0 && <span className="flex gap-1.5 flex-wrap">{marcas.map((m) => <span key={m.k} className="px-2 py-0.5 rounded-full bg-[#F1F1F3] text-[#1D1D1F] text-[11px] font-semibold"><FontAwesomeIcon icon={m.i} className="mr-1" />{m.t}</span>)}</span>}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Pedir con pago */}
              {planificando && elegido && (
                <div ref={panelPedido} className="rounded-3xl bg-white border-2 border-[#0A66E0] p-5 scroll-mt-32">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Pedir con {elegido.nombre.split(' ')[0]}</h2>
                    <button onClick={() => setSeleccionado(null)} aria-label="Cerrar" className="text-[#A1A1A6] hover:text-[#1D1D1F]"><FontAwesomeIcon icon={faXmark} /></button>
                  </div>

                  <div className="text-sm space-y-1.5 mb-4 p-3.5 rounded-xl bg-[#F5F5F7]">
                    <div className="flex gap-2"><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mt-1" /><span>{origenTxt || 'Mi ubicación actual'}</span></div>
                    {destinoTxt && <div className="flex gap-2"><FontAwesomeIcon icon={faFlagCheckered} className="text-[#14213D] mt-1" /><span>{destinoTxt}</span></div>}
                  </div>

                  <div className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2">
                    <FontAwesomeIcon icon={faWallet} className="mr-1.5" />Paga tu garantía de {soles(GARANTIA)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3" role="radiogroup" aria-label="Método de pago">
                    {[{ k: 'yape', t: 'Yape', c: '#742284' }, { k: 'plin', t: 'Plin', c: '#00A8E8' }].map((m) => (
                      <button key={m.k} onClick={() => setPago({ ...pago, metodo: m.k })} role="radio" aria-checked={pago.metodo === m.k}
                        className={`py-3 rounded-xl border-2 font-semibold transition ${pago.metodo === m.k ? 'bg-white' : 'border-[#E2E2E7] text-[#6E6E73] hover:border-[#C7D6EA]'}`}
                        style={pago.metodo === m.k ? { borderColor: m.c, color: m.c } : undefined}>
                        {pago.metodo === m.k && <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />}{m.t}
                      </button>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F8FF] text-sm text-[#4B5873] mb-3">
                    <FontAwesomeIcon icon={faCircleInfo} className="mr-1.5 text-[#0A66E0]" />
                    {NUMERO_PAGO[pago.metodo]
                      ? <>Envía <b>{soles(GARANTIA)}</b> por {pago.metodo === 'yape' ? 'Yape' : 'Plin'} al <b className="text-[#14213D]">{NUMERO_PAGO[pago.metodo]}</b> (SafO) y escribe aquí el código de operación.</>
                      : <>Envía <b>{soles(GARANTIA)}</b> por {pago.metodo === 'yape' ? 'Yape' : 'Plin'} al número de SafO y escribe aquí el código de operación.</>}
                  </div>
                  <input value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} maxLength={40}
                    placeholder="Código de operación" aria-label="Código de operación"
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-3" />

                  <p className="text-xs text-[#6E6E73] mb-4 leading-relaxed">
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-1.5 text-[#1D1D1F]" />
                    Si cancelas antes de que el conductor salga, te devolvemos los {soles(GARANTIA)}. Si ya salió, {soles(ajustes.compensacion_conductor)} es para el conductor y {soles(ajustes.compensacion_plataforma)} para SafO.
                  </p>

                  {cotizacion && (
                    <div className="flex items-center justify-between text-sm mb-3 px-1">
                      <span className="text-[#6E6E73]">Tarifa estimada (se paga en efectivo)</span><b className="text-lg">{soles(cotizacion.tarifa)}</b>
                    </div>
                  )}
                  <button onClick={pedirTaxi} disabled={enviando || fueraDeZona}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-lg bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-50 transition">
                    <FontAwesomeIcon icon={faTaxi} className="mr-2.5" />{enviando ? 'Solicitando…' : fueraDeZona ? 'Fuera de la zona de servicio' : `Pedir ${elegido.nombre.split(' ')[0]}`}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═════════ MIS VIAJES ═════════ */}
        {tab === 'viajes' && (
          <section className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold mb-4">Mis viajes</h1>
            {historial.length === 0 ? (
              <div className="rounded-3xl bg-white border border-[#E2E8F0] p-10 text-center text-[#6E6E73]">
                <FontAwesomeIcon icon={faRoute} className="text-4xl text-[#D2D2D7] mb-3" />
                <div className="font-medium text-[#1D1D1F]">Aún no tienes viajes</div>
                <div className="text-sm mt-1">Tus viajes aparecerán aquí.</div>
              </div>
            ) : (
              <ul className="space-y-3">
                {historial.map((v) => (
                  <li key={v.id} className="rounded-2xl bg-white border border-[#E2E8F0] p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ color: ESTADO_VIAJE[v.estado]?.c, background: ESTADO_VIAJE[v.estado]?.bg }}>{ESTADO_VIAJE[v.estado]?.t || v.estado}</span>
                      <span className="text-xs text-[#6E6E73]">{fecha(v.solicitado_en)}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mr-2" />{v.direccion_origen || 'Punto de recojo'}</div>
                      {v.direccion_destino && <div><FontAwesomeIcon icon={faFlagCheckered} className="text-[#6E6E73] mr-2" />{v.direccion_destino}</div>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F0F0F3] flex items-center justify-between text-sm">
                      <span className="text-[#6E6E73]"><FontAwesomeIcon icon={faTaxi} className="mr-1.5" />{v.conductor_nombre} · {v.placa}</span>
                      <span className="font-semibold">{v.tarifa_estimada ? `${soles(v.tarifa_estimada)} · ` : ''}<span className="text-xs font-normal text-[#6E6E73]">garantía {soles(v.monto_total)}</span></span>
                    </div>
                    {v.distancia_km && <div className="text-xs text-[#6E6E73] mt-1">{Number(v.distancia_km).toFixed(1)} km · ~{v.duracion_min} min</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ═════════ PAGOS Y GARANTÍA ═════════ */}
        {tab === 'pagos' && (
          <section className="max-w-3xl mx-auto space-y-5">
            <h1 className="text-2xl font-semibold">Pagos y garantía</h1>

            <div className="rounded-3xl bg-[#072A7A] text-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[#FFC21A] text-xl" />
                <h2 className="font-semibold text-lg">Cómo funciona tu garantía de {soles(GARANTIA)}</h2>
              </div>
              <ul className="space-y-2 text-sm text-[#CFE0FF] leading-relaxed">
                <li><FontAwesomeIcon icon={faCoins} className="mr-2 text-[#FFC21A]" />Pagas {soles(GARANTIA)} por <b className="text-white">Yape</b> o <b className="text-white">Plin</b> al pedir tu taxi. No hay costo de registro.</li>
                <li><FontAwesomeIcon icon={faCircleCheck} className="mr-2 text-[#FFC21A]" />Si cancelas antes de que el conductor salga, <b className="text-white">te lo devolvemos completo</b>.</li>
                <li><FontAwesomeIcon icon={faHourglassHalf} className="mr-2 text-[#FFC21A]" />Si el conductor no responde en unos minutos, la solicitud se cancela y <b className="text-white">se te devuelve</b>.</li>
                <li><FontAwesomeIcon icon={faHourglassHalf} className="mr-2 text-[#FFC21A]" />Si el conductor ya salió y cancelas, {soles(ajustes.compensacion_conductor)} es para él y {soles(ajustes.compensacion_plataforma)} para SafO.</li>
                <li><FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-[#FFC21A]" />Con 3 cancelaciones tardías en el mes, tu cuenta se suspende.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold mb-3"><FontAwesomeIcon icon={faReceipt} className="mr-2 text-[#0A66E0]" />Mis pagos</h2>
              {historial.length === 0 ? (
                <div className="rounded-2xl bg-white border border-[#E2E8F0] p-8 text-center text-sm text-[#6E6E73]">Todavía no has hecho pagos.</div>
              ) : (
                <ul className="space-y-2.5">
                  {historial.map((v) => (
                    <li key={v.id} className="rounded-2xl bg-white border border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{soles(v.monto_total)} · {String(v.metodo_pago || '').toUpperCase()}</div>
                        <div className="text-xs text-[#6E6E73] truncate">Operación {v.referencia_pago} · {fecha(v.solicitado_en)}</div>
                      </div>
                      <span className="text-xs font-semibold text-right shrink-0" style={{ color: ESTADO_PAGO[v.pago_estado]?.c }}>{ESTADO_PAGO[v.pago_estado]?.t || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ═════════ AYUDA Y RECLAMOS ═════════ */}
        {tab === 'ayuda' && (
          <section className="max-w-xl mx-auto space-y-5">
            <h1 className="text-2xl font-semibold">Ayuda y reclamos</h1>
            <div className="rounded-3xl bg-[#FCEAE9] border border-[#F5C6C2] p-5 text-sm text-[#7A1F17]">
              <div className="font-semibold mb-1"><FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />¿Emergencia?</div>
              Durante un viaje verás el botón rojo <b>SOS</b> sobre el mapa. También puedes llamar directo a la Policía al <a href="tel:105" className="font-bold underline">105</a>.
            </div>
            <ReclamosPanel viajes={historial.slice(0, 15).map((v) => ({ id: v.id, texto: `${fecha(v.solicitado_en)} · ${v.conductor_nombre || 'Viaje'}${v.placa ? ` (${v.placa})` : ''}` }))} />
          </section>
        )}

        {/* ═════════ MI CUENTA ═════════ */}
        {tab === 'cuenta' && (
          <section className="max-w-xl mx-auto space-y-5">
            <h1 className="text-2xl font-semibold">Mi cuenta</h1>

            <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-4 mb-5">
                <Avatar nombre={sesion.nombre} tam={56} />
                <div>
                  <div className="font-semibold">{sesion.nombre}</div>
                  <div className="text-sm text-[#6E6E73]"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1.5" />+51 {sesion.celular}</div>
                </div>
              </div>
              <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-1.5 block">Nombre</label>
              <input value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-3" />
              <button onClick={guardarNombre} disabled={guardando || nombreEdit.trim() === sesion.nombre}
                className="px-6 py-2.5 rounded-full font-semibold text-white text-sm bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-40 transition">Guardar nombre</button>
            </div>

            <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 space-y-3">
              <h2 className="font-semibold"><FontAwesomeIcon icon={faKey} className="mr-2 text-[#0A66E0]" />Cambiar contraseña</h2>
              <ClaveInput value={claves.actual} onChange={(v) => setClaves({ ...claves, actual: v })} placeholder="Contraseña actual" />
              <ClaveInput value={claves.nueva} onChange={(v) => setClaves({ ...claves, nueva: v })} placeholder="Nueva contraseña (mín. 6)" autoComplete="new-password" />
              <ClaveInput value={claves.repetir} onChange={(v) => setClaves({ ...claves, repetir: v })} placeholder="Repite la nueva contraseña" autoComplete="new-password" onEnter={cambiarClave} />
              <button onClick={cambiarClave} disabled={guardando}
                className="px-6 py-2.5 rounded-full font-semibold text-white text-sm bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-40 transition">Actualizar contraseña</button>
            </div>

            <button onClick={cerrarSesion} className="w-full py-3 rounded-2xl text-[#D92D20] font-semibold hover:bg-[#FCEAE9] transition">
              <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" />Cerrar sesión
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
