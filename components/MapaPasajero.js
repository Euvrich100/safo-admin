'use client'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { faTaxi, faFlagCheckered } from '@fortawesome/free-solid-svg-icons'

// Mapa interactivo del pasajero (OpenStreetMap + Leaflet, sin API key):
//  - pin azul = punto de recojo (arrastrable; tocar el mapa lo mueve)
//  - bandera = destino (arrastrable)
//  - taxis amarillos = conductores disponibles (tocar uno lo elige)
//  - línea azul = ruta al destino · círculo = radio de búsqueda
const svg = (icono) => {
  const [ancho, alto, , , trazo] = icono.icon
  return `<svg viewBox="0 0 ${ancho} ${alto}" fill="currentColor" aria-hidden="true"><path d="${trazo}"/></svg>`
}
const TAXI_SVG = svg(faTaxi)
const BANDERA_SVG = svg(faFlagCheckered)

const valido = (p) => Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1]))

export default function MapaPasajero({
  className = '',
  centro,                 // [lat, lng] punto de recojo
  destino = null,         // [lat, lng] o null
  ruta = null,            // [[lat, lng], ...] o null
  conductores = [],       // [{ id, nombre, lat_actual, lng_actual }]
  seleccionadoId = null,
  onSeleccionar,
  onMover,                // ([lat, lng]) el pasajero movió el recojo
  onMoverDestino,         // ([lat, lng]) el pasajero movió el destino
  modoDestino = false,    // true: tocar el mapa mueve el destino en vez del recojo
  radioKm = 5,
  zonas = [],             // zonas de servicio [{ lat, lng, radio_km, activa }]
  conductorViaje = null,  // { lat, lng, nombre } mientras hay un viaje en curso
  ajustarKey = 0,         // al cambiar, el mapa se ajusta para ver todo
}) {
  const contenedor = useRef(null)
  const estado = useRef({ L: null, mapa: null, yo: null, bandera: null, linea: null, circulo: null, taxis: new Map(), viaje: null, zonasCapa: null, ultimoAjuste: -1 })
  const cb = useRef({})
  useEffect(() => { cb.current = { onSeleccionar, onMover, onMoverDestino, modoDestino } })

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
        draggable: true, zIndexOffset: 1000, title: 'Punto de recojo (arrástralo)',
        icon: L.divIcon({ className: 'safo-yo-wrap', html: '<span class="safo-yo"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(st.mapa)
      st.yo.on('dragend', () => { const p = st.yo.getLatLng(); cb.current.onMover?.([p.lat, p.lng]) })

      st.mapa.on('click', (e) => {
        const p = [e.latlng.lat, e.latlng.lng]
        if (cb.current.modoDestino) cb.current.onMoverDestino?.(p)
        else cb.current.onMover?.(p)
      })
      st.zonasCapa = L.layerGroup().addTo(st.mapa)
      st.circulo = L.circle(centro, { radius: radioKm * 1000, color: '#0A66E0', weight: 1, fillColor: '#0A66E0', fillOpacity: 0.05, interactive: false }).addTo(st.mapa)
      st.listo?.()
    })
    return () => {
      cancelado = true
      if (st.mapa) { st.mapa.stop(); st.mapa.off(); st.mapa.remove() }
      Object.assign(st, { L: null, mapa: null, yo: null, bandera: null, linea: null, circulo: null, viaje: null, zonasCapa: null, ultimoAjuste: -1 })
      st.taxis = new Map()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincronizar pin, destino, ruta, círculo y taxis con las props
  useEffect(() => {
    const st = estado.current
    const sincronizar = () => {
      const { L, mapa } = st
      if (!L || !mapa) return
      st.yo.setLatLng(centro)
      st.circulo.setLatLng(centro).setRadius(radioKm * 1000)

      // zonas de servicio (contorno discontinuo)
      st.zonasCapa?.clearLayers()
      zonas.forEach((z) => {
        if (z.activa === false || !valido([z.lat, z.lng])) return
        L.circle([Number(z.lat), Number(z.lng)], { radius: Number(z.radio_km) * 1000, color: '#1E8E3E', weight: 2, dashArray: '8 8', fillColor: '#1E8E3E', fillOpacity: 0.03, interactive: false }).addTo(st.zonasCapa)
      })

      // destino
      if (valido(destino)) {
        if (!st.bandera) {
          st.bandera = L.marker(destino, {
            draggable: true, zIndexOffset: 900, title: 'Destino (arrástralo)',
            icon: L.divIcon({ className: 'safo-taxi-wrap', html: `<span class="safo-bandera">${BANDERA_SVG}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }),
          }).addTo(mapa)
          st.bandera.on('dragend', () => { const p = st.bandera.getLatLng(); cb.current.onMoverDestino?.([p.lat, p.lng]) })
        } else st.bandera.setLatLng(destino)
      } else if (st.bandera) { st.bandera.remove(); st.bandera = null }

      // ruta
      if (Array.isArray(ruta) && ruta.length > 1) {
        if (!st.linea) st.linea = L.polyline(ruta, { color: '#0A66E0', weight: 5, opacity: 0.85, lineJoin: 'round' }).addTo(mapa)
        else st.linea.setLatLngs(ruta)
      } else if (st.linea) { st.linea.remove(); st.linea = null }

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
        conductores.forEach((c) => { if (valido([c.lat_actual, c.lng_actual])) puntos.push([Number(c.lat_actual), Number(c.lng_actual)]) })
        if (valido(destino)) puntos.push(destino)
        if (conductorViaje && valido([conductorViaje.lat, conductorViaje.lng])) puntos.push([Number(conductorViaje.lat), Number(conductorViaje.lng)])
        if (puntos.length > 1) mapa.fitBounds(L.latLngBounds(puntos), { padding: [50, 50], maxZoom: 16, animate: false })
        else mapa.setView(centro, 15, { animate: false })
      }
    }
    if (st.mapa) sincronizar()
    else st.listo = sincronizar
  }, [centro, destino, ruta, conductores, seleccionadoId, radioKm, conductorViaje, ajustarKey, zonas])

  // Cursor de cruz cuando se está eligiendo el destino
  useEffect(() => { if (contenedor.current) contenedor.current.style.cursor = modoDestino ? 'crosshair' : '' }, [modoDestino])

  return <div ref={contenedor} className={`mapa-suave bg-[#EEF3F8] ${className}`} />
}
