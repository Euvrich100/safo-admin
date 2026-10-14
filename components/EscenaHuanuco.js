// Ilustración original: valle de Huánuco con cerros, el río Huallaga, un puente
// de arcos de piedra y un taxi SafO. SVG puro: carga al instante y no pesa.
export default function EscenaHuanuco({ className = '' }) {
  return (
    <svg viewBox="0 0 640 440" className={className} role="img"
      aria-label="Ilustración de un taxi SafO frente a los cerros y el río de Huánuco">
      <defs>
        <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCEBFF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <linearGradient id="rio" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B7D6F7" />
          <stop offset="1" stopColor="#8DBBEF" />
        </linearGradient>
      </defs>

      <rect width="640" height="440" fill="url(#cielo)" />
      <circle cx="505" cy="92" r="40" fill="#FFE08A" />
      <circle cx="505" cy="92" r="62" fill="#FFE08A" opacity=".25" />

      {/* nubes */}
      <g fill="#FFFFFF">
        <ellipse cx="130" cy="86" rx="46" ry="13" />
        <ellipse cx="160" cy="76" rx="30" ry="12" />
        <ellipse cx="380" cy="58" rx="38" ry="10" />
        <ellipse cx="402" cy="50" rx="24" ry="9" />
      </g>

      {/* cerros lejanos y medios */}
      <path d="M0 250 L70 190 L125 228 L210 150 L300 232 L380 175 L470 235 L555 165 L640 228 L640 300 L0 300 Z" fill="#D3E2F4" />
      <path d="M0 278 L90 222 L170 262 L270 196 L360 268 L450 214 L545 262 L640 220 L640 320 L0 320 Z" fill="#B9D3EE" />
      {/* ladera verde cercana */}
      <path d="M0 305 C90 270 170 292 260 284 C360 276 450 262 640 292 L640 330 L0 330 Z" fill="#C6E5D2" />

      {/* casitas en la ladera */}
      <g>
        <rect x="52" y="286" width="26" height="16" fill="#FFFFFF" /><path d="M49 287 L65 276 L81 287 Z" fill="#E7806B" />
        <rect x="92" y="290" width="20" height="13" fill="#FFF3D6" /><path d="M89 291 L102 282 L115 291 Z" fill="#D86B5A" />
        <rect x="508" y="278" width="24" height="15" fill="#FFFFFF" /><path d="M505 279 L520 269 L535 279 Z" fill="#E7806B" />
        <rect x="548" y="283" width="19" height="12" fill="#FFF3D6" /><path d="M545 284 L557.500 275 L570 284 Z" fill="#D86B5A" />
        {/* campanario de la catedral */}
        <rect x="316" y="252" width="22" height="40" fill="#F4EBDD" />
        <path d="M313 253 L327 233 L341 253 Z" fill="#C9B79A" />
        <rect x="322" y="262" width="10" height="14" rx="5" fill="#C9B79A" />
      </g>

      {/* río Huallaga */}
      <path d="M0 322 L640 322 L640 372 L0 372 Z" fill="url(#rio)" />
      <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity=".7">
        <path d="M40 340 h38" /><path d="M150 352 h52" /><path d="M280 338 h34" />
        <path d="M410 350 h58" /><path d="M540 340 h40" />
      </g>

      {/* puente de arcos de piedra */}
      <g>
        <rect x="120" y="296" width="400" height="22" fill="#EAD9BC" />
        <rect x="120" y="290" width="400" height="8" fill="#D9C39C" />
        <path d="M130 318 H510 V348 H130 Z" fill="#E2CFA9" />
        <path d="M150 348 V334 a34 34 0 0 1 68 0 V348 Z" fill="#8DBBEF" />
        <path d="M286 348 V334 a34 34 0 0 1 68 0 V348 Z" fill="#8DBBEF" />
        <path d="M422 348 V334 a34 34 0 0 1 68 0 V348 Z" fill="#8DBBEF" />
        <path d="M150 334 a34 34 0 0 1 68 0 M286 334 a34 34 0 0 1 68 0 M422 334 a34 34 0 0 1 68 0" fill="none" stroke="#C7AE82" strokeWidth="4" />
      </g>

      {/* calle */}
      <rect x="0" y="372" width="640" height="68" fill="#9AA6BC" />
      <rect x="0" y="372" width="640" height="6" fill="#FFFFFF" opacity=".7" />
      <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="34 26">
        <path d="M-10 418 H650" />
      </g>

      {/* árboles */}
      <g>
        <rect x="582" y="340" width="6" height="32" fill="#8B6B4E" /><circle cx="585" cy="332" r="20" fill="#7DBE92" /><circle cx="598" cy="344" r="13" fill="#6BB083" />
        <rect x="38" y="344" width="6" height="28" fill="#8B6B4E" /><circle cx="41" cy="336" r="17" fill="#7DBE92" /><circle cx="28" cy="347" r="11" fill="#6BB083" />
      </g>

      {/* taxi SafO */}
      <g transform="translate(205 318)">
        <ellipse cx="118" cy="108" rx="112" ry="9" fill="#14213D" opacity=".18" />
        {/* cabina */}
        <path d="M58 52 L84 14 H162 L192 52 Z" fill="#FFC21A" />
        <path d="M70 50 L90 21 H120 V50 Z" fill="#CFE6FF" />
        <path d="M128 50 V21 H158 L180 50 Z" fill="#CFE6FF" />
        {/* cartel TAXI */}
        <rect x="104" y="2" width="48" height="14" rx="3" fill="#FFFFFF" stroke="#14213D" strokeWidth="2" />
        <text x="128" y="13" textAnchor="middle" fontSize="10" fontWeight="800" fill="#14213D" fontFamily="Arial, sans-serif">TAXI</text>
        {/* carrocería */}
        <path d="M16 78 Q16 54 42 52 H208 Q236 56 238 82 V92 H16 Z" fill="#FFC21A" />
        <rect x="16" y="86" width="222" height="8" fill="#E5A800" />
        {/* franja de cuadros */}
        <g fill="#14213D">
          <rect x="30" y="68" width="8" height="8" /><rect x="46" y="68" width="8" height="8" /><rect x="62" y="68" width="8" height="8" />
          <rect x="38" y="60" width="8" height="8" /><rect x="54" y="60" width="8" height="8" />
        </g>
        {/* logo SafO en la puerta */}
        <circle cx="132" cy="72" r="13" fill="#0A66E0" />
        <text x="132" y="76" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF" fontFamily="Arial, sans-serif">S</text>
        <rect x="108" y="60" width="2" height="30" fill="#E5A800" />
        {/* faros */}
        <rect x="228" y="64" width="12" height="9" rx="3" fill="#FFF7CC" />
        <rect x="14" y="66" width="8" height="9" rx="3" fill="#E7806B" />
        {/* ruedas */}
        <circle cx="62" cy="96" r="19" fill="#14213D" /><circle cx="62" cy="96" r="8" fill="#DDE5F2" />
        <circle cx="194" cy="96" r="19" fill="#14213D" /><circle cx="194" cy="96" r="8" fill="#DDE5F2" />
      </g>
    </svg>
  )
}
