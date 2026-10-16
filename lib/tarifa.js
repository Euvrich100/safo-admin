// Cotización de respaldo en el navegador. La oficial la calcula el servidor (/api/viajes/cotizar);
// esto solo se usa si ese servicio no responde, para que el pasajero nunca se quede sin precio.
// Usa la misma fórmula: base + km × (precio por km + combustible por km) + minutos × precio por minuto.
import { TARIFA_MOTO_POR_DEFECTO } from '@/lib/vehiculos'

export const TARIFA_POR_DEFECTO = { base: 3, km: 0.8, minuto: 0.15, minima: 4, combustible_km: 0.485 }

export function cotizarLocal({ km, minLibres, ajustes, servicio = 'taxi' }) {
  const t = servicio === 'moto'
    ? { ...TARIFA_MOTO_POR_DEFECTO, ...(ajustes?.tarifa_moto || {}) }
    : { ...TARIFA_POR_DEFECTO, ...(ajustes?.tarifa || {}) }
  const vmax = ajustes?.velocidad_max_kmh || 40
  const trafico = ajustes?.trafico || { nivel: 'moderado', texto: 'Tráfico estimado', factor: 1.1 }
  const libre = Math.max(minLibres || 0, (km / vmax) * 60)
  const min = Math.max(1, libre * (trafico.factor || 1))
  const porKm = km * t.km, combustible = km * t.combustible_km, porTiempo = min * t.minuto
  const subtotal = t.base + porKm + combustible + porTiempo
  const tarifa = Math.max(t.minima, subtotal)
  const r2 = (n) => Math.round(n * 100) / 100
  return {
    local: true,
    servicio,
    distancia_km: r2(km),
    duracion_min: Math.max(1, Math.round(min)),
    duracion_rango: [Math.max(1, Math.round(min * 0.88)), Math.max(2, Math.round(min * 1.15))],
    tarifa: r2(tarifa),
    trafico: { nivel: trafico.nivel, texto: trafico.texto, factor: trafico.factor, condicion: trafico.condicion?.factor !== 1 ? trafico.condicion?.texto || null : null },
    desglose: { base: t.base, por_km: r2(porKm), combustible: r2(combustible), por_tiempo: r2(porTiempo), minima_aplicada: tarifa > subtotal },
    garantia: ajustes?.garantia,
  }
}
