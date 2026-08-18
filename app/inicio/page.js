'use client'
import { useRouter } from 'next/navigation'
import { MapPin, Shield, Star, Clock, CheckCircle } from 'lucide-react'

export default function InicioPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#060B18] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A6EFF15] px-6 py-4"
        style={{ background: 'rgba(6,11,24,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl">Saf<span style={{ color: '#1A6EFF' }}>O</span></span>
          </div>
          {/* Solo botón de pasajero en navbar */}
          <button onClick={() => router.push('/registro/pasajero')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
            style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
            Pedir mi taxi →
          </button>
        </div>
      </nav>

      {/* Hero — enfocado al pasajero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-10 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1A6EFF30] bg-[#1A6EFF10] mb-8">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"/>
            <span className="text-[#4D96FF] text-sm font-medium">Operando en Huánuco, Perú</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Tu taxi seguro,<br/>
            <span style={{ color: '#1A6EFF' }}>siempre verificado</span>
          </h1>
          <p className="text-[#4D96FF80] text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Viaja tranquilo con conductores certificados y rastreados. Sabemos exactamente quién te lleva y a dónde vas.
          </p>
          <button onClick={() => router.push('/registro/pasajero')}
            className="px-10 py-5 rounded-2xl font-black text-white text-xl transition inline-flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
            <span>Registrarme gratis</span>
            <span>→</span>
          </button>
          <p className="text-[#4D96FF40] text-sm mt-4">Sin costo de registro · Solo pagas S/ 1.50 al pedir tu taxi</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#1A6EFF10]"
        style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { n: 'S/ 1.50', label: 'Solo pagas al pedir', color: '#1A6EFF' },
            { n: '100%', label: 'Conductores verificados', color: '#22C55E' },
            { n: '0', label: 'Costo de registro', color: '#A855F7' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-black mb-2" style={{ color: s.color }}>{s.n}</div>
              <div className="text-[#4D96FF60] text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios para el pasajero */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-4">Viaja seguro con SafO</h2>
            <p className="text-[#4D96FF60] text-lg">Tu seguridad es nuestra prioridad</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, color: '#1A6EFF', bg: '#1A6EFF15', title: 'Conductores verificados', desc: 'DNI, licencia y antecedentes revisados antes de activar cualquier conductor.' },
              { icon: Star, color: '#F59E0B', bg: '#F59E0B15', title: 'Calificaciones reales', desc: 'Califica tu viaje. Los conductores con malas calificaciones son suspendidos.' },
              { icon: Clock, color: '#22C55E', bg: '#22C55E15', title: 'Seguimiento en tiempo real', desc: 'Comparte tu viaje con un familiar. Siempre sabemos dónde estás.' },
              { icon: CheckCircle, color: '#A855F7', bg: '#A855F715', title: 'Garantía de viaje', desc: 'Si cancelas antes de que el conductor salga, te devolvemos tu S/ 1.50.' },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl p-6 border border-[#1A6EFF15] hover:border-[#1A6EFF30] transition"
                style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: b.bg }}>
                  <b.icon className="w-6 h-6" style={{ color: b.color }} />
                </div>
                <h3 className="font-bold text-white mb-2">{b.title}</h3>
                <p className="text-[#4D96FF60] text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA pasajero */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto rounded-3xl p-10 border border-[#1A6EFF20] text-center"
          style={{ background: 'linear-gradient(135deg, #0D1B4B30, #1A6EFF10)' }}>
          <div className="text-5xl mb-6">🚖</div>
          <h2 className="text-3xl font-black text-white mb-4">¿Listo para viajar seguro?</h2>
          <p className="text-[#4D96FF80] mb-8">Regístrate gratis y pide tu primer taxi verificado en minutos.</p>
          <button onClick={() => router.push('/registro/pasajero')}
            className="px-10 py-4 rounded-2xl font-black text-white text-lg transition"
            style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
            Registrarme gratis →
          </button>
        </div>
      </section>

      {/* Footer con link discreto para conductores */}
      <footer className="border-t border-[#1A6EFF10] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white">Saf<span style={{ color: '#1A6EFF' }}>O</span></span>
            <span className="text-[#4D96FF30] text-sm ml-2">© 2025 — Huánuco, Perú</span>
          </div>
          {/* Link discreto para conductores */}
          <button onClick={() => router.push('/registro/conductor')}
            className="text-[#4D96FF30] hover:text-[#4D96FF] text-xs transition">
            ¿Eres conductor? Únete a nuestra red →
          </button>
        </div>
      </footer>

    </div>
  )
}