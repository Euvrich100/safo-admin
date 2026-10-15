// Ciudad donde opera esta instalación de SafO. Para lanzar en otra ciudad solo se cambian
// estas variables en Render (web), sin tocar el código. Si faltan, se usa Huánuco.
const env = process.env
const num = (v, d) => (Number.isFinite(Number(v)) && v !== undefined && v !== '' ? Number(v) : d)

const lat = num(env.NEXT_PUBLIC_CIUDAD_LAT, -9.9306)
const lng = num(env.NEXT_PUBLIC_CIUDAD_LNG, -76.2422)
const radio = num(env.NEXT_PUBLIC_CIUDAD_RADIO_GRADOS, 0.15) // ≈ 16 km alrededor del centro

export const CIUDAD = {
  nombre: env.NEXT_PUBLIC_CIUDAD || 'Huánuco',
  pais: env.NEXT_PUBLIC_PAIS || 'Perú',
  codigoPais: (env.NEXT_PUBLIC_CODIGO_PAIS || 'pe').toLowerCase(),
  prefijoTelefono: env.NEXT_PUBLIC_PREFIJO_TELEFONO || '+51',
  lugar: env.NEXT_PUBLIC_CIUDAD_LUGAR || 'Plaza de Armas',     // referencia que se muestra en el mapa
  altitud: env.NEXT_PUBLIC_CIUDAD_ALTITUD || '1 894 m s. n. m.', // vacío = no se muestra
  centro: [lat, lng],
  // lon_min,lat_max,lon_max,lat_min (formato de Nominatim)
  viewbox: `${lng - radio},${lat + radio},${lng + radio},${lat - radio}`,
}
