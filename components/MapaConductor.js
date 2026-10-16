'use client'
import { agregarMapaBase } from '@/lib/mapaBase'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { iconoVehiculo, svgDe } from '@/lib/vehiculos'

// Mapa del conductor (OpenStreetMap + Leaflet, sin API key):
//  - taxi = mi posición (se mueve con el GPS)
//  - punto azul = pasajero (punto de recojo) · bandera = destino
//  - línea azul = ruta de la fase actual (hacia el recojo o hacia el destino)
const svg = (icono) => {
  const [ancho, alto, , , trazo] = icono.icon
  return `<svg viewBox="0 0 ${ancho} ${alto}" fill="currentColor" aria-hidden="true"><path d="${trazo}"/></svg>`
}
const BANDERA_SVG = svg(faFlagCheckered)
const valido = (p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))

export default function MapaConductor({ className = '', tipo = 'taxi', yo = null, recojo = null, destino = null, ruta = null, ajustarKey = 0 }) {
  const contenedor = useRef(null)
  const st = useRef({ L: null, mapa: null, yo: null, recojo: null, destino: null, linea: null, ultimoAjuste: -1, listo: null })

  useEffect(() => {
    let cancelado = false
    const s = st.current
    import('leaflet').then((m) => {
      const L = m.default || m
      if (cancelado || !contenedor.current) return
      s.L = L
      s.mapa = L.map(contenedor.current, { center: valido(yo) ? yo : [-9.9306, -76.2422], zoom: 15, zoomControl: false })
      L.control.zoom({ position: 'bottomright' }).addTo(s.mapa)
      s.mapa.attributionControl.setPrefix(false)
      agregarMapaBase(L, s.mapa)
      s.listo?.()
    })
    return () => {
      cancelado = true
      if (s.mapa) { s.mapa.stop(); s.mapa.off(); s.mapa.remove() }
      Object.assign(s, { L: null, mapa: null, yo: null, recojo: null, destino: null, linea: null, ultimoAjuste: -1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const s = st.current
    const dibujar = () => {
      const { L, mapa } = s
      if (!L || !mapa) return

      if (valido(yo)) {
        if (!s.yo) {
          s.yo = L.marker(yo, {
            zIndexOffset: 1000, title: 'Mi posición',
            icon: L.divIcon({ className: 'safo-taxi-wrap', html: `<span class="safo-taxi sel">${svgDe(iconoVehiculo(tipo))}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
          }).addTo(mapa)
        } else s.yo.setLatLng(yo)
      } else if (s.yo) { s.yo.remove(); s.yo = null }

      const pin = (clave, pos, html, tam, titulo) => {
        if (valido(pos)) {
          if (!s[clave]) {
            s[clave] = L.marker(pos, { title: titulo, icon: L.divIcon({ className: 'safo-yo-wrap', html, iconSize: tam, iconAnchor: [tam[0] / 2, tam[1] / 2] }) }).addTo(mapa)
          } else s[clave].setLatLng(pos)
        } else if (s[clave]) { s[clave].remove(); s[clave] = null }
      }
      pin('recojo', recojo, '<span class="safo-yo"></span>', [22, 22], 'Pasajero')
      pin('destino', destino, `<span class="safo-bandera">${BANDERA_SVG}</span>`, [38, 38], 'Destino')

      if (Array.isArray(ruta) && ruta.length > 1) {
        if (!s.linea) s.linea = L.polyline(ruta, { color: '#0A66E0', weight: 5, opacity: 0.85, lineJoin: 'round' }).addTo(mapa)
        else s.linea.setLatLngs(ruta)
      } else if (s.linea) { s.linea.remove(); s.linea = null }

      if (s.ultimoAjuste !== ajustarKey) {
        s.ultimoAjuste = ajustarKey
        const puntos = [yo, recojo, destino].filter(valido).map(p => [Number(p[0]), Number(p[1])])
        if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [50, 50], maxZoom: 16, animate: false })
        else if (puntos.length === 1) mapa.setView(puntos[0], 15, { animate: false })
      }
    }
    if (s.mapa) dibujar()
    else s.listo = dibujar
  }, [yo, recojo, destino, ruta, ajustarKey])

  return <div ref={contenedor} className={`mapa-suave bg-[#EEF3F8] ${className}`} />
}
