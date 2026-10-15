'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRightFromBracket, faGaugeHigh, faTaxi, faUsers, faRoute, faCoins, faMapLocationDot,
  faTriangleExclamation, faCommentDots, faSliders, faClipboardList, faBars, faXmark,
} from '@fortawesome/free-solid-svg-icons'
import api from '@/lib/api'
import SafoLogo from './SafoLogo'

// Barra lateral del panel de administración (en el celular pasa a ser un menú
// que se despliega). Las pestañas con alertas muestran un contador rojo.
const GRUPOS = [
  {
    titulo: 'Operación',
    links: [
      { href: '/dashboard', label: 'Resumen', icon: faGaugeHigh },
      { href: '/mapa', label: 'Mapa en vivo', icon: faMapLocationDot },
      { href: '/viajes', label: 'Viajes', icon: faRoute },
      { href: '/sos', label: 'Alertas SOS', icon: faTriangleExclamation, alerta: 'sos_activas', critica: true },
    ],
  },
  {
    titulo: 'Personas',
    links: [
      { href: '/conductores', label: 'Conductores', icon: faTaxi, alerta: 'docs_pendientes' },
      { href: '/pasajeros', label: 'Pasajeros', icon: faUsers },
      { href: '/reclamos', label: 'Reclamos', icon: faCommentDots, alerta: 'reclamos_abiertos' },
    ],
  },
  {
    titulo: 'Negocio',
    links: [
      { href: '/suscripciones', label: 'Pagos y suscripciones', icon: faCoins },
      { href: '/tarifas', label: 'Tarifas y zonas', icon: faSliders },
      { href: '/auditoria', label: 'Auditoría', icon: faClipboardList },
    ],
  },
]

export default function AdminNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)
  const [alertas, setAlertas] = useState({})
  const [nombre, setNombre] = useState('Admin')
  const sosPrevio = useRef(null)

  useEffect(() => {
    try { setNombre(JSON.parse(localStorage.getItem('safo_usuario') || '{}').nombre || 'Admin') } catch { /* sin nombre */ }
  }, [])

  // Contadores de pendientes: se refrescan solos; una SOS nueva avisa al instante
  useEffect(() => {
    let vivo = true
    const cargar = async () => {
      try {
        const { data } = await api.get('/api/admin/alertas')
        if (!vivo) return
        setAlertas(data)
        if (sosPrevio.current !== null && data.sos_activas > sosPrevio.current) {
          toast.error('🚨 Nueva alerta SOS. Revísala ahora.', { duration: 15000, id: 'sos-nueva' })
        }
        sosPrevio.current = data.sos_activas
      } catch { /* si falla, se reintenta en el próximo ciclo */ }
    }
    cargar()
    const t = setInterval(cargar, 20000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  useEffect(() => { setAbierto(false) }, [pathname])

  const cerrarSesion = () => {
    localStorage.removeItem('safo_token')
    localStorage.removeItem('safo_usuario')
    router.push('/login')
  }

  const Contador = ({ n, critica }) => (n > 0 ? (
    <span className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${critica ? 'bg-[#D92D20] text-white animate-pulse' : 'bg-[#FFC21A] text-[#14213D]'}`}>
      {n > 99 ? '99+' : n}
    </span>
  ) : null)

  const menu = (
    <>
      <button onClick={() => router.push('/dashboard')} className="flex items-center gap-3 px-2 mb-6 shrink-0" aria-label="Ir al resumen">
        <SafoLogo size={64} priority />
        <span className="text-white/60 text-xs leading-tight text-left">Panel de<br />administración</span>
      </button>

      <nav className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-5">
        {GRUPOS.map(g => (
          <div key={g.titulo}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{g.titulo}</div>
            <div className="space-y-0.5">
              {g.links.map(l => {
                const activo = pathname === l.href
                return (
                  <button key={l.href} onClick={() => router.push(l.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left ${
                      activo ? 'bg-[#FFC21A] text-[#14213D]' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}>
                    <FontAwesomeIcon icon={l.icon} className="w-4 text-sm" />
                    <span className="truncate">{l.label}</span>
                    {l.alerta && <Contador n={alertas[l.alerta]} critica={l.critica} />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
        <div className="px-3 mb-2 text-xs text-white/50 truncate">Sesión de <span className="text-white/80 font-medium">{nombre}</span></div>
        <button onClick={cerrarSesion}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/75 hover:bg-[#D92D20]/20 hover:text-[#FF8A80] transition">
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="safo-sidebar hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-[#14213D] p-4 z-40">
        {menu}
      </aside>

      {/* Celular: barra superior con menú desplegable */}
      <header className="md:hidden sticky top-0 z-40 bg-[#14213D] px-4 py-2.5 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} aria-label="Ir al resumen"><SafoLogo size={48} priority /></button>
        <button onClick={() => setAbierto(a => !a)} aria-label="Menú"
          className="relative w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={abierto ? faXmark : faBars} />
          {(alertas.sos_activas || 0) > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D92D20] animate-pulse" />}
        </button>
      </header>
      {abierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85%] bg-[#14213D] p-4 flex flex-col">{menu}</div>
          <button className="flex-1 bg-black/40" onClick={() => setAbierto(false)} aria-label="Cerrar menú" />
        </div>
      )}
    </>
  )
}
