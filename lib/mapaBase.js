// Mapa base de todas las pantallas. Colorido (CARTO Voyager) en modo claro y su versión oscura
// cuando el dispositivo está en modo oscuro; cambia solo al vuelo si el usuario cambia el tema.
//
// IMPORTANTE (comercial): los mapas públicos de CARTO son gratis para proyectos pequeños, pero su licencia
// pide un plan comercial al crecer. Para producción puedes poner tu propio proveedor con variables
// NEXT_PUBLIC_MAPA_CLARO / NEXT_PUBLIC_MAPA_OSCURO (URL tipo https://.../{z}/{x}/{y}.png, p. ej. Stadia, MapTiler o Thunderforest).
const CLARO = process.env.NEXT_PUBLIC_MAPA_CLARO || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const OSCURO = process.env.NEXT_PUBLIC_MAPA_OSCURO || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const ATRIBUCION = process.env.NEXT_PUBLIC_MAPA_ATRIBUCION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'

export function agregarMapaBase(L, mapa) {
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
  let capa = null
  const poner = () => {
    if (capa) mapa.removeLayer(capa)
    capa = L.tileLayer(mq?.matches ? OSCURO : CLARO, {
      maxZoom: 19, subdomains: 'abcd', attribution: ATRIBUCION, detectRetina: false,
    }).addTo(mapa)
    capa.bringToBack?.()
  }
  poner()
  mq?.addEventListener?.('change', poner)
  mapa.on('unload', () => mq?.removeEventListener?.('change', poner))
}
