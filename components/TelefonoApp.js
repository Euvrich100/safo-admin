import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserShield, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons'

// Maqueta ilustrativa de la app del pasajero: mapa con la ruta y la ficha del
// conductor. Los datos son de ejemplo, solo para mostrar cómo se ve el viaje.
export default function TelefonoApp({ className = '' }) {
  return (
    <div className={`w-[230px] rounded-[2.2rem] bg-[#0B1F4D] p-2.5 shadow-[0_30px_60px_-24px_rgba(7,42,122,.6)] ${className}`}
      role="img" aria-label="Pantalla de la app SafO mostrando al conductor en camino">
      <div className="rounded-[1.7rem] overflow-hidden bg-white">
        {/* Mapa */}
        <div className="relative h-[150px] bg-[#E8F0FA]">
          <svg viewBox="0 0 200 150" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <rect width="200" height="150" fill="#EEF4FB" />
            <path d="M-5 105 C40 90 80 112 120 98 S180 84 210 92 V122 C170 112 130 128 90 120 S30 114 -5 128 Z" fill="#CFE3F8" />
            <g stroke="#FFFFFF" strokeWidth="7" fill="none" strokeLinecap="round">
              <path d="M10 30 L190 44" /><path d="M0 72 L200 84" /><path d="M48 0 L60 150" /><path d="M120 0 L134 150" />
            </g>
            <path d="M54 118 L56 76 L127 82 L129 38" fill="none" stroke="#0A4FD6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
            <circle cx="54" cy="118" r="7" fill="#FFC21A" stroke="#fff" strokeWidth="3" />
            <circle cx="129" cy="38" r="7" fill="#0A4FD6" stroke="#fff" strokeWidth="3" />
          </svg>
          <div className="absolute top-2.5 left-2.5 right-2.5 rounded-xl bg-white/95 px-3 py-2 flex items-center gap-2 shadow-sm">
            <FontAwesomeIcon icon={faLocationDot} className="text-xs text-[#0A4FD6] shrink-0" />
            <span className="text-[11px] font-medium text-[#14213D] truncate">Jr. Dos de Mayo 1060</span>
          </div>
        </div>
        {/* Ficha del conductor */}
        <div className="p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[13px] font-semibold text-[#14213D]">Tu taxi llega en 3 min</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-[#F3F8FF] p-2.5">
            <div className="w-9 h-9 rounded-full bg-[#0A4FD6] text-white text-sm font-semibold flex items-center justify-center">M</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#14213D]">Marco R.</div>
              <div className="text-[11px] text-[#6B7894] truncate">Toyota Yaris · ABC-123</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border border-[#DCE6F5] flex items-center justify-center">
              <FontAwesomeIcon icon={faPhone} className="text-xs text-[#0A4FD6]" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#1E8E3E] font-medium">
            <FontAwesomeIcon icon={faUserShield} className="text-xs" /> DNI y licencia verificados
          </div>
          <div className="mt-3 rounded-full bg-[#0A4FD6] text-white text-xs font-semibold text-center py-2.5">Compartir mi viaje</div>
        </div>
      </div>
    </div>
  )
}
