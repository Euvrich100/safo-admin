'use client'
import { useRouter, usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket, faHouse, faTaxi, faUsers, faRoute, faCoins } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from './SafoLogo'

const LINKS = [
  { href: '/dashboard', label: 'Inicio', icon: faHouse },
  { href: '/conductores', label: 'Conductores', icon: faTaxi },
  { href: '/pasajeros', label: 'Pasajeros', icon: faUsers },
  { href: '/viajes', label: 'Viajes', icon: faRoute },
  { href: '/suscripciones', label: 'Pagos', icon: faCoins },
]

export default function AdminNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const cerrarSesion = () => {
    localStorage.removeItem('safo_token')
    localStorage.removeItem('safo_usuario')
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E2E2E7] bg-white/90 backdrop-blur px-6 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <button onClick={() => router.push('/dashboard')} className="flex items-center shrink-0">
          <SafoLogo size={30} priority />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map(l => {
            const activo = pathname === l.href
            return (
              <button key={l.href} onClick={() => router.push(l.href)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition whitespace-nowrap ${
                  activo ? 'text-[#0A66E0] bg-[#EAF2FE]' : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}>
                <FontAwesomeIcon icon={l.icon} className="text-xs mr-2" />{l.label}
              </button>
            )
          })}
          <button onClick={cerrarSesion}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#D92D20] hover:bg-[#FCEAE9] rounded-full transition ml-1">
            <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
