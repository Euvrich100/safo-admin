// Utilidades de mapas sin API key: búsqueda de direcciones (Nominatim),
// rutas (OSRM) y cálculos de distancia. Servicios públicos y gratuitos de
// OpenStreetMap: pensados para uso liviano.

const HUANUCO_VIEWBOX = '-76.40,-9.80,-76.10,-10.05' // lon_min,lat_max,lon_max,lat_min
const VELOCIDAD_URBANA_KMH = 25

const rad = (g) => (g * Math.PI) / 180

export const distanciaKm = (a, b) => {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Minutos aproximados para recorrer una distancia en línea recta por las calles de la ciudad
export const minutosPara = (km) => Math.max(1, Math.round(((km * 1.3) / VELOCIDAD_URBANA_KMH) * 60))

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
    + `&countrycodes=pe&viewbox=${HUANUCO_VIEWBOX}&bounded=1&q=${encodeURIComponent(q + ' Huánuco')}`
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

// [lat, lng] → "Jr. Dos de Mayo 120, Huánuco"
export async function direccionDe([lat, lng], signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${lat}&lon=${lng}`
  const d = await conTiempoLimite(url, signal)
  const a = d.address || {}
  const calle = [a.road, a.house_number].filter(Boolean).join(' ')
  const zona = a.suburb || a.neighbourhood || a.city_district || a.city || a.town || ''
  const texto = [calle, zona].filter(Boolean).join(', ')
  return texto || String(d.display_name || '').split(',').slice(0, 2).join(',').trim() || null
}

// Ruta por calles entre dos puntos. Si el servicio no responde, estima en línea recta.
export async function rutaEntre(a, b, signal) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`
    const data = await conTiempoLimite(url, signal, 8000)
    const r = data.routes?.[0]
    if (!r) throw new Error('sin ruta')
    return {
      km: r.distance / 1000,
      min: Math.max(1, Math.round(r.duration / 60)),
      puntos: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      aproximada: false,
    }
  } catch (e) {
    if (e?.name === 'AbortError' && signal?.aborted) throw e
    const km = distanciaKm(a, b) * 1.3
    return { km, min: minutosPara(distanciaKm(a, b)), puntos: [a, b], aproximada: true }
  }
}
