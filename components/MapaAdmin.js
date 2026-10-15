'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { faTaxi, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

// Mapa del administrador (OpenStreetMap + Leaflet, sin API key):
//  - taxis verdes = conductores disponibles · amarillos = en viaje
//  - punto azul + línea punteada = viaje activo (recojo → destino)
//  - círculo rojo pulsante = alerta SOS activa
//  - círculos de color = zonas de servicio
const svg = (icono) => {
  const [ancho, alto, , , trazo] = icono.icon
  return `<svg viewBox="0 0 ${ancho} ${alto}" fill="currentColor" aria-hidden="true"><path d="${trazo}"/></svg>`
}
const TAXI_SVG = svg(faTaxi)
const ALERTA_SVG = svg(faTriangleExclamation)

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v))
const valido = (a, b) => Number.isFinite(num(a)) && Number.isFinite(num(b))

const CENTRO_HUANUCO = [-9.9306, -76.2422]

export default function MapaAdmin({
  className = '',
  conductores = [],
  viajes = [],
  sos = [],
  zonas = [],
  onClickMapa,            // ([lat, lng]) para elegir el centro de una zona
  ajustarKey = 0,
  marcador = null,        // [lat, lng] punto temporal (zona que se está creando)
}) {
  const contenedor = useRef(null)
  const st = useRef({ L: null, mapa: null, capa: null, zonasCapa: null, ultimoAjuste: -1, listo: null })
  const cb = useRef({})
  useEffect(() => { cb.current = { onClickMapa } })

  useEffect(() => {
    let cancelado = false
    const s = st.current
    import('leaflet').then((m) => {
      const L = m.default || m
      if (cancelado || !contenedor.current) return
      s.L = L
      s.mapa = L.map(contenedor.current, { center: CENTRO_HUANUCO, zoom: 13, zoomControl: false })
      L.control.zoom({ position: 'bottomright' }).addTo(s.mapa)
      s.mapa.attributionControl.setPrefix(false)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(s.mapa)
      s.zonasCapa = L.layerGroup().addTo(s.mapa)
      s.capa = L.layerGroup().addTo(s.mapa)
      s.mapa.on('click', (e) => cb.current.onClickMapa?.([e.latlng.lat, e.latlng.lng]))
      s.listo?.()
    })
    return () => {
      cancelado = true
      if (s.mapa) { s.mapa.stop(); s.mapa.off(); s.mapa.remove() }
      Object.assign(s, { L: null, mapa: null, capa: null, zonasCapa: null, ultimoAjuste: -1 })
    }
  }, [])

  useEffect(() => {
    const s = st.current
    const dibujar = () => {
      const { L, mapa, capa, zonasCapa } = s
      if (!L || !mapa) return
      zonasCapa.clearLayers()
      capa.clearLayers()
      const puntos = []

      zonas.forEach((z) => {
        if (!valido(z.lat, z.lng)) return
        const color = z.activa === false ? '#A1A1A6' : '#0A66E0'
        L.circle([num(z.lat), num(z.lng)], {
          radius: num(z.radio_km) * 1000, color, weight: 2, dashArray: z.activa === false ? '6 6' : null,
          fillColor: color, fillOpacity: 0.06, interactive: false,
        }).addTo(zonasCapa)
        L.circle([num(z.lat), num(z.lng)], { radius: 1, color, weight: 0, interactive: false })
          .bindTooltip(esc(z.nombre), { permanent: true, direction: 'center', className: 'safo-zona-etiqueta' }).addTo(zonasCapa)
      })

      viajes.forEach((v) => {
        if (!valido(v.lat_origen, v.lng_origen)) return
        const o = [num(v.lat_origen), num(v.lng_origen)]
        puntos.push(o)
        L.marker(o, { icon: L.divIcon({ className: 'safo-yo-wrap', html: '<span class="safo-origen"></span>', iconSize: [16, 16], iconAnchor: [8, 8] }) })
          .bindPopup(`<b>Viaje ${esc(String(v.estado).replace('_', ' '))}</b><br>${esc(v.pasajero_nombre)} → ${esc(v.conductor_nombre)}<br>${esc(v.direccion_origen || '')}${v.direccion_destino ? ' → ' + esc(v.direccion_destino) : ''}`)
          .addTo(capa)
        if (valido(v.lat_destino, v.lng_destino)) {
          L.polyline([o, [num(v.lat_destino), num(v.lng_destino)]], { color: '#0A66E0', weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(capa)
        }
      })

      conductores.forEach((c) => {
        if (!valido(c.lat, c.lng)) return
        const p = [num(c.lat), num(c.lng)]
        puntos.push(p)
        L.marker(p, {
          title: c.nombre,
          icon: L.divIcon({ className: 'safo-taxi-wrap', html: `<span class="safo-taxi ${c.en_viaje ? 'viaje' : 'libre'}">${TAXI_SVG}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
        })
          .bindPopup(`<b>${esc(c.nombre)}</b><br>${esc([c.vehiculo_marca, c.vehiculo_modelo, c.vehiculo_color].filter(Boolean).join(' '))}<br>Placa ${esc(c.placa)}<br>${c.en_viaje ? 'En viaje' : 'Disponible'}`)
          .addTo(capa)
      })

      sos.forEach((a) => {
        if (!valido(a.lat, a.lng)) return
        const p = [num(a.lat), num(a.lng)]
        puntos.push(p)
        L.marker(p, {
          zIndexOffset: 2000,
          icon: L.divIcon({ className: 'safo-sos-wrap', html: `<span class="safo-sos">${ALERTA_SVG}</span>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
        })
          .bindPopup(`<b style="color:#D92D20">SOS · ${esc(a.rol)}</b><br>${esc(a.nombre)} · ${esc(a.celular)}<br>${esc(a.mensaje || 'Sin mensaje')}`)
          .addTo(capa)
      })

      if (valido(marcador?.[0], marcador?.[1])) {
        L.marker(marcador, { icon: L.divIcon({ className: 'safo-yo-wrap', html: '<span class="safo-yo"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(capa)
      }

      if (s.ultimoAjuste !== ajustarKey) {
        s.ultimoAjuste = ajustarKey
        if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [60, 60], maxZoom: 15, animate: false })
        else if (puntos.length === 1) mapa.setView(puntos[0], 15, { animate: false })
        else if (zonas.length > 0) {
          // Sin taxis ni viajes: encuadrar las zonas de servicio completas
          const cajas = zonas.filter(z => valido(z.lat, z.lng))
            .map(z => L.latLng(num(z.lat), num(z.lng)).toBounds(num(z.radio_km) * 2000))
          if (cajas.length > 0) mapa.fitBounds(cajas.reduce((a, b) => a.extend(b)), { padding: [20, 20], animate: false })
        }
      }
    }
    if (s.mapa) dibujar()
    else s.listo = dibujar
  }, [conductores, viajes, sos, zonas, marcador, ajustarKey])

  useEffect(() => { if (contenedor.current) contenedor.current.style.cursor = onClickMapa ? 'crosshair' : '' }, [onClickMapa])

  return <div ref={contenedor} className={`mapa-suave bg-[#EEF3F8] ${className}`} />
}
