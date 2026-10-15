'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRoute, faCircleCheck, faCoins, faTaxi, faArrowUp, faArrowDown, faMinus, faArrowRight,
  faTriangleExclamation, faCommentDots, faFileCircleCheck, faHandHoldingDollar, faStar, faHand,
} from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import useAuthGuard from '@/lib/useAuthGuard'
import AdminNavbar from '@/components/AdminNavbar'
import SafoLogo from '@/components/SafoLogo'
import { LineaDoble, Dona, Spark, COLORES } from '@/components/Graficos'

const MapaAdmin = dynamic(() => import('@/components/MapaAdmin'), { ssr: false })

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`

function Cambio({ pct }) {
  const icono = pct > 0 ? faArrowUp : pct < 0 ? faArrowDown : faMinus
  const color = pct > 0 ? 'text-[#1E8E3E] bg-[#E8F5EA]' : pct < 0 ? 'text-[#D92D20] bg-[#FCEAE9]' : 'text-[#6E6E73] bg-[#F1F2F5]'
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${color}`}>
      <FontAwesomeIcon icon={icono} className="text-[9px]" />{Math.abs(pct)}%
    </span>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { usuario, listo } = useAuthGuard()
  const [dias, setDias] = useState(7)
  const [stats, setStats] = useState(null)
  const [mapa, setMapa] = useState({ conductores: [], viajes: [], sos: [] })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const [e, m] = await Promise.all([
        api.get(`/api/admin/estadisticas?dias=${dias}`),
        api.get('/api/admin/mapa-vivo'),
      ])
      setStats(e.data)
      setMapa(m.data)
    } catch {
      toast.error('Error cargando el resumen', { id: 'err-resumen' })
    } finally {
      setCargando(false)
    }
  }, [dias])

  useEffect(() => {
    if (!listo) return
    cargar()
    const t = setInterval(cargar, 30000)
    return () => clearInterval(t)
  }, [listo, cargar])

  if (!listo || cargando || !stats) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <SafoLogo size={72} />
        <div className="text-[#6E6E73] text-sm">Cargando SafO...</div>
      </div>
    </div>
  )

  const serie = stats.serie
  const kpis = [
    { titulo: 'Reservas', valor: stats.reservas.total, cambio: stats.reservas.cambio_pct, icono: faRoute, serie: serie.map(d => d.reservas), color: COLORES.marino },
    { titulo: 'Viajes completados', valor: stats.completados.total, cambio: stats.completados.cambio_pct, icono: faCircleCheck, serie: serie.map(d => d.completados), color: COLORES.verde },
    { titulo: 'Ingresos de SafO', valor: soles(stats.ingresos.total), cambio: stats.ingresos.cambio_pct, icono: faCoins, sub: `${soles(stats.ingresos.garantias)} garantías · ${soles(stats.ingresos.suscripciones)} suscripciones` },
    { titulo: 'Conductores en línea', valor: stats.conductores.disponibles + stats.conductores.en_viaje, icono: faTaxi, sub: `${stats.conductores.disponibles} libres · ${stats.conductores.en_viaje} en viaje · ${stats.conductores.aprobados} aprobados` },
  ]

  const e = stats.estados
  const partes = [
    { nombre: 'Nuevas', valor: e.nuevos, color: COLORES.gris },
    { nombre: 'Aceptadas', valor: e.aceptados, color: COLORES.azul },
    { nombre: 'En viaje', valor: e.en_viaje, color: COLORES.amarillo },
    { nombre: 'Completadas', valor: e.completados, color: COLORES.verde },
    { nombre: 'Canceladas', valor: e.cancelados, color: COLORES.rojo },
  ]
  const totalEstados = partes.reduce((a, p) => a + p.valor, 0)

  const p = stats.pendientes
  const pendientes = [
    { titulo: 'Alertas SOS activas', n: p.sos_activas, icono: faTriangleExclamation, ruta: '/sos', color: '#D92D20', fondo: '#FCEAE9', critica: true },
    { titulo: 'Conductores por aprobar', n: p.docs_pendientes, icono: faFileCircleCheck, ruta: '/conductores', color: '#B45309', fondo: '#FEF3E2' },
    { titulo: 'Reclamos abiertos', n: p.reclamos_abiertos, icono: faCommentDots, ruta: '/reclamos', color: '#7C5CFC', fondo: '#F1EEFF' },
    { titulo: 'Pagos por confirmar', n: p.pagos_pendientes, icono: faHandHoldingDollar, ruta: '/suscripciones', color: '#0A66E0', fondo: '#EAF2FE' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6 mt-1">
          <div>
            <h1 className="text-2xl font-semibold text-[#14213D]">
              Hola, {usuario?.nombre || 'Admin'} <FontAwesomeIcon icon={faHand} className="text-[#FFC21A] ml-1" />
            </h1>
            <p className="text-[#6E6E73] text-sm mt-1 capitalize">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-white border border-[#E6E8EF] p-1" role="group" aria-label="Periodo">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDias(d)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${dias === d ? 'bg-[#14213D] text-white' : 'text-[#6E6E73] hover:text-[#14213D]'}`}>
                {d} días
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {kpis.map(k => (
            <div key={k.titulo} className="tarjeta tarjeta-sombra p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8F9C]">{k.titulo}</span>
                <span className="w-8 h-8 rounded-lg bg-[#FFF6D9] text-[#B58900] flex items-center justify-center">
                  <FontAwesomeIcon icon={k.icono} className="text-sm" />
                </span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-3xl font-bold text-[#14213D] leading-none">{k.valor}</div>
                  <div className="mt-2 min-h-[20px]">
                    {k.cambio !== undefined
                      ? <span className="flex items-center gap-2 text-xs text-[#8A8F9C]"><Cambio pct={k.cambio} />vs. periodo anterior</span>
                      : <span className="text-xs text-[#8A8F9C]">{k.sub}</span>}
                  </div>
                </div>
                {k.serie && <Spark valores={k.serie} color={k.color === COLORES.marino ? COLORES.amarillo : k.color} />}
              </div>
              {k.cambio !== undefined && k.sub && <div className="text-xs text-[#8A8F9C] mt-2">{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Pendientes */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
          {pendientes.map(t => (
            <button key={t.titulo} onClick={() => router.push(t.ruta)}
              className={`tarjeta p-4 text-left flex items-center gap-3 hover:border-[#14213D]/30 transition ${t.critica && t.n > 0 ? 'ring-2 ring-[#D92D20]/40' : ''}`}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.fondo, color: t.color }}>
                <FontAwesomeIcon icon={t.icono} />
              </span>
              <span className="min-w-0">
                <span className="block text-2xl font-bold leading-none text-[#14213D]">{t.n}</span>
                <span className="block text-xs text-[#6E6E73] mt-1 truncate">{t.titulo}</span>
              </span>
              <FontAwesomeIcon icon={faArrowRight} className="ml-auto text-[#C5C8D2] text-xs" />
            </button>
          ))}
        </div>

        {/* Estados + mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <div className="tarjeta tarjeta-sombra p-5 lg:col-span-2">
            <h2 className="font-semibold text-[#14213D] mb-4">Solicitudes de viaje</h2>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Dona partes={partes} centroTitulo="Total" centroValor={totalEstados} />
              <ul className="text-sm space-y-2.5 min-w-[150px]">
                {partes.map(pt => (
                  <li key={pt.nombre} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: pt.color }} />
                    <span className="text-[#4B4F5C]">{pt.nombre}</span>
                    <span className="ml-auto font-semibold text-[#14213D]">{pt.valor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tarjeta tarjeta-sombra p-5 lg:col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#14213D]">Mapa en vivo</h2>
              <button onClick={() => router.push('/mapa')} className="text-sm font-medium text-[#0A66E0] hover:underline">
                Abrir mapa completo <FontAwesomeIcon icon={faArrowRight} className="text-xs ml-1" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[260px] rounded-xl overflow-hidden border border-[#E6E8EF]">
              <MapaAdmin className="absolute inset-0" conductores={mapa.conductores} viajes={mapa.viajes} sos={mapa.sos} ajustarKey={1} />
              <div className="absolute left-3 bottom-3 z-[500] bg-white/90 rounded-lg px-2.5 py-1.5 text-xs text-[#4B4F5C] shadow flex gap-3">
                <span><span className="inline-block w-2 h-2 rounded-full bg-[#1E8E3E] mr-1" />Libres {mapa.conductores.filter(c => !c.en_viaje).length}</span>
                <span><span className="inline-block w-2 h-2 rounded-full bg-[#FFC21A] mr-1" />En viaje {mapa.conductores.filter(c => c.en_viaje).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Análisis */}
        <div className="tarjeta tarjeta-sombra p-5 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold text-[#14213D]">Análisis de reservas</h2>
            <div className="flex gap-4 text-xs text-[#6E6E73]">
              <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14213D] mr-1.5" />Reservas</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FFC21A] mr-1.5" />Completados</span>
            </div>
          </div>
          <LineaDoble datos={serie} />
        </div>

        {/* Top conductores */}
        <div className="tarjeta tarjeta-sombra p-5">
          <h2 className="font-semibold text-[#14213D] mb-3">Conductores con más viajes ({dias} días)</h2>
          {stats.top_conductores.length === 0 ? (
            <p className="text-sm text-[#8A8F9C] py-6 text-center">Todavía no hay viajes completados en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[#8A8F9C]">
                    <th className="py-2 font-semibold">Conductor</th>
                    <th className="py-2 font-semibold">Placa</th>
                    <th className="py-2 font-semibold text-right">Viajes</th>
                    <th className="py-2 font-semibold text-right">Tarifas estimadas</th>
                    <th className="py-2 font-semibold text-right">Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_conductores.map((c, i) => (
                    <tr key={c.placa + i} className="border-t border-[#F0F1F5]">
                      <td className="py-2.5 font-medium text-[#14213D]">{c.nombre}</td>
                      <td className="py-2.5 text-[#6E6E73]">{c.placa}</td>
                      <td className="py-2.5 text-right font-semibold">{c.viajes}</td>
                      <td className="py-2.5 text-right">{soles(c.tarifa_estimada)}</td>
                      <td className="py-2.5 text-right"><FontAwesomeIcon icon={faStar} className="text-[#FFC21A] mr-1" />{Number(c.calificacion_prom).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
