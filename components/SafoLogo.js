import Image from 'next/image'

// Ícono cuadrado oficial de SafO (fondo azul, "Saf" + carita) — funciona
// solo sobre cualquier fondo, como el ícono de Apple en su propio navbar.
export default function SafoLogo({ size = 32, showText = false, className = '', priority = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="overflow-hidden shrink-0" style={{ width: size, height: size, borderRadius: size * 0.22 }}>
        <Image src="/logo-square.png" alt="SafO" width={size} height={size} priority={priority} />
      </div>
      {showText && (
        <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.6, color: '#1D1D1F' }}>
          SafO
        </span>
      )}
    </div>
  )
}
