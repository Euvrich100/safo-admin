'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { faTaxi } from '@fortawesome/free-solid-svg-icons'

// Mapa interactivo del pasajero (OpenStreetMap + Leaflet, sin API key):
//  - pin azul = el pasajero (se puede arrastrar o tocar el mapa para moverlo)
//  - taxis amarillos = conductores disponibles cerca (tocar uno lo elige)
//  - círculo = radio de búsqueda
const [ancho, alto, , , trazo] = faTaxi.icon
const TAXI_SVG = `<svg viewBox="0 0 ${ancho} ${alto}" fill="currentColor" aria-hidden="true"><path d="${trazo}"/></svg>`

export default function MapaPasajero({
  className = '',
  centro,                 // [lat, lng] del pasajero
  conductores = [],       // [{ id, nombre, lat_actual, lng_actual }]
  seleccionadoId = null,
  onSeleccionar,
  onMover,                // ([lat, lng]) cuando el pasajero mueve su pin
  radioKm = 5,
  conductorViaje = null,  // { lat, lng, nombre } mientras hay un viaje en curso
  ajustarKey = 0,         // al cambiar, el mapa se ajusta para ver todo
}) {
  const contenedor = useRef(null)
  const estado = useRef({ L: null, mapa: null, yo: null, circulo: null, taxis: new Map(), viaje: null, ultimoAjuste: -1 })
  const cb = useRef({ onSeleccionar, onMover })
  useEffect(() => { cb.current = { onSeleccionar, onMover } })

  // Crear el mapa una sola vez
  useEffect(() => {
    let cancelado = false
    const st = estado.current
    import('leaflet').then((modulo) => {
      const L = modulo.default || modulo
      if (cancelado || !contenedor.current) return
      st.L = L
      st.mapa = L.map(contenedor.current, { center: centro, zoom: 15, zoomControl: false, scrollWheelZoom: true })
      L.control.zoom({ position: 'bottomright' }).addTo(st.mapa)
      st.mapa.attributionControl.setPrefix(false)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(st.mapa)

      st.yo = L.marker(centro, {
        draggable: true,
        zIndexOffset: 1000,
        title: 'Tu punto de recojo (arrástralo)',
        icon: L.divIcon({ className: 'safo-yo-wrap', html: '<span class="safo-yo"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(st.mapa)
      st.yo.on('dragend', () => { const p = st.yo.getLatLng(); cb.current.onMover?.([p.lat, p.lng]) })
      st.mapa.on('click', (e) => { cb.current.onMover?.([e.latlng.lat, e.latlng.lng]) })
      st.circulo = L.circle(centro, { radius: radioKm * 1000, color: '#0A66E0', weight: 1, fillColor: '#0A66E0', fillOpacity: 0.05, interactive: false }).addTo(st.mapa)
      st.listo?.()
    })
    return () => {
      cancelado = true
      if (st.mapa) st.mapa.remove()
      Object.assign(st, { L: null, mapa: null, yo: null, circulo: null, viaje: null, ultimoAjuste: -1 })
      st.taxis = new Map()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronizar pin, círculo y taxis con las props
  useEffect(() => {
    const st = estado.current
    const sincronizar = () => {
      const { L, mapa } = st
      if (!L || !mapa) return
      st.yo.setLatLng(centro)
      st.circulo.setLatLng(centro).setRadius(radioKm * 1000)

      // taxis
      const vigentes = new Set()
      conductores.forEach((c) => {
        const lat = Number(c.lat_actual), lng = Number(c.lng_actual)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        vigentes.add(c.id)
        const sel = c.id === seleccionadoId
        const icono = L.divIcon({
          className: 'safo-taxi-wrap',
          html: `<span class="safo-taxi${sel ? ' sel' : ''}">${TAXI_SVG}</span>`,
          iconSize: [38, 38], iconAnchor: [19, 19],
        })
        let m = st.taxis.get(c.id)
        if (!m) {
          m = L.marker([lat, lng], { icon: icono, title: c.nombre }).addTo(mapa)
          m.on('click', () => cb.current.onSeleccionar?.(c.id))
          st.taxis.set(c.id, m)
        } else {
          m.setLatLng([lat, lng]); m.setIcon(icono); m.setZIndexOffset(sel ? 500 : 0)
        }
      })
      st.taxis.forEach((m, id) => { if (!vigentes.has(id)) { m.remove(); st.taxis.delete(id) } })

      // conductor del viaje en curso
      if (conductorViaje && Number.isFinite(Number(conductorViaje.lat)) && Number.isFinite(Number(conductorViaje.lng))) {
        const pos = [Number(conductorViaje.lat), Number(conductorViaje.lng)]
        const icono = L.divIcon({ className: 'safo-taxi-wrap', html: `<span class="safo-taxi sel">${TAXI_SVG}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] })
        if (!st.viaje) st.viaje = L.marker(pos, { icon: icono, title: conductorViaje.nombre }).addTo(mapa)
        else st.viaje.setLatLng(pos)
      } else if (st.viaje) { st.viaje.remove(); st.viaje = null }

      // Ajustar la vista cuando cambia ajustarKey
      if (st.ultimoAjuste !== ajustarKey) {
        st.ultimoAjuste = ajustarKey
        const puntos = [centro]
        conductores.forEach((c) => { if (Number.isFinite(Number(c.lat_actual)) && Number.isFinite(Number(c.lng_actual))) puntos.push([Number(c.lat_actual), Number(c.lng_actual)]) })
        if (conductorViaje && Number.isFinite(Number(conductorViaje.lat))) puntos.push([Number(conductorViaje.lat), Number(conductorViaje.lng)])
        if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [50, 50], maxZoom: 16 })
        else mapa.setView(centro, 15)
      }
    }
    if (st.mapa) sincronizar()
    else st.listo = sincronizar
  }, [centro, conductores, seleccionadoId, radioKm, conductorViaje, ajustarKey])

  return <div ref={contenedor} className={`mapa-suave bg-[#EEF3F8] ${className}`} />
}
