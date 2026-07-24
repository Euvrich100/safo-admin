export default function SafoLogo({ size = 40, showText = false }) {
  return (
    <div className="flex items-center gap-2">
      {/* Logo SVG recreado de la imagen original */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Fondo azul redondeado */}
        <rect width="100" height="100" rx="22" fill="#1A6EFF"/>
        {/* Letra S */}
        <text x="8" y="68" fontSize="62" fontWeight="900" fill="white" fontFamily="Arial Rounded MT Bold, Arial, sans-serif">S</text>
        {/* Letra a */}
        <text x="32" y="68" fontSize="52" fontWeight="900" fill="white" fontFamily="Arial Rounded MT Bold, Arial, sans-serif">a</text>
        {/* Letra f */}
        <text x="54" y="68" fontSize="52" fontWeight="900" fill="white" fontFamily="Arial Rounded MT Bold, Arial, sans-serif">f</text>
        {/* Círculo O (cara) */}
        <circle cx="82" cy="50" r="16" fill="white"/>
        {/* Ojo izquierdo (guiño — línea curva) */}
        <path d="M75 45 Q77 42 79 45" stroke="#111" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* Ojo derecho */}
        <circle cx="87" cy="44" r="3" fill="#111"/>
        <circle cx="88" cy="43" r="1" fill="white"/>
        {/* Sonrisa */}
        <path d="M75 54 Q82 60 89 54" stroke="#111" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* Cachetes rosados */}
        <ellipse cx="73" cy="56" rx="4" ry="2.5" fill="#FFB3C6" opacity="0.8"/>
        <ellipse cx="91" cy="56" rx="4" ry="2.5" fill="#FFB3C6" opacity="0.8"/>
      </svg>
      {showText && (
        <span className="font-black text-white text-xl tracking-tight">
          Saf<span className="text-[#1A6EFF]">O</span>
        </span>
      )}
    </div>
  )
}