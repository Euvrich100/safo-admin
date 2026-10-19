// Mapa base de todas las pantallas. Cambia solo entre claro y oscuro según el tema del dispositivo.
//
// PROVEEDOR (se elige con variables de entorno al compilar la web; ver GUIA_PRODUCCION):
//   1. NEXT_PUBLIC_MAPA_CLARO / NEXT_PUBLIC_MAPA_OSCURO → URL propia tipo https://.../{z}/{x}/{y}.png
//   2. NEXT_PUBLIC_MAPTILER_KEY → MapTiler (recomendado: plan gratuito con clave, pensado para producción)
//   3. Sin nada → OpenStreetMap. Funciona sin clave, pero su política prohíbe el uso intensivo:
//      sirve para pruebas y un piloto pequeño, no para el lanzamiento.
// (Antes se usaba CARTO, que ahora exige clave y dibuja "API KEY REQUIRED" sobre el mapa.)
const MAPTILER = process.env.NEXT_PUBLIC_MAPTILER_KEY
const mt = (estilo) => `https://api.maptiler.com/maps/${estilo}/256/{z}/{x}/{y}.png?key=${MAPTILER}`

const PROPIO_CLARO = process.env.NEXT_PUBLIC_MAPA_CLARO
const PROPIO_OSCURO = process.env.NEXT_PUBLIC_MAPA_OSCURO
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const CLARO = PROPIO_CLARO || (MAPTILER ? mt('streets-v2') : OSM)
const OSCURO = PROPIO_OSCURO || (MAPTILER ? mt('streets-v2-dark') : OSM)
// OpenStreetMap no tiene versión oscura: en modo oscuro se invierten sus colores con CSS (.mapa-oscuro-filtro)
const OSCURO_POR_FILTRO = !PROPIO_OSCURO && !MAPTILER

const ATRIBUCION = process.env.NEXT_PUBLIC_MAPA_ATRIBUCION || (MAPTILER
  ? '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>')

export function agregarMapaBase(L, mapa) {
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
  let capa = null
  const poner = () => {
    const oscuro = Boolean(mq?.matches)
    if (capa) mapa.removeLayer(capa)
    mapa.getContainer?.().classList.toggle('mapa-oscuro-filtro', oscuro && OSCURO_POR_FILTRO)
    capa = L.tileLayer(oscuro ? OSCURO : CLARO, {
      maxZoom: 19, subdomains: 'abcd', attribution: ATRIBUCION, detectRetina: false, crossOrigin: true,
    }).addTo(mapa)
    capa.bringToBack?.()
  }
  poner()
  mq?.addEventListener?.('change', poner)
  mapa.on('unload', () => mq?.removeEventListener?.('change', poner))
}
