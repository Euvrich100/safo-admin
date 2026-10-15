'use client'
import { useState } from 'react'

// Gráficos livianos hechos con SVG (sin librerías). Colores SafO.
export const COLORES = { amarillo: '#FFC21A', azul: '#0A66E0', marino: '#14213D', verde: '#6E6E73', rojo: '#D92D20', gris: '#A1A1A6' }

// Línea doble: reservas vs completados por día, con eje, cuadrícula y tooltip al pasar el mouse
export function LineaDoble({ datos, alto = 220 }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = alto, M = { t: 14, r: 12, b: 28, l: 34 }
  const n = datos.length
  const maxV = Math.max(4, ...datos.map(d => Math.max(d.reservas, d.completados)))
  const techo = Math.ceil(maxV / 4) * 4
  const x = (i) => M.l + (n <= 1 ? 0 : (i * (W - M.l - M.r)) / (n - 1))
  const y = (v) => M.t + (H - M.t - M.b) * (1 - v / techo)
  const linea = (k) => datos.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(' ')
  const area = `${linea('reservas')} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const paso = Math.max(1, Math.ceil(n / 7))
  const etiqueta = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}` }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Reservas y viajes completados por día">
        {[0, 1, 2, 3, 4].map(i => {
          const v = (techo / 4) * i
          return (
            <g key={i}>
              <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="#EDEFF4" />
              <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8A8F9C">{Math.round(v)}</text>
            </g>
          )
        })}
        <path d={area} fill={COLORES.amarillo} opacity="0.14" />
        <path d={linea('reservas')} fill="none" stroke={COLORES.marino} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={linea('completados')} fill="none" stroke={COLORES.amarillo} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {datos.map((d, i) => (
          <g key={d.dia}>
            {i % paso === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#8A8F9C">{etiqueta(d.dia)}</text>}
            <circle cx={x(i)} cy={y(d.reservas)} r={hover === i ? 5 : 3} fill={COLORES.marino} />
            <circle cx={x(i)} cy={y(d.completados)} r={hover === i ? 5 : 3} fill={COLORES.amarillo} />
            <rect x={x(i) - (W - M.l - M.r) / Math.max(1, n - 1) / 2} y={M.t} width={(W - M.l - M.r) / Math.max(1, n - 1)} height={H - M.t - M.b}
              fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute pointer-events-none px-3 py-2 rounded-lg bg-[#14213D] text-white text-xs shadow-lg -translate-x-1/2"
          style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}>
          <div className="font-semibold mb-0.5">{etiqueta(datos[hover].dia)}</div>
          <div><span className="inline-block w-2 h-2 rounded-full bg-white mr-1.5" />Reservas: {datos[hover].reservas}</div>
          <div><span className="inline-block w-2 h-2 rounded-full bg-[#FFC21A] mr-1.5" />Completados: {datos[hover].completados}</div>
        </div>
      )}
    </div>
  )
}

// Dona: reparto de viajes por estado
export function Dona({ partes, centroTitulo, centroValor, tam = 170 }) {
  const total = partes.reduce((a, p) => a + p.valor, 0)
  const R = 62, C = 2 * Math.PI * R
  let acum = 0
  return (
    <svg viewBox="0 0 170 170" width={tam} height={tam} role="img" aria-label="Viajes por estado">
      <circle cx="85" cy="85" r={R} fill="none" stroke="#EDEFF4" strokeWidth="20" />
      {total > 0 && partes.map((p) => {
        const largo = (p.valor / total) * C
        const el = (
          <circle key={p.nombre} cx="85" cy="85" r={R} fill="none" stroke={p.color} strokeWidth="20"
            strokeDasharray={`${Math.max(0, largo - (partes.filter(q => q.valor > 0).length > 1 ? 2 : 0))} ${C}`}
            strokeDashoffset={-acum} transform="rotate(-90 85 85)" />
        )
        acum += largo
        return el
      })}
      <text x="85" y="82" textAnchor="middle" fontSize="12" fill="#6E6E73">{centroTitulo}</text>
      <text x="85" y="104" textAnchor="middle" fontSize="26" fontWeight="700" fill="#14213D">{centroValor}</text>
    </svg>
  )
}

// Mini línea de tendencia para las tarjetas de KPI
export function Spark({ valores, color = COLORES.amarillo, ancho = 84, alto = 28 }) {
  const max = Math.max(1, ...valores), min = Math.min(0, ...valores)
  const n = valores.length
  if (n < 2) return null
  const pts = valores.map((v, i) => `${((i * (ancho - 2)) / (n - 1) + 1).toFixed(1)},${(alto - 3 - ((v - min) / (max - min || 1)) * (alto - 6)).toFixed(1)}`).join(' ')
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
