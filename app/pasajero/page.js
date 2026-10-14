'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTaxi, faStar, faLocationCrosshairs, faLocationDot, faFlagCheckered, faPhone, faShieldHalved,
  faRightFromBracket, faMobileScreenButton, faCircleCheck, faHourglassHalf, faRotate, faXmark,
  faRoute, faWallet, faCarSide, faReceipt, faCircleInfo, faCoins, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import SafoLogo from '@/components/SafoLogo'
import MapaPasajero from '@/components/MapaPasajero'
import { PLAZA } from '@/components/MapaHuanuco'

const RADIO_KM = 5
const GARANTIA = 1.5
// Números de SafO que reciben la garantía. Se configuran en Render/.env del web:
// NEXT_PUBLIC_PAGO_YAPE y NEXT_PUBLIC_PAGO_PLIN
const NUMERO_PAGO = { yape: process.env.NEXT_PUBLIC_PAGO_YAPE || '', plin: process.env.NEXT_PUBLIC_PAGO_PLIN || '' }

const ESTADO_VIAJE = {
  solicitado: { t: 'Esperando al conductor', c: '#B45309', bg: '#FEF3E2' },
  aceptado: { t: 'El conductor va hacia ti', c: '#0A66E0', bg: '#EAF2FE' },
  en_camino: { t: 'Conductor en camino', c: '#0A66E0', bg: '#EAF2FE' },
  recogido: { t: 'Viaje en curso', c: '#0A66E0', bg: '#EAF2FE' },
  completado: { t: 'Completado', c: '#1E8E3E', bg: '#E8F5EA' },
  cancelado_pasajero: { t: 'Cancelado por ti', c: '#6E6E73', bg: '#F5F5F7' },
  cancelado_conductor: { t: 'Cancelado por el conductor', c: '#D92D20', bg: '#FCEAE9' },
  no_show: { t: 'No te encontró', c: '#D92D20', bg: '#FCEAE9' },
}
const ESTADO_PAGO = {
  retenido: { t: 'Garantía retenida', c: '#B45309' },
  liberado_plataforma: { t: 'Viaje realizado', c: '#1E8E3E' },
  devuelto: { t: 'Devuelto a ti', c: '#1E8E3E' },
  compensado_conductor: { t: 'Retenido por cancelación', c: '#D92D20' },
}
const PASOS = ['solicitado', 'aceptado', 'recogido', 'completado']

const soles = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`
const fecha = (f) => (f ? new Date(f).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const errorDe = (e, porDefecto) => e?.response?.data?.error || porDefecto

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

export default function PasajeroPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [listo, setListo] = useState(false)
  const [tab, setTab] = useState('pedir')

  const [pos, setPos] = useState(PLAZA)
  const [origenGps, setOrigenGps] = useState(false)
  const [conductores, setConductores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [ajustarKey, setAjustarKey] = useState(0)

  const [viaje, setViaje] = useState(null)
  const [porCalificar, setPorCalificar] = useState(null)
  const [historial, setHistorial] = useState([])

  const [form, setForm] = useState({ origen: 'Mi ubicación actual', destino: '', metodo: 'yape', referencia: '' })
  const panelPedido = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')

  // ── sesión ──
  useEffect(() => {
    let u = null
    try { u = JSON.parse(localStorage.getItem('safo_usuario') || 'null') } catch { u = null }
    if (!localStorage.getItem('safo_token') || !u || u.rol !== 'pasajero') {
      router.replace('/login')
      return
    }
    setUsuario(u)
    setListo(true)
  }, [router])

  // ── ubicación del pasajero ──
  const usarGps = useCallback((avisar = true) => {
    if (!navigator.geolocation) {
      if (avisar) toast('Tu navegador no da la ubicación. Mueve el pin al lugar de recojo.', { icon: 'ℹ️' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude])
        setOrigenGps(true)
        setAjustarKey((k) => k + 1)
      },
      () => { if (avisar) toast('No pudimos usar tu GPS. Mueve el pin al lugar de recojo.', { icon: 'ℹ️' }) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }, [])
  useEffect(() => { if (listo) usarGps(true) }, [listo, usarGps])

  const moverPin = useCallback((p) => {
    setPos(p)
    setOrigenGps(false)
    setForm((f) => (f.origen === 'Mi ubicación actual' ? { ...f, origen: 'Punto elegido en el mapa' } : f))
  }, [])

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

  const cargarViaje = useCallback(async () => {
    try {
      const { data } = await api.get('/api/viajes/mi-viaje')
      setViaje(data.activo)
      setPorCalificar(data.por_calificar)
    } catch { /* se reintenta en el siguiente ciclo */ }
  }, [])

  const cargarHistorial = useCallback(async () => {
    try {
      const { data } = await api.get('/api/viajes/mis-viajes')
      setHistorial(data)
    } catch { /* ignorar */ }
  }, [])

  useEffect(() => { if (listo) { cargarViaje(); cargarHistorial() } }, [listo, cargarViaje, cargarHistorial])
  useEffect(() => {
    if (!listo) return
    const id = setInterval(cargarViaje, 5000)
    return () => clearInterval(id)
  }, [listo, cargarViaje])

  useEffect(() => {
    if (!listo || viaje) return
    cargarConductores()
    const id = setInterval(cargarConductores, 10000)
    return () => clearInterval(id)
  }, [listo, viaje, cargarConductores])

  // cuando termina o se cancela un viaje, refrescar historial
  const idViaje = viaje?.id
  useEffect(() => { if (listo) cargarHistorial() }, [listo, idViaje, porCalificar?.id, cargarHistorial])

  // primera vez que aparecen conductores: ajustar mapa
  const hayConductores = conductores.length > 0
  useEffect(() => { if (hayConductores) setAjustarKey((k) => k + 1) }, [hayConductores])

  const elegido = useMemo(() => conductores.find((c) => c.id === seleccionado) || null, [conductores, seleccionado])

  // al elegir un conductor, llevar la vista al formulario de pedido
  useEffect(() => {
    if (seleccionado && panelPedido.current) panelPedido.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [seleccionado])

  // ── acciones ──
  const pedirTaxi = async () => {
    if (!elegido) return
    if (form.referencia.trim().length < 4) return toast.error('Ingresa el código de operación de tu pago')
    setEnviando(true)
    try {
      await api.post('/api/viajes/solicitar', {
        conductor_id: elegido.id,
        lat_origen: pos[0], lng_origen: pos[1],
        direccion_origen: form.origen.trim() || 'Mi ubicación actual',
        direccion_destino: form.destino.trim() || undefined,
        metodo_pago: form.metodo,
        referencia_pago: form.referencia.trim(),
      })
      toast.success('¡Taxi solicitado! Esperando al conductor')
      setSeleccionado(null)
      setForm((f) => ({ ...f, referencia: '', destino: '' }))
      await cargarViaje()
    } catch (e) {
      toast.error(errorDe(e, 'No se pudo solicitar el taxi'))
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

  const cerrarSesion = () => {
    localStorage.removeItem('safo_token')
    localStorage.removeItem('safo_usuario')
    router.push('/login')
  }

  if (!listo) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <SafoLogo size={64} />
    </div>
  )

  const conductorViaje = viaje ? { lat: viaje.lat_actual, lng: viaje.lng_actual, nombre: viaje.conductor_nombre } : null
  const paso = viaje ? Math.max(PASOS.indexOf(viaje.estado === 'en_camino' ? 'aceptado' : viaje.estado), 0) : 0
  const puedeCancelar = viaje && ['solicitado', 'aceptado', 'en_camino'].includes(viaje.estado)
  const despachado = viaje && ['aceptado', 'en_camino'].includes(viaje.estado)

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#14213D]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1D1D1F', color: 'white' } }} />

      {/* Barra superior */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#E2E2E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <SafoLogo size={60} priority />
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-right min-w-0 hidden sm:block">
              <div className="text-sm font-semibold truncate">{usuario.nombre}</div>
              <div className="text-xs text-[#6E6E73]"><FontAwesomeIcon icon={faMobileScreenButton} className="mr-1" />+51 {usuario.celular}</div>
            </div>
            <Avatar nombre={usuario.nombre} tam={40} />
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
          <div className="grid lg:grid-cols-5 gap-5">

            {/* Mapa */}
            <section className="lg:col-span-3 order-1">
              <div className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] bg-white shadow-[0_20px_50px_-30px_rgba(20,33,61,.35)]">
                <MapaPasajero
                  className="h-[340px] sm:h-[460px] lg:h-[600px] w-full"
                  centro={pos}
                  conductores={viaje ? [] : conductores}
                  seleccionadoId={seleccionado}
                  onSeleccionar={setSeleccionado}
                  onMover={moverPin}
                  radioKm={RADIO_KM}
                  conductorViaje={conductorViaje}
                  ajustarKey={ajustarKey}
                />
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none" style={{ zIndex: 500 }}>
                  <div className="rounded-xl bg-white/95 backdrop-blur border border-[#E2E8F0] px-3.5 py-2 text-xs text-[#4B5873] max-w-[70%]">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mr-1.5" />
                    {origenGps ? 'Usando tu ubicación' : 'Toca el mapa o arrastra el pin azul para elegir dónde te recogen'}
                  </div>
                  <button onClick={() => usarGps(true)} aria-label="Usar mi ubicación"
                    className="pointer-events-auto rounded-xl bg-white border border-[#E2E8F0] w-10 h-10 flex items-center justify-center text-[#0A66E0] hover:bg-[#EAF2FE] shadow-sm">
                    <FontAwesomeIcon icon={faLocationCrosshairs} />
                  </button>
                </div>
              </div>
            </section>

            {/* Panel lateral */}
            <section className="lg:col-span-2 order-2 space-y-4">

              {/* Calificar viaje terminado */}
              {!viaje && porCalificar && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <div className="flex items-center gap-2 text-[#1E8E3E] font-semibold mb-1">
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

                  <ol className="flex items-center gap-1.5 mb-5" aria-label="Progreso del viaje">
                    {['Solicitado', 'Aceptado', 'En viaje', 'Llegaste'].map((t, i) => (
                      <li key={t} className="flex-1">
                        <div className={`h-1.5 rounded-full ${i <= paso ? 'bg-[#0A66E0]' : 'bg-[#E2E2E7]'}`} />
                        <div className={`text-[10px] mt-1.5 ${i <= paso ? 'text-[#0A66E0] font-semibold' : 'text-[#A1A1A6]'}`}>{t}</div>
                      </li>
                    ))}
                  </ol>

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

                  {viaje.conductor_celular && (
                    <a href={`tel:+51${viaje.conductor_celular}`}
                      className="mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#E8F5EA] text-[#1E8E3E] font-semibold hover:bg-[#d8eedb] transition">
                      <FontAwesomeIcon icon={faPhone} />Llamar al conductor · +51 {viaje.conductor_celular}
                    </a>
                  )}

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-2"><FontAwesomeIcon icon={faLocationDot} className="text-[#0A66E0] mt-1" /><span>{viaje.direccion_origen || 'Punto de recojo'}</span></div>
                    {viaje.direccion_destino && <div className="flex gap-2"><FontAwesomeIcon icon={faFlagCheckered} className="text-[#6E6E73] mt-1" /><span>{viaje.direccion_destino}</span></div>}
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
                          ? 'El conductor ya va hacia ti: si cancelas se retiene tu garantía de S/ 1.50 (S/ 1.00 para el conductor).'
                          : 'Aún no sale el conductor: si cancelas te devolvemos tus S/ 1.50.'}
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
              {!viaje && !porCalificar && (
                <div className="rounded-3xl bg-white border border-[#E2E8F0] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-lg">Taxis cerca de ti</h2>
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

                  <ul className="space-y-2.5">
                    {conductores.map((c) => {
                      const sel = c.id === seleccionado
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
                                <div className="font-semibold text-[#0A66E0]">{Number(c.distancia_km).toFixed(1)} km</div>
                                <div className="text-[11px] text-[#A1A1A6]">de ti</div>
                              </div>
                            </div>
                            <div className="mt-2.5"><DatosVehiculo c={c} /></div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Pedir con pago */}
              {!viaje && !porCalificar && elegido && (
                <div ref={panelPedido} className="rounded-3xl bg-white border-2 border-[#0A66E0] p-5 scroll-mt-32">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Pedir con {elegido.nombre.split(' ')[0]}</h2>
                    <button onClick={() => setSeleccionado(null)} aria-label="Cerrar" className="text-[#A1A1A6] hover:text-[#1D1D1F]"><FontAwesomeIcon icon={faXmark} /></button>
                  </div>

                  <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-1.5 block">
                    <FontAwesomeIcon icon={faLocationDot} className="mr-1.5 text-[#0A66E0]" />Dónde te recogen
                  </label>
                  <input value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} maxLength={120}
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-3" />

                  <label className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-1.5 block">
                    <FontAwesomeIcon icon={faFlagCheckered} className="mr-1.5" />A dónde vas (opcional)
                  </label>
                  <input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} maxLength={120}
                    placeholder="Ej. Mercado Modelo"
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-4" />

                  <div className="text-xs font-semibold text-[#6E6E73] uppercase tracking-widest mb-2">
                    <FontAwesomeIcon icon={faWallet} className="mr-1.5" />Paga tu garantía de {soles(GARANTIA)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3" role="radiogroup" aria-label="Método de pago">
                    {[{ k: 'yape', t: 'Yape', c: '#742284' }, { k: 'plin', t: 'Plin', c: '#00A8E8' }].map((m) => (
                      <button key={m.k} onClick={() => setForm({ ...form, metodo: m.k })} role="radio" aria-checked={form.metodo === m.k}
                        className={`py-3 rounded-xl border-2 font-semibold transition ${form.metodo === m.k ? 'bg-white' : 'border-[#E2E2E7] text-[#6E6E73] hover:border-[#C7D6EA]'}`}
                        style={form.metodo === m.k ? { borderColor: m.c, color: m.c } : undefined}>
                        {form.metodo === m.k && <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />}{m.t}
                      </button>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F8FF] text-sm text-[#4B5873] mb-3">
                    <FontAwesomeIcon icon={faCircleInfo} className="mr-1.5 text-[#0A66E0]" />
                    {NUMERO_PAGO[form.metodo]
                      ? <>Envía <b>{soles(GARANTIA)}</b> por {form.metodo === 'yape' ? 'Yape' : 'Plin'} al <b className="text-[#14213D]">{NUMERO_PAGO[form.metodo]}</b> (SafO) y escribe aquí el código de operación.</>
                      : <>Envía <b>{soles(GARANTIA)}</b> por {form.metodo === 'yape' ? 'Yape' : 'Plin'} al número de SafO y escribe aquí el código de operación.</>}
                  </div>
                  <input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} maxLength={40}
                    placeholder="Código de operación"
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-transparent focus:bg-white focus:border-[#0A66E0] focus:outline-none text-sm mb-3" />

                  <p className="text-xs text-[#6E6E73] mb-4 leading-relaxed">
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-1.5 text-[#1E8E3E]" />
                    Si cancelas antes de que el conductor salga, te devolvemos los {soles(GARANTIA)}. Si ya salió, S/ 1.00 es para el conductor y S/ 0.50 para SafO.
                  </p>

                  <button onClick={pedirTaxi} disabled={enviando}
                    className="w-full py-3.5 rounded-2xl font-semibold text-white text-lg bg-[#0A66E0] hover:bg-[#084FB0] disabled:opacity-50 transition">
                    <FontAwesomeIcon icon={faTaxi} className="mr-2.5" />{enviando ? 'Solicitando…' : 'Pedir taxi'}
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
                      <span className="font-semibold">{soles(v.monto_total)}</span>
                    </div>
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
                <li><FontAwesomeIcon icon={faHourglassHalf} className="mr-2 text-[#FFC21A]" />Si el conductor ya salió y cancelas, S/ 1.00 es para él y S/ 0.50 para SafO.</li>
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
      </main>
    </div>
  )
}
