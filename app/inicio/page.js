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
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm text-[#4D96FF] hover:text-white transition">
              Admin
            </button>
            <button onClick={() => router.push('/registro')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition"
              style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
              Únete gratis →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-10 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1A6EFF, transparent)' }}/>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] opacity-5 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #4D96FF, transparent)' }}/>
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
            SafO conecta pasajeros con conductores verificados y certificados. Viaja tranquilo sabiendo exactamente quién te lleva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/registro')}
              className="px-8 py-4 rounded-2xl font-bold text-white text-lg transition"
              style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
              🚖 Registrarme como conductor
            </button>
            <button onClick={() => router.push('/registro')}
              className="px-8 py-4 rounded-2xl font-bold text-white text-lg border border-[#1A6EFF30] hover:border-[#1A6EFF] transition"
              style={{ background: '#0D1B4B20' }}>
              👤 Registrarme como pasajero
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#1A6EFF10]"
        style={{ background: 'linear-gradient(135deg, #0D1B4B10, #060B18)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { n: 'S/ 5', label: 'Suscripción mensual conductor', color: '#1A6EFF' },
            { n: 'S/ 1.50', label: 'Garantía por viaje solicitado', color: '#22C55E' },
            { n: '100%', label: 'Conductores verificados', color: '#A855F7' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-black mb-2" style={{ color: s.color }}>{s.n}</div>
              <div className="text-[#4D96FF60] text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-4">¿Por qué elegir SafO?</h2>
            <p className="text-[#4D96FF60] text-lg">Diseñado para la seguridad de Huánuco</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, color: '#1A6EFF', bg: '#1A6EFF15', title: 'Conductores verificados', desc: 'DNI, licencia y antecedentes revisados por nuestro equipo antes de activar cualquier cuenta.' },
              { icon: Star, color: '#F59E0B', bg: '#F59E0B15', title: 'Calificaciones reales', desc: 'Cada viaje puede ser calificado. Los conductores con malas calificaciones son suspendidos.' },
              { icon: Clock, color: '#22C55E', bg: '#22C55E15', title: 'Seguimiento en tiempo real', desc: 'Comparte tu viaje con un familiar. Sabemos exactamente dónde estás en todo momento.' },
              { icon: CheckCircle, color: '#A855F7', bg: '#A855F715', title: 'Pago garantizado', desc: 'El conductor recibe compensación si el pasajero cancela después de ser despachado.' },
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

      {/* CTA conductor */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl p-10 border border-[#1A6EFF20] text-center"
          style={{ background: 'linear-gradient(135deg, #0D1B4B30, #1A6EFF10)' }}>
          <div className="text-5xl mb-6">🚖</div>
          <h2 className="text-4xl font-black text-white mb-4">¿Tienes un taxi?</h2>
          <p className="text-[#4D96FF80] text-lg mb-8 max-w-xl mx-auto">
            Únete a SafO por solo S/ 5.00 al mes y accede a más pasajeros con la garantía de que serás compensado siempre.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            {[
              '✅ Documentos verificados',
              '✅ Pagos garantizados',
              '✅ Soporte 24/7',
              '✅ Panel de ganancias',
            ].map((item, i) => (
              <span key={i} className="text-[#22C55E] text-sm font-medium">{item}</span>
            ))}
          </div>
          <button onClick={() => router.push('/registro')}
            className="px-10 py-4 rounded-2xl font-black text-white text-lg transition"
            style={{ background: 'linear-gradient(135deg, #1A6EFF, #0D1B4B)' }}>
            Registrarme como conductor →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A6EFF10] py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0D1B4B, #1A6EFF)' }}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white">Saf<span style={{ color: '#1A6EFF' }}>O</span></span>
        </div>
        <p className="text-[#4D96FF30] text-sm">Safe + On — Huánuco, Perú © 2025</p>
      </footer>

    </div>
  )
}