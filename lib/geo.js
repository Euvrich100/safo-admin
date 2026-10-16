// Utilidades de mapas sin API key: búsqueda de direcciones (Nominatim),
// rutas (OSRM) y cálculos de distancia. Servicios públicos y gratuitos de
// OpenStreetMap: pensados para uso liviano.

import { CIUDAD } from '@/lib/ciudad'

// Un taxi es un auto, no una moto: en la ciudad no pasa de ~40 km/h y promedia bastante menos por
// giros, cruces y semáforos. El valor real lo fija el administrador (ajustes públicos).
export const VELOCIDAD_MAX_KMH = 40
const EFICIENCIA_URBANA = 0.7 // velocidad media ≈ 70 % del tope

const rad = (g) => (g * Math.PI) / 180

export const distanciaKm = (a, b) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Minutos aproximados para recorrer una distancia en línea recta por las calles de la ciudad.
// `factor` es la demora por tráfico del momento (1 = calle despejada).
export const minutosPara = (km, { vmax = VELOCIDAD_MAX_KMH, factor = 1 } = {}) =>
  Math.max(1, Math.round(((km * 1.3) / (vmax * EFICIENCIA_URBANA)) * 60 * factor))

const conTiempoLimite = async (url, signal, ms = 7000) => {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  signal?.addEventListener('abort', () => ctl.abort())
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(t)
  }
}

// "Mercado Modelo" → [{ nombre, detalle, lat, lng }]
export async function buscarLugares(texto, signal) {
  const q = texto.trim()
  if (q.length < 3) return []
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=es'
    + `&countrycodes=${CIUDAD.codigoPais}&viewbox=${CIUDAD.viewbox}&bounded=1&q=${encodeURIComponent(q + ' ' + CIUDAD.nombre)}`
  const data = await conTiempoLimite(url, signal)
  return data.map((d) => {
    const partes = String(d.display_name || '').split(',').map((s) => s.trim())
    return {
      nombre: d.name || partes[0] || 'Lugar',
      detalle: partes.slice(1, 4).join(', '),
      lat: Number(d.lat),
      lng: Number(d.lon),
    }
  })
}

// [lat, lng] → "Jr. Dos de Mayo 120, Barrio"
export async function direccionDe([lat, lng], signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${lat}&lon=${lng}`
  const d = await conTiempoLimite(url, signal)
  const a = d.address || {}
  const calle = [a.road, a.house_number].filter(Boolean).join(' ')
  const zona = a.suburb || a.neighbourhood || a.city_district || a.city || a.town || ''
  const texto = [calle, zona].filter(Boolean).join(', ')
  return texto || String(d.display_name || '').split(',').slice(0, 2).join(',').trim() || null
}

// Segundos que se pierden en cada maniobra (giros, rotondas, incorporaciones)
const PENALIZACION_S = { turn: 4, 'end of road': 4, fork: 2, merge: 2, 'on ramp': 2, 'off ramp': 2, roundabout: 7, rotary: 7, 'roundabout turn': 5, 'exit roundabout': 2 }

// Ruta por calles entre dos puntos. El tiempo se calcula tramo a tramo SIN pasar del tope urbano
// (como un auto en ciudad) y sumando lo que se pierde en cada giro; el tráfico lo aplica la cotización.
// Si el servicio no responde, estima en línea recta.
export async function rutaEntre(a, b, signal, { vmax = VELOCIDAD_MAX_KMH } = {}) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson&steps=true&annotations=distance,duration`
    const data = await conTiempoLimite(url, signal, 9000)
    const r = data.routes?.[0]
    if (!r) throw new Error('sin ruta')
    const ms = vmax / 3.6 // tope en m/s
    const ann = r.legs?.[0]?.annotation
    let seg = 0
    if (ann?.distance?.length && ann.distance.length === ann.duration?.length) {
      for (let k = 0; k < ann.distance.length; k++) seg += Math.max(ann.duration[k], ann.distance[k] / ms)
    } else {
      seg = Math.max(r.duration, r.distance / ms)
    }
    let giros = 0
    for (const st of r.legs?.[0]?.steps || []) {
      const m = st.maneuver || {}
      const p = PENALIZACION_S[m.type === 'turn' && m.modifier === 'straight' ? 'x' : m.type]
      if (p) { seg += p; giros++ }
    }
    return {
      km: r.distance / 1000,
      min: Math.max(1, Math.round(seg / 60)), // calle despejada, con tope de velocidad y giros
      puntos: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      aproximada: false,
      giros,
    }
  } catch (e) {
    if (e?.name === 'AbortError' && signal?.aborted) throw e
    const km = distanciaKm(a, b) * 1.3
    return { km, min: minutosPara(distanciaKm(a, b), { vmax }), puntos: [a, b], aproximada: true, giros: 0 }
  }
}
