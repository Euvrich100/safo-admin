// Datos compartidos de las credenciales del conductor (formulario, panel del conductor y ficha del admin).

export const ASEGURADORAS = ['Rímac', 'Pacífico', 'La Positiva', 'Mapfre', 'Interseguro', 'Protecta', 'Qualitas', 'AFOCAT', 'Otra']
export const PARENTESCOS = ['Madre', 'Padre', 'Esposo/a', 'Pareja', 'Hijo/a', 'Hermano/a', 'Otro familiar', 'Amigo/a']

// Consultas públicas para comprobar un SOAT/CAT con la placa (las mantiene APESEG y la SBS)
export const URL_APESEG = 'https://www.apeseg.org.pe/consultas-soat/'
export const URL_SBS_SOAT = 'https://servicios.sbs.gob.pe/reportesoat/'

// Fecha de hoy en Perú (AAAA-MM-DD) para los límites de los campos de fecha
export const hoyLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
export const sumarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}
export const diasEntre = (desde, hasta) => Math.round((new Date(`${hasta}T00:00:00Z`) - new Date(`${desde}T00:00:00Z`)) / 86400000)

// 'AAAA-MM-DD' → '15/10/2026' (sin pasar por zonas horarias)
export const fechaCorta = (f) => {
  if (!f) return '—'
  const [a, m, d] = String(f).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export const ESTILO_VIGENCIA = {
  vigente:    { texto: 'Vigente',    clase: 'text-[#1A7F4B] bg-[#E6F4EC]' },
  por_vencer: { texto: 'Por vencer', clase: 'text-[#B45309] bg-[#FEF3E2]' },
  vencido:    { texto: 'Vencido',    clase: 'text-[#D92D20] bg-[#FCEAE9]' },
  sin_dato:   { texto: 'Sin dato',   clase: 'text-[#6E6E73] bg-[#F5F5F7]' },
}

export const textoDias = (v) => {
  if (v.dias === null || v.dias === undefined) return ''
  if (v.dias < 0) return `venció hace ${-v.dias} día${v.dias === -1 ? '' : 's'}`
  if (v.dias === 0) return 'vence hoy'
  return `vence en ${v.dias} día${v.dias === 1 ? '' : 's'}`
}
