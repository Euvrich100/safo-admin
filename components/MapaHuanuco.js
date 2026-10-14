'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

// Mapa de referencia de Huánuco (centro: Plaza de Armas), con mosaicos de
// OpenStreetMap: gratis y sin API key. Debajo hay un dibujo simple de calles y
// río que se ve mientras cargan los mosaicos o si no hay internet.
export const PLAZA = [-9.9306, -76.2422]
export const MAPA_URL = `https://www.openstreetmap.org/?mlat=${PLAZA[0]}&mlon=${PLAZA[1]}#map=16/${PLAZA[0]}/${PLAZA[1]}`

export default function MapaHuanuco({ className = 'relative', interactivo = false, zoom = 15, centro = PLAZA }) {
  const contenedor = useRef(null)
  const [lat, lng] = centro

  useEffect(() => {
    let mapa
    let cancelado = false

    import('leaflet').then((modulo) => {
      const L = modulo.default || modulo
      if (cancelado || !contenedor.current) return

      mapa = L.map(contenedor.current, {
        center: [lat, lng],
        zoom,
        zoomControl: interactivo,
        dragging: interactivo,
        touchZoom: interactivo,
        doubleClickZoom: interactivo,
        boxZoom: false,
        keyboard: false,
        scrollWheelZoom: false, // no atrapa el scroll de la página
      })

      mapa.attributionControl.setPrefix(false) // sin el prefijo "Leaflet"; se conserva © OpenStreetMap

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(mapa)

      L.marker(PLAZA, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: 'safo-pin-wrap', html: '<span class="safo-pin"></span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
      }).addTo(mapa)
    })

    return () => {
      cancelado = true
      if (mapa) mapa.remove()
    }
  }, [interactivo, zoom, lat, lng])

  return (
    <div className={`mapa-suave overflow-hidden bg-[#EEF3F8] ${className}`}>
      {/* Respaldo: calles y río dibujados */}
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <rect width="800" height="500" fill="#F1F5F9" />
        <path d="M-20 330 C120 290 220 360 360 330 S620 250 820 290 V380 C640 340 520 420 360 400 S110 350 -20 400 Z" fill="#CFE3F8" />
        <g stroke="#FFFFFF" strokeWidth="9" fill="none" strokeLinecap="round">
          <path d="M40 60 L760 120" /><path d="M20 190 L780 250" /><path d="M80 440 L720 470" />
          <path d="M160 20 L220 480" /><path d="M360 10 L420 490" /><path d="M560 20 L620 480" /><path d="M700 40 L740 470" />
        </g>
        <g stroke="#E3EAF2" strokeWidth="3" fill="none">
          <path d="M100 120 L130 330" /><path d="M280 30 L320 450" /><path d="M470 30 L510 440" /><path d="M20 130 L780 185" />
        </g>
        <rect x="372" y="168" width="52" height="40" rx="6" fill="#D5EBDD" />
      </svg>
      <div ref={contenedor} className="absolute inset-0" role="img" aria-label="Mapa del centro de Huánuco" />
    </div>
  )
}
