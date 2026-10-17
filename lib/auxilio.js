// Auxilio mecánico: especialidades y tipos de vehículo (los mismos valores que valida el backend).
export const ESPECIALIDADES = [
  { v: 'general', t: 'Mecánica general' },
  { v: 'electricidad', t: 'Electricidad' },
  { v: 'llantas', t: 'Llantas y vulcanizado' },
  { v: 'grua', t: 'Grúa / remolque' },
  { v: 'motos', t: 'Motos' },
  { v: 'planchado', t: 'Planchado y pintura' },
  { v: 'combustible', t: 'Auxilio de combustible' },
  { v: 'cerrajeria', t: 'Cerrajería' },
]
export const VEHICULOS_AUXILIO = [
  { v: 'ambos', t: 'Taxi y moto' },
  { v: 'taxi', t: 'Taxi / carro / bajaj' },
  { v: 'moto', t: 'Moto' },
]
export const textoEspecialidad = (v) => ESPECIALIDADES.find(e => e.v === v)?.t || v
export const textoVehiculos = (v) => VEHICULOS_AUXILIO.find(e => e.v === v)?.t || v

// Números peruanos de 9 dígitos van con +51; los demás se usan tal cual
export const numeroWhatsapp = (n) => {
  const d = String(n || '').replace(/\D/g, '')
  return d.length === 9 ? `51${d}` : d
}
