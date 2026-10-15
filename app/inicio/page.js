'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faStar, faClock, faCircleCheck, faMobileScreenButton, faMagnifyingGlass, faTaxi, faUserPlus, faArrowRight, faLocationDot, faArrowUpRightFromSquare, faCircleDot, faMapLocationDot, faPeopleRoof, faRightToBracket } from '@fortawesome/free-solid-svg-icons'
import SafoLogo from '@/components/SafoLogo'
import EscenaCiudad from '@/components/EscenaCiudad'
import { CIUDAD } from '@/lib/ciudad'
import MapaCiudad, { MAPA_URL } from '@/components/MapaCiudad'
import TelefonoApp from '@/components/TelefonoApp'

export default function InicioPage() {
  const router = useRouter()
  const [sesion, setSesion] = useState(null)

  // Si ya inició sesión, el botón lleva a su panel en vez de pedir registrarse otra vez
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('safo_usuario') || 'null')
      if (u && localStorage.getItem('safo_token') && (u.rol === 'pasajero' || u.rol === 'admin')) setSesion(u)
    } catch { /* sin sesión */ }
  }, [])
  const irAlPanel = () => router.push(sesion?.rol === 'admin' ? '/dashboard' : '/pasajero')

  return (
    <div className="min-h-screen bg-white text-[#14213D]">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#E2E2E7] bg-white/90 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <SafoLogo size={52} priority />
          {sesion ? (
            <button onClick={irAlPanel}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition bg-[#0A66E0] hover:bg-[#084FB0]">
              <FontAwesomeIcon icon={faTaxi} className="mr-2" />Ir a mi panel
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => router.push('/login')}
                className="px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-[#0A66E0] border border-[#C7D9F8] hover:bg-[#EAF2FE] transition">
                <FontAwesomeIcon icon={faRightToBracket} className="mr-2" />Iniciar sesión
              </button>
              <button onClick={() => router.push('/registro/pasajero')}
                className="px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold text-white transition bg-[#0A66E0] hover:bg-[#084FB0]">
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />Registrarme
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero — enfocado al pasajero: texto a la izquierda, la ciudad a la derecha */}
      <section className="pt-28 pb-16 px-6 bg-gradient-to-b from-[#F3F8FF] to-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] mb-7">
              <FontAwesomeIcon icon={faCircleDot} className="text-[#1D1D1F] text-xs animate-pulse" />
              <span className="text-[#4B5873] text-sm font-medium">Operando en {CIUDAD.nombre}, {CIUDAD.pais}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold mb-6 leading-[1.05] tracking-tight text-[#14213D]">
              Un taxi seguro para cada calle de {CIUDAD.nombre}
            </h1>
            <p className="text-[#4B5873] text-xl mb-9 max-w-lg leading-relaxed">
              Sabes quién te lleva antes de subir: cada conductor presenta su DNI, licencia y vehículo, y la plataforma los revisa.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {sesion ? (
                <button onClick={irAlPanel}
                  className="px-8 py-4 rounded-full font-semibold text-white text-lg transition bg-[#0A66E0] hover:bg-[#084FB0]">
                  <FontAwesomeIcon icon={faTaxi} className="mr-2.5" />Ir a mi panel
                </button>
              ) : (
                <>
                  <button onClick={() => router.push('/registro/pasajero')}
                    className="px-8 py-4 rounded-full font-semibold text-white text-lg transition bg-[#0A66E0] hover:bg-[#084FB0]">
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2.5" />Registrarme gratis
                  </button>
                  <button onClick={() => router.push('/login')}
                    className="px-8 py-4 rounded-full font-semibold text-[#0A66E0] text-lg border-2 border-[#C7D9F8] bg-white hover:bg-[#EAF2FE] transition">
                    <FontAwesomeIcon icon={faRightToBracket} className="mr-2.5" />Iniciar sesión
                  </button>
                </>
              )}
              <span className="text-[#6B7894] text-sm w-full">Registro gratuito. Verás el costo antes de confirmar tu viaje.</span>
            </div>
          </div>

          <div className="relative lg:pl-10 pb-14 sm:pb-24">
            <div className="relative">
              {/* bloque azul detrás de la ilustración: da profundidad */}
              <div className="absolute -top-4 -right-4 -bottom-4 left-8 rounded-[2.2rem] bg-[#0A4FD6]" aria-hidden="true" />
              <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-[0_24px_60px_-28px_rgba(7,42,122,.55)] bg-white">
                <EscenaCiudad className="w-full h-auto block" />
              </div>
              <div className="absolute top-5 left-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-md px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F1F1F3] flex items-center justify-center">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-lg text-[#1D1D1F]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#14213D]">Conductor verificado</div>
                  <div className="text-xs text-[#6B7894]">DNI, licencia y vehículo revisados</div>
                </div>
              </div>
              <TelefonoApp className="hidden sm:block absolute -bottom-20 -left-10 scale-[.8] origin-bottom-left" />
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona — franja azul fuerte (secuencia real de 3 pasos) */}
      <section className="py-20 px-6 bg-[#0A4FD6] text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3 max-w-xl">Pides, ves quién viene y viajas</h2>
          <p className="text-[#CFE0FF] text-lg mb-12 max-w-xl">Tres pasos, y antes de confirmar siempre ves cuánto costará.</p>
          <ol className="grid md:grid-cols-3 gap-5">
            {[
              { icon: faMagnifyingGlass, t: 'Mira los taxis cerca de ti', d: 'Ves en el mapa los conductores verificados que están libres en este momento.' },
              { icon: faMobileScreenButton, t: 'Pide y sigue a tu conductor', d: 'Ves su nombre, placa y cuánto falta. Puedes compartir el viaje con tu familia.' },
              { icon: faTaxi, t: 'Sube y viaja tranquilo', d: 'Al terminar calificas el viaje. Si cancelas antes de que el conductor salga, te devolvemos tu garantía.' },
            ].map((p, i) => (
              <li key={i} className="rounded-2xl bg-white/10 border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#FFC21A] text-[#14213D] text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <FontAwesomeIcon icon={p.icon} className="text-lg text-[#CFE0FF]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{p.t}</h3>
                <p className="text-[#CFE0FF] text-sm leading-relaxed">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Beneficios para el pasajero */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-semibold text-[#14213D] mb-4 tracking-tight">Viaja seguro con SafO</h2>
            <p className="text-[#6E6E73] text-lg">Tu seguridad es nuestra prioridad</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: faShieldHalved, color: '#1D1D1F', bg: '#F1F1F3', title: 'Conductores verificados', desc: 'DNI, licencia y antecedentes revisados antes de activar cualquier conductor.' },
              { icon: faStar, color: '#1D1D1F', bg: '#F1F1F3', title: 'Calificaciones reales', desc: 'Califica tu viaje. Los conductores con malas calificaciones son suspendidos.' },
              { icon: faClock, color: '#1D1D1F', bg: '#F1F1F3', title: 'Seguimiento en tiempo real', desc: 'Comparte tu viaje con un familiar. Siempre sabemos dónde estás.' },
              { icon: faCircleCheck, color: '#1D1D1F', bg: '#F1F1F3', title: 'Garantía de viaje', desc: 'Si cancelas antes de que el conductor salga, te devolvemos tu garantía.' },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-6 border border-[#E2E2E7] hover:shadow-md transition">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: b.bg }}>
                  <FontAwesomeIcon icon={b.icon} className="text-xl" style={{ color: b.color }} />
                </div>
                <h3 className="font-semibold text-[#14213D] mb-2">{b.title}</h3>
                <p className="text-[#6E6E73] text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa de referencia */}
      <section className="py-20 px-6 bg-[#F6F8FB]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2">
            <h2 className="text-4xl font-semibold text-[#14213D] mb-4 tracking-tight"><FontAwesomeIcon icon={faPeopleRoof} className="text-[#0A4FD6] text-3xl mr-3 align-middle" />Hecho para {CIUDAD.nombre}</h2>
            <p className="text-[#4B5873] text-lg leading-relaxed mb-6">
              Conocemos las calles del centro, los cerros y el río de nuestra ciudad. SafO nace aquí, con conductores de aquí.
            </p>
            <a href={MAPA_URL} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-[#0A66E0] font-semibold hover:underline">
              <FontAwesomeIcon icon={faMapLocationDot} />
              Abrir el mapa completo
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs" />
            </a>
          </div>
          <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-[0_24px_60px_-32px_rgba(20,33,61,.35)] h-[360px] md:h-[420px] bg-white">
            <MapaCiudad className="absolute inset-0" interactivo />
            <div className="absolute left-4 bottom-4 rounded-xl bg-white/95 backdrop-blur border border-[#E2E8F0] px-4 py-2.5 pointer-events-none">
              <div className="text-sm font-semibold text-[#14213D]"><FontAwesomeIcon icon={faLocationDot} className="text-[#0A4FD6] mr-1.5" />{CIUDAD.lugar}</div>
              <div className="text-xs text-[#6B7894]">Centro de {CIUDAD.nombre}{CIUDAD.altitud ? ` · ${CIUDAD.altitud}` : ''}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA pasajero — azul profundo donde antes iría negro */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden bg-[#072A7A] text-white grid md:grid-cols-5">
          <div className="md:col-span-3 p-10 md:p-14">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 tracking-tight">¿Listo para tu primer viaje?</h2>
            <p className="text-[#CFE0FF] mb-8 text-lg max-w-md">Crea tu cuenta gratis y pide un taxi verificado en minutos.</p>
            <div className="flex flex-wrap items-center gap-3">
              {sesion ? (
                <button onClick={irAlPanel}
                  className="px-9 py-4 rounded-full font-semibold text-[#14213D] text-lg transition bg-[#FFC21A] hover:bg-[#FFD04D]">
                  <FontAwesomeIcon icon={faTaxi} className="mr-2.5" />Ir a mi panel
                </button>
              ) : (
                <>
                  <button onClick={() => router.push('/registro/pasajero')}
                    className="px-9 py-4 rounded-full font-semibold text-[#14213D] text-lg transition bg-[#FFC21A] hover:bg-[#FFD04D]">
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2.5" />Registrarme gratis
                  </button>
                  <button onClick={() => router.push('/login')}
                    className="px-8 py-4 rounded-full font-semibold text-white text-lg border-2 border-white/40 hover:bg-white/10 transition">
                    <FontAwesomeIcon icon={faRightToBracket} className="mr-2.5" />Iniciar sesión
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block md:col-span-2 relative min-h-[240px]">
            <MapaCiudad className="absolute inset-0 opacity-90" zoom={16} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#072A7A] to-transparent" />
          </div>
        </div>
      </section>

      {/* Footer con link discreto para conductores */}
      <footer className="border-t border-[#E2E2E7] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SafoLogo size={36} />
            <span className="text-[#A1A1A6] text-sm">SafO · {CIUDAD.nombre}, {CIUDAD.pais}</span>
          </div>
          <div className="flex items-center gap-5">
          <button onClick={() => router.push('/login')} className="text-[#6E6E73] hover:text-[#0A66E0] text-sm font-medium transition">Iniciar sesión</button>
          <button onClick={() => router.push('/registro/conductor')}
            className="text-[#A1A1A6] hover:text-[#0A66E0] text-xs transition">
            ¿Eres conductor? Únete a nuestra red <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
          </button>
          </div>
        </div>
      </footer>

    </div>
  )
}
